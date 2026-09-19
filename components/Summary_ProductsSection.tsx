import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Trash2 } from 'lucide-react';
import type { Summary_Product, KeyValue } from '../types';
import {
    SUMMARY_PRODUCTS_FIELD_TITLES,
    SUMMARY_PRODUCTS_COLUMN_MAP,
    CP_INSTRUMENT_OPTIONS,
    CP_REBATE_TYPE_OPTIONS,
    AC_OPTIONS,
    CURRENCY_OPTIONS,
    PARAM_REDUCING_AGENT_OPTIONS,
    FULL_CN_CODE_MAP,
    CN_CODE_DESCRIPTIONS,
} from '../constants';
import { TextInput, SelectInput, SearchableSelect } from './FormControls';
import { Heading, Group } from './Layout';
import { CAPS } from '../ui/rows';
import { useT, useLabel } from '../ui/prefs';
import { useUndo } from '../ui/undo';

interface Props {
    data: Summary_Product[];
    setData: (data: Summary_Product[]) => void;
    e83Rows: KeyValue[];
}

/** Product parameters by sector (Summary_Products columns P–AK). None is forced; the template's own checks decide. */
const SECTOR_PARAMS: { match: string[]; keys: string[] }[] = [
    {
        match: ['iron or steel products', 'crude steel', 'pig iron', 'direct reduced iron', 'alloys', 'sintered ore'],
        keys: ['param_reducing_agent', 'param_steel_mill_id', 'param_mn', 'param_cr', 'param_ni', 'param_other_alloys', 'param_carbon', 'param_scrap_steel', 'param_other_mat', 'param_pre_scrap'],
    },
    { match: ['aluminium products', 'unwrought aluminium'], keys: ['param_scrap_alu', 'param_pre_scrap', 'param_non_alu'] },
    { match: ['cement', 'cement clinker', 'calcined clays', 'aluminous cement'], keys: ['param_clinker', 'param_calcined'] },
    {
        match: ['ammonia', 'nitric acid', 'urea', 'mixed fertilisers'],
        keys: ['param_conc', 'param_nitric_acid', 'param_urea', 'param_n_total', 'param_n_nh4', 'param_n_no3', 'param_n_urea', 'param_n_other'],
    },
];

const CP_KEYS = ['cp_instrument', 'cp_share', 'cp_currency', 'cp_price_due', 'cp_rebate_type', 'cp_rebate_share', 'cp_rebate_amount'];

/** Titles in constants carry a column prefix ("R: % Mn (…)"); the column now shows as a field code instead. */
const TITLE_FIX: Record<string, string> = {
    process: 'Production process (所屬生產過程)',
    cn_code: 'CN code (CN 稅則號)',
    name: 'Product name (產品名稱)',
    cp_price_due: 'Carbon price due (應付碳價)',
    cp_rebate_type: 'Type of rebate or compensation (退還或補償類型)',
    cp_rebate_share: 'Share covered by the rebate (退還涵蓋比例)',
    cp_rebate_amount: 'Amount of the rebate (退還金額)',
};
const titleOf = (key: string) => TITLE_FIX[key] ?? (SUMMARY_PRODUCTS_FIELD_TITLES[key] ?? key).replace(/^[A-Z]{1,2}:\s*/, '');

