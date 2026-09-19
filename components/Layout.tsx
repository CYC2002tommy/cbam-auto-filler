import React from 'react';
import { useLabel } from '../ui/prefs';

/** Section heading from an existing bilingual label; an optional one-line explanation sits under it. */
export const Heading: React.FC<{ label: string; note?: string; level?: 3 | 4 }> = ({ label, note, level = 3 }) => {
    const pick = useLabel();
    const Tag = level === 3 ? 'h3' : 'h4';
    return (
        <div className={level === 3 ? 'mb-3' : 'mb-2'}>
            <Tag className={level === 3 ? 'text-[1.0625rem] font-semibold text-slate-900' : 'text-[0.9375rem] font-semibold text-slate-800'}>
                {pick(label)}
            </Tag>
            {note && <p className="mt-0.5 text-[0.8125rem] leading-snug text-slate-500">{note}</p>}
        </div>
    );
};

/** A white grouped card, the one surface every section's fields sit on. */
export const Group: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <section className={`card p-6 ${className}`}>{children}</section>
);
