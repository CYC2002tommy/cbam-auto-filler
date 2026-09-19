const fs = require('node:fs');
const path = require('node:path');

/**
 * Gemini lives in the main process so the API key never reaches the renderer.
 * The key comes from electron/key.cjs (written by CI from a secret, gitignored) or from
 * GEMINI_API_KEY in the environment during development.
 */
/*
 * The alias is used in every build. Pinning the id it resolves to was the plan, but on
 * 2026-09-20 the alias answered while the pinned id returned 503: they are served from
 * different capacity. The model that actually answered is returned with every result, so
 * a run can still be traced to a version.
 */
const MODEL = 'gemini-flash-latest';

const readKey = () => {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    try {
        return require('./key.cjs').geminiKey;
    } catch {
        try {
            const envFile = path.join(__dirname, '..', '.env.local');
            const match = /^GEMINI_API_KEY\s*=\s*(.+)$/m.exec(fs.readFileSync(envFile, 'utf8'));
            return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
        } catch {
            return null;
        }
    }
};

const INSTRUCTIONS = `You read a scanned business document for a CBAM emissions declaration and return the values it contains.

Rules:
- Only report a field when the document actually shows it. Never guess or calculate a value that is not printed.
- evidence must quote the exact text from the document that the value comes from, in its original language.
- Convert units to the unit named in the field list. Taiwanese electricity bills use 度 (= kWh; 1 MWh = 1000 度).
- Taiwanese documents may use ROC years (民國): add 1911 to get the Gregorian year. Dates are returned as YYYY-MM-DD.
- Strip thousand separators. Use a dot for the decimal point.
- confidence is 0..1: how sure you are that this value belongs to this field.
- If the document is not relevant to any field, return an empty list.`;

const responseSchema = (fields) => ({
    type: 'object',
    properties: {
        documentType: { type: 'string', description: 'What the document is, in Traditional Chinese' },
        period: { type: 'string', description: 'The period the document covers, if shown' },
        values: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    fieldId: { type: 'string', enum: fields.map(f => f.id) },
                    value: { type: 'string' },
                    unit: { type: 'string' },
                    evidence: { type: 'string' },
                    confidence: { type: 'number' },
                },
                required: ['fieldId', 'value', 'evidence', 'confidence'],
            },
        },
    },
    required: ['values'],
});

const fieldList = (fields) => fields
    .map(f => `- ${f.id}: ${f.label}${f.unit ? ` (unit: ${f.unit})` : ''}${f.hint ? ` — ${f.hint}` : ''}`)
    .join('\n');

/** One document in, a list of proposed values out. Throws with a readable message. */
const extract = async ({ dataBase64, mimeType, fields }) => {
    const key = readKey();
    if (!key) {
        const error = new Error('尚未設定 Gemini API 金鑰。請在設定中貼上自己的金鑰，或在 .env.local 設定 GEMINI_API_KEY。');
        error.code = 'NO_KEY';
        throw error;
    }
    const post = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
            contents: [{
                parts: [
                    { text: `Fields you may fill:\n${fieldList(fields)}` },
                    { inlineData: { mimeType, data: dataBase64 } },
                ],
            }],
            generationConfig: {
                temperature: 0,
                responseMimeType: 'application/json',
                responseSchema: responseSchema(fields),
            },
        }),
    });

    // 503 means the model is busy, which passes; anything else is answered on the first try.
    let response = await post();
    for (let attempt = 1; attempt <= 3 && response.status === 503; attempt++) {
        await new Promise(resolve => setTimeout(resolve, attempt * 4000));
        response = await post();
    }

    if (response.status === 429) {
        const error = new Error('Gemini 免費額度已用完，請稍後再試，或在設定中改用自己的 API 金鑰。');
        error.code = 'RATE_LIMIT';
        throw error;
    }
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini 回應 ${response.status}：${detail.slice(0, 200)}`);
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini 沒有回傳可用的內容。');
    const parsed = JSON.parse(text);
    return {
        documentType: parsed.documentType ?? '',
        period: parsed.period ?? '',
        values: Array.isArray(parsed.values) ? parsed.values : [],
        model: payload.modelVersion ?? MODEL,
        usage: payload.usageMetadata ?? null,
    };
};

module.exports = { extract, hasKey: () => Boolean(readKey()) };
