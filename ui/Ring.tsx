import React from 'react';

/** Small progress ring for the sidebar. `value` is 0..1; `null` shows an empty track. */
const Ring: React.FC<{ value: number | null; size?: number; onAccent?: boolean }> = ({ value, size = 18, onAccent = false }) => {
    const stroke = 2.5;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = value === null ? 0 : Math.max(0, Math.min(1, value));
    const done = v >= 0.999;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
            {v > 0 && (
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={onAccent ? '#ffffff' : done ? '#34c759' : 'var(--color-indigo-500)'}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${c * v} ${c}`}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 400ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                />
            )}
        </svg>
    );
};

export default Ring;
