import React, { useState } from 'react';
import { Sparkles, FileText, AlertTriangle } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { useT, usePrefs } from '../ui/prefs';
import type { Proposal } from '../ai/apply';

interface Props {
    open: boolean;
    busy: boolean;
    files: string[];
    proposals: Proposal[];
    documentTypes: string[];
    processes: { id: string; name: string }[];
    products: { index: number; name: string }[];
    onChange: (proposals: Proposal[]) => void;
    onApply: () => void;
    onClose: () => void;
}

/** Nothing reaches the form until the user ticks it here. */
const AiReviewSheet: React.FC<Props> = ({ open, busy, files, proposals, documentTypes, processes, products, onChange, onApply, onClose }) => {
    const t = useT();
    const { lang } = usePrefs();
    const [showEvidence, setShowEvidence] = useState<string | null>(null);

    const update = (key: string, patch: Partial<Proposal>) =>
        onChange(proposals.map(p => (p.key === key ? { ...p, ...patch } : p)));

    const acceptedCount = proposals.filter(p => p.accepted).length;

    return (
        <Sheet open={open} onClose={onClose} title={t('AI 讀到的資料', 'What the AI read')} width="min(38rem, 94vw)">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {files.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <FileText size={12} /> {f}
                    </span>
                ))}
                {documentTypes.filter(Boolean).map((d, i) => (
                    <span key={i} className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-600">{d}</span>
                ))}
            </div>

            {busy && (
                <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 p-4 text-sm text-slate-700">
                    <Sparkles size={16} className="animate-pulse text-indigo-500" />
                    {t('AI 正在讀取文件…', 'Reading the document…')}
                </div>
            )}

            {!busy && proposals.length === 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-slate-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    {t('這份文件裡沒有找到可以填進申報表的欄位。', 'Nothing in this document matches a field in the declaration.')}
                </div>
            )}

            {proposals.length > 0 && (
                <>
                    <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]" data-no-drag>
                        {proposals.map((p, i) => {
                            const needsProcess = p.field.target.kind === 'processCell';
                            const needsProduct = p.field.target.kind === 'product';
                            return (
                                <div key={p.key} className={`p-4 ${i ? 'hairline border-t' : ''}`}>
                                    <label className="flex items-start gap-3">
                                        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-indigo-500)]"
                                            checked={p.accepted} onChange={e => update(p.key, { accepted: e.target.checked })} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="text-sm font-medium text-slate-900">{lang === 'zh' ? p.field.zh : p.field.label}</span>
                                                <span className="text-xs text-slate-500">{Math.round((p.parts[0]?.confidence ?? 0) * 100)}%</span>
                                            </span>
                                            <span className="mt-1 flex items-center gap-2">
                                                <input className="field w-44 px-2.5 py-1 text-sm tabular-nums" value={p.value}
                                                    onChange={e => update(p.key, { value: e.target.value })} />
                                                {p.unit && <span className="text-xs text-slate-500">{p.unit}</span>}
                                                {p.parts.length > 1 && (
                                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.6875rem] text-emerald-700">
                                                        {t(`${p.parts.length} 份文件加總`, `sum of ${p.parts.length} documents`)}
                                                    </span>
                                                )}
                                            </span>
                                            <button type="button" className="mt-1 text-xs text-indigo-600 hover:underline"
                                                onClick={() => setShowEvidence(showEvidence === p.key ? null : p.key)}>
                                                {showEvidence === p.key ? t('隱藏原文', 'Hide source text') : t('看文件原文', 'Show source text')}
                                            </button>
                                            {showEvidence === p.key && (
                                                <span className="mt-1 block rounded-lg bg-slate-100 p-2 text-xs text-slate-600">
                                                    {p.parts.map((part, j) => (
                                                        <span key={j} className="block">「{part.evidence}」<span className="text-slate-400"> — {part.source}</span></span>
                                                    ))}
                                                </span>
                                            )}
                                        </span>
                                    </label>

                                    {(needsProcess || needsProduct) && p.accepted && (
                                        <div className="mt-2 pl-7">
                                            <select className="field w-full px-2.5 py-1.5 text-sm"
                                                value={p.destination ?? (needsProcess ? processes[0]?.id : '0')}
                                                onChange={e => update(p.key, { destination: e.target.value })}>
                                                {needsProcess
                                                    ? processes.map(pr => <option key={pr.id} value={pr.id}>{t('填到生產過程', 'Into process')} {pr.id}{pr.name ? ` · ${pr.name}` : ''}</option>)
                                                    : products.map(pd => <option key={pd.index} value={pd.index}>{t('填到產品', 'Into product')} {pd.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 bg-gradient-to-t from-[var(--material-sheet)] pt-3">
                        <span className="text-xs text-slate-500">{t(`已勾選 ${acceptedCount} 項`, `${acceptedCount} selected`)}</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="pressable rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-900/5">
                                {t('取消', 'Cancel')}
                            </button>
                            <button type="button" onClick={onApply} disabled={!acceptedCount}
                                className="pressable rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-40">
                                {t('填入表單', 'Fill the form')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Sheet>
    );
};

export default AiReviewSheet;
