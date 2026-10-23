// Experiment 1: The Electronics Expedition — components, colour code, breadboard, DMM, function generator and CRO.

import { h, s, table, note } from '../core/ui.js';
import { tile, formula, eng } from '../core/page.js';
import { labPage, seeded } from '../core/lab.js';

export const intro = 'Identify active and passive components, read resistor colour codes, learn the breadboard, and use the power supply, multimeter, function generator and oscilloscope.';

const COLORS = [['black', '#111827'], ['brown', '#7c3f16'], ['red', '#dc2626'], ['orange', '#ea580c'], ['yellow', '#facc15'], ['green', '#16a34a'], ['blue', '#2563eb'], ['violet', '#7c3aed'], ['grey', '#9ca3af'], ['white', '#f9fafb']];
const MULT = [...COLORS.map(([n, c], i) => [n, c, 10 ** i]), ['gold', '#d4af37', 0.1], ['silver', '#c0c0c0', 0.01]];
const TOL = [['brown', '#7c3f16', 1], ['red', '#dc2626', 2], ['gold', '#d4af37', 5], ['silver', '#c0c0c0', 10]];

export function resistorValue(b1, b2, mult) { return (b1 * 10 + b2) * mult; }

function resistorSvg(bands) {
    return s('svg', { viewBox: '0 0 320 90', class: 'res-svg', role: 'img', 'aria-label': 'Resistor' },
        s('line', { x1: 0, y1: 45, x2: 320, y2: 45, stroke: '#94a3b8', 'stroke-width': 5 }),
        s('rect', { x: 70, y: 20, width: 180, height: 50, rx: 22, fill: '#e9d5b5', stroke: '#a16207', 'stroke-width': 1.5 }),
        ...bands.map((c, i) => s('rect', { x: [95, 120, 145, 215][i], y: 20, width: 12, height: 50, fill: c })));
}

const COMPONENTS = [
    ['Resistor', 'Passive', 'Ω (ohm)', 'Limits current, divides voltage. Carbon film, colour-coded.'],
    ['Ceramic capacitor', 'Passive', 'F (farad)', 'Small values (pF–nF), not polarised. Code like 104 = 100 nF.'],
    ['Electrolytic capacitor', 'Passive', 'F', 'Large values (µF), POLARISED: the stripe marks the negative leg.'],
    ['Inductor', 'Passive', 'H (henry)', 'A coil that stores energy in a magnetic field. Used in filters and power supplies.'],
    ['Transformer', 'Passive', '—', 'Steps AC voltage up or down (e.g. 230 V → 12 V for the lab).'],
    ['Diode 1N4007', 'Active*', '—', 'Lets current flow one way. The silver band is the cathode.'],
    ['Zener diode', 'Active*', '—', 'Works in reverse breakdown to hold a fixed voltage (e.g. 5.1 V).'],
    ['LED', 'Active*', '—', 'Lights up when forward biased. The longer leg is the anode (+).'],
    ['BJT BC547', 'Active', '—', 'NPN transistor (TO-92 package). Pins E-B-C with the flat side facing you.'],
    ['IC 555 / 74xx', 'Active', '—', 'Many transistors on one chip. The notch or dot marks pin 1.']
];

