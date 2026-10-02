/**
 * Page-level guidance: what each page is for, what to have at hand before starting,
 * and the steps of its first-visit tour. A tour only points at things; it never fills
 * anything in. Steps whose target is not on screen (a field that appears only after an
 * earlier choice, an empty page) are skipped.
 */
export type GuidePage = 'A' | 'B' | 'C' | 'D' | 'E' | 'SumProc' | 'SumProd' | 'Export';

interface Bi { zh: string; en: string }

export interface TourStep {
    /** CSS selector of the element to point at; the first visible match is used. */
    target: string;
    title: Bi;
    body: Bi;
}

export interface PageGuideContent {
    intro: Bi;
    prepare: { zh: string[]; en: string[] };
    tour: TourStep[];
}

const field = (key: string) => `[data-guide="${key}"]`;
const mark = (name: string) => `[data-tour="${name}"]`;

export const PAGES: Record<GuidePage, PageGuideContent> = {
    A: {
        intro: {
            zh: '這一頁告訴進口商：是哪一座工廠、在哪段期間、做哪些產品、買了哪些鋼材。後面每一頁都會用到這裡的答案，所以請先填這一頁。',
            en: 'This page tells your importer which plant this is, which period the data covers, what it makes and which steel it buys. Every later page builds on these answers, so start here.',
        },
        prepare: {
            zh: ['工廠的英文名稱與英文地址（可參考商業發票）', '報告期間（通常是去年整年）', '工廠在 Google 地圖上的位置', '你做的產品，以及買進的鋼材種類與產地（材質證明書）'],
            en: ['The plant\'s English name and address (as on your invoices)', 'The reporting period (usually last calendar year)', 'The plant\'s location in Google Maps', 'Your products, and the steel you buy with its country of origin (mill test certificates)'],
        },
        tour: [
            { target: '[data-guide-help]', title: { zh: '每一格都有說明', en: 'Every field has help' }, body: { zh: '按格子右邊的 ?，可以看到這一格是什麼、數字去哪裡找、扣件廠範例和常見錯誤，也可以直接問 AI。', en: 'Press the ? next to a field for what it is, where to find the number, a fastener example and common mistakes. You can also ask the AI there.' } },
            { target: field('A.I9'), title: { zh: '先定報告期間', en: 'Set the period first' }, body: { zh: '後面所有數字（燃料、產量、用電）都要是這段期間的，通常填去年 1 月 1 日到 12 月 31 日。', en: 'Every number later on (fuel, production, electricity) must cover this period, usually 1 January to 31 December of last year.' } },
            { target: field('A.I20'), title: { zh: '工廠的英文名稱', en: 'The plant\'s English name' }, body: { zh: '填實際生產的廠區，不是總公司。這個名稱會出現在給進口商的摘要上。', en: 'The production site, not the head office. This name appears on the summary your importer receives.' } },
            { target: field('A.I27'), title: { zh: '聯合國地點代碼', en: 'UN location code' }, body: { zh: '例如高雄是 TW KHH。下面的連結可以查台灣各城市的代碼。', en: 'For example Kaohsiung is TW KHH. The link below lists Taiwan\'s codes.' } },
            { target: field('A.I28'), title: { zh: '座標', en: 'Coordinates' }, body: { zh: '在 Google 地圖的工廠位置按右鍵，就能複製緯度和經度。', en: 'Right-click the plant in Google Maps to copy its latitude and longitude.' } },
            { target: field('A.e62.e'), title: { zh: '你做的商品類別', en: 'Your goods category' }, body: { zh: '螺絲、螺栓、螺帽都選「鋼鐵製品」。', en: 'Screws, bolts and nuts are "Iron or steel products".' } },
            { target: field('A.e83.l'), title: { zh: '生產過程', en: 'Production process' }, body: { zh: '幫產線取個名字；只有一條產線就填一個過程。之後「生產過程」頁會用這個名字。', en: 'Name your production line; one line means one process. The Production processes page uses this name.' } },
            { target: field('A.e102.e'), title: { zh: '買進來的鋼材', en: 'The steel you buy' }, body: { zh: '盤元、線材也是 CBAM 商品，要列在這裡，下一頁「採購前驅物」才會出現它的欄位。', en: 'Wire rod is itself a CBAM good. List it here so its fields appear on the Purchased precursors page.' } },
        ],
    },
    B: {
        intro: {
            zh: '列出廠裡每一種「燒了會排放 CO2」的燃料或材料，一種一列。扣件廠通常只有熱處理爐、鍛造爐燒的天然氣，有時加上柴油或液化石油氣。用電不在這一頁。',
            en: 'List every fuel or material on site that releases CO2 when used, one row each. A fastener plant usually has only the natural gas burned in heat-treatment and forging furnaces, sometimes diesel or LPG. Electricity is not entered here.',
        },
        prepare: {
            zh: ['整年度的天然氣帳單或燃料進貨發票', '其他燃料（柴油、液化石油氣）的用量', '供應商的燃料分析報告（沒有的話用 App 內建的 IPCC 預設值）'],
            en: ['The year\'s natural gas bills or fuel invoices', 'Amounts of any other fuels (diesel, LPG)', 'Your supplier\'s fuel analysis (or the IPCC defaults built into the app)'],
        },
        tour: [
            { target: field('B.d17.d'), title: { zh: '計算方法', en: 'Method' }, body: { zh: '燒燃料就選「燃燒」，扣件廠幾乎都是這個。', en: 'Burning fuel is "Combustion", which covers almost every fastener plant.' } },
            { target: field('B.d17.e'), title: { zh: '燃料名稱', en: 'Fuel name' }, body: { zh: '寫燃料和用在哪裡，例如「Natural gas（熱處理爐）」。', en: 'Name the fuel and where it is used, e.g. "Natural gas (heat-treatment furnace)".' } },
            { target: mark('fuel-defaults'), title: { zh: '不知道熱值和係數？', en: 'No calorific value or factor?' }, body: { zh: '按這裡選燃料，會自動帶入 IPCC 預設的淨熱值和排放係數。', en: 'Pick the fuel here and the IPCC default calorific value and emission factor are filled in.' } },
            { target: field('B.d17.f'), title: { zh: '用了多少', en: 'How much you used' }, body: { zh: '整年帳單加總，單位在右邊選。也可以把帳單拖進視窗讓 AI 讀。', en: 'The year\'s bills added up; choose the unit next to it. You can also drop the bills into the window for the AI to read.' } },
            { target: field('B.d17.h'), title: { zh: '淨熱值', en: 'Net calorific value' }, body: { zh: '單位要跟用量一致。數字看起來不對時，格子下方會出現黃色提醒。', en: 'Its basis must match the amount\'s unit. A yellow note appears under the field if the number looks off.' } },
            { target: field('B.d17.j'), title: { zh: '排放係數', en: 'Emission factor' }, body: { zh: '天然氣是 56.1 tCO2/TJ；注意數字要和右邊單位對得上。', en: 'Natural gas is 56.1 tCO2/TJ; make sure the number matches the unit next to it.' } },
            { target: mark('b-pfc'), title: { zh: '這兩區扣件廠可以略過', en: 'Fastener plants can skip these' }, body: { zh: 'PFC 只有煉鋁廠要填；量測法只有裝了煙道連續監測的工廠要填。', en: 'PFC is for aluminium smelters only; the measurement method only for plants with continuous stack monitoring.' } },
        ],
    },
    C: {
        intro: {
            zh: '這一頁是全廠的總結：外購電力造成的排放總量，以及你的數據是怎麼來、怎麼檢查的。直接排放由官方範本依「排放源流」自動計算，不用在這裡填。',
            en: 'This page is the plant-wide summary: total emissions from purchased electricity, and how your data was obtained and checked. The official template calculates direct emissions from your source streams, so you do not enter them here.',
        },
        prepare: {
            zh: ['全廠全年的電費單（用電度數）', '電力排放係數（能源署公告值，或歐盟的台灣預設值 0.561；先問進口商用哪個）', '你們內部怎麼核對數據（例如兩人覆核）'],
            en: ['The plant\'s electricity bills for the year (kWh)', 'An electricity emission factor (Taiwan\'s Energy Administration figure or the EU default for Taiwan, 0.561; ask your importer which)', 'How you check the data internally (e.g. a second person reviews it)'],
        },
        tour: [
            { target: field('C.M26'), title: { zh: '外購電力的排放', en: 'Electricity emissions' }, body: { zh: '全年用電（MWh）乘上電力排放係數。範本規定這格要手動輸入。', en: 'Yearly electricity (MWh) times the emission factor. The template requires you to type it in.' } },
            { target: field('C.H40'), title: { zh: '數據怎麼來的', en: 'Where the data came from' }, body: { zh: '用帳單燃料量配 IPCC 係數，選「量測加國際標準係數」。', en: 'Billed fuel amounts with IPCC factors: choose "measurements & international standard factors".' } },
            { target: field('C.H42'), title: { zh: '數據怎麼檢查的', en: 'How the data was checked' }, body: { zh: '有另一個人再核對一次，選「雙人覆核」。', en: 'If a second person checks it, choose "Four eyes principle".' } },
        ],
    },
    D: {
        intro: {
            zh: '每個生產過程一頁（用上方分頁切換）。填這個過程的產量、賣出多少、它自己的直接排放。鋼鐵類產品的用電在正式期不計入，進口商有要求才填。',
            en: 'Each production process has its own page (switch with the tabs above). Enter its output, how much was sold, and its own direct emissions. For iron and steel goods electricity is not counted in the definitive period; fill it only if your importer asks.',
        },
        prepare: {
            zh: ['整年的生產紀錄或出貨量（公噸，不是支數）', '「排放源流」頁的燃料數據（只有一個過程時，直接排放就是全部）', '各產線的用電分表（進口商有要求才需要）'],
            en: ['The year\'s production records or shipments (tonnes, not pieces)', 'The fuel data from the Source streams page (with one process, all direct emissions belong to it)', 'Electricity sub-meter readings per line (only if your importer asks)'],
        },
        tour: [
            { target: mark('process-tabs'), title: { zh: '每個過程一個分頁', en: 'One tab per process' }, body: { zh: '分頁來自「設施資訊」4(b) 列出的生產過程。', en: 'The tabs come from the processes listed under Installation 4(b).' } },
            { target: field('D.route'), title: { zh: '總產量', en: 'Total production' }, body: { zh: '這個過程整年生產了多少公噸。', en: 'Tonnes this process made over the year.' } },
            { target: field('D.L27'), title: { zh: '賣出的量', en: 'Amount sold' }, body: { zh: '全部賣掉就填跟總產量一樣，下面「廠內用量」的區塊會自動變成不用填。', en: 'If everything was sold, enter the same as total production; the in-house use sections below then switch off.' } },
            { target: field('D.K50'), title: { zh: '可量測熱與廢氣', en: 'Measurable heat and waste gases' }, body: { zh: '沒有向外買蒸汽、沒有用鋼廠廢氣的扣件廠，兩個都選「否」。', en: 'A fastener plant that buys no steam and uses no steelworks gases answers "No" to both.' } },
            { target: field('D.L54'), title: { zh: '直接排放', en: 'Direct emissions' }, body: { zh: '燃料量 × 淨熱值 × 排放係數 ÷ 1,000（GJ 換成 TJ）；只有一個過程時就是全部燃料的排放。', en: 'Fuel × calorific value × emission factor ÷ 1,000 (GJ to TJ); with one process it is the emissions of all the fuel.' } },
            { target: field('D.L65'), title: { zh: '用電', en: 'Electricity' }, body: { zh: '鋼鐵類可以不填；要填的話，度數除以 1,000 就是 MWh。', en: 'Optional for iron and steel; if you fill it, kWh divided by 1,000 gives MWh.' } },
        ],
    },
    E: {
        intro: {
            zh: '買進來的鋼材（盤元、線材）本身也有排放，而且通常是螺絲排放裡最大的一塊。每一種鋼材一個分頁：買了多少、用在哪個過程、鋼廠提供的每噸排放。',
            en: 'The steel you buy (wire rod, wire) carries emissions of its own, usually the largest part of a screw\'s footprint. Each steel has its own tab: how much you bought, which process used it, and the mill\'s emissions per tonne.',
        },
        prepare: {
            zh: ['整年的鋼材採購發票或進貨單（公噸）', '向鋼廠索取的 CBAM 排放資料（每噸鋼材的直接排放）', '拿不到時改用歐盟預設值（可在「情境試算」查）'],
            en: ['The year\'s steel purchase invoices or goods-received notes (tonnes)', 'CBAM emissions data from the steel mill (direct emissions per tonne)', 'If the mill cannot provide it, the EU default value (see the Scenario calculator)'],
        },
        tour: [
            { target: mark('precursor-tabs'), title: { zh: '每種鋼材一個分頁', en: 'One tab per steel' }, body: { zh: '分頁來自「設施資訊」第 5 部分列出的前驅物。', en: 'The tabs come from the precursors listed under Installation section 5.' } },
            { target: field('E.route'), title: { zh: '買了多少', en: 'How much you bought' }, body: { zh: '整年的進貨量加總，單位公噸。', en: 'The year\'s purchases added up, in tonnes.' } },
            { target: field('E.process'), title: { zh: '用在哪個過程', en: 'Which process used it' }, body: { zh: '只有一個過程時，通常等於買進的量（扣掉庫存變化）。', en: 'With one process this is usually the amount bought, adjusted for stock changes.' } },
            { target: field('E.see'), title: { zh: '最重要的一格', en: 'The most important field' }, body: { zh: '鋼材每噸的內含直接排放，要向鋼廠拿。它通常決定了螺絲大部分的碳排。', en: 'The steel\'s direct emissions per tonne, from the mill. It usually decides most of a screw\'s footprint.' } },
            { target: field('E.seeSource'), title: { zh: '數據來源', en: 'Data source' }, body: { zh: '鋼廠實測選「實測」；用歐盟預設值選「預設值」，下面會多出一格要你說明理由。', en: 'Choose Measured for mill data, or Default for the EU value; a field for the reason then appears.' } },
        ],
    },
    SumProc: {
        intro: {
            zh: '這一頁只有兩格，都可以留白：在台灣已付的碳價，以及想補充給進口商的話。多數中小企業不用繳台灣碳費。',
            en: 'This page has two fields, both optional: any carbon price paid in Taiwan, and anything else you want your importer to know. Most SMEs do not pay Taiwan\'s carbon fee.',
        },
        prepare: {
            zh: ['如果有繳碳費：繳費通知或收據'],
            en: ['If you pay the carbon fee: the payment notice or receipt'],
        },
        tour: [
            { target: field('SumProc.M13'), title: { zh: '碳定價', en: 'Carbon price' }, body: { zh: '沒有繳台灣碳費就留白。', en: 'Leave blank if you do not pay Taiwan\'s carbon fee.' } },
            { target: field('SumProc.M16'), title: { zh: '補充說明', en: 'Additional notes' }, body: { zh: '例如「電力排放係數採能源署 2024 年公告值」，讓進口商知道你的假設。', en: 'For example which electricity factor you used, so the importer knows your assumptions.' } },
        ],
    },
    SumProd: {
        intro: {
            zh: '每個出口到歐盟的產品（每個 CN 稅則號）一筆，掛在它的生產過程底下。鋼鐵產品可以再填合金成分；在台灣有繳碳費才需要填碳價。',
            en: 'One entry per product you export to the EU (one per CN code), under the process that makes it. Steel products can add alloy contents; fill in the carbon price only if you pay one in Taiwan.',
        },
        prepare: {
            zh: ['產品的歐盟 8 碼 CN 稅則號（出口報單或問報關行）', '鋼材材質證明書（錳、鉻、鎳、碳含量）', '有繳碳費的話：每噸產品分攤的金額'],
            en: ['Each product\'s 8-digit EU CN code (customs declaration or your broker)', 'Mill test certificates (Mn, Cr, Ni, C content)', 'If you pay the carbon fee: the amount per tonne of product'],
        },
        tour: [
            { target: mark('add-product'), title: { zh: '新增產品', en: 'Add a product' }, body: { zh: '每個出口的 CN 稅則號新增一筆。', en: 'Add one entry per CN code you export.' } },
            { target: field('SumProd.process'), title: { zh: '所屬生產過程', en: 'Production process' }, body: { zh: '先選做這個產品的過程，CN 碼選單才會有選項。', en: 'Pick the process that makes it first; the CN code list then fills in.' } },
            { target: field('SumProd.cn_code'), title: { zh: 'CN 稅則號', en: 'CN code' }, body: { zh: '用歐盟的 8 碼，不是台灣的稅則號；例如內六角螺絲 7318 15 68。', en: 'Use the EU 8-digit code, not Taiwan\'s tariff number; e.g. hexagon socket screws 7318 15 68.' } },
            { target: field('SumProd.param_cr'), title: { zh: '合金成分', en: 'Alloy content' }, body: { zh: '照材質證明書填百分比，不知道可以留白。', en: 'Percentages from the mill test certificate; leave blank if unknown.' } },
            { target: field('SumProd.cp_instrument'), title: { zh: '在台灣付的碳價', en: 'Carbon price paid in Taiwan' }, body: { zh: '沒有繳碳費，這一區整個留白。', en: 'If you pay no carbon fee, leave this whole section blank.' } },
        ],
    },
    Export: {
        intro: {
            zh: '把填好的資料寫進歐盟官方範本，存成 Excel 檔交給你的歐盟進口商。缺必填欄位也能匯出，但進口商可能會退回。',
            en: 'Writes your data into the official EU template as an Excel file for your EU importer. You can export with required fields missing, but your importer may send it back.',
        },
        prepare: {
            zh: ['先按上方「儲存專案」，留一份之後還能修改的檔案', '看下方有沒有黃色的缺漏提醒，點了會跳到那一頁'],
            en: ['Press "Save" at the top first, so you keep a file you can edit later', 'Check for the yellow missing-fields note below; each button jumps to its page'],
        },
        tour: [
            { target: mark('export-download'), title: { zh: '下載申報表', en: 'Download' }, body: { zh: '產生填好的官方 Excel 範本。範本其餘部分完全不動。', en: 'Creates the filled official Excel template; nothing else in it is changed.' } },
            { target: mark('export-gaps'), title: { zh: '還缺哪些', en: 'What is still missing' }, body: { zh: '每個按鈕代表一頁還有幾個必填欄位沒填，點了直接跳過去。', en: 'Each button shows a page with empty required fields; click to jump there.' } },
            { target: mark('save-project'), title: { zh: '儲存專案', en: 'Save the project' }, body: { zh: '專案檔（.cbam）可以之後再開啟修改；Excel 申報表是交出去的成品。', en: 'The project file (.cbam) can be reopened and edited; the Excel file is what you hand over.' } },
        ],
    },
};
