import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'zh' | 'en';

interface Prefs {
    lang: Lang;
    setLang: (l: Lang) => void;
    showCodes: boolean;
    setShowCodes: (v: boolean) => void;
    reduceTransparency: boolean;
    setReduceTransparency: (v: boolean) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

const read = (key: string, fallback: string) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const write = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* private mode: keep in memory only */ }
};

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Lang>(() => (read('cbam.lang', 'zh') === 'en' ? 'en' : 'zh'));
    const [showCodes, setShowCodesState] = useState(() => read('cbam.showCodes', '0') === '1');
    const [reduceTransparency, setRT] = useState(() => read('cbam.reduceTransparency', '0') === '1');

    const setLang = useCallback((l: Lang) => { setLangState(l); write('cbam.lang', l); }, []);
    const setShowCodes = useCallback((v: boolean) => { setShowCodesState(v); write('cbam.showCodes', v ? '1' : '0'); }, []);
    const setReduceTransparency = useCallback((v: boolean) => { setRT(v); write('cbam.reduceTransparency', v ? '1' : '0'); }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.lang = lang === 'zh' ? 'zh-Hant' : 'en';
        root.classList.toggle('show-codes', showCodes);
        root.classList.toggle('reduce-transparency', reduceTransparency);
    }, [lang, showCodes, reduceTransparency]);

    const value = useMemo(() => ({ lang, setLang, showCodes, setShowCodes, reduceTransparency, setReduceTransparency }),
        [lang, setLang, showCodes, setShowCodes, reduceTransparency, setReduceTransparency]);
    return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
};

export const usePrefs = (): Prefs => {
    const ctx = useContext(PrefsContext);
    if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>');
    return ctx;
};

const CJK = /[㐀-鿿豈-﫿]/;

/** Split "outside (inside)" at the last top-level bracket pair, allowing nested （） inside. */
const lastBracketGroup = (s: string): [string, string] | null => {
    const trimmed = s.trimEnd();
    const last = trimmed[trimmed.length - 1];
    if (last !== ')' && last !== '）') return null;
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
        const ch = trimmed[i];
        if (ch === ')' || ch === '）') depth++;
        else if (ch === '(' || ch === '（') {
            depth--;
            if (depth === 0) {
                if (i === 0) return null;
                return [trimmed.slice(0, i).trim(), trimmed.slice(i + 1, -1).trim()];
            }
        }
    }
    return null;
};

/**
 * Split an existing bilingual label such as "Installation name (設施名稱)" or
 * "填報申報表 (Data Entry)" into its Chinese and English parts. Labels that are only
 * one language come back with the other side empty.
 */
// Template section numbers such as "(a)", "4(b).", "1." that should stay visible in both languages.
const SECTION_NO = /^((?:\d+)?\([a-z0-9]+\)\.?|\d+\.)\s+/i;

export const splitLabel = (label: string): { zh: string; en: string } => {
    const pair = lastBracketGroup(label);
    if (pair) {
        const [a, b] = pair;
        const [zh, en] = CJK.test(b) && !CJK.test(a) ? [b, a] : CJK.test(a) && !CJK.test(b) ? [a, b] : [null, null];
        if (zh !== null && en !== null) {
            const no = en.match(SECTION_NO)?.[1];
            return { zh: no && !zh.startsWith(no) ? `${no} ${zh}` : zh, en };
        }
    }
    return CJK.test(label) ? { zh: label, en: '' } : { zh: '', en: label };
};

/** Pick the display text for a bilingual label in the current language. */
export const useLabel = () => {
    const { lang } = usePrefs();
    return useCallback((label: string) => {
        const { zh, en } = splitLabel(label);
        return lang === 'zh' ? (zh || en) : (en || zh);
    }, [lang]);
};

/** Inline chrome strings: t('匯出', 'Export'). */
export const useT = () => {
    const { lang } = usePrefs();
    return useCallback((zh: string, en: string) => (lang === 'zh' ? zh : en), [lang]);
};

/**
 * Chinese display names for option values the template expects in English.
 * The stored value never changes; only what the user reads does.
 */
const OPTION_ZH: Record<string, string> = {
    'Combustion': '燃燒',
    'Process emissions': '製程排放',
    'Mass Balance': '質量平衡',
    'Slope method': '斜率法',
    'Overvoltage method': '過電壓法',
    'Measured': '實測',
    'Default': '預設值',
    'Unknown': '未知',
    'Data gaps': '資料缺口',
    'Other': '其他',
    'Only direct production': '僅直接生產',
    'All production routes': '所有生產路徑',
    'Unreasonable costs for more accurate monitoring': '更精確的監測成本不合理',
    'Mostly measurements & analyses': '主要為量測與分析',
    'Mostly measurements & national standard factors for e.g. the emission factor': '主要為量測，並使用國家標準係數（例如排放係數）',
    'Mostly measurements & sector-specific standard factors for e.g. the emission factor': '主要為量測，並使用產業標準係數（例如排放係數）',
    'Mostly measurements & international standard factors for e.g. the emission factor': '主要為量測，並使用國際標準係數（例如排放係數）',
    'Mostly default values provided by the European Commission': '主要使用歐盟執委會提供的預設值',
    'Third-party verification': '第三方查證',
    'Internal audits': '內部稽核',
    'Four eyes principle': '雙人覆核',
    'None': '無',
    'n.a.': '不適用',
    'True': '是',
    'False': '否',
    'Yes': '是',
    'No': '否',
    'Cement': '水泥',
    'Cement clinker': '水泥熟料',
    'Calcined clays': '煅燒黏土',
    'Aluminous cement': '鋁酸鹽水泥',
    'Iron or steel products': '鋼鐵製品',
    'Crude steel': '粗鋼',
    'Direct reduced iron': '直接還原鐵',
    'Pig iron': '生鐵',
    'Alloys (FeMn, FeCr, FeNi)': '鐵合金 (FeMn, FeCr, FeNi)',
    'Sintered Ore': '燒結礦',
    'Hydrogen': '氫',
    'Ammonia': '氨',
    'Nitric acid': '硝酸',
    'Urea': '尿素',
    'Mixed fertilisers': '混合肥料',
    'Aluminium products': '鋁製品',
    'Unwrought aluminium': '未經塑性加工鋁',
    'Electricity (export to EU)': '電力（輸往歐盟）',
    'Carbon Tax': '碳稅',
    'Carbon Levy': '碳費（徵收）',
    'Carbon Fee': '碳費',
    'National Emissions Trading System': '國家排放交易制度',
    'Regional Emissions Trading System': '區域排放交易制度',
    'Combination': '綜合',
    'Free allocation': '免費配額',
    'Financial compensation': '財務補償',
    'Tax deduction': '稅額扣抵',
};

export const useOptionLabel = () => {
    const { lang } = usePrefs();
    return useCallback((value: string, label?: string) => {
        if (label && label !== value) return label;
        return lang === 'zh' ? (OPTION_ZH[value.trim()] ?? value) : value;
    }, [lang]);
};