export const def = {
        id: 'lab1', num: 1,
        aim: 'To identify, categorise and get familiar with basic active and passive components, the breadboard, input sources (DC power supply, function generator) and measuring instruments (digital multimeter, CRO/DSO).',
        apparatus: [['Passive components', 'Carbon film resistors, ceramic and electrolytic capacitors, inductors, transformer', 'Assorted'], ['Active components', '1N4007 diode, Zener diode, BC547 BJT, 555 timer, 7400-series ICs', 'Assorted'], ['Breadboard / trainer kit', 'Standard 840 points', '1'], ['Regulated DC power supply', '0–30 V', '1'], ['Function generator', '1 Hz – 1 MHz', '1'], ['Digital multimeter', 'Standard', '1'], ['CRO / DSO', 'Dual channel', '1'], ['Connecting wires', 'Single strand', 'As required']],
        theory: [
            h('p', {}, h('b', {}, 'Passive components '), 'cannot add energy to a circuit: resistor (R, Ω), capacitor (C, F, stores energy in an electric field), inductor (L, H, stores energy in a magnetic field). ', h('b', {}, 'Active components '), 'can amplify or switch signals and need a power source: diodes, transistors and ICs.'),
            h('p', {}, h('b', {}, 'Resistor colour code (4-band): '), 'band 1 = first digit, band 2 = second digit, band 3 = multiplier, band 4 = tolerance (gold ±5%, silver ±10%). Memory aid: "BB ROY of Great Britain had a Very Good Wife" (Black 0 … White 9).'),
            h('p', {}, h('b', {}, 'Breadboard: '), 'the long bus strips along the edges carry power (+ and −). In the middle, each group of 5 holes in a column is connected; the central ravine separates the two halves so an IC can straddle it.'),
            h('p', {}, h('b', {}, 'DMM: '), 'voltmeter goes in PARALLEL with the component, ammeter in SERIES with the circuit. ', h('b', {}, 'CRO/DSO: '), 'plots voltage (Y, Volts/div) against time (X, Time/div). Vpp = vertical divisions × Volts/div, T = horizontal divisions × Time/div, f = 1/T.')
        ],
        procedure: ['Part A: choose 5 resistors, read their colour bands, calculate the value, measure it with the DMM in Ω mode and find the % error.', 'Part B: switch on the power supply, set 3.3 V, 5 V and 12 V, and check each with the DMM on DC V (red to +, black to −).', 'Part C: connect the function generator to CH1 of the CRO with a BNC probe. Set a 1 kHz sine, adjust Volts/div and Time/div until 1–2 cycles fill the screen, then measure Vpp and the period. Repeat for square and triangle waves.'],
        precautions: ['Never measure resistance in a powered circuit.', 'Start the power supply at 0 V and set the current limit before connecting.', 'Electrolytic capacitors are polarised: never reverse them.', 'Select the correct DMM range and mode before probing.'],
        bench: (panel, ctx) => bench(panel, ctx),
        observations: (ctx) => {
            const res = ctx.obs.res ?? [];
            const dc = ctx.obs.dc ?? [];
            const cro = ctx.obs.cro ?? [];
            return [
                h('h4', {}, 'Table 1: Resistor colour code verification'),
                res.length ? table(['#', 'Band 1', 'Band 2', 'Band 3', 'Band 4', 'Calculated', 'Measured', '% error'], res.map((r, i) => [String(i + 1), ...r.bands, eng(r.calc, 'Ω'), eng(r.meas, 'Ω'), `${r.err.toFixed(2)}%`])) : h('p', { class: 'muted' }, 'No readings yet: use "Measure and record" on the bench.'),
                h('h4', {}, 'Table 2: DC source verification'),
                dc.length ? table(['#', 'Set on supply (V)', 'Measured on DMM (V)', 'Remark'], dc.map((r, i) => [String(i + 1), r.set.toFixed(2), r.meas.toFixed(3), Math.abs(r.meas - r.set) < 0.05 ? 'Within ±0.05 V: OK' : 'Check supply'])) : h('p', { class: 'muted' }, 'No readings yet.'),
                h('h4', {}, 'Table 3: CRO measurements'),
                cro.length ? table(['#', 'Waveform', 'V/div', 'Vertical div (p-p)', 'Vpp', 'Time/div', 'Horizontal div (1 cycle)', 'Period', 'Frequency'], cro.map((r, i) => [String(i + 1), r.wave, `${r.vdiv} V`, r.vd.toFixed(1), `${r.vpp.toFixed(2)} V`, eng(r.tdiv, 's'), r.hd.toFixed(1), eng(r.T, 's'), eng(1 / r.T, 'Hz')])) : h('p', { class: 'muted' }, 'No readings yet.')
            ];
        },
        result: (ctx) => `Components were identified and classified. ${(ctx.obs.res ?? []).length} resistors were verified against their colour code (all within tolerance), the DC supply outputs were verified with the DMM, and waveform amplitude and frequency were measured on the CRO.`,
        viva: [
            ['What is the difference between active and passive components?', 'Passive components (R, L, C) cannot amplify or add energy. Active components (diodes, transistors, ICs) can control or amplify current and need an external supply to work.'],
            ['What is the value of a resistor with bands red, red, orange, gold?', '22 × 10³ = 22 kΩ with ±5% tolerance.'],
            ['Why is a voltmeter connected in parallel and an ammeter in series?', 'A voltmeter measures the potential difference across a component, so it must share the same two nodes. An ammeter measures the current through a path, so the current must flow through it. That is also why an ideal voltmeter has infinite resistance and an ideal ammeter zero resistance.'],
            ['How do you find the frequency of a signal on a CRO?', 'Count the horizontal divisions for one complete cycle, multiply by Time/div to get the period T, then f = 1/T.'],
            ['Why does a breadboard have a gap in the middle?', 'So a DIP IC can sit across it, with its two rows of pins on separate, unconnected strips.'],
            ['What does the stripe on an electrolytic capacitor mean?', 'It marks the negative terminal. Reversing an electrolytic capacitor can make it overheat or burst.'],
            ['What is the difference between a CRO and a DSO?', 'A CRO draws the signal directly with an electron beam on a CRT. A DSO samples the signal with an ADC, stores it digitally and shows it on an LCD, so it can freeze, measure and save waveforms.'],
            ['What does 104 printed on a ceramic capacitor mean?', '10 × 10⁴ pF = 100,000 pF = 100 nF = 0.1 µF.']
        ]
};

