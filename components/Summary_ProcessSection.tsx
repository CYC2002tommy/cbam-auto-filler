
import React from 'react';
import type { Summary_Process } from '../types';
import { TextInput } from './FormControls';
import CollapsibleSection from './CollapsibleSection';

interface Props {
    data: Summary_Process;
    setData: (data: Summary_Process) => void;
}

const Summary_ProcessSection: React.FC<Props> = ({ data, setData }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData({ ...data, [e.target.id]: e.target.value });
    };

    return (
        <section className="animate-fadeIn">
             <CollapsibleSection title="Summary_Process: Summary & Additional Info (摘要與補充資訊)" noCollapse={true}>
                 <div className="grid grid-cols-1 gap-6">
                    <TextInput 
                        label="Carbon price instrument (碳定價工具)" 
                        id="M13" 
                        type="text" 
                        value={data.M13 || ''} 
                        onChange={handleChange} 
                        placeholder="e.g., Carbon Tax, ETS..."
                        required
                    />
                    
                    <div>
                        <label htmlFor="M16" className="block text-sm font-medium text-slate-700 mb-1">
                            Any additional information (其他補充資訊) <span className="text-red-500 font-bold">*</span>
                        </label>
                        <textarea
                            id="M16"
                            rows={4}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={data.M16 || ''}
                            onChange={handleChange}
                            placeholder="Enter any additional context or comments here... (輸入任何其他背景或意見...)"
                            required
                        />
                    </div>
                </div>
            </CollapsibleSection>
        </section>
    );
};

export default Summary_ProcessSection;
