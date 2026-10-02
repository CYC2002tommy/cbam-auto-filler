import React from 'react';

/**
 * The assistant is told to answer in a small Markdown subset: **bold**, "- " bullets and
 * "1. " steps, with no LaTeX (see ASSISTANT_INSTRUCTIONS in electron/gemini.cjs). Rendering
 * it to React elements rather than HTML keeps model output away from innerHTML. A heading
 * or symbol that slips through still reads as an ordinary line.
 */
const inline = (text: string): React.ReactNode[] =>
    text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rounded bg-slate-900/10 px-1 py-0.5 text-[0.8125rem]">{part.slice(1, -1)}</code>;
        return part;
    });

export const Rich: React.FC<{ text: string }> = ({ text }) => (
    <>
        {text.split('\n').map((line, i) => {
            const heading = /^#{1,6}\s+(.*)$/.exec(line);
            if (heading) return <div key={i} className="mt-2 font-semibold first:mt-0">{inline(heading[1])}</div>;
            const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
            if (bullet) return <div key={i} className="flex gap-1.5"><span className="shrink-0">•</span><span>{inline(bullet[1])}</span></div>;
            const step = /^\s*(\d+)\.\s+(.*)$/.exec(line);
            if (step) return <div key={i} className="flex gap-1.5"><span className="shrink-0">{step[1]}.</span><span>{inline(step[2])}</span></div>;
            if (!line.trim()) return <div key={i} className="h-2" />;
            return <div key={i}>{inline(line)}</div>;
        })}
    </>
);
