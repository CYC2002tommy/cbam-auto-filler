import React, { useMemo, useState } from 'react';
import { Zap, Flame, Scale, Download, Info } from 'lucide-react';
import type { KeyValue } from '../types';
import { FUEL_DEFAULTS } from '../data/fuels';
import { TextInput, SelectInput, FieldLabel } from './FormControls';
import { Heading, Group } from './Layout';
import { useT, usePrefs } from '../ui/prefs';
import { useToast } from '../ui/toast';
import { saveBlob } from '../utils/saveFile';

/*
 * Scenario calculator. Savings are marginal: each tonne of embedded emissions avoided
 * is one CBAM certificate fewer, priced at max(0, EU ETS − carbon price already paid
 * in Taiwan). This holds while the good's emissions stay above the free-allocation
 * adjustment, which is identical in every scenario and so cancels out of a difference.
 */

// Goods whose embedded emissions count direct emissions only (Reg. 2023/956, Annex II).
const ANNEX_II = new Set([
    'Iron or steel products', 'Crude steel', 'Direct reduced iron', 'Pig iron', 'Alloys (FeMn, FeCr, FeNi)',
    'Sintered Ore', 'Aluminium products', 'Unwrought aluminium', 'Hydrogen',
]);
const FERTILISERS = new Set(['Ammonia', 'Nitric acid', 'Urea', 'Mixed fertilisers']);

// Lifecycle emission factors of low-carbon electricity (tCO2e/kWh), carried over from the original tool.
const GREEN_POWER: { id: string; zh: string; en: string; ef: number }[] = [
    { id: 'solar', zh: '太陽光電', en: 'Solar PV', ef: 0.0000499 },
    { id: 'onshore', zh: '陸域風電', en: 'Onshore wind', ef: 0.000016 },
    { id: 'offshore', zh: '離岸風電', en: 'Offshore wind', ef: 0.000029 },
    { id: 'geothermal', zh: '地熱發電', en: 'Geothermal', ef: 0.0000114 },
    { id: 'ror', zh: '水力（川流式）', en: 'Hydro, run-of-river', ef: 0.000004 },
    { id: 'reservoir', zh: '水力（水庫式）', en: 'Hydro, reservoir', ef: 0.000024 },
    { id: 'pumped', zh: '水力（抽蓄式）', en: 'Hydro, pumped storage', ef: 0.00001 },
];

// Boiler efficiency measures and their assumed energy saving, carried over from the original tool.
const MEASURES = [
    { id: 'T1', zh: '省煤器：以排煙預熱給水', en: 'Economizer (flue gas preheats feedwater)', eff: 0.05 },
    { id: 'T2', zh: '排污水熱回收預熱給水', en: 'Blowdown heat recovery', eff: 0.01 },
    { id: 'T3', zh: '火管鍋爐加裝擾流器', en: 'Turbulators in fire-tube boilers', eff: 0.01 },
    { id: 'T4', zh: '含氧量修正控制', en: 'Oxygen trim control', eff: 0.01 },
    { id: 'T5', zh: '排氣預熱燃燒空氣', en: 'Combustion air preheating (recuperator)', eff: 0.01 },
];

// CBAM default-value mark-ups on the total-emissions default (IR 2026/1740 correcting IR 2025/2621).
const MARKUP: Record<string, number> = { '2026': 0.10, '2027': 0.20, '2028': 0.30 };
const FERTILISER_MARKUP = 0.01;

