import React, { useRef, useState } from 'react';
import { Upload, MessageSquare, Send, Sparkles, Info } from 'lucide-react';
import { Group, Heading } from './Layout';
import { useT } from '../ui/prefs';
import { useAi } from '../ai/context';

const SUGGESTIONS = [
    { zh: '我做螺絲，出口到歐盟要準備哪些資料？', en: 'I make screws for the EU. What data do I need?' },
    { zh: '「排放源流」這一頁要填什麼？', en: 'What goes into the source streams page?' },
    { zh: '前驅物的排放數據要跟誰要？', en: 'Who do I ask for precursor emissions data?' },
    { zh: '沒有實際數據，用預設值會差多少？', en: 'How much more do default values cost?' },
    { zh: '用電量要填嗎？', en: 'Do I need to report electricity?' },
];

/**
 * The assistant is told to answer in a small Markdown subset: **bold**, "- " bullets and
 * "1. " steps, with no LaTeX (see ASSISTANT_INSTRUCTIONS in electron/gemini.cjs). Rendering
 * it to React elements rather than HTML keeps model output away from innerHTML. A heading
 * or symbol that slips through still reads as an ordinary line.
 */
const inline = (text: string): React.ReactNode[] =>
    text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rounded bg-slate-900/10 px-1 py-0.5 text-[0.8125rem]">{part.slice(1, -1)}</code>;
        return part;
    });

const Rich: React.FC<{ text: string }> = ({ text }) => (
    <>
        {text.split('\n').map((line, i) => {
            const heading = /^#{1,6}\s+(.*)$/.exec(line);
            if (heading) return <div key={i} className="mt-2 font-semibold first:mt-0">{inline(heading[1])}</div>;
            const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
            if (bullet) return <div key={i} className="flex gap-1.5"><span className="shrink-0">•</span><span>{inline(bullet[1])}</span></div>;
            const step = /^\s*(\d+)\.\s+(.*)$/.exec(line);
            if (step) return <div key={i} className="flex gap-1.5"><span className="shrink-0">{step[1]}.</span><span>{inline(step[2])}</span></div>;
            if (!line.trim()) return <div key={i} className="h-2" />;
            return <div key={i}>{inline(line)}</div>;
        })}
    </>
);

interface Message { role: 'user' | 'ai'; text: string }

const AiPage: React.FC<{ currentPage: string }> = ({ currentPage }) => {
    const t = useT();
    const ai = useAi();
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const send = async (text: string) => {
        const question = text.trim();
        if (!question || busy) return;
        setDraft('');
        const history = messages;
        setMessages([...history, { role: 'user', text: question }]);
        setBusy(true);
        try {
            const answer = await ai.ask(question, history, currentPage);
            setMessages(m => [...m, { role: 'ai', text: answer }]);
        } catch (error: any) {
            setMessages(m => [...m, { role: 'ai', text: `⚠️ ${error?.message ?? String(error)}` }]);
        } finally {
            setBusy(false);
            requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[1.75rem] font-bold text-slate-900">{t('AI 助手', 'AI assistant')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    {t('兩種用法：把單據交給它讀，或直接問它這一格要填什麼。', 'Two ways to use it: let it read your documents, or just ask what a field means.')}
                </p>
            </div>

            {!ai.available && (
                <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-amber-500/10 p-4 text-sm text-slate-700">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    {t('AI 功能只在桌面版可用（瀏覽器版沒有存放金鑰的地方）。', 'The AI features need the desktop app; the browser build has nowhere safe to keep the key.')}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button type="button" onClick={ai.pick} disabled={!ai.available}
                    className="card pressable flex flex-col items-start gap-2 p-6 text-left hover:bg-slate-50 disabled:opacity-50">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Upload size={22} /></span>
                    <span className="text-[1.0625rem] font-semibold text-slate-900">{t('上傳文件，AI 幫你填', 'Upload a document')}</span>
                    <span className="text-sm text-slate-500">
                        {t('電費單、燃料發票、鋼廠資料表、營業登記都可以。照片或 PDF 皆可，也可以直接拖進視窗。',
                            'Electricity bills, fuel invoices, mill data sheets, registrations. Images or PDF; dragging them into the window works too.')}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">{t('讀完會逐欄列出來，勾選後才寫進表單。', 'Everything is listed for you to tick before it is written.')}</span>
                </button>

                <div className="card flex flex-col items-start gap-2 p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><MessageSquare size={22} /></span>
                    <span className="text-[1.0625rem] font-semibold text-slate-900">{t('不會填就問它', 'Ask when you are stuck')}</span>
                    <span className="text-sm text-slate-500">
                        {t('用白話問「這格要填什麼」「數字去哪裡拿」，它會用扣件廠的例子回答。', 'Ask in plain words what a field means or where the number comes from; answers use a fastener plant as the example.')}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">{t('它只回答規則與做法，不會看到你填的資料。', 'It answers about the rules; it does not see what you have filled in.')}</span>
                </div>
            </div>

            <Group>
                <Heading label={t('問問題', 'Ask a question')} />
                <div ref={listRef} className="max-h-[22rem] space-y-3 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map(s => (
                                <button key={s.en} type="button" onClick={() => send(t(s.zh, s.en))} disabled={!ai.available}
                                    className="pressable rounded-full bg-slate-900/5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-900/10 disabled:opacity-50">
                                    {t(s.zh, s.en)}
                                </button>
                            ))}
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                m.role === 'user' ? 'whitespace-pre-wrap bg-indigo-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                {m.role === 'user' ? m.text : <Rich text={m.text} />}
                            </div>
                        </div>
                    ))}
                    {busy && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Sparkles size={15} className="animate-pulse text-indigo-500" /> {t('思考中…', 'Thinking…')}
                        </div>
                    )}
                </div>

                <form className="mt-4 flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(draft); }}>
                    <textarea
                        className="field min-h-[2.75rem] flex-1 resize-none px-3 py-2 text-[0.9375rem]"
                        rows={1}
                        placeholder={t('例如：活動數據要填什麼單位？', 'e.g. what unit does activity data use?')}
                        value={draft}
                        disabled={!ai.available}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }}
                    />
                    <button type="submit" disabled={!ai.available || busy || !draft.trim()}
                        className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40">
                        <Send size={18} />
                    </button>
                </form>
                <p className="mt-2 text-xs text-slate-400">
                    {t('AI 的回答僅供參考，正式申報請以歐盟官方指引為準；不確定時可打 0800-583-885。',
                        'Answers are guidance only; the EU guidance decides. When in doubt call 0800-583-885.')}
                </p>
            </Group>
        </div>
    );
};

export default AiPage;
