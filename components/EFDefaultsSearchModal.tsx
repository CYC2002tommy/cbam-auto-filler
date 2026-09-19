
import React, { useState, useEffect } from 'react';
import { EF_DEFAULT_VALUES, CN_CODE_DESCRIPTIONS } from '../constants';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string, description: string, value: number) => void;
}

const EFDefaultsSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState<typeof EF_DEFAULT_VALUES>([]);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setFilteredData(EF_DEFAULT_VALUES);
        }
    }, [isOpen]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = EF_DEFAULT_VALUES.filter(item => {
            const cleanCode = item.code.replace(/\s/g, '');
            const description = CN_CODE_DESCRIPTIONS[cleanCode] || "Unknown";
            
            return (
                item.code.toLowerCase().includes(query) ||
                cleanCode.includes(query) ||
                description.toLowerCase().includes(query)
            );
        });
        setFilteredData(filtered);
    }, [searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Search Default Emission Factor (搜尋預設排放因子)</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by Code or Description (搜尋代碼或描述)..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {filteredData.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No results found for "{searchQuery}" (未找到符合的結果).
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600 border-b border-slate-200 w-32">CN Code</th>
                                    <th className="p-3 font-semibold text-slate-600 border-b border-slate-200">Description (描述)</th>
                                    <th className="p-3 font-semibold text-slate-600 border-b border-slate-200 w-32 text-right">Default Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, index) => {
                                    const cleanCode = item.code.replace(/\s/g, '');
                                    const description = CN_CODE_DESCRIPTIONS[cleanCode] || "";
                                    
                                    return (
                                        <tr 
                                            key={`${item.code}-${index}`} 
                                            onClick={() => {
                                                onSelect(item.code, description, item.value);
                                                onClose();
                                            }}
                                            className="hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-100"
                                        >
                                            <td className="p-3 font-mono text-indigo-700 font-medium align-top">{item.code}</td>
                                            <td className="p-3 text-slate-700 break-words whitespace-normal align-top leading-relaxed text-sm">{description}</td>
                                            <td className="p-3 text-slate-800 font-semibold text-right align-top">{item.value}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-3 border-t border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
                    Showing {filteredData.length} results (顯示 {filteredData.length} 筆結果)
                </div>
            </div>
        </div>
    );
};

export default EFDefaultsSearchModal;