const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fmt = (n: number, d = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const Big: React.FC<{ label: string; value: string; unit: string; muted?: boolean }> = ({ label, value, unit, muted }) => (
    <div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className={`mt-0.5 text-[1.75rem] font-semibold tabular-nums tracking-tight ${muted ? 'text-slate-400' : 'text-slate-900'}`}>
            {value} <span className="text-base font-medium text-slate-500">{unit}</span>
        </div>
    </div>
);

const CarbonEmissionTool: React.FC<{ e62Rows?: KeyValue[] }> = ({ e62Rows = [] }) => {
    const t = useT();
    const { lang } = usePrefs();
    const toast = useToast();

    const [euPrice, setEuPrice] = useState('80');
    const [originPrice, setOriginPrice] = useState('0');
    const [gridFactor, setGridFactor] = useState('0.474');
    const [green, setGreen] = useState(Array.from({ length: 4 }, () => ({ type: '', kwh: '' })));
    const [adopted, setAdopted] = useState<Record<string, boolean>>(() => Object.fromEntries(MEASURES.map(m => [m.id, true])));
    const [fuels, setFuels] = useState(Array.from({ length: 3 }, () => ({ type: '', gj: '', share: '100' })));
    const [cmp, setCmp] = useState({ tonnes: '', defaultSee: '', actualSee: '', year: '2026' });
    const [exporting, setExporting] = useState(false);

    // Which goods does the installation make? Decides whether electricity counts at all.
    const categories = useMemo(() => e62Rows.map(r => ((r.e as string) || '').trim()).filter(c => c && c !== 'n.a.'), [e62Rows]);
    const allAnnexII = categories.length > 0 && categories.every(c => ANNEX_II.has(c));
    const someAnnexII = categories.some(c => ANNEX_II.has(c));
    const allFertiliser = categories.length > 0 && categories.every(c => FERTILISERS.has(c));
    const indirectCounts = !allAnnexII;

    const priceGap = Math.max(0, num(euPrice) - num(originPrice));
    const grid = num(gridFactor) / 1000; // kg/kWh → t/kWh

    const s1Reduction = indirectCounts
        ? green.reduce((sum, g) => {
            const gp = GREEN_POWER.find(x => x.id === g.type);
            return gp ? sum + num(g.kwh) * Math.max(0, grid - gp.ef) : sum;
        }, 0)
        : 0;
    const s1Saved = s1Reduction * priceGap;

    // Measures act on the energy left after the previous ones: 1 − Π(1 − e).
    const remaining = MEASURES.reduce((acc, m) => (adopted[m.id] ? acc * (1 - m.eff) : acc), 1);
    const totalEff = 1 - remaining;
    const s2Reduction = fuels.reduce((sum, f) => {
        const fd = FUEL_DEFAULTS.find(x => x.id === f.type);
        return fd ? sum + num(f.gj) * (fd.ef / 1000) * (num(f.share) / 100) * totalEff : sum;
    }, 0);
    const s2Saved = s2Reduction * priceGap;

    const markup = allFertiliser ? FERTILISER_MARKUP : (MARKUP[cmp.year] ?? 0.30);
    const extraPerTonne = Math.max(0, num(cmp.defaultSee) * (1 + markup) - num(cmp.actualSee));
    const s3ExtraEmissions = num(cmp.tonnes) * extraPerTonne;
    const s3ExtraCost = s3ExtraEmissions * priceGap;

    const handleExport = async () => {
        setExporting(true);
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            wb.creator = 'CBAM Auto-Filler';
            const ws = wb.addWorksheet('情境試算', {
                views: [{ showGridLines: false, state: 'frozen', ySplit: 3 }],
                properties: { tabColor: { argb: 'FF2F75B5' } },
                pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
            });
            ws.columns = [{ width: 3 }, { width: 12 }, { width: 44 }, { width: 20 }, { width: 18 }, { width: 18 }, { width: 22 }];
            const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } } as const;
            const border = { top: thin, left: thin, bottom: thin, right: thin };
            const head = (row: any, from: number, to: number) => { for (let c = from; c <= to; c++) Object.assign(row.getCell(c), { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }, border, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } }); };
            const input = (cell: any) => Object.assign(cell, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, border });
            const result = (cell: any) => Object.assign(cell, { font: { bold: true, color: { argb: 'FF006100' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, border, numFmt: '#,##0.00' });
            const section = (title: string) => { const r = ws.addRow(['', title]); ws.mergeCells(`B${r.number}:G${r.number}`); Object.assign(r.getCell(2), { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } } }); return r; };

            ws.addRow([]);
            ws.addRow(['', '碳排情境分析（互動式報表）']).getCell(2).font = { bold: true, size: 16 };
            ws.addRow([]);
            section('一、價格設定');
            head(ws.addRow(['', '項目', '數值', '單位']), 2, 4);
            const pEu = ws.addRow(['', '(a) EU ETS 價格', num(euPrice), '€/tCO2e']); input(pEu.getCell(3));
            const pOr = ws.addRow(['', '(b) 原產地已付碳價', num(originPrice), '€/tCO2e']); input(pOr.getCell(3));
            const pGrid = ws.addRow(['', '(c) 電網排放係數', num(gridFactor), 'kgCO2e/kWh']); input(pGrid.getCell(3));
            const pInd = ws.addRow(['', '(d) 電力間接排放計入 CBAM（1=是，0=否；鋼、鋁、氫為 0）', indirectCounts ? 1 : 0, '']); input(pInd.getCell(3));
            const gap = `MAX(0,$C$${pEu.number}-$C$${pOr.number})`;
            ws.addRow([]);

            section('二、情境一：以低碳電力替代可節省之成本');
            head(ws.addRow(['', '編號', '低碳電力類型', '購入量 (kWh)', '係數 (tCO2e/kWh)', '', '節省成本 (€)']), 2, 7);
            const g0 = ws.rowCount + 1;
            green.forEach((g, i) => {
                const gp = GREEN_POWER.find(x => x.id === g.type);
                const r = ws.addRow(['', `G${i + 1}`, gp ? `${gp.zh} (${gp.en})` : '', num(g.kwh), gp?.ef ?? 0, '', '']);
                input(r.getCell(4));
                r.getCell(7).value = { formula: `D${r.number}*MAX(0,$C$${pGrid.number}/1000-E${r.number})*${gap}*$C$${pInd.number}` };
                result(r.getCell(7));
            });
            const g1 = ws.rowCount;
            ws.addRow([]);

            section('三、情境二：鍋爐節能措施可節省之成本（措施效果可能重疊，結果為上限）');
            head(ws.addRow(['', '編號', '措施', '是否採用 (是/否)', '節能率', '剩餘能耗比例', '']), 2, 6);
            const m0 = ws.rowCount + 1;
            MEASURES.forEach(m => {
                const r = ws.addRow(['', m.id, `${m.zh} (${m.en})`, adopted[m.id] ? '是' : '否', m.eff, '', '']);
                input(r.getCell(4));
                r.getCell(4).dataValidation = { type: 'list', allowBlank: false, formulae: ['"是,否"'] };
                r.getCell(5).numFmt = '0.00%';
                r.getCell(6).value = { formula: `IF(D${r.number}="是",1-E${r.number},1)` };
            });
            const m1 = ws.rowCount;
            const effRow = ws.addRow(['', '', '總節能率（連乘：1 − Π(1 − 各措施節能率)）', '', '', '', '']);
            effRow.getCell(5).value = { formula: `1-PRODUCT(F${m0}:F${m1})` };
            effRow.getCell(5).numFmt = '0.00%';
            result(effRow.getCell(5));
            head(ws.addRow(['', '編號', '燃料', '用量 (GJ)', '分攤比例 (%)', '係數 (tCO2/GJ)', '節省成本 (€)']), 2, 7);
            const f0 = ws.rowCount + 1;
            fuels.forEach((f, i) => {
                const fd = FUEL_DEFAULTS.find(x => x.id === f.type);
                const r = ws.addRow(['', `F${i + 1}`, fd ? `${fd.zh} (${fd.en})` : '', num(f.gj), num(f.share), fd ? fd.ef / 1000 : 0, '']);
                input(r.getCell(4)); input(r.getCell(5));
                r.getCell(7).value = { formula: `D${r.number}*F${r.number}*(E${r.number}/100)*$E$${effRow.number}*${gap}` };
                result(r.getCell(7));
            });
            const f1 = ws.rowCount;
            ws.addRow([]);

            section('四、情境三：使用預設值 vs 實際值');
            const c1 = ws.addRow(['', '出口量 (t)', num(cmp.tonnes)]); input(c1.getCell(3));
            const c2 = ws.addRow(['', '歐盟預設值（總排放，tCO2e/t）', num(cmp.defaultSee)]); input(c2.getCell(3));
            const c3 = ws.addRow(['', `預設值加成（${cmp.year}）`, markup]); c3.getCell(3).numFmt = '0%';
            const c4 = ws.addRow(['', '實際值 SEE (tCO2e/t)', num(cmp.actualSee)]); input(c4.getCell(3));
            const c5 = ws.addRow(['', '使用預設值多付 (€)', '']);
            c5.getCell(3).value = { formula: `C${c1.number}*MAX(0,C${c2.number}*(1+C${c3.number})-C${c4.number})*${gap}` };
            result(c5.getCell(3));
            ws.addRow([]);

            section('五、預估節省成本總覽');
            const t1 = ws.addRow(['', '情境一 (€)', '']); t1.getCell(3).value = { formula: `SUM(G${g0}:G${g1})` }; result(t1.getCell(3));
            const t2 = ws.addRow(['', '情境二 (€)', '']); t2.getCell(3).value = { formula: `SUM(G${f0}:G${f1})` }; result(t2.getCell(3));
            const t3 = ws.addRow(['', '情境三：使用預設值多付 (€)', '']); t3.getCell(3).value = { formula: `C${c5.number}` }; result(t3.getCell(3));
            const tNet = ws.addRow(['', '合計影響 (€)：情境一 + 情境二 − 情境三', '']);
            tNet.getCell(3).value = { formula: `C${t1.number}+C${t2.number}-C${t3.number}` };
            result(tNet.getCell(3));
            tNet.getCell(3).font = { bold: true, size: 13, color: { argb: 'FF006100' } };

            // Assumptions and sources, so the numbers can be checked a year from now.
            const notes = wb.addWorksheet('假設與資料來源', { properties: { tabColor: { argb: 'FF7F7F7F' } } });
            notes.columns = [{ width: 26 }, { width: 86 }];
            notes.addRow(['項目', '說明']).font = { bold: true };
            [
                ['產生時間', new Date().toLocaleString('zh-TW')],
                ['節省成本的定義', '每少 1 公噸內含排放，進口商就少買 1 張 CBAM 憑證，價差為 max(0, 歐盟碳價 − 原產地已付碳價)。'],
                ['免費配額調整', '調整額在各情境中相同，計算「差額」時會互相抵消，因此本表未逐年套用；前提是排放量仍高於調整後基準。'],
                ['電網排放係數', `本表使用 ${num(gridFactor)} kgCO2e/kWh（預設為能源署公告值）。若進口商採用歐盟公告的台灣預設值，請自行改為該值。`],
                ['情境一適用範圍', '鋼鐵、鋁、氫屬 CBAM 法規附件 II，正式期只計直接排放，電力不計入（歐盟指引 5D），故本表以 C 欄旗標設為 0。'],
                ['綠電可用性', '實際申報時只有 PPA 或直接技術連結、且有智慧電表佐證的電力可用實際係數；台灣的 T-REC 不符合。'],
                ['情境二計算方式', '多項措施依序作用於剩餘能耗，採連乘：總節能率 = 1 − Π(1 − 各措施節能率)。'],
                ['情境二注意事項', '省煤器與空氣預熱回收同一股排煙熱，效果可能重疊，結果視為上限。措施為鍋爐節能措施，加熱爐需另行評估。'],
                ['燃料係數來源', 'IPCC 2006 指南第 2 冊，表 1.2（淨熱值）與表 1.4（CO2 排放係數）。'],
                ['預設值加成', 'IR 2026/1740（更正 IR 2025/2621）：水泥、鋼鐵、鋁、氫 2026 +10%、2027 +20%、2028 起 +30%；肥料一律 +1%。'],
                ['預設值數據', '請以歐盟公告之台灣預設值為準（IR 2025/2621 附件 I，經 IR 2026/1740 更正）。'],
                ['本表用途', '內部評估與溝通用，不是 CBAM 申報文件。申報請用「匯出申報表」產生的官方範本。'],
            ].forEach(row => { const r = notes.addRow(row); r.getCell(2).alignment = { wrapText: true, vertical: 'top' }; r.getCell(1).font = { bold: true }; });

            // Carried over from the non-official "database" sheet of the old embedded template.
            const db = wb.addWorksheet('CBAM 分年係數', { properties: { tabColor: { argb: 'FFBFBFBF' } } });
            db.columns = [{ width: 10 }, { width: 22 }];
            db.addRow(['年份', 'CBAM 係數（免費配額調整）']).font = { bold: true };
            [[2026, 0.025], [2027, 0.05], [2028, 0.1], [2029, 0.225], [2030, 0.485], [2031, 0.61], [2032, 0.735], [2033, 0.86], [2034, 1]]
                .forEach(([y, f]) => { const r = db.addRow([y, f]); r.getCell(2).numFmt = '0.0%'; });

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const saved = await saveBlob(blob, 'CBAM情境試算.xlsx', 'Excel', 'xlsx');
            toast.show({
                message: t(`已儲存到 ${saved}`, `Saved to ${saved}`),
                tone: 'success',
                duration: 8000,
                action: window.cbam?.reveal ? { label: t('開啟資料夾', 'Show in folder'), onClick: () => window.cbam?.reveal?.(saved) } : undefined,
            });
        } catch (e: any) {
            if (e?.name === 'SaveCancelled') return;
            toast.show({ message: t(`匯出失敗：${e?.message ?? e}`, `Export failed: ${e?.message ?? e}`), tone: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const gpOptions = GREEN_POWER.map(g => ({ value: g.id, label: lang === 'zh' ? g.zh : g.en }));
    const fuelOptions = FUEL_DEFAULTS.map(f => ({ value: f.id, label: lang === 'zh' ? f.zh : f.en }));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-[1.75rem] font-bold text-slate-900">{t('情境試算', 'Scenario calculator')}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">{t('估算不同減碳做法能少買多少 CBAM 憑證。只算憑證費用，不含設備或購電成本。', 'Estimate how many CBAM certificates each option avoids. Certificate cost only; equipment and power purchase costs are not included.')}</p>
                </div>
                <button type="button" onClick={handleExport} disabled={exporting}
                    className="pressable inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-900/10 disabled:opacity-50">
                    <Download size={16} /> {exporting ? t('匯出中…', 'Exporting…') : t('匯出 Excel', 'Export Excel')}
                </button>
            </div>

            <Group>
                <Heading label="Prices (價格)" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <TextInput label="EU ETS price (歐盟碳價)" id="sc-eu" type="number" unit="€/t" value={euPrice} onChange={e => setEuPrice(e.target.value)} />
                    <TextInput label="Carbon price already paid in Taiwan (在台灣已付碳價)" id="sc-origin" type="number" unit="€/t" value={originPrice} onChange={e => setOriginPrice(e.target.value)} />
                    <TextInput label="Grid emission factor (電網排放係數)" id="sc-grid" type="number" unit="kg/kWh" value={gridFactor} onChange={e => setGridFactor(e.target.value)} />
                </div>
                <p className="mt-3 text-xs text-slate-500">{t('電網係數預設為能源署公告的 0.474 kg/度；如果進口商用的是歐盟公告的台灣預設值，請改成那個數字。', 'The grid factor defaults to 0.474 kg/kWh as published by Taiwan’s Energy Administration; use the EU default for Taiwan if your importer applies it.')}</p>
            </Group>

            <Group>
                <div className="mb-3 flex items-center gap-2 text-slate-900"><Zap size={18} className="text-indigo-500" /><h3 className="text-[1.0625rem] font-semibold">{t('情境一：改用低碳電力', 'Scenario 1: low-carbon electricity')}</h3></div>
                {allAnnexII ? (
                    <div className="flex items-start gap-3 rounded-xl bg-indigo-500/10 p-4 text-sm text-slate-700">
                        <Info size={18} className="mt-0.5 shrink-0 text-indigo-500" />
                        <p>{t('你的商品屬於鋼鐵、鋁或氫，在 CBAM 正式期只計直接排放，電力不計入內含排放（CBAM 法規附件 II、歐盟指引 5D），所以買綠電不會減少 CBAM 憑證，這個情境的節省是 €0。減碳請看情境二（燃料）與上游鋼材的排放。',
                            'Your goods are iron, steel, aluminium or hydrogen. In the definitive period only direct emissions count for them; electricity is not part of their embedded emissions (CBAM Regulation Annex II, Guidance 5D). Buying green power therefore saves €0 in CBAM certificates. Look at fuel (scenario 2) and upstream steel instead.')}</p>
                    </div>
                ) : (
                    <p className="mb-3 flex items-start gap-2 text-xs text-slate-500">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        {t(`${someAnnexII ? '只有水泥、肥料類商品的用電會計入。' : ''}實際申報時，只有透過購電協議（PPA）或直接技術連結、並有智慧電表佐證的電力才能用實際係數；台灣的再生能源憑證（T-REC）不算。`,
                            `${someAnnexII ? 'Only electricity used for cement or fertiliser goods counts. ' : ''}In a real declaration, only electricity under a power purchase agreement or a direct technical link, backed by smart metering, may use its own factor; Taiwanese renewable energy certificates (T-REC) do not qualify.`)}
                    </p>
                )}
                {!allAnnexII && (
                    <div className="space-y-3">
                        {green.map((g, i) => (
                            <div key={i} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <SelectInput label={t(`低碳電力 G${i + 1}`, `Low-carbon power G${i + 1}`)} id={`sc-g-${i}`} options={gpOptions} value={g.type}
                                    onChange={e => setGreen(list => list.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))} />
                                <TextInput label={t('購入量', 'Quantity purchased')} id={`sc-gk-${i}`} type="number" unit="kWh" value={g.kwh}
                                    onChange={e => setGreen(list => list.map((x, j) => (j === i ? { ...x, kwh: e.target.value } : x)))} />
                            </div>
                        ))}
                    </div>
                )}
            </Group>

            <Group>
                <div className="mb-1 flex items-center gap-2 text-slate-900"><Flame size={18} className="text-amber-500" /><h3 className="text-[1.0625rem] font-semibold">{t('情境二：鍋爐節能措施', 'Scenario 2: boiler efficiency measures')}</h3></div>
                <p className="mb-4 text-xs text-slate-500">{t('多項措施依序作用在剩餘能耗上（連乘）。省煤器與空氣預熱都回收同一股排煙熱，效果可能重疊，所以結果是上限。', 'Measures act one after another on the remaining energy (multiplied, not added). The economizer and air preheating both recover the same flue-gas heat, so treat the result as an upper bound.')}</p>
                <div className="overflow-hidden rounded-xl bg-slate-100/60">
                    {MEASURES.map((m, i) => (
                        <label key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i ? 'hairline border-t' : ''}`}>
                            <input type="checkbox" className="h-4 w-4 accent-[var(--color-indigo-500)]" checked={!!adopted[m.id]} onChange={e => setAdopted(a => ({ ...a, [m.id]: e.target.checked }))} />
                            <span className="flex-1 text-sm text-slate-800">{lang === 'zh' ? m.zh : m.en}</span>
                            <span className="text-sm tabular-nums text-slate-500">{fmt(m.eff * 100, 0)}%</span>
                        </label>
                    ))}
                </div>
                <div className="mt-4 space-y-3">
                    {fuels.map((f, i) => (
                        <div key={i} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <SelectInput label={t(`燃料 F${i + 1}`, `Fuel F${i + 1}`)} id={`sc-f-${i}`} options={fuelOptions} value={f.type}
                                onChange={e => setFuels(list => list.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))} />
                            <TextInput label={t('用量', 'Consumption')} id={`sc-fg-${i}`} type="number" unit="GJ" value={f.gj}
                                onChange={e => setFuels(list => list.map((x, j) => (j === i ? { ...x, gj: e.target.value } : x)))} />
                            <TextInput label={t('用於 CBAM 產品的比例', 'Share used for CBAM goods')} id={`sc-fs-${i}`} type="number" unit="%" value={f.share}
                                onChange={e => setFuels(list => list.map((x, j) => (j === i ? { ...x, share: String(Math.min(100, Math.max(0, num(e.target.value)))) } : x)))} />
                        </div>
                    ))}
                </div>
            </Group>

            <Group>
                <div className="mb-1 flex items-center gap-2 text-slate-900"><Scale size={18} className="text-emerald-600" /><h3 className="text-[1.0625rem] font-semibold">{t('情境三：用預設值要多付多少', 'Scenario 3: the cost of using default values')}</h3></div>
                <p className="mb-4 text-xs text-slate-500">{t('沒有經查證的實際數據時，進口商只能用歐盟預設值，而且要再加成（2026 年 10%、2027 年 20%、2028 年起 30%；肥料 1%，依 IR 2026/1740）。預設值請以歐盟公告的台灣數值為準。',
                    'Without verified actual data the importer must use the EU default value plus a mark-up (10% in 2026, 20% in 2027, 30% from 2028; fertilisers 1%, per IR 2026/1740). Use the EU default published for Taiwan.')}</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <TextInput label={t('出口量', 'Tonnes exported')} id="sc-t" type="number" unit="t" value={cmp.tonnes} onChange={e => setCmp(c => ({ ...c, tonnes: e.target.value }))} />
                    <TextInput label={t('歐盟預設值（總排放）', 'EU default (total)')} id="sc-d" type="number" unit="tCO₂e/t" value={cmp.defaultSee} onChange={e => setCmp(c => ({ ...c, defaultSee: e.target.value }))} />
                    <TextInput label={t('你的實際值', 'Your actual value')} id="sc-a" type="number" unit="tCO₂e/t" value={cmp.actualSee} onChange={e => setCmp(c => ({ ...c, actualSee: e.target.value }))} />
                    <div>
                        <FieldLabel label={t('申報年度', 'Year')} htmlFor="sc-y" />
                        <select id="sc-y" className="field block w-full px-3 py-2 text-[0.9375rem] text-slate-900" value={cmp.year} onChange={e => setCmp(c => ({ ...c, year: e.target.value }))}>
                            <option value="2026">2026（+10%）</option>
                            <option value="2027">2027（+20%）</option>
                            <option value="2028">{t('2028 起（+30%）', '2028 on (+30%)')}</option>
                        </select>
                    </div>
                </div>
            </Group>

            <div className="card grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                <Big label={t('情境一：可省', 'Scenario 1 saves')} value={`€ ${fmt(s1Saved)}`} unit="" muted={!indirectCounts} />
                <Big label={t('情境二：可省', 'Scenario 2 saves')} value={`€ ${fmt(s2Saved)}`} unit="" />
                <Big label={t('情境三：用預設值多付', 'Scenario 3: extra cost of defaults')} value={`€ ${fmt(s3ExtraCost)}`} unit="" />
                <div className="hairline col-span-full grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-3">
                    <Big label={t('情境一減排', 'Scenario 1 reduction')} value={fmt(s1Reduction, 3)} unit="tCO₂e" muted={!indirectCounts} />
                    <Big label={t('情境二減排（總節能率 ' + fmt(totalEff * 100, 2) + '%）', `Scenario 2 reduction (${fmt(totalEff * 100, 2)}% saving)`)} value={fmt(s2Reduction, 3)} unit="tCO₂e" />
                    <Big label={t('情境三多計排放', 'Scenario 3 extra emissions')} value={fmt(s3ExtraEmissions, 1)} unit="tCO₂e" />
                </div>
            </div>
        </div>
    );
};

export default CarbonEmissionTool;
