/**
 * The fields the AI may fill, and where each one lands in the form.
 *
 * Deliberately a short, curated list: these are the values that actually appear on the
 * documents an SME has to hand — a utility bill, a fuel invoice, a supplier data sheet,
 * a business registration — rather than every cell of the template.
 */
export type Target =
    | { kind: 'static'; cell: string }                 // A_InstData static field
    | { kind: 'processCell'; cell: string }            // one production process's block
    | { kind: 'sourceStream'; column: string }         // a row of B_EmInst (a) source streams
    | { kind: 'product'; key: string };                // one product row of Summary_Products

export interface AiField {
    id: string;
    label: string;      // shown to the model and in the review sheet
    zh: string;
    unit?: string;
    hint?: string;
    aggregate?: 'sum';  // several documents add up (12 monthly bills)
    target: Target;
}

export const AI_FIELDS: AiField[] = [
    { id: 'inst.name', label: 'Installation name in English', zh: '設施名稱（英文）', target: { kind: 'static', cell: 'I20' } },
    { id: 'inst.street', label: 'Street and number', zh: '街道、門牌', target: { kind: 'static', cell: 'I21' } },
    { id: 'inst.postcode', label: 'Postcode', zh: '郵遞區號', target: { kind: 'static', cell: 'I23' } },
    { id: 'inst.city', label: 'City', zh: '城市', target: { kind: 'static', cell: 'I25' } },
    { id: 'inst.unlocode', label: 'UN/LOCODE of the installation', zh: 'UN/LOCODE', target: { kind: 'static', cell: 'I27' } },
    { id: 'period.start', label: 'Start of the period the document covers (YYYY-MM-DD)', zh: '期間開始日', target: { kind: 'static', cell: 'I9' } },
    { id: 'period.end', label: 'End of the period the document covers (YYYY-MM-DD)', zh: '期間結束日', target: { kind: 'static', cell: 'L9' } },

    { id: 'fuel.name', label: 'Fuel or material bought (e.g. natural gas, diesel)', zh: '燃料或原料名稱', target: { kind: 'sourceStream', column: 'e' } },
    { id: 'fuel.amount', label: 'Quantity of fuel bought', zh: '燃料數量', unit: 't or 1000Nm3', aggregate: 'sum', hint: 'invoice quantity', target: { kind: 'sourceStream', column: 'f' } },
    { id: 'fuel.ncv', label: 'Net calorific value stated on the document', zh: '淨熱值', unit: 'GJ/t', target: { kind: 'sourceStream', column: 'h' } },
    { id: 'fuel.ef', label: 'CO2 emission factor stated on the document', zh: '排放係數', unit: 'tCO2/TJ', target: { kind: 'sourceStream', column: 'j' } },

    { id: 'electricity.mwh', label: 'Electricity consumed', zh: '用電量', unit: 'MWh', aggregate: 'sum', hint: 'Taipower bills are in 度 (kWh): divide by 1000', target: { kind: 'processCell', cell: 'L65' } },
    { id: 'heat.imported', label: 'Measurable heat bought (steam)', zh: '外購熱能（蒸汽）', unit: 'TJ', aggregate: 'sum', target: { kind: 'processCell', cell: 'L57' } },
    { id: 'production.market', label: 'Quantity produced and sold', zh: '產量（銷往市場）', unit: 't', aggregate: 'sum', target: { kind: 'processCell', cell: 'L27' } },

    { id: 'product.cn', label: 'CN code / customs tariff code of the goods', zh: 'CN 稅則號', target: { kind: 'product', key: 'cn_code' } },
    { id: 'carbonPrice.due', label: 'Carbon price or carbon fee paid', zh: '已付碳價、碳費', aggregate: 'sum', target: { kind: 'product', key: 'cp_price_due' } },
    { id: 'carbonPrice.currency', label: 'Currency of the carbon price paid (ISO code)', zh: '碳價幣別', target: { kind: 'product', key: 'cp_currency' } },
];

/** What to suggest uploading, per section of the app. */
export const UPLOAD_HINTS: Record<string, { zh: string; en: string }[]> = {
    A: [
        { zh: '營業登記或工廠登記', en: 'Business or factory registration' },
        { zh: '任一張帳單的抬頭（地址、電號）', en: 'The header of any utility bill' },
    ],
    B: [
        { zh: '天然氣、柴油等燃料發票', en: 'Natural gas or diesel invoices' },
        { zh: '供應商的燃料分析報告', en: 'Supplier fuel analysis sheets' },
    ],
    D: [
        { zh: '生產紀錄（產量）', en: 'Production records' },
        { zh: '蒸汽外購單據', en: 'Purchased steam invoices' },
        { zh: '台電電費單（鋼鐵、鋁、氫正式期不計入，可略）', en: 'Taipower bills (not counted for Annex II goods)' },
    ],
    E: [
        { zh: '鋼廠（例如中鋼）的 CBAM 資料表', en: 'The steel mill’s CBAM data sheet' },
        { zh: '前驅物採購發票', en: 'Precursor purchase invoices' },
    ],
    SumProd: [
        { zh: '出口報單或商業發票（CN 稅則號）', en: 'Customs or commercial invoice (CN code)' },
        { zh: '碳費繳費單', en: 'Carbon fee receipt' },
    ],
};
