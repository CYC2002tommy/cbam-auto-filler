import React, { useState } from 'react';
import { 
  Settings, Clock, Calendar, TrendingUp, AlertCircle, CheckCircle2, BookOpen 
} from 'lucide-react';

// --- 靜態介面文字字典 ---
const uiText: Record<string, any> = {
  zh: {
    decarbonTitle: "減碳情境建議",
    decarbonSubtitle: "請選擇您正在分析的 CBAM 製程，系統將自動為您生成對應的短、中、長期減排建議與優先關注參數。",
    selectLabel: "選擇目標製程",
    selectPlaceholder: "-- 請選擇製程 --",
    shortTerm: "短期 (0-6個月)",
    midTerm: "中期 (6-24個月)",
    longTerm: "長期 (2-5年以上)",
    priorityParamsTitle: "情境分析優先參數",
    priorityParamsDesc: "建議您在上方表格的「減排措施」與「燃料類型」中，優先帶入以下參數進行試算：",
    emptyState: "請從上方選擇製程，以載入對應的減碳文獻建議。",
    referencesTitle: "參考文獻 (References)",
  },
  en: {
    decarbonTitle: "Decarbonization Recommendation",
    decarbonSubtitle: "Please select the CBAM process you are analyzing. The system will automatically generate short, mid, and long-term mitigation recommendations and priority parameters.",
    selectLabel: "Select Target Process",
    selectPlaceholder: "-- Select a Process --",
    shortTerm: "Short-term (0-6 months)",
    midTerm: "Mid-term (6-24 months)",
    longTerm: "Long-term (2-5+ years)",
    priorityParamsTitle: "Priority Parameters",
    priorityParamsDesc: "We recommend prioritizing the following parameters in the 'Mitigation Measures' and 'Fuel Types' sections below for your calculations:",
    emptyState: "Please select a process from above to load the corresponding decarbonization recommendations.",
    referencesTitle: "References",
  }
};

