import map from './templateMap.json';

/**
 * Option lists read from the official template's own data validations.
 *
 * Hand-kept copies drifted from the template: the goods list needs the trailing space in
 * "Calcined clays ", the justification list says "…more accurate monitoring", and the
 * country list had turned into two-letter codes for half the world. Deriving them here
 * means a value the user picks is always a value the template accepts.
 */
const CELLS = map.cells as Record<string, Record<string, { t: string; l?: string }>>;
const LISTS = map.lists as Record<string, (string | number | boolean)[]>;

export const listFor = (sheet: string, cell: string): string[] => {
    const id = CELLS[sheet]?.[cell]?.l;
    const values = id ? LISTS[id] : undefined;
    if (!values) throw new Error(`Template has no option list at ${sheet}!${cell}`);
    return values.map(String);
};
