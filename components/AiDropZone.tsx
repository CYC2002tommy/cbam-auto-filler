import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import Sheet from '../ui/Sheet';
import AiReviewSheet from './AiReviewSheet';
import { usePrefs, useT } from '../ui/prefs';
import { useToast } from '../ui/toast';
import type { FormData, KeyValue } from '../types';
import { AI_FIELDS } from '../ai/fields';
import { toProposals, applyProposals, type Proposal, type RawValue } from '../ai/apply';
import { AiContext } from '../ai/context';

const CONSENT_KEY = 'cbam.aiConsent';
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf'];

const readConsent = () => { try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch { return false; } };
const writeConsent = () => { try { localStorage.setItem(CONSENT_KEY, '1'); } catch { /* ignore */ } };

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

interface Props {
    form: FormData;
    setForm: (next: FormData) => void;
    e83Rows: KeyValue[];
    children?: React.ReactNode;
}

/**
 * Drop a bill, invoice or data sheet anywhere in the window and the AI proposes values.
 * Nothing is written until the user ticks it in the review sheet.
 */
const AiDropZone: React.FC<Props> = ({ form, setForm, e83Rows, children }) => {
    const t = useT();
    const { lang } = usePrefs();
    const toast = useToast();
    const [dragging, setDragging] = useState(false);
    const [consentOpen, setConsentOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const [docTypes, setDocTypes] = useState<string[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const pending = useRef<File[]>([]);
    const depth = useRef(0);

    const processes = e83Rows
        .map((row, i) => ({ id: `P${i + 1}`, name: (row.l as string) || '' }))
        .filter((_, i) => {
            const category = e83Rows[i]?.e as string;
            return category && category !== 'n.a.';
        });
    const products = (form.summary_products.length ? form.summary_products : [{}])
        .map((p, index) => ({ index, name: (p.name as string) || t(`產品 ${index + 1}`, `product ${index + 1}`) }));

    const run = useCallback(async (list: File[]) => {
        const usable = list.filter(f => ACCEPTED.includes(f.type) || /\.(png|jpe?g|webp|heic|pdf)$/i.test(f.name));
        if (!usable.length) {
            toast.show({ message: t('請放入照片或 PDF。', 'Drop an image or a PDF.'), tone: 'error' });
            return;
        }
        if (!window.cbam?.ai) {
            toast.show({ message: t('AI 讀取只在桌面版可用。', 'AI reading is only available in the desktop app.'), tone: 'error' });
            return;
        }
        setFiles(usable.map(f => f.name));
        setDocTypes([]);
        setProposals([]);
        setBusy(true);
        setReviewOpen(true);

        const collected: RawValue[] = [];
        const types: string[] = [];
        try {
            // One document at a time: the free tier is rate limited.
            for (const file of usable) {
                const dataBase64 = await toBase64(file);
                const result = await window.cbam.ai.extract({
                    dataBase64,
                    mimeType: file.type || 'application/pdf',
                    fields: AI_FIELDS.map(f => ({ id: f.id, label: f.label, unit: f.unit, hint: f.hint })),
                    lang,
                });
                if (result.documentType) types.push(result.documentType);
                for (const v of result.values ?? []) collected.push({ ...v, source: file.name });
            }
            setDocTypes(types);
            setProposals(toProposals(collected));
        } catch (error: any) {
            setReviewOpen(false);
            toast.show({ message: error?.message ?? String(error), tone: 'error', duration: 9000 });
        } finally {
            setBusy(false);
        }
    }, [t, toast]);

    const start = useCallback((list: File[]) => {
        if (!readConsent()) { pending.current = list; setConsentOpen(true); return; }
        run(list);
    }, [run]);

    useEffect(() => {
        const onDragEnter = (e: DragEvent) => {
            if (!e.dataTransfer?.types.includes('Files')) return;
            depth.current++;
            setDragging(true);
        };
        const onDragOver = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); };
        const onDragLeave = () => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); };
        const onDrop = (e: DragEvent) => {
            if (!e.dataTransfer?.files.length) return;
            e.preventDefault();
            depth.current = 0;
            setDragging(false);
            start(Array.from(e.dataTransfer.files));
        };
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
        };
    }, [start]);

    const pick = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,application/pdf';
        input.onchange = () => { if (input.files?.length) start(Array.from(input.files)); };
        input.click();
    }, [start]);

    const ask = useCallback(async (question: string, history: { role: 'user' | 'ai'; text: string }[], context: string) => {
        if (!window.cbam?.ai?.ask) throw new Error(t('文字對話只在桌面版可用。', 'The assistant is only available in the desktop app.'));
        const result = await window.cbam.ai.ask({ question, history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', text: h.text })), context, lang });
        return result.text;
    }, [t, lang]);

    const apply = () => {
        const next = applyProposals(form, proposals);
        setForm(next);
        setReviewOpen(false);
        toast.show({ message: t(`已填入 ${proposals.filter(p => p.accepted).length} 個欄位`, `Filled ${proposals.filter(p => p.accepted).length} fields`), tone: 'success' });
    };

    return (
        <AiContext.Provider value={{ available: Boolean(window.cbam?.ai), run: start, pick, ask }}>
            {dragging && (
                <div className="pointer-events-none fixed inset-3 z-[70] flex flex-col items-center justify-center rounded-[var(--radius-sheet)] border-2 border-dashed border-indigo-500 bg-indigo-500/10 backdrop-blur-sm">
                    <Upload size={36} className="mb-3 text-indigo-500" />
                    <p className="text-lg font-semibold text-slate-900">{t('放開就交給 AI 讀', 'Drop to let the AI read it')}</p>
                    <p className="mt-1 text-sm text-slate-600">{t('帳單、發票、供應商資料表都可以（照片或 PDF）', 'Bills, invoices, supplier data sheets — images or PDF')}</p>
                </div>
            )}

            <Sheet open={consentOpen} onClose={() => setConsentOpen(false)} title={t('關於 AI 讀取文件', 'About AI document reading')}>
                <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                    <p>{t('你上傳的影像會送到 Google 的 Gemini 服務辨識，用的是本計畫的免費金鑰。', 'The images you upload are sent to Google’s Gemini service, using this project’s free-tier key.')}</p>
                    <p className="rounded-xl bg-amber-500/10 p-3">
                        {t('免費方案的條款允許 Google 使用送出的內容改進其產品，也可能由人工審閱。請不要上傳含個人身分證號或無關機密的文件。',
                            'Google’s free-tier terms allow it to use submitted content to improve its products, and humans may review it. Do not upload documents with personal ID numbers or unrelated confidential material.')}
                    </p>
                    <p>{t('只有影像會送出，你的申報資料不會離開這台電腦。AI 讀到的內容要你逐項確認才會填進表單。',
                        'Only the image is sent; your declaration data never leaves this computer. Nothing is written into the form until you tick it.')}</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setConsentOpen(false)} className="pressable rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/5">
                            {t('不要用', 'No thanks')}
                        </button>
                        <button type="button" onClick={() => { writeConsent(); setConsentOpen(false); run(pending.current); }}
                            className="pressable inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
                            <Sparkles size={15} /> {t('我了解，開始讀取', 'I understand, read it')}
                        </button>
                    </div>
                </div>
            </Sheet>

            <AiReviewSheet
                open={reviewOpen}
                busy={busy}
                files={files}
                proposals={proposals}
                documentTypes={docTypes}
                processes={processes.length ? processes : [{ id: 'P1', name: '' }]}
                products={products}
                onChange={setProposals}
                onApply={apply}
                onClose={() => setReviewOpen(false)}
            />
            {children}
        </AiContext.Provider>
    );
};

export default AiDropZone;
