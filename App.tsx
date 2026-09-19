
import React, { useState, useCallback, useRef } from 'react';
import A_InstDataSection from './components/A_InstDataSection';
import B_EmInstSection from './components/B_EmInstSection';
import C_EmissionsEnergySection from './components/C_EmissionsEnergySection';
import D_ProcessesSection from './components/D_ProcessesSection';
import E_PurchPrecSection from './components/E_PurchPrecSection';
import Summary_ProcessSection from './components/Summary_ProcessSection';
import Summary_ProductsSection from './components/Summary_ProductsSection';
import CarbonEmissionTool from './components/CarbonEmissionTool';
import DecarbonizationEngine from './components/DecarbonizationEngine';
import type { FormData, A_InstData, B_EmInst, C_EmissionsEnergy, D_Processes, E_PurchPrec, Summary_Process, Summary_Product, FileSystemFileHandle } from './types';
import { PX_OFFSET_MAPPING } from './constants';
import { generateAndDownloadExcel } from './utils/excelHandler';
import { CBAM_EXCEL_BASE64 } from './cbamTemplate';

// Navigation IDs
type SectionView = 'dashboard' | 'A' | 'B' | 'C' | 'D' | 'E' | 'SumProc' | 'SumProd' | 'Decarbon' | 'Scenario';

