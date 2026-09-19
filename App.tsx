import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import {
    Building2, Flame, Zap, Factory, Package, ClipboardList, Boxes, Leaf, Calculator, Download,
    Settings2, FileSpreadsheet, ShieldCheck, LifeBuoy, Sparkles,
} from 'lucide-react';
import HelpPage from './components/HelpPage';
import AiDropZone from './components/AiDropZone';
import { UPLOAD_HINTS } from './ai/fields';
import A_InstDataSection from './components/A_InstDataSection';
import B_EmInstSection from './components/B_EmInstSection';
import C_EmissionsEnergySection from './components/C_EmissionsEnergySection';
import D_ProcessesSection from './components/D_ProcessesSection';
import E_PurchPrecSection from './components/E_PurchPrecSection';
import Summary_ProcessSection from './components/Summary_ProcessSection';
import Summary_ProductsSection from './components/Summary_ProductsSection';
import CarbonEmissionTool from './components/CarbonEmissionTool';
import DecarbonizationEngine from './components/DecarbonizationEngine';
import type { FormData, A_InstData, B_EmInst, C_EmissionsEnergy, D_Processes, E_PurchPrec, Summary_Process, Summary_Product } from './types';
import { exportDeclaration } from './utils/exportDeclaration';
import { TEMPLATE_VERSION } from './utils/xlsxWriter';
import { PrefsProvider, usePrefs, useT } from './ui/prefs';
import { loadDraft, saveDraft, parseProject, saveProjectFile, openProjectFile } from './ui/project';
import { ToastProvider, useToast } from './ui/toast';
import { UndoContext } from './ui/undo';
import Sidebar, { type NavGroup } from './ui/Sidebar';

type SectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'SumProc' | 'SumProd' | 'Decarbon' | 'Scenario' | 'Export' | 'Help';

const FORM_SECTIONS: { id: SectionId; zh: string; en: string; sheet: string; icon: typeof Building2 }[] = [
    { id: 'A', zh: '設施資訊', en: 'Installation', sheet: 'A_InstData', icon: Building2 },
    { id: 'B', zh: '排放源流', en: 'Source streams', sheet: 'B_EmInst', icon: Flame },
    { id: 'C', zh: '排放與能源', en: 'Emissions & energy', sheet: 'C_Emissions&Energy', icon: Zap },
    { id: 'D', zh: '生產過程', en: 'Production processes', sheet: 'D_Processes', icon: Factory },
    { id: 'E', zh: '採購前驅物', en: 'Purchased precursors', sheet: 'E_PurchPrec', icon: Package },
    { id: 'SumProc', zh: '過程摘要', en: 'Process summary', sheet: 'Summary_Processes', icon: ClipboardList },
    { id: 'SumProd', zh: '產品摘要', en: 'Product summary', sheet: 'Summary_Products', icon: Boxes },
];

const EMPTY_FORM: FormData = {
    a_instData: { static: {}, e62: [{}], e83: [{}], e102: [{}] },
    b_emInst: { d17: [{}], d98: [{}], d113: [{}] },
    c_emissionsEnergy: {},
    d_processes: {},
    e_purchPrec: {},
    summary_process: {},
    summary_products: [],
};

/** How much of one section's DOM is filled: its required fields if it marks any, otherwise all of them. */
const measureFilled = (el: HTMLElement | null): { ratio: number | null; missingRequired: number } => {
    if (!el) return { ratio: null, missingRequired: 0 };
    const fields = Array.from(el.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=search]), select',
    )).filter(f => !f.disabled);
    const required = fields.filter(f => f.required);
    const missingRequired = required.filter(f => f.value.trim() === '').length;
    const pool = required.length ? required : fields;
    if (!pool.length) return { ratio: null, missingRequired };
    return { ratio: pool.filter(f => f.value.trim() !== '').length / pool.length, missingRequired };
};

