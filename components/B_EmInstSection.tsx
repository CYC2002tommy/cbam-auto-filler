
import React, { useState } from 'react';
import type { B_EmInst, KeyValue } from '../types';
import { D17_OPTIONS_METHOD, D17_OPTIONS_G_UNIT, D17_OPTIONS_K_EF_UNIT, D98_OPTIONS_PFC, D113_E_OPTIONS } from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { TextInput, SelectInput, Button } from './FormControls';
import EFDefaultsSearchModal from './EFDefaultsSearchModal';

interface Props {
    data: B_EmInst;
    setData: (data: B_EmInst) => void;
}

const B_EmInstSection: React.FC<Props> = ({ data, setData }) => {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);

    const handleDynamicChange = <T extends keyof B_EmInst,>(section: T, index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedSection = [...(data[section] as KeyValue[])];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        setData({ ...data, [section]: updatedSection });
    };

    const addRow = <T extends keyof B_EmInst,>(section: T) => {
        setData({ ...data, [section]: [...(data[section] as KeyValue[]), {}] });
    };

    const removeRow = <T extends keyof B_EmInst,>(section: T, index: number) => {
        const updatedSection = (data[section] as KeyValue[]).filter((_, i) => i !== index);
        setData({ ...data, [section]: updatedSection });
    };

    const openSearchModal = (index: number) => {
        setCurrentRowIndex(index);
        setIsSearchModalOpen(true);
    };

    const handleDefaultSelect = (code: string, description: string, value: number) => {
        if (currentRowIndex !== null) {
            const updatedD17 = [...data.d17];
            const currentItem = updatedD17[currentRowIndex] || {};
            
            updatedD17[currentRowIndex] = {
                ...currentItem,
                e: description || code, // Source stream name
                j: value, // Emission factor
                k: 'tCO2/t' // Unit default
            };
            
            setData({ ...data, d17: updatedD17 });
        }
    };

    return (
        <CollapsibleSection title="B_EmInst: Installation's emission at source stream and emission source level" noCollapse={true}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-4">(a) Calculation based approaches: Source Streams (excluding PFC emissions)</h3>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 space-y-4">
                        {data.d17.map((row, index) => {
                             const method = row.d as string;
                             const isMassBalance = method === 'Mass Balance';
                             const isCombustion = method === 'Combustion';
                             const isProcessEmissions = method === 'Process emissions';

                             // Visibility Logic:
                             // Mass Balance: Hide EF (J, K). Show Carbon Content (L, M) as required in top section.
                             // Process emissions: Hide Carbon Content (L, M), Oxidation (N). Show EF (J, K).
                             // Combustion: Hide Carbon Content (L, M), Conversion (P). Show EF (J, K).
                             
                             const showEF_Top = !isMassBalance; // J, K (Shown for Combustion & Process)
                             const showCarbonContent_Top = isMassBalance; // L, M (Shown for Mass Balance, now top)
                             
                             // Bottom section optional fields
                             const showOxidationFactor = isCombustion; // N
                             const showConversionFactor = isProcessEmissions; // P
                             
                             // Only show search button if method is Combustion
                             const showSearchButton = isCombustion;

                             return (
                                <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                             <span className="font-semibold text-slate-700">Source Stream #{index + 1}</span>
                                            <Button variant="remove" onClick={() => removeRow('d17', index)} aria-label="Remove D17 item" />
                                        </div>
                                        
                                        {/* Required Fields Group */}
                                        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                                            <SelectInput label="Method (方法)" id={`d17-d-${index}`} name="d" options={D17_OPTIONS_METHOD} required value={row.d as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                            
                                            <div className="relative">
                                                <TextInput 
                                                    label="Source stream name (來源流名稱)" 
                                                    id={`d17-e-${index}`} 
                                                    name="e" 
                                                    type="text" 
                                                    required 
                                                    value={row.e as string || ''} 
                                                    onChange={e => handleDynamicChange('d17', index, e)} 
                                                />
                                                {showSearchButton && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openSearchModal(index)}
                                                        className="absolute top-0 right-0 mt-7 mr-2 text-indigo-600 hover:text-indigo-800"
                                                        title="Search Default Value (搜尋預設值)"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <TextInput label="Activity data (AD) (活動數據)" id={`d17-f-${index}`} name="f" type="number" required value={row.f as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                            <SelectInput label="AD Unit (單位)" id={`d17-g-${index}`} name="g" options={D17_OPTIONS_G_UNIT} required value={row.g as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                            <TextInput 
                                                label="Net calorific value (NCV) (淨熱值)" 
                                                id={`d17-h-${index}`} 
                                                name="h" 
                                                type="number" 
                                                required={!isProcessEmissions && !isMassBalance} 
                                                value={row.h as string || ''} 
                                                onChange={e => handleDynamicChange('d17', index, e)} 
                                            />
                                            
                                            {showEF_Top && (
                                                <>
                                                    <div className="relative">
                                                        <TextInput 
                                                            label="Emission factor (EF) (排放因子)" 
                                                            id={`d17-j-${index}`} 
                                                            name="j" 
                                                            type="number" 
                                                            required 
                                                            value={row.j as string || ''} 
                                                            onChange={e => handleDynamicChange('d17', index, e)} 
                                                        />
                                                    </div>
                                                    <SelectInput label="EF Unit (排放因子單位)" id={`d17-k-${index}`} name="k" options={D17_OPTIONS_K_EF_UNIT} required value={row.k as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                                </>
                                            )}

                                            {showCarbonContent_Top && (
                                                <TextInput label="Carbon content (碳含量)" id={`d17-l-${index}`} name="l" type="number" required value={row.l as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                            )}
                                        </div>

                                        {/* Separator for Optional/Conditional Fields */}
                                        <div className="lg:col-span-4 h-px bg-slate-200 my-1"></div>
                                        <div className="lg:col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Additional / Optional Data</div>
                                        
                                        {/* Oxidation Factor - Combustion Only */}
                                        {showOxidationFactor && (
                                            <TextInput label="Oxidation factor (OxF) (氧化因子)" id={`d17-n-${index}`} name="n" type="number" value={row.n as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                        )}
                                        
                                        {/* Conversion Factor - Process Emissions Only */}
                                        {showConversionFactor && (
                                            <TextInput label="Conversion factor (ConvF) (轉換因子)" id={`d17-p-${index}`} name="p" type="number" value={row.p as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                        )}
                                        
                                        <TextInput label="Biomass content (BioC) (生質含量)" id={`d17-r-${index}`} name="r" type="number" value={row.r as string || ''} onChange={e => handleDynamicChange('d17', index, e)} />
                                    </div>
                                </div>
                             );
                        })}
                        <Button onClick={() => addRow('d17')}>Add Next Line (新增下一行)</Button>
                    </div>
                </div>
                
                <CollapsibleSection title="(b) PFC (perfluorocarbon) emissions (PFC 排放) - Optional (非必填)" isSubSection>
                    <div className="space-y-4">
                        {data.d98.map((row, index) => (
                             <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                        <span className="font-semibold text-slate-700">PFC Source #{index + 1}</span>
                                        <Button variant="remove" onClick={() => removeRow('d98', index)} aria-label="Remove D98 item"/>
                                    </div>

                                    {/* Required Fields Group */}
                                    <SelectInput label="Method (方法)" id={`d98-d-${index}`} name="d" options={D98_OPTIONS_PFC} value={row.d as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    <TextInput label="Source stream name (來源流名稱)" id={`d98-e-${index}`} name="e" type="text" value={row.e as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />
                                    
                                    {/* Separator */}
                                    <div className="lg:col-span-4 h-px bg-slate-200 my-1"></div>
                                    <div className="lg:col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Additional / Optional Data</div>

                                    <div className="lg:col-span-2"><TextInput label="Activity data (AD) (活動數據)" id={`d98-f-${index}`} name="f" type="number" value={row.f as string || ''} onChange={e => handleDynamicChange('d98', index, e)} /></div>
                                    
                                    <div className="lg:col-span-4 mt-2 mb-2">
                                        <p className="font-medium text-sm text-slate-600 mb-2">Emission Factor / Precursor (排放係數 / 前驅物)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {['ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au'].map(col => {
                                                const labels: Record<string, string> = { ag: "EF - CO2", ah: "EF - N2O", ai: "EF - CH4", aj: "EF - PFCs", ak: "EF - Other GHGs", al: "Precursor - NOX", am: "Precursor - SO2", an: "Precursor - PM", ao: "Precursor - Pb+Cd", ap: "Precursor - Hg", aq: "Precursor - As+Cr+Ni", ar: "Precursor - B(a)P", as: "Precursor - Dioxins", at: "Precursor - HF", au: "Precursor - Other" };
                                                return <TextInput key={col} label={`${labels[col]}`} id={`d98-${col}-${index}`} name={col} type="number" value={row[col] as string || ''} onChange={e => handleDynamicChange('d98', index, e)} />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button onClick={() => addRow('d98')}>Add Next Line (新增下一行)</Button>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="(c) Measurement-Based Approaches: Emissions Sources (基于測量的方法 - 排除 PFC) - Optional (非必填)" isSubSection>
                    <div className="space-y-4">
                        {data.d113.map((row, index) => (
                             <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                     <div className="lg:col-span-4 flex justify-between items-center mb-2">
                                        <span className="font-semibold text-slate-700">Measurement Source #{index + 1}</span>
                                        <Button variant="remove" onClick={() => removeRow('d113', index)} aria-label="Remove D113 item"/>
                                    </div>
                                    
                                    {/* Required Fields Group */}
                                    <div className="lg:col-span-2"><TextInput label="Name (名稱)" id={`d113-d-${index}`} name="d" type="text" value={row.d as string || ''} onChange={e => handleDynamicChange('d113', index, e)} /></div>
                                    <div className="lg:col-span-2"><SelectInput label="Type of GHG (溫室氣體類型)" id={`d113-e-${index}`} name="e" options={D113_E_OPTIONS} value={row.e as string || ''} onChange={e => handleDynamicChange('d113', index, e)} /></div>

                                    {/* Separator */}
                                    <div className="lg:col-span-4 h-px bg-slate-200 my-1"></div>
                                    <div className="lg:col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Additional / Optional Data</div>

                                    <TextInput label="Biomass fraction (BioC) (生質比例)" id={`d113-r-${index}`} name="r" type="number" value={row.r as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                    <TextInput label="Hourly GHG conc. Avg (每小時平均濃度)" id={`d113-v-${index}`} name="v" type="number" value={row.v as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                    <TextInput label="Hours operating (操作時數)" id={`d113-x-${index}`} name="x" type="number" value={row.x as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                    <TextInput label="Flue gas flow (avg) (平均煙氣流量)" id={`d113-z-${index}`} name="z" type="number" value={row.z as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                    <TextInput label="Energy content (fossil) (化石能源含量)" id={`d113-ax-${index}`} name="ax" type="number" value={row.ax as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                    <TextInput label="Energy content (bio) (生物能源含量)" id={`d113-ay-${index}`} name="ay" type="number" value={row.ay as string || ''} onChange={e => handleDynamicChange('d113', index, e)} />
                                </div>
                            </div>
                        ))}
                         <Button onClick={() => addRow('d113')}>Add Next Line (新增下一行)</Button>
                    </div>
                </CollapsibleSection>
            </div>
            
            <EFDefaultsSearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
                onSelect={handleDefaultSelect} 
            />
        </CollapsibleSection>
    );
};

export default B_EmInstSection;