const App: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SectionView>('dashboard');

    const [formData, setFormData] = useState<FormData>({
        a_instData: {
            static: {},
            e62: [{}],
            e83: [{}],
            e102: [{}],
        },
        b_emInst: {
            d17: [{}],
            d98: [{}],
            d113: [{}],
        },
        c_emissionsEnergy: {},
        d_processes: {},
        e_purchPrec: {},
        summary_process: {},
        summary_products: [],
    });
    
    const [jsonOutput, setJsonOutput] = useState('');
    const [isOutputVisible, setIsOutputVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleBackToMenu = () => {
        setActiveSection('dashboard');
    };

    const updateA_InstData = useCallback((data: A_InstData) => {
        setFormData(prev => ({ ...prev, a_instData: data }));
    }, []);
    const updateB_EmInst = useCallback((data: B_EmInst) => {
        setFormData(prev => ({ ...prev, b_emInst: data }));
    }, []);
    const updateC_EmissionsEnergy = useCallback((data: C_EmissionsEnergy) => {
        setFormData(prev => ({ ...prev, c_emissionsEnergy: data }));
    }, []);
    const updateD_Processes = useCallback((data: D_Processes) => {
        setFormData(prev => ({ ...prev, d_processes: data }));
    }, []);
    const updateE_PurchPrec = useCallback((data: E_PurchPrec) => {
        setFormData(prev => ({ ...prev, e_purchPrec: data }));
    }, []);
    const updateSummary_Process = useCallback((data: Summary_Process) => {
        setFormData(prev => ({ ...prev, summary_process: data }));
    }, []);
    const updateSummary_Products = useCallback((data: Summary_Product[]) => {
        setFormData(prev => ({ ...prev, summary_products: data }));
    }, []);

    const generateJson = () => {
        const output: Record<string, any> = {};
        // Section A
        Object.entries(formData.a_instData.static).forEach(([key, value]) => { if (value) output[key] = value; });
        formData.a_instData.e62.forEach((row, index) => { const rowNum = 62 + index; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        formData.a_instData.e83.forEach((row, index) => { const rowNum = 83 + index; output[`D${rowNum}`] = `P${index + 1}`; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        formData.a_instData.e102.forEach((row, index) => { const rowNum = 102 + index; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        // Section B
        formData.b_emInst.d17.forEach((row, index) => { const rowNum = 17 + index; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        formData.b_emInst.d98.forEach((row, index) => { const rowNum = 98 + index; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        formData.b_emInst.d113.forEach((row, index) => { const rowNum = 113 + index; Object.entries(row).forEach(([key, value]) => { if (value) output[`${key.toUpperCase()}${rowNum}`] = value; }); });
        // Section C
        Object.entries(formData.c_emissionsEnergy).forEach(([key, value]) => { if (value) output[key] = value; });
        // Section D
        Object.entries(formData.d_processes).forEach(([processId, processData]) => {
            const offset = PX_OFFSET_MAPPING[processId as keyof typeof PX_OFFSET_MAPPING] ?? 0;
            if(processData) {
                Object.entries(processData).forEach(([cell, value]) => {
                    if (value) {
                         const match = cell.match(/([A-Z]+)(\d+)/);
                        if (match) {
                            const col = match[1];
                            const baseRow = parseInt(match[2], 10);
                            const finalRow = baseRow + offset;
                            output[`${col}${finalRow}`] = value;
                        }
                    }
                });
            }
        });
        // Section E
        Object.entries(formData.e_purchPrec).forEach(([cellAddress, value]) => { if (value) output[cellAddress] = value; });
        // Summary
        Object.entries(formData.summary_process).forEach(([key, value]) => { if (value) output[`Summary_${key}`] = value; });
        formData.summary_products.forEach((prod, index) => { output[`Summary_Product_${index + 1}`] = prod; });

        setJsonOutput(JSON.stringify(output, null, 2));
        setIsOutputVisible(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonOutput).then(() => {
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                copyBtn.textContent = 'Copied! (已複製)';
                setTimeout(() => { copyBtn.textContent = 'Copy (複製)'; }, 2000);
            }
        });
    };

    // Validation Function
    const validateFormData = (): string[] => {
        const errors: string[] = [];
        const { a_instData, summary_products } = formData;

        // A_InstData - Essential Static Data
        if (!a_instData.static.I20) errors.push("Installation Data (A): Installation Name (I20) is missing. (設施名稱未填)");
        if (!a_instData.static.I26) errors.push("Installation Data (A): Country (I26) is missing. (國家未填)");
        
        // A_InstData - Processes
        if (!a_instData.e62 || a_instData.e62.length === 0 || !a_instData.e62[0].e) {
            errors.push("Installation Data (A): At least one 'Aggregated goods category' is required in Section 4(a). (需至少填寫一項聚合商品類別)");
        }

        // Summary Products - Check if defined
        if (summary_products.length > 0) {
            summary_products.forEach((prod, idx) => {
                if (!prod.name) errors.push(`Summary Products (Item ${idx + 1}): Product Name is missing. (產品 P${idx+1} 名稱未填)`);
                if (!prod.cn_code) errors.push(`Summary Products (Item ${idx + 1}): CN Code is missing. (產品 P${idx+1} CN代碼未填)`);
                if (!prod.process) errors.push(`Summary Products (Item ${idx + 1}): Process Name is missing. (產品 P${idx+1} 生產過程未填)`);
            });
        }

        return errors;
    };

    const handleSaveOrDownload = async () => {
        // 1. Validate (Currently disabled as per user request to allow downloading even if incomplete)
        /*
        const errors = validateFormData();
        if (errors.length > 0) {
            const errorMsg = "⚠️ Please fill in the following required fields (請填寫以下必填欄位):\n\n" + errors.join("\n");
            alert(errorMsg);
            return;
        }
        */

        setIsSaving(true);
        try {
            if (!CBAM_EXCEL_BASE64) {
                alert("⚠️ 請先在 cbamTemplate.ts 中填入 CBAM 試算表的 Base64 字串！");
                return;
            }

            // 將 Base64 轉換為 ArrayBuffer
            const cleanBase64 = CBAM_EXCEL_BASE64.replace(/^data:.*,/, '');
            const byteCharacters = atob(cleanBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            await generateAndDownloadExcel(formData, byteArray.buffer);
        } catch (error) {
            console.error("產生 Excel 檔案時發生錯誤:", error);
            alert("產生 Excel 檔案時發生錯誤，請確認 Base64 字串格式是否正確。");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Components for Dashboard Cards ---
    const DashboardCard = ({ title, iconPath, onClick, colorClass }: { title: string, iconPath: string, onClick: () => void, colorClass: string }) => {
        const parts = title.split(' (');
        return (
            <button 
                onClick={onClick}
                className={`${colorClass} text-white p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 h-40 w-full relative overflow-hidden group`}
            >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path>
                    </svg>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-base font-semibold tracking-wide text-center leading-tight">{parts[0]}</span>
                    {parts[1] && (
                        <span className="text-xs font-medium opacity-90 mt-1">({parts[1]}</span>
                    )}
                </div>
            </button>
        );
    };

    const renderDashboard = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-6 animate-fadeIn">
            <DashboardCard 
                title="Installation Data (設施資訊)" 
                colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
                iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                onClick={() => setActiveSection('A')}
            />
            <DashboardCard 
                title="Source Streams (排放源流)" 
                colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
                iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                onClick={() => setActiveSection('B')}
            />
            <DashboardCard 
                title="Emissions & Energy (排放與能源)" 
                colorClass="bg-gradient-to-br from-cyan-500 to-cyan-600"
                iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                onClick={() => setActiveSection('C')}
            />
            <DashboardCard 
                title="Production Processes (生產過程)" 
                colorClass="bg-gradient-to-br from-teal-500 to-teal-600"
                iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                onClick={() => setActiveSection('D')}
            />
            <DashboardCard 
                title="Purchased Precursors (採購前導物)" 
                colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
                iconPath="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                onClick={() => setActiveSection('E')}
            />
            <DashboardCard 
                title="Summary Process (過程摘要)" 
                colorClass="bg-gradient-to-br from-violet-500 to-violet-600"
                iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                onClick={() => setActiveSection('SumProc')}
            />
            <DashboardCard 
                title="Summary Products (產品報告摘要)" 
                colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
                iconPath="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                onClick={() => setActiveSection('SumProd')}
            />
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl min-h-screen flex flex-col bg-slate-50/50">
            <header className="text-center mb-10 mt-4">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 cursor-pointer tracking-tight" onClick={handleBackToMenu}>
                    CBAM Report Auto-Filler
                </h1>
                <p className="text-lg text-slate-500 mt-2 font-medium">CBAM 報告自動填寫工具</p>
            </header>

            <main className="flex-grow">
                {activeSection === 'dashboard' ? (
                    <div className="space-y-16">
                        {/* Data Entry & File Actions */}
                        <section className="text-center max-w-5xl mx-auto">
                            <div className="mb-8 flex flex-col items-center">
                                <h2 className="text-2xl font-bold text-slate-800">STEP 1: 填報CBAM申報表與檔案操作 (Data Entry & File Actions)</h2>
                                <p className="text-slate-500 mt-2">請依序填寫以下各項資訊，並在完成後下載已自動填寫完畢的 CBAM 試算表</p>
                            </div>
                            
                            <div className="space-y-8">
                                {renderDashboard()}

                                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="bg-emerald-100 p-3 rounded-full">
                                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">下載 CBAM試算表</h3>
                                                <p className="text-sm text-slate-500 mt-1">包含您填寫的所有數據，格式完全符合官方規範</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveOrDownload}
                                            disabled={isSaving}
                                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md text-white w-full sm:w-auto ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            {isSaving ? '處理中...' : 'Download Copy (下載檔案)'}
                                        </button>
                                    </section>

                                    {/* Funding Acknowledgement */}
                                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-600 text-sm leading-relaxed italic font-medium">
                                        <p>
                                            This work is funded by the National Science and Technology Council (NSTC), Taiwan, ROC, under Contract Number 114-2222-E-005-001-. 
                                            The contents do not necessarily reflect the views and policies of the NSTC.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Decarbonization Recommendation */}
                        <section className="max-w-5xl mx-auto mt-16">
                            <div className="mb-8 flex flex-col items-center text-center">
                                <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">STEP 2: 減碳情境建議 (Decarbonization Recommendation)</h2>
                                <p className="text-slate-500 mt-2">根據您的製程提供專業的減碳建議與參考文獻</p>
                            </div>
                            <DecarbonizationEngine />
                        </section>

                        {/* Step 3: Carbon Emission Tool */}
                        <section className="max-w-5xl mx-auto mt-16">
                            <div className="mb-8 flex flex-col items-center text-center">
                                <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">STEP 3: 碳排情境分析工具 (Carbon Emission Tool)</h2>
                                <p className="text-slate-500 mt-2">模擬不同減碳情境下的成本節省與減排效果</p>
                            </div>
                            <CarbonEmissionTool />
                        </section>
                    </div>
                ) : (
                    <div className="animate-slideIn">
                        <button 
                            onClick={handleBackToMenu}
                            className="mb-4 flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Menu (返回選單)
                        </button>

                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            {activeSection === 'A' && <A_InstDataSection data={formData.a_instData} setData={updateA_InstData} />}
                            {activeSection === 'B' && <B_EmInstSection data={formData.b_emInst} setData={updateB_EmInst} />}
                            {activeSection === 'C' && <C_EmissionsEnergySection data={formData.c_emissionsEnergy} setData={updateC_EmissionsEnergy} />}
                            {activeSection === 'D' && <D_ProcessesSection data={formData.d_processes} setData={updateD_Processes} e83Rows={formData.a_instData.e83} e62Rows={formData.a_instData.e62} />}
                            {activeSection === 'E' && <E_PurchPrecSection data={formData.e_purchPrec} setData={updateE_PurchPrec} e83Rows={formData.a_instData.e83} e102Rows={formData.a_instData.e102} />}
                            {activeSection === 'SumProc' && <Summary_ProcessSection data={formData.summary_process} setData={updateSummary_Process} />}
                            {activeSection === 'SumProd' && <Summary_ProductsSection data={formData.summary_products} setData={updateSummary_Products} e83Rows={formData.a_instData.e83} />}
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button onClick={generateJson} className="text-slate-400 hover:text-slate-600 text-sm underline">
                        Debug: Show JSON Data
                    </button>
                    {isOutputVisible && (
                        <div id="output-container" className="mt-6 bg-slate-800 rounded-lg p-4 text-left mx-auto max-w-4xl" aria-live="polite">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-slate-200">JSON Output</h3>
                                <button id="copy-btn" onClick={copyToClipboard} className="bg-slate-600 text-slate-200 px-3 py-1 rounded-md text-sm hover:bg-slate-500">Copy</button>
                            </div>
                            <pre><code id="json-output" className="text-sm text-green-300 whitespace-pre-wrap break-all">{jsonOutput}</code></pre>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