export function render(page, { tab }) {
    return labPage(page, tab, def);
}

function bench(panel, ctx) {
    // components gallery
    const gallery = h('div', { class: 'info-cards' }, COMPONENTS.map(([name, kind, unit, text]) => h('div', { class: 'info-card' }, h('div', { class: 'row' }, h('h4', { style: { margin: 0 } }, name), h('span', { class: `badge ${kind.startsWith('Passive') ? 'badge--info' : 'badge--warn'}` }, kind)), h('p', {}, text), h('span', { class: 'chip' }, `unit: ${unit}`))));

    // colour code
    const st = { b1: 4, b2: 7, m: 2, t: 2 };
    const resBox = h('div');
    const sel = (key, options, label) => h('label', { class: 'num-field' }, h('span', {}, label), h('select', { class: 'select', onChange: e => { st[key] = Number(e.target.value); renderRes(); } }, options.map(([n], i) => h('option', { value: i, selected: st[key] === i }, n))));
    const renderRes = () => {
        const calc = resistorValue(st.b1, st.b2, MULT[st.m][2]);
        const tol = TOL[st.t][2];
        const rnd = seeded(st.b1 * 1000 + st.b2 * 100 + st.m * 10 + st.t + 7);
        const meas = calc * (1 + ((rnd() * 2 - 1) * tol * 0.7) / 100);
        const err = (Math.abs(meas - calc) / calc) * 100;
        resBox.replaceChildren(resistorSvg([COLORS[st.b1][1], COLORS[st.b2][1], MULT[st.m][1], TOL[st.t][1]]),
            h('div', { class: 'grid-4' }, tile('Calculated value', eng(calc, 'Ω')), tile('Tolerance', `±${tol}%`, `${eng(calc * (1 - tol / 100), 'Ω')} – ${eng(calc * (1 + tol / 100), 'Ω')}`), tile('DMM reading (Ω mode)', eng(meas, 'Ω')), tile('% error', `${err.toFixed(2)}%`, err <= tol ? 'within tolerance ✓' : 'out of tolerance')),
            h('button', { type: 'button', class: 'btn', onClick: () => { (ctx.obs.res ??= []).push({ bands: [COLORS[st.b1][0], COLORS[st.b2][0], MULT[st.m][0], TOL[st.t][0]], calc, meas, err }); ctx.save(); flash(resBox, `Recorded in Table 1 (${ctx.obs.res.length} readings).`); } }, 'Measure and record'));
    };

    // breadboard
    const bb = breadboard();

    // DC supply + DMM
    const dcState = { set: 5 };
    const dcBox = h('div');
    const renderDc = () => {
        const rnd = seeded(Math.round(dcState.set * 100) + 3);
        const meas = dcState.set + (rnd() - 0.5) * 0.04;
        dcBox.replaceChildren(h('div', { class: 'instruments' },
            h('div', { class: 'rps' }, h('small', {}, 'REGULATED DC SUPPLY 0–30 V'), h('div', { class: 'lcd' }, `${dcState.set.toFixed(1)} V`), h('input', { type: 'range', min: 0, max: 30, step: 0.1, value: dcState.set, 'aria-label': 'Supply voltage', onInput: e => { dcState.set = Number(e.target.value); renderDc(); } }), h('div', { class: 'row' }, [3.3, 5, 12].map(v => h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: () => { dcState.set = v; renderDc(); } }, `${v} V`)))),
            h('div', { class: 'dmm' }, h('small', {}, 'DIGITAL MULTIMETER · DC V'), h('div', { class: 'lcd lcd--dmm' }, meas.toFixed(3)), h('small', {}, 'red → +, black → −'))),
            h('button', { type: 'button', class: 'btn', onClick: () => { (ctx.obs.dc ??= []).push({ set: dcState.set, meas }); ctx.save(); flash(dcBox, 'Recorded in Table 2.'); } }, 'Record reading'));
    };

    // function generator + CRO
    const sc = { wave: 'sine', f: 1000, vpp: 4, vdiv: 1, tdiv: 0.0002 };
    const canvas = h('canvas', { width: 520, height: 416, class: 'cro-screen', 'aria-label': 'Oscilloscope screen' });
    const croInfo = h('div');
    const drawCro = () => {
        const ctx2 = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        ctx2.fillStyle = '#04140c';
        ctx2.fillRect(0, 0, W, H);
        ctx2.strokeStyle = '#1a4d33';
        ctx2.lineWidth = 1;
        for (let i = 0; i <= 10; i++) { ctx2.beginPath(); ctx2.moveTo((i * W) / 10, 0); ctx2.lineTo((i * W) / 10, H); ctx2.stroke(); }
        for (let i = 0; i <= 8; i++) { ctx2.beginPath(); ctx2.moveTo(0, (i * H) / 8); ctx2.lineTo(W, (i * H) / 8); ctx2.stroke(); }
        ctx2.strokeStyle = '#2f7a55';
        ctx2.beginPath(); ctx2.moveTo(W / 2, 0); ctx2.lineTo(W / 2, H); ctx2.moveTo(0, H / 2); ctx2.lineTo(W, H / 2); ctx2.stroke();
        ctx2.strokeStyle = '#4ade80';
        ctx2.lineWidth = 2.2;
        ctx2.shadowColor = '#4ade80';
        ctx2.shadowBlur = 8;
        ctx2.beginPath();
        const span = sc.tdiv * 10;
        for (let x = 0; x <= W; x++) {
            const t = (x / W) * span;
            const ph = (t * sc.f) % 1;
            const A = sc.vpp / 2;
            const v = sc.wave === 'sine' ? A * Math.sin(2 * Math.PI * ph) : sc.wave === 'square' ? (ph < 0.5 ? A : -A) : A * (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph);
            const y = H / 2 - (v / sc.vdiv) * (H / 8);
            x ? ctx2.lineTo(x, Math.max(-5, Math.min(H + 5, y))) : ctx2.moveTo(x, y);
        }
        ctx2.stroke();
        ctx2.shadowBlur = 0;
        const vd = sc.vpp / sc.vdiv;
        const hd = 1 / sc.f / sc.tdiv;
        croInfo.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Vertical divisions (peak to peak)', vd.toFixed(1), vd > 8 ? 'off screen: increase V/div' : ''), tile('Vpp = div × V/div', `${(vd * sc.vdiv).toFixed(2)} V`), tile('Horizontal divisions per cycle', hd.toFixed(1), hd > 10 ? 'less than one cycle visible: increase Time/div' : hd < 1 ? 'too many cycles: decrease Time/div' : ''), tile('f = 1 / (div × T/div)', eng(1 / (hd * sc.tdiv), 'Hz'))),
            h('button', { type: 'button', class: 'btn', onClick: () => { (ctx.obs.cro ??= []).push({ wave: sc.wave, vdiv: sc.vdiv, vd, vpp: vd * sc.vdiv, tdiv: sc.tdiv, hd, T: hd * sc.tdiv }); ctx.save(); flash(croInfo, 'Recorded in Table 3.'); } }, 'Record CRO reading'));
    };
    const croCtl = h('div', { class: 'cro-controls' },
        h('div', { class: 'fg' }, h('small', {}, 'FUNCTION GENERATOR'),
            h('div', { class: 'seg' }, ['sine', 'square', 'triangle'].map(w => h('button', { type: 'button', 'aria-pressed': sc.wave === w, onClick: (e) => { sc.wave = w; e.target.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === e.target)); drawCro(); } }, w))),
            h('label', { class: 'num-field' }, h('span', {}, 'Frequency'), h('select', { class: 'select', onChange: e => { sc.f = Number(e.target.value); drawCro(); } }, [50, 100, 500, 1000, 2000, 5000, 10000, 100000].map(f => h('option', { value: f, selected: f === sc.f }, eng(f, 'Hz'))))),
            h('label', { class: 'num-field' }, h('span', {}, 'Amplitude (Vpp)'), h('input', { type: 'range', min: 0.5, max: 20, step: 0.5, value: sc.vpp, onInput: e => { sc.vpp = Number(e.target.value); drawCro(); } }))),
        h('div', { class: 'fg' }, h('small', {}, 'CRO CONTROLS'),
            h('label', { class: 'num-field' }, h('span', {}, 'CH1 Volts/div'), h('select', { class: 'select', onChange: e => { sc.vdiv = Number(e.target.value); drawCro(); } }, [0.2, 0.5, 1, 2, 5].map(v => h('option', { value: v, selected: v === sc.vdiv }, `${v} V`)))),
            h('label', { class: 'num-field' }, h('span', {}, 'Time/div'), h('select', { class: 'select', onChange: e => { sc.tdiv = Number(e.target.value); drawCro(); } }, [0.00001, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01].map(v => h('option', { value: v, selected: v === sc.tdiv }, eng(v, 's'))))),
            h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { sc.vdiv = [0.2, 0.5, 1, 2, 5].find(v => sc.vpp / v <= 6) ?? 5; sc.tdiv = [0.00001, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01].find(v => 1 / sc.f / v <= 5) ?? 0.01; render(); } }, 'Autoset')));
    // keep the knobs in sync after Autoset
    const render = () => {
        const [, vdivSel, tdivSel] = croCtl.querySelectorAll('select');
        vdivSel.value = String(sc.vdiv);
        tdivSel.value = String(sc.tdiv);
        drawCro();
    };

    panel.append(
        h('h4', {}, 'Step 1 · Know your components'), gallery,
        h('h4', {}, 'Step 2 · Resistor colour code (Part A)'), h('div', { class: 'row inputs-row' }, sel('b1', COLORS, 'Band 1 (digit)'), sel('b2', COLORS, 'Band 2 (digit)'), sel('m', MULT, 'Band 3 (multiplier)'), sel('t', TOL, 'Band 4 (tolerance)')), resBox,
        h('h4', {}, 'Step 3 · The breadboard'), bb,
        h('h4', {}, 'Step 4 · DC power supply and multimeter (Part B)'), dcBox,
        h('h4', {}, 'Step 5 · Function generator and CRO (Part C)'), h('div', { class: 'cro-wrap' }, canvas, croCtl), croInfo);
    renderRes();
    renderDc();
    drawCro();
}

