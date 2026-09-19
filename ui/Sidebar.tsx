import React, { useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import Ring from './Ring';

export interface NavItem {
    id: string;
    zh: string;
    en: string;
    icon: LucideIcon;
    progress?: number | null;
}

export interface NavGroup {
    zh: string;
    en: string;
    items: NavItem[];
}

const MIN = 208;
const MAX = 360;
const COLLAPSED = 68;
const COLLAPSE_BELOW = 150;

/** Rubber-band past a bound: the further out, the less the edge follows (apple-design §9). */
const rubberband = (over: number, dim: number, k = 0.55) => (over * dim * k) / (dim + k * Math.abs(over));

interface SidebarProps {
    groups: NavGroup[];
    active: string;
    onSelect: (id: string) => void;
    lang: 'zh' | 'en';
    header: React.ReactNode;
    footer: React.ReactNode;
}

/**
 * Translucent source-list sidebar. Its edge follows the pointer 1:1 with rubber-band
 * resistance past the min and max widths; dragging it narrow (or flinging it left)
 * collapses it to icons, and the settle is a spring that inherits the release velocity.
 */
const Sidebar: React.FC<SidebarProps> = ({ groups, active, onSelect, lang, header, footer }) => {
    const width = useMotionValue(248);
    const lastOpenWidth = useRef(248);
    const collapsed = useTransform(width, w => w < 120);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    React.useEffect(() => collapsed.on('change', setIsCollapsed), [collapsed]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const handle = e.currentTarget;
        handle.setPointerCapture(e.pointerId);
        const startX = e.clientX;
        const startW = width.get();
        const history: { x: number; t: number }[] = [];

        const move = (ev: PointerEvent) => {
            history.push({ x: ev.clientX, t: performance.now() });
            if (history.length > 5) history.shift();
            const raw = startW + (ev.clientX - startX);
            let w = raw;
            if (raw > MAX) w = MAX + rubberband(raw - MAX, MAX);
            else if (raw < COLLAPSED) w = COLLAPSED - rubberband(COLLAPSED - raw, COLLAPSED);
            width.set(w);
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            const first = history[0];
            const last = history[history.length - 1];
            const velocity = first && last && last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0;
            const w = width.get();
            const shouldCollapse = w < COLLAPSE_BELOW || velocity < -900;
            const target = shouldCollapse ? COLLAPSED : Math.min(MAX, Math.max(MIN, w));
            if (!shouldCollapse) lastOpenWidth.current = target;
            // Bounce only because the user's fling carried momentum.
            animate(width, target, { type: 'spring', bounce: Math.abs(velocity) > 600 ? 0.2 : 0, duration: 0.4, velocity });
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
    };

    const toggle = () => {
        const target = isCollapsed ? lastOpenWidth.current : COLLAPSED;
        animate(width, target, { type: 'spring', bounce: 0, duration: 0.35 });
    };

    return (
        <motion.aside style={{ width }} className="material-sidebar relative flex h-full shrink-0 flex-col hairline border-r">
            <div className={`px-4 pb-2 pt-5 ${isCollapsed ? 'px-2 text-center' : ''}`}>{header}</div>
            <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label={lang === 'zh' ? '區塊' : 'Sections'}>
                {groups.map(group => (
                    <div key={group.en} className="mt-4 first:mt-1">
                        {!isCollapsed && (
                            <div className="px-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500">
                                {lang === 'zh' ? group.zh : group.en}
                            </div>
                        )}
                        {group.items.map(item => {
                            const Icon = item.icon;
                            const on = item.id === active;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item.id)}
                                    title={isCollapsed ? (lang === 'zh' ? item.zh : item.en) : undefined}
                                    aria-current={on ? 'page' : undefined}
                                    className={`pressable mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[0.875rem] ${
                                        on ? 'bg-indigo-500 text-white' : 'text-slate-800 hover:bg-slate-900/5'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <Icon size={17} className={on ? 'text-white' : 'text-indigo-500'} strokeWidth={1.8} />
                                    {!isCollapsed && <span className="flex-1 truncate">{lang === 'zh' ? item.zh : item.en}</span>}
                                    {!isCollapsed && item.progress !== undefined && (
                                        <span className={on ? 'text-white' : 'text-slate-400'}><Ring value={item.progress} size={16} onAccent={on} /></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>
            <div className={`hairline border-t px-3 py-3 ${isCollapsed ? 'px-2' : ''}`}>{footer}</div>

            {/* Resize / collapse handle */}
            <div
                role="separator"
                aria-orientation="vertical"
                aria-label={lang === 'zh' ? '拖曳調整側邊欄寬度，雙擊收合' : 'Drag to resize the sidebar, double-click to collapse'}
                onPointerDown={onPointerDown}
                onDoubleClick={toggle}
                className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none"
            />
        </motion.aside>
    );
};

export default Sidebar;
