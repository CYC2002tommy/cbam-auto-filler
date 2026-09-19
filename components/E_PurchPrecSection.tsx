
import React, { useState, useEffect } from 'react';
import type { E_PurchPrec, KeyValue } from '../types';
import { ROUTE_MAP, SOURCE_OPTIONS, D_PROCESSES_L67_DETAILED_OPTIONS, JUSTIFICATION_OPTIONS, CATEGORIES_WITH_ROUTES } from '../constants';
import { getColumnLetter } from '../utils';
import CollapsibleSection from './CollapsibleSection';
import { Button, TextInput, SelectInput, SelectOption } from './FormControls';

interface GeneratedField {
    row: number;
    colIndex: number;
    columnName: string;
    description: string;
    dataType: 'float' | 'choice';
    options?: (string | SelectOption)[]; // Updated to support detailed options
    value?: string | number;
    isConditional?: boolean;
    triggerRows?: number[];
    cellAddress: string;
    section: 'a' | 'b' | 'c' | 'e';
}

interface Block {
    id: string;
    name: string;
    fields: GeneratedField[];
}

const AMOUNTS_COL_E = 12;
const SOURCE_COL_E = 13;
const JUSTIFICATION_COL_E = 11;
const BLOCK_STEP = 44;
const BASE_START = 17;

// Added Props interface definition
interface Props {
    data: E_PurchPrec;
    setData: (data: E_PurchPrec) => void;
    e83Rows: KeyValue[];
    e102Rows: KeyValue[];
}