// 中英雙語文獻資料庫
const recommendationData: Record<string, any> = {
  1: {
    zh: {
      title: "製程 1: 鋼鐵製品 (Iron or Steel Products)",
      desc: "加工製造螺絲、扣件等鋼鐵製品的產線，減碳首要方向應聚焦於軋鋼與加熱成型階段的能源效率提升。",
      shortTerm: "導入智慧排程與監測系統(M5)：透過演算法自動優化軋鋼機台的負載分配與功率，快速減少產線能耗波動並提升良率。",
      midTerm: "製程內部優化(M3)：在鑄造與軋鋼環節加裝廢熱回收設備，將散失的高溫重新導回產線利用，減少整體能源需求及材料損耗。",
      longTerm: "重大設備替換(M1/M4)：將傳統燃燒化石燃料的加熱爐升級為直接電氣化的「電漿火炬(Plasma torch)」系統，有望消除80%以上直接碳排。",
      parameters: ["單位能耗 (unit energy consumption)", "熱回收率 (heat recovery rate)", "能耗波動 (energy fluctuation)"]
    },
    en: {
      title: "Process 1: Iron or Steel Products",
      desc: "For production lines manufacturing steel products (screws, fasteners), the primary focus of decarbonization should be on improving energy efficiency during the rolling and heating-forming stages.",
      shortTerm: "Smart scheduling and monitoring (M5): Utilize algorithms to optimize rolling machine load and power, rapidly reducing energy fluctuations and improving yield.",
      midTerm: "Internal process optimization (M3): Install waste heat recovery equipment in casting and rolling stages to redirect heat back into the production line, reducing energy demand.",
      longTerm: "Major equipment replacement (M1/M4): Upgrade fossil fuel-fired heating furnaces to electrified 'plasma torch' systems, potentially eliminating >80% of direct carbon emissions.",
      parameters: ["Unit energy consumption", "Heat recovery rate", "Energy fluctuation"]
    },
    references: [
      "A pilot-scale test of plasma torch application for decarbonising the steel reheating furnaces (2023)",
      "A review of CO2 emissions reduction technologies and low-carbon development in the iron and steel industry focusing on China (2021)",
      "Optimisation of steel rolling schedule based on evolutionary multi-tasking transfer algorithm (2024)"
    ]
  },
  2: {
    zh: {
      title: "製程 2: 粗鋼 (Crude Steel)",
      desc: "高爐-轉爐(BF-BOF)或電弧爐(EAF)為主的粗鋼冶煉，優先著重於熱能保留、降低化石燃料依賴及碳捕捉。",
      shortTerm: "製程介面優化(M3)：嚴格管控並改善高爐至轉爐間的鐵水運輸保溫(提高進料溫度)，以極低成本迅速減少熱能散失。",
      midTerm: "原物料與能源替代(M4)：引進生質炭(biochar)或再生天然氣(RNG)取代部分煤炭與天然氣，並將高耗能製程逐步替換為低碳綠電。",
      longTerm: "建置碳捕捉與封存(CCS)系統(M1)：結合生質炭取代技術與CCS，最高可消除90%以上的直接碳排。",
      parameters: ["燃料碳排強度 (feedstock carbon intensity)", "單位能耗 (unit energy consumption)", "替代原料比例 (alternative material ratio)"]
    },
    en: {
      title: "Process 2: Crude Steel",
      desc: "For crude steel smelting (BF-BOF/EAF), prioritize thermal retention, reducing fossil fuel reliance, and end-of-pipe carbon capture.",
      shortTerm: "Interface optimization (M3): Improve thermal insulation during molten iron transport to raise feeding temperatures, rapidly reducing thermal loss at low cost.",
      midTerm: "Material/Energy substitution (M4): Introduce biochar or renewable natural gas (RNG) and transition energy-intensive processes to low-carbon green electricity.",
      longTerm: "Carbon Capture and Storage (CCS) (M1): Combine biochar substitution with CCS technology to eliminate over 90% of direct carbon emissions.",
      parameters: ["Feedstock carbon intensity", "Unit energy consumption", "Alternative material ratio"]
    },
    references: [
      "Cost and life cycle analysis for deep CO2 emissions reduction of steelmaking: Blast furnace-basic oxygen furnace and electric arc furnace technologies (2023)",
      "Optimization of energy efficiency, energy consumption and CO2 emission in typical iron and steel manufacturing process (2022)",
      "Carbon abatement options for large iron and steel plants in India (2025)"
    ]
  },
  3: {
    zh: {
      title: "製程 3: 直接還原鐵 (Direct Reduced Iron, DRI)",
      desc: "減碳最優先方向應聚焦於減少天然氣依賴，並結合製程廢熱回收來過渡至氫能煉鐵。",
      shortTerm: "內部製程優化(M3)：調整豎爐或流化床內的顆粒分佈與床層結構(如引入V型輪廓)，改善氣流分佈並提升燃料反應效率。",
      midTerm: "熱能整合與燃料替代(M3/M4)：回收爐頂高溫廢熱，並在傳統天然氣還原氣體中混合較高比例的氫氣。",
      longTerm: "整合高溫固態電解槽(SOEC)系統(M1/M4)：利用100%綠電生產氫氣，完全取代還原段化石燃料，最高有望消除96%直接碳排放。",
      parameters: ["燃料碳排強度 (feedstock carbon intensity)", "熱回收率 (heat recovery rate)", "單位能耗 (unit energy consumption)"]
    },
    en: {
      title: "Process 3: Direct Reduced Iron (DRI)",
      desc: "Prioritize reducing natural gas reliance and integrating process waste heat recovery to transition toward hydrogen-based ironmaking.",
      shortTerm: "Internal process optimization (M3): Adjust particle distribution and bed structure in shaft furnaces (e.g., V-shaped profile) to improve airflow and reaction efficiency.",
      midTerm: "Thermal integration & fuel substitution (M3/M4): Recover furnace top waste heat and blend higher proportions of hydrogen into natural gas reducing gases.",
      longTerm: "Solid Oxide Electrolyzer Cell (SOEC) integration (M1/M4): Use 100% green electricity for hydrogen production, eliminating up to 96% of direct carbon emissions.",
      parameters: ["Feedstock carbon intensity", "Heat recovery rate", "Unit energy consumption"]
    },
    references: [
      "The perspective of hydrogen direct reduction of iron (2023)",
      "Direct reduction of iron to facilitate net zero emissions in the steel industry: A review of research progress at different scales (2024)",
      "Technical analysis of high-efficiency and flexible direct reduced iron plants integrated with high-temperature electrolysis (2025)"
    ]
  },
  4: {
    zh: {
      title: "製程 4: 生鐵 (Pig Iron)",
      desc: "從優化現有高爐運作效率，逐步過渡到低碳燃料替代，最終走向完全無碳的純氫能煉鐵。",
      shortTerm: "動態多目標操作最佳化系統(M5)：透過監控數據即時自動調整高爐參數，快速減少能耗波動。",
      midTerm: "製程內燃料替代(M4)：引進富氫氣體(氫氣、焦爐氣)與煤粉的共噴吹技術，減少對傳統高碳煤粉依賴。",
      longTerm: "100%純氫直接還原(H2-DR)設備(M1/M4)：逐步建置純氫豎爐等設備，利用綠氫完全取代碳還原劑，將排放轉變為水。",
      parameters: ["燃料碳排強度 (feedstock carbon intensity)", "能耗波動 (energy fluctuation) ", "單位能耗 (unit energy consumption)"]
    },
    en: {
      title: "Process 4: Pig Iron",
      desc: "Optimize existing blast furnace efficiency, transition to low-carbon fuel substitution, and ultimately move toward carbon-free pure hydrogen ironmaking.",
      shortTerm: "Dynamic operation optimization (M5): Automatically adjust blast furnace parameters using real-time monitoring data to reduce energy fluctuations.",
      midTerm: "In-process fuel substitution (M4): Introduce co-injection of hydrogen-rich gases (hydrogen, coke oven gas) with pulverized coal to reduce high-carbon coal reliance.",
      longTerm: "100% pure hydrogen direct reduction (H2-DR) (M1/M4): Build pure hydrogen shaft furnaces to completely replace carbon reductants, shifting emissions to water.",
      parameters: ["Feedstock carbon intensity", "Energy fluctuation", "Unit energy consumption"]
    },
    references: [
      "Dynamic multiobjective operation optimization of blast furnace ironmaking process (2025)",
      "Material and exergy-driven comparative assessment of hydrogen-rich fuels injection in blast furnaces: Feasibility envelope and carbon reduction (2025)",
      "Towards a 100% hydrogen-driven direct reduction ironmaking future: A critical review on kinetics, bottlenecks, and research priorities (2026)"
    ]
  },
  5: {
    zh: {
      title: "製程 5: 鐵合金 (Alloys - FeMn, FeCr, FeNi)",
      desc: "著重於「電爐製程與熱能的深度優化」以及「以生物碳取代化石還原劑」。",
      shortTerm: "入料與操作參數優化(M3/M4)：確保礦石進入高溫電爐前先進行「預還原(pre-reduction)」，降低還原耗能。",
      midTerm: "製程內部改造與整併(M3)：將熔化與冶煉整合於單一爐內同步進行，利用放熱抵銷電力需求；混入比例生物碳取代煤炭。",
      longTerm: "全面原物料與能源替代(M4/M1)：擴大高比例生物碳應用，切換為再生能源綠電，並完成電爐硬體調校。",
      parameters: ["燃料碳排強度 (feedstock carbon intensity)", "單位能耗 (unit energy consumption)", "替代原料比例 (alternative material ratio)"]
    },
    en: {
      title: "Process 5: Ferroalloys (FeMn, FeCr, FeNi)",
      desc: "Focus on deep optimization of electric furnace processes and replacing fossil reductants with biocarbon.",
      shortTerm: "Feeding & operation optimization (M3/M4): Implement 'pre-reduction' for ores before entering the electric furnace to lower reduction energy.",
      midTerm: "Process integration (M3): Combine melting and smelting in a single furnace to utilize exothermic heat; blend biocarbon into the charge.",
      longTerm: "Full material & energy substitution (M4/M1): Expand high-proportion biocarbon use, switch to green electricity, and tune furnace hardware.",
      parameters: ["Feedstock carbon intensity", "Unit energy consumption", "Alternative material ratio"]
    },
    references: [
      "Replacing Fossil Carbon in the Production of Ferroalloys with a Focus on Bio-Based Carbon: A Review (2021)",
      "Eco-friendly low-carbon manganese ferroalloy production for cleaner steel technologies (2024)",
      "Decarbonization of Ferroalloy Production Using Biocarbon (2025)"
    ]
  },
  6: {
    zh: {
      title: "製程 6: 燒結礦 (Sintered Ore)",
      desc: "聚焦於減少固體燃料(焦粉)消耗、最大化廢熱回收，及尋求低碳生質燃料替代方案。",
      shortTerm: "智慧化參數監測與控制(M5)：動態優化生產參數，合理增加鋪料層厚度並嚴格控制混合料水分，減少熱能浪費。",
      midTerm: "熱風燒結技術(M3)：將高溫廢氣引流回燒結床作為熱源，以物理熱能替代化石燃料燃燒，最高削減約17%碳排。",
      longTerm: "生物炭(biochar)替代(M4)：引進農業廢棄物熱裂解的生物炭，將部分焦粉燃料替換為碳中和燃料。",
      parameters: ["單位能耗 (unit energy consumption)", "熱回收率 (heat recovery rate)", "燃料碳排強度 (feedstock carbon intensity)"]
    },
    en: {
      title: "Process 6: Sintered Ore",
      desc: "Focus on reducing solid fuel (coke breeze) consumption, maximizing waste heat recovery, and seeking low-carbon biomass alternatives.",
      shortTerm: "Smart monitoring & control (M5): Dynamically optimize parameters like material layer thickness and moisture content to reduce heat waste.",
      midTerm: "Hot air sintering (M3): Redirect high-temperature exhaust back to the sinter bed as a heat source, physically substituting fossil fuel to cut emissions by ~17%.",
      longTerm: "Biochar substitution (M4): Introduce biochar from agricultural waste to replace a portion of fossil coke breeze with carbon-neutral fuel.",
      parameters: ["Unit energy consumption", "Heat recovery rate", "Feedstock carbon intensity"]
    },
    references: [
      "Biochars in Iron Ores Sintering Process: Effect on Sinter Quality and Emission (2021)",
      "Reduction of carbon emission in iron sintering process based on hot air sintering technology (2024)",
      "Intelligent Optimization and Impact Analysis of Energy Efficiency and Carbon Reduction in the High-Temperature Sintered Ore Production Process (2024)"
    ]
  },
  7: {
    zh: {
      title: "製程 7: 氨 (Ammonia)",
      desc: "改變傳統依賴天然氣產氫的模式，轉向低碳或無碳的氫氣來源。",
      shortTerm: "優化現有合成氨迴路(M3/M5)：檢視能源使用效率，例如評估將蒸氣驅動壓縮機改為電力驅動。",
      midTerm: "生質物氣化技術(M4)：將農業廢棄物(如堅果殼)作為產氫原料，部分取代天然氣，具備極佳經濟效益。",
      longTerm: "水電解產氫設備整合綠電(M1/M4)：建置高效率PEM等設備，以100%綠電生產綠氫合成綠氨，徹底消除直接碳排。",
      parameters: ["原料碳排強度 (feedstock carbon intensity)", "單位能耗 (unit energy consumption)", "替代原料比例 (alternative material ratio)"]
    },
    en: {
      title: "Process 7: Ammonia",
      desc: "Shift away from traditional natural gas-dependent hydrogen production toward low-carbon or carbon-free hydrogen sources.",
      shortTerm: "Optimize synthesis loop (M3/M5): Review energy efficiency, e.g., transition steam-driven compressors to electric-driven ones.",
      midTerm: "Biomass gasification (M4): Use agricultural waste (e.g., nutshells) to produce hydrogen, partially replacing natural gas with great economic benefits.",
      longTerm: "Water electrolysis with green electricity (M1/M4): Build high-efficiency PEM electrolyzers using 100% green electricity to completely eliminate direct emissions.",
      parameters: ["Feedstock carbon intensity", "Unit energy consumption", "Alternative material ratio"]
    },
    references: [
      "Green ammonia production technologies: A review of practical progress (2023)",
      "Decarbonization frameworks to industrial-scale ammonia production: Techno-economic and environmental implications (2024)",
      "Sustainability Assessment of Green Ammonia Production To Promote Industrial Decarbonization in Spain (2024)"
    ]
  },
  8: {
    zh: {
      title: "製程 8: 硝酸 (Nitric Acid)",
      desc: "著重「提升吸收塔轉化效率」減少源頭損耗，結合「高效管末觸媒技術」消滅N2O。",
      shortTerm: "原物料優化(M4)：在現有吸收塔進氣中注入純氧取代部分二次空氣，提升產量並降低NOx流失。",
      midTerm: "尾氣觸媒升級(M1/M3)：將SCR系統傳統觸媒替換為鐵改質天然沸石觸媒，維持NOx轉化率並避免生成N2O。",
      longTerm: "高效率尾氣處理系統(M1/M3)：建置具備特殊氣流設計的三層觸媒床反應器(如EnviNOx)，消除98%以上N2O排放。",
      parameters: ["產量/良率 (yield)", "除污效率 (material efficiency)", "單位能耗 (unit energy consumption)"]
    },
    en: {
      title: "Process 8: Nitric Acid",
      desc: "Improve absorption tower conversion efficiency to reduce source loss, and combine high-efficiency end-of-pipe catalyst technology to eliminate N2O.",
      shortTerm: "Raw material optimization (M4): Inject pure oxygen into the absorption tower intake to replace secondary air, boosting yield and reducing NOx loss.",
      midTerm: "Tail gas catalyst upgrade (M1/M3): Replace traditional SCR catalysts with iron-modified natural zeolite to maintain NOx conversion without N2O formation.",
      longTerm: "High-efficiency tail gas treatment (M1/M3): Install three-layer catalyst bed reactors (e.g., EnviNOx) to eliminate >98% of N2O emissions.",
      parameters: ["Yield", "Material efficiency", "Unit energy consumption"]
    },
    references: [
      "The Technology of Tail Gases Purifying in Nitric Acid Plants and Design of deN2O and deNOx Reactors-Review (2023)",
      "Modified Zeolite Catalyst for a NOx Selective Catalytic Reduction Process in Nitric Acid Plants (2021)",
      "Using Pure Oxygen in a Nitric Acid Plant to Increase Production and Reduce NOx Emissions (2025)"
    ]
  },
  9: {
    zh: {
      title: "製程 9: 尿素 (Urea)",
      desc: "先從廠區內部著手「回收廢氣二氧化碳」，最終走向「以綠電與綠氫徹底取代天然氣」。",
      shortTerm: "電力結構與前端製程優化(M4/M3)：採購再生能源取代高碳排市電，優化天然氣甜化等設施的生態效率。",
      midTerm: "藍色尿素改造(M3/M1)：在天然氣重組爐與發電廠加裝「碳捕捉」設備，將廢氣二氧化碳循環作為合成原料。",
      longTerm: "綠色尿素轉型(M1/M4)：引進由綠電驅動的大型水電解槽生產綠氫，並透過空氣捕捉取得CO2，擺脫化石燃料。",
      parameters: ["原料碳排強度 (feedstock carbon intensity)", "回收原料比例 (recycled content ratio)", "單位能耗 (unit energy consumption)"]
    },
    en: {
      title: "Process 9: Urea",
      desc: "Start internally with 'recovering exhaust CO2', then ultimately transition to 'completely replacing natural gas with green electricity and hydrogen'.",
      shortTerm: "Power & front-end optimization (M4/M3): Procure renewable energy to replace grid power and optimize eco-efficiency of natural gas sweetening facilities.",
      midTerm: "Blue Urea retrofit (M3/M1): Install carbon capture on natural gas reformers and power plants to circulate exhaust CO2 as a synthesis feedstock.",
      longTerm: "Green Urea transition (M1/M4): Introduce green electricity-driven water electrolyzers to produce green hydrogen and acquire CO2 via air capture.",
      parameters: ["Feedstock carbon intensity", "Recycled content ratio", "Unit energy consumption"]
    },
    references: [
      "Green urea production for sustainable agriculture (2024)",
      "Decarbonization of urea production in India and its impact on water withdrawal and costs (2025)",
      "Urea production: An absolute environmental sustainability assessment (2024)"
    ]
  },
  10: {
    zh: {
      title: "製程 10: 混合肥料 (Mixed Fertilizers)",
      desc: "高達三分之二排放發生在施用階段，著重「配方改良」與「優化田間施肥技術」。",
      shortTerm: "施肥操作優化(M3)：推廣「肥料深施(Deep Placement)」技術，將肥料鎖在土壤深層阻絕氣體揮發。",
      midTerm: "原物料與能源替代(M4)：引進添加硝化抑制劑的「包膜控釋型肥料(CRU)」，緩慢釋放養分，減少溫室氣體排放並提升產量。",
      longTerm: "產品成分重構(M4/M1)：減少配方中易釋放CO2的「尿素」，改以「硝酸銨(AN)」取代，並導入綠氫作為合成原料。",
      parameters: ["替代原料比例 (alternative material ratio)", "肥料利用率 (material efficiency)", "產量 (yield)"]
    },
    en: {
      title: "Process 10: Compound Fertilizers",
      desc: "Up to 2/3 of emissions occur during application. Focus on 'formulation improvement' and 'optimizing field fertilization techniques'.",
      shortTerm: "Fertilization operation optimization (M3): Promote 'Deep Placement' technology to lock fertilizers deep in the soil and block gas volatilization.",
      midTerm: "Material upgrade (M4): Introduce coated controlled-release urea (CRU) with nitrification inhibitors to reduce emissions and boost crop yield.",
      longTerm: "Composition restructuring (M4/M1): Replace CO2-releasing urea with ammonium nitrate (AN) and use green hydrogen as a synthesis feedstock.",
      parameters: ["Alternative material ratio", "Material efficiency", "Yield"]
    },
    references: [
      "Carbon emissions from fertilisers could be reduced by as much as 80% by 2050 (2023)",
      "Effects of Long-Term Controlled-Release Urea on Soil Greenhouse Gas Emissions in an Open-Field Lettuce System (2024)",
      "Effect of fertilizer deep placement and nitrification inhibitor on N2O, NO, HONO, and NH3 emissions from a maize field in the North China Plain (2024)"
    ]
  },
  11: {
    zh: {
      title: "製程 11: 鋁製品 (Aluminum Products)",
      desc: "兼顧上游初級鋁電解的電力清潔化，與下游二次鋁熔煉加工的廢熱回收。",
      shortTerm: "內部設計改造與廢熱回收(M3)：捕捉熔爐高溫煙氣與冷卻水熱能，用於預熱原料或廠區熱電聯產。",
      midTerm: "大規模能源轉換(M4)：積極採購再生能源綠電，取代自備燃煤電廠或市電，帶來巨幅碳足跡下降。",
      longTerm: "重大設備替換(M1)：上游冶煉廠全面淘汰碳陽極，導入「惰性陽極(Inert Anode)」技術，將副產物轉變為純氧。",
      parameters: ["電力碳排強度 (feedstock carbon intensity)", "熱回收率 (heat recovery rate)", "單位能耗 (unit energy consumption)"]
    },
    en: {
      title: "Process 11: Fabricated Aluminum Products",
      desc: "Address upstream primary aluminum's green electricity transition and downstream secondary aluminum's waste heat recovery.",
      shortTerm: "Internal design & heat recovery (M3): Capture furnace flue gas and cooling water heat for preheating raw materials or plant cogeneration.",
      midTerm: "Large-scale energy transition (M4): Actively procure renewable green electricity to replace coal/grid power for massive carbon footprint reduction.",
      longTerm: "Major equipment replacement (M1): Phase out carbon anodes in upstream smelters and introduce 'Inert Anode' technology (emitting pure oxygen).",
      parameters: ["Electricity carbon intensity", "Heat recovery rate", "Unit energy consumption"]
    },
    references: [
      "Different technology packages for aluminium smelters worldwide deliver to the 1.5°C target (2025)",
      "Reducing the Carbon Footprint: Primary Production of Aluminum and Silicon with Changing Energy Systems (2021)",
      "A systemic study for decarbonizing secondary aluminium production via waste heat recovery, carbon management and renewable energy integration (2025)"
    ]
  },
  12: {
    zh: {
      title: "製程 12: 未經鍛造的鋁 / 初級鋁 (Unwrought Aluminum)",
      desc: "減碳雙軌進行：「綠電導入」與「無碳陽極設備革命」。",
      shortTerm: "能源強度優化(M3/M5)：針對現有電解槽進行控制參數與結構調整，以最快速度降低基礎單位耗電量。",
      midTerm: "能源結構轉型(M4)：大量採購再生能源，或將自備電廠轉為低碳能源，降低電力碳排因子。",
      longTerm: "跨世代設備替換(M1/M4)：將傳統碳陽極全面升級為「惰性陽極(Inert Anodes)」，徹底實現終極零碳排。",
      parameters: ["電力碳排強度 (feedstock carbon intensity)", "單位能耗 (unit energy consumption)", "替代原料比例 (alternative material ratio)"]
    },
    en: {
      title: "Process 12: Primary Aluminum",
      desc: "Dual-track decarbonization approach: 'Green electricity introduction' and a 'Carbon-free anode equipment revolution'.",
      shortTerm: "Energy intensity optimization (M3/M5): Adjust control parameters and structures of existing cells to quickly reduce baseline power consumption.",
      midTerm: "Energy structure transformation (M4): Procure large quantities of renewable energy to significantly lower the electricity carbon emission factor.",
      longTerm: "Cross-generational equipment replacement (M1/M4): Upgrade traditional carbon anodes to 'Inert Anodes' (e.g., cermets) to achieve zero carbon emissions.",
      parameters: ["Electricity carbon intensity", "Unit energy consumption", "Alternative material ratio"]
    },
    references: [
      "Ni-Fe-based alloy as oxygen evolving anode for sustainable aluminum production (2026)",
      "Recent progress of inert anodes for carbon-free aluminium electrolysis: a review and outlook (2021)",
      "Global primary aluminum smelters' CO2 mitigation potential and targeted carbon-neutral pathways (2024)"
    ]
  }
};

