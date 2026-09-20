import JSZip from 'jszip';
import map from '../template/templateMap.json';

/**
 * Writes values into the official CBAM template by patching the cell XML in place.
 *
 * Only cells listed in templateMap.json may be written; that list is generated from the
 * template itself and contains just the unlocked, non-formula input cells. Everything
 * else in the file - drawings, images, sheet protection, validations, styles - is copied
 * through untouched, because the workbook is edited as a zip of XML parts rather than
 * re-serialised by a spreadsheet library.
 *
 * The one change outside the written cells is calcPr/@fullCalcOnLoad, so Excel
 * recalculates the template's own formulas when the file is opened.
 */

export type CellType = 'number' | 'text' | 'date' | 'bool' | 'list' | 'general';

/** `soft` marks a list the template builds with formulas from the user's own entries, so its cached values cannot validate anything. */
interface CellSpec { t: CellType; l?: string; soft?: boolean }

const CELLS = map.cells as Record<string, Record<string, CellSpec>>;
const LISTS = map.lists as Record<string, (string | number | boolean)[]>;

export const TEMPLATE_VERSION = map.template.version;
export const TEMPLATE_FILE = map.template.file;
export const CAPS = map.caps as Record<string, number>;
export const PROCESS_STRIDE = map.processStride;

export interface Write { sheet: string; cell: string; value: string | number | boolean }

export class ExportError extends Error {
    constructor(message: string, readonly detail?: string) {
        super(message);
        this.name = 'ExportError';
    }
}

/** Excel serial date (1900 system, with the historical 1900 leap-year offset). */
const toSerial = (iso: string): number | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return null;
    const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Math.round(utc / 86400000) + 25569;
};

const NUMERIC = /^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?$/;

const colOf = (addr: string) => addr.replace(/\d+/g, '');
const rowOf = (addr: string) => parseInt(addr.replace(/\D+/g, ''), 10);
const colIndex = (col: string) => col.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);

/** Order cells the way Excel expects them inside a row. */
const beforeCell = (a: string, b: string) => colIndex(colOf(a)) < colIndex(colOf(b));

const setCell = (doc: XMLDocument, sheetData: Element, addr: string, spec: CellSpec, raw: string | number | boolean) => {
    const ns = doc.documentElement.namespaceURI;
    const r = rowOf(addr);

    let row: Element | null = null;
    let rowAfter: Element | null = null;
    for (const candidate of Array.from(sheetData.children)) {
        const n = parseInt(candidate.getAttribute('r') || '0', 10);
        if (n === r) { row = candidate; break; }
        if (n > r) { rowAfter = candidate; break; }
    }
    if (!row) {
        row = doc.createElementNS(ns, 'row');
        row.setAttribute('r', String(r));
        sheetData.insertBefore(row, rowAfter);
    }

    let cell: Element | null = null;
    let cellAfter: Element | null = null;
    for (const candidate of Array.from(row.children)) {
        const ref = candidate.getAttribute('r') || '';
        if (ref === addr) { cell = candidate; break; }
        if (!beforeCell(ref, addr)) { cellAfter = candidate; break; }
    }
    if (!cell) {
        cell = doc.createElementNS(ns, 'c');
        cell.setAttribute('r', addr);
        row.insertBefore(cell, cellAfter);
    }

    while (cell.firstChild) cell.removeChild(cell.firstChild);
    cell.removeAttribute('t');

    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '' || value === null || value === undefined) return;   // blank clears the cell

    const writeNumber = (n: number) => {
        const v = doc.createElementNS(ns, 'v');
        v.textContent = String(n);
        cell!.appendChild(v);
    };
    const writeText = (s: string) => {
        cell!.setAttribute('t', 'inlineStr');
        const is = doc.createElementNS(ns, 'is');
        const tEl = doc.createElementNS(ns, 't');
        tEl.setAttribute('xml:space', 'preserve');
        tEl.textContent = s;
        is.appendChild(tEl);
        cell!.appendChild(is);
    };

    switch (spec.t) {
        case 'number': {
            const n = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(n)) throw new ExportError(`「${addr}」需要數字，收到「${value}」`, addr);
            writeNumber(n);
            break;
        }
        case 'date': {
            const serial = typeof value === 'number' ? value : toSerial(String(value));
            if (serial === null) throw new ExportError(`「${addr}」需要日期 (YYYY-MM-DD)，收到「${value}」`, addr);
            writeNumber(serial);
            break;
        }
        case 'bool': {
            const b = value === true || value === 1 || /^(true|1|yes|是)$/i.test(String(value));
            cell.setAttribute('t', 'b');
            writeNumber(b ? 1 : 0);
            break;
        }
        case 'list': {
            const options = spec.l && !spec.soft ? LISTS[spec.l] : undefined;
            if (options && options.length && !options.some(o => String(o) === String(value))) {
                // The template's own validation would reject it, so stop before writing.
                throw new ExportError(`「${addr}」的值不在官方範本的選項清單內：「${value}」`, addr);
            }
            if (typeof options?.[0] === 'boolean') {
                cell.setAttribute('t', 'b');
                writeNumber(String(value).toLowerCase() === 'true' ? 1 : 0);
            } else if (typeof value !== 'string' || NUMERIC.test(value)) {
                writeNumber(Number(value));
            } else {
                writeText(String(value));
            }
            break;
        }
        case 'text':
            writeText(String(value));
            break;
        default:
            if (typeof value === 'number') writeNumber(value);
            else if (NUMERIC.test(String(value))) writeNumber(Number(value));
            else writeText(String(value));
    }
};

