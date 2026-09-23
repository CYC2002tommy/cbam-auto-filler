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

/*
 * These strings are thrown as Error messages and the renderer shows them to the user
 * verbatim, so they have to follow the app's language. What language the *model* answers
 * in is a separate decision, made in ASSISTANT_INSTRUCTIONS.
 */
const MESSAGES = {
    zh: {
        noKey: '尚未設定 Gemini API 金鑰。請在設定中貼上自己的金鑰，或在 .env.local 設定 GEMINI_API_KEY。',
        noKeyShort: '尚未設定 Gemini API 金鑰。',
        rateLimit: 'Gemini 免費額度已用完，請稍後再試，或在設定中改用自己的 API 金鑰。',
        emptyExtract: 'Gemini 沒有回傳可用的內容。',
        empty: 'Gemini 沒有回傳內容。',
        truncated: '（回答太長被截斷了。請它「接著說」，或把問題問得更具體一點。）',
        status: (code) => `Gemini 回應 ${code}`,
        statusDetail: (code, detail) => `Gemini 回應 ${code}：${detail}`,
    },
    en: {
        noKey: 'No Gemini API key set. Paste your own key in Settings, or set GEMINI_API_KEY in .env.local.',
        noKeyShort: 'No Gemini API key set.',
        rateLimit: 'The free Gemini quota is used up. Try again later, or switch to your own API key in Settings.',
        emptyExtract: 'Gemini returned nothing usable.',
        empty: 'Gemini returned no text.',
        truncated: '(The answer was cut off because it ran long. Ask it to continue, or narrow the question.)',
        status: (code) => `Gemini returned ${code}`,
        statusDetail: (code, detail) => `Gemini returned ${code}: ${detail}`,
    },
};
const say = (lang) => (lang === 'en' ? MESSAGES.en : MESSAGES.zh);

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
const extract = async ({ dataBase64, mimeType, fields, lang = 'zh', key: override }) => {
    const m = say(lang);
    const key = override || readKey();
    if (!key) {
        const error = new Error(m.noKey);
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
        const error = new Error(m.rateLimit);
        error.code = 'RATE_LIMIT';
        throw error;
    }
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(m.statusDetail(response.status, detail.slice(0, 200)));
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(m.emptyExtract);
    const parsed = JSON.parse(text);
    return {
        documentType: parsed.documentType ?? '',
        period: parsed.period ?? '',
        values: Array.isArray(parsed.values) ? parsed.values : [],
        model: payload.modelVersion ?? MODEL,
        usage: payload.usageMetadata ?? null,
    };
};


const ASSISTANT_INSTRUCTIONS = (lang = 'zh') => `你是 CBAM 申報助手，協助台灣中小企業（多為螺絲、扣件、鋼鐵製品廠）填寫歐盟 CBAM 排放資料通報範本。

回答規則：
- ${lang === 'en'
    ? 'Answer in English. These instructions and the known rules below are written in Chinese, but your reply must be in English. If the user explicitly asks for another language during the conversation, switch to it instead of contradicting them.'
    : '用繁體中文回答。若使用者在對話中明確要求換成別的語言，就改用他要求的語言，不要跟他對抗。'}
- **極度簡潔，這條最重要。** 預設 120 字以內（英文約 80 words）。先給答案，再補一句理由。超過就是答錯了。
- 沒有開場白、沒有結尾客套、不要複述問題、不要說「好的」「當然」「希望對你有幫助」。
- 只回答被問的那一件事。想到的相鄰主題一律不要主動補充，等使用者問。
- 需要照順序做才用編號，一個編號一個動作，最多 5 點。不需要步驟就用散文，不要硬拆成清單。
- 使用者問「這格要填什麼」時：欄位意義一句、數字去哪拿一句（哪張單據、哪個部門）、扣件廠例子一句。就這三句。
- 最後用一行給一個具體的下一步動作，動詞開頭。
- 只講你有把握的規則。不確定就說不確定，並建議打 0800-583-885（申報諮詢專線）或查歐盟官方指引，不要編造條文編號或數字。
- 格式只能用：**粗體**、「- 」項目符號、「1. 」編號。不要用 # 標題、表格、引用區或程式碼區塊。
- 絕對不要用 LaTeX 或 $ 數學符號。公式直接寫成「排放量 = 活動數據 × 淨熱值 × 排放係數」，單位直接寫 GJ/t、t CO2/TJ、Nm3。

已知規則（可直接引用）：
- 鋼鐵、鋁、氫屬於 CBAM 法規附件 II，正式期只計直接排放，用電的間接排放不計入（歐盟指引 5D）。水泥、肥料則要計入。
- 螺絲、扣件的內含排放大多來自買進的鋼材（前驅物），要向鋼廠索取經查證的數據；拿不到就用歐盟預設值。
- 預設值有加成：2026 年 +10%、2027 年 +20%、2028 年起 +30%，肥料一律 +1%（IR 2026/1740）。
- 歐盟給台灣螺絲、螺帽（CN 7318 15、7318 16）的預設值是 2.707 tCO2e/t，2026 年加成後 2.978（IR 2025/2621 附件 I，經 IR 2026/1740 更正，2026-08-06 版）。其他產品請使用者到「情境試算 → 情境三」選 CN 碼，App 會自動帶入歐盟公告的台灣預設值。
- 50 噸豁免看的是「進口商」全年從所有來源的進口總量，不是單一出口商的出口量。
- 2026 年的進口要在 2027 年 9 月 30 日前申報；用實際值需經認可查證機構查證，第一年要到廠實地查訪。
- 活動數據 × 淨熱值 × 排放係數 = 該排放源流的排放量；IPCC 2006 天然氣預設值為淨熱值 48 GJ/t、排放係數 56.1 tCO2/TJ。`;

/** Free-text question about filling the declaration. Returns plain text. */
const ask = async ({ question, history = [], context = '', lang = 'zh', key: override }) => {
    const m = say(lang);
    const key = override || readKey();
    if (!key) {
        const error = new Error(m.noKeyShort);
        error.code = 'NO_KEY';
        throw error;
    }
    const contents = [
        ...history.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: context
            ? `${lang === 'en' ? `(The user is on the "${context}" page.)` : `（使用者目前在「${context}」這一頁）`}\n${question}`
            : question }] },
    ];
    const post = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: ASSISTANT_INSTRUCTIONS(lang) }] },
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 1600 },
        }),
    });
    let response = await post();
    for (let attempt = 1; attempt <= 3 && response.status === 503; attempt++) {
        await new Promise(resolve => setTimeout(resolve, attempt * 4000));
        response = await post();
    }
    if (response.status === 429) {
        const error = new Error(m.rateLimit);
        error.code = 'RATE_LIMIT';
        throw error;
    }
    if (!response.ok) throw new Error(m.status(response.status));
    const payload = await response.json();
    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('') ?? '';
    if (!text) throw new Error(m.empty);
    // Hitting the token cap used to end the answer mid-sentence with nothing to show for it.
    const cut = candidate?.finishReason === 'MAX_TOKENS';
    return { text: cut ? `${text}\n\n${m.truncated}` : text, model: payload.modelVersion ?? MODEL };
};

module.exports = { extract, ask, hasKey: () => Boolean(readKey()) };
