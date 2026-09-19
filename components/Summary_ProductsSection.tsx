
import React, { useState, useEffect } from 'react';
import type { Summary_Product, KeyValue } from '../types';
import { 
    SUMMARY_PRODUCTS_FIELD_TITLES,
    CP_INSTRUMENT_OPTIONS,
    CP_REBATE_TYPE_OPTIONS,
    AC_OPTIONS,
    CURRENCY_OPTIONS,
    PARAM_REDUCING_AGENT_OPTIONS,
    FULL_CN_CODE_MAP,
    CN_CODE_DESCRIPTIONS
} from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { TextInput, SelectInput, SearchableSelect } from './FormControls';

interface Props {
    data: Summary_Product[];
    setData: (data: Summary_Product[]) => void;
    e83Rows: KeyValue[];
}

const Summary_ProductsSection: React.FC<Props> = ({ data, setData, e83Rows }) => {
    const [selectedPIndex, setSelectedPIndex] = useState<string>('');

    // Options for the product selector dropdown
    const itemSelectorOptions = e83Rows.map((row, index) => {
        const cat = row.e as string;
        const name = row.l as string;
        if ((!cat || cat === 'n.a.') && !name) return null;
        return { value: index.toString(), label: `P${index + 1}: ${cat || 'Unknown'} - ${name || '(No Name)'}` };
    }).filter(item => item !== null) as { value: string, label: string }[];

    // Dynamic options for the "Process Name" field inside the form
    const processNameOptions = [
        ...e83Rows
            .map((row, index) => {
                const cat = row.e as string;
                const name = row.l as string;
                if (!cat || cat === 'n.a.') return null;
                const label = name ? name : `P${index + 1} - ${cat}`;
                return { value: label, label: label };
            })
            .filter(opt => opt !== null) as { value: string, label: string }[],
        { value: 'n.a.', label: 'n.a.' }
    ];

    useEffect(() => {
        if (selectedPIndex === '' && itemSelectorOptions.length > 0) {
            setSelectedPIndex(itemSelectorOptions[0].value);
        }
    }, [itemSelectorOptions.length, selectedPIndex]);

    const currentPIndex = parseInt(selectedPIndex);
    const isValidSelection = !isNaN(currentPIndex) && e83Rows[currentPIndex];
    const currentE83 = isValidSelection ? e83Rows[currentPIndex] : null;
    const currentProductData = isValidSelection && data[currentPIndex] ? data[currentPIndex] : {};

    // Determine category based on the selected process name in the form
    const selectedProcessName = currentProductData.process as string;
    let effectiveCategory = 'n.a.';
    if (selectedProcessName && selectedProcessName !== 'n.a.') {
        const matchingRow = e83Rows.find((row, index) => {
            const cat = row.e as string;
            const name = row.l as string;
            const label = name ? name : `P${index + 1} - ${cat}`;
            return label === selectedProcessName;
        });
        if (matchingRow && matchingRow.e) effectiveCategory = matchingRow.e as string;
    } else if (currentE83 && currentE83.e) {
        effectiveCategory = currentE83.e as string;
    }

    // Prepare CN Code Options based on Category
    const categoryLower = effectiveCategory.toLowerCase();
    const availableCodes = FULL_CN_CODE_MAP[categoryLower] || [];
    const cnCodeOptions = availableCodes.map(code => {
        const desc = CN_CODE_DESCRIPTIONS[code];
        return {
            value: code,
            label: desc ? `${code} - ${desc}` : code
        };
    });

    useEffect(() => {
        if (isValidSelection && currentE83) {
            const updates: Partial<Summary_Product> = {};
            let hasUpdates = false;
            if (!currentProductData.process) {
                const cat = currentE83.e as string;
                const name = currentE83.l as string;
                updates.process = name ? name : `P${currentPIndex + 1} - ${cat}`;
                hasUpdates = true;
            }
            if (!currentProductData.name && currentE83.l) {
                updates.name = currentE83.l as string;
                hasUpdates = true;
            }
            if (hasUpdates) {
                const newData = [...data];
                while (newData.length <= currentPIndex) newData.push({});
                newData[currentPIndex] = { ...newData[currentPIndex], ...updates };
                setData(newData);
            }
        }
    }, [currentPIndex, currentE83, isValidSelection, currentProductData.process, currentProductData.name, data, setData]);

    const handleFieldChange = (field: string, value: string | number) => {
        if (isValidSelection) {
            const newData = [...data];
            while (newData.length <= currentPIndex) newData.push({});
            newData[currentPIndex] = { ...newData[currentPIndex], [field]: value };
            setData(newData);
        }
    };

    const getRequiredParams = (sec: string): string[] => {
        const sectorLower = (sec || '').toLowerCase();
        let required: string[] = [];

        // Parameter Groups
        // AB to AK
        const range_ab_ak = [
            'param_clinker', 'param_calcined', 'param_conc', 'param_nitric_acid', 
            'param_urea', 'param_n_total', 'param_n_nh4', 'param_n_no3', 
            'param_n_urea', 'param_n_other'
        ];
        // AH to AK
        const range_ah_ak = ['param_n_nh4', 'param_n_no3', 'param_n_urea', 'param_n_other'];

        // 1. Fertilisers
        if (sectorLower.includes("ammonia")) {
            required.push('param_conc'); // AD
        } else if (sectorLower.includes("urea")) {
            required.push('param_urea', 'param_n_total'); // AF, AG
        } else if (sectorLower.includes("nitric acid")) {
            required.push('param_nitric_acid'); // AE
        } else if (sectorLower.includes("mixed fertilisers")) {
            required.push(...range_ah_ak); // AH-AK
        } 
        // 2. Cement
        else if (sectorLower.includes("cement clinker")) {
             required.push('param_clinker'); // AB
        } else if (sectorLower.includes("calcined clays")) {
             required.push('param_reducing_agent', 'param_steel_mill_id', ...range_ab_ak); // P, Q, AB-AK
        }
        // 3. Iron & Steel
        else if (sectorLower.includes("iron or steel products")) {
            required.push('param_reducing_agent', 'param_steel_mill_id'); // P, Q
        } else if (sectorLower.includes("crude steel")) {
             required.push('param_reducing_agent'); // P
        } else if (sectorLower.includes("direct reduced iron")) {
             required.push('param_reducing_agent'); // P
        } else if (sectorLower.includes("alloys")) {
             required.push('param_reducing_agent'); // P
        }

        return required;
    };

    const requiredFields = getRequiredParams(effectiveCategory);
    const cpKeys = Object.keys(SUMMARY_PRODUCTS_FIELD_TITLES).filter(k => k.startsWith('cp_'));

    const renderInput = (key: string) => {
        const label = SUMMARY_PRODUCTS_FIELD_TITLES[key];
        const isRequired = requiredFields.includes(key);

        // Special input: CN Code (Searchable dropdown)
        if (key === 'cn_code') {
             return (
                <div key={key}>
                     <SearchableSelect 
                         label={label}
                         id={`prod-${key}`} 
                         options={cnCodeOptions} 
                         value={currentProductData[key] as string || ''} 
                         onChange={val => handleFieldChange(key, val)} 
                         required={isRequired}
                         placeholder={cnCodeOptions.length > 0 ? "--- Please Select (請選擇) ---" : "No codes found for this category"}
                     />
                </div>
            );
        }

        // Other special inputs
        if (key === 'param_calcined') return <SelectInput key={key} label={label} id={`prod-${key}`} options={AC_OPTIONS} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
        if (key === 'param_reducing_agent') return <SelectInput key={key} label={label} id={`prod-${key}`} options={PARAM_REDUCING_AGENT_OPTIONS} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
        if (key === 'param_reducing_agent') return <SelectInput key={key} label={label} id={`prod-${key}`} options={PARAM_REDUCING_AGENT_OPTIONS} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
        if (key === 'cp_instrument') return <SelectInput key={key} label={label} id={`prod-${key}`} options={CP_INSTRUMENT_OPTIONS} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
        if (key === 'cp_rebate_type') return <SelectInput key={key} label={label} id={`prod-${key}`} options={CP_REBATE_TYPE_OPTIONS} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
        if (key === 'cp_currency') return <SearchableSelect key={key} label={label} id={`prod-${key}`} options={CURRENCY_OPTIONS} value={currentProductData[key] as string || ''} onChange={val => handleFieldChange(key, val)} required={isRequired} />;
        
        // Default text/number input
        return <TextInput key={key} label={label} id={`prod-${key}`} type={key.includes('id') || key.includes('reducing') ? 'text' : 'number'} value={currentProductData[key] as string || ''} onChange={e => handleFieldChange(key, e.target.value)} required={isRequired} />;
    };

    return (
        <CollapsibleSection title="Summary_Products: Product information for report (產品報告資訊)" noCollapse={true}>
            <div className="space-y-6">
                {itemSelectorOptions.length > 0 ? (
                    <div className="space-y-6 animate-fadeIn">
                        <SelectInput 
                            label="Select Product to Edit (選擇編輯產品)" 
                            id="product-selector" 
                            options={itemSelectorOptions} 
                            value={selectedPIndex} 
                            includeEmpty={false} 
                            onChange={e => setSelectedPIndex(e.target.value)} 
                        />
                        {isValidSelection && (
                             <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50 animate-fadeIn space-y-6">
                                <h3 className="text-xl font-bold text-indigo-800">P{currentPIndex + 1}: <span className="text-indigo-600">{currentProductData.name || '(No Name)'}</span></h3>
                                
                                {/* Step 1: Essential Information */}
                                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="bg-slate-50 p-3 rounded-t-lg border-b border-slate-200">
                                        <h4 className="text-lg font-semibold text-slate-600">Step 1: Essential Information (核心產品資訊)</h4>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SelectInput 
                                            label={SUMMARY_PRODUCTS_FIELD_TITLES['process']}
                                            id="prod-process" 
                                            options={processNameOptions} 
                                            value={currentProductData.process as string || ''} 
                                            onChange={e => handleFieldChange('process', e.target.value)} 
                                            required 
                                        />
                                        
                                        {renderInput('cn_code')}

                                        <div className="md:col-span-2">
                                            <TextInput 
                                                label={SUMMARY_PRODUCTS_FIELD_TITLES['name']}
                                                id="prod-name" 
                                                value={currentProductData.name as string || ''} 
                                                onChange={e => handleFieldChange('name', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Required Parameters based on Sector */}
                                {requiredFields.length > 0 ? (
                                    <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200">
                                        <div className="bg-emerald-100 p-3 rounded-t-lg border-b border-emerald-200">
                                            <h4 className="text-lg font-semibold text-emerald-800 font-bold">Step 2: Required Parameters (必填參數)</h4>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {requiredFields.map(key => renderInput(key))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                                        No specific parameters required for this category. (此類別無特定需填寫的額外參數)
                                    </div>
                                )}

                                {/* Step 3: Carbon Pricing */}
                                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="bg-slate-50 p-3 rounded-t-lg border-b border-slate-200">
                                        <h4 className="text-lg font-semibold text-slate-600">Step 3: Carbon Pricing (碳定價資訊 - 選填)</h4>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cpKeys.map(key => renderInput(key))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                ) : (
                     <p className="text-slate-500 italic mt-4">Please define processes in A_InstData first. (請先在 A_InstData 中定義生產過程。)</p>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default Summary_ProductsSection;