const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
    <label className="flex cursor-default items-center justify-between gap-3 py-1.5 text-sm text-slate-800">
        {label}
        <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
            className={`relative h-[1.375rem] w-[2.375rem] shrink-0 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full shadow transition-transform ${on ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`}
                style={{ background: '#fff' }} />
        </button>
    </label>
);

const Shell: React.FC = () => {
    const { lang, setLang, showCodes, setShowCodes, reduceTransparency, setReduceTransparency } = usePrefs();
    const t = useT();
    const toast = useToast();
    const [active, setActive] = useState<SectionId>('A');
    const [formData, setFormData] = useState<FormData>(() => loadDraft() ?? EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [progress, setProgress] = useState<Record<string, number | null>>({});
    const [missing, setMissing] = useState<Record<string, number>>({});
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const openInput = useRef<HTMLInputElement>(null);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const contentRef = useRef<HTMLDivElement>(null);

    // --- Undo for destructive edits -------------------------------------------------
    const formRef = useRef(formData);
    formRef.current = formData;
    const undo = useRef<{ snapshot: FormData; toastId: number; armed: boolean } | null>(null);
    const captureUndo = useCallback((message: string) => {
        const snapshot = formRef.current;
        const toastId = toast.show({
            message,
            action: { label: t('復原', 'Undo'), onClick: () => { undo.current = null; setFormData(snapshot); } },
        });
        undo.current = { snapshot, toastId, armed: false };
    }, [toast, t]);
    useEffect(() => {
        const u = undo.current;
        if (!u) return;
        if (!u.armed) { u.armed = true; return; }       // the deletion itself
        toast.dismiss(u.toastId);                        // any later edit retires the offer
        undo.current = null;
    }, [formData, toast]);

    // --- Section updaters -------------------------------------------------------------
    const updateA = useCallback((data: A_InstData) => setFormData(prev => ({ ...prev, a_instData: data })), []);
    const updateB = useCallback((data: B_EmInst) => setFormData(prev => ({ ...prev, b_emInst: data })), []);
    const updateC = useCallback((data: C_EmissionsEnergy) => setFormData(prev => ({ ...prev, c_emissionsEnergy: data })), []);
    const updateD = useCallback((data: D_Processes) => setFormData(prev => ({ ...prev, d_processes: data })), []);
    const updateE = useCallback((data: E_PurchPrec) => setFormData(prev => ({ ...prev, e_purchPrec: data })), []);
    const updateSumProc = useCallback((data: Summary_Process) => setFormData(prev => ({ ...prev, summary_process: data })), []);
    const updateSumProd = useCallback((data: Summary_Product[]) => setFormData(prev => ({ ...prev, summary_products: data })), []);

    // --- Completion rings ("已填"), measured from every mounted section -----------------
    useLayoutEffect(() => {
        const next: Record<string, number | null> = {};
        const miss: Record<string, number> = {};
        for (const s of FORM_SECTIONS) {
            const m = measureFilled(sectionRefs.current[s.id]);
            next[s.id] = m.ratio;
            miss[s.id] = m.missingRequired;
        }
        setProgress(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        setMissing(prev => (JSON.stringify(prev) === JSON.stringify(miss) ? prev : miss));
    }, [formData, lang]);

    // Autosave: the draft comes back after a crash or a restart.
    useEffect(() => {
        if (formData === EMPTY_FORM) return;
        const id = window.setTimeout(() => { saveDraft(formData); setSavedAt(new Date()); }, 800);
        return () => window.clearTimeout(id);
    }, [formData]);

    const openProject = async (file: File) => {
        try {
            setFormData(parseProject(await file.text()));
            toast.show({ message: t(`已開啟 ${file.name}`, `Opened ${file.name}`), tone: 'success' });
        } catch (e: any) {
            toast.show({ message: e?.message ?? String(e), tone: 'error', duration: 9000 });
        }
    };

    const handleOpen = async () => {
        if (!window.cbam?.openProject) { openInput.current?.click(); return; }
        try {
            const picked = await openProjectFile();
            if (!picked) return;
            setFormData(picked.data);
            toast.show({ message: t(`已開啟 ${picked.name}`, `Opened ${picked.name}`), tone: 'success' });
        } catch (e: any) {
            toast.show({ message: e?.message ?? String(e), tone: 'error', duration: 9000 });
        }
    };

    const handleSaveProject = async () => {
        try {
            const name = await saveProjectFile(formData, formData.a_instData.static.I20 as string);
            if (name) toast.show({ message: t(`已儲存 ${name}`, `Saved ${name}`), tone: 'success' });
        } catch (e: any) {
            toast.show({ message: e?.message ?? String(e), tone: 'error', duration: 9000 });
        }
    };

    const select = (id: string) => {
        setActive(id as SectionId);
        contentRef.current?.scrollTo({ top: 0 });
    };

    const handleDownload = async () => {
        setIsSaving(true);
        try {
            const filename = await exportDeclaration(formData, formData.a_instData.static.I20 as string);
            toast.show({ message: t(`已產生 ${filename}`, `Created ${filename}`), tone: 'success' });
        } catch (error: any) {
            if (error?.name !== 'ExportCancelled') toast.show({ message: error?.message ?? String(error), tone: 'error', duration: 9000 });
        } finally {
            setIsSaving(false);
        }
    };

    const groups: NavGroup[] = [
        { zh: '申報表', en: 'Declaration', items: FORM_SECTIONS.map(s => ({ id: s.id, zh: s.zh, en: s.en, icon: s.icon, progress: progress[s.id] ?? null })) },
        {
            zh: '分析', en: 'Analysis', items: [
                { id: 'Decarbon', zh: '減碳建議', en: 'Decarbonisation', icon: Leaf },
                { id: 'Scenario', zh: '情境試算', en: 'Scenario calculator', icon: Calculator },
            ],
        },
        {
            zh: '輸出', en: 'Output', items: [
                { id: 'Export', zh: '匯出申報表', en: 'Export', icon: Download },
                { id: 'Help', zh: '說明與資源', en: 'Help & resources', icon: LifeBuoy },
            ],
        },
    ];

    const current = FORM_SECTIONS.find(s => s.id === active);
    const pageTitle = current ? (lang === 'zh' ? current.zh : current.en)
        : active === 'Decarbon' ? t('減碳建議', 'Decarbonisation')
        : active === 'Scenario' ? t('情境試算', 'Scenario calculator')
        : active === 'Help' ? t('說明與資源', 'Help & resources')
        : t('匯出申報表', 'Export');
    const idx = FORM_SECTIONS.findIndex(s => s.id === active);

    const header = (
        <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="shrink-0 text-indigo-500" />
            <div className="min-w-0 overflow-hidden">
                <div className="truncate text-[0.9375rem] font-semibold text-slate-900">{t('CBAM 申報助手', 'CBAM Auto-Filler')}</div>
                <div className="truncate text-[0.6875rem] text-slate-500">{t('歐盟官方範本 V2.1.1', 'EU template V2.1.1')}</div>
            </div>
        </div>
    );

    const footer = (
        <div className="relative">
            <button type="button" onClick={() => setSettingsOpen(o => !o)} aria-expanded={settingsOpen}
                className="pressable flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-900/5">
                <Settings2 size={16} className="shrink-0" />
                <span className="truncate">{t('設定', 'Settings')}</span>
            </button>
            {settingsOpen && (
                <div className="material-sheet absolute bottom-11 left-0 z-40 w-64 rounded-[var(--radius-card)] p-3">
                    <Switch on={showCodes} onChange={setShowCodes} label={t('顯示欄位代號', 'Show cell codes')} />
                    <Switch on={reduceTransparency} onChange={setReduceTransparency} label={t('降低透明度', 'Reduce transparency')} />
                </div>
            )}
        </div>
    );

    return (
        <UndoContext.Provider value={captureUndo}>
            <div className="flex h-screen overflow-hidden">
                <AiDropZone form={formData} setForm={setFormData} e83Rows={formData.a_instData.e83} />
                <Sidebar groups={groups} active={active} onSelect={select} lang={lang} header={header} footer={footer} />

                <div ref={contentRef} className="relative flex-1 overflow-y-auto">
                    <div className="material-bar sticky top-0 z-20 flex h-12 items-center gap-3 px-6">
                        <h1 className="flex-1 truncate text-[0.9375rem] font-semibold text-slate-900">{pageTitle}</h1>
                        {savedAt && (
                            <span className="hidden text-xs text-slate-500 sm:inline">
                                {t(`已自動儲存 ${savedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`,
                                    `Saved ${savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`)}
                            </span>
                        )}
                        <input ref={openInput} type="file" accept=".cbam,application/json" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) openProject(f); e.target.value = ''; }} />
                        <button type="button" onClick={handleOpen}
                            className="pressable rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-900/5">
                            {t('開啟專案', 'Open')}
                        </button>
                        <button type="button" onClick={handleSaveProject}
                            className="pressable rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-900/5">
                            {t('儲存專案', 'Save')}
                        </button>
                        <div className="flex rounded-lg bg-slate-900/5 p-0.5 text-xs font-medium" role="group" aria-label="Language">
                            {(['zh', 'en'] as const).map(l => (
                                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
                                    className={`pressable rounded-md px-2.5 py-1 ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>
                                    {l === 'zh' ? '中文' : 'EN'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <main className="mx-auto max-w-5xl px-6 pb-24 pt-6">
                        {current && (
                            <div className="mb-6">
                                <h2 className="text-[1.75rem] font-bold text-slate-900">{pageTitle}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t(`對應官方範本工作表 ${current.sheet}`, `Official template sheet ${current.sheet}`)}
                                </p>
                                {UPLOAD_HINTS[current.id] && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] bg-indigo-500/[0.07] px-4 py-3">
                                        <Sparkles size={15} className="shrink-0 text-indigo-500" />
                                        <span className="text-[0.8125rem] font-medium text-slate-700">{t('可以直接把這些拖進來讓 AI 讀：', 'Drop any of these in and the AI will read them:')}</span>
                                        {UPLOAD_HINTS[current.id].map(h => (
                                            <span key={h.en} className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-slate-600">{lang === 'zh' ? h.zh : h.en}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Every form section stays mounted so the sidebar rings can measure it. */}
                        <div hidden={active !== 'A'} ref={el => { sectionRefs.current.A = el; }}><A_InstDataSection data={formData.a_instData} setData={updateA} /></div>
                        <div hidden={active !== 'B'} ref={el => { sectionRefs.current.B = el; }}><B_EmInstSection data={formData.b_emInst} setData={updateB} /></div>
                        <div hidden={active !== 'C'} ref={el => { sectionRefs.current.C = el; }}><C_EmissionsEnergySection data={formData.c_emissionsEnergy} setData={updateC} /></div>
                        <div hidden={active !== 'D'} ref={el => { sectionRefs.current.D = el; }}><D_ProcessesSection data={formData.d_processes} setData={updateD} e83Rows={formData.a_instData.e83} e62Rows={formData.a_instData.e62} /></div>
                        <div hidden={active !== 'E'} ref={el => { sectionRefs.current.E = el; }}><E_PurchPrecSection data={formData.e_purchPrec} setData={updateE} e83Rows={formData.a_instData.e83} e102Rows={formData.a_instData.e102} /></div>
                        <div hidden={active !== 'SumProc'} ref={el => { sectionRefs.current.SumProc = el; }}><Summary_ProcessSection data={formData.summary_process} setData={updateSumProc} /></div>
                        <div hidden={active !== 'SumProd'} ref={el => { sectionRefs.current.SumProd = el; }}><Summary_ProductsSection data={formData.summary_products} setData={updateSumProd} e83Rows={formData.a_instData.e83} /></div>

                        {active === 'Decarbon' && <DecarbonizationEngine />}
                        {active === 'Scenario' && <CarbonEmissionTool e62Rows={formData.a_instData.e62} />}
                        {active === 'Help' && <HelpPage />}

                        {active === 'Export' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-[1.75rem] font-bold text-slate-900">{t('匯出申報表', 'Export')}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {t('把填好的資料寫進歐盟官方範本，交給你的歐盟進口商。', 'Write your data into the official EU template for your EU importer.')}
                                    </p>
                                </div>
                                <div className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-900">{t('CBAM 排放資料通報範本', 'CBAM communication template')}</div>
                                        <div className="text-sm text-slate-500">{t(`官方範本 ${TEMPLATE_VERSION}。只寫入你填的欄位，範本其餘部分完全不動。`, `Official template ${TEMPLATE_VERSION}. Only the fields you filled are written; the rest of the file is untouched.`)}</div>
                                    </div>
                                    <button type="button" onClick={handleDownload} disabled={isSaving}
                                        className="pressable inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
                                        <Download size={18} />
                                        {isSaving ? t('產生中…', 'Creating…') : t('下載申報表', 'Download')}
                                    </button>
                                </div>
                                {(() => {
                                    const gaps = FORM_SECTIONS.filter(s => (missing[s.id] ?? 0) > 0);
                                    if (!gaps.length) {
                                        return (
                                            <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-emerald-500/10 p-4 text-sm text-slate-700">
                                                <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                                                {t('必填欄位都填好了。', 'Every required field is filled.')}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="rounded-[var(--radius-card)] bg-amber-500/10 p-4">
                                            <p className="text-sm font-medium text-slate-800">
                                                {t('還有必填欄位沒填。你仍然可以匯出，進口商可能會退回要求補齊。', 'Some required fields are empty. You can still export; your importer may send it back.')}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {gaps.map(s => (
                                                    <button key={s.id} type="button" onClick={() => select(s.id)}
                                                        className="pressable rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white">
                                                        {(lang === 'zh' ? s.zh : s.en)} · {missing[s.id]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-slate-900/[0.03] p-4 text-xs leading-relaxed text-slate-500">
                                    <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                                    <p>This work is funded by the National Science and Technology Council (NSTC), Taiwan, ROC, under Contract Number 114-2222-E-005-001-. The contents do not necessarily reflect the views and policies of the NSTC.</p>
                                </div>
                            </div>
                        )}

                        {current && (
                            <div className="mt-10 flex justify-between">
                                <button type="button" disabled={idx <= 0} onClick={() => select(FORM_SECTIONS[idx - 1].id)}
                                    className="pressable rounded-full px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-500/10 disabled:invisible">
                                    ← {idx > 0 ? (lang === 'zh' ? FORM_SECTIONS[idx - 1].zh : FORM_SECTIONS[idx - 1].en) : ''}
                                </button>
                                <button type="button" onClick={() => select(idx < FORM_SECTIONS.length - 1 ? FORM_SECTIONS[idx + 1].id : 'Export')}
                                    className="pressable rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
                                    {idx < FORM_SECTIONS.length - 1 ? (lang === 'zh' ? FORM_SECTIONS[idx + 1].zh : FORM_SECTIONS[idx + 1].en) : t('匯出申報表', 'Export')} →
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </UndoContext.Provider>
    );
};

const App: React.FC = () => (
    <PrefsProvider>
        <ToastProvider>
            <MotionConfig reducedMotion="user">
                <Shell />
            </MotionConfig>
        </ToastProvider>
    </PrefsProvider>
);

export default App;
