
export interface KeyValue {
    [key: string]: string | number | undefined;
}

export interface A_InstData {
    static: KeyValue;
    e62: KeyValue[];
    e83: KeyValue[];
    e102: KeyValue[];
}

export interface B_EmInst {
    d17: KeyValue[];
    d98: KeyValue[];
    d113: KeyValue[];
}

export type C_EmissionsEnergy = KeyValue;

export type D_Processes = Record<string, KeyValue | undefined>;

export type E_PurchPrec = Record<string, string | number | undefined>;

export interface Summary_Process {
    M13?: string; // Carbon price instrument
    M16?: string; // Any additional information
}

export interface Summary_Product {
    process?: string;
    cn_code?: string;
    name?: string;
    [key: string]: string | number | undefined;
}

export interface FormData {
    a_instData: A_InstData;
    b_emInst: B_EmInst;
    c_emissionsEnergy: C_EmissionsEnergy;
    d_processes: D_Processes;
    e_purchPrec: E_PurchPrec;
    summary_process: Summary_Process;
    summary_products: Summary_Product[];
}

// --- File System Access API Interfaces ---
export interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
}

export interface FileSystemFileHandle {
    kind: 'file';
    name: string;
    getFile(): Promise<File>;
    createWritable(options?: any): Promise<FileSystemWritableFileStream>;
}
