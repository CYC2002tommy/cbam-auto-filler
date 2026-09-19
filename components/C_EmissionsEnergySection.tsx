
import React from 'react';
import type { C_EmissionsEnergy } from '../types';
import { H40_OPTIONS, H41_OPTIONS, H42_OPTIONS } from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { TextInput, SelectInput } from './FormControls';

interface Props {
    data: C_EmissionsEnergy;
    setData: (data: C_EmissionsEnergy) => void;
}

interface StaticSubSectionProps {
    title: string;
    children: React.ReactNode;
}

// Helper component for static sub-sections (no collapsing)
const StaticSubSection: React.FC<StaticSubSectionProps> = ({ title, children }) => (
    <div className="mt-4">
        <div className="bg-slate-50 p-3 rounded-t-md border border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-600">{title}</h2>
        </div>
        <div className="bg-white p-6 rounded-b-lg shadow-sm border border-t-0 border-slate-200">
            {children}
        </div>
    </div>
);

const C_EmissionsEnergySection: React.FC<Props> = ({ data, setData }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({ ...data, [e.target.id]: e.target.value });
    };

    // Conditional check for H41 visibility
    // H41 is required only if H40 is "Mostly default values provided by the European Commission"
    const showJustification = data.H40 === "Mostly default values provided by the European Commission";

    return (
        <CollapsibleSection title="C_Emissions&Energy: Installation-level GHG emissions and energy consumption" noCollapse={true}>
            <div className="space-y-6">
                <StaticSubSection title="(a) GHG balance by type of GHG (溫室氣體平衡)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextInput 
                            label="Manual entries Total indirect emissions (手動輸入總間接排放量)" 
                            id="M26" 
                            type="text" 
                            required 
                            value={data.M26 as string || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                </StaticSubSection>

                <StaticSubSection title="(c) Information on the data quality and quality assurance (數據品質與品質保證資訊)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectInput 
                            label="General information on data quality (數據品質一般資訊)" 
                            id="H40" 
                            options={H40_OPTIONS} 
                            required 
                            value={data.H40 as string || ''} 
                            onChange={handleChange} 
                        />
                        
                        {showJustification && (
                            <SelectInput 
                                label="Justification for use of default values (使用預設值的理由)" 
                                id="H41" 
                                options={H41_OPTIONS} 
                                required 
                                value={data.H41 as string || ''} 
                                onChange={handleChange} 
                            />
                        )}
                        
                        <SelectInput 
                            label="Information on quality assurance (品質保證資訊)" 
                            id="H42" 
                            options={H42_OPTIONS} 
                            required 
                            value={data.H42 as string || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                </StaticSubSection>
            </div>
        </CollapsibleSection>
    );
};

export default C_EmissionsEnergySection;
