
import React, { useState, useEffect } from 'react';
import type { A_InstData, KeyValue } from '../types';
import { E62_OPTIONS, E83_BASE_OPTIONS, COUNTRY_NAMES, COUNTRY_CODES, ROUTE_MAP, CATEGORIES_WITH_ROUTES } from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { TextInput, SelectInput, Button, SearchableSelect } from './FormControls';

interface Props {
    data: A_InstData;
    setData: (data: A_InstData) => void;
}

// Helper component to handle dynamic display of optional route/category fields
const DynamicSelectGroup = ({ 
    row, 
    section, 
    rowIndex, 
    columns, 
    labels, 
    options, 
    requiredFirst, 
    onChange, 
    disabledCheck 
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
    // Calculate how many fields actually have data
    const filledCount = columns.reduce((acc: number, col: string, idx: number) => {
        return (row[col] && String(row[col]).trim() !== "") ? idx + 1 : acc;
    }, 0);
    
    // Initial state: show at least 1, or up to the last filled field
    const [visibleCount, setVisibleCount] = useState(Math.max(1, filledCount));

    // Update visibility if data changes externally (e.g. file upload)
    useEffect(() => {
        setVisibleCount(prev => Math.max(prev, filledCount));
    }, [filledCount]);

    const handleAdd = () => {
        if (visibleCount < columns.length) {
            setVisibleCount(prev => prev + 1);
        }
    };

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
                <div className="lg:col-span-2 flex items-end pb-2">
                    <button 
                        type="button"
                        onClick={handleAdd}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center bg-indigo-50 px-3 py-1 rounded border border-indigo-200"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Add Next (新增下一項)
                    </button>
                </div>
            )}
        </>
    );
};

