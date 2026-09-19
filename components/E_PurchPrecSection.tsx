import React, { useMemo, useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import type { E_PurchPrec, KeyValue } from '../types';
import { ROUTE_MAP, SOURCE_OPTIONS, D_PROCESSES_L67_DETAILED_OPTIONS, JUSTIFICATION_OPTIONS, CATEGORIES_WITH_ROUTES } from '../constants';
import { TextInput, SelectInput, SelectOption } from './FormControls';
import { Heading, Group } from './Layout';
import { useT, useLabel } from '../ui/prefs';

/*
 * E_PurchPrec holds one 44-row block per purchased precursor, starting at row 17
 * (verified against V2.1.1 for all 20 blocks). Within a block: route amounts in L17–L24,
 * consumption per production process P1–P10 in L28–L37, other uses in L38, and the
 * precursor's embedded emissions in L/M49–51 with the default-value justification in K54.
 */
const BLOCK_STEP = 44;
const BASE_START = 17;

interface Field {
    cell: string;
    label: string;
    kind: 'number' | 'choice';
    unit?: string;
    options?: (string | SelectOption)[];
    showWhen?: string[];     // cells that must hold "Default" for this field to appear
    section: 'a' | 'b' | 'c' | 'e';
}

interface Props {
    data: E_PurchPrec;
    setData: (data: E_PurchPrec) => void;
    e83Rows: KeyValue[];
    e102Rows: KeyValue[];
}

const blockFields = (row: KeyValue, idx: number, e83Rows: KeyValue[]): Field[] => {
    const category = row.e as string;
    if (!category || category === 'n.a.') return [];
    const base = BASE_START + idx * BLOCK_STEP;
    const fields: Field[] = [];

    const key = Object.keys(ROUTE_MAP).find(k => category.trim().toLowerCase().includes(k.toLowerCase()));
    const standardRoutes = key ? ROUTE_MAP[key] : ROUTE_MAP['Default'];
    const chosen = ['g', 'h', 'i', 'j', 'k']
        .map((col, colIndex) => ({ name: row[col] as string, colIndex }))
        .filter(r => typeof r.name === 'string' && r.name.trim() !== '');
    if (!chosen.length && !CATEGORIES_WITH_ROUTES.includes(category)) chosen.push({ name: 'All production routes', colIndex: 0 });
    if (!chosen.length) return [];

    const seen = new Set<number>();
    chosen.forEach(({ name, colIndex }) => {
        const wanted = name.toLowerCase().trim();
        let i = standardRoutes.findIndex(s => {
            const head = s.toLowerCase().split('(')[0].trim();
            return head.includes(wanted) || wanted.includes(head);
        });
        if (i === -1) i = colIndex;
        if (seen.has(i)) return;
        seen.add(i);
        fields.push({ cell: `L${base + i}`, label: `${standardRoutes[i] ?? name}`, kind: 'number', unit: 't', section: 'a' });
    });

    e83Rows.slice(0, 10).forEach((p, i) => {
        const cat = p.e as string;
        if (!cat || cat === 'n.a.') return;
        const name = (p.l as string) || cat;
        fields.push({ cell: `L${base + 11 + i}`, label: `P${i + 1}：${name}`, kind: 'number', unit: 't', section: 'b' });
    });

    fields.push({ cell: `L${base + 21}`, label: 'Consumed for other purposes (用於其他用途)', kind: 'number', unit: 't', section: 'c' });

    const r49 = base + 32, r50 = base + 33, r51 = base + 34, r54 = base + 37;
    fields.push(
        { cell: `L${r49}`, label: 'Specific embedded direct emissions, SEE (direct) (單位內含直接排放)', kind: 'number', unit: 'tCO₂e/t', section: 'e' },
        { cell: `M${r49}`, label: 'Source of SEE (direct) (數據來源)', kind: 'choice', options: SOURCE_OPTIONS, section: 'e' },
        { cell: `L${r50}`, label: 'Specific electricity consumption (單位用電量)', kind: 'number', unit: 'MWh/t', section: 'e' },
        { cell: `M${r50}`, label: 'Source of electricity consumption (數據來源)', kind: 'choice', options: SOURCE_OPTIONS, section: 'e' },
        { cell: `L${r51}`, label: 'Electricity emission factor (電力排放係數)', kind: 'number', unit: 'tCO₂/MWh', section: 'e' },
        { cell: `M${r51}`, label: 'Source of the emission factor (排放係數來源)', kind: 'choice', options: D_PROCESSES_L67_DETAILED_OPTIONS, section: 'e' },
        { cell: `K${r54}`, label: 'Justification for using default values (使用預設值的理由)', kind: 'choice', options: JUSTIFICATION_OPTIONS, showWhen: [`M${r49}`, `M${r50}`], section: 'e' },
    );
    return fields;
};

const SECTIONS = [
    { key: 'a', title: '(a) Total purchased amount, by production route (採購總量，依生產路徑)' },
    { key: 'b', title: '(b) Consumed in this installation’s production processes (廠內各生產過程的用量)' },
    { key: 'c', title: '(c) Other uses, e.g. sold or used for non-CBAM goods (其他用途，例如轉售或用於非 CBAM 產品)' },
    { key: 'e', title: '(e) Emissions embedded in this precursor (此前驅物的內含排放)' },
] as const;

const E_PurchPrecSection: React.FC<Props> = ({ data, setData, e83Rows, e102Rows }) => {
    const t = useT();
    const label = useLabel();
    const [selected, setSelected] = useState(0);

    const blocks = useMemo(() => e102Rows
        .map((row, idx) => ({ idx, name: (row.l as string) || (row.e as string) || '', fields: blockFields(row, idx, e83Rows) }))
        .filter(b => b.fields.length > 0), [e102Rows, e83Rows]);

    useEffect(() => {
        if (blocks.length && !blocks.some(b => b.idx === selected)) setSelected(blocks[0].idx);
    }, [blocks, selected]);

    const current = blocks.find(b => b.idx === selected);
    const set = (cell: string, value: string) => setData({ ...data, [cell]: value });

    if (!blocks.length) {
        return (
            <Group className="flex flex-col items-center py-12 text-center">
                <Package size={36} className="mb-3 text-slate-400" strokeWidth={1.5} />
                <p className="font-semibold text-slate-800">{t('還沒有採購前驅物', 'No purchased precursors yet')}</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                    {t('先到「設施資訊」的第 5 部分新增前驅物（例如盤元）並選好類別，這裡就會出現對應的欄位。',
                        'Add a precursor (for example wire rod) with its category under Installation → 5; its fields then appear here.')}
                </p>
            </Group>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('前驅物', 'Precursors')}>
                {blocks.map(b => (
                    <button key={b.idx} type="button" role="tab" aria-selected={b.idx === selected} onClick={() => setSelected(b.idx)}
                        className={`pressable rounded-full px-4 py-1.5 text-sm font-medium ${b.idx === selected ? 'bg-slate-900 text-white' : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'}`}>
                        PP{b.idx + 1}{b.name ? ` · ${b.name}` : ''}
                    </button>
                ))}
            </div>

            {current && SECTIONS.map(({ key, title }) => {
                const fields = current.fields.filter(f => f.section === key)
                    .filter(f => !f.showWhen || f.showWhen.some(c => String(data[c] ?? '').toLowerCase() === 'default'));
                if (!fields.length) return null;
                return (
                    <Group key={key}>
                        <Heading label={title} note={key === 'e' ? label('Ask your supplier (e.g. the steel mill) for these values; without a verified supplier report the EU default value applies. (向供應商（例如鋼廠）索取；沒有經查證的供應商報告時，適用歐盟預設值。)') : undefined} />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {fields.map(f => f.kind === 'choice' ? (
                                <SelectInput key={f.cell} label={f.label} code={f.cell} id={`E-${f.cell}`} options={f.options ?? []}
                                    value={(data[f.cell] as string) ?? ''} onChange={e => set(f.cell, e.target.value)} />
                            ) : (
                                <TextInput key={f.cell} label={f.label} code={f.cell} id={`E-${f.cell}`} type="number" unit={f.unit}
                                    required={f.section === 'a'} value={(data[f.cell] as string) ?? ''} onChange={e => set(f.cell, e.target.value)} />
                            ))}
                        </div>
                    </Group>
                );
            })}
        </div>
    );
};

export default E_PurchPrecSection;
