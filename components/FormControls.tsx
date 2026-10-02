import React, { InputHTMLAttributes, SelectHTMLAttributes, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, HelpCircle } from 'lucide-react';
import { splitLabel, usePrefs, useOptionLabel, useT } from '../ui/prefs';
import { GUIDE } from '../guide/content';
import { guideKey } from '../guide/keys';
import { useGuideScope } from '../guide/scope';
import { FieldHelpPanel, FieldWarning } from './FieldGuide';

const CELL = /^[A-Z]{1,3}\d{1,4}$/;

/**
 * Field label. In Chinese mode the EU template's English name sits underneath in
 * small type, so users can match the field against EU guidance; in English mode it is
 * English only. The cell code (I20, L65…) shows only when "顯示欄位代號" is on.
 */
export const FieldLabel: React.FC<{ label: string; htmlFor?: string; required?: boolean; code?: string }> = ({ label, htmlFor, required, code }) => {
    const { lang } = usePrefs();
    const { zh, en } = splitLabel(label);
    const main = lang === 'zh' ? (zh || en) : (en || zh);
    const sub = lang === 'zh' && zh && en ? en : '';
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block">
            <span className="flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-slate-700">
                <span>{main}</span>
                {required && <span className="text-red-500" aria-hidden="true">*</span>}
                {code && <span className="field-code rounded bg-slate-100 px-1 font-mono text-[0.6875rem] text-slate-500">{code}</span>}
            </span>
            {sub && <span className="block text-[0.6875rem] leading-tight tracking-normal text-slate-500">{sub}</span>}
        </label>
    );
};

const codeFor = (id?: string, code?: string) => code ?? (id && CELL.test(id) ? id : undefined);

/**
 * Label, control and beginner guidance for one field. The guidance is found from the page
 * the field sits on (GuideScope) and its id/cell code, so call sites stay unchanged:
 * a one-line hint under the control while beginner guidance is on, and a "?" that opens
 * the full explanation and the AI at any time.
 */
