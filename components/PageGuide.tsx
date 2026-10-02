import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, ClipboardCheck } from 'lucide-react';
import { PAGES, type GuidePage, type TourStep } from '../guide/pages';
import { usePrefs, useT, read, write } from '../ui/prefs';

/* First-visit tours: which pages have been toured, and whether tours start on their own. */
const SEEN_KEY = 'cbam.toursSeen';
const AUTO_KEY = 'cbam.tourAuto';

const seenPages = (): string[] => {
    try { const v = JSON.parse(read(SEEN_KEY, '[]')); return Array.isArray(v) ? v : []; } catch { return []; }
};
export const markTourSeen = (page: GuidePage) => {
    const seen = seenPages();
    if (!seen.includes(page)) write(SEEN_KEY, JSON.stringify([...seen, page]));
};
export const tourDue = (page: GuidePage) => read(AUTO_KEY, '1') === '1' && !seenPages().includes(page);
export const setTourAuto = (on: boolean) => write(AUTO_KEY, on ? '1' : '0');

/** Intro card under the page title: what the page is for and what to have at hand. */
export const PageIntro: React.FC<{ page: GuidePage }> = ({ page }) => {
    const { lang } = usePrefs();
    const t = useT();
    const content = PAGES[page];
    return (
        <details open className="group mt-4 rounded-[var(--radius-card)] bg-emerald-500/[0.07] px-4 py-3">
            <summary className="flex cursor-default list-none items-center gap-2 text-[0.8125rem] font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                <Lightbulb size={15} className="shrink-0 text-emerald-600" />
                <span className="flex-1">{t('這一頁要做什麼', 'What this page is for')}</span>
                <span className="text-xs font-normal text-slate-500 group-open:hidden">{t('展開', 'Show')}</span>
                <span className="hidden text-xs font-normal text-slate-500 group-open:inline">{t('收起', 'Hide')}</span>
            </summary>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-700">{content.intro[lang]}</p>
            <div className="mt-3 flex items-center gap-1.5 text-[0.8125rem] font-medium text-slate-800">
                <ClipboardCheck size={14} className="text-emerald-600" />
                {t('開始前先準備', 'Have these ready')}
            </div>
            <ul className="mt-1 space-y-0.5 text-[0.8125rem] leading-relaxed text-slate-700">
                {content.prepare[lang].map(item => (
                    <li key={item} className="flex gap-1.5"><span className="shrink-0 text-emerald-600">□</span><span>{item}</span></li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
                {t('每一格右邊的 ? 有完整說明，也可以問 AI。', 'The ? next to each field has full help and the AI.')}
            </p>
        </details>
    );
};

/** First element matching the selector that is actually on screen (not inside a hidden page or a closed section). */
const findVisible = (selector: string): HTMLElement | null => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
        if (el.getClientRects().length > 0 && !el.closest('[hidden]')) return el;
    }
    return null;
};

interface Box { top: number; left: number; width: number; height: number }

/**
 * A spotlight tour: dims the page, rings one element, and explains it. It only points;
 * the page underneath cannot be edited until the tour ends, and nothing is filled in.
 */
export const Tour: React.FC<{ page: GuidePage; onClose: () => void }> = ({ page, onClose }) => {
    const { lang } = usePrefs();
    const t = useT();
    // Chosen after the page is on screen, so steps for fields that are not shown are dropped.
    const [steps, setSteps] = useState<TourStep[] | null>(null);
    useLayoutEffect(() => { setSteps(PAGES[page].tour.filter(s => findVisible(s.target))); }, [page]);
    const [index, setIndex] = useState(0);
    const [box, setBox] = useState<Box | null>(null);
    const popover = useRef<HTMLDivElement>(null);
    const nextButton = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
    const step = steps?.[index];

    const finish = useCallback((never = false) => {
        markTourSeen(page);
        if (never) setTourAuto(false);
        onClose();
    }, [page, onClose]);

    // Nothing to point at on this page yet (e.g. no processes added): end quietly, and do
    // not mark it seen, so the tour runs once the page has content.
    useEffect(() => { if (steps && !steps.length) onClose(); }, [steps, onClose]);

    const measure = useCallback(() => {
        const el = step && findVisible(step.target);
        if (!el) { setBox(null); return; }
        const r = el.getBoundingClientRect();
        setBox({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    }, [step]);

    useLayoutEffect(() => {
        const el = step && findVisible(step.target);
        el?.scrollIntoView({ block: 'center', behavior: 'auto' });
        measure();
        nextButton.current?.focus();
    }, [step, measure]);

    useEffect(() => {
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
    }, [measure]);

    // Place the explanation below the element, or above it when there is no room.
    useLayoutEffect(() => {
        const card = popover.current;
        if (!card) return;
        const w = card.offsetWidth, h = card.offsetHeight, margin = 12;
        if (!box) { setPos({ top: (window.innerHeight - h) / 2, left: (window.innerWidth - w) / 2 }); return; }
        const below = box.top + box.height + margin;
        const top = below + h < window.innerHeight - margin ? below : Math.max(margin, box.top - h - margin);
        const left = Math.min(Math.max(margin, box.left), window.innerWidth - w - margin);
        setPos({ top, left });
    }, [box, index]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const card = popover.current;
            if (e.key === 'Escape') { finish(); return; }
            // Keep keyboard focus inside the card: the page behind it cannot be used during a tour.
            if (e.key === 'Tab' && card) {
                const items: HTMLElement[] = Array.from(card.querySelectorAll('button'));
                if (!items.length) return;
                e.preventDefault();
                const i = items.indexOf(document.activeElement as HTMLElement);
                const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i < 0 || i === items.length - 1 ? 0 : i + 1);
                items[next].focus();
                return;
            }
            // Arrow keys move the tour only from inside the card, never from a text field.
            if (!card?.contains(document.activeElement)) return;
            if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, (steps?.length ?? 1) - 1));
            else if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [finish, steps]);

    if (!steps || !step) return null;
    const last = index === steps.length - 1;

    return createPortal(
        <div className="fixed inset-0 z-[90]" aria-live="polite">
            {box ? (
                <div className="pointer-events-none fixed rounded-xl ring-2 ring-indigo-500 motion-safe:transition-all motion-safe:duration-200"
                    style={{ ...box, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)' }} />
            ) : (
                <div className="fixed inset-0 bg-slate-900/45" />
            )}
            <div ref={popover} role="dialog" aria-modal="true" aria-labelledby="tour-title"
                className="material-sheet fixed w-[min(22rem,calc(100vw-1.5rem))] rounded-[var(--radius-card)] p-4"
                style={{ top: pos.top, left: pos.left }}>
                <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-indigo-600">
                    {t(`導覽 ${index + 1} / ${steps.length}`, `Tour ${index + 1} of ${steps.length}`)}
                </div>
                <h3 id="tour-title" className="mt-1 text-[0.9375rem] font-semibold text-slate-900">{step.title[lang]}</h3>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-700">{step.body[lang]}</p>
                <div className="mt-4 flex items-center gap-2">
                    <button type="button" onClick={() => finish(true)} className="pressable mr-auto text-xs text-slate-500 hover:underline">
                        {t('不再自動播放', 'Don’t show tours')}
                    </button>
                    {index > 0 && (
                        <button type="button" onClick={() => setIndex(i => i - 1)}
                            className="pressable rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-900/5">
                            {t('上一步', 'Back')}
                        </button>
                    )}
                    {!last && (
                        <button type="button" onClick={() => finish()}
                            className="pressable rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-900/5">
                            {t('略過', 'Skip')}
                        </button>
                    )}
                    <button ref={nextButton} type="button" onClick={() => (last ? finish() : setIndex(i => i + 1))}
                        className="pressable rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600">
                        {last ? t('完成', 'Done') : t('下一步', 'Next')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};
