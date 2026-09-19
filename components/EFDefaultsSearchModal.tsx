import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { FUEL_DEFAULTS, type FuelDefault } from '../data/fuels';
import { useT, usePrefs } from '../ui/prefs';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (fuel: FuelDefault) => void;
}

/** Fuel default picker for combustion source streams (IPCC 2006 NCV and EF). */
const EFDefaultsSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const t = useT();
    const { lang } = usePrefs();
    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return FUEL_DEFAULTS.filter(f => !q || f.en.toLowerCase().includes(q) || f.zh.includes(q));
    }, [query]);

    return (
        <Sheet open={isOpen} onClose={onClose} title={t('燃料預設值', 'Fuel defaults')}>
            <p className="mb-3 text-[0.8125rem] leading-snug text-slate-500">
                {t('IPCC 2006 指南的預設淨熱值與排放係數。若供應商有提供分析數據，請改用供應商的數值。',
                    'Default net calorific values and emission factors from the IPCC 2006 Guidelines. Use your supplier’s analysis instead when you have one.')}
            </p>
            <div className="field mb-3 flex items-center gap-2 px-3 py-2">
                <Search size={15} className="text-slate-400" />
                <input
                    type="search"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder={t('搜尋燃料', 'Search fuels')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]" data-no-drag>
                {rows.map((f, i) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => { onSelect(f); onClose(); }}
                        className={`pressable flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-indigo-500/10 ${i ? 'hairline border-t' : ''}`}
                    >
                        <span className="flex-1">
                            <span className="block text-sm font-medium text-slate-900">{lang === 'zh' ? f.zh : f.en}</span>
                            {lang === 'zh' && <span className="block text-xs text-slate-500">{f.en}</span>}
                        </span>
                        <span className="text-right text-xs tabular-nums text-slate-600">
                            <span className="block">NCV {f.ncv} GJ/t</span>
                            <span className="block">EF {f.ef} tCO₂/TJ</span>
                        </span>
                    </button>
                ))}
                {!rows.length && <div className="px-4 py-6 text-center text-sm text-slate-500">{t('沒有符合的燃料', 'No matching fuel')}</div>}
            </div>
        </Sheet>
    );
};

export default EFDefaultsSearchModal;
