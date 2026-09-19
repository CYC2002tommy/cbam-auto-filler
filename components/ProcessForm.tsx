import React from 'react';
import type { KeyValue } from '../types';
import { ROUTE_MAP, D_PROCESSES_L67_DETAILED_OPTIONS } from '../constants';
import { TextInput, SelectInput } from './FormControls';
import { Heading, Group } from './Layout';
import { useT, useLabel, useOptionLabel } from '../ui/prefs';

interface Props {
    processId: string;
    productName: string;
    displayName?: string;
    data: KeyValue;
    setData: (data: KeyValue) => void;
    activeRoutes?: string[] | null;
    e83Rows: KeyValue[];
}

/**
 * Row of process `j` (1-based) inside the "consumed in other production processes" list
 * of process `k`'s block. The template lists the other nine processes in order and
 * skips the block's own process (D_Processes S32 = MAX(S$31:S31)+IF(D32=C11,2,1)).
 */
export const consumerRow = (k: number, j: number) => 32 + (j < k ? j - 1 : j - 2);

const Disabled: React.FC<{ when: boolean; reason: string; children: React.ReactNode }> = ({ when, reason, children }) => (
    <div className="relative">
        {when && <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-[0.8125rem] text-slate-600">{reason}</p>}
        <fieldset disabled={when} className={when ? 'opacity-45' : ''}>{children}</fieldset>
    </div>
);

const ProcessForm: React.FC<Props> = ({ processId, productName, data, setData, activeRoutes, e83Rows }) => {
    const t = useT();
    const label = useLabel();
    const optionLabel = useOptionLabel();
    const k = Number(processId.slice(1));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const routesToUse = ROUTE_MAP[productName] || (productName !== 'n.a.' ? ROUTE_MAP['Default'] : []);
    const totalProduction = routesToUse.reduce((sum, route, index) => {
        if (activeRoutes && !activeRoutes.includes(route)) return sum;
        return sum + (parseFloat(data[`L${16 + index}`] as string) || 0);
    }, 0);
    const soldEverything = totalProduction > 0 && totalProduction === (parseFloat(data.L27 as string) || 0);
    const isHeatApplicable = data.K50 === 'TRUE';
    const isWasteGasApplicable = data.L50 === 'TRUE';

    // Every other defined process can consume this one's output.
    const consumers = e83Rows
        .map((row, i) => ({ j: i + 1, name: (row.l as string) || (row.e as string) }))
        .filter(p => p.j !== k && p.j <= 10 && p.name && p.name !== 'n.a.');

    const yesNo = [
        { value: 'FALSE', label: t('否', 'No') },
        { value: 'TRUE', label: t('是', 'Yes') },
    ];

    if (productName.toLowerCase() === 'n.a.') {
        return <Group><p className="text-sm text-slate-500">{t('這個生產過程的類別是「不適用」，不需要填寫產量與排放。', 'This process is “n.a.”, so no production or emissions are needed.')}</p></Group>;
    }

    return (
        <div className="space-y-6">
            <Group>
                <Heading label="(a) Total production level (總產量)" note={t('本報告期間此過程各生產路徑的產量。', 'Output of this process in the reporting period, per production route.')} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {routesToUse.map((route, index) => {
                        if (activeRoutes && !activeRoutes.includes(route)) return null;
                        const cell = `L${16 + index}`;
                        return <TextInput key={cell} label={optionLabel(route)} code={cell} id={`${processId}-${cell}`} name={cell} type="number" unit="t" required value={data[cell] as string || ''} onChange={handleChange} />;
                    })}
                </div>
            </Group>

            <Group>
                <Heading label="(b) Produced for the market (銷往市場的數量)" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput label="Produced for the market (銷往市場)" code="L27" id={`${processId}-L27`} name="L27" type="number" unit="t" required value={data.L27 as string || ''} onChange={handleChange} />
                </div>
            </Group>

            {consumers.length > 0 && (
                <Group>
                    <Heading label="(c) Consumed in other production processes of this installation (廠內其他生產過程的用量)" />
                    <Disabled when={soldEverything} reason={t('全部產量都已銷往市場，這一項不需要填。', 'All output went to the market, so nothing to enter here.')}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {consumers.map(p => {
                                const cell = `L${consumerRow(k, p.j)}`;
                                return <TextInput key={cell} label={`${t('用於', 'Used in')} P${p.j}：${p.name}`} code={cell} id={`${processId}-${cell}`} name={cell} type="number" unit="t" value={data[cell] as string || ''} onChange={handleChange} />;
                            })}
                        </div>
                    </Disabled>
                </Group>
            )}

            <Group>
                <Heading label="(d) Consumed for non-CBAM goods (用於非 CBAM 產品)" />
                <Disabled when={soldEverything} reason={t('全部產量都已銷往市場，這一項不需要填。', 'All output went to the market, so nothing to enter here.')}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput label="Consumed for non-CBAM goods within the installation (廠內用於非 CBAM 產品)" code="L41" id={`${processId}-L41`} name="L41" type="number" unit="t" value={data.L41 as string || ''} onChange={handleChange} />
                    </div>
                </Disabled>
            </Group>

            <Group>
                <Heading label="(f) Elements that apply (適用的項目)" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectInput label="Measurable heat (可量測熱)" code="K50" id={`${processId}-K50`} name="K50" options={yesNo} required value={data.K50 as string || ''} onChange={handleChange} />
                    <SelectInput label="Waste gases (廢氣)" code="L50" id={`${processId}-L50`} name="L50" options={yesNo} required value={data.L50 as string || ''} onChange={handleChange} />
                </div>
            </Group>

            <Group>
                <Heading label="(g) Directly attributable emissions (直接歸屬排放)" note={label('The process’s own direct emissions, e.g. from the natural gas burned in its furnaces. (此過程本身的直接排放，例如爐子燃燒天然氣產生的排放。)')} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput label="Directly attributable emissions (DirEm) (直接歸屬排放量)" code="L54" id={`${processId}-L54`} name="L54" type="number" unit="tCO₂e" required value={data.L54 as string || ''} onChange={handleChange} />
                </div>
            </Group>

            <Group>
                <Heading label="(h) Measurable heat imported and exported (可量測熱的輸入與輸出)" />
                <Disabled when={!isHeatApplicable} reason={t('在 (f) 選「是」之後才需要填。', 'Only needed when (f) says yes.')}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput label="Net measurable heat imported (輸入的淨可量測熱)" code="L57" id={`${processId}-L57`} name="L57" type="number" unit="TJ" value={data.L57 as string || ''} onChange={handleChange} />
                        <TextInput label="Net measurable heat exported (輸出的淨可量測熱)" code="M57" id={`${processId}-M57`} name="M57" type="number" unit="TJ" value={data.M57 as string || ''} onChange={handleChange} />
                        <TextInput label="Emission factor of imported heat (輸入熱的排放係數)" code="L58" id={`${processId}-L58`} name="L58" type="number" unit="tCO₂/TJ" value={data.L58 as string || ''} onChange={handleChange} />
                        <TextInput label="Emission factor of exported heat (輸出熱的排放係數)" code="M58" id={`${processId}-M58`} name="M58" type="number" unit="tCO₂/TJ" value={data.M58 as string || ''} onChange={handleChange} />
                    </div>
                </Disabled>
            </Group>

            <Group>
                <Heading label="(i) Waste gases imported and exported (廢氣的輸入與輸出)" />
                <Disabled when={!isWasteGasApplicable} reason={t('在 (f) 選「是」之後才需要填。', 'Only needed when (f) says yes.')}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput label="Waste gas imported (輸入的廢氣)" code="L61" id={`${processId}-L61`} name="L61" type="number" unit="TJ" value={data.L61 as string || ''} onChange={handleChange} />
                        <TextInput label="Waste gas exported (輸出的廢氣)" code="M61" id={`${processId}-M61`} name="M61" type="number" unit="TJ" value={data.M61 as string || ''} onChange={handleChange} />
                        <TextInput label="Emission factor of imported waste gas (輸入廢氣的排放係數)" code="L62" id={`${processId}-L62`} name="L62" type="number" unit="tCO₂/TJ" value={data.L62 as string || ''} onChange={handleChange} />
                        <TextInput label="Emission factor of exported waste gas (輸出廢氣的排放係數)" code="M62" id={`${processId}-M62`} name="M62" type="number" unit="tCO₂/TJ" value={data.M62 as string || ''} onChange={handleChange} />
                    </div>
                </Disabled>
            </Group>

            <Group>
                <Heading label="(j) Electricity consumed (用電)" note={label('For iron, steel, aluminium and hydrogen goods, electricity is not counted in embedded emissions in the definitive period (Guidance 5D); fill it only if your importer asks. (鋼鐵、鋁、氫商品在正式期不計入電力排放（指引 5D），進口商有要求才需要填。)')} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput label="Electricity consumption (用電量)" code="L65" id={`${processId}-L65`} name="L65" type="number" unit="MWh" value={data.L65 as string || ''} onChange={handleChange} />
                    <TextInput label="Emission factor of the electricity (電力排放係數)" code="L66" id={`${processId}-L66`} name="L66" type="number" unit="tCO₂/MWh" value={data.L66 as string || ''} onChange={handleChange} />
                    <div className="md:col-span-2">
                        <SelectInput label="Source of the emission factor (排放係數來源)" code="L67" id={`${processId}-L67`} name="L67" options={D_PROCESSES_L67_DETAILED_OPTIONS} value={data.L67 as string || ''} onChange={handleChange} />
                    </div>
                </div>
            </Group>

            <Group>
                <Heading label="(k) Electricity exported (輸出電力)" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput label="Amount exported (輸出電量)" code="L71" id={`${processId}-L71`} name="L71" type="number" unit="MWh" value={data.L71 as string || ''} onChange={handleChange} />
                    <TextInput label="Emission factor of the exported electricity (輸出電力排放係數)" code="L72" id={`${processId}-L72`} name="L72" type="number" unit="tCO₂/MWh" value={data.L72 as string || ''} onChange={handleChange} />
                </div>
            </Group>
        </div>
    );
};

export default ProcessForm;
