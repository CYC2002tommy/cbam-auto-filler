# CBAM 申報助手 / CBAM Auto-Filler

給台灣中小企業（尤其扣件、鋼鐵製品廠）填寫歐盟 CBAM「排放資料通報範本」的桌面工具。資料留在自己的電腦，填完直接產出官方格式的 Excel 交給歐盟進口商。

A desktop tool for Taiwanese SMEs filling the EU CBAM communication template. Everything stays on the user's own machine; the output is the official workbook, ready for their EU importer.

本工具由國科會計畫支持（合約編號 114-2222-E-005-001-）。內容不代表國科會立場。
Funded by the National Science and Technology Council (NSTC), Taiwan, ROC, under Contract Number 114-2222-E-005-001-. The contents do not necessarily reflect the views and policies of the NSTC.

## 特色

- **不動官方範本。** 只把你填的數值寫進範本的輸入格，其餘部分（公式、圖片、工作表保護、資料驗證）原封不動，並驗證過（`tools/verify_export.py`）。
- **寫不到的地方不寫。** 可填欄位由範本本身產生（`tools/gen_template_map.py`），鎖定格與公式格寫不進去；每個區塊的列數上限也來自範本。
- **中英雙語。** 中文介面、每個欄位附歐盟原文名稱，需要時可顯示儲存格代號。
- **情境試算。** 綠電、鍋爐節能、以及「用預設值要多付多少」三種試算；鋼鐵、鋁、氫會標明電力不計入。
- **減碳建議。** 12 種製程的短中長期建議與文獻。

## 使用者

下載安裝檔：[Releases](https://github.com/CYC2002tommy/cbam-auto-filler/releases)。安裝步驟與首次開啟的系統警告處理：[docs/INSTALL.md](docs/INSTALL.md)。

## 開發

```bash
npm install
npm run dev          # 瀏覽器開發 http://localhost:3000
npm run desktop      # Electron 視窗（接開發伺服器）
npm run dist:win     # 產生 Windows 安裝檔到 release/
npm run dist:win:local # 同上，但用本機已下載的 Electron（Defender 會鎖住 win-unpacked.tmp 時用）
npm run lint         # 型別檢查
npm run template:map # 範本換新版時重新產生欄位對照表
```

### 範本

`template/cbam-template-v2.1.1.xlsx` 是歐盟官方檔案，未經修改，來源與雜湊見 [template/SOURCES.md](template/SOURCES.md)。
`template/templateMap.json` 由 `tools/gen_template_map.py` 產生，列出所有可填欄位、型別、選項清單與列數上限。**換範本時要重新產生，並重跑驗證。**

### 驗證

```bash
python tools/verify_export.py <匯出的檔案.xlsx>   # 比對匯出檔與官方範本
```
行為測試在 `tools/browser_checks.js`：開著 `npm run dev`，在瀏覽器主控台 `import('/tools/browser_checks.js').then(m => m.default()).then(console.table)`。

## 授權

尚未決定。開源前需確認國科會計畫成果的智慧財產歸屬。
License not yet chosen; the IP terms of the NSTC project need to be confirmed before publishing.
