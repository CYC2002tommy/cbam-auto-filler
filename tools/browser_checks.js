/**
 * Behaviour checks for the export mapping, run against the dev server.
 *
 *   npm run dev
 *   then paste this file into the browser console, or run it through Playwright:
 *   page.evaluate(await fs.readFile('tools/browser_checks.js','utf8'))
 *
 * It imports the real modules over Vite, so the assertions exercise shipped code.
 */
export default async function run() {
    const { buildWrites } = await import('/utils/buildWrites.ts');
    const { consumerRow } = await import('/components/ProcessForm.tsx');
    const results = [];
    const check = (name, fn) => {
        try { fn(); results.push({ name, ok: true }); }
        catch (e) { results.push({ name, ok: false, error: String(e.message || e) }); }
    };
    const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
    const empty = {
        a_instData: { static: {}, e62: [], e83: [], e102: [] },
        b_emInst: { d17: [], d98: [], d113: [] },
        c_emissionsEnergy: {}, d_processes: {}, e_purchPrec: {},
        summary_process: {}, summary_products: [],
    };
    const cellsOf = writes => writes.map(w => `${w.sheet}!${w.cell}`);

    check('11 production processes are refused', () => {
        const form = { ...empty, a_instData: { ...empty.a_instData, e83: Array.from({ length: 11 }, () => ({ e: 'Crude steel' })) } };
        let threw = null;
        try { buildWrites(form); } catch (e) { threw = e; }
        expect(threw, 'no error for 11 processes');
        expect(/10/.test(threw.message), `message should name the cap: ${threw.message}`);
    });

    check('10 production processes are accepted', () => {
        const form = { ...empty, a_instData: { ...empty.a_instData, e83: Array.from({ length: 10 }, (_, i) => ({ e: 'Crude steel', l: `P${i + 1}` })) } };
        const writes = cellsOf(buildWrites(form));
        expect(writes.includes('A_InstData!E92'), 'row 92 (P10) missing');
        expect(!writes.some(c => /A_InstData!\w+9[3-9]/.test(c)), 'wrote past the block');
    });

    check('the ID column is never written', () => {
        const form = { ...empty, a_instData: { ...empty.a_instData, e83: [{ e: 'Crude steel', l: 'Rolling' }] } };
        expect(!cellsOf(buildWrites(form)).includes('A_InstData!D83'), 'D83 is a locked label');
    });

    check('process 11 has no block', () => {
        let threw = null;
        try { buildWrites({ ...empty, d_processes: { P11: { L16: '5' } } }); } catch (e) { threw = e; }
        expect(threw, 'P11 accepted');
    });

    check('process blocks use the template stride', () => {
        const writes = cellsOf(buildWrites({ ...empty, d_processes: { P1: { L16: '1' }, P2: { L16: '2' }, P10: { L16: '3' } } }));
        expect(writes.includes('D_Processes!L16'), 'P1 -> L16');
        expect(writes.includes('D_Processes!L81'), 'P2 -> L81');
        expect(writes.includes('D_Processes!L601'), 'P10 -> L601');
    });

    check('consumption rows skip the block’s own process', () => {
        expect(consumerRow(1, 2) === 32, 'P1 block, P2 -> L32');
        expect(consumerRow(1, 10) === 40, 'P1 block, P10 -> L40');
        expect(consumerRow(3, 1) === 32, 'P3 block, P1 -> L32');
        expect(consumerRow(3, 2) === 33, 'P3 block, P2 -> L33');
        expect(consumerRow(3, 4) === 34, 'P3 block, P4 -> L34');
        expect(consumerRow(10, 9) === 40, 'P10 block, P9 -> L40');
    });

    check('101 products are refused, 100 are not', () => {
        const mk = n => ({ ...empty, summary_products: Array.from({ length: n }, () => ({ name: 'x' })) });
        let threw = null;
        try { buildWrites(mk(101)); } catch (e) { threw = e; }
        expect(threw, '101 products accepted');
        expect(cellsOf(buildWrites(mk(100))).includes('Summary_Products!H109'), 'product 100 -> row 109');
    });

    check('several products can share one process', () => {
        const writes = cellsOf(buildWrites({ ...empty, summary_products: [{ process: 'Rolling', name: 'a' }, { process: 'Rolling', name: 'b' }] }));
        expect(writes.includes('Summary_Products!D10') && writes.includes('Summary_Products!D11'), 'rows 10 and 11 expected');
    });

    check('zero is a value, blank is not', () => {
        const writes = buildWrites({ ...empty, d_processes: { P1: { L16: '0', L27: '', L54: 0 } } });
        expect(writes.some(w => w.cell === 'L16'), 'L16=0 should be written');
        expect(writes.some(w => w.cell === 'L54'), 'L54=0 should be written');
        expect(!writes.some(w => w.cell === 'L27'), 'blank should be skipped');
    });

    const { writeWorkbook } = await import('/utils/xlsxWriter.ts');
    const { loadTemplate } = await import('/utils/exportDeclaration.ts');
    const template = await loadTemplate();
    const refuses = async (write, what) => {
        let threw = null;
        try { await writeWorkbook(template, [write]); } catch (e) { threw = e; }
        if (!threw) throw new Error(`${what} was accepted`);
        return threw.message;
    };
    const asyncChecks = [
        ['a locked formula cell is refused', () => refuses({ sheet: 'B_EmInst', cell: 'AN98', value: 1 }, 'AN98')],
        ['a locked label cell is refused', () => refuses({ sheet: 'A_InstData', cell: 'D83', value: 'P1' }, 'D83')],
        ['an unknown sheet is refused', () => refuses({ sheet: 'Nope', cell: 'A1', value: 1 }, 'unknown sheet')],
        ['a value outside a fixed option list is refused', () => refuses({ sheet: 'B_EmInst', cell: 'D17', value: 'Combustionn' }, 'bad option')],
        ['a writable cell is accepted', async () => {
            const blob = await writeWorkbook(template, [{ sheet: 'A_InstData', cell: 'I20', value: 'ok' }]);
            if (!(blob instanceof Blob) || blob.size < 100000) throw new Error('no workbook produced');
            return `${Math.round(blob.size / 1024)} KB`;
        }],
    ];
    for (const [name, fn] of asyncChecks) {
        try { results.push({ name, ok: true, detail: await fn() }); }
        catch (e) { results.push({ name, ok: false, error: String(e.message || e) }); }
    }

    return results;
}
