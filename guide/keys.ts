/**
 * Turn a rendered field (its section, element id and template cell code) into the stable
 * key its guidance is stored under. Repeating rows and blocks share one entry: every
 * source stream's "Activity data" is B.d17.f, every precursor's SEE is E.see, and so on.
 */
export type GuideSection = 'A' | 'B' | 'C' | 'D' | 'E' | 'SumProc' | 'SumProd';

/** Precursor blocks on E_PurchPrec start at row 17 and repeat every 44 rows. */
const E_BASE = 17;
const E_STEP = 44;

const cellParts = (cell: string) => {
    const m = /^([A-Z]{1,3})(\d{1,4})$/.exec(cell);
    return m ? { col: m[1], row: Number(m[2]) } : null;
};

const precursorKey = (cell: string): string | null => {
    const p = cellParts(cell);
    if (!p) return null;
    const offset = (p.row - E_BASE) % E_STEP;
    if (p.col === 'L' && offset >= 0 && offset <= 10) return 'E.route';
    if (p.col === 'L' && offset >= 11 && offset <= 20) return 'E.process';
    if (p.col === 'L' && offset === 21) return 'E.other';
    if (offset === 32) return p.col === 'L' ? 'E.see' : 'E.seeSource';
    if (offset === 33) return p.col === 'L' ? 'E.elec' : 'E.elecSource';
    if (offset === 34) return p.col === 'L' ? 'E.elecEf' : 'E.elecEfSource';
    if (offset === 37 && p.col === 'K') return 'E.justification';
    return null;
};

const processKey = (cell: string): string => {
    const p = cellParts(cell);
    if (p && p.col === 'L' && p.row >= 16 && p.row <= 22) return 'D.route';
    if (p && p.col === 'L' && p.row >= 32 && p.row <= 40) return 'D.consumed';
    return `D.${cell}`;
};

export const guideKey = (section: GuideSection | undefined, id?: string, code?: string): string | null => {
    if (!section || !id) return null;
    let m: RegExpExecArray | null;
    switch (section) {
        case 'A':
            if ((m = /^(e62|e83|e102)-([a-z]+)-\d+$/.exec(id))) {
                const [, block, col] = m;
                if (block === 'e62' && 'ijklmn'.includes(col) && col.length === 1) return 'A.e62.route';
                if (block === 'e83' && 'fghijk'.includes(col) && col.length === 1) return 'A.e83.included';
                if (block === 'e102' && 'ghijk'.includes(col) && col.length === 1) return 'A.e102.route';
                return `A.${block}.${col}`;
            }
            return `A.${id}`;
        case 'B':
            if ((m = /^(d17|d98|d113)-([a-z]+)-\d+$/.exec(id))) return `B.${m[1]}.${m[2]}`;
            return null;
        case 'C':
            return `C.${id}`;
        case 'D': {
            const cell = code ?? /^P\d+-([A-Z]{1,3}\d{1,4})$/.exec(id)?.[1];
            return cell ? processKey(cell) : null;
        }
        case 'E': {
            const cell = code ?? id.replace(/^E-/, '');
            return precursorKey(cell);
        }
        case 'SumProc':
            return `SumProc.${id}`;
        case 'SumProd':
            if ((m = /^prod-(\w+)$/.exec(id))) return `SumProd.${m[1]}`;
            return null;
    }
};
