/**
 * Save a generated file.
 *
 * In the desktop app this goes through the native Save dialog, so the file lands where
 * the user points it. In the browser there is no dialog, so it falls back to a download.
 * Every generated file must go through here: an anchor download inside Electron is
 * handled by the download manager, which ignores the folder the user picked.
 */
export class SaveCancelled extends Error {
    constructor() { super('cancelled'); this.name = 'SaveCancelled'; }
}

export const saveBlob = async (blob: Blob, filename: string, filterName = 'File', extension = filename.split('.').pop() || 'dat'): Promise<string> => {
    if (window.cbam?.saveBinary) {
        const saved = await window.cbam.saveBinary(await blob.arrayBuffer(), filename, filterName, extension);
        if (!saved) throw new SaveCancelled();
        return saved;
    }

    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
};

/** Just the file name, for a message like "已儲存 …". */
export const baseName = (fullPath: string) => fullPath.split(/[\\/]/).pop() || fullPath;
