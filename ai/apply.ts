import type { FormData, KeyValue } from '../types';
import { AI_FIELDS, type AiField } from './fields';

export interface RawValue {
    fieldId: string;
    value: string;
    unit?: string;
    evidence: string;
    confidence: number;
    source: string;   // file name
}

export interface Proposal {
    key: string;              // fieldId, plus the chosen destination
    field: AiField;
    value: string;
    unit?: string;
    parts: RawValue[];        // every document that contributed
    accepted: boolean;
    destination?: string;     // process id / product index, chosen by the user
}

const NUM = /-?\d+(?:[.,]\d+)?/;

const cleanNumber = (raw: string): number | null => {
    const match = NUM.exec(raw.replace(/[, ]/g, m => (m === ',' ? '' : '')));
    if (!match) return null;
    const n = Number(match[0].replace(',', '.'));
    return Number.isFinite(n) ? n : null;
};

/** 民國 115-01-31 or 115/1/31 → 2026-01-31; anything already ISO passes through. */
export const normaliseDate = (raw: string): string | null => {
    const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(raw.trim());
    if (iso) {
        const [, y, m, d] = iso;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const roc = /^(?:民國)?\s*(\d{2,3})[-/年](\d{1,2})[-/月](\d{1,2})/.exec(raw.trim());
    if (roc) {
        const [, y, m, d] = roc;
        return `${Number(y) + 1911}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
};

/** kWh/度 → MWh and similar, using the unit the model reported. */
export const normaliseValue = (field: AiField, raw: string, reportedUnit?: string): string | null => {
    if (field.id.startsWith('period.')) return normaliseDate(raw);
    if (!field.unit) return raw.trim() || null;

    const n = cleanNumber(raw);
    if (n === null) return null;
    const unit = (reportedUnit || '').toLowerCase().replace(/\s/g, '');
    if (field.unit === 'MWh') {
        if (unit.includes('度') || unit === 'kwh') return String(n / 1000);
        if (unit === 'gwh') return String(n * 1000);
        return String(n);
    }
    if (field.unit === 'TJ') {
        if (unit === 'gj') return String(n / 1000);
        if (unit === 'mj') return String(n / 1e6);
        return String(n);
    }
    if (field.unit === 't') {
        if (unit === 'kg') return String(n / 1000);
        if (unit === 'g') return String(n / 1e6);
        return String(n);
    }
    return String(n);
};

/** Group the raw values into one proposal per field, summing the ones that add up. */
export const toProposals = (values: RawValue[]): Proposal[] => {
    const byField = new Map<string, RawValue[]>();
    for (const v of values) {
        const field = AI_FIELDS.find(f => f.id === v.fieldId);
        if (!field) continue;                       // unknown id: drop it
        if (normaliseValue(field, v.value, v.unit) === null) continue;
        if (!byField.has(v.fieldId)) byField.set(v.fieldId, []);
        byField.get(v.fieldId)!.push(v);
    }

    const proposals: Proposal[] = [];
    for (const [fieldId, parts] of byField) {
        const field = AI_FIELDS.find(f => f.id === fieldId)!;
        const normalised = parts.map(p => normaliseValue(field, p.value, p.unit)!);
        let value: string;
        if (field.aggregate === 'sum' && parts.length > 1) {
            value = String(normalised.reduce((sum, v) => sum + (Number(v) || 0), 0));
        } else {
            value = normalised[0];
        }
        proposals.push({ key: fieldId, field, value, unit: field.unit, parts, accepted: parts[0].confidence >= 0.6 });
    }
    return proposals;
};

/** Write the accepted proposals into a copy of the form. */
export const applyProposals = (form: FormData, proposals: Proposal[]): FormData => {
    const next: FormData = JSON.parse(JSON.stringify(form));
    let streamRow: KeyValue | null = null;

    for (const p of proposals.filter(x => x.accepted)) {
        const { target } = p.field;
        if (target.kind === 'static') {
            next.a_instData.static[target.cell] = p.value;
        } else if (target.kind === 'processCell') {
            const pid = p.destination || 'P1';
            next.d_processes[pid] = { ...(next.d_processes[pid] ?? {}), [target.cell]: p.value };
        } else if (target.kind === 'sourceStream') {
            // All source-stream values from one batch belong to the same new row.
            if (!streamRow) {
                streamRow = { d: 'Combustion' };
                next.b_emInst.d17 = [...next.b_emInst.d17.filter(r => Object.keys(r).length > 0), streamRow];
            }
            streamRow[target.column] = p.value;
            if (target.column === 'h') streamRow.g = streamRow.g || 't';
            if (target.column === 'j') streamRow.k = streamRow.k || 'tCO2/TJ';
        } else if (target.kind === 'product') {
            const index = Number(p.destination ?? 0);
            while (next.summary_products.length <= index) next.summary_products.push({});
            next.summary_products[index] = { ...next.summary_products[index], [target.key]: p.value };
        }
    }
    return next;
};