export const FieldShell: React.FC<{
    id: string; label: string; required?: boolean; code?: string; warning?: string | null;
    className?: string; children: React.ReactNode;
}> = ({ id, label, required, code, warning, className, children }) => {
    const { lang, guide } = usePrefs();
    const t = useT();
    const scope = useGuideScope();
    const [open, setOpen] = useState(false);
    const cell = codeFor(id, code);
    const key = guideKey(scope.section, id, cell);
    const entry = key ? GUIDE[key] : undefined;
    if (import.meta.env.DEV && scope.section && !entry) console.warn(`[guide] no entry for ${scope.section} ${id} (${key})`);
    const { zh, en } = splitLabel(label);
    const shown = lang === 'zh' ? (zh || en) : (en || zh);
    return (
        <div className={className} data-guide={entry ? key! : undefined} data-guide-missing={scope.section && !entry ? id : undefined}>
            <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1"><FieldLabel label={label} htmlFor={id} required={required} code={cell} /></div>
                {entry && (
                    <button type="button" data-guide-help onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={`${id}-guide`}
                        aria-label={t(`「${shown}」的說明`, `Help for "${shown}"`)} title={t('說明與問 AI', 'Help and Ask AI')}
                        className={`pressable -mt-0.5 shrink-0 rounded-full p-0.5 ${open ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
                        <HelpCircle size={16} />
                    </button>
                )}
            </div>
            {children}
            {warning && <FieldWarning text={warning} />}
            {entry && guide && !open && <p className="mt-1 text-xs leading-snug text-slate-500">{entry[lang].short}</p>}
            {entry && open && <FieldHelpPanel id={id} label={shown} code={cell} entry={entry} />}
        </div>
    );
};

/** Checks every number field gets for free; callers add their own context-aware warning. */
const useNumberWarning = (type?: string, unit?: string, value?: unknown) => {
    const t = useT();
    if (type !== 'number' || value === undefined || value === null || String(value).trim() === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n < 0) return t('這一格不能是負數。', 'This value cannot be negative.');
    if (unit === '%' && n > 100) return t('百分比要在 0 到 100 之間（18 代表 18%）。', 'A percentage must be between 0 and 100 (18 means 18%).');
    return null;
};

const controlBase =
    'field block w-full px-3 py-2 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    unit?: string;
    code?: string;
    /** A non-blocking hint shown under the field, e.g. a value that looks like the wrong unit. */
    warning?: string | null;
}

export const TextInput: React.FC<InputProps> = ({ label, id, required, unit, code, warning, ...props }) => {
    const generic = useNumberWarning(props.type, unit, props.value);
    return (
    <FieldShell id={id} label={label} required={required} code={code} warning={warning || generic}>
        <div className="relative">
            <input
                id={id}
                required={required}
                {...props}
                onWheel={(e) => props.type === 'number' && e.currentTarget.blur()}
                className={`${controlBase} ${props.type === 'number' ? 'tabular-nums' : ''} ${unit ? 'pr-14' : ''}`}
            />
            {unit && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{unit}</span>
            )}
        </div>
    </FieldShell>
    );
};

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    options: (string | SelectOption)[];
    includeEmpty?: boolean;
    code?: string;
}

export const SelectInput: React.FC<SelectProps> = ({ label, id, options, required, includeEmpty = true, code, ...props }) => {
    const optionLabel = useOptionLabel();
    const t = useT();
    return (
        <FieldShell id={id} label={label} required={required} code={code}>
            <div className="relative">
                <select id={id} required={required} {...props} className={`${controlBase} appearance-none pr-9`}>
                    {includeEmpty && <option value="">{t('請選擇…', 'Select…')}</option>}
                    {options.map((opt, idx) => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const text = typeof opt === 'string' ? optionLabel(opt) : optionLabel(opt.value, opt.label);
                        return <option key={`${value}-${idx}`} value={value}>{text}</option>;
                    })}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
        </FieldShell>
    );
};

interface SearchableSelectProps {
    label: string;
    id: string;
    options: (string | SelectOption)[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    code?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, id, options, value, onChange, required, placeholder, code }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const optionLabel = useOptionLabel();
    const t = useT();

    /** Put the list under the trigger, or above it when there is no room below. */
    const place = useCallback(() => {
        const trigger = wrapperRef.current?.querySelector('button');
        if (!trigger) return;
        const r = trigger.getBoundingClientRect();
        const below = window.innerHeight - r.bottom;
        const height = popoverRef.current?.offsetHeight ?? 280;
        const top = below < Math.min(height, 300) && r.top > below ? Math.max(8, r.top - height - 6) : r.bottom + 6;
        setRect({ top, left: r.left, width: r.width });
    }, []);

    useLayoutEffect(() => { if (isOpen) place(); }, [isOpen, place]);

    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (wrapperRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [isOpen, place]);

    const textOf = (opt: string | SelectOption) => (typeof opt === 'string' ? optionLabel(opt) : optionLabel(opt.value, opt.label));
    const valueOf = (opt: string | SelectOption) => (typeof opt === 'string' ? opt : opt.value);
    const term = searchTerm.toLowerCase();
    const filteredOptions = options.filter(opt => textOf(opt).toLowerCase().includes(term) || valueOf(opt).toLowerCase().includes(term));
    const selected = options.find(opt => valueOf(opt) === value);

    return (
        <FieldShell id={id} label={label} required={required} code={code} className="relative">
          <div ref={wrapperRef}>
            <button
                id={id}
                type="button"
                className={`${controlBase} flex items-center justify-between text-left`}
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(''); }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
                    {value ? (selected ? textOf(selected) : value) : (placeholder ?? t('請選擇…', 'Select…'))}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                // Rendered at the top level: a row card clips its own overflow while it is
                // being swiped, which would otherwise cut the list off.
                <div
                    ref={popoverRef}
                    className="material-sheet fixed z-[80] overflow-hidden rounded-[var(--radius-control)]"
                    style={{ top: rect.top, left: rect.left, width: rect.width, transformOrigin: 'top center' }}
                >
                    <div className="flex items-center gap-2 px-3 py-2 hairline border-b">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder={t('搜尋', 'Search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-auto py-1" role="listbox">
                        {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => {
                            const optValue = valueOf(opt);
                            const active = value === optValue;
                            return (
                                <div
                                    key={`${optValue}-${idx}`}
                                    role="option"
                                    aria-selected={active}
                                    className={`mx-1 flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm ${active ? 'bg-indigo-500 text-white' : 'text-slate-800 hover:bg-indigo-500/10'}`}
                                    onClick={() => { onChange(optValue); setIsOpen(false); }}
                                >
                                    <span className="truncate">{textOf(opt)}</span>
                                    {active && <Check size={14} />}
                                </div>
                            );
                        }) : (
                            <div className="px-3 py-2 text-sm text-slate-500">{t('沒有符合的結果', 'No results')}</div>
                        )}
                    </div>
                </div>,
                document.body,
            )}
          </div>
        </FieldShell>
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'add' | 'remove' | 'action' | 'primary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'add', ...props }) => {
    const t = useT();
    const { lang } = usePrefs();
    if (typeof children === 'string') {
        const { zh, en } = splitLabel(children);
        children = lang === 'zh' ? (zh || en) : (en || zh);
    }
    const styles = {
        add: 'rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600',
        remove: 'flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500',
        action: 'rounded-full bg-slate-200/70 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300/70',
        primary: 'rounded-full bg-indigo-500 px-6 py-2.5 font-semibold text-white hover:bg-indigo-600',
    };
    return (
        <button type="button" className={`pressable disabled:opacity-40 ${styles[variant]}`} {...props}>
            {variant === 'remove' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={t('刪除', 'Remove')}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : children}
        </button>
    );
};