const E_PurchPrecSection: React.FC<Props> = ({ data, setData, e83Rows, e102Rows }) => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string>('');

    useEffect(() => {
        const globalSeenRows = new Set<number>();
        const newBlocks: Block[] = [];
        
        e102Rows.forEach((row, idx) => {
            const aRowIndex = 102 + idx;
            const eBaseRow = BASE_START + (idx * BLOCK_STEP);
            const category = row.e as string;
            const userDefinedName = row.l as string;
            
            const fields = generateBlockQuestions(row, aRowIndex, eBaseRow, globalSeenRows, e83Rows);
            
            if (fields.length > 0) {
                let displayName = userDefinedName;
                if (!displayName && category && category !== 'n.a.') {
                    displayName = category;
                }
                if (!displayName) {
                    displayName = `Item #${idx + 1}`;
                } else if (userDefinedName && category && category !== 'n.a.') {
                    displayName = `${userDefinedName} (${category})`;
                }

                newBlocks.push({
                    id: `#${idx + 1}`,
                    name: displayName,
                    fields: fields.sort((a, b) => a.row - b.row)
                });
            }
        });

        setBlocks(newBlocks);

        if (newBlocks.length > 0) {
            const currentStillExists = newBlocks.some(b => `${b.id} - ${b.name}` === selectedBlockId);
            if (!currentStillExists) {
                 setSelectedBlockId(`${newBlocks[0].id} - ${newBlocks[0].name}`);
            }
        } else {
            setSelectedBlockId('');
        }
    }, [e102Rows, e83Rows]);

    const generateBlockQuestions = (
        row: KeyValue,
        aRowIndex: number,
        eBaseRow: number,
        seenRowsSet: Set<number>,
        e83RowsData: KeyValue[]
    ): GeneratedField[] => {
        const fields: GeneratedField[] = [];
        const precursorCategory = row.e as string;
        if (!precursorCategory || precursorCategory === 'n.a.') return [];

        let matchedKey: string | null = null;
        Object.keys(ROUTE_MAP).forEach(key => {
            if (precursorCategory.toLowerCase().includes(key.toLowerCase())) {
                matchedKey = key;
            }
        });
        
        const routeOptionsList = matchedKey ? ROUTE_MAP[matchedKey] : ROUTE_MAP["Default"];
        const routeCols = ['g', 'h', 'i', 'j', 'k'];
        const selectedInThisRow: { name: string; colIndex: number }[] = [];

        routeCols.forEach((key, idx) => {
            const val = row[key];
            if (val && typeof val === 'string' && val.trim() !== '') {
                selectedInThisRow.push({ name: val, colIndex: idx });
            }
        });

        let effectiveRouteCols = [...selectedInThisRow];
        if (effectiveRouteCols.length === 0 && precursorCategory && !CATEGORIES_WITH_ROUTES.includes(precursorCategory)) {
             effectiveRouteCols.push({ name: "All production routes", colIndex: 0 });
        }

        if (effectiveRouteCols.length === 0) return [];

        effectiveRouteCols.forEach(({ name, colIndex }) => {
            let foundIndex = -1;
            const selectedStr = name.toLowerCase().trim();
            for (let i = 0; i < routeOptionsList.length; i++) {
                const standardStr = routeOptionsList[i].toLowerCase();
                const standardKeyPart = standardStr.split('(')[0].trim();
                if (standardKeyPart.includes(selectedStr) || selectedStr.includes(standardKeyPart)) {
                    foundIndex = i;
                    break;
                }
            }
            if (foundIndex === -1) {
                foundIndex = colIndex; 
            }
            const targetRowE = eBaseRow + foundIndex;
            if (!seenRowsSet.has(targetRowE)) {
                seenRowsSet.add(targetRowE);
                const standardNameDisplay = routeOptionsList[foundIndex] || "Unknown Route";
                fields.push({
                    row: targetRowE,
                    colIndex: AMOUNTS_COL_E,
                    columnName: getColumnLetter(AMOUNTS_COL_E),
                    description: `Route: ${standardNameDisplay} (Amount)`,
                    dataType: 'float',
                    cellAddress: `${getColumnLetter(AMOUNTS_COL_E)}${targetRowE}`,
                    section: 'a'
                });
            }
        });

        const PRECURSOR_OFFSET = 11;
        for (let i = 0; i < 10; i++) {
            const pName = e83RowsData[i] ? (e83RowsData[i].e as string) : null;
            const pUserName = e83RowsData[i] ? (e83RowsData[i].l as string) : null;
            if (pName && pName.trim() !== '' && pName !== 'n.a.') {
                const targetRowP = eBaseRow + PRECURSOR_OFFSET + i;
                if (!seenRowsSet.has(targetRowP)) {
                    seenRowsSet.add(targetRowP);
                    const label = pUserName ? `${pUserName} (${pName})` : pName;
                    fields.push({
                        row: targetRowP,
                        colIndex: AMOUNTS_COL_E,
                        columnName: getColumnLetter(AMOUNTS_COL_E),
                        description: `Precursor (前導物): ${label} (Amount)`,
                        dataType: 'float',
                        cellAddress: `${getColumnLetter(AMOUNTS_COL_E)}${targetRowP}`,
                        section: 'b'
                    });
                }
            }
        }

        const offsets = { L38: 21, Row49: 32, Row50: 33, Row51: 34, Row54: 37 };
        const row38 = eBaseRow + offsets.L38;
        if (!seenRowsSet.has(row38)) {
            seenRowsSet.add(row38);
            fields.push({
                row: row38, colIndex: AMOUNTS_COL_E, columnName: 'L',
                description: `Amount (數量)`,
                dataType: 'float',
                cellAddress: `L${row38}`,
                section: 'c'
            });
        }

        const row49 = eBaseRow + offsets.Row49;
        if (!seenRowsSet.has(row49)) {
            seenRowsSet.add(row49);
            fields.push({
                row: row49, colIndex: AMOUNTS_COL_E, columnName: 'L',
                description: `SEE (direct) - Amount (直接排放 - 數量)`,
                dataType: 'float',
                cellAddress: `L${row49}`,
                section: 'e'
            });
            fields.push({
                row: row49, colIndex: SOURCE_COL_E, columnName: 'M',
                description: `SEE (direct) - Source (直接排放 - 來源)`,
                dataType: 'choice',
                options: SOURCE_OPTIONS,
                cellAddress: `M${row49}`,
                section: 'e'
            });
        }

        const row50 = eBaseRow + offsets.Row50;
        if (!seenRowsSet.has(row50)) {
            seenRowsSet.add(row50);
            fields.push({
                row: row50, colIndex: AMOUNTS_COL_E, columnName: 'L',
                description: `Specific electricity consumption - Amount (單位電力消耗 - 數量)`,
                dataType: 'float',
                cellAddress: `L${row50}`,
                section: 'e'
            });
            fields.push({
                row: row50, colIndex: SOURCE_COL_E, columnName: 'M',
                description: `Specific electricity consumption - Source (單位電力消耗 - 來源)`,
                dataType: 'choice',
                options: SOURCE_OPTIONS,
                cellAddress: `M${row50}`,
                section: 'e'
            });
        }

        const row51 = eBaseRow + offsets.Row51;
        if (!seenRowsSet.has(row51)) {
            seenRowsSet.add(row51);
            fields.push({
                row: row51, colIndex: AMOUNTS_COL_E, columnName: 'L',
                description: `Electricity emission factor - Amount (電力排放因子 - 數量)`,
                dataType: 'float',
                cellAddress: `L${row51}`,
                section: 'e'
            });
            fields.push({
                row: row51, colIndex: SOURCE_COL_E, columnName: 'M',
                description: `Electricity emission factor - Source (電力排放因子 - 來源)`,
                dataType: 'choice',
                options: D_PROCESSES_L67_DETAILED_OPTIONS, // Use detailed options for 圖1 descriptives
                cellAddress: `M${row51}`,
                section: 'e'
            });
        }

        const row54 = eBaseRow + offsets.Row54;
        if (!seenRowsSet.has(row54)) {
            seenRowsSet.add(row54);
            fields.push({
                row: row54, colIndex: JUSTIFICATION_COL_E, columnName: 'K',
                description: `Justification for default values (使用預設值的理由)`,
                dataType: 'choice',
                options: JUSTIFICATION_OPTIONS,
                isConditional: true,
                triggerRows: [row49, row50],
                cellAddress: `K${row54}`,
                section: 'e'
            });
        }
        return fields;
    };

    const handleFieldChange = (cellAddress: string, value: string | number) => {
        setData({ ...data, [cellAddress]: value });
    };

    const renderField = (field: GeneratedField) => {
        if (field.isConditional && field.triggerRows) {
            const isTriggered = field.triggerRows.some(tRow => {
                const sourceKey = `M${tRow}`;
                const val = data[sourceKey];
                return val && String(val).toLowerCase() === 'default';
            });
            if (!isTriggered) return null;
        }

        const currentValue = data[field.cellAddress] !== undefined ? data[field.cellAddress] : '';

        return (
             <div key={field.cellAddress} className="p-4 rounded-lg border border-slate-200 bg-slate-50/80">
                {field.dataType === 'choice' ? (
                    <SelectInput
                        label={field.description}
                        id={field.cellAddress}
                        options={field.options || []}
                        value={currentValue as string}
                        onChange={e => handleFieldChange(field.cellAddress, e.target.value)}
                    />
                ) : (
                    <TextInput
                        label={field.description}
                        id={field.cellAddress}
                        type="number"
                        required
                        value={currentValue as string}
                        onChange={e => handleFieldChange(field.cellAddress, e.target.value)}
                    />
                )}
            </div>
        );
    };

    const blockOptions = blocks.map(b => `${b.id} - ${b.name}`);
    const currentBlock = blocks.find(b => `${b.id} - ${b.name}` === selectedBlockId);
    const sections = [
        { key: 'a', title: "(a) Total purchased levels (總採購量)" },
        { key: 'b', title: "(b) Consumed in production processes within the installation (設施內生產過程之消耗量)" },
        { key: 'c', title: "(c) Consumed for other purposes, e.g. sold or used for non CBAM goods (用於其他目的，例如銷售或用於非 CBAM 產品)" },
        { key: 'e', title: "(e) Emissions embedded in this purchased precursor (此前導物所含之排放量)" }
    ] as const;

    return (
        <CollapsibleSection title="E_PurchPrec: Purchased precursors for SEE calculation (SEE 計算之採購前導物)" noCollapse={true}>
            <div className="space-y-6">
                {blocks.length > 0 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                             <SelectInput
                                label="Select Precursor Item to Edit (選擇要編輯的前導物項目)"
                                id="block-selector"
                                options={blockOptions}
                                value={selectedBlockId}
                                includeEmpty={false}
                                onChange={e => setSelectedBlockId(e.target.value)}
                            />
                        </div>
                        {currentBlock && (
                             <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50 animate-fadeIn relative">
                                <h3 className="text-xl font-bold text-indigo-800 mb-4">
                                    Item <span className="font-mono">{currentBlock.id}</span>: <span className="text-indigo-600">{currentBlock.name}</span>
                                </h3>
                                <div className="space-y-6">
                                    {sections.map(({ key, title }) => {
                                        const sectionFields = currentBlock.fields.filter(f => f.section === key);
                                        if (sectionFields.length === 0) return null;
                                        return (
                                            <div key={key} className="bg-white rounded-lg shadow-sm border border-slate-200">
                                                <div className="bg-slate-50 p-3 rounded-t-lg border-b border-slate-200">
                                                    <h4 className="text-lg font-semibold text-slate-600">{title}</h4>
                                                </div>
                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {sectionFields.map(field => renderField(field))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {blocks.length === 0 && (
                     <p className="text-slate-500 italic mt-4">
                        Please fill data in 'A_InstData' under '5. Purchased precursors (採購前導物)' first.<br/>
                        (請先在 'A_InstData' 中的 '5. Purchased precursors (採購前導物)' 區塊填寫資料，系統將自動生成此處欄位。)
                     </p>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default E_PurchPrecSection;