const Summary_ProductsSection: React.FC<Props> = ({ data, setData, e83Rows }) => {
    const t = useT();
    const label = useLabel();
    const captureUndo = useUndo();
    const [selected, setSelected] = useState(0);
    const cap = CAPS['summary.products'];

    // The template's process list is the names entered in A_InstData 4(b).
    const processes = e83Rows
        .map((row, i) => ({ id: `P${i + 1}`, name: (row.l as string) || '', category: (row.e as string) || '' }))
        .filter(p => p.category && p.category !== 'n.a.');

    useEffect(() => {
        if (selected >= data.length && data.length) setSelected(data.length - 1);
    }, [data.length, selected]);

    const product = data[selected];
    const processOf = (p?: Summary_Product) => processes.find(x => x.name && x.name === p?.process);
    const category = (processOf(product)?.category ?? '').trim().toLowerCase();
    const paramKeys = SECTOR_PARAMS.find(s => s.match.includes(category))?.keys ?? [];
    const cnOptions = (FULL_CN_CODE_MAP[category] || []).map(code => ({ value: code, label: CN_CODE_DESCRIPTIONS[code] ? `${code} – ${CN_CODE_DESCRIPTIONS[code]}` : code }));
    const rowOf = selected + 10;

    const update = (field: string, value: string | number) => {
        const next = [...data];
        next[selected] = { ...next[selected], [field]: value };
        setData(next);
    };
    const add = () => {
        const first = processes.find(p => p.name);
        setData([...data, { process: first?.name ?? '' }]);
        setSelected(data.length);
    };
    const remove = () => {
        captureUndo(t(`已刪除產品 ${selected + 1}`, `Deleted product ${selected + 1}`));
        setData(data.filter((_, i) => i !== selected));
        setSelected(Math.max(0, selected - 1));
    };

    const field = (key: string) => {
        const title = titleOf(key);
        const code = `${SUMMARY_PRODUCTS_COLUMN_MAP[key]}${rowOf}`;
        const value = (product?.[key] as string) ?? '';
        const id = `prod-${key}`;
        switch (key) {
            case 'param_calcined': return <SelectInput key={key} label={title} code={code} id={id} options={AC_OPTIONS} value={value} onChange={e => update(key, e.target.value)} />;
            case 'param_reducing_agent': return <SelectInput key={key} label={title} code={code} id={id} options={PARAM_REDUCING_AGENT_OPTIONS} value={value} onChange={e => update(key, e.target.value)} />;
            case 'cp_instrument': return <SelectInput key={key} label={title} code={code} id={id} options={CP_INSTRUMENT_OPTIONS} value={value} onChange={e => update(key, e.target.value)} />;
            case 'cp_rebate_type': return <SelectInput key={key} label={title} code={code} id={id} options={CP_REBATE_TYPE_OPTIONS} value={value} onChange={e => update(key, e.target.value)} />;
            case 'cp_currency': return <SearchableSelect key={key} label={title} code={code} id={id} options={CURRENCY_OPTIONS} value={value} onChange={v => update(key, v)} />;
            default: {
                const textual = key.includes('id') || key.includes('reducing');
                const pct = /(^|_)(mn|cr|ni|other_alloys|carbon|other_mat|pre_scrap|non_alu|nitric_acid|urea|n_total|n_nh4|n_no3|n_urea|n_other|share|rebate_share)$/.test(key);
                return <TextInput key={key} label={title} code={code} id={id} type={textual ? 'text' : 'number'} unit={pct ? '%' : undefined} value={value} onChange={e => update(key, e.target.value)} />;
            }
        }
    };

    if (!processes.length) {
        return (
            <Group className="flex flex-col items-center py-12 text-center">
                <Boxes size={36} className="mb-3 text-slate-400" strokeWidth={1.5} />
                <p className="font-semibold text-slate-800">{t('還沒有生產過程', 'No production processes yet')}</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">{t('產品要掛在生產過程底下。先到「設施資訊」的 4(b) 新增生產過程並取名。', 'Each product belongs to a production process. Add and name one under Installation → 4(b) first.')}</p>
            </Group>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t('產品', 'Products')}>
                {data.map((p, i) => (
                    <button key={i} type="button" role="tab" aria-selected={i === selected} onClick={() => setSelected(i)}
                        className={`pressable rounded-full px-4 py-1.5 text-sm font-medium ${i === selected ? 'bg-slate-900 text-white' : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'}`}>
                        {(p.name as string) || t(`產品 ${i + 1}`, `Product ${i + 1}`)}
                    </button>
                ))}
                <button type="button" onClick={add} disabled={data.length >= cap}
                    className="pressable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-500/10 disabled:opacity-40"
                    title={data.length >= cap ? t(`已達官方範本上限 ${cap} 項`, `Official template holds ${cap} products`) : undefined}>
                    <Plus size={15} /> {t('新增產品', 'Add product')}
                </button>
            </div>

            {!product ? (
                <Group className="py-10 text-center text-sm text-slate-500">
                    {t('按「新增產品」為每個出口的 CBAM 產品（每個 CN 稅則號）建一筆資料。', 'Use “Add product” for each CBAM good you export (one per CN code).')}
                </Group>
            ) : (
                <>
                    <Group>
                        <div className="flex items-start justify-between gap-4">
                            <Heading label="Product (產品)" note={label('One entry per CN code you export. Several products can belong to the same production process. (每個出口的 CN 稅則號一筆；同一個生產過程可以有多個產品。)')} />
                            <button type="button" onClick={remove} className="pressable rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label={t('刪除這個產品', 'Delete this product')}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <SelectInput label={titleOf('process')} code={`D${rowOf}`} id="prod-process" required
                                options={processes.filter(p => p.name).map(p => ({ value: p.name, label: `${p.id} · ${p.name}` }))}
                                value={(product.process as string) || ''} onChange={e => update('process', e.target.value)} />
                            <SearchableSelect label={titleOf('cn_code')} code={`F${rowOf}`} id="prod-cn_code" required options={cnOptions}
                                value={(product.cn_code as string) || ''} onChange={v => update('cn_code', v)}
                                placeholder={cnOptions.length ? undefined : t('先選擇生產過程', 'Choose the process first')} />
                            <div className="md:col-span-2">
                                <TextInput label={titleOf('name')} code={`H${rowOf}`} id="prod-name" required value={(product.name as string) || ''} onChange={e => update('name', e.target.value)} />
                            </div>
                        </div>
                        {processes.some(p => !p.name) && (
                            <p className="mt-3 text-xs text-amber-600">{t('提醒：沒有名稱的生產過程無法被選取，請先到「設施資訊」4(b) 為它取名。', 'A process without a name cannot be picked; name it under Installation → 4(b).')}</p>
                        )}
                    </Group>

                    {paramKeys.length > 0 && (
                        <Group>
                            <Heading label="Product parameters (產品參數)" note={label('Reported to the importer with the product; leave blank what you do not know. (隨產品一併提供給進口商；不知道的可以留白。)')} />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{paramKeys.map(field)}</div>
                        </Group>
                    )}

                    <Group>
                        <Heading label="Carbon price paid in Taiwan (optional) (在台灣已付的碳價，選填)" note={label('For example the carbon fee paid to the Ministry of Environment. (例如繳給環境部的碳費。)')} />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{CP_KEYS.map(field)}</div>
                    </Group>
                </>
            )}
        </div>
    );
};

export default Summary_ProductsSection;
