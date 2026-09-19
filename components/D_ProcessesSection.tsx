import React, { useState, useEffect } from 'react';
import { Factory } from 'lucide-react';
import type { D_Processes, KeyValue } from '../types';
import ProcessForm from './ProcessForm';
import { Group } from './Layout';
import { CATEGORIES_WITH_ROUTES } from '../constants';
import { useT, useOptionLabel } from '../ui/prefs';

interface Props {
    data: D_Processes;
    setData: (data: D_Processes) => void;
    e83Rows: KeyValue[];
    e62Rows: KeyValue[];
}

interface ProcessBlock {
    id: string;       // "P1"
    name: string;     // user-defined name
    category: string; // aggregated goods category
}

const D_ProcessesSection: React.FC<Props> = ({ data, setData, e83Rows, e62Rows }) => {
    const t = useT();
    const optionLabel = useOptionLabel();
    const [selectedId, setSelectedId] = useState<string>('');

    const processes: ProcessBlock[] = e83Rows
        .map((row, index) => ({ id: `P${index + 1}`, name: (row.l as string) || '', category: row.e as string }))
        .filter(p => p.category && p.category !== 'n.a.');

    useEffect(() => {
        if (!processes.length) { if (selectedId) setSelectedId(''); return; }
        if (!processes.some(p => p.id === selectedId)) setSelectedId(processes[0].id);
    }, [processes.map(p => p.id).join(','), selectedId]);

    const current = processes.find(p => p.id === selectedId);

    let activeRoutes: string[] | null = null;
    if (current) {
        if (CATEGORIES_WITH_ROUTES.includes(current.category)) {
            const matchedE62 = e62Rows.find(row => row.e === current.category);
            if (matchedE62) {
                activeRoutes = ['i', 'j', 'k', 'l', 'm', 'n']
                    .map(col => matchedE62[col] as string)
                    .filter(val => val && val.trim() !== '' && val !== 'n.a.');
            }
        } else {
            activeRoutes = ['All production routes'];
        }
    }

    if (!processes.length) {
        return (
            <Group className="flex flex-col items-center py-12 text-center">
                <Factory size={36} className="mb-3 text-slate-400" strokeWidth={1.5} />
                <p className="font-semibold text-slate-800">{t('還沒有生產過程', 'No production processes yet')}</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                    {t('先到「設施資訊」的 4(b) 新增生產過程並選好商品類別，這裡就會出現每個過程的頁面。',
                        'Add a process with a goods category under Installation → 4(b); each one then gets a page here.')}
                </p>
            </Group>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('生產過程', 'Production processes')}>
                {processes.map(p => (
                    <button
                        key={p.id}
                        type="button"
                        role="tab"
                        aria-selected={p.id === selectedId}
                        onClick={() => setSelectedId(p.id)}
                        className={`pressable rounded-full px-4 py-1.5 text-sm font-medium ${p.id === selectedId ? 'bg-slate-900 text-white' : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'}`}
                    >
                        {p.id}{p.name ? ` · ${p.name}` : ''}
                    </button>
                ))}
            </div>
            {current && (
                <>
                    <p className="text-sm text-slate-500">{optionLabel(current.category)}</p>
                    <ProcessForm
                        key={current.id}
                        processId={current.id}
                        productName={current.category}
                        data={data[current.id] || {}}
                        setData={(processData) => setData({ ...data, [current.id]: processData })}
                        activeRoutes={activeRoutes}
                        e83Rows={e83Rows}
                    />
                </>
            )}
        </div>
    );
};

export default D_ProcessesSection;
