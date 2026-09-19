import XlsxPopulate from 'xlsx-populate';
import { FormData, FileSystemFileHandle } from '../types';
import { PX_OFFSET_MAPPING, SUMMARY_PRODUCTS_COLUMN_MAP } from '../constants';

/**
 * Helper function to apply FormData to the XlsxPopulate Workbook.
 */
const applyDataToWorkbook = (workbook: any, formData: FormData) => {
    const writeCell = (sheetName: string, cellAddress: string, value: any) => {
        const sheet = workbook.sheet(sheetName);
        if (sheet) {
            const cell = sheet.cell(cellAddress);
            if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    cell.value(value); 
                } else {
                    cell.value(parseFloat(value));
                }
            } else if (value === 'TRUE') {
                cell.value(true);
            } else if (value === 'FALSE') {
                cell.value(false);
            } else {
                cell.value(value);
            }
        } else {
            console.warn(`Sheet ${sheetName} not found`);
        }
    };

    // --- Section A: A_InstData ---
    const SHEET_A = "A_InstData";
    Object.entries(formData?.a_instData?.static || {}).forEach(([key, value]) => {
        if (value) writeCell(SHEET_A, key, value);
    });
    (formData?.a_instData?.e62 || []).forEach((row, index) => {
        const rowNum = 62 + index;
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_A, `${key.toUpperCase()}${rowNum}`, value);
        });
    });
    (formData?.a_instData?.e83 || []).forEach((row, index) => {
        const rowNum = 83 + index;
        writeCell(SHEET_A, `D${rowNum}`, `P${index + 1}`);
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_A, `${key.toUpperCase()}${rowNum}`, value);
        });
    });
    (formData?.a_instData?.e102 || []).forEach((row, index) => {
        const rowNum = 102 + index;
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_A, `${key.toUpperCase()}${rowNum}`, value);
        });
    });

    // --- Section B: B_EmInst ---
    const SHEET_B = "B_EmInst";
    (formData?.b_emInst?.d17 || []).forEach((row, index) => {
        const rowNum = 17 + index;
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_B, `${key.toUpperCase()}${rowNum}`, value);
        });
    });
    (formData?.b_emInst?.d98 || []).forEach((row, index) => {
        const rowNum = 98 + index;
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_B, `${key.toUpperCase()}${rowNum}`, value);
        });
    });
    (formData?.b_emInst?.d113 || []).forEach((row, index) => {
        const rowNum = 113 + index;
        Object.entries(row || {}).forEach(([key, value]) => {
            if (value) writeCell(SHEET_B, `${key.toUpperCase()}${rowNum}`, value);
        });
    });

    // --- Section C: C_EmissionsEnergy ---
    const SHEET_C = "C_Emissions&Energy";
    Object.entries(formData?.c_emissionsEnergy || {}).forEach(([key, value]) => {
        if (value) writeCell(SHEET_C, key, value);
    });

    // --- Section D: D_Processes ---
    const SHEET_D = "D_Processes";
    Object.entries(formData?.d_processes || {}).forEach(([processId, processData]) => {
        const offset = PX_OFFSET_MAPPING[processId as keyof typeof PX_OFFSET_MAPPING] ?? 0;
        if (processData) {
            Object.entries(processData).forEach(([cell, value]) => {
                if (value) {
                    const match = cell.match(/([A-Z]+)(\d+)/);
                    if (match) {
                        const col = match[1];
                        const baseRow = parseInt(match[2], 10);
                        const finalRow = baseRow + offset;
                        writeCell(SHEET_D, `${col}${finalRow}`, value);
                    }
                }
            });
        }
    });

    // --- Section E: E_PurchPrec ---
    const SHEET_E = "E_PurchPrec";
    Object.entries(formData?.e_purchPrec || {}).forEach(([cellAddress, value]) => {
        if (value) writeCell(SHEET_E, cellAddress, value);
    });

    // --- Summary_Processes ---
    const SHEET_SUMMARY_PROC = "Summary_Processes";
    Object.entries(formData?.summary_process || {}).forEach(([key, value]) => {
        if (value) writeCell(SHEET_SUMMARY_PROC, key.toUpperCase(), value);
    });

    // --- Summary_Products ---
    const SHEET_PRODUCTS = "Summary_Products";
    (formData?.summary_products || []).forEach((product, index) => {
        if (!product) return;

        Object.entries(product || {}).forEach(([key, value]) => {
            const colLetter = SUMMARY_PRODUCTS_COLUMN_MAP[key as keyof typeof SUMMARY_PRODUCTS_COLUMN_MAP];
            if (colLetter && value) {
                const baseRow = 10; // Base row for Summary_Products
                const currentRow = baseRow + index; // P1 on row 10, P2 on row 11, etc.
                writeCell(SHEET_PRODUCTS, `${colLetter}${currentRow}`, value);
            }
        });
    });
};

/**
 * Reads the uploaded file handle, applies the data, and saves it directly back to the file.
 */
export const saveToLocalFile = async (formData: FormData, fileHandle: FileSystemFileHandle) => {
    try {
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        
        const workbook = await XlsxPopulate.fromDataAsync(buffer);
        applyDataToWorkbook(workbook, formData);

        const outputBuffer = await workbook.outputAsync();
        
        const writable = await fileHandle.createWritable();
        await writable.write(outputBuffer);
        await writable.close();

    } catch (error: any) {
        console.error("Error saving excel:", error);
        throw error;
    }
};

/**
 * Legacy Fallback: Reads the uploaded file, applies the data, and downloads it.
 */
export const generateAndDownloadExcel = async (formData: FormData, templateBuffer: ArrayBuffer) => {
    try {
        const workbook = await XlsxPopulate.fromDataAsync(templateBuffer);
        applyDataToWorkbook(workbook, formData);

        const outputBuffer = await workbook.outputAsync();

        // Convert the output buffer to a base64 string
        const bytes = new Uint8Array(outputBuffer as ArrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        
        // Create a data URI from the new base64 string
        const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `Filled_CBAM試算表.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error: any) {
        console.error("Error generating excel:", error);
        throw error;
    }
};
