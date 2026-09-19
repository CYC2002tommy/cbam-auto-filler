import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { B_EmInst, KeyValue } from '../types';
import { D17_OPTIONS_METHOD, D17_OPTIONS_G_UNIT, D17_OPTIONS_K_EF_UNIT, D98_OPTIONS_PFC, D113_E_OPTIONS } from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { TextInput, SelectInput } from './FormControls';
import { Heading } from './Layout';
import EFDefaultsSearchModal from './EFDefaultsSearchModal';
import type { FuelDefault } from '../data/fuels';
import { SwipeRow, AddRowButton, CAPS } from '../ui/rows';
import { useT, useLabel } from '../ui/prefs';
import { useUndo } from '../ui/undo';

interface Props {
    data: B_EmInst;
    setData: (data: B_EmInst) => void;
}

/*
 * PFC inputs are only the template's unlocked cells in rows 98–107 (checked with
 * tools/inspect_rows.py). AN–AS and AU are formulas and must never be written.
 */
const PFC_SLOPE = [
    { col: 'ag', label: 'Anode effect frequency (A: Frequency) (陽極效應頻率)' },
    { col: 'ah', label: 'Anode effect duration (A: Duration) (陽極效應持續時間)' },
    { col: 'ai', label: 'Slope emission factor for CF4 (A: SEF(CF4)) (CF4 斜率排放係數)' },
];
const PFC_OVERVOLTAGE = [
    { col: 'aj', label: 'Anode effect overvoltage (B: AEO) (陽極效應過電壓)' },
    { col: 'ak', label: 'Current efficiency (B: CE) (電流效率)' },
    { col: 'al', label: 'Overvoltage coefficient (B: OVC) (過電壓係數)' },
];
const PFC_COMMON = [
    { col: 'am', label: 'Weight fraction of C2F6 (F(C2F6)) (C2F6 重量分率)' },
    { col: 'at', label: 'Collection efficiency (收集效率)', unit: '%' },
];

