// Experiment 2: KVL Voltage Hunt — verify Kirchhoff's voltage law in a T-network with a virtual DMM.

import { h, s, table, note } from '../core/ui.js';
import { tile, formula, eng } from '../core/page.js';
import { labPage, seeded } from '../core/lab.js';
import { wire, dot, label, resistor, vsource, ground, svgBox } from '../core/draw.js';

export const intro = 'Build a T-network, measure every voltage drop with the multimeter, and check that the voltages around each closed loop add up to zero.';

const E12 = [100, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000];

export function kvlSolve({ Vs, R1, R2, R3 }) {
    const Req = (R2 * R3) / (R2 + R3);
    const I = Vs / (R1 + Req);
    const VA = I * Req;
    return { Req, I, VA, V1: I * R1, V2: VA, V3: VA, I2: VA / R2, I3: VA / R3 };
}

export const def = {
        id: 'lab2', num: 2,
        aim: 'To verify Kirchhoff\'s Voltage Law (KVL) in a DC resistive network by measuring the voltage drops around closed loops and comparing their algebraic sum with the theoretical value.',
        apparatus: [['DC regulated power supply', '0–30 V, 1 A', '1'], ['Digital multimeter', 'Laboratory grade', '1'], ['Breadboard', 'Standard', '1'], ['Resistors R1, R2, R3', '¼ W carbon film (values chosen on the bench)', '1 each'], ['Connecting wires', 'Single strand', 'As required']],
        theory: [
            h('p', {}, h('b', {}, 'Kirchhoff\'s Voltage Law: '), 'the algebraic sum of all voltages around any closed loop is zero, ΣV = 0. It follows from conservation of energy: the energy gained from the source is used up in the resistors.'),
            h('p', {}, h('b', {}, 'Sign convention: '), 'going from − to + (through a source) is a rise and counted positive. Going in the direction of current through a resistor (+ to −) is a drop and counted negative.'),
            h('p', {}, 'In the T-network, R1 is in series with the parallel pair R2 ∥ R3. Mesh 1 = source, R1, R2. Mesh 2 = R2 and R3. The outer loop = source, R1, R3.'),
            formula('Req = R2·R3 / (R2 + R3)     I = Vs / (R1 + Req)     VA = I · Req     VR1 = I · R1')
        ],
        procedure: ['Measure R1, R2 and R3 with the DMM in Ω mode and note the actual values.', 'Build the T-network on the breadboard.', 'Switch on the supply and set it to 10 V.', 'Measure with polarity: red probe where current enters a component, black where it leaves.', 'Mesh 1: measure the source voltage, VR1 and VR2.', 'Mesh 2: measure VR2 (shared branch) and VR3.', 'Fill the tables and add the voltages around each loop with signs.'],
        precautions: ['Switch the supply off while wiring.', 'Use the DMM\'s DC voltage mode and the right range.', 'Keep connections tight; loose wires change readings.'],
        bench: (panel, ctx) => bench(panel, ctx),
        observations: (ctx) => {
            const o = ctx.obs;
            if (!o.cfg) return [h('p', { class: 'muted' }, 'No readings yet. Measure at least the source and the three resistor voltages on the Virtual bench.')];
            const th = kvlSolve(o.cfg);
            const m = o.meas ?? {};
            const rows = [['Source Vs', o.cfg.Vs, m.Vs], ['V across R1', th.V1, m.V1], ['V across R2', th.V2, m.V2], ['V across R3', th.V3, m.V3]];
            const sum = (vals) => (vals.every(v => v !== undefined) ? vals.reduce((a, b) => a + b, 0) : undefined);
            const loops = [
                ['Mesh 1', 'Vs − VR1 − VR2', sum([m.Vs, m.V1 === undefined ? undefined : -m.V1, m.V2 === undefined ? undefined : -m.V2])],
                ['Mesh 2', '+VR2 − VR3', sum([m.V2, m.V3 === undefined ? undefined : -m.V3])],
                ['Outer loop', 'Vs − VR1 − VR3', sum([m.Vs, m.V1 === undefined ? undefined : -m.V1, m.V3 === undefined ? undefined : -m.V3])]
            ];
            return [
                h('div', { class: 'grid-4' }, tile('Supply Vs (set)', `${o.cfg.Vs} V`), tile('R1 measured', eng(o.actual.R1, 'Ω'), `nominal ${eng(o.cfg.R1, 'Ω')}`), tile('R2 measured', eng(o.actual.R2, 'Ω'), `nominal ${eng(o.cfg.R2, 'Ω')}`), tile('R3 measured', eng(o.actual.R3, 'Ω'), `nominal ${eng(o.cfg.R3, 'Ω')}`)),
                h('h4', {}, 'Table 1: Voltage drops'),
                table(['Component', 'Theoretical (V)', 'Practical (V)', '% error'], rows.map(([n, t, p]) => [n, t.toFixed(3), p === undefined ? '—' : p.toFixed(3), p === undefined ? '—' : `${(Math.abs(p - t) / t * 100).toFixed(2)}%`])),
                h('h4', {}, 'Table 2: KVL verification'),
                table(['Loop', 'Equation', 'Algebraic sum (V)', 'Ideally'], loops.map(([n, eq, v]) => [n, eq, v === undefined ? '—' : v.toFixed(3), '0 V'])),
                h('h4', {}, 'Calculations'),
                formula(`Req = R2 ∥ R3 = ${o.cfg.R2}·${o.cfg.R3} / (${o.cfg.R2} + ${o.cfg.R3}) = ${eng(th.Req, 'Ω')}`),
                formula(`I = Vs / (R1 + Req) = ${o.cfg.Vs} / (${o.cfg.R1} + ${th.Req.toFixed(1)}) = ${eng(th.I, 'A')}`),
                formula(`VA = I × Req = ${th.VA.toFixed(3)} V     VR1 = I × R1 = ${th.V1.toFixed(3)} V`)
            ];
        },
        result: (ctx) => {
            const m = ctx.obs.meas ?? {};
            if ([m.Vs, m.V1, m.V2, m.V3].some(v => v === undefined)) return 'Complete all four measurements to state the result.';
            const s1 = m.Vs - m.V1 - m.V2;
            return `KVL is verified. The algebraic sum of voltages around Mesh 1 is ${s1.toFixed(3)} V and around Mesh 2 is ${(m.V2 - m.V3).toFixed(3)} V, both practically zero. The small differences are due to resistor tolerance and meter accuracy.`;
        },
        viva: [
            ['State KVL.', 'The algebraic sum of all the voltages around any closed loop in a circuit is zero.'],
            ['KVL is based on which conservation law?', 'Conservation of energy. KCL is based on conservation of charge.'],
            ['Why is the sum not exactly zero in the lab?', 'Resistor tolerance (±5%), DMM accuracy and resolution, contact resistance of wires and breadboard, and the meter loading the circuit slightly.'],
            ['Why are VR2 and VR3 equal here?', 'R2 and R3 are connected in parallel between the same two nodes (A and ground), so they have the same voltage across them.'],
            ['Does KVL hold for AC circuits?', 'Yes, at every instant, and also for phasors (taking phase into account).'],
            ['What is the equivalent resistance of two resistors in parallel?', 'R1R2 / (R1 + R2). It is always smaller than the smallest of the two.']
        ]
};