const A_InstDataSection: React.FC<Props> = ({ data, setData }) => {

    const handleStaticChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({ ...data, static: { ...data.static, [e.target.id]: e.target.value } });
    };

    const handleDynamicChange = <T extends keyof A_InstData,>(section: T, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    // Helper for SearchableSelect which returns value directly
    const updateDynamicValue = <T extends keyof A_InstData,>(section: T, index: number, name: string, value: string) => {
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    const addRow = <T extends keyof A_InstData,>(section: T) => {
        setData({ ...data, [section]: [...(data[section] as KeyValue[]), {}] });
    };

    const removeRow = <T extends keyof A_InstData,>(section: T, index: number) => {
        const updatedSection = (data[section] as KeyValue[]).filter((_, i) => i !== index);
        setData({ ...data, [section]: updatedSection });
    };

    const e62Goods: string[] = Array.from(new Set(data.e62.map(row => row.e as string).filter(val => val && val !== "n.a.")));
    const e83E_Options: string[] = Array.from(new Set(e62Goods.concat(["n.a."]))).sort();
    const e83FK_Options: string[] = Array.from(new Set(e62Goods.concat(E83_BASE_OPTIONS))).sort();

    return (
        <CollapsibleSection title="A_InstData: General information, production processes and purchased precursors" noCollapse={true}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-4">1. Reporting Period & Installation Info (報告期與設施資訊)</h3>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TextInput label="Reporting Start Date (報告開始日期)" id="I9" type="date" required onChange={handleStaticChange} value={data.static.I9 as string || ''} />
                        <TextInput label="Reporting End Date (報告結束日期)" id="L9" type="date" required onChange={handleStaticChange} value={data.static.L9 as string || ''} />
                        <div className="md:col-span-2 lg:col-span-3 h-px bg-slate-200 my-4"></div>
                        <TextInput label="Name of the installation (English name) (設施名稱 - 英文)" id="I20" type="text" required onChange={handleStaticChange} value={data.static.I20 as string || ''} />
                        <TextInput label="Street, Number (街道, 門牌)" id="I21" type="text" required onChange={handleStaticChange} value={data.static.I21 as string || ''} />
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
                            <TextInput label="UN/LOCODE" id="I27" type="text" required onChange={handleStaticChange} value={data.static.I27 as string || ''} />
                            <a 
                                href="https://service.unece.org/trade/locode/tw.htm#:~:text=United%20Nations,Trade%20and%20Transport%20Locations%20(UN%2FLOCODE)" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                            >
                                UN/LOCODE 搜尋網站
                            </a>
                        </div>
                        
                        <TextInput label="Coordinates of the main emission source (latitude) (主要排放源緯度)" id="I28" type="text" required onChange={handleStaticChange} value={data.static.I28 as string || ''} />
                        <TextInput label="Coordinates of the main emission source (longitude) (主要排放源經度)" id="I29" type="text" required onChange={handleStaticChange} value={data.static.I29 as string || ''} />
                        
                        <div className="md:col-span-2 lg:col-span-3 h-px bg-slate-200 my-4"></div>
                        <TextInput label="Name of Installation (Local) (設施名稱 - 可選)" id="I19" type="text" onChange={handleStaticChange} value={data.static.I19 as string || ''} />
                        <TextInput label="Economic Activity (經濟活動)" id="I22" type="text" onChange={handleStaticChange} value={data.static.I22 as string || ''} />
                        
                        <TextInput label="Authorized Representative (授權代表姓名)" id="I30" type="text" onChange={handleStaticChange} value={data.static.I30 as string || ''} />
                        <TextInput label="Email" id="I31" type="email" onChange={handleStaticChange} value={data.static.I31 as string || ''} />
                        <TextInput label="Telephone (電話)" id="I32" type="tel" onChange={handleStaticChange} value={data.static.I32 as string || ''} />
                    </div>
                </div>

                <CollapsibleSection title="4. Aggregated goods categories and relevant production processes (聚合商品類別與相關生產過程)" isSubSection noCollapse={true}>
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-md font-bold text-slate-700 mb-3">(a) List of aggregated goods categories (聚合商品類別列表)</h4>
                            <div className="space-y-4">
                                {data.e62.map((row, index) => {
                                    const selectedGoods = row.e as string;
                                    const routes: string[] = ROUTE_MAP[selectedGoods] || (selectedGoods && selectedGoods !== "n.a." ? ROUTE_MAP["Default"] : []);
                                    const routeColumns = ['i', 'j', 'k', 'l', 'm', 'n'];
                                    const routeLabels = routeColumns.map((_, i) => `Route ${i + 1} (路徑 ${i + 1})`);
                                    
                                    // Only show routes for specific categories
                                    const showRoutes = selectedGoods && CATEGORIES_WITH_ROUTES.includes(selectedGoods);

                                    return (
                                        <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                                    <p className="font-semibold text-slate-600">Aggregated goods category <span className="font-bold">#{index + 1}</span></p>
                                                    <Button variant="remove" onClick={() => removeRow('e62', index)} aria-label="Remove E62 item" />
                                                </div>
                                                <div className="lg:col-span-2">
                                                    <SelectInput label="Aggregated goods category (商品類別)" id={`e62-e-${index}`} name="e" options={E62_OPTIONS} required value={row.e as string || ''} onChange={e => handleDynamicChange('e62', index, e)} />
                                                </div>
                                                <div className="lg:col-span-2"></div>
                                                
                                                {showRoutes && (
                                                    <DynamicSelectGroup
                                                        row={row}
                                                        section="e62"
                                                        rowIndex={index}
                                                        columns={routeColumns}
                                                        labels={routeLabels}
                                                        options={routes}
                                                        requiredFirst={true}
                                                        onChange={handleDynamicChange}
                                                        disabledCheck={(col) => routes.length === 0 || (selectedGoods === "Electricity (export to EU)" && col !== 'i')}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <Button onClick={() => addRow('e62')}>Add Next Line (新增下一行)</Button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-md font-bold text-slate-700 mb-3">(b) Relevant production processes (相關生產過程)</h4>
                            <div className="space-y-4">
                                {data.e83.map((row, index) => {
                                    const catColumns = ['f', 'g', 'h', 'i', 'j', 'k'];
                                    const catLabels = catColumns.map((_, i) => `Included goods categories ${i + 1} (包含類別)`);
                                    const selectedCat = row.e as string;
                                    const showIncluded = selectedCat && selectedCat !== 'n.a.';

                                    return (
                                        <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                                    <p className="font-semibold text-slate-600">Process <span className="font-bold">P{index + 1}</span></p>
                                                    <Button variant="remove" onClick={() => removeRow('e83', index)} aria-label="Remove E83 item" />
                                                </div>
                                                <div className="lg:col-span-2"><SelectInput label="Aggregated goods category (商品類別)" id={`e83-e-${index}`} name="e" options={e83E_Options} required value={row.e as string || ''} onChange={e => handleDynamicChange('e83', index, e)} /></div>
                                                <div className="lg:col-span-2"><TextInput label="Name (生產過程名稱)" id={`e83-l-${index}`} name="l" type="text" required value={row.l as string || ''} onChange={e => handleDynamicChange('e83', index, e)} /></div>
                                                
                                                {showIncluded && (
                                                    <DynamicSelectGroup
                                                        row={row}
                                                        section="e83"
                                                        rowIndex={index}
                                                        columns={catColumns}
                                                        labels={catLabels}
                                                        options={e83FK_Options}
                                                        requiredFirst={true}
                                                        onChange={handleDynamicChange}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <Button onClick={() => addRow('e83')}>Add Next Line (新增下一行)</Button>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                 <CollapsibleSection title="5. Purchased precursors (採購前導物)" isSubSection noCollapse={true}>
                    <div className="space-y-4">
                        {data.e102.map((row, index) => {
                            const selectedGoods = row.e as string;
                            const routes: string[] = ROUTE_MAP[selectedGoods] || (selectedGoods && selectedGoods !== "n.a." ? ROUTE_MAP["Default"] : []);
                            
                            // Only show routes for specific categories
                            const showRoutes = selectedGoods && CATEGORIES_WITH_ROUTES.includes(selectedGoods);
                            
                            const routeColumns = ['g', 'h', 'i', 'j', 'k'];
                            const routeLabels = routeColumns.map((_, i) => `Route ${i + 1} (路徑 ${i + 1})`);

                            return (
                                <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                            <p className="font-semibold text-slate-600">Purchased Precursor <span className="font-bold">#{index + 1}</span></p>
                                            <Button variant="remove" onClick={() => removeRow('e102', index)} aria-label="Remove E102 item" />
                                        </div>
                                        <div><SelectInput label="Production process (生產過程)" id={`e102-e-${index}`} name="e" options={E62_OPTIONS} value={row.e as string || ''} onChange={e => handleDynamicChange('e102', index, e)} /></div>
                                        
                                        <div>
                                            <SearchableSelect 
                                                label="Country code (國家代碼)" 
                                                id={`e102-f-${index}`} 
                                                options={COUNTRY_CODES} 
                                                value={row.f as string || ''} 
                                                onChange={(value) => updateDynamicValue('e102', index, 'f', value)}
                                            />
                                        </div>
                                        
                                        <div className="lg:col-span-2"><TextInput label="Name (名稱)" id={`e102-l-${index}`} name="l" type="text" value={row.l as string || ''} onChange={e => handleDynamicChange('e102', index, e)} required={!!selectedGoods && selectedGoods !== 'n.a.'} /></div>
                                        
                                        {showRoutes && (
                                            <DynamicSelectGroup
                                                row={row}
                                                section="e102"
                                                rowIndex={index}
                                                columns={routeColumns}
                                                labels={routeLabels}
                                                options={routes}
                                                requiredFirst={true}
                                                onChange={handleDynamicChange}
                                                disabledCheck={(col) => routes.length === 0}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <Button onClick={() => addRow('e102')}>Add Next Line (新增下一行)</Button>
                    </div>
                </CollapsibleSection>
            </div>
        </CollapsibleSection>
    );
};

export default A_InstDataSection;
