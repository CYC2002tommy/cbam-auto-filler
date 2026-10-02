/**
 * Beginner guidance for every field, keyed by guideKey() (guide/keys.ts).
 *
 * Written for someone with no carbon-accounting background. Each entry has a one-line
 * summary that is always shown in beginner mode, and optional detail behind "?".
 * Numbers in examples come from the EU's own filled example ("Steel 3 Screws and nuts",
 * communication template V2.1) or from the regulations named in `source`; nothing here is
 * an invented figure.
 */
export interface GuideText {
    /** One line, always visible in beginner mode. */
    short: string;
    what?: string;
    where?: string;
    unit?: string;
    example?: string;
    mistakes?: string;
}

export interface GuideEntry {
    zh: GuideText;
    en: GuideText;
    source: string;
}

const T = 'EU CBAM communication template V2.1.1';
const EX = 'EU filled example "Steel 3 Screws and nuts"';
const IR2547 = 'Implementing Regulation (EU) 2025/2547, Annex point G';
const G5D = 'EU guidance document 5D (2026-08-14)';
const IR2621 = 'Implementing Regulation (EU) 2025/2621, Annexes I and II';

const PFC_ONLY = {
    zh: '只有生產原鋁（電解鋁）的工廠需要填；扣件廠不用填。',
    en: 'Only primary aluminium smelters fill this in; fastener plants leave it empty.',
};
const CEMS_ONLY = {
    zh: '只有用連續排放監測系統（CEMS）直接量測煙道排放的工廠需要填；扣件廠通常不用填。',
    en: 'Only plants that measure stack emissions with a continuous emissions monitoring system (CEMS) fill this in; fastener plants usually do not.',
};