export function render(page, { tab }) {
    return labPage(page, tab, def);
}

function bench(panel, ctx) {
    const st = ctx.obs.cfg ?? { Vs: 10, R1: 1000, R2: 2200, R3: 3300 };
    const out = h('div');
    const fig = h('div', { class: 'svg-box' });
    let probe = { red: null, black: null };
    const actualOf = () => {
        const rnd = seeded(st.R1 * 7 + st.R2 * 13 + st.R3 * 17);
        return { R1: st.R1 * (1 + (rnd() * 2 - 1) * 0.04), R2: st.R2 * (1 + (rnd() * 2 - 1) * 0.04), R3: st.R3 * (1 + (rnd() * 2 - 1) * 0.04) };
    };
    const nodeV = () => {
        const a = actualOf();
        const r = kvlSolve({ Vs: st.Vs, ...a });
        return { P: st.Vs, A: r.VA, G: 0, real: r };
    };
    const noise = (v, key) => v * (1 + (seeded(Math.round(Math.abs(v) * 1e4) + key.length * 97)() - 0.5) * 0.004);
    const pts = { P: [70, 50], A: [300, 50], G: [300, 210] };
    const draw = () => {
        const nv = nodeV();
        const reading = probe.red && probe.black ? noise(nv[probe.red] - nv[probe.black], probe.red + probe.black) : null;
        const node = (id, labelText) => s('g', { class: `probe-node${probe.red === id ? ' is-red' : ''}${probe.black === id ? ' is-black' : ''}`, tabindex: 0, role: 'button', 'aria-label': `node ${labelText}`, onClick: () => pick(id), onKeydown: e => { if (e.key === 'Enter') pick(id); } },
            s('circle', { cx: pts[id][0], cy: pts[id][1], r: 11 }), s('text', { x: pts[id][0], y: pts[id][1] - 16, 'text-anchor': 'middle' }, labelText));
        fig.replaceChildren(h('div', { class: 'kvl-bench' },
            svgBox(560, 260, vsource(70, 50, 210, 'Vs', { valueText: `${st.Vs} V` }), wire([70, 50], [130, 50]), resistor(130, 50, 250, 50, 'R1', { valueText: eng(st.R1, 'Ω') }), wire([250, 50], [300, 50]),
                resistor(300, 50, 300, 210, 'R2', { valueText: eng(st.R2, 'Ω'), side: -1 }), wire([300, 50], [450, 50]), resistor(450, 50, 450, 210, 'R3', { valueText: eng(st.R3, 'Ω') }), wire([70, 210], [450, 210]), dot(300, 210), ground(300, 210),
                node('P', 'P (+)'), node('A', 'A'), node('G', 'G (0 V)'),
                label(280, 250, 'Click a node to place the RED probe, then another for the BLACK probe', 'c-value')),
            h('div', { class: 'dmm' }, h('small', {}, 'DMM · DC VOLTS'), h('div', { class: 'lcd lcd--dmm' }, reading === null ? '- - . - -' : reading.toFixed(3)), h('small', {}, probe.red ? `red on ${probe.red}${probe.black ? `, black on ${probe.black}` : ''}` : 'no probes placed'))));
    };
    const pick = (id) => {
        if (!probe.red || (probe.red && probe.black)) probe = { red: id, black: null };
        else if (id !== probe.red) probe.black = id;
        draw();
    };
    const measure = (key, red, black) => {
        probe = { red, black };
        draw();
        const nv = nodeV();
        const v = noise(nv[red] - nv[black], red + black + key);
        ctx.obs.cfg = { ...st };
        ctx.obs.actual = actualOf();
        (ctx.obs.meas ??= {})[key] = v;
        ctx.save();
        renderOut();
    };
    const renderOut = () => {
        const m = ctx.obs.meas ?? {};
        const done = ['Vs', 'V1', 'V2', 'V3'].filter(k => m[k] !== undefined).length;
        out.replaceChildren(
            h('div', { class: 'row' },
                h('button', { type: 'button', class: 'btn', onClick: () => measure('Vs', 'P', 'G') }, 'Measure Vs (P → G)'),
                h('button', { type: 'button', class: 'btn', onClick: () => measure('V1', 'P', 'A') }, 'Measure VR1 (P → A)'),
                h('button', { type: 'button', class: 'btn', onClick: () => measure('V2', 'A', 'G') }, 'Measure VR2 (A → G)'),
                h('button', { type: 'button', class: 'btn', onClick: () => measure('V3', 'A', 'G') }, 'Measure VR3 (A → G)')),
            h('div', { class: 'grid-4' }, ['Vs', 'V1', 'V2', 'V3'].map(k => tile(k === 'Vs' ? 'Vs' : `VR${k[1]}`, m[k] === undefined ? '—' : `${m[k].toFixed(3)} V`))),
            done === 4 ? h('p', { class: 'note note--good' }, `Mesh 1: ${m.Vs.toFixed(3)} − ${m.V1.toFixed(3)} − ${m.V2.toFixed(3)} = ${(m.Vs - m.V1 - m.V2).toFixed(3)} V ≈ 0 ✓   See the Observations tab for the full tables.`) : h('p', { class: 'muted' }, `${done} of 4 measurements recorded.`));
    };
    const pickR = (key) => h('label', { class: 'num-field' }, h('span', {}, key), h('select', { class: 'select', onChange: e => { st[key] = Number(e.target.value); ctx.obs.meas = {}; ctx.save(); draw(); renderOut(); } }, E12.map(v => h('option', { value: v, selected: v === st[key] }, eng(v, 'Ω')))));
    panel.append(
        h('div', { class: 'row inputs-row' },
            h('label', { class: 'num-field' }, h('span', {}, 'Supply Vs'), h('select', { class: 'select', onChange: e => { st.Vs = Number(e.target.value); ctx.obs.meas = {}; ctx.save(); draw(); renderOut(); } }, [5, 9, 10, 12, 15].map(v => h('option', { value: v, selected: v === st.Vs }, `${v} V`)))),
            pickR('R1'), pickR('R2'), pickR('R3')),
        fig, out,
        note('Each resistor has a hidden "actual" value within ±4% of its colour code, and the meter has a tiny reading error, just like real hardware. That is why the loop sums are close to, but not exactly, zero.'));
    draw();
    renderOut();
}
