
import React from 'react';
import type { KeyValue } from '../types';
import { ROUTE_MAP, D_PROCESSES_L67_DETAILED_OPTIONS } from '../constants';
import { TextInput, SelectInput } from './FormControls';

interface Props {
    processId: string;
    productName: string;
    displayName?: string;
    data: KeyValue;
    setData: (data: KeyValue) => void;
    activeRoutes?: string[] | null;
    e83Rows: KeyValue[];
}

const APPLICABLE_OPTIONS = [
    { value: 'FALSE', label: 'No (否 / FALSE)' },
    { value: 'TRUE', label: 'Yes (是 / TRUE)' }
];

const ProcessForm: React.FC<Props> = ({ processId, productName, displayName, data, setData, activeRoutes, e83Rows }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const routesToUse = ROUTE_MAP[productName] || (productName !== "n.a." ? ROUTE_MAP["Default"] : []);
    
    const totalProduction = routesToUse.reduce((sum, route, index) => {
        if (activeRoutes && !activeRoutes.includes(route)) return sum;
        const cell = `L${16 + index}`;
        return sum + (parseFloat(data[cell] as string) || 0);
    }, 0);
    const l27Value = parseFloat(data.L27 as string) || 0;
    const skipInputs = totalProduction > 0 && totalProduction === l27Value;
    
    const isHeatApplicable = data.K50 === 'TRUE';
    const isWasteGasApplicable = data.L50 === 'TRUE';

    // Identify target processes for consumption
    // Requirement: Start filling from L32, but start the list from P2.
    // This implies P2 maps to L32, P3 maps to L33, etc. P1 is excluded from the list of consumers.
    // We slice from index 1 (P2) to 9 (P10 excluded, so up to P9).
    const targetProcesses = e83Rows.slice(1, 9).map((row, idx) => {
        const originalIndex = idx + 1; // slice starts at 1, so 0th item is index 1 (P2)
        return {
            id: `P${originalIndex + 1}`,
            name: row.l as string || row.e as string,
            index: originalIndex
        };
    }).filter(p => p.name && p.name !== 'n.a.' && p.id !== processId);

    const hasTargetProcesses = targetProcesses.length > 0;

    const renderSection = (title: string, content: React.ReactNode, disabled = false, message?: string) => (
        <div className={`bg-white rounded-lg shadow-sm border ${disabled ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
            <div className={`p-3 rounded-t-lg border-b ${disabled ? 'bg-slate-100' : 'bg-slate-50'}`}>
                <h4 className={`text-lg font-semibold ${disabled ? 'text-slate-400' : 'text-slate-600'}`}>{title}</h4>
            </div>
            <div className="p-6 relative">
                {disabled && message && (
                    <div className="absolute inset-0 z-10 bg-slate-50/40 flex items-center justify-center p-4 text-center">
                        <p className="bg-white px-4 py-2 rounded-full shadow-md text-amber-600 font-medium text-sm border border-amber-200 max-w-xs">
                            {message}
                        </p>
                    </div>
                )}
                <div className={disabled ? 'pointer-events-none select-none grayscale-[0.5]' : ''}>
                    {content}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50 animate-fadeIn">
            <h3 className="text-xl font-bold text-indigo-800 mb-4">
                {displayName || `Process ${processId}: ${productName}`}
            </h3>
            
            <div className="space-y-6">
                {/* (a) Total production levels */}
                {renderSection("(a) Total production levels (總產量水平)", (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productName.toLowerCase() === 'n.a.' ? (
                            <p className="col-span-full text-sm text-slate-500 italic">ℹ️ Process is 'n.a.', skipping production levels.</p>
                        ) : routesToUse.length > 0 ? (
                            routesToUse.map((route, index) => {
                                if (activeRoutes && !activeRoutes.includes(route)) return null;
                                const cell = `L${16 + index}`;
                                return <TextInput key={cell} label={`Amount: ${route}`} id={`${processId}-${cell}`} name={cell} type="number" required value={data[cell] as string || ''} onChange={handleChange} />;
                            })
                        ) : <p className="col-span-full text-sm text-slate-400">No specific routes defined.</p>}
                    </div>
                ))}

                {/* (b) Production details / Outputs */}
                {renderSection("(b) Production details (生產詳情/產出)", (
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput label="Produced for the market (產品產出至市場)" id={`${processId}-L27`} name="L27" type="number" required value={data.L27 as string || ''} onChange={handleChange} />
                    </div>
                ))}

                {/* (c) Consumed in other 'production processes' within the installation (L32-L39) */}
                {hasTargetProcesses && renderSection("(c) Consumed in other 'production processes' within the installation (設施內其他生產過程之消耗量)", (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Detailed breakdown by process (各生產過程詳細投入):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {targetProcesses.map((p) => {
                                // Mapping: P2 (index 1) -> L32. Formula: 32 + index - 1.
                                const cell = `L${32 + p.index - 1}`; 
                                return <TextInput key={cell} label={`Consumed in: ${p.name} (${p.id})`} id={`${processId}-${cell}`} name={cell} type="number" required value={data[cell] as string || ''} onChange={handleChange} />;
                            })}
                        </div>
                    </div>
                ), skipInputs, "L27 > 0 detected. Inputs (L32-L40) skipped. (偵測到產品產出至市場 > 0，依邏輯跳過投入細節填寫)")}

                {/* (d) Consumed for non-CBAM goods (L41) */}
                {renderSection("(d) Consumed for non-CBAM goods (非CBAM產品消耗量)", (
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput label="Consumed for non-CBAM goods within the installation (非CBAM產品消耗量)" id={`${processId}-L41`} name="L41" type="number" required value={data.L41 as string || ''} onChange={handleChange} />
                    </div>
                ), skipInputs, "L27 > 0 detected. Non-CBAM consumption (L41) skipped. (偵測到產品產出至市場 > 0，依邏輯跳過此項目填寫)")}

                {/* (f) Elements applicable */}
                {renderSection("(f) Elements applicable (適用元素選擇)", (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectInput 
                            label="Measurable Heat? (是否適用可量測熱能?)" 
                            id={`${processId}-K50`} 
                            name="K50" 
                            options={APPLICABLE_OPTIONS} 
                            required 
                            value={data.K50 as string || ''} 
                            onChange={handleChange} 
                        />
                        <SelectInput 
                            label="Waste Gas? (是否適用廢氣?)" 
                            id={`${processId}-L50`} 
                            name="L50" 
                            options={APPLICABLE_OPTIONS} 
                            required 
                            value={data.L50 as string || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                ))}

                {/* (g) Directly attributable emissions */}
                {renderSection("(g) Directly attributable emissions (直接歸屬排放)", (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productName.toLowerCase() === 'n.a.' ? (
                            <p className="col-span-full text-sm text-slate-500 italic">ℹ️ Process is 'n.a.', skipping emissions.</p>
                        ) : routesToUse.length > 0 ? (
                            routesToUse.map((route, index) => {
                                if (activeRoutes && !activeRoutes.includes(route)) return null;
                                const cell = `L${54 + index}`;
                                return <TextInput key={cell} label={`Direct Emissions: ${route}`} id={`${processId}-${cell}`} name={cell} type="number" required value={data[cell] as string || ''} onChange={handleChange} />;
                            })
                        ) : <p className="col-span-full text-sm text-slate-400">No specific routes defined.</p>}
                    </div>
                ))}

                {/* (h) Import/Export of Heat */}
                {renderSection("(h) Import/Export of Heat (可量測熱能進出口)", (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Imported Heat Amount (進口熱能數量)" id={`${processId}-L57`} name="L57" type="number" required value={data.L57 as string || ''} onChange={handleChange} />
                        <TextInput label="Exported Heat Amount (出口熱能數量)" id={`${processId}-M57`} name="M57" type="number" required value={data.M57 as string || ''} onChange={handleChange} />
                        <TextInput label="Imported Heat EF (進口熱能排放因子)" id={`${processId}-L58`} name="L58" type="number" required value={data.L58 as string || ''} onChange={handleChange} />
                        <TextInput label="Exported Heat EF (出口熱能排放因子)" id={`${processId}-M58`} name="M58" type="number" required value={data.M58 as string || ''} onChange={handleChange} />
                    </div>
                ), !isHeatApplicable, "Heat not applicable. (未選擇適用熱能)" )}

                {/* (i) Waste gases */}
                {renderSection("(i) Waste gases (廢氣)", (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Imported Waste Gas Amount (進口廢氣量)" id={`${processId}-L61`} name="L61" type="number" required value={data.L61 as string || ''} onChange={handleChange} />
                        <TextInput label="Exported Waste Gas Amount (出口廢氣量)" id={`${processId}-M61`} name="M61" type="number" required value={data.M61 as string || ''} onChange={handleChange} />
                        <TextInput label="Imported Waste Gas EF (進口廢氣排放因子)" id={`${processId}-L62`} name="L62" type="number" value={data.L62 as string || ''} onChange={handleChange} />
                        <TextInput label="Exported Waste Gas EF (出口廢氣排放因子)" id={`${processId}-M62`} name="M62" type="number" value={data.M62 as string || ''} onChange={handleChange} />
                    </div>
                ), !isWasteGasApplicable, "Waste gas not applicable. (未選擇適用廢氣)")}

                {/* (j) Indirect emissions from electricity */}
                {renderSection("(j) Indirect emissions from electricity (電力間接排放)", (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Electricity Consumption (電力消耗)" id={`${processId}-L65`} name="L65" type="number" required value={data.L65 as string || ''} onChange={handleChange} />
                        <TextInput label="Electricity EF (電力排放因子)" id={`${processId}-L66`} name="L66" type="number" required value={data.L66 as string || ''} onChange={handleChange} />
                        <div className="md:col-span-2">
                           <SelectInput label="Electricity EF Source (電力排放因子方法)" id={`${processId}-L67`} name="L67" options={D_PROCESSES_L67_DETAILED_OPTIONS} required value={data.L67 as string || ''} onChange={handleChange} />
                        </div>
                    </div>
                ))}
                
                 {/* (k) Electricity exported */}
                 {renderSection("(k) Electricity exported (出口電力)", (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Exported Amount (出口數量)" id={`${processId}-L71`} name="L71" type="number" required value={data.L71 as string || ''} onChange={handleChange} />
                        <TextInput label="Exported Electricity EF (出口電力排放因子)" id={`${processId}-L72`} name="L72" type="number" required value={data.L72 as string || ''} onChange={handleChange} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessForm;