export const GUIDE: Record<string, GuideEntry> = {
    // ───────────────────────── A. Installation ─────────────────────────
    'A.I9': {
        zh: {
            short: '這份資料所涵蓋期間的第一天，通常是 1 月 1 日。',
            what: '你在整份申報表填的所有數字（燃料、產量、排放、碳價）都必須屬於同一段期間。',
            where: '由公司決定，最常見的是一個完整的日曆年。',
            example: '報告 2026 全年：2026-01-01。',
            mistakes: '燃料帳單、產量和用電用的不是同一段期間。',
        },
        en: {
            short: 'The first day of the period your data covers, usually 1 January.',
            what: 'Every number in the form (fuels, production, emissions, carbon prices) must relate to this same period.',
            where: 'Your company decides; a full calendar year is the most common choice.',
            example: 'For the whole of 2026: 2026-01-01.',
            mistakes: 'Fuel bills, production figures and electricity covering different periods.',
        },
        source: `${T}, sheet A_InstData (reporting period note)`,
    },
    'A.L9': {
        zh: { short: '期間的最後一天，通常是 12 月 31 日。', example: '報告 2026 全年：2026-12-31。', mistakes: '結束日早於開始日，或與開始日不在同一個年度區間。' },
        en: { short: 'The last day of the period, usually 31 December.', example: 'For the whole of 2026: 2026-12-31.', mistakes: 'An end date before the start date.' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I19': {
        zh: { short: '工廠的中文名稱，選填。', example: '示範螺絲股份有限公司 岡山廠' },
        en: { short: 'The plant\'s name in your local language; optional.', example: '示範螺絲股份有限公司 岡山廠' },
        source: `${T}, sheet A_InstData (marked optional)`,
    },
    'A.I20': {
        zh: {
            short: '實際生產這批貨的工廠英文名稱，會出現在給進口商的摘要上。',
            what: 'CBAM 的「設施」是實際生產的廠區，不是公司總部。有多個廠區時，每個廠區各填一份。',
            where: '公司英文名稱加廠區名，可參考商業發票上的英文抬頭。',
            example: 'Demo Fasteners Co., Ltd. - Gangshan Plant',
            mistakes: '填成總公司或貿易公司的名稱。',
        },
        en: {
            short: 'The English name of the plant that actually makes the goods; it appears on the summary for your importer.',
            what: 'In CBAM an "installation" is the production site, not the head office. Several sites mean one form each.',
            where: 'Your company\'s English name plus the site name, e.g. as on your commercial invoices.',
            example: 'Demo Fasteners Co., Ltd. - Gangshan Plant',
            mistakes: 'Entering the head office or a trading company instead of the plant.',
        },
        source: `${T}, sheet A_InstData`,
    },
    'A.I21': {
        zh: { short: '工廠所在地的英文街道與門牌。', where: '可用中華郵政的「中文地址英譯」查詢。', example: 'No. 1, Demo Road' },
        en: { short: 'Street and number of the plant, in English.', where: 'Chunghwa Post offers an official Chinese-to-English address converter.', example: 'No. 1, Demo Road' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I22': {
        zh: { short: '工廠主要的經濟活動，選填。', example: 'Manufacture of fasteners（官方範例寫 Iron & steel production）' },
        en: { short: 'The plant\'s main economic activity; optional.', example: 'Manufacture of fasteners (the EU example uses "Iron & steel production")' },
        source: `${T}; ${EX}`,
    },
    'A.I23': {
        zh: { short: '工廠地址的郵遞區號。', example: '820' },
        en: { short: 'The plant\'s postcode.', example: '820' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I24': {
        zh: { short: '郵政信箱；沒有的話填 n.a.。', example: 'n.a.' },
        en: { short: 'P.O. Box; enter n.a. if you have none.', example: 'n.a.' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I25': {
        zh: { short: '工廠所在城市的英文名稱。', example: 'Kaohsiung' },
        en: { short: 'The city of the plant, in English.', example: 'Kaohsiung' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I26': {
        zh: { short: '工廠所在國家，台灣廠選 Taiwan。' },
        en: { short: 'The country of the plant; a Taiwanese plant chooses Taiwan.' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I27': {
        zh: {
            short: '聯合國地點代碼：國家代碼 TW 加上城市的三碼代碼。',
            where: '按下方「查詢台灣的 UN/LOCODE」連結，在聯合國（UNECE）清單找到工廠所在城市。',
            example: '高雄是 TW KHH，台中是 TW TXG，台北是 TW TPE。官方範例的寫法是國家代碼、空格、地點代碼（US ABC）。',
            mistakes: '填成郵遞區號或機場代碼。',
        },
        en: {
            short: 'The UN location code: country code TW plus a three-letter place code.',
            where: 'Use the "Look up Taiwan UN/LOCODEs" link and find the plant\'s city in the UNECE list.',
            example: 'Kaohsiung is TW KHH, Taichung TW TXG, Taipei TW TPE. The EU example writes country code, space, place code (US ABC).',
            mistakes: 'Entering a postcode or an airport code.',
        },
        source: `${T}; ${EX}; UNECE UN/LOCODE list`,
    },
    'A.I28': {
        zh: {
            short: '主要排放源（例如熱處理爐）位置的緯度，用十進位度數。',
            where: '在 Google 地圖工廠位置按右鍵，第一個數字就是緯度。',
            example: '22.79（台灣的緯度大約在 21.9 到 25.3 之間）',
            mistakes: '緯度和經度填反；用度分秒格式。',
        },
        en: {
            short: 'Latitude of the main emission source (e.g. the heat-treatment furnace), in decimal degrees.',
            where: 'Right-click the plant in Google Maps; the first number is the latitude.',
            example: '22.79 (Taiwan lies roughly between 21.9 and 25.3)',
            mistakes: 'Swapping latitude and longitude; using degrees-minutes-seconds.',
        },
        source: `${T}, sheet A_InstData`,
    },
    'A.I29': {
        zh: {
            short: '主要排放源位置的經度，用十進位度數。',
            where: 'Google 地圖右鍵複製座標時的第二個數字。',
            example: '120.29（台灣的經度大約在 119.3 到 122.0 之間）',
            mistakes: '緯度和經度填反。',
        },
        en: {
            short: 'Longitude of the main emission source, in decimal degrees.',
            where: 'The second number when you copy coordinates from Google Maps.',
            example: '120.29 (Taiwan lies roughly between 119.3 and 122.0)',
            mistakes: 'Swapping latitude and longitude.',
        },
        source: `${T}, sheet A_InstData`,
    },
    'A.I30': {
        zh: { short: '負責這份資料、可回答進口商問題的人；選填。' },
        en: { short: 'The person responsible for this data who can answer the importer\'s questions; optional.' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I31': {
        zh: { short: '聯絡電子郵件；選填。' },
        en: { short: 'Contact email; optional.' },
        source: `${T}, sheet A_InstData`,
    },
    'A.I32': {
        zh: { short: '聯絡電話，請加國碼；選填。', example: '+886 7 123 4567' },
        en: { short: 'Contact phone with the country code; optional.', example: '+886 7 123 4567' },
        source: `${T}, sheet A_InstData`,
    },
    'A.e62.e': {
        zh: {
            short: '工廠「自己生產」的 CBAM 商品類別；螺絲、螺栓、螺帽選 Iron or steel products。',
            what: '範本要你列出廠內生產的所有 CBAM 商品類別，包含廠內自己做、再拿去用的中間產品。',
            where: '看產品的 CN 碼：7318 開頭（螺絲、螺栓、螺帽）屬於鋼鐵製品。',
            example: '官方螺絲螺帽範例：Iron or steel products',
            mistakes: '把「買進來」的盤元也列在這裡；買進來的鋼材要列在第 5 節「採購前驅物」。',
        },
        en: {
            short: 'The CBAM goods categories your plant makes itself; screws, bolts and nuts are "Iron or steel products".',
            what: 'List every CBAM goods category produced on site, including intermediate products you make and use yourself.',
            where: 'Check the CN code: anything starting 7318 (screws, bolts, nuts) is an iron or steel product.',
            example: 'EU screws-and-nuts example: Iron or steel products',
            mistakes: 'Listing purchased wire rod here; purchased steel belongs in section 5, Purchased precursors.',
        },
        source: `${T}, sheet A_InstData section 4(a); ${EX}`,
    },
    'A.e62.route': {
        zh: { short: '這類商品的生產路徑，例如粗鋼的高爐-轉爐或電爐；鋼鐵製品（螺絲）不用選。' },
        en: { short: 'The production route for this category, e.g. blast furnace or electric arc furnace for crude steel; not needed for iron or steel products such as screws.' },
        source: `${T}, sheet A_InstData section 4(a)`,
    },
    'A.e83.e': {
        zh: { short: '這個生產過程產出的商品類別。', example: 'Iron or steel products' },
        en: { short: 'The goods category this production process makes.', example: 'Iron or steel products' },
        source: `${T}, sheet A_InstData section 4(b); ${EX}`,
    },
    'A.e83.l': {
        zh: {
            short: '幫這個生產過程取一個看得懂的名字，後面各頁都會用到。',
            what: '一個生產過程可以涵蓋從鍛造、熱處理到搓牙的整條產線；要分成幾個過程，取決於你想不想分別計算排放。',
            example: '官方範例分成兩個：Carbon steel screws and nuts、High alloy steel screws and nuts。',
            mistakes: '名稱留白，後面頁面就看不出是哪個過程。',
        },
        en: {
            short: 'Give this production process a clear name; later pages refer to it.',
            what: 'One process can cover the whole line from forging and heat treatment to thread rolling; split it only if you want separate emission figures.',
            example: 'The EU example uses two: Carbon steel screws and nuts, High alloy steel screws and nuts.',
            mistakes: 'Leaving it blank, so later pages cannot tell which process is which.',
        },
        source: `${T}, sheet A_InstData section 4(b); ${EX}`,
    },
    'A.e83.included': {
        zh: {
            short: '這個過程是否也包含廠內其他商品類別的生產；只做螺絲本身就選 Only direct production。',
            what: '如果你把廠內自己做的中間產品併在同一個過程計算，在這裡選它們。',
            example: '官方螺絲螺帽範例：Only direct production',
        },
        en: {
            short: 'Whether this process also covers other goods categories made on site; for screws alone choose "Only direct production".',
            what: 'If you account for an intermediate product made on site within this same process, select it here.',
            example: 'EU screws-and-nuts example: Only direct production',
        },
        source: `${T}, sheet A_InstData section 4(b); ${EX}`,
    },
    'A.e102.e': {
        zh: {
            short: '買進來的原料屬於哪一類 CBAM 商品；盤元、線材、鋼棒選 Iron or steel products。',
            what: '「前驅物」是你買進來、本身也屬於 CBAM 範圍的原料。螺絲廠最主要的前驅物就是鋼材。',
            example: '官方範例：Iron or steel products',
        },
        en: {
            short: 'The CBAM category of a purchased input; wire rod, wire and steel bars are "Iron or steel products".',
            what: 'A "precursor" is a purchased input that is itself a CBAM good. For a screw plant that is mainly the steel.',
            example: 'EU example: Iron or steel products',
        },
        source: `${T}, sheet A_InstData section 5; ${EX}`,
    },
    'A.e102.f': {
        zh: {
            short: '這批鋼材在哪一國「生產」，用兩碼國家代碼。',
            where: '看鋼廠的材質證明書或原產地證明。',
            example: '官方範例的兩種鋼材分別來自 CN（中國）和 US（美國）；中鋼的鋼材是 TW。',
            mistakes: '填成貿易商的國家或轉口地。',
        },
        en: {
            short: 'The country where this steel was produced, as a two-letter code.',
            where: 'The mill test certificate or certificate of origin.',
            example: 'The EU example\'s two steels come from CN and US; China Steel\'s steel is TW.',
            mistakes: 'Entering the trader\'s country or a transit country.',
        },
        source: `${T}, sheet A_InstData section 5; ${EX}`,
    },
    'A.e102.l': {
        zh: { short: '這個前驅物的名稱，讓人看得出是哪一種鋼材。', example: '合金鋼盤元 SCM435（官方範例寫 Carbon steel、High alloy steel）' },
        en: { short: 'A name that shows which steel this is.', example: 'Alloy steel wire rod SCM435 (the EU example uses Carbon steel, High alloy steel)' },
        source: `${T}, sheet A_InstData section 5; ${EX}`,
    },
    'A.e102.route': {
        zh: { short: '這個前驅物的生產路徑；不知道可以留白。' },
        en: { short: 'The production route of this precursor; leave blank if unknown.' },
        source: `${T}, sheet A_InstData section 5`,
    },

    // ───────────────────────── B. Source streams ─────────────────────────
    'B.d17.d': {
        zh: {
            short: '這個排放源流怎麼算；燒燃料選 Combustion（燃燒），扣件廠通常都是這個。',
            what: 'Combustion 是燃燒燃料；Process emissions 是原料在製程中分解放出 CO2（例如石灰石）；Mass balance 是用碳進出的平衡計算。',
            example: '官方螺絲螺帽範例：Combustion（天然氣）',
        },
        en: {
            short: 'How this source stream is calculated; burning fuel is "Combustion", which is what fastener plants normally use.',
            what: 'Combustion = burning a fuel; Process emissions = CO2 released when a raw material breaks down (e.g. limestone); Mass balance = carbon in versus carbon out.',
            example: 'EU screws-and-nuts example: Combustion (natural gas)',
        },
        source: `${T}, sheet B_EmInst; ${EX}`,
    },
    'B.d17.e': {
        zh: {
            short: '燃料或材料的名稱，最好寫出用在哪裡。',
            what: '「排放源流」就是廠裡會產生 CO2 的每一種燃料或材料，每種各填一列。',
            example: 'Natural gas（熱處理爐）；官方範例寫 Natural gas。',
        },
        en: {
            short: 'The fuel or material, ideally with where it is used.',
            what: 'A "source stream" is each fuel or material on site that releases CO2; one row each.',
            example: 'Natural gas (heat-treatment furnace); the EU example writes Natural gas.',
        },
        source: `${T}, sheet B_EmInst; ${EX}`,
    },
    'B.d17.f': {
        zh: {
            short: '報告期間總共用掉多少這種燃料。',
            where: '把整年的燃料帳單或發票加總；也可以把帳單拖進 App 讓 AI 讀。',
            unit: '單位在右邊「活動數據單位」選：公噸（t）或千標準立方公尺（1000Nm3）。',
            example: '官方螺絲螺帽範例：天然氣 1,837.5 t。',
            mistakes: '填成金額；公斤沒有換算成公噸；只填了一個月。',
        },
        en: {
            short: 'How much of this fuel you used in the reporting period.',
            where: 'Add up the year\'s fuel bills or invoices, or drop the bills into the app for the AI to read.',
            unit: 'Choose the unit next to it: tonnes (t) or thousand normal cubic metres (1000Nm3).',
            example: 'EU screws-and-nuts example: natural gas 1,837.5 t.',
            mistakes: 'Entering money instead of quantity; kilograms not converted to tonnes; one month only.',
        },
        source: `${T}, sheet B_EmInst; ${EX}`,
    },
    'B.d17.g': {
        zh: {
            short: '活動數據的單位：液體、固體燃料用 t；氣體可以用 1000Nm3。',
            what: '天然氣帳單上的「度」是立方公尺；用 1000Nm3 時要除以 1,000。帳單的計量條件可能和標準狀態（Nm3）略有不同，請向供應商確認。',
            mistakes: '單位選了 t，淨熱值與排放係數卻是用立方公尺計的。',
        },
        en: {
            short: 'The unit of the activity data: t for liquid and solid fuels; gases may use 1000Nm3.',
            what: 'Gas bills in Taiwan count in cubic metres; for 1000Nm3 divide by 1,000. Billing conditions can differ slightly from normal conditions (Nm3), so check with your supplier.',
            mistakes: 'Choosing t while the calorific value and emission factor are per cubic metre.',
        },
        source: `${T}, sheet B_EmInst`,
    },
    'B.d17.h': {
        zh: {
            short: '每單位燃料燃燒放出的熱量（淨熱值）。',
            where: '供應商的燃料分析報告；沒有的話按上面的「套用燃料預設值（IPCC）」直接帶入。',
            unit: '要跟活動數據同一個基準：活動數據用 t，就填每噸的 GJ（GJ/t）；用 1000Nm3，就填每千標準立方公尺的 GJ。',
            example: '天然氣 48 GJ/t（官方範例，也是正式期法規的標準係數）。',
            mistakes: '用了高熱值（總熱值）；單位跟活動數據不一致。排放係數單位選 tCO2/t 時，這格不會用到。',
        },
        en: {
            short: 'The heat released per unit of fuel (net calorific value).',
            where: 'Your supplier\'s fuel analysis; if you have none, press "Use fuel defaults (IPCC)" above.',
            unit: 'Use the same basis as the activity data: GJ per tonne for t, GJ per 1000 Nm3 for 1000Nm3.',
            example: 'Natural gas 48 GJ/t (the EU example, and the standard factor in the definitive-period regulation).',
            mistakes: 'Using the gross (higher) calorific value; a basis that does not match the activity data. With an EF unit of tCO2/t this field is not used.',
        },
        source: `${T}; ${EX}; ${IR2547}`,
    },
    'B.d17.j': {
        zh: {
            short: '每單位熱量（或每噸燃料）會排放多少 CO2。',
            where: '供應商資料；沒有的話用「套用燃料預設值（IPCC）」。',
            example: '天然氣 56.1 tCO2/TJ（官方範例與法規標準係數）。',
            mistakes: '數值和右邊的單位對不上：56.1 是 tCO2/TJ，不是 tCO2/t。',
        },
        en: {
            short: 'How much CO2 is emitted per unit of energy (or per tonne of fuel).',
            where: 'Supplier data; otherwise "Use fuel defaults (IPCC)".',
            example: 'Natural gas 56.1 tCO2/TJ (the EU example and the regulation\'s standard factor).',
            mistakes: 'A value that does not match its unit: 56.1 is tCO2/TJ, not tCO2/t.',
        },
        source: `${T}; ${EX}; ${IR2547}`,
    },
    'B.d17.k': {
        zh: {
            short: '排放係數的單位；搭配淨熱值時選 tCO2/TJ（最常見）。',
            what: 'tCO2/TJ 會乘上淨熱值；tCO2/t 或 tCO2/1000Nm3 則直接乘上燃料量，不用淨熱值。',
        },
        en: {
            short: 'The unit of the emission factor; with a calorific value choose tCO2/TJ (the usual case).',
            what: 'tCO2/TJ is multiplied by the calorific value; tCO2/t or tCO2/1000Nm3 multiply the fuel amount directly.',
        },
        source: `${T}, sheet B_EmInst (calculation formula)`,
    },
    'B.d17.l': {
        zh: {
            short: '用質量平衡法時，每噸材料含多少噸碳。',
            unit: '噸碳／噸材料（t C/t）；範本會乘以 3.664 換算成 CO2。',
            what: '扣件廠很少用質量平衡法，用燃燒法時不需要這格。',
        },
        en: {
            short: 'For mass balance: tonnes of carbon per tonne of material.',
            unit: 't C/t; the template multiplies by 3.664 to get CO2.',
            what: 'Fastener plants rarely use mass balance; combustion rows do not need it.',
        },
        source: `${T}, sheet B_EmInst (calculation formula)`,
    },
    'B.d17.n': {
        zh: {
            short: '燃料燒完的比例；留白就等於 100%，一般燃料留白即可。',
            unit: '百分比，100 代表 100%。',
            mistakes: '填成 1，範本會當成 1%，排放少算 100 倍。',
        },
        en: {
            short: 'The share of the fuel that is fully burned; blank means 100%, which suits normal fuels.',
            unit: 'Percent: 100 means 100%.',
            mistakes: 'Entering 1, which the template reads as 1% and under-counts emissions 100-fold.',
        },
        source: `${T}, sheet B_EmInst (formula: blank = 100%)`,
    },
    'B.d17.p': {
        zh: {
            short: '製程排放中原料實際轉化的比例；留白就等於 100%。',
            unit: '百分比，100 代表 100%。',
            mistakes: '填成 1，會被當成 1%。',
        },
        en: {
            short: 'For process emissions, the share of the material actually converted; blank means 100%.',
            unit: 'Percent: 100 means 100%.',
            mistakes: 'Entering 1, which is read as 1%.',
        },
        source: `${T}, sheet B_EmInst (formula: blank = 100%)`,
    },
    'B.d17.r': {
        zh: {
            short: '燃料中生質（非化石）成分的比例；天然氣、柴油等化石燃料留白或填 0。',
            unit: '百分比，15 代表 15%。',
        },
        en: {
            short: 'The biomass (non-fossil) share of the fuel; leave blank or 0 for fossil fuels such as gas and diesel.',
            unit: 'Percent: 15 means 15%.',
        },
        source: `${T}, sheet B_EmInst (calculation formula)`,
    },
    'B.d98.d': { zh: { short: `PFC 排放的計算方法（斜率法或過電壓法）。${PFC_ONLY.zh}` }, en: { short: `How PFC emissions are calculated (slope or overvoltage method). ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.e': { zh: { short: `電解槽的技術類型，例如 CWPB。${PFC_ONLY.zh}` }, en: { short: `The electrolysis cell technology, e.g. CWPB. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.f': { zh: { short: `報告期間的原鋁產量。${PFC_ONLY.zh}` }, en: { short: `Primary aluminium produced in the period. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.ag': { zh: { short: `陽極效應發生的頻率，依電解槽監測紀錄。${PFC_ONLY.zh}` }, en: { short: `Anode effect frequency, from cell monitoring records. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.ah': { zh: { short: `陽極效應的平均持續時間，依監測紀錄。${PFC_ONLY.zh}` }, en: { short: `Average anode effect duration, from monitoring records. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.ai': { zh: { short: `CF4 的斜率排放係數。${PFC_ONLY.zh}` }, en: { short: `Slope emission factor for CF4. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.aj': { zh: { short: `陽極效應過電壓。${PFC_ONLY.zh}` }, en: { short: `Anode effect overvoltage. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.ak': { zh: { short: `電流效率，以百分比填寫（95 代表 95%）。${PFC_ONLY.zh}` }, en: { short: `Current efficiency, as a percentage (95 means 95%). ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.al': { zh: { short: `過電壓係數。${PFC_ONLY.zh}` }, en: { short: `Overvoltage coefficient. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.am': { zh: { short: `C2F6 的重量分率。${PFC_ONLY.zh}` }, en: { short: `Weight fraction of C2F6. ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d98.at': { zh: { short: `廢氣收集效率，以百分比填寫（98 代表 98%）。${PFC_ONLY.zh}` }, en: { short: `Collection efficiency, as a percentage (98 means 98%). ${PFC_ONLY.en}` }, source: `${T}, sheet B_EmInst (b)` },
    'B.d113.d': { zh: { short: `這個量測點的名稱。${CEMS_ONLY.zh}` }, en: { short: `A name for this measurement point. ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.e': { zh: { short: `量測的溫室氣體種類（CO2 或 N2O）。${CEMS_ONLY.zh}` }, en: { short: `The greenhouse gas measured (CO2 or N2O). ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.r': { zh: { short: `排放中生質來源的比例，以百分比填寫。${CEMS_ONLY.zh}` }, en: { short: `The biomass share of the emissions, as a percentage. ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.v': { zh: { short: `每小時平均的溫室氣體濃度，依 CEMS 報表。${CEMS_ONLY.zh}` }, en: { short: `Average hourly GHG concentration, from the CEMS report. ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.x': { zh: { short: `報告期間的運轉時數。${CEMS_ONLY.zh}` }, en: { short: `Operating hours in the period. ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.z': { zh: { short: `平均煙氣流量，依 CEMS 報表。${CEMS_ONLY.zh}` }, en: { short: `Average flue gas flow, from the CEMS report. ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.ax': { zh: { short: `化石來源的能量含量（TJ）。${CEMS_ONLY.zh}` }, en: { short: `Fossil energy content (TJ). ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },
    'B.d113.ay': { zh: { short: `生質來源的能量含量（TJ）。${CEMS_ONLY.zh}` }, en: { short: `Biomass energy content (TJ). ${CEMS_ONLY.en}` }, source: `${T}, sheet B_EmInst (c)` },

    // ───────────────────────── C. Emissions & energy ─────────────────────────
    'C.M26': {
        zh: {
            short: '全廠外購電力造成的排放總量，範本規定這格一定要手動輸入。',
            what: '鋼鐵、鋁、氫在正式期不把電力排放算進產品（指引 5D），但範本仍要這個全廠總數。',
            where: '全廠全年用電量（MWh，1 MWh = 1,000 度）乘上電力排放係數（tCO2/MWh）。電力排放係數可用能源署公告值，或歐盟公告的台灣預設值 0.561，請跟進口商確認用哪一個。',
            example: '官方範例：(3,400 + 1,640) MWh × 0.833 = 4,198.32 tCO2e。',
            mistakes: '直接填用電度數，沒有乘上排放係數。',
        },
        en: {
            short: 'Total emissions from the electricity the plant buys; the template requires you to enter it by hand.',
            what: 'Iron, steel, aluminium and hydrogen do not count electricity in product emissions in the definitive period (guidance 5D), but the template still asks for this plant total.',
            where: 'Total yearly electricity (MWh; 1 MWh = 1,000 kWh) times the electricity emission factor (tCO2/MWh): Taiwan\'s Energy Administration figure or the EU default for Taiwan, 0.561. Ask your importer which one they use.',
            example: 'EU example: (3,400 + 1,640) MWh × 0.833 = 4,198.32 tCO2e.',
            mistakes: 'Entering kWh used without multiplying by the emission factor.',
        },
        source: `${T}, sheet C_Emissions&Energy note (a); ${EX}; ${G5D}; ${IR2621}`,
    },
    'C.H40': {
        zh: {
            short: '你的直接排放主要是怎麼得到的；用帳單燃料量配 IPCC 係數的扣件廠，選「量測加國際標準係數」。',
            what: '選項依數據品質由高到低排列：全部實測最好，主要使用歐盟預設值最差。「量測」指燃料量來自帳單或流量計。',
            example: '官方範例：Mostly measurements & international standard factors for e.g. the emission factor',
        },
        en: {
            short: 'How you mainly obtained your direct emissions; a plant using billed fuel amounts with IPCC factors picks "measurements & international standard factors".',
            what: 'The options run from best to worst data quality: full measurement first, mostly EU default values last. "Measurements" means fuel amounts from bills or meters.',
            example: 'EU example: Mostly measurements & international standard factors for e.g. the emission factor',
        },
        source: `${T}, sheet C_Emissions&Energy (c); ${EX}`,
    },
    'C.H41': {
        zh: {
            short: '為什麼只能用歐盟預設值；只有上一格選了「主要使用歐盟預設值」才需要填。',
            what: '選項：取得更好數據的成本不合理、數據有缺口、其他。',
        },
        en: {
            short: 'Why you had to rely on EU default values; needed only if the previous field says "mostly default values".',
            what: 'Options: unreasonable cost of better data, data gaps, other.',
        },
        source: `${T}, sheet C_Emissions&Energy (c)`,
    },
    'C.H42': {
        zh: {
            short: '這些數據被怎麼檢查過。',
            what: '選項依可信度由高到低：第三方查證、內部稽核、雙人覆核（Four eyes principle，由另一個人再核對一次）、沒有。',
            example: '官方範例：Four eyes principle',
        },
        en: {
            short: 'How this data was checked.',
            what: 'From strongest to weakest: third-party verification, internal audits, four-eyes principle (a second person checks), none.',
            example: 'EU example: Four eyes principle',
        },
        source: `${T}, sheet C_Emissions&Energy (c); ${EX}`,
    },

    // ───────────────────────── D. Production processes ─────────────────────────
    'D.route': {
        zh: {
            short: '這個生產過程在報告期間生產了多少噸產品。',
            where: '生產紀錄；或出貨量加上期末庫存、減去期初庫存。',
            unit: '公噸（t）。',
            example: '官方範例的第一個過程：17,000 t。',
            mistakes: '填成支數或千支；填成買進的鋼材量。',
        },
        en: {
            short: 'Tonnes of product this process made in the reporting period.',
            where: 'Production records, or shipments plus closing stock minus opening stock.',
            unit: 'Tonnes (t).',
            example: 'EU example, first process: 17,000 t.',
            mistakes: 'Entering pieces or thousands of pieces; entering the steel purchased.',
        },
        source: `${T}, sheet D_Processes (a); ${EX}`,
    },
    'D.L27': {
        zh: {
            short: '生產出來後賣出去（不在廠內再加工）的量。',
            example: '官方範例：17,000 t（全部銷往市場）。',
            mistakes: '把還要送到廠內下一個生產過程的量也算進來。',
        },
        en: {
            short: 'The amount sold rather than processed further on site.',
            example: 'EU example: 17,000 t (all sold).',
            mistakes: 'Including amounts that go on to another process on site.',
        },
        source: `${T}, sheet D_Processes (b); ${EX}`,
    },
    'D.consumed': {
        zh: { short: '這個過程的產品，有多少被廠內另一個生產過程拿去用；只有一個過程時不會出現。', unit: '公噸（t）。' },
        en: { short: 'How much of this process\'s output another process on site uses; not shown with a single process.', unit: 'Tonnes (t).' },
        source: `${T}, sheet D_Processes (c)`,
    },
    'D.L41': {
        zh: { short: '用來做非 CBAM 商品的量；沒有就留白。', unit: '公噸（t）。' },
        en: { short: 'The amount used for non-CBAM goods; leave blank if none.', unit: 'Tonnes (t).' },
        source: `${T}, sheet D_Processes (d)`,
    },
    'D.K50': {
        zh: {
            short: '這個過程有沒有買進或賣出「可量測熱」（蒸汽、熱水）；扣件廠通常選否。',
            what: '可量測熱是用流量計計量、在管線中傳送的熱，例如向別的工廠買蒸汽。選否時，下方 (h) 就不用填。',
        },
        en: {
            short: 'Whether this process imports or exports measurable heat (steam, hot water); fastener plants usually answer no.',
            what: 'Measurable heat is metered heat carried in pipes, such as steam bought from a neighbouring plant. With "no", section (h) below can be skipped.',
        },
        source: `${T}, sheet D_Processes (f)`,
    },
    'D.L50': {
        zh: {
            short: '這個過程有沒有輸入或輸出廢氣作為燃料；扣件廠通常選否。',
            what: '廢氣指鋼廠的高爐煤氣、焦爐煤氣這類製程副產氣體。選否時，下方 (i) 就不用填。',
        },
        en: {
            short: 'Whether this process imports or exports waste gases used as fuel; fastener plants usually answer no.',
            what: 'Waste gases are process gases such as blast-furnace or coke-oven gas from steelworks. With "no", section (i) can be skipped.',
        },
        source: `${T}, sheet D_Processes (f)`,
    },
    'D.L54': {
        zh: {
            short: '這個生產過程自己的直接排放，也就是排放源流中屬於這個過程的部分。',
            where: '只有一個生產過程時，等於「排放源流」那頁算出的全部直接排放；有多個過程時，依各過程用掉的燃料比例分配。',
            unit: '公噸 CO2 當量（tCO2e）。',
            example: '官方範例：天然氣 1,837.5 t × 48 GJ/t × 56.1 tCO2/TJ ÷ 1,000 = 4,948.02 tCO2e，分給兩個過程：3,337.95 與 1,610.07。',
            mistakes: '把外購電力的排放也算進來（電力在下面 (j)）。',
        },
        en: {
            short: 'This process\'s own direct emissions: its share of the source-stream emissions.',
            where: 'With one process, all direct emissions from the Source streams page; with several, split by each process\'s share of the fuel.',
            unit: 'Tonnes of CO2 equivalent (tCO2e).',
            example: 'EU example: natural gas 1,837.5 t × 48 GJ/t × 56.1 tCO2/TJ ÷ 1,000 = 4,948.02 tCO2e, split 3,337.95 and 1,610.07 between two processes.',
            mistakes: 'Adding purchased electricity, which belongs in (j) below.',
        },
        source: `${T}, sheet D_Processes (g); ${EX}`,
    },
    'D.L57': { zh: { short: '買進的淨可量測熱量；前面選「否」就不用填。', unit: '兆焦耳（TJ）。' }, en: { short: 'Net measurable heat imported; skip if you answered no above.', unit: 'Terajoules (TJ).' }, source: `${T}, sheet D_Processes (h)` },
    'D.M57': { zh: { short: '賣出的淨可量測熱量；前面選「否」就不用填。', unit: '兆焦耳（TJ）。' }, en: { short: 'Net measurable heat exported; skip if you answered no above.', unit: 'Terajoules (TJ).' }, source: `${T}, sheet D_Processes (h)` },
    'D.L58': { zh: { short: '買進的熱每 TJ 帶有多少排放，由供熱方提供。', unit: 'tCO2/TJ。' }, en: { short: 'Emissions per TJ of imported heat, from the heat supplier.', unit: 'tCO2/TJ.' }, source: `${T}, sheet D_Processes (h)` },
    'D.M58': { zh: { short: '賣出的熱每 TJ 帶有多少排放。', unit: 'tCO2/TJ。' }, en: { short: 'Emissions per TJ of exported heat.', unit: 'tCO2/TJ.' }, source: `${T}, sheet D_Processes (h)` },
    'D.L61': { zh: { short: '輸入的廢氣能量；前面選「否」就不用填。', unit: '兆焦耳（TJ）。' }, en: { short: 'Energy of waste gas imported; skip if you answered no above.', unit: 'Terajoules (TJ).' }, source: `${T}, sheet D_Processes (i)` },
    'D.M61': { zh: { short: '輸出的廢氣能量；前面選「否」就不用填。', unit: '兆焦耳（TJ）。' }, en: { short: 'Energy of waste gas exported; skip if you answered no above.', unit: 'Terajoules (TJ).' }, source: `${T}, sheet D_Processes (i)` },
    'D.L62': { zh: { short: '輸入廢氣的排放係數。', unit: 'tCO2/TJ。' }, en: { short: 'Emission factor of the imported waste gas.', unit: 'tCO2/TJ.' }, source: `${T}, sheet D_Processes (i)` },
    'D.M62': { zh: { short: '輸出廢氣的排放係數。', unit: 'tCO2/TJ。' }, en: { short: 'Emission factor of the exported waste gas.', unit: 'tCO2/TJ.' }, source: `${T}, sheet D_Processes (i)` },
    'D.L65': {
        zh: {
            short: '這個生產過程的用電量；鋼鐵類在正式期不計入，進口商有要求才需要填。',
            where: '台電電費單（有分表就用分表數字）；可以把電費單拖進 App 讓 AI 換算。',
            unit: '百萬瓦時（MWh），1 MWh = 1,000 度。',
            example: '官方範例的第一個過程：3,400 MWh。',
            mistakes: '直接填度數沒有除以 1,000。',
        },
        en: {
            short: 'Electricity this process used; not counted for iron and steel in the definitive period, so fill it only if your importer asks.',
            where: 'Taipower bills (sub-meters if you have them); you can drop the bills into the app for the AI to convert.',
            unit: 'Megawatt-hours (MWh); 1 MWh = 1,000 kWh.',
            example: 'EU example, first process: 3,400 MWh.',
            mistakes: 'Entering kWh without dividing by 1,000.',
        },
        source: `${T}, sheet D_Processes (j); ${EX}; ${G5D}`,
    },
    'D.L66': {
        zh: {
            short: '每 MWh 用電帶來多少排放。',
            where: '能源署公告的電力排放係數，或歐盟公告的台灣預設值 0.561 tCO2/MWh，請跟進口商確認。',
            unit: 'tCO2/MWh（kg/度的數字相同）。',
            example: '官方範例（他國）：0.833 tCO2/MWh。',
        },
        en: {
            short: 'Emissions per MWh of electricity.',
            where: 'Taiwan\'s Energy Administration factor, or the EU default for Taiwan, 0.561 tCO2/MWh; ask your importer which applies.',
            unit: 'tCO2/MWh (the same number as kg/kWh).',
            example: 'EU example (another country): 0.833 tCO2/MWh.',
        },
        source: `${T}, sheet D_Processes (j); ${EX}; ${IR2621}`,
    },
    'D.L67': {
        zh: {
            short: '上面的電力排放係數從哪裡來。',
            what: 'D.4(a) 是歐盟執委會提供的國際能源署（IEA）係數；D.4(b) 是依法規其他公開數據的平均係數；D.4.1 到 D.4.3.2 是自發電、汽電共生、直接技術連結或購電協議的實際係數；Mix 是多種來源混用。',
            example: '官方範例：D.4(b)',
        },
        en: {
            short: 'Where the electricity emission factor above comes from.',
            what: 'D.4(a) = the IEA factor provided by the Commission; D.4(b) = an average factor from other public data allowed by the rules; D.4.1 to D.4.3.2 = actual factors for own generation, CHP, a direct technical link or a power purchase agreement; Mix = several sources.',
            example: 'EU example: D.4(b)',
        },
        source: `${T}, sheet D_Processes (j); ${EX}`,
    },
    'D.L71': { zh: { short: '這個過程自己發電並輸出的電量；沒有自己發電就留白。', unit: 'MWh。' }, en: { short: 'Electricity this process generates and exports; leave blank if you do not generate power.', unit: 'MWh.' }, source: `${T}, sheet D_Processes (k)` },
    'D.L72': { zh: { short: '輸出電力的排放係數。', unit: 'tCO2/MWh。' }, en: { short: 'Emission factor of the exported electricity.', unit: 'tCO2/MWh.' }, source: `${T}, sheet D_Processes (k)` },

    // ───────────────────────── E. Purchased precursors ─────────────────────────
    'E.route': {
        zh: {
            short: '報告期間買進這種鋼材的總量。',
            where: '把整年的採購發票或進貨單加總。不知道鋼材的生產路徑時，填在 All production routes。',
            unit: '公噸（t）。',
            example: '官方範例：20,000 t。',
        },
        en: {
            short: 'Total amount of this steel bought in the reporting period.',
            where: 'Add up the year\'s purchase invoices or goods-received notes. If the steel\'s production route is unknown, use All production routes.',
            unit: 'Tonnes (t).',
            example: 'EU example: 20,000 t.',
        },
        source: `${T}, sheet E_PurchPrec (a); ${EX}`,
    },
    'E.process': {
        zh: { short: '買進的鋼材有多少用在這個生產過程。', unit: '公噸（t）。', example: '官方範例：20,000 t 全部用在第一個過程。' },
        en: { short: 'How much of the purchased steel this production process used.', unit: 'Tonnes (t).', example: 'EU example: all 20,000 t in the first process.' },
        source: `${T}, sheet E_PurchPrec (b); ${EX}`,
    },
    'E.other': {
        zh: { short: '轉賣或用於非 CBAM 產品的量；沒有就留白。', unit: '公噸（t）。' },
        en: { short: 'Amount resold or used for non-CBAM goods; leave blank if none.', unit: 'Tonnes (t).' },
        source: `${T}, sheet E_PurchPrec (c)`,
    },
    'E.see': {
        zh: {
            short: '每噸鋼材的內含直接排放，要向鋼廠索取；這通常是螺絲排放裡最大的一塊。',
            where: '向鋼廠（例如中鋼）索取 CBAM 資料表或經查證的排放報告；拿不到時改用歐盟公告的預設值，並在旁邊選 Default。',
            unit: 'tCO2e／噸鋼材。',
            example: '官方範例的碳鋼：1.539（鋼廠實測）。',
            mistakes: '填成鋼廠全廠的排放總量；直接用產品碳足跡（ISO 14067）的數字，它的計算範圍和 CBAM 不同。',
        },
        en: {
            short: 'Direct emissions embedded in each tonne of this steel, from the steel mill; usually the largest part of a screw\'s emissions.',
            where: 'Ask the mill (e.g. China Steel) for its CBAM data sheet or a verified emissions report; if you cannot get one, use the EU default value and choose Default next to it.',
            unit: 'tCO2e per tonne of steel.',
            example: 'EU example, carbon steel: 1.539 (measured by the mill).',
            mistakes: 'Entering the mill\'s total emissions; using a product carbon footprint (ISO 14067), which has a different scope from CBAM.',
        },
        source: `${T}, sheet E_PurchPrec (e); ${EX}; ${IR2621}`,
    },
    'E.seeSource': {
        zh: { short: '上面那個數字的來源：Measured（鋼廠實測）、Default（歐盟預設值）或 Unknown。', example: '官方範例：Measured' },
        en: { short: 'Where the value above comes from: Measured (by the mill), Default (EU default value) or Unknown.', example: 'EU example: Measured' },
        source: `${T}, sheet E_PurchPrec (e); ${EX}`,
    },
    'E.elec': {
        zh: {
            short: '生產每噸鋼材用了多少電，由鋼廠提供；鋼鐵類在正式期不計入，可依進口商要求再填。',
            unit: 'MWh／噸鋼材。',
            example: '官方範例的碳鋼：0.3456 MWh/t。',
        },
        en: {
            short: 'Electricity used per tonne of this steel, from the mill; not counted for iron and steel in the definitive period, so fill it if your importer asks.',
            unit: 'MWh per tonne of steel.',
            example: 'EU example, carbon steel: 0.3456 MWh/t.',
        },
        source: `${T}, sheet E_PurchPrec (e); ${EX}; ${G5D}`,
    },
    'E.elecSource': {
        zh: { short: '上面用電量的來源：Measured、Default 或 Unknown。' },
        en: { short: 'Where the electricity figure above comes from: Measured, Default or Unknown.' },
        source: `${T}, sheet E_PurchPrec (e)`,
    },
    'E.elecEf': {
        zh: { short: '鋼廠用電的排放係數，由鋼廠提供。', unit: 'tCO2/MWh。', example: '官方範例：0.590 tCO2/MWh。' },
        en: { short: 'The emission factor of the mill\'s electricity, from the mill.', unit: 'tCO2/MWh.', example: 'EU example: 0.590 tCO2/MWh.' },
        source: `${T}, sheet E_PurchPrec (e); ${EX}`,
    },
    'E.elecEfSource': {
        zh: { short: '鋼廠電力排放係數的來源代碼，意思同「生產過程」頁的 D.4 選項。', example: '官方範例：Mix' },
        en: { short: 'The source code of the mill\'s electricity factor; same meaning as the D.4 options on the Production processes page.', example: 'EU example: Mix' },
        source: `${T}, sheet E_PurchPrec (e); ${EX}`,
    },
    'E.justification': {
        zh: {
            short: '為什麼這個鋼材只能用歐盟預設值；有選 Default 時才需要填。',
            what: '選項：取得更好數據的成本不合理、數據有缺口、其他。',
        },
        en: {
            short: 'Why only the EU default value is available for this steel; needed only when you chose Default.',
            what: 'Options: unreasonable cost of better data, data gaps, other.',
        },
        source: `${T}, sheet E_PurchPrec (e)`,
    },

    // ───────────────────────── Process summary ─────────────────────────
    'SumProc.M13': {
        zh: {
            short: '在台灣已付的碳定價與法源說明；沒有付碳費就留白。',
            what: '台灣的碳費依《氣候變遷因應法》徵收，對象是排放量較大的事業，多數中小企業不在範圍內。',
            example: 'Carbon fee under Taiwan\'s Climate Change Response Act',
        },
        en: {
            short: 'Any carbon price paid in Taiwan and its legal basis; leave blank if you pay none.',
            what: 'Taiwan\'s carbon fee is levied under the Climate Change Response Act on larger emitters; most SMEs are not covered.',
            example: 'Carbon fee under Taiwan\'s Climate Change Response Act',
        },
        source: `${T}, sheet Summary_Processes`,
    },
    'SumProc.M16': {
        zh: { short: '想補充給進口商的說明，例如數據假設或聯絡窗口；選填。' },
        en: { short: 'Anything else you want the importer to know, e.g. data assumptions or a contact; optional.' },
        source: `${T}, sheet Summary_Processes`,
    },

    // ───────────────────────── Product summary ─────────────────────────
    'SumProd.process': {
        zh: { short: '這個產品出自哪一個生產過程（設施資訊第 4(b) 節列的過程）。' },
        en: { short: 'The production process this product comes from (as listed in Installation section 4(b)).' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cn_code': {
        zh: {
            short: '產品的歐盟 8 碼 CN 稅則號。',
            where: '出口報單或商業發票，或請報關行確認歐盟的 CN 碼。',
            example: '內六角螺絲 7318 15 62（不鏽鋼）／7318 15 68；六角螺栓 7318 15 75（不鏽鋼）／7318 15 82（抗拉強度低於 800 MPa）／7318 15 88。官方範例：73181542。',
            mistakes: '直接用台灣的稅則號：前 6 碼與歐盟相同，後面幾碼不同。',
        },
        en: {
            short: 'The product\'s 8-digit EU CN code.',
            where: 'Customs declaration or commercial invoice, or ask your customs broker for the EU CN code.',
            example: 'Hexagon socket screws 7318 15 62 (stainless) / 7318 15 68; hexagon bolts 7318 15 75 (stainless) / 7318 15 82 (under 800 MPa) / 7318 15 88. EU example: 73181542.',
            mistakes: 'Using Taiwan\'s tariff number: the first 6 digits match the EU\'s, the rest do not.',
        },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.name': {
        zh: { short: '給進口商看的產品名稱，最好與發票上的品名一致。', example: '官方範例：Screws and Nuts Art. C1' },
        en: { short: 'The product name your importer will see; ideally as on your invoices.', example: 'EU example: Screws and Nuts Art. C1' },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.param_reducing_agent': {
        zh: { short: '鋼材在煉鋼時用的主要還原劑；高爐鋼通常是 Coal or coke，不知道可以留白。', where: '問鋼廠。', example: '官方範例：Coal or coke' },
        en: { short: 'The main reducing agent used to make the steel; blast-furnace steel is usually "Coal or coke". Leave blank if unknown.', where: 'Ask the steel mill.', example: 'EU example: Coal or coke' },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.param_steel_mill_id': {
        zh: { short: '供應鋼材的鋼廠識別編號，由鋼廠提供；不知道可以留白。', example: '官方範例：623108' },
        en: { short: 'The identification number of the steel mill that supplied the steel, from the mill; leave blank if unknown.', example: 'EU example: 623108' },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.param_mn': {
        zh: { short: '產品鋼材的錳含量。', where: '鋼廠的材質證明書（Mill Test Certificate）。', unit: '百分比：0.75 代表 0.75%。' },
        en: { short: 'Manganese content of the product\'s steel.', where: 'The mill test certificate.', unit: 'Percent: 0.75 means 0.75%.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_cr': {
        zh: { short: '產品鋼材的鉻含量。', where: '鋼廠的材質證明書。', unit: '百分比：18 代表 18%。', example: '官方範例的高合金鋼：18%' },
        en: { short: 'Chromium content of the product\'s steel.', where: 'The mill test certificate.', unit: 'Percent: 18 means 18%.', example: 'EU example, high-alloy steel: 18%' },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.param_ni': {
        zh: { short: '產品鋼材的鎳含量。', where: '鋼廠的材質證明書。', unit: '百分比：10 代表 10%。', example: '官方範例的高合金鋼：10%' },
        en: { short: 'Nickel content of the product\'s steel.', where: 'The mill test certificate.', unit: 'Percent: 10 means 10%.', example: 'EU example, high-alloy steel: 10%' },
        source: `${T}, sheet Summary_Products; ${EX}`,
    },
    'SumProd.param_other_alloys': {
        zh: { short: '其他合金元素（例如鉬）的含量合計。', where: '鋼廠的材質證明書。', unit: '百分比。' },
        en: { short: 'Total content of other alloying elements (e.g. molybdenum).', where: 'The mill test certificate.', unit: 'Percent.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_carbon': {
        zh: { short: '產品鋼材的碳含量。', where: '鋼廠的材質證明書。', unit: '百分比：0.35 代表 0.35%。' },
        en: { short: 'Carbon content of the product\'s steel.', where: 'The mill test certificate.', unit: 'Percent: 0.35 means 0.35%.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_scrap_steel': {
        zh: { short: '每噸鋼材使用多少噸廢鋼，由鋼廠提供；不知道可以留白。', unit: '範本以百分比顯示：每噸鋼用 0.2 噸廢鋼就填 20。' },
        en: { short: 'Tonnes of scrap per tonne of steel, from the mill; leave blank if unknown.', unit: 'The template shows it as a percentage: 0.2 t scrap per t steel is entered as 20.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_other_mat': {
        zh: { short: '鋼材中其他材料的比例，由鋼廠提供；不知道可以留白。', unit: '百分比。' },
        en: { short: 'Share of other materials in the steel, from the mill; leave blank if unknown.', unit: 'Percent.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_pre_scrap': {
        zh: { short: '使用的廢料中，消費前廢料（製造過程的邊料）所佔比例；不知道可以留白。', unit: '百分比。' },
        en: { short: 'Share of pre-consumer scrap (manufacturing offcuts) in the scrap used; leave blank if unknown.', unit: 'Percent.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.param_scrap_alu': { zh: { short: '每噸鋁使用多少噸廢鋁；只有鋁製品需要填。', unit: '以百分比填寫：0.3 噸就填 30。' }, en: { short: 'Tonnes of scrap per tonne of aluminium; aluminium products only.', unit: 'As a percentage: 0.3 t is entered as 30.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_non_alu': { zh: { short: '非鋁元素的比例；只有鋁製品需要填。', unit: '百分比。' }, en: { short: 'Share of non-aluminium elements; aluminium products only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_clinker': { zh: { short: '熟料係數；只有水泥需要填。', unit: '以百分比填寫：係數 0.75 就填 75。' }, en: { short: 'Clinker factor; cement only.', unit: 'As a percentage: a factor of 0.75 is entered as 75.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_calcined': { zh: { short: '是否經過煅燒；只有煅燒黏土需要填。' }, en: { short: 'Calcined or not; calcined clays only.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_conc': { zh: { short: '水溶液的濃度；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Concentration if a hydrous solution; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_nitric_acid': { zh: { short: '硝酸含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Nitric acid content; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_urea': { zh: { short: '尿素含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Urea content; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_n_total': { zh: { short: '總含氮量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Total nitrogen content; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_n_nh4': { zh: { short: '銨態氮（NH4+）含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Nitrogen as ammonium (NH4+); fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_n_no3': { zh: { short: '硝酸態氮（NO3-）含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Nitrogen as nitrate (NO3-); fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_n_urea': { zh: { short: '尿素態氮含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Nitrogen as urea; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.param_n_other': { zh: { short: '其他（有機）形態的氮含量；只有肥料類需要填。', unit: '百分比。' }, en: { short: 'Nitrogen in other (organic) forms; fertilisers only.', unit: 'Percent.' }, source: `${T}, sheet Summary_Products` },
    'SumProd.cp_instrument': {
        zh: { short: '在台灣已付的碳定價類型；台灣碳費選 Carbon Fee，沒有付就留白。' },
        en: { short: 'The type of carbon price paid in Taiwan; Taiwan\'s carbon fee is "Carbon Fee". Leave blank if you pay none.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_share': {
        zh: { short: '產品內含排放中，被這個碳價涵蓋的比例；沒有付碳費就留白。', unit: '百分比：100 代表全部涵蓋。' },
        en: { short: 'The share of embedded emissions covered by this carbon price; leave blank if none.', unit: 'Percent: 100 means fully covered.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_currency': {
        zh: { short: '付碳價的幣別；台灣碳費選 TWD。' },
        en: { short: 'The currency of the carbon price; Taiwan\'s carbon fee is in TWD.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_price_due': {
        zh: { short: '每噸產品應付的碳價金額；沒有付碳費就留白。', unit: '所選幣別／噸產品。' },
        en: { short: 'Carbon price due per tonne of product; leave blank if none.', unit: 'Chosen currency per tonne of product.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_rebate_type': {
        zh: { short: '有沒有拿到退還或補償，例如免費配額或減免；沒有就留白。' },
        en: { short: 'Any rebate or compensation received, e.g. free allocation or a deduction; leave blank if none.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_rebate_share': {
        zh: { short: '退還或補償涵蓋的排放比例；沒有就留白。', unit: '百分比。' },
        en: { short: 'The share of emissions the rebate covers; leave blank if none.', unit: 'Percent.' },
        source: `${T}, sheet Summary_Products`,
    },
    'SumProd.cp_rebate_amount': {
        zh: { short: '每噸產品的退還金額；沒有就留白。', unit: '所選幣別／噸產品。' },
        en: { short: 'Rebate amount per tonne of product; leave blank if none.', unit: 'Chosen currency per tonne of product.' },
        source: `${T}, sheet Summary_Products`,
    },
};