/** Make Excel recalculate the template's formulas when the file opens. */
const forceRecalc = (xml: string): string => {
    if (/<calcPr[^>]*\/>/.test(xml)) {
        return xml.replace(/<calcPr([^>]*?)\s*\/>/, (whole, attrs) =>
            /fullCalcOnLoad/.test(attrs) ? whole : `<calcPr${attrs} fullCalcOnLoad="1"/>`);
    }
    return xml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
};

/**
 * Apply `writes` to the template and return the new workbook.
 * Throws ExportError for any cell the template does not accept.
 */
export const writeWorkbook = async (templateBytes: ArrayBuffer, writes: Write[]): Promise<Blob> => {
    for (const w of writes) {
        const sheet = CELLS[w.sheet];
        if (!sheet) throw new ExportError(`範本沒有「${w.sheet}」工作表`, w.sheet);
        if (!sheet[w.cell]) throw new ExportError(`「${w.sheet}!${w.cell}」不是官方範本的可填欄位（可能是公式或鎖定格）`, `${w.sheet}!${w.cell}`);
    }

    const zip = await JSZip.loadAsync(templateBytes);
    const workbookXml = await zip.file('xl/workbook.xml')!.async('string');
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('string');

    const sheetPath = (name: string): string => {
        // Sheet names are XML-escaped in workbook.xml: "C_Emissions&Energy" is stored
        // as "C_Emissions&amp;Energy", so escape before matching.
        const xmlName = name
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        const sheetTag = new RegExp(`<sheet[^>]*name="${xmlName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`).exec(workbookXml)?.[0];
        const rid = sheetTag && /r:id="([^"]+)"/.exec(sheetTag)?.[1];
        if (!rid) throw new ExportError(`找不到工作表「${name}」`, name);
        const target = new RegExp(`<Relationship[^>]*Id="${rid}"[^>]*>`).exec(relsXml)?.[0];
        const path = target && /Target="([^"]+)"/.exec(target)?.[1];
        if (!path) throw new ExportError(`找不到工作表「${name}」的檔案`, name);
        return 'xl/' + path.replace(/^\/?xl\//, '').replace(/^\//, '');
    };

    const bySheet = new Map<string, Write[]>();
    for (const w of writes) {
        if (!bySheet.has(w.sheet)) bySheet.set(w.sheet, []);
        bySheet.get(w.sheet)!.push(w);
    }

    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    for (const [sheetName, sheetWrites] of bySheet) {
        const path = sheetPath(sheetName);
        const xml = await zip.file(path)!.async('string');
        const doc = parser.parseFromString(xml, 'application/xml');
        const sheetData = doc.getElementsByTagName('sheetData')[0];
        if (!sheetData) throw new ExportError(`工作表「${sheetName}」格式無法解析`, sheetName);
        for (const w of sheetWrites) setCell(doc, sheetData, w.cell, CELLS[sheetName][w.cell], w.value);
        // createFolders:false keeps JSZip from adding directory entries the template does not have.
        zip.file(path, serializer.serializeToString(doc), { createFolders: false });
    }

    zip.file('xl/workbook.xml', forceRecalc(workbookXml), { createFolders: false });
    return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        compression: 'DEFLATE',
    });
};
