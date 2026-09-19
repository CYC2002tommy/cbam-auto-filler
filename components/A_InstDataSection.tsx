import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import type { A_InstData, KeyValue } from '../types';
import { E62_OPTIONS, E83_BASE_OPTIONS, COUNTRY_NAMES, COUNTRY_CODES, ROUTE_MAP, CATEGORIES_WITH_ROUTES } from '../constants';
import { TextInput, SelectInput, SearchableSelect } from './FormControls';
import { Heading, Group } from './Layout';
import { SwipeRow, AddRowButton, CAPS } from '../ui/rows';
import { useT, useLabel } from '../ui/prefs';
import { useUndo } from '../ui/undo';

interface Props {
    data: A_InstData;
    setData: (data: A_InstData) => void;
}

// Optional route / category selects that reveal one at a time.
const DynamicSelectGroup = ({
    row, section, rowIndex, columns, labels, options, requiredFirst, onChange, disabledCheck,
}: {
    row: KeyValue,
    section: keyof A_InstData,
    rowIndex: number,
    columns: string[],
    labels: string[],
    options: string[],
    requiredFirst: boolean,
    onChange: (section: keyof A_InstData, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    disabledCheck?: (col: string) => boolean
}) => {
    const t = useT();
    const filledCount = columns.reduce((acc: number, col: string, idx: number) => (row[col] && String(row[col]).trim() !== '') ? idx + 1 : acc, 0);
    const [visibleCount, setVisibleCount] = useState(Math.max(1, filledCount));

    useEffect(() => {
        setVisibleCount(prev => Math.max(prev, filledCount));
    }, [filledCount]);

    return (
        <>
            {columns.slice(0, visibleCount).map((col: string, idx: number) => (
                <div key={col}>
                    <SelectInput
                        label={labels[idx]}
                        id={`${section}-${col}-${rowIndex}`}
                        name={col}
                        options={options}
                        value={row[col] as string || ''}
                        onChange={e => onChange(section, rowIndex, e)}
                        required={idx === 0 && requiredFirst}
                        disabled={disabledCheck ? disabledCheck(col) : false}
                    />
                </div>
            ))}
            {visibleCount < columns.length && (
                <div className="flex items-end pb-1">
                    <button
                        type="button"
                        onClick={() => setVisibleCount(c => Math.min(columns.length, c + 1))}
                        className="pressable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-500/10"
                    >
                        <Plus size={15} />
                        {t('再加一項', 'Add another')}
                    </button>
                </div>
            )}
        </>
    );
};

const A_InstDataSection: React.FC<Props> = ({ data, setData }) => {
    const t = useT();
    const label = useLabel();
    const captureUndo = useUndo();

    const handleStaticChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({ ...data, static: { ...data.static, [e.target.id]: e.target.value } });
    };

    const handleDynamicChange = <T extends keyof A_InstData,>(section: T, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    const updateDynamicValue = <T extends keyof A_InstData,>(section: T, index: number, name: string, value: string) => {
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    const addRow = <T extends keyof A_InstData,>(section: T) => {
        setData({ ...data, [section]: [...(data[section] as KeyValue[]), {}] });
    };

    const removeRow = <T extends keyof A_InstData,>(section: T, index: number, what: string) => {
        captureUndo(t(`已刪除${what}`, `Deleted ${what}`));
        const updatedSection = (data[section] as KeyValue[]).filter((_, i) => i !== index);
        setData({ ...data, [section]: updatedSection });
    };

    const e62Goods: string[] = Array.from(new Set(data.e62.map(row => row.e as string).filter(val => val && val !== 'n.a.')));
    const e83E_Options: string[] = Array.from(new Set(e62Goods.concat(['n.a.']))).sort();
    const e83FK_Options: string[] = Array.from(new Set(e62Goods.concat(E83_BASE_OPTIONS))).sort();

    return (
        <div className="space-y-8">
            <Group>
                <Heading label="1. Reporting period and installation (報告期間與設施)" />
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                    <TextInput label="Reporting Start Date (報告開始日期)" id="I9" type="date" required onChange={handleStaticChange} value={data.static.I9 as string || ''} />
                    <TextInput label="Reporting End Date (報告結束日期)" id="L9" type="date" required onChange={handleStaticChange} value={data.static.L9 as string || ''} />
                    <div className="hairline my-1 border-t md:col-span-2 lg:col-span-3" />
                    <TextInput label="Name of the installation (English name) (設施名稱（英文）)" id="I20" type="text" required onChange={handleStaticChange} value={data.static.I20 as string || ''} />
                    <TextInput label="Street, Number (街道、門牌)" id="I21" type="text" required onChange={handleStaticChange} value={data.static.I21 as string || ''} />
                    <TextInput label="P.O. Box (郵政信箱)" id="I24" type="text" required onChange={handleStaticChange} value={data.static.I24 as string || ''} />
                    <TextInput label="City (城市)" id="I25" type="text" required onChange={handleStaticChange} value={data.static.I25 as string || ''} />
                    <TextInput label="Postcode (郵遞區號)" id="I23" type="text" required onChange={handleStaticChange} value={data.static.I23 as string || ''} />
                    <SearchableSelect
                        label="Country (國家)"
                        id="I26"
                        options={COUNTRY_NAMES}
                        value={data.static.I26 as string || ''}
                        required
                        onChange={(value) => setData({ ...data, static: { ...data.static, I26: value } })}
                    />
                    <div>
                        <TextInput label="UN/LOCODE (聯合國地點代碼)" id="I27" type="text" required onChange={handleStaticChange} value={data.static.I27 as string || ''} />
                        <a
                            href="https://service.unece.org/trade/locode/tw.htm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                        >
                            {t('查詢台灣的 UN/LOCODE', 'Look up Taiwan UN/LOCODEs')} <ExternalLink size={12} />
                        </a>
                    </div>
                    <TextInput label="Coordinates of the main emission source (latitude) (主要排放源緯度)" id="I28" type="text" required onChange={handleStaticChange} value={data.static.I28 as string || ''} />
                    <TextInput label="Coordinates of the main emission source (longitude) (主要排放源經度)" id="I29" type="text" required onChange={handleStaticChange} value={data.static.I29 as string || ''} />
                    <div className="hairline my-1 border-t md:col-span-2 lg:col-span-3" />
                    <TextInput label="Name of the installation (local language) (設施名稱（在地語言，選填）)" id="I19" type="text" onChange={handleStaticChange} value={data.static.I19 as string || ''} />
                    <TextInput label="Economic activity (經濟活動)" id="I22" type="text" onChange={handleStaticChange} value={data.static.I22 as string || ''} />
                    <TextInput label="Authorised representative (授權代表姓名)" id="I30" type="text" onChange={handleStaticChange} value={data.static.I30 as string || ''} />
                    <TextInput label="Email (電子郵件)" id="I31" type="email" onChange={handleStaticChange} value={data.static.I31 as string || ''} />
                    <TextInput label="Telephone (電話)" id="I32" type="tel" onChange={handleStaticChange} value={data.static.I32 as string || ''} />
                </div>
            </Group>

            <section className="space-y-4">
                <Heading label="4(a). Aggregated goods categories (彙總商品類別)" note={label('Every CBAM good you export belongs to one category; list each category once. (你出口的每項 CBAM 商品都屬於一個類別，每個類別列一次。)')} />
                {data.e62.map((row, index) => {
                    const selectedGoods = row.e as string;
                    const routes: string[] = ROUTE_MAP[selectedGoods] || (selectedGoods && selectedGoods !== 'n.a.' ? ROUTE_MAP['Default'] : []);
                    const routeColumns = ['i', 'j', 'k', 'l', 'm', 'n'];
                    const routeLabels = routeColumns.map((_, i) => `Route ${i + 1} (生產路徑 ${i + 1})`);
                    const showRoutes = selectedGoods && CATEGORIES_WITH_ROUTES.includes(selectedGoods);
                    return (
                        <SwipeRow key={index} onDelete={() => removeRow('e62', index, t(`商品類別 G${index + 1}`, `category G${index + 1}`))} label={`G${index + 1}`}>
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">G{index + 1}</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="lg:col-span-2">
                                    <SelectInput label="Aggregated goods category (商品類別)" id={`e62-e-${index}`} name="e" options={E62_OPTIONS} required value={row.e as string || ''} onChange={e => handleDynamicChange('e62', index, e)} />
                                </div>
                                <div className="hidden lg:col-span-2 lg:block" />
                                {showRoutes && (
                                    <DynamicSelectGroup
                                        row={row} section="e62" rowIndex={index} columns={routeColumns} labels={routeLabels} options={routes}
                                        requiredFirst={true} onChange={handleDynamicChange}
                                        disabledCheck={(col) => routes.length === 0 || (selectedGoods === 'Electricity (export to EU)' && col !== 'i')}
                                    />
                                )}
                            </div>
                        </SwipeRow>
                    );
                })}
                <AddRowButton count={data.e62.length} cap={CAPS['a.e62']} onAdd={() => addRow('e62')} label={t('新增商品類別', 'Add category')} />
            </section>

            <section className="space-y-4">
                <Heading label="4(b). Production processes (生產過程)" note={label('Each process becomes P1, P2… and gets its own page under Production processes. (每個過程編號為 P1、P2…，並在「生產過程」有自己的一頁。)')} />
                {data.e83.map((row, index) => {
                    const catColumns = ['f', 'g', 'h', 'i', 'j', 'k'];
                    const catLabels = catColumns.map((_, i) => `Included goods category ${i + 1} (包含的商品類別 ${i + 1})`);
                    const selectedCat = row.e as string;
                    const showIncluded = selectedCat && selectedCat !== 'n.a.';
                    return (
                        <SwipeRow key={index} onDelete={() => removeRow('e83', index, t(`生產過程 P${index + 1}`, `process P${index + 1}`))} label={`P${index + 1}`}>
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">P{index + 1}</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="lg:col-span-2"><SelectInput label="Aggregated goods category (商品類別)" id={`e83-e-${index}`} name="e" options={e83E_Options} required value={row.e as string || ''} onChange={e => handleDynamicChange('e83', index, e)} /></div>
                                <div className="lg:col-span-2"><TextInput label="Name of the production process (生產過程名稱)" id={`e83-l-${index}`} name="l" type="text" required value={row.l as string || ''} onChange={e => handleDynamicChange('e83', index, e)} /></div>
                                {showIncluded && (
                                    <DynamicSelectGroup
                                        row={row} section="e83" rowIndex={index} columns={catColumns} labels={catLabels} options={e83FK_Options}
                                        requiredFirst={true} onChange={handleDynamicChange}
                                    />
                                )}
                            </div>
                        </SwipeRow>
                    );
                })}
                <AddRowButton count={data.e83.length} cap={CAPS['a.e83']} onAdd={() => addRow('e83')} label={t('新增生產過程', 'Add process')} />
            </section>

            <section className="space-y-4">
                <Heading label="5. Purchased precursors (採購前驅物)" note={label('Inputs such as steel wire rod bought from other plants. For screws these carry most of the embedded emissions. (例如向其他工廠購買的盤元；螺絲的內含排放大多來自這裡。)')} />
                {data.e102.map((row, index) => {
                    const selectedGoods = row.e as string;
                    const routes: string[] = ROUTE_MAP[selectedGoods] || (selectedGoods && selectedGoods !== 'n.a.' ? ROUTE_MAP['Default'] : []);
                    const showRoutes = selectedGoods && CATEGORIES_WITH_ROUTES.includes(selectedGoods);
                    const routeColumns = ['g', 'h', 'i', 'j', 'k'];
                    const routeLabels = routeColumns.map((_, i) => `Route ${i + 1} (生產路徑 ${i + 1})`);
                    return (
                        <SwipeRow key={index} onDelete={() => removeRow('e102', index, t(`前驅物 PP${index + 1}`, `precursor PP${index + 1}`))} label={`PP${index + 1}`}>
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">PP{index + 1}</div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div><SelectInput label="Aggregated goods category (商品類別)" id={`e102-e-${index}`} name="e" options={E62_OPTIONS} value={row.e as string || ''} onChange={e => handleDynamicChange('e102', index, e)} /></div>
                                <div>
                                    <SearchableSelect
                                        label="Country code (原產國代碼)"
                                        id={`e102-f-${index}`}
                                        options={COUNTRY_CODES}
                                        value={row.f as string || ''}
                                        onChange={(value) => updateDynamicValue('e102', index, 'f', value)}
                                    />
                                </div>
                                <div className="lg:col-span-2"><TextInput label="Name (前驅物名稱)" id={`e102-l-${index}`} name="l" type="text" value={row.l as string || ''} onChange={e => handleDynamicChange('e102', index, e)} required={!!selectedGoods && selectedGoods !== 'n.a.'} /></div>
                                {showRoutes && (
                                    <DynamicSelectGroup
                                        row={row} section="e102" rowIndex={index} columns={routeColumns} labels={routeLabels} options={routes}
                                        requiredFirst={true} onChange={handleDynamicChange}
                                        disabledCheck={() => routes.length === 0}
                                    />
                                )}
                            </div>
                        </SwipeRow>
                    );
                })}
                <AddRowButton count={data.e102.length} cap={CAPS['a.e102']} onAdd={() => addRow('e102')} label={t('新增前驅物', 'Add precursor')} />
            </section>
        </div>
    );
};

export default A_InstDataSection;
