import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, Zap, Flame, Info, BarChart3, Download, FileSpreadsheet, Leaf,
  Settings, Globe, Clock, Calendar, TrendingUp, AlertCircle, CheckCircle2, BookOpen
} from 'lucide-react';

// --- 輔助元件 ---
const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const ExcelHeader: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-yellow-300 font-bold text-center border-r border-gray-400 py-2 px-2 text-xs flex flex-col items-center justify-center leading-tight last:border-r-0 ${className}`}>
    {children}
  </div>
);

const ExcelCell = React.forwardRef<HTMLInputElement, any>(({ value, onChange, onKeyDown, placeholder = "0", readOnly = false, textAlign = "text-center" }, ref) => (
  <input
    ref={ref}
    type="text"
    value={value}
    readOnly={readOnly}
    placeholder={placeholder}
    onKeyDown={onKeyDown}
    onChange={(e) => onChange && onChange(e.target.value)}
    className={`w-full h-full p-2 ${textAlign} outline-none bg-transparent font-mono text-sm ${readOnly ? 'text-gray-600 bg-gray-50' : 'text-blue-700'}`}
  />
));

const CarbonEmissionTool = () => {
  // --- 常數定義 ---
  const GRID_FACTOR = 0.000474;

  const MEASURE_EFFICIENCIES: Record<string, number> = { T1: 0.05, T2: 0.01, T3: 0.01, T4: 0.01, T5: 0.01 };

  const FUEL_DATA: Record<string, { factor: number, efficiency: number }> = {
    '天然氣(NG)': { factor: 0.0561, efficiency: 0.75 },
    '液化石油氣(LPG)': { factor: 0.0631, efficiency: 0.75 },
    '燃油(輕油Light oil)': { factor: 0.0693, efficiency: 0.80 },
    '柴油(Diesel)': { factor: 0.0741, efficiency: 0.80 },
    '低硫重油 (LSFO)': { factor: 0.0774, efficiency: 0.80 }, 
    '煤炭(Coal)': { factor: 0.0946, efficiency: 0.85 },
  };

  const GREEN_POWER_DATA: Record<string, number> = {
    '太陽光電(Solar PV)': 0.0000499,
    '陸域風電(Onshore)': 0.000016,
    '離岸風電(Offshore Wind)': 0.000029,
    '地熱發電(Geothermal)': 0.0000114,
    '水力發電-河川引水式(Run-of-River)': 0.000004,
    '水力發電-大型水庫式 (Reservoir)': 0.000024,
    '水力發電-抽蓄式 (Pumped Storage)': 0.00001,
  };

  // --- 狀態管理 ---
  const [lang, setLang] = useState('zh');
  const [globalParams, setGlobalParams] = useState({ euEtsPrice: "0", originCarbonPrice: "0" });

  const [scenario1Data, setScenario1Data] = useState({
    greenPower: Array.from({ length: 7 }, (_, i) => {
      return { id: `G${i + 1}`, type: '', buyIn: "0" };
    })
  });

  const [scenario2Data, setScenario2Data] = useState({
    measures: [
      { id: 'T1', name: '省煤器 (Economizer) 用排煙預熱給水', adoption: '是' },
      { id: 'T2', name: '排放鍋爐排污水 (Blowdown) 熱回收預熱給水', adoption: '是' },
      { id: 'T3', name: '火管鍋爐加裝擾流器 (Turbulence promoters)', adoption: '是' },
      { id: 'T4', name: '含氧修正控制 (Oxygen trim controls)', adoption: '是' },
      { id: 'T5', name: '排氣預熱燃燒空氣 (Air pre-heating, recuperator)', adoption: '是' },
    ],
    fuels: Array.from({ length: 6 }, (_, i) => {
      return { id: `F${i + 1}`, type: '', consumption: "0", ratio: "0" };
    })
  });

  const [results, setResults] = useState({ s1Saved: 0, s2Saved: 0, s1Reduction: 0, s2Reduction: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const inputRefs = useRef<any[]>([]);

  // --- 處理程式 ---
  const handleStateChange = (setter: any, stateData: any, dataKey: string, index: number, field: string, value: any) => {
    const newData = [...stateData[dataKey]];
    newData[index][field] = value;
    setter({ ...stateData, [dataKey]: newData });
  };

  const handleS1KeyDown = (e: any, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (index + 1 < scenario1Data.greenPower.length) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleS2MeasureToggle = (index: number) => {
    const newData = [...scenario2Data.measures];
    newData[index].adoption = newData[index].adoption === '是' ? '否' : '是';
    setScenario2Data({ ...scenario2Data, measures: newData });
  };

  // --- 高階美化全功能 Excel 匯出 ---
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
      
      const ExcelJS = (window as any).ExcelJS;
      const saveAs = (window as any).saveAs;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Carbon Emission Tool';

      const ws = workbook.addWorksheet('碳排分析結果', { views: [{ showGridLines: false }] }); // 隱藏預設格線
      
      // 設定較寬的欄寬
      ws.columns = [
        { width: 3 },  // A: 邊界留白
        { width: 12 }, // B: 編號
        { width: 45 }, // C: 類型/名稱
        { width: 22 }, // D: 數值 1
        { width: 22 }, // E: 數值 2
        { width: 20 }, // F: 輔助/備註
        { width: 25 }  // G: 結果/總成本
      ];

      // --- 樣式定義 (Styles) ---
      const borderThin = {
        top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
      };

      const styleTitle = { font: { bold: true, size: 16, color: { argb: 'FF1F4E78' } }, alignment: { vertical: 'middle' } };
      const styleSectionTitle = { font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } }, alignment: { vertical: 'middle', horizontal: 'left', indent: 1 } };
      const styleHeader = { font: { bold: true, color: { argb: 'FF333333' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }, alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }, border: borderThin };
      const styleLabel = { font: { bold: true, color: { argb: 'FF595959' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: borderThin };
      const styleInput = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: borderThin }; 
      const styleResult = { font: { bold: true, color: { argb: 'FF006100' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, alignment: { vertical: 'middle', horizontal: 'right' }, border: borderThin }; 
      const styleNormalCenter = { alignment: { vertical: 'middle', horizontal: 'center' }, border: borderThin };
      
      const applyStyleToRow = (row: any, startCol: number, endCol: number, styleObj: any) => {
        for (let i = startCol; i <= endCol; i++) {
          const cell = row.getCell(i);
          if (styleObj.font) cell.font = styleObj.font;
          if (styleObj.fill) cell.fill = styleObj.fill;
          if (styleObj.alignment) cell.alignment = styleObj.alignment;
          if (styleObj.border) cell.border = styleObj.border;
          if (styleObj.numFmt) cell.numFmt = styleObj.numFmt;
        }
      };

      for(let i = 26; i <= 30; i++) ws.getColumn(i).hidden = true;

      const getGpFormula = (cell: string) => `IFERROR(IF(${cell}="太陽光電(Solar PV)",0.0000499,IF(${cell}="陸域風電(Onshore)",0.000016,IF(${cell}="離岸風電(Offshore Wind)",0.000029,IF(${cell}="地熱發電(Geothermal)",0.0000114,IF(${cell}="水力發電-河川引水式(Run-of-River)",0.000004,IF(${cell}="水力發電-大型水庫式 (Reservoir)",0.000024,IF(${cell}="水力發電-抽蓄式 (Pumped Storage)",0.00001,0))))))), 0)`;
      const getMeasureFormula = (idCell: string, adoptCell: string) => `IFERROR(IF(${adoptCell}="是",IF(${idCell}="T1",0.05,0.01),0), 0)`;
      const getFuelFormula = (cell: string) => `IFERROR(IF(${cell}="天然氣(NG)",0.0561,IF(${cell}="液化石油氣(LPG)",0.0631,IF(${cell}="燃油(輕油Light oil)",0.0693,IF(${cell}="柴油(Diesel)",0.0741,IF(${cell}="低硫重油 (LSFO)",0.0774,IF(${cell}="煤炭(Coal)",0.0946,0)))))), 0)`;

      // --- 報表標題 ---
      ws.addRow([]); 
      const titleRow = ws.addRow(['', '📊 碳排情境分析工具 (互動式報表)']);
      applyStyleToRow(titleRow, 2, 7, styleTitle);
      ws.addRow([]);

      // --- 一、價格設定 ---
      const sec1Title = ws.addRow(['', '一、價格設定 (歐盟 ETS 與 原產地碳價)']);
      ws.mergeCells(`B${sec1Title.number}:G${sec1Title.number}`);
      applyStyleToRow(sec1Title, 2, 7, styleSectionTitle);
      
      const priceHeadRow = ws.addRow(['', '項目', '價格 (Price)', '單位 (Unit)', '', '', '']);
      applyStyleToRow(priceHeadRow, 2, 4, styleHeader);
      
      const p1Row = ws.addRow(['', '(a) EU ETS', Number(globalParams.euEtsPrice) || 0, '€ /tCO2e']);
      applyStyleToRow(p1Row, 2, 2, styleLabel);
      applyStyleToRow(p1Row, 3, 3, { ...styleInput, numFmt: '#,##0.00' });
      applyStyleToRow(p1Row, 4, 4, styleNormalCenter);
      
      const p2Row = ws.addRow(['', '(b) 原產地已付碳價/抵扣', Number(globalParams.originCarbonPrice) || 0, '€ /tCO2e']);
      applyStyleToRow(p2Row, 2, 2, styleLabel);
      applyStyleToRow(p2Row, 3, 3, { ...styleInput, numFmt: '#,##0.00' });
      applyStyleToRow(p2Row, 4, 4, styleNormalCenter);
      ws.addRow([]);

      // --- 二、情境一 ---
      const sec2Title = ws.addRow(['', '二、情境一：以低碳電力替代可節省之成本']);
      ws.mergeCells(`B${sec2Title.number}:G${sec2Title.number}`);
      applyStyleToRow(sec2Title, 2, 7, styleSectionTitle);
      
      const s1Head = ws.addRow(['', '編號', '欲採用之低碳電力類型 (請下拉選擇)', '購入量 (請填寫數值)', '單位', '自動帶入係數', '自動計算節省成本 (€)']);
      applyStyleToRow(s1Head, 2, 7, styleHeader);
      
      const s1Start = ws.rowCount + 1;
      scenario1Data.greenPower.forEach((item) => {
        const row = ws.addRow(['', item.id, item.type || '', Number(item.buyIn) || 0, 'kWh / 度', '', '']);
        const r = row.number;
        applyStyleToRow(row, 2, 2, styleLabel);
        applyStyleToRow(row, 3, 4, styleInput); 
        applyStyleToRow(row, 5, 6, styleNormalCenter);
        applyStyleToRow(row, 7, 7, styleResult); 
        
        row.getCell(3).dataValidation = { type: 'list', allowBlank: true, formulae: ['"太陽光電(Solar PV),陸域風電(Onshore),離岸風電(Offshore Wind),地熱發電(Geothermal),水力發電-河川引水式(Run-of-River),水力發電-大型水庫式 (Reservoir),水力發電-抽蓄式 (Pumped Storage)"'] };
        
        row.getCell(26).value = { formula: getGpFormula(`C${r}`) }; 
        row.getCell(6).value = { formula: `Z${r}` }; 
        row.getCell(7).value = { formula: `IFERROR(IF(OR(ISBLANK(C${r}),C${r}="未選擇"),0,D${r}*(${GRID_FACTOR}-Z${r})*MAX(0,$C$5-$C$6)), 0)` };
        row.getCell(7).numFmt = '#,##0.00';
      });
      const s1End = ws.rowCount;
      ws.addRow([]);

      // --- 三、情境二 (技術措施) ---
      const sec3Title = ws.addRow(['', '三、情境二：改變製程/更換設備提升之效率可節省之成本']);
      ws.mergeCells(`B${sec3Title.number}:G${sec3Title.number}`);
      applyStyleToRow(sec3Title, 2, 7, styleSectionTitle);
      
      const mHead = ws.addRow(['', '編號', '可能採行之技術/措施', '是否採用 (請下拉選擇)', '自動計算節能效率', '', '']);
      applyStyleToRow(mHead, 2, 5, styleHeader);
      
      const mStart = ws.rowCount + 1;
      scenario2Data.measures.forEach((m) => {
        const row = ws.addRow(['', m.id, m.name, m.adoption, '', '', '']);
        const r = row.number;
        applyStyleToRow(row, 2, 2, styleLabel);
        applyStyleToRow(row, 3, 3, { alignment: { horizontal: 'left', vertical: 'middle' }, border: borderThin });
        applyStyleToRow(row, 4, 4, styleInput);
        applyStyleToRow(row, 5, 5, styleResult);
        
        row.getCell(4).dataValidation = { type: 'list', allowBlank: true, formulae: ['"是,否"'] };
        row.getCell(28).value = { formula: getMeasureFormula(`B${r}`, `D${r}`) }; 
        row.getCell(5).value = { formula: `AB${r}` }; 
        row.getCell(5).numFmt = '0.00%';
      });
      const mEnd = ws.rowCount;
      
      // 總節能效率
      const totalEffRow = ws.addRow(['', '', '小計：總節能效率', '', { formula: `SUM(AB${mStart}:AB${mEnd})` }, '', '']);
      applyStyleToRow(totalEffRow, 3, 3, { ...styleLabel, alignment: { horizontal: 'right' } });
      applyStyleToRow(totalEffRow, 5, 5, { ...styleResult, font: { bold: true, color: { argb: 'FFD2691E' } } });
      totalEffRow.getCell(5).numFmt = '0.00%';
      totalEffRow.getCell(28).value = { formula: `SUM(AB${mStart}:AB${mEnd})` }; 
      const effCellRef = `$AB$${totalEffRow.number}`;
      ws.addRow([]);

      // --- 三、情境二 (燃料消耗) ---
      const fHead = ws.addRow(['', '編號', '燃料類型 (請下拉選擇)', '消耗量 (公噸/千公秉)', '占比 (%)', '自動帶入係數', '自動計算節省成本 (€)']);
      applyStyleToRow(fHead, 2, 7, styleHeader);

      const fStart = ws.rowCount + 1;
      scenario2Data.fuels.forEach((f) => {
        const row = ws.addRow(['', f.id, f.type || '', Number(f.consumption) || 0, Number(f.ratio) || 0, '', '']);
        const r = row.number;
        applyStyleToRow(row, 2, 2, styleLabel);
        applyStyleToRow(row, 3, 5, styleInput);
        applyStyleToRow(row, 6, 6, styleNormalCenter);
        applyStyleToRow(row, 7, 7, styleResult);

        row.getCell(3).dataValidation = { type: 'list', allowBlank: true, formulae: ['"天然氣(NG),液化石油氣(LPG),燃油(輕油Light oil),柴油(Diesel),低硫重油 (LSFO),煤炭(Coal)"'] };
        
        row.getCell(29).value = { formula: getFuelFormula(`C${r}`) }; 
        row.getCell(6).value = { formula: `AC${r}` }; 
        
        row.getCell(7).value = { formula: `IFERROR(IF(OR(ISBLANK(C${r}),C${r}="未選擇"),0,D${r}*AC${r}*(E${r}/100)*${effCellRef}*MAX(0,$C$5-$C$6)), 0)` };
        row.getCell(7).numFmt = '#,##0.00';
      });
      const fEnd = ws.rowCount;
      ws.addRow([]);

      // --- 四、總覽面板 ---
      const sec6Title = ws.addRow(['', '四、預估節省成本總覽 (CBAM 憑證費用)']);
      ws.mergeCells(`B${sec6Title.number}:G${sec6Title.number}`);
      applyStyleToRow(sec6Title, 2, 7, { ...styleSectionTitle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } } }); 
      
      const s1SumRow = ws.addRow(['', '情境一 預估可節省成本 (€)', { formula: `IFERROR(SUM(G${s1Start}:G${s1End}), 0)` }, '', '', '', '']);
      ws.mergeCells(`C${s1SumRow.number}:G${s1SumRow.number}`);
      applyStyleToRow(s1SumRow, 2, 2, styleLabel);
      applyStyleToRow(s1SumRow, 3, 7, { font: { bold: true, size: 14, color: { argb: 'FF008080' } }, alignment: { horizontal: 'right', vertical: 'middle' }, border: borderThin, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } } });
      s1SumRow.getCell(3).numFmt = '€ #,##0.00';

      const s2SumRow = ws.addRow(['', '情境二 預估可節省成本 (€)', { formula: `IFERROR(SUM(G${fStart}:G${fEnd}), 0)` }, '', '', '', '']);
      ws.mergeCells(`C${s2SumRow.number}:G${s2SumRow.number}`);
      applyStyleToRow(s2SumRow, 2, 2, styleLabel);
      applyStyleToRow(s2SumRow, 3, 7, { font: { bold: true, size: 14, color: { argb: 'FFD2691E' } }, alignment: { horizontal: 'right', vertical: 'middle' }, border: borderThin, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE5CD' } } });
      s2SumRow.getCell(3).numFmt = '€ #,##0.00';

      // 匯出檔案
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'CBAM試算表_分析結果.xlsx');

    } catch (error) {
      console.error("Excel 匯出失敗:", error);
      alert("匯出 Excel 失敗，請確認網路連線以載入匯出模組。");
    } finally {
      setIsExporting(false);
    }
  };

  // --- 自動計算 ---
  useEffect(() => {
    const parseVal = (v: any) => parseFloat(v) || 0;
    const euPrice = parseVal(globalParams.euEtsPrice);
    const originPrice = parseVal(globalParams.originCarbonPrice);
    const priceDiff = Math.max(0, euPrice - originPrice);

    // 情境一計算 (減排量 = 購入綠電量 * (台電係數 - 綠電係數))
    const s1Reduction = scenario1Data.greenPower.reduce((sum, item) => {
      const factor = GREEN_POWER_DATA[item.type] || 0;
      if (!item.type || !item.buyIn) return sum;
      return sum + (parseVal(item.buyIn) * (GRID_FACTOR - factor));
    }, 0);
    const s1Saved = s1Reduction * priceDiff;

    // 情境二計算：採用連乘法計算總節能率
    const remainingEnergyRatio = scenario2Data.measures.reduce((acc, m) => {
      if (m.adoption === '是') {
        return acc * (1 - (MEASURE_EFFICIENCIES[m.id] || 0));
      }
      return acc;
    }, 1);
    const totalEfficiencyGain = 1 - remainingEnergyRatio;
    
    // 減排量 = 基準排放量 * 總節能率 (等同於 SUM(基準排放) - SUM(情境排放))
    const s2Reduction = scenario2Data.fuels.reduce((sum, fuel) => {
      const data = FUEL_DATA[fuel.type];
      if (!data) return sum;
      const baseEmissions = parseVal(fuel.consumption) * data.factor * (parseVal(fuel.ratio) / 100);
      return sum + (baseEmissions * totalEfficiencyGain);
    }, 0);
    const s2Saved = s2Reduction * priceDiff;

    setResults({ s1Saved, s2Saved, s1Reduction, s2Reduction });
  }, [scenario1Data, scenario2Data, globalParams]);

  const formatNum = (num: number, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

  return (
    <div className="bg-white p-4 md:p-8 font-sans text-slate-900 text-sm rounded-2xl border border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* 標題 */}
        <div className="text-left flex flex-col gap-2 mb-8 relative">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold tracking-widest">
              {lang === 'zh' ? '碳 排 放 情 境 分 析' : 'Carbon Emission Scenario Analysis'}
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-9">
            {lang === 'zh' ? '(Carbon Emission Scenario Analysis)' : '(碳排放情境分析)'}
          </p>
          
          {/* 語言切換按鈕 */}
          <div className="absolute top-0 right-0 flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Globe size={16} className="text-slate-500 ml-2 mr-1" />
            <button
              onClick={() => setLang('zh')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                lang === 'zh' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                lang === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* 價格設定 */}
        <div className="flex justify-start">
          <div className="w-full max-w-2xl border border-gray-400 ml-20">
            <div className="grid grid-cols-[1fr_200px_150px] bg-yellow-300 border-b border-gray-400">
              <ExcelHeader></ExcelHeader>
              <ExcelHeader>
                <span>價格</span>
                <span className="opacity-60 text-[10px] font-normal uppercase">Price</span>
              </ExcelHeader>
              <ExcelHeader>
                <span>單位</span>
                <span className="opacity-60 text-[10px] font-normal uppercase">Unit</span>
              </ExcelHeader>
            </div>
            <div className="grid grid-cols-[1fr_200px_150px] border-b border-gray-400">
              <div className="p-2 text-sm font-semibold pl-4 bg-white border-r border-gray-400 text-slate-600">(a) EU ETS</div>
              <div className="border-r border-gray-400 bg-white">
                <ExcelCell value={globalParams.euEtsPrice} onChange={(v: any) => setGlobalParams({...globalParams, euEtsPrice: v})} />
              </div>
              <div className="p-2 text-center text-xs text-gray-400 bg-white italic flex items-center justify-center font-mono">( € /tCO2e )</div>
            </div>
            <div className="grid grid-cols-[1fr_200px_150px]">
              <div className="p-2 text-sm font-semibold pl-4 bg-white border-r border-gray-400 text-slate-600">
                <span>(b) 原產地已付碳價/抵扣</span>
              </div>
              <div className="border-r border-gray-400 bg-white">
                <ExcelCell value={globalParams.originCarbonPrice} onChange={(v: any) => setGlobalParams({...globalParams, originCarbonPrice: v})} />
              </div>
              <div className="p-2 text-center text-xs text-gray-400 bg-white italic flex items-center justify-center font-mono">( € /tCO2e )</div>
            </div>
          </div>
        </div>

        {/* 情境一 */}
        <div className="space-y-6">
          <div className="bg-[#004d40] p-2 px-4 text-white font-bold text-xs flex items-center gap-2">
            <Zap className="w-3 h-3" /> 情境一 、以低碳電力替代可節省之成本(此部分僅計算碳排造成之cbam憑證費用，不包含購買價格)
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 text-xs font-bold pt-2 text-slate-500 shrink-0">圖2 (a)</div>
            <div className="flex-1 border border-gray-400 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[40px_1fr_300px_200px] bg-yellow-300 border-b border-gray-400">
                  <ExcelHeader>編號</ExcelHeader>
                  <ExcelHeader>
                    <span>欲採用之低碳電力類型</span>
                    <span className="opacity-60 text-[10px] font-normal">Type of green power</span>
                  </ExcelHeader>
                  <ExcelHeader>
                    <span>購入量</span>
                    <span className="opacity-60 text-[10px] font-normal">Quantity purchased</span>
                  </ExcelHeader>
                  <ExcelHeader>
                    <span>單位</span>
                    <span className="opacity-60 text-[10px] font-normal">Unit</span>
                  </ExcelHeader>
                </div>
                {scenario1Data.greenPower.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-[40px_1fr_300px_200px] border-b border-gray-400 last:border-b-0 items-center">
                    <div className="text-[10px] text-gray-400 text-center border-r border-gray-400 h-full flex items-center justify-center bg-white font-mono">{item.id}</div>
                    <div className="border-r border-gray-400 h-full">
                      <select 
                        className="w-full h-full p-2 outline-none bg-transparent text-sm cursor-pointer font-bold"
                        value={item.type} onChange={(e) => handleStateChange(setScenario1Data, scenario1Data, 'greenPower', idx, 'type', e.target.value)}
                      >
                        <option value="">請選擇電力類型...</option>
                        {Object.keys(GREEN_POWER_DATA).map(key => (<option key={key} value={key}>{key}</option>))}
                      </select>
                    </div>
                    <div className="border-r border-gray-400 h-full bg-white">
                      <ExcelCell ref={(el: any) => inputRefs.current[idx] = el} value={item.buyIn} onChange={(v: any) => handleStateChange(setScenario1Data, scenario1Data, 'greenPower', idx, 'buyIn', v)} onKeyDown={(e: any) => handleS1KeyDown(e, idx)} textAlign="text-right" />
                    </div>
                    <div className="p-2 text-center text-xs text-gray-600 bg-white flex items-center justify-center font-mono">度 (kWh)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 text-xs font-bold pt-2 text-slate-500">(b)</div>
            <div className="flex-1 border border-gray-400">
              <div className="grid grid-cols-[1fr_200px_80px] bg-yellow-300 border-b border-gray-400">
                <ExcelHeader>計算結果 (Calculated Results)</ExcelHeader>
                <ExcelHeader>數值 (Value)</ExcelHeader>
                <ExcelHeader>單位 (Unit)</ExcelHeader>
              </div>
              <div className="grid grid-cols-[1fr_200px_80px] border-b border-gray-400">
                <div className="p-3 pl-6 font-semibold text-slate-700 border-r border-gray-400 bg-white">減排量 (Emission Reduction)</div>
                <div className="p-3 text-right font-bold text-green-700 text-lg border-r border-gray-400 bg-white">{formatNum(results.s1Reduction, 6)}</div>
                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center bg-white">tCO2e</div>
              </div>
              <div className="grid grid-cols-[1fr_200px_80px]">
                <div className="p-3 pl-6 font-semibold text-slate-700 border-r border-gray-400 bg-white">節省 CBAM 成本 (Saved CBAM Cost)</div>
                <div className="p-3 text-right font-bold text-green-700 text-lg border-r border-gray-400 bg-white">{formatNum(results.s1Saved, 5)}</div>
                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center bg-white">歐元 (€)</div>
              </div>
            </div>
          </div>
        </div>

        {/* 情境二 */}
        <div className="space-y-6">
          <div className="bg-[#004d40] p-2 px-4 text-white font-bold text-xs flex items-center gap-2">
            <Flame className="w-3 h-3" /> 情境二 、改善製程效率可節省之CBAM成本(本情境假設節能改善對燃燒系統整體有效)
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 text-xs font-bold pt-2 text-slate-500">(c)</div>
            <div className="flex-1 border border-gray-400">
              <div className="grid grid-cols-[1fr_200px_80px] bg-yellow-300 border-b border-gray-400">
                <ExcelHeader>計算結果 (Calculated Results)</ExcelHeader>
                <ExcelHeader>數值 (Value)</ExcelHeader>
                <ExcelHeader>單位 (Unit)</ExcelHeader>
              </div>
              <div className="grid grid-cols-[1fr_200px_80px] border-b border-gray-400">
                <div className="p-3 pl-6 font-semibold text-slate-700 border-r border-gray-400 bg-white">減排量 (Emission Reduction)</div>
                <div className="p-3 text-right font-bold text-green-700 text-lg border-r border-gray-400 bg-white">{formatNum(results.s2Reduction, 6)}</div>
                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center bg-white">tCO2e</div>
              </div>
              <div className="grid grid-cols-[1fr_200px_80px]">
                <div className="p-3 pl-6 font-semibold text-slate-700 border-r border-gray-400 bg-white">節省 CBAM 成本 (Saved CBAM Cost)</div>
                <div className="p-3 text-right font-bold text-green-700 text-lg border-r border-gray-400 bg-white">{formatNum(results.s2Saved, 6)}</div>
                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center bg-white">歐元 (€)</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 text-xs font-bold pt-2 text-slate-500 shrink-0">圖3 (a)</div>
            <div className="flex-1 border border-gray-400 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[40px_1fr_300px] bg-yellow-300 border-b border-gray-400">
                  <ExcelHeader>編號</ExcelHeader>
                  <ExcelHeader>技術/措施名稱 (Energy saving measures)</ExcelHeader>
                  <ExcelHeader>是否採用該技術 (Adopted?)</ExcelHeader>
                </div>
                {scenario2Data.measures.map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-[40px_1fr_300px] border-b border-gray-400 last:border-b-0 items-center">
                    <div className="text-[10px] text-gray-400 text-center border-r border-gray-400 h-full flex items-center justify-center bg-white font-mono py-2">{m.id}</div>
                    <div className="p-3 pl-6 border-r border-gray-400 text-sm h-full flex items-center bg-white text-slate-600">{m.name}</div>
                    <div className="h-full">
                      <button 
                        onClick={() => handleS2MeasureToggle(idx)} 
                        className={`w-full h-full py-3 text-sm font-bold transition-colors ${m.adoption === '是' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {m.adoption}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 text-xs font-bold pt-2 text-slate-500 shrink-0">圖3 (b)</div>
            <div className="flex-1 border border-gray-400 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[40px_1fr_200px_150px_150px] bg-yellow-300 border-b border-gray-400">
                  <ExcelHeader>編號</ExcelHeader>
                  <ExcelHeader>燃料類型 (Fuel type)</ExcelHeader>
                  <ExcelHeader>燃料用量 (Fuel consumption)</ExcelHeader>
                  <ExcelHeader>單位 (Unit)</ExcelHeader>
                  <ExcelHeader>分攤比例 (Allocation ratio)</ExcelHeader>
                </div>
                {scenario2Data.fuels.map((fuel, idx) => (
                  <div key={fuel.id} className="grid grid-cols-[40px_1fr_200px_150px_150px] border-b border-gray-400 last:border-b-0 items-center">
                    <div className="text-[10px] text-gray-400 text-center border-r border-gray-400 h-full flex items-center justify-center bg-white font-mono">{fuel.id}</div>
                    <div className="border-r border-gray-400 h-full">
                      <select 
                        className="w-full h-full p-2 outline-none bg-transparent text-sm cursor-pointer font-bold"
                        value={fuel.type} onChange={(e) => handleStateChange(setScenario2Data, scenario2Data, 'fuels', idx, 'type', e.target.value)}
                      >
                        <option value="">請選擇燃料類型...</option>
                        {Object.keys(FUEL_DATA).map(key => (<option key={key} value={key}>{key}</option>))}
                      </select>
                    </div>
                    <div className="border-r border-gray-400 h-full bg-white">
                      <ExcelCell value={fuel.consumption} onChange={(v: any) => handleStateChange(setScenario2Data, scenario2Data, 'fuels', idx, 'consumption', v)} textAlign="text-right" />
                    </div>
                    <div className="border-r border-gray-400 p-2 text-center text-xs text-gray-600 bg-white flex items-center justify-center font-mono">原燃物 (GJ)</div>
                    <div className="h-full bg-white">
                      <ExcelCell value={fuel.ratio} onChange={(v: any) => {
                        let val = v;
                        const num = parseFloat(v);
                        if (!isNaN(num)) {
                          if (num < 0) val = "0";
                          if (num > 100) val = "100";
                        }
                        handleStateChange(setScenario2Data, scenario2Data, 'fuels', idx, 'ratio', val);
                      }} textAlign="text-right" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 text-blue-800 text-[10px] rounded border border-blue-100 flex gap-3 items-start ml-10">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <p>※ 燃料分攤比例：指該燃料消耗量中，有多少比例是被用於該生產過程之工序(即與CBAM申報相關之產品生產工序)。</p>
          </div>
        </div>

        {/* 總結面板 - 深色背景 */}
        <div className="bg-[#1a2332] text-white p-12 rounded-sm shadow-xl text-center space-y-8">
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">預估總減排量 (ESTIMATED TOTAL REDUCTION)</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-bold text-[#4db6ac]">{formatNum(results.s1Reduction + results.s2Reduction, 2)}</span>
              <span className="text-2xl text-gray-500 font-light">tCO2e</span>
            </div>
          </div>

          <div className="w-48 h-px bg-gray-700 mx-auto"></div>

          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">預估總節省費用 (ESTIMATED TOTAL SAVINGS)</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl text-[#4db6ac] font-light">€</span>
              <span className="text-5xl font-bold text-[#4db6ac]">{formatNum(results.s1Saved + results.s2Saved, 2)}</span>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-center">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold transition-all shadow-lg text-white ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
          >
            <Download className="w-5 h-5" />
            {isExporting ? '處理中...' : '匯出高階美化版 Excel'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CarbonEmissionTool;
