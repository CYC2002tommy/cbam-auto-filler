import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Tone = 'info' | 'success' | 'error';

interface ToastInput {
    message: string;
    tone?: Tone;
    action?: { label: string; onClick: () => void };
    duration?: number;
}

interface ToastItem extends ToastInput { id: number; }

const ToastContext = createContext<{ show: (t: ToastInput) => number; dismiss: (id: number) => void } | null>(null);

const TONE_DOT: Record<Tone, string> = {
    info: 'bg-indigo-500',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ToastItem[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => setItems(list => list.filter(t => t.id !== id)), []);

    const show = useCallback((input: ToastInput) => {
        const id = nextId.current++;
        setItems(list => [...list.slice(-2), { ...input, id }]);
        const ms = input.duration ?? (input.action ? 6000 : input.tone === 'error' ? 7000 : 3500);
        window.setTimeout(() => dismiss(id), ms);
        return id;
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ show, dismiss }}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2" aria-live="polite">
                <AnimatePresence initial={false}>
                    {items.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                            className="material-sheet pointer-events-auto flex max-w-[34rem] items-center gap-3 rounded-full py-2.5 pl-4 pr-2 text-sm"
                            role={t.tone === 'error' ? 'alert' : 'status'}
                        >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[t.tone ?? 'info']}`} />
                            <span className="text-slate-800">{t.message}</span>
                            {t.action ? (
                                <button
                                    className="pressable rounded-full px-3 py-1 font-semibold text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                                >
                                    {t.action.label}
                                </button>
                            ) : (
                                <span className="w-2" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
};
