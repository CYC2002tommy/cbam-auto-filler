import React from 'react';
import type { Summary_Process } from '../types';
import { TextInput, FieldLabel } from './FormControls';
import { Heading, Group } from './Layout';
import { useT } from '../ui/prefs';

interface Props {
    data: Summary_Process;
    setData: (data: Summary_Process) => void;
}

const Summary_ProcessSection: React.FC<Props> = ({ data, setData }) => {
    const t = useT();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData({ ...data, [e.target.id]: e.target.value });
    };

    return (
        <Group>
            <Heading label="Summary and additional information (摘要與補充資訊)" />
            <div className="grid grid-cols-1 gap-5">
                <TextInput label="Carbon price instrument (碳定價工具)" id="M13" type="text" value={data.M13 || ''} onChange={handleChange}
                    placeholder={t('例如：碳費、排放交易制度', 'e.g. carbon fee, emissions trading system')} />
                <div>
                    <FieldLabel label="Any additional information (其他補充資訊)" htmlFor="M16" code="M16" />
                    <textarea id="M16" rows={5} className="field block w-full px-3 py-2 text-[0.9375rem] text-slate-900 placeholder:text-slate-400"
                        value={data.M16 || ''} onChange={handleChange}
                        placeholder={t('給進口商的補充說明，例如計算方式、資料來源。', 'Notes for your importer, e.g. calculation approach or data sources.')} />
                </div>
            </div>
        </Group>
    );
};

export default Summary_ProcessSection;
