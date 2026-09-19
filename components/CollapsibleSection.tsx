import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLabel } from '../ui/prefs';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    startOpen?: boolean;
    isSubSection?: boolean;
    noCollapse?: boolean;
}

/** The one card used by every form section. Sub-sections are lighter, inset groups. */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, startOpen = false, isSubSection = false, noCollapse = false }) => {
    const [isOpen, setIsOpen] = useState(startOpen || noCollapse);
    const label = useLabel();
    const open = isOpen || noCollapse;

    const header = (
        <>
            <h2 className={isSubSection ? 'text-base font-semibold text-slate-800' : 'text-xl font-semibold text-slate-900'}>{label(title)}</h2>
            {!noCollapse && <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />}
        </>
    );

    return (
        <section className={isSubSection ? 'mt-6' : 'card overflow-hidden'}>
            {noCollapse ? (
                <div className={`flex items-center justify-between ${isSubSection ? 'mb-3' : 'px-6 pb-2 pt-6'}`}>{header}</div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={open}
                    className={`flex w-full items-center justify-between text-left ${isSubSection ? 'mb-3' : 'px-6 pb-2 pt-6'}`}
                >
                    {header}
                </button>
            )}
            <div className={isSubSection ? 'rounded-[var(--radius-card)] bg-slate-50 p-5' : 'px-6 pb-6 pt-2'} style={{ display: open ? 'block' : 'none' }}>
                {children}
            </div>
        </section>
    );
};

export default CollapsibleSection;
