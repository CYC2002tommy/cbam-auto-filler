import type { FormData } from '../types';
import { TEMPLATE_VERSION } from '../utils/xlsxWriter';

/**
 * A project file (.cbam) is the form data plus the template it was filled against.
 * Opening a file written for a different template version is refused rather than
 * silently written into the wrong cells.
 */
export const SCHEMA_VERSION = 1;
const DRAFT_KEY = 'cbam.draft';

export interface ProjectFile {
    schemaVersion: number;
    templateVersion: string;
    savedAt: string;
    data: FormData;
}

export const serialiseProject = (data: FormData): string =>
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, templateVersion: TEMPLATE_VERSION, savedAt: new Date().toISOString(), data } satisfies ProjectFile, null, 2);

export class ProjectError extends Error {}

export const parseProject = (text: string): FormData => {
    let parsed: ProjectFile;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new ProjectError('這個檔案不是 CBAM 專案檔。');
    }
    if (!parsed || typeof parsed !== 'object' || !parsed.data) throw new ProjectError('這個檔案不是 CBAM 專案檔。');
    if (parsed.schemaVersion !== SCHEMA_VERSION) throw new ProjectError(`專案檔格式版本 ${parsed.schemaVersion} 不支援，本程式為版本 ${SCHEMA_VERSION}。`);
    if (parsed.templateVersion !== TEMPLATE_VERSION) {
        throw new ProjectError(`這個專案是依官方範本 ${parsed.templateVersion} 填寫的，本程式使用 ${TEMPLATE_VERSION}，欄位位置可能不同，因此不開啟。`);
    }
    return parsed.data;
};

export const saveDraft = (data: FormData) => {
    try {
        localStorage.setItem(DRAFT_KEY, serialiseProject(data));
    } catch {
        /* private mode or quota: the draft is simply not kept */
    }
};

export const loadDraft = (): FormData | null => {
    try {
        const text = localStorage.getItem(DRAFT_KEY);
        return text ? parseProject(text) : null;
    } catch {
        return null;
    }
};

export const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
};

/** Save the project: a native dialog on the desktop, a download in the browser. Returns the name saved, or null if cancelled. */
export const saveProjectFile = async (data: FormData, installationName?: string): Promise<string | null> => {
    const safe = (installationName || 'CBAM').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 40) || 'CBAM';
    if (window.cbam?.saveProject) return window.cbam.saveProject(serialiseProject(data), `${safe}.cbam`);
    downloadProject(data, installationName);
    return `${safe}.cbam`;
};

/** Open a project: a native dialog on the desktop, otherwise the caller supplies a File. */
export const openProjectFile = async (): Promise<{ name: string; data: FormData } | null> => {
    if (!window.cbam?.openProject) return null;
    const picked = await window.cbam.openProject();
    return picked ? { name: picked.name, data: parseProject(picked.text) } : null;
};

export const downloadProject = (data: FormData, installationName?: string) => {
    const safe = (installationName || 'CBAM').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 40) || 'CBAM';
    const blob = new Blob([serialiseProject(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${safe}.cbam` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
