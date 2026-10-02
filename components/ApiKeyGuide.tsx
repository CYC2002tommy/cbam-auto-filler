import React from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { usePrefs } from '../ui/prefs';

/*
 * How to get a Gemini API key, for someone who has never opened Google AI Studio.
 * Checked 2026-10-03 against Google's own pages: "Using Gemini API keys"
 * (ai.google.dev/gemini-api/docs/api-key) and the Gemini API Additional Terms
 * (ai.google.dev/gemini-api/terms). Signing in with a Gemini or Claude *subscription*
 * is not offered: both Google and Anthropic forbid third-party apps from using
 * subscription logins, so a key is the only supported way.
 */
const STUDIO = 'https://aistudio.google.com/apikey';

const TEXT = {
    zh: {
        title: '取得 Gemini API 金鑰（約 3 分鐘）',
        intro: 'AI 讀單據和問 AI 需要一把 Gemini API 金鑰。金鑰是免費申請的，用你自己的 Google 帳號就可以。',
        steps: [
            '按下方按鈕打開 Google AI Studio，用 Google 帳號登入。建議用公司的帳號，不要用私人帳號。',
            '第一次使用會請你同意服務條款。同意後 Google 會自動建立一個專案和一把金鑰；如果沒有看到金鑰，按「Create API key」。',
            '按金鑰旁邊的複製按鈕，複製整串金鑰。',
            '回到這個程式：左下角「設定」→「自己的 Gemini 金鑰」→ 貼上 → 按「套用」。看到「金鑰已套用」就完成了。',
            '金鑰跟密碼一樣，不要寄給別人、不要貼到群組。外流了就到 AI Studio 刪掉，再建一把新的。',
        ],
        open: '打開 Google AI Studio',
        freeTitle: '免費金鑰',
        free: '不用綁信用卡，但每分鐘、每天都有次數上限，超過就要等一下再用。Google 的條款允許它用送出的內容改進產品，也可能由人工審閱。',
        paidTitle: '付費金鑰',
        paid: '在 Google Cloud 為這個專案開通計費（Cloud Billing）後，Google 不會用送出的內容改進產品，只為防止濫用保留一段時間。開通後依用量計費，價格以 Google 公告為準。',
        sentTitle: '這個程式會送出什麼',
        sent: '只有你按下 AI 功能時才會送出：讀單據時送出你拖進來的那份檔案；問 AI 時只送出你的問題和那一格的說明，不送你填的數字。其他資料都只存在這台電腦。',
        source: '依據：Google AI for Developers〈Using Gemini API keys〉與〈Gemini API Additional Terms of Service〉，2026-10-03 查核。',
    },
    en: {
        title: 'Get a Gemini API key (about 3 minutes)',
        intro: 'Reading documents and Ask AI need a Gemini API key. Keys are free, and your own Google account is enough.',
        steps: [
            'Open Google AI Studio with the button below and sign in with a Google account. A company account is better than a personal one.',
            'The first time, you are asked to accept the terms. Google then creates a project and a key for you; if you see no key, press "Create API key".',
            'Press the copy button next to the key to copy all of it.',
            'Back in this app: Settings (bottom left) → "Your own Gemini key" → paste → Apply. "Key applied" means you are done.',
            'Treat the key like a password: do not email it or post it in a group chat. If it leaks, delete it in AI Studio and create a new one.',
        ],
        open: 'Open Google AI Studio',
        freeTitle: 'Free key',
        free: 'No credit card needed, but there are per-minute and per-day limits; past them you have to wait. Google\'s terms let it use what you send to improve its products, and people may review it.',
        paidTitle: 'Paid key',
        paid: 'Once Cloud Billing is enabled for the key\'s project in Google Cloud, Google does not use what you send to improve its products; it keeps it for a limited time only to prevent abuse. Usage is then billed at Google\'s published prices.',
        sentTitle: 'What this app sends',
        sent: 'Only when you use an AI feature: reading a document sends that file; Ask AI sends your question and the field\'s guidance, never the values you entered. Everything else stays on this computer.',
        source: 'Sources: Google AI for Developers, "Using Gemini API keys" and "Gemini API Additional Terms of Service", checked 2026-10-03.',
    },
};

const ApiKeyGuide: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { lang } = usePrefs();
    const c = TEXT[lang];
    return (
        <Sheet open={open} onClose={onClose} title={<span className="inline-flex items-center gap-2"><KeyRound size={18} className="text-indigo-500" />{c.title}</span>}>
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>{c.intro}</p>
                <ol className="space-y-2">
                    {c.steps.map((step, i) => (
                        <li key={i} className="flex gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[0.6875rem] font-semibold text-white">{i + 1}</span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
                <a href={STUDIO} target="_blank" rel="noopener noreferrer"
                    className="pressable inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
                    {c.open} <ExternalLink size={14} />
                </a>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-amber-500/10 p-3">
                        <div className="font-semibold text-slate-800">{c.freeTitle}</div>
                        <p className="mt-1 text-[0.8125rem]">{c.free}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3">
                        <div className="font-semibold text-slate-800">{c.paidTitle}</div>
                        <p className="mt-1 text-[0.8125rem]">{c.paid}</p>
                    </div>
                </div>
                <div>
                    <div className="font-semibold text-slate-800">{c.sentTitle}</div>
                    <p className="mt-1 text-[0.8125rem]">{c.sent}</p>
                </div>
                <p className="text-xs text-slate-500">{c.source}</p>
            </div>
        </Sheet>
    );
};

export default ApiKeyGuide;
