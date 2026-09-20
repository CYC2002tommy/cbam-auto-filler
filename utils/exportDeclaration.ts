import type { FormData } from '../types';
import { buildWrites } from './buildWrites';
import { writeWorkbook, TEMPLATE_VERSION } from './xlsxWriter';
import templateUrl from '../template/cbam-template-v2.1.1.xlsx?url';
import { saveBlob } from './saveFile';

declare global {
    interface Window {
        cbam?: {
            isDesktop?: boolean;
            platform?: string;
            readTemplate?: () => Promise<ArrayBuffer>;
            openProject?: () => Promise<{ name: string; text: string } | null>;
            saveProject?: (text: string, suggestedName: string) => Promise<string | null>;
            saveBinary?: (data: ArrayBuffer, suggestedName: string, filterName: string, extension: string) => Promise<string | null>;
            reveal?: (filePath: string) => Promise<void>;
            ai?: {
                status: () => Promise<{ available: boolean }>;
                setKey: (key: string) => Promise<boolean>;
                extract: (payload: { dataBase64: string; mimeType: string; fields: { id: string; label: string; unit?: string; hint?: string }[] })
                    => Promise<{ documentType?: string; period?: string; values: { fieldId: string; value: string; unit?: string; evidence: string; confidence: number }[] }>;
                ask: (payload: { question: string; history: { role: string; text: string }[]; context: string })
                    => Promise<{ text: string; model?: string }>;
            };
            /** Native menu items; returns an unsubscribe function. */
            onMenu?: (handler: (action: string) => void) => () => void;
        };
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

    // Full path on the desktop, plain file name in the browser.
    return saveBlob(blob, filename, 'Excel', 'xlsx');
};
