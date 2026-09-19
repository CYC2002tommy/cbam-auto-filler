import React from 'react';
import type { C_EmissionsEnergy } from '../types';
import { H40_OPTIONS, H41_OPTIONS, H42_OPTIONS } from '../constants';
import { TextInput, SelectInput } from './FormControls';
import { Heading, Group } from './Layout';
import { useLabel } from '../ui/prefs';

interface Props {
    data: C_EmissionsEnergy;
    setData: (data: C_EmissionsEnergy) => void;
}

const C_EmissionsEnergySection: React.FC<Props> = ({ data, setData }) => {
    const label = useLabel();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({ ...data, [e.target.id]: e.target.value });
    };

    // H41 applies only when the operator relies mostly on Commission default values.
    const showJustification = data.H40 === 'Mostly default values provided by the European Commission';

    return (
        <div className="space-y-8">
            <Group>
                <Heading
                    label="(a) GHG balance (溫室氣體平衡)"
                    note={label('For iron, steel, aluminium and hydrogen, indirect (electricity) emissions are not counted in the definitive period (Guidance 5D). (鋼鐵、鋁、氫在正式期不計入電力間接排放，依歐盟指引 5D。)')}
                />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <TextInput label="Total indirect emissions, manual entry (間接排放總量，手動輸入)" id="M26" type="number" unit="tCO₂e" value={data.M26 as string || ''} onChange={handleChange} />
                </div>
            </Group>

            <Group>
                <Heading label="(c) Data quality and quality assurance (數據品質與品質保證)" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <SelectInput label="General information on data quality (數據品質概述)" id="H40" options={H40_OPTIONS} required value={data.H40 as string || ''} onChange={handleChange} />
                    {showJustification && (
                        <SelectInput label="Justification for using default values (使用預設值的理由)" id="H41" options={H41_OPTIONS} required value={data.H41 as string || ''} onChange={handleChange} />
                    )}
                    <SelectInput label="Quality assurance (品質保證方式)" id="H42" options={H42_OPTIONS} required value={data.H42 as string || ''} onChange={handleChange} />
                </div>
            </Group>
        </div>
    );
};

export default C_EmissionsEnergySection;