const DecarbonizationEngine: React.FC = () => {
  const [lang, setLang] = useState('zh');
  const [selectedProcess, setSelectedProcess] = useState('');

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 text-xs font-bold pt-2 text-slate-500 shrink-0">圖1</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {lang === 'zh' ? '減碳情境建議' : 'Decarbonization Recommendation'}
              </h2>
              <p className="text-sm text-slate-500">
                {lang === 'zh' ? '(Decarbonization Recommendation)' : '(減碳情境建議)'}
              </p>
            </div>
          </div>
          <p className="text-slate-500 mb-6 text-sm">{uiText[lang].decarbonSubtitle}</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{uiText[lang].selectLabel}</label>
            <select
              className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none text-slate-700 font-medium"
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
            >
              <option value="" disabled>{uiText[lang].selectPlaceholder}</option>
              {Object.keys(recommendationData).map((key) => (
                <option key={key} value={key}>{recommendationData[key][lang].title}</option>
              ))}
            </select>
          </div>

          {selectedProcess && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                <h3 className="text-lg font-bold text-blue-900 mb-2">{recommendationData[selectedProcess][lang].title}</h3>
                <p className="text-blue-800 text-sm leading-relaxed">{recommendationData[selectedProcess][lang].desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-400">
                  <div className="flex items-center gap-2 mb-3 text-emerald-600">
                    <Clock size={20} />
                    <h4 className="font-bold">{uiText[lang].shortTerm}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{recommendationData[selectedProcess][lang].shortTerm}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-amber-400">
                  <div className="flex items-center gap-2 mb-3 text-amber-600">
                    <Calendar size={20} />
                    <h4 className="font-bold">{uiText[lang].midTerm}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{recommendationData[selectedProcess][lang].midTerm}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-purple-400">
                  <div className="flex items-center gap-2 mb-3 text-purple-600">
                    <TrendingUp size={20} />
                    <h4 className="font-bold">{uiText[lang].longTerm}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{recommendationData[selectedProcess][lang].longTerm}</p>
                </div>
              </div>

              <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={20} className="text-yellow-400" />
                  <h4 className="font-bold text-lg">{uiText[lang].priorityParamsTitle}</h4>
                </div>
                <p className="text-slate-300 text-sm mb-4">{uiText[lang].priorityParamsDesc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recommendationData[selectedProcess][lang].parameters.map((param: string, index: number) => {
                    const parts = param.split(' (');
                    return (
                      <div key={index} className="flex items-start gap-2 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{parts[0]}</span>
                          {parts[1] && <span className="text-sm text-slate-400">({parts[1]}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 參考文獻補充說明 */}
                <div className="mt-6 pt-5 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <BookOpen size={16} />
                    <h4 className="text-sm font-bold">{uiText[lang].referencesTitle}</h4>
                  </div>
                  <ul className="space-y-2 pl-1">
                    {recommendationData[selectedProcess].references.map((ref: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-400 leading-relaxed">
                        <span className="text-slate-500 font-mono mt-0.5 shrink-0">[{idx + 1}]</span>
                        <span>{ref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {!selectedProcess && (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed text-center flex flex-col items-center justify-center text-slate-400">
              <Settings size={48} className="mb-4 opacity-20" />
              <p>{uiText[lang].emptyState}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecarbonizationEngine;
