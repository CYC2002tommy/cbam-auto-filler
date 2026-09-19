import React from 'react';
import { motion, useAnimate, useDragControls, type PanInfo } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { caps } from '../template/templateMap.json';
import { useT } from './prefs';

/** Block capacities read from the official template (tools/gen_template_map.py). */
export const CAPS = caps as Record<string, number>;

const NO_DRAG = 'input,select,textarea,button,a,label,[data-no-drag]';

/**
 * A repeating-row card that can be swiped left to delete (apple-design §2, §9).
 * Dragging starts only from the card's own surface, so inputs keep normal text
 * selection. A visible delete button stays for anyone who never swipes.
 */
export const SwipeRow: React.FC<{ onDelete: () => void; children: React.ReactNode; label?: string }> = ({ onDelete, children, label }) => {
    const [scope, animate] = useAnimate();
    const controls = useDragControls();
    const t = useT();

    const remove = async (velocity = 0) => {
        await animate(scope.current, { x: -(scope.current?.offsetWidth ?? 600) - 40, opacity: 0 },
            { type: 'spring', bounce: 0, duration: 0.3, velocity });
        onDelete();
    };

    const onDragEnd = (_: unknown, info: PanInfo) => {
        const w = scope.current?.offsetWidth ?? 600;
        if (info.offset.x < -w * 0.35 || info.velocity.x < -700) {
            remove(info.velocity.x);
        } else {
            animate(scope.current, { x: 0 }, { type: 'spring', bounce: 0.25, duration: 0.4, velocity: info.velocity.x });
        }
    };

    return (
        <div className="relative overflow-hidden rounded-[var(--radius-card)]">
            <div className="absolute inset-0 flex items-center justify-end rounded-[var(--radius-card)] bg-red-500 pr-6 text-white" aria-hidden="true">
                <Trash2 size={20} />
            </div>
            <motion.div
                ref={scope}
                className="card relative"
                drag="x"
                dragListener={false}
                dragControls={controls}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.6, right: 0.04 }}
                dragMomentum={false}
                onDragEnd={onDragEnd}
                onPointerDown={e => {
                    if (!(e.target as HTMLElement).closest(NO_DRAG)) controls.start(e);
                }}
            >
                <button
                    type="button"
                    onClick={() => remove()}
                    className="pressable absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={label ? `${t('刪除', 'Delete')} ${label}` : t('刪除此列', 'Delete row')}
                    title={t('刪除（也可向左滑）', 'Delete (or swipe left)')}
                >
                    <Trash2 size={16} />
                </button>
                <div className="p-5 pr-12">{children}</div>
            </motion.div>
        </div>
    );
};

/** "Add row" that stops at the template's capacity and says why. */
export const AddRowButton: React.FC<{ count: number; cap: number; onAdd: () => void; label?: string }> = ({ count, cap, onAdd, label }) => {
    const t = useT();
    const full = count >= cap;
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onAdd}
                disabled={full}
                className="pressable inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
                <Plus size={16} />
                {label ?? t('新增一列', 'Add row')}
            </button>
            <span className={`text-xs ${full ? 'text-amber-600' : 'text-slate-500'}`}>
                {full
                    ? t(`已達官方範本上限 ${cap} 列`, `Official template holds ${cap} rows`)
                    : t(`${count} / ${cap} 列`, `${count} of ${cap} rows`)}
            </span>
        </div>
    );
};
