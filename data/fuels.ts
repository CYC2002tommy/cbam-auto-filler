/**
 * IPCC 2006 Guidelines, Vol. 2 (Energy), Table 1.2 (net calorific value, TJ/Gg = GJ/t)
 * and Table 1.4 (default CO2 emission factor, tCO2/TJ). The EU monitoring rules fall back
 * to these defaults when no better data exists. Operators with supplier analyses should
 * use their own NCV and EF instead.
 */
export interface FuelDefault {
    id: string;
    en: string;
    zh: string;
    ncv: number;   // GJ/t
    ef: number;    // tCO2/TJ
}

export const FUEL_DEFAULTS: FuelDefault[] = [
    { id: 'natural-gas', en: 'Natural gas', zh: '天然氣', ncv: 48.0, ef: 56.1 },
    { id: 'lpg', en: 'Liquefied petroleum gases (LPG)', zh: '液化石油氣', ncv: 47.3, ef: 63.1 },
    { id: 'gas-diesel-oil', en: 'Gas/Diesel oil', zh: '柴油', ncv: 43.0, ef: 74.1 },
    { id: 'residual-fuel-oil', en: 'Residual fuel oil (heavy fuel oil)', zh: '燃料油（重油）', ncv: 40.4, ef: 77.4 },
    { id: 'motor-gasoline', en: 'Motor gasoline', zh: '車用汽油', ncv: 44.3, ef: 69.3 },
    { id: 'naphtha', en: 'Naphtha', zh: '輕油（石油腦）', ncv: 44.5, ef: 73.3 },
    { id: 'kerosene', en: 'Other kerosene', zh: '煤油', ncv: 43.8, ef: 71.9 },
    { id: 'bituminous-coal', en: 'Other bituminous coal', zh: '煙煤', ncv: 25.8, ef: 94.6 },
    { id: 'sub-bituminous-coal', en: 'Sub-bituminous coal', zh: '亞煙煤', ncv: 18.9, ef: 96.1 },
    { id: 'coke', en: 'Coke oven coke', zh: '焦炭', ncv: 28.2, ef: 107.0 },
    { id: 'petroleum-coke', en: 'Petroleum coke', zh: '石油焦', ncv: 32.5, ef: 97.5 },
];
