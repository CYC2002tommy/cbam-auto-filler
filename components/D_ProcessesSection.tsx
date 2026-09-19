
import React, { useState, useEffect } from 'react';
import type { D_Processes, KeyValue } from '../types';
import CollapsibleSection from './CollapsibleSection';
import ProcessForm from './ProcessForm';
import { SelectInput } from './FormControls';
import { CATEGORIES_WITH_ROUTES } from '../constants';

interface Props {
    data: D_Processes;
    setData: (data: D_Processes) => void;
    e83Rows: KeyValue[];
    e62Rows: KeyValue[];
}

interface ProcessBlock {
    id: string;      // "P1"
    label: string;   // "P1 - User Defined Name"
    category: string;    // "Pig Iron" (Used for logic)
}

const D_ProcessesSection: React.FC<Props> = ({ data, setData, e83Rows, e62Rows }) => {
    const [processes, setProcesses] = useState<ProcessBlock[]>([]);
    const [selectedProcessString, setSelectedProcessString] = useState<string>('');

    // Update active processes list whenever e83Rows changes
    useEffect(() => {
        const active: ProcessBlock[] = [];
        e83Rows.forEach((row, index) => {
            const pId = `P${index + 1}`;
            const category = (row.e as string);
            const userDefinedName = (row.l as string); // User defined name
            
            // Consider active if category exists and is not 'n.a.'
            if (category && category !== 'n.a.') {
                active.push({
                    id: pId,
                    label: `${pId} - ${userDefinedName || '(No Name)'}`, // Display user name
                    category: category // Store category for logic lookups
                });
            }
        });
        setProcesses(active);

        // Handle selection persistence or default
        setSelectedProcessString(prevSelection => {
            if (active.length === 0) return '';
            
            const exists = active.some(p => p.label === prevSelection);
            if (prevSelection && exists) return prevSelection;
            
            return active[0].label;
        });

    }, [e83Rows]);

    const handleDataChange = (processId: string, processData: KeyValue) => {
        setData({ ...data, [processId]: processData });
    };

    const currentProcess = processes.find(p => p.label === selectedProcessString);
    
    // Logic to find active routes from E62
    let activeRoutes: string[] | null = null;
    if (currentProcess) {
        if (CATEGORIES_WITH_ROUTES.includes(currentProcess.category)) {
            // Find matching E62 row based on Category name
            const matchedE62 = e62Rows.find(row => row.e === currentProcess.category);
            if (matchedE62) {
                activeRoutes = ['i', 'j', 'k', 'l', 'm', 'n']
                    .map(col => matchedE62[col] as string)
                    .filter(val => val && val.trim() !== '' && val !== 'n.a.');
            }
        } else {
             // For other categories, default to 'All production routes'
             activeRoutes = ['All production routes'];
        }
    }

    return (
        <CollapsibleSection title="D_Processes: Production level and attributed emissions for SEE calculation (SEE 計算之生產水平與歸屬排放量)" noCollapse={true}>
            <div className="space-y-6">
                {processes.length > 0 ? (
                    <div className="space-y-6 animate-fadeIn">
                        <SelectInput
                            label="Select Production Process to Edit (選擇要編輯的生產過程)"
                            id="process-selector"
                            options={processes.map(p => p.label)}
                            value={selectedProcessString}
                            includeEmpty={false}
                            onChange={e => setSelectedProcessString(e.target.value)}
                        />

                        {currentProcess && (
                            <ProcessForm
                                key={currentProcess.id}
                                processId={currentProcess.id}
                                productName={currentProcess.category} // Pass category for Route lookup logic
                                displayName={currentProcess.label}
                                data={data[currentProcess.id] || {}}
                                setData={(processData) => handleDataChange(currentProcess.id, processData)}
                                activeRoutes={activeRoutes}
                                e83Rows={e83Rows}
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                         <p className="text-amber-600 font-semibold mb-2">
                            ⚠️ No production processes defined (尚未定義生產過程)
                         </p>
                         <div className="text-slate-600">
                            Please define processes in <strong>A_InstData</strong> under <strong>(b) Relevant production processes (相關生產過程)</strong> first:
                            <br/>(請先在 A_InstData 的 (b) Relevant production processes (相關生產過程) 區塊：)
                            <ul className="list-disc ml-6 mt-2 mb-2">
                                <li>Add a process item (P1, P2...) (新增一個生產過程條目)</li>
                                <li>Select a valid <strong>Aggregated goods category</strong> (e.g., Pig iron) (選擇有效的類別)</li>
                            </ul>
                            After this, detailed forms will be automatically generated here. (完成後，系統將自動在此處生成對應的詳細資料表單。)
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default D_ProcessesSection;
