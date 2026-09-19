import React from 'react';
import { Phone, ExternalLink, Info } from 'lucide-react';
import { Group, Heading } from './Layout';
import { useT } from '../ui/prefs';

/* Taiwan support that already exists; the app complements it rather than repeating it. */
const RESOURCES = [
    { zh: '環境部氣候變遷署 CBAM 專區', en: 'Climate Change Administration CBAM zone', url: 'https://www.cca.gov.tw/affairs/cbam/25848.html' },
    { zh: '經濟部 CBAM 專區（範本、中文翻譯、預設值查詢）', en: 'MOEA CBAM zone (template, Chinese translations, default-value lookup)', url: 'http://www.greentrade.org.tw/CBAM/' },
    { zh: '歐盟執委會 CBAM 官方網站', en: 'European Commission CBAM website', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en' },
    { zh: '歐盟官方範本與填寫範例（含螺絲螺帽）', en: 'Official template and filled examples (incl. screws and nuts)', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-communication-and-news_en' },
];

const HOTLINES = [
    { zh: '申報諮詢專線', en: 'Declaration helpline', no: '0800-583-885' },
    { zh: '申報諮詢專線', en: 'Declaration helpline', no: '0800-070-580' },
    { zh: '碳費抵減諮詢', en: 'Carbon-fee deduction enquiries', no: '02-2322-2050' },
];

const HelpPage: React.FC = () => {
    const t = useT();
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[1.75rem] font-bold text-slate-900">{t('說明與資源', 'Help & resources')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">{t('幾個最常被問的規則，以及政府已經提供的協助管道。', 'The rules people ask about most, and the help the government already offers.')}</p>
            </div>

            <Group>
                <Heading label="Four rules worth knowing (先知道這四件事)" />
                <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
                    <li className="flex gap-3"><Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span>{t('50 噸豁免是看「進口商」一年從所有來源進口的總量，不是看你出口多少。你出口不到 50 噸，只要買家總量超過，仍要提供資料。',
                            'The 50-tonne exemption is about your importer’s total yearly imports from all sources, not your exports. If the buyer is over 50 t you still need to supply data even if you ship less.')}</span></li>
                    <li className="flex gap-3"><Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span>{t('鋼鐵、鋁、氫在正式期只計直接排放，電力不計入（CBAM 法規附件 II、歐盟指引 5D）。螺絲的內含排放多半來自買進的鋼材，請向鋼廠索取經查證的數據。',
                            'Iron, steel, aluminium and hydrogen count direct emissions only; electricity is not included (CBAM Regulation Annex II, Guidance 5D). Most of a screw’s embedded emissions come from the purchased steel, so ask the mill for verified figures.')}</span></li>
                    <li className="flex gap-3"><Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span>{t('沒有經查證的實際值，進口商就用歐盟預設值再加成：2026 年 +10%、2027 年 +20%、2028 年起 +30%（肥料 +1%）。',
                            'Without verified actual values the importer uses the EU default plus a mark-up: +10% in 2026, +20% in 2027, +30% from 2028 (fertilisers +1%).')}</span></li>
                    <li className="flex gap-3"><Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span>{t('2026 年的進口要在 2027 年 9 月 30 日前完成申報；使用實際值需經認可的查證機構查證，第一年須到廠實地查訪。',
                            'Imports in 2026 are declared by 30 September 2027. Actual values must be verified by an accredited verifier, with an on-site visit in the first year.')}</span></li>
                </ul>
            </Group>

            <Group>
                <Heading label="Phone help (電話諮詢)" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {HOTLINES.map(h => (
                        <a key={h.no} href={`tel:${h.no.replace(/-/g, '')}`} className="pressable flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 hover:bg-slate-200/70">
                            <Phone size={16} className="text-indigo-500" />
                            <span>
                                <span className="block text-sm font-semibold tabular-nums text-slate-900">{h.no}</span>
                                <span className="block text-xs text-slate-500">{t(h.zh, h.en)}</span>
                            </span>
                        </a>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">{t('工研院另提供免費的 CBAM 申報諮詢服務，可透過上述專線轉介。', 'ITRI also runs a free CBAM advisory service; the helplines above can refer you.')}</p>
            </Group>

            <Group>
                <Heading label="Official websites (官方網站)" />
                <div className="overflow-hidden rounded-xl bg-slate-100/60">
                    {RESOURCES.map((r, i) => (
                        <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-slate-200/60 ${i ? 'hairline border-t' : ''}`}>
                            {t(r.zh, r.en)}
                            <ExternalLink size={14} className="shrink-0 text-slate-400" />
                        </a>
                    ))}
                </div>
            </Group>
        </div>
    );
};

export default HelpPage;
