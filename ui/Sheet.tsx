import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useAnimate, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    width?: string;
}

/**
 * Side sheet that slides in from the right and leaves the same way (apple-design §7).
 * It tracks the pointer 1:1 while dragged, resists being pulled left, and a flick or
 * a drag past a third of its width dismisses it with the release velocity (§5, §6).
 */
const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children, width = 'min(34rem, 92vw)' }) => {
    const [scope, animate] = useAnimate();
    const returnFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;
        returnFocus.current = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            returnFocus.current?.focus?.();
        };
    }, [open, onClose]);

    const onDragEnd = async (_: unknown, info: PanInfo) => {
        const w = (scope.current as HTMLElement | null)?.offsetWidth ?? 480;
        const projected = info.offset.x + (info.velocity.x / 1000) * 0.998 / (1 - 0.998);
        if (projected > w * 0.4 || info.velocity.x > 800) {
            await animate(scope.current, { x: w + 40 }, { type: 'spring', bounce: 0.2, duration: 0.35, velocity: info.velocity.x });
            onClose();
        } else {
            animate(scope.current, { x: 0 }, { type: 'spring', bounce: 0.2, duration: 0.4, velocity: info.velocity.x });
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                    <motion.div
                        className="absolute inset-0 bg-black/25"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        ref={scope}
                        className="material-sheet absolute bottom-3 right-3 top-3 flex flex-col overflow-hidden"
                        style={{ width, borderRadius: 'var(--radius-sheet)' }}
                        initial={{ x: '105%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '105%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.04, right: 0.9 }}
                        dragMomentum={false}
                        onDragEnd={onDragEnd}
                        tabIndex={-1}
                    >
                        <header className="flex items-center gap-3 px-5 pb-3 pt-4">
                            <div className="mx-auto h-1 w-9 rounded-full bg-slate-300 absolute left-1/2 top-1.5 -translate-x-1/2" aria-hidden="true" />
                            <h2 className="flex-1 text-lg font-semibold text-slate-900">{title}</h2>
                            <button onClick={onClose} className="pressable rounded-full p-1.5 text-slate-500 hover:bg-slate-200/70" aria-label="Close">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto px-5 pb-5" onPointerDownCapture={e => {
                            // Let text inputs and scrolling lists keep their own pointer behaviour.
                            if ((e.target as HTMLElement).closest('input,textarea,select,table,[data-no-drag]')) e.stopPropagation();
                        }}>
                            {children}
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Sheet;
