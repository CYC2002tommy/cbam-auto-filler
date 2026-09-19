import type { FormData, KeyValue } from '../types';
import { PX_OFFSET_MAPPING, SUMMARY_PRODUCTS_COLUMN_MAP } from '../constants';
import { CAPS, ExportError, type Write } from './xlsxWriter';

/**
 * Turn the form state into the list of cells to write.
 *
 * Row blocks stop at the capacity the official template actually has, so nothing can
 * spill into the next section. The ID columns (G1…, P1…, PP1…) are part of the template
 * and are never written.
 */

const hasValue = (v: unknown): v is string | number =>
    v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');

const overflow = (what: string, count: number, cap: number) =>
    new ExportError(
        `${what}有 ${count} 列，官方範本最多 ${cap} 列。請先刪掉多餘的列再匯出。`,
        `${what}: ${count} > ${cap}`,
    );

const rows = (list: KeyValue[] | undefined, firstRow: number, sheet: string, cap: number, what: string): Write[] => {
    const out: Write[] = [];
    const items = list ?? [];
    if (items.length > cap) throw overflow(what, items.length, cap);
    items.forEach((row, index) => {
        Object.entries(row ?? {}).forEach(([key, value]) => {
            if (hasValue(value)) out.push({ sheet, cell: `${key.toUpperCase()}${firstRow + index}`, value });
        });
    });
    return out;
};

export const buildWrites = (form: FormData): Write[] => {
    const writes: Write[] = [];

    // A_InstData
    Object.entries(form.a_instData?.static ?? {}).forEach(([cell, value]) => {
        if (hasValue(value)) writes.push({ sheet: 'A_InstData', cell, value });
    });
    writes.push(...rows(form.a_instData?.e62, 62, 'A_InstData', CAPS['a.e62'], '彙總商品類別'));
    writes.push(...rows(form.a_instData?.e83, 83, 'A_InstData', CAPS['a.e83'], '生產過程'));
    writes.push(...rows(form.a_instData?.e102, 102, 'A_InstData', CAPS['a.e102'], '採購前驅物'));

    // B_EmInst
    writes.push(...rows(form.b_emInst?.d17, 17, 'B_EmInst', CAPS['b.d17'], '排放源流'));
    writes.push(...rows(form.b_emInst?.d98, 98, 'B_EmInst', CAPS['b.d98'], 'PFC 排放源'));
    writes.push(...rows(form.b_emInst?.d113, 113, 'B_EmInst', CAPS['b.d113'], '量測排放源'));

    // C_Emissions&Energy
    Object.entries(form.c_emissionsEnergy ?? {}).forEach(([cell, value]) => {
        if (hasValue(value)) writes.push({ sheet: 'C_Emissions&Energy', cell, value });
    });

    // D_Processes: one block per process, at the stride the template uses.
    Object.entries(form.d_processes ?? {}).forEach(([processId, processData]) => {
        const offset = PX_OFFSET_MAPPING[processId as keyof typeof PX_OFFSET_MAPPING];
        if (offset === undefined) {
            throw new ExportError(
                `官方範本只有 ${CAPS['d.processes']} 個生產過程區塊，找不到「${processId}」的位置。請把生產過程減到 ${CAPS['d.processes']} 個以內。`,
                processId,
            );
        }
        Object.entries(processData ?? {}).forEach(([cell, value]) => {
            if (!hasValue(value)) return;
            const match = /^([A-Z]+)(\d+)$/.exec(cell);
            if (!match) throw new ExportError(`無法辨識的欄位「${cell}」`, cell);
            writes.push({ sheet: 'D_Processes', cell: `${match[1]}${parseInt(match[2], 10) + offset}`, value });
        });
    });

    // E_PurchPrec: already absolute cell addresses.
    Object.entries(form.e_purchPrec ?? {}).forEach(([cell, value]) => {
        if (hasValue(value)) writes.push({ sheet: 'E_PurchPrec', cell, value });
    });

    // Summary_Processes
    Object.entries(form.summary_process ?? {}).forEach(([cell, value]) => {
        if (hasValue(value)) writes.push({ sheet: 'Summary_Processes', cell: cell.toUpperCase(), value });
    });

    // Summary_Products: one row per product, from row 10.
    const products = form.summary_products ?? [];
    if (products.length > CAPS['summary.products']) throw overflow('產品', products.length, CAPS['summary.products']);
    products.forEach((product, index) => {
        Object.entries(product ?? {}).forEach(([key, value]) => {
            const column = SUMMARY_PRODUCTS_COLUMN_MAP[key as keyof typeof SUMMARY_PRODUCTS_COLUMN_MAP];
            if (column && hasValue(value)) writes.push({ sheet: 'Summary_Products', cell: `${column}${10 + index}`, value });
        });
    });

    return writes;
};
