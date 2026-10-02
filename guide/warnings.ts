/**
 * Non-blocking plausibility checks that need more than one field's value. Each returns a
 * message pair or null; the field shows it under the control and the user can ignore it.
 * Ranges are deliberately wide: they catch a wrong unit (MJ for GJ, tCO2/GJ for tCO2/TJ),
 * not unusual but genuine values.
 */
type Msg = { zh: string; en: string } | null;

const num = (v: unknown): number | null => {
    if (v === undefined || v === null || String(v).trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Net calorific value against the activity-data unit. Unused (so not checked) when the EF is per tonne or per 1000 Nm3. */
export const ncvWarning = (ncv: unknown, adUnit: unknown, efUnit: unknown): Msg => {
    const n = num(ncv);
    if (n === null || (efUnit && efUnit !== 'tCO2/TJ')) return null;
    if (n > 150) {
        return adUnit === '1000Nm3'
            ? { zh: '數字偏大：天然氣大約是 35–40 GJ/1000Nm3，請確認不是 MJ 或 kcal。', en: 'Looks too large: natural gas is about 35–40 GJ/1000Nm3. Check it is not in MJ or kcal.' }
            : { zh: '數字偏大：每噸燃料的淨熱值通常在 10–50 GJ/t（天然氣 48），請確認不是 MJ 或 kcal。', en: 'Looks too large: fuels are usually 10–50 GJ/t (natural gas 48). Check it is not in MJ or kcal.' };
    }
    if (n > 0 && n < 1) return { zh: '數字偏小：請確認單位是 GJ 而不是 TJ。', en: 'Looks too small: check the unit is GJ, not TJ.' };
    return null;
};

/** Emission factor against its own unit. */
export const efWarning = (ef: unknown, efUnit: unknown): Msg => {
    const n = num(ef);
    if (n === null || n === 0) return null;
    if (efUnit === 'tCO2/TJ') {
        if (n < 10) return { zh: '數字偏小：以 tCO2/TJ 計的係數通常在 50–110（天然氣 56.1）。0.0561 這類數字是 tCO2/GJ，要乘以 1,000。', en: 'Looks too small: factors in tCO2/TJ are usually 50–110 (natural gas 56.1). A figure like 0.0561 is tCO2/GJ; multiply by 1,000.' };
        if (n > 400) return { zh: '數字偏大：以 tCO2/TJ 計的係數通常在 50–110，請確認單位。', en: 'Looks too large: factors in tCO2/TJ are usually 50–110. Check the unit.' };
    }
    if ((efUnit === 'tCO2/t' || efUnit === 'tCO2/1000Nm3') && n > 10) {
        return { zh: '數字偏大：每噸或每千標準立方公尺的係數通常在 0.1–4。56.1 這類數字是 tCO2/TJ，請把單位改成 tCO2/TJ。', en: 'Looks too large: per-tonne or per-1000 Nm3 factors are usually 0.1–4. A figure like 56.1 is tCO2/TJ; change the unit to tCO2/TJ.' };
    }
    return null;
};

/** Oxidation and conversion factors are percentages where blank means 100%. */
export const factorWarning = (v: unknown): Msg => {
    const n = num(v);
    if (n === null || n > 1) return null;
    return { zh: `填 ${n} 會被當成 ${n}%，排放會少算很多。完全燃燒或完全轉化請留白或填 100。`, en: `${n} is read as ${n}%, which under-counts emissions. For complete combustion or conversion leave it blank or enter 100.` };
};

export const periodWarning = (start: unknown, end: unknown): Msg =>
    typeof start === 'string' && typeof end === 'string' && start && end && end < start
        ? { zh: '結束日期早於開始日期。', en: 'The end date is before the start date.' }
        : null;

export const latitudeWarning = (v: unknown): Msg => {
    if (v === undefined || v === null || String(v).trim() === '') return null;
    const n = num(v);
    if (n === null) return { zh: '請用十進位度數，例如 22.79。', en: 'Use decimal degrees, e.g. 22.79.' };
    if (Math.abs(n) > 90) return { zh: '緯度要在 -90 到 90 之間；你可能把經度填在這裡了。', en: 'Latitude must be between -90 and 90; this may be the longitude.' };
    return null;
};

export const longitudeWarning = (v: unknown): Msg => {
    if (v === undefined || v === null || String(v).trim() === '') return null;
    const n = num(v);
    if (n === null) return { zh: '請用十進位度數，例如 120.29。', en: 'Use decimal degrees, e.g. 120.29.' };
    if (Math.abs(n) > 180) return { zh: '經度要在 -180 到 180 之間。', en: 'Longitude must be between -180 and 180.' };
    if (n > 20 && n < 27) return { zh: '這看起來像台灣的緯度；請確認緯度和經度沒有填反。', en: 'This looks like a latitude in Taiwan; check latitude and longitude are not swapped.' };
    return null;
};

export const soldWarning = (sold: unknown, total: number): Msg => {
    const n = num(sold);
    return n !== null && total > 0 && n > total
        ? { zh: '賣出的量比總產量還多，請確認。', en: 'More was sold than produced; please check.' }
        : null;
};