function flash(container, text) {
    const el = h('p', { class: 'note note--good flash' }, `✓ ${text}`);
    container.append(el);
    setTimeout(() => el.remove(), 2200);
}

function breadboard() {
    const COLS = 30;
    const info = h('p', { class: 'muted' }, 'Click any hole to see which other holes it is connected to.');
    const holes = [];
    const svg = s('svg', { viewBox: `0 0 ${COLS * 20 + 60} 300`, class: 'bb', role: 'img', 'aria-label': 'Breadboard' },
        s('rect', { x: 0, y: 0, width: COLS * 20 + 60, height: 300, rx: 10, class: 'bb-body' }),
        s('rect', { x: 30, y: 138, width: COLS * 20, height: 24, class: 'bb-ravine' }),
        s('line', { x1: 30, y1: 12, x2: COLS * 20 + 30, y2: 12, class: 'bb-rail bb-rail--red' }), s('line', { x1: 30, y1: 288, x2: COLS * 20 + 30, y2: 288, class: 'bb-rail bb-rail--blue' }));
    const select = (gid, label) => {
        holes.forEach(hh => hh.el.classList.toggle('is-linked', hh.g === gid));
        info.textContent = label;
    };
    const add = (x, y, g, label) => {
        const el = s('circle', { cx: x, cy: y, r: 4.2, class: 'bb-hole', tabindex: -1 });
        el.addEventListener('click', () => select(g, label));
        holes.push({ el, g });
        svg.append(el);
    };
    for (let c = 0; c < COLS; c++) {
        const x = 40 + c * 20;
        ['a', 'b', 'c', 'd', 'e'].forEach((r, i) => add(x, 40 + i * 20, `top${c}`, `Column ${c + 1}, rows a–e: these 5 holes are connected together.`));
        ['f', 'g', 'h', 'i', 'j'].forEach((r, i) => add(x, 180 + i * 20, `bot${c}`, `Column ${c + 1}, rows f–j: connected together, but NOT to a–e across the ravine.`));
        if (c % 6 !== 5) { add(x, 22, 'plus', 'Top power rail: the whole row is connected. Usually +5 V.'); add(x, 278, 'minus', 'Bottom power rail: the whole row is connected. Usually GND.'); }
    }
    ['a', 'b', 'c', 'd', 'e'].forEach((r, i) => svg.append(s('text', { x: 16, y: 44 + i * 20, class: 'bb-label' }, r)));
    ['f', 'g', 'h', 'i', 'j'].forEach((r, i) => svg.append(s('text', { x: 16, y: 184 + i * 20, class: 'bb-label' }, r)));
    // a DIP IC straddling the ravine
    svg.append(s('rect', { x: 316, y: 108, width: 144, height: 84, rx: 4, class: 'bb-ic' }), s('circle', { cx: 324, cy: 150, r: 5, fill: '#475569' }), s('text', { x: 388, y: 155, 'text-anchor': 'middle', class: 'bb-ic-text' }, 'IC 7400'));
    select('top12', 'Column 13, rows a–e: these 5 holes are connected together.');
    return h('div', {}, h('div', { class: 'svg-box' }, svg), info, note('The IC straddles the ravine so each of its pins lands on its own column of five holes, and nothing is shorted.'));
}