const B_EmInstSection: React.FC<Props> = ({ data, setData }) => {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
    const t = useT();
    const label = useLabel();
    const captureUndo = useUndo();

    const handleDynamicChange = <T extends keyof B_EmInst,>(section: T, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    const addRow = <T extends keyof B_EmInst,>(section: T) => {
        setData({ ...data, [section]: [...(data[section] as KeyValue[]), {}] });
    };

    const removeRow = <T extends keyof B_EmInst,>(section: T, index: number, what: string) => {
        captureUndo(t(`已刪除${what}`, `Deleted ${what}`));
        setData({ ...data, [section]: (data[section] as KeyValue[]).filter((_, i) => i !== index) });
    };

    const applyFuel = (fuel: FuelDefault) => {
        if (currentRowIndex === null) return;
        const d17 = [...data.d17];
        d17[currentRowIndex] = { ...d17[currentRowIndex], e: fuel.en, h: String(fuel.ncv), j: String(fuel.ef), k: 'tCO2/TJ', g: d17[currentRowIndex]?.g || 't' };
        setData({ ...data, d17 });
    };

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <Heading
                    label="(a) Source streams, calculation-based (排放源流：計算法)"
                    note={label('Every fuel or material that emits CO2 when used: for a fastener plant usually the natural gas or fuel oil burned in heat-treatment and forging furnaces. (使用時會排放 CO2 的每種燃料或原料；扣件廠通常是熱處理爐、鍛造爐燒的天然氣或燃料油。)')}
                />
                {data.d17.map((row, index) => {
                    const method = row.d as string;
                    const isMassBalance = method === 'Mass Balance';
                    const isCombustion = method === 'Combustion';
                    const isProcessEmissions = method === 'Process emissions';
                    return (
                        <SwipeRow key={index} onDelete={() => removeRow('d17', index, t(`排放源流 ${index + 1}`, `source stream ${index + 1}`))} label={`${index + 1}`}>
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('排放源流', 'Source stream')} {index + 1}</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <SelectInput label="Method (計算方法)" id={`d17-d-${index}`} name="d" options={D17_OPTIONS_METHOD} required value={row.d as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                <div className="lg:col-span-2">
                                    <TextInput label="Source stream name (排放源流名稱)" id={`d17-e-${index}`} name="e" type="text" required value={row.e as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                    {isCombustion && (
                                        <button
                                            type="button"
                                            onClick={() => { setCurrentRowIndex(index); setIsSearchModalOpen(true); }}
                                            className="pressable mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/10"
                                        >
                                            <Search size={12} /> {t('套用燃料預設值（IPCC）', 'Use fuel defaults (IPCC)')}
                                        </button>
                                    )}
                                </div>
                                <div />
                                <TextInput label="Activity data (AD) (活動數據)" id={`d17-f-${index}`} name="f" type="number" required value={row.f as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                <SelectInput label="AD unit (活動數據單位)" id={`d17-g-${index}`} name="g" options={D17_OPTIONS_G_UNIT} required value={row.g as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                <TextInput label="Net calorific value (NCV) (淨熱值)" id={`d17-h-${index}`} name="h" type="number" unit="GJ/t" required={!isProcessEmissions && !isMassBalance} value={row.h as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                {!isMassBalance ? (
                                    <>
                                        <TextInput label="Emission factor (EF) (排放係數)" id={`d17-j-${index}`} name="j" type="number" required value={row.j as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                        <SelectInput label="EF unit (排放係數單位)" id={`d17-k-${index}`} name="k" options={D17_OPTIONS_K_EF_UNIT} required value={row.k as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                    </>
                                ) : (
                                    <TextInput label="Carbon content (碳含量)" id={`d17-l-${index}`} name="l" type="number" required value={row.l as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                )}
                                {isCombustion && <TextInput label="Oxidation factor (OxF) (氧化因子)" id={`d17-n-${index}`} name="n" type="number" unit="%" value={row.n as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />}
                                {isProcessEmissions && <TextInput label="Conversion factor (ConvF) (轉化因子)" id={`d17-p-${index}`} name="p" type="number" unit="%" value={row.p as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />}
                                <TextInput label="Biomass content (BioC) (生質含量)" id={`d17-r-${index}`} name="r" type="number" unit="%" value={row.r as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                            </div>
                        </SwipeRow>
                    );
                })}
                <AddRowButton count={data.d17.length} cap={CAPS['b.d17']} onAdd={() => addRow('d17')} label={t('新增排放源流', 'Add source stream')} />
            </section>

            <CollapsibleSection title="(b) PFC emissions, primary aluminium only (PFC 排放，僅原鋁生產)" isSubSection>
                <div className="space-y-4">
                    {data.d98.map((row, index) => {
                        const method = row.d as string;
                        const fields = [
                            ...(method === 'Slope method' ? PFC_SLOPE : method === 'Overvoltage method' ? PFC_OVERVOLTAGE : []),
                            ...PFC_COMMON,
                        ];
                        return (
                            <SwipeRow key={index} onDelete={() => removeRow('d98', index, t(`PFC 排放源 ${index + 1}`, `PFC source ${index + 1}`))} label={`${index + 1}`}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <SelectInput label="Method (計算方法)" id={`d98-d-${index}`} name="d" options={D98_OPTIONS_PFC} value={row.d as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    <TextInput label="Technology type (電解槽技術類型)" id={`d98-e-${index}`} name="e" type="text" value={row.e as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    <TextInput label="Activity data (AD) (活動數據)" id={`d98-f-${index}`} name="f" type="number" value={row.f as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    <div />
                                    {fields.map(f => (
                                        <TextInput key={f.col} label={f.label} id={`d98-${f.col}-${index}`} name={f.col} type="number" unit={'unit' in f ? f.unit : undefined}
                                            value={row[f.col] as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    ))}
                                </div>
                            </SwipeRow>
                        );
                    })}
                    <AddRowButton count={data.d98.length} cap={CAPS['b.d98']} onAdd={() => addRow('d98')} label={t('新增 PFC 排放源', 'Add PFC source')} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="(c) Emission sources, measurement-based (排放源：量測法，選填)" isSubSection>
                <div className="space-y-4">
                    {data.d113.map((row, index) => (
                        <SwipeRow key={index} onDelete={() => removeRow('d113', index, t(`量測排放源 ${index + 1}`, `measured source ${index + 1}`))} label={`${index + 1}`}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="lg:col-span-2"><TextInput label="Name (名稱)" id={`d113-d-${index}`} name="d" type="text" value={row.d as string || ''} onChange={e => handleDynamicChange('d113', index, e)} /></div>
                                <div className="lg:col-span-2"><SelectInput label="Type of GHG (溫室氣體種類)" id={`d113-e-${index}`} name="e" options={D113_E_OPTIONS} value={row.e as string || ''} onChange={e => handleDynamicChange('d113', index, e)} /></div>
                                <TextInput label="Biomass fraction (生質比例)" id={`d113-r-${index}`} name="r" type="number" unit="%" value={row.r as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                <TextInput label="Hourly GHG concentration, average (每小時平均濃度)" id={`d113-v-${index}`} name="v" type="number" value={row.v as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                <TextInput label="Hours operating (運轉時數)" id={`d113-x-${index}`} name="x" type="number" unit="h" value={row.x as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                <TextInput label="Flue gas flow, average (平均煙氣流量)" id={`d113-z-${index}`} name="z" type="number" value={row.z as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                <TextInput label="Energy content, fossil (化石能源含量)" id={`d113-ax-${index}`} name="ax" type="number" unit="TJ" value={row.ax as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                <TextInput label="Energy content, biomass (生質能源含量)" id={`d113-ay-${index}`} name="ay" type="number" unit="TJ" value={row.ay as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                            </div>
                        </SwipeRow>
                    ))}
                    <AddRowButton count={data.d113.length} cap={CAPS['b.d113']} onAdd={() => addRow('d113')} label={t('新增量測排放源', 'Add measured source')} />
                </div>
            </CollapsibleSection>

            <EFDefaultsSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onSelect={applyFuel} />
        </div>
    );
};

export default B_EmInstSection;
