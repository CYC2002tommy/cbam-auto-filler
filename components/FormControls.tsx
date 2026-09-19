
import React, { InputHTMLAttributes, SelectHTMLAttributes, useState, useRef, useEffect } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    unit?: string;
}

export const TextInput: React.FC<InputProps> = ({ label, id, required, unit, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <input 
                id={id} 
                required={required}
                {...props} 
                onWheel={(e) => props.type === 'number' && e.currentTarget.blur()}
                className={`block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${unit ? 'pr-12' : ''}`} 
            />
            {unit && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-500 sm:text-sm">{unit}</span>
                </div>
            )}
        </div>
    </div>
);

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    options: (string | SelectOption)[];
    includeEmpty?: boolean;
}

export const SelectInput: React.FC<SelectProps> = ({ label, id, options, required, includeEmpty = true, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <select 
            id={id} 
            required={required}
            {...props} 
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
            {includeEmpty && <option value="">--- Please Select (請選擇) ---</option>}
            {options.map((opt, idx) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const displayLabel = typeof opt === 'string' ? opt : opt.label;
                return <option key={`${value}-${idx}`} value={value}>{displayLabel}</option>;
            })}
        </select>
    </div>
);

interface SearchableSelectProps {
    label: string;
    id: string;
    options: (string | SelectOption)[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, id, options, value, onChange, required, placeholder = "--- Please Select (請選擇) ---" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const filteredOptions = options.filter(opt => {
        const str = typeof opt === 'string' ? opt : opt.label;
        return str.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (typeof opt !== 'string' && opt.value.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const selectedOption = options.find(opt => 
        (typeof opt === 'string' ? opt : opt.value) === value
    );
    const displayValue = selectedOption 
        ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
        : value;

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500 font-bold">*</span>}
            </label>
            <div 
                className={`mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm cursor-pointer flex justify-between items-center ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearchTerm('');
                }}
            >
                <span className={`block truncate ${value ? "text-slate-900" : "text-slate-400"}`}>
                    {value ? displayValue : placeholder}
                </span>
                <svg className="h-5 w-5 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="Search (搜尋)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => {
                             const optValue = typeof opt === 'string' ? opt : opt.value;
                             const optLabel = typeof opt === 'string' ? opt : opt.label;
                             return (
                                <div
                                    key={`${optValue}-${idx}`}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${value === optValue ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-900'}`}
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="block truncate">{optLabel}</span>
                                    {value === optValue && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-slate-500 italic">
                            No results (無符合結果)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'add' | 'remove' | 'action' | 'primary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'add', ...props }) => {
    const baseClasses = "px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantClasses = {
        add: "bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500",
        remove: "bg-red-500 text-white rounded-full p-1 w-7 h-7 flex items-center justify-center hover:bg-red-600 focus:ring-red-500",
        action: "bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500",
        primary: "w-full sm:w-auto bg-emerald-500 text-white px-8 py-3 text-lg font-semibold hover:bg-emerald-600 focus:ring-emerald-500 transition-transform transform hover:scale-105"
    };
    return (
        <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
            {variant === 'remove' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : children}
        </button>
    );
};
