import React, { useEffect, useState } from 'react';
import { Sparkles, Send, AlertTriangle } from 'lucide-react';
import type { GuideEntry } from '../guide/content';
import { useGuideScope } from '../guide/scope';
import { usePrefs, useT } from '../ui/prefs';
import { useAi } from '../ai/context';
import { Rich } from '../ui/Rich';

/** A non-blocking hint under a field: it never stops the user from typing or exporting. */
export const FieldWarning: React.FC<{ text: string }> = ({ text }) => (
    <p role="status" className="mt-1 flex items-start gap-1 text-xs leading-snug text-amber-700">
        <AlertTriangle size={13} className="mt-px shrink-0" />
        <span>{text}</span>
    </p>
);

/**
 * Ask the AI about one field. Only the field's name, its guidance text and the question
 * leave the computer; the value the user typed and the rest of the form do not.
 */
const AskAi: React.FC<{ label: string; code?: string; entry: GuideEntry }> = ({ label, code, entry }) => {
    const t = useT();
    const { lang } = usePrefs();
    const ai = useAi();
    const scope = useGuideScope();
    const [ready, setReady] = useState<boolean | null>(null);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        if (!window.cbam?.ai?.status) { setReady(false); return; }
        window.cbam.ai.status().then(s => { if (alive) setReady(Boolean(s?.available)); }).catch(() => alive && setReady(false));
        return () => { alive = false; };
    }, []);

    if (ready === false) {
        return (
            <p className="mt-3 text-xs text-slate-500">
                {window.cbam?.ai
                    ? t('想問 AI：先到左下角「設定」貼上自己的 Gemini 金鑰。', 'To ask the AI, paste your own Gemini key under Settings (bottom left) first.')
                    : t('問 AI 只在桌面版可用。', 'Asking the AI is only available in the desktop app.')}
            </p>
        );
    }

    const g = entry[lang];
    const where = `${scope.sheet ? `${scope.sheet} ` : ''}${code ?? ''}`.trim();
    const about = lang === 'zh'
        ? `我在問「${label}」這一格${where ? `（官方範本 ${where}）` : ''}。App 已經給我的說明：${[g.short, g.what, g.where, g.unit, g.example, g.mistakes].filter(Boolean).join(' ')}（依據：${entry.source}）`
        : `I am asking about the field "${label}"${where ? ` (official template ${where})` : ''}. The app's guidance so far: ${[g.short, g.what, g.where, g.unit, g.example, g.mistakes].filter(Boolean).join(' ')} (Source: ${entry.source})`;

    const send = async () => {
        const q = question.trim() || t('請用簡單的話說明這一格要填什麼、數字去哪裡找。', 'In plain words, what goes in this field and where do I find the number?');
        setBusy(true);
        setError('');
        try {
            setAnswer(await ai.ask(`${about}\n\n${q}`, [], scope.page ?? ''));
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mt-3">
            <form className="flex gap-1.5" onSubmit={e => { e.preventDefault(); if (!busy) send(); }}>
                <input
                    type="search"
                    className="field min-w-0 flex-1 px-2.5 py-1.5 text-xs"
                    placeholder={t('問 AI 這一格的問題（留白直接送出＝請 AI 解釋）', 'Ask the AI about this field (send empty to get an explanation)')}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    disabled={ready === null}
                    lang={lang === 'zh' ? 'zh-Hant' : 'en'}
                />
                <button type="submit" disabled={busy || ready === null}
                    className="pressable inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50">
                    {busy ? <Sparkles size={13} className="animate-pulse" /> : <Send size={13} />}
                    {t('問 AI', 'Ask AI')}
                </button>
            </form>
            <p className="mt-1 text-[0.6875rem] text-slate-500">
                {t('只會送出這一格的名稱、說明和你的問題，不會送出你填的數字。', 'Only this field’s name, its guidance and your question are sent, never the values you entered.')}
            </p>
            {busy && <p className="mt-2 text-xs text-slate-500">{t('AI 思考中…（Gemini 忙的時候可能要等一分鐘）', 'Thinking… (this can take a minute when Gemini is busy)')}</p>}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            {answer && !busy && (
                <div className="mt-2 rounded-lg bg-white/80 p-3 text-[0.8125rem] leading-relaxed text-slate-800" aria-live="polite">
                    <Rich text={answer} />
                    <p className="mt-2 text-[0.6875rem] text-slate-500">{t('AI 的回答可能有錯，數字請以帳單、供應商資料或官方文件為準。', 'AI answers can be wrong; take numbers from your bills, supplier data or official documents.')}</p>
                </div>
            )}
        </div>
    );
};

/** The panel "?" opens under a field: what it is, where the number comes from, an example, common mistakes, and the AI. */
export const FieldHelpPanel: React.FC<{ id: string; label: string; code?: string; entry: GuideEntry }> = ({ id, label, code, entry }) => {
    const { lang } = usePrefs();
    const t = useT();
    const g = entry[lang];
    const rows: [string, string | undefined][] = [
        [t('這是什麼', 'What it is'), g.what],
        [t('數字去哪裡找', 'Where to find it'), g.where],
        [t('單位', 'Unit'), g.unit],
        [t('扣件廠範例', 'Fastener example'), g.example],
        [t('常見錯誤', 'Common mistakes'), g.mistakes],
    ];
    return (
        <div id={`${id}-guide`} className="mt-2 rounded-[var(--radius-control)] bg-indigo-500/[0.06] p-3 text-[0.8125rem] leading-relaxed text-slate-700">
            <p className="font-medium text-slate-800">{g.short}</p>
            <dl className="mt-1.5 space-y-1.5">
                {rows.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                        <dt className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                        <dd>{v}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-2 text-[0.6875rem] text-slate-500">{t('依據', 'Source')}：{entry.source}</p>
            <AskAi label={label} code={code} entry={entry} />
        </div>
    );
};
