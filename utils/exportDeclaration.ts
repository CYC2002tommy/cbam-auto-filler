import type { FormData } from '../types';
import { buildWrites } from './buildWrites';
import { writeWorkbook, TEMPLATE_VERSION } from './xlsxWriter';
import templateUrl from '../template/cbam-template-v2.1.1.xlsx?url';

declare global {
    interface Window {
        cbam?: { readTemplate?: () => Promise<ArrayBuffer> };
    }
}

let cached: ArrayBuffer | null = null;

/** The packaged app reads the template from disk; in the browser it is a bundled asset. */
export const loadTemplate = async (): Promise<ArrayBuffer> => {
    if (cached) return cached;
    cached = window.cbam?.readTemplate
        ? await window.cbam.readTemplate()
        : await (await fetch(templateUrl)).arrayBuffer();
    return cached;
};

const stamp = () => new Date().toISOString().slice(0, 10);

export const exportDeclaration = async (form: FormData, installationName?: string): Promise<string> => {
    const writes = buildWrites(form);
    const blob = await writeWorkbook(await loadTemplate(), writes);
    const safeName = (installationName || 'CBAM').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 40) || 'CBAM';
    const filename = `${safeName}_CBAM_${TEMPLATE_VERSION}_${stamp()}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
};
