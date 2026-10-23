// Experiment 3: Diode Voltage Quest — forward and reverse V-I characteristics of a 1N4007.

import { h, s, table, note } from '../core/ui.js';
import { tile, formula, eng } from '../core/page.js';
import { plot } from '../core/plot.js';
import { labPage } from '../core/lab.js';
import { wire, label, resistor, vsource, diode, svgBox } from '../core/draw.js';

export const intro = 'Plot the V-I characteristic of a silicon diode in forward and reverse bias, find the knee voltage, and calculate static and dynamic resistance.';

const IS = 5e-9;
const N = 1.9;
const VT = 0.02585;
const R = 100;

// 1N4007 model: operating point for a source Vs through R (forward), or leakage (reverse)
export function diodeReading(Vs, reverse) {
    if (reverse) {
        const I = (0.005 * (1 - Math.exp(-Vs)) + 0.0016 * Vs) * 1e-6; // nA–µA leakage
        return { Vd: Math.max(0, Vs - I * R), I };
    }
    let lo = 0;
    let hi = Math.max(0, Vs);
    for (let k = 0; k < 80; k++) {
        const mid = (lo + hi) / 2;
        if (mid + IS * (Math.exp(mid / (N * VT)) - 1) * R > Vs) hi = mid; else lo = mid;
    }
    const Vd = (lo + hi) / 2;
    return { Vd, I: (Vs - Vd) / R };
}

function analyse(fwd) {
    const pts = [...fwd].sort((a, b) => a.Vd - b.Vd);
    let knee = null;
    for (let i = 1; i < pts.length; i++) {
        if (pts[i - 1].I < 1e-3 && pts[i].I >= 1e-3) {
            const f = (1e-3 - pts[i - 1].I) / (pts[i].I - pts[i - 1].I);
            knee = pts[i - 1].Vd + f * (pts[i].Vd - pts[i - 1].Vd);
        }
    }
    const lin = pts.filter(p => p.I > 5e-3);
    let rs = null;
    let rd = null;
    if (lin.length >= 2) {
        const a = lin[lin.length - 2];
        const b = lin[lin.length - 1];
        rs = b.Vd / b.I;
        rd = (b.Vd - a.Vd) / (b.I - a.I);
    }
    return { knee, rs, rd };
}

export const def = {
    id: 'lab3', num: 3,
    aim: 'To study the V-I characteristics of a silicon PN junction diode in forward and reverse bias, determine its cut-in (knee) voltage, and calculate its static and dynamic resistance.',
    apparatus: [['PN junction diode', '1N4007', '1'], ['Current-limiting resistor', '100 Ω, ¼ W', '1'], ['Regulated power supply', '0–30 V DC, variable', '1'], ['DC voltmeter (or DMM)', '0–2 V / 0–20 V', '1'], ['DC ammeter (or DMM)', '0–200 mA (forward), 0–200 µA (reverse)', '1'], ['Breadboard and wires', 'Standard', '1']],
    theory: [
        h('p', {}, h('b', {}, 'Forward bias: '), 'the anode (P side) is made positive with respect to the cathode. The depletion region narrows, and once the applied voltage passes the cut-in voltage (≈ 0.7 V for silicon, 0.3 V for germanium), current rises steeply.'),
        h('p', {}, h('b', {}, 'Reverse bias: '), 'the depletion region widens and only a tiny reverse saturation current (nA–µA) flows due to minority carriers, until breakdown.'),
        formula('Shockley equation: I = Is (e^(V/ηVT) − 1)'),
        formula('Static resistance R_DC = V / I      Dynamic resistance r_ac = ΔV / ΔI')
    ],
    procedure: ['Build the forward-bias circuit: supply → 100 Ω resistor → diode (anode first) → back to the supply. Voltmeter across the diode, milliammeter in series.', 'Set the supply to 0 V and increase it in small steps (0.1 V up to 0.8 V, then 0.5 V steps). Record the diode voltage and current at each step.', 'Switch off, reverse the diode, change the ammeter to the µA range.', 'Increase the reverse voltage in 2 V steps up to 20 V and record the voltage and leakage current.', 'Plot V (x-axis) against I (y-axis): forward in quadrant I (mA), reverse in quadrant III (µA).', 'Find the knee voltage, then calculate static and dynamic resistance in the linear part of the curve.'],
    precautions: ['Never exceed the diode\'s maximum forward current (1 A for 1N4007).', 'Always keep the series resistor in the circuit.', 'Switch the ammeter to the µA range for reverse bias.'],
    bench: (panel, ctx) => bench(panel, ctx),
    observations: (ctx) => {
        const fwd = ctx.obs.fwd ?? [];
        const rev = ctx.obs.rev ?? [];
        const a = analyse(fwd);
        return [
            h('h4', {}, 'Table 1: Forward bias (1N4007)'),
            fwd.length ? table(['#', 'Source voltage (V)', 'Diode voltage (V)', 'Diode current (mA)'], fwd.map((r, i) => [String(i + 1), r.Vs.toFixed(2), r.Vd.toFixed(3), (r.I * 1000).toFixed(3)])) : h('p', { class: 'muted' }, 'No forward readings yet.'),
            h('h4', {}, 'Table 2: Reverse bias'),
            rev.length ? table(['#', 'Source voltage (V)', 'Diode voltage (V)', 'Reverse current (µA)'], rev.map((r, i) => [String(i + 1), r.Vs.toFixed(1), r.Vd.toFixed(2), (r.I * 1e6).toFixed(3)])) : h('p', { class: 'muted' }, 'No reverse readings yet.'),
            fwd.length || rev.length ? h('div', {}, h('h4', {}, 'Graph'), viGraph(fwd, rev)) : '',
            h('h4', {}, 'Calculations'),
            h('div', { class: 'grid-3' }, tile('Knee voltage', a.knee ? `${a.knee.toFixed(3)} V` : 'need readings around 0.6 V'), tile('Static resistance R_DC', a.rs ? eng(a.rs, 'Ω') : '—', 'V/I at the last point'), tile('Dynamic resistance r_ac', a.rd ? eng(a.rd, 'Ω') : '—', 'ΔV/ΔI of the last two points'))
        ];
    },
    result: (ctx) => {
        const a = analyse(ctx.obs.fwd ?? []);
        return a.knee ? `The V-I characteristic of the silicon diode 1N4007 was plotted. Knee voltage ≈ ${a.knee.toFixed(2)} V${a.rs ? `, static resistance ≈ ${eng(a.rs, 'Ω')}, dynamic resistance ≈ ${eng(a.rd, 'Ω')}` : ''}. In reverse bias only a very small leakage current (µA) flows.` : 'Record forward readings from 0 V up to at least 1 V to obtain the result.';
    },
    viva: [
        ['What is the cut-in (knee) voltage of a silicon diode?', 'About 0.6–0.7 V. For germanium it is about 0.2–0.3 V.'],
        ['Why is a series resistor used?', 'To limit the forward current. Above the knee a tiny voltage increase causes a huge current increase, which would destroy the diode.'],
        ['Why is dynamic resistance smaller than static resistance?', 'Because the curve is steep above the knee: a small ΔV gives a large ΔI. Dynamic resistance is the slope at a point, static resistance is V/I from the origin.'],
        ['What causes reverse saturation current?', 'Minority carriers (holes in N, electrons in P) that are swept across the junction by the reverse field. It doubles roughly every 10 °C.'],
        ['What happens at breakdown?', 'The reverse current increases sharply due to avalanche (high voltage) or Zener (heavily doped) breakdown. A normal diode is damaged; a Zener diode is designed to work there.'],
        ['Why do we use a µA meter in reverse bias?', 'Because the reverse current is so small (nA–µA) that a mA meter would read 0.']
    ]
};

function viGraph(fwd, rev) {
    const model = [];
    for (let k = 0; k <= 120; k++) { const r = diodeReading((k / 120) * 6, false); model.push([r.Vd, r.I * 1000]); }
    const pf = fwd.map(r => [r.Vd, r.I * 1000]).sort((a, b) => a[0] - b[0]);
    const pr = rev.map(r => [-r.Vd, -r.I * 1e9]).sort((a, b) => a[0] - b[0]);
    const forward = plot({ height: 280, x: { min: 0, max: 1, label: 'Forward voltage (V)', format: v => v.toFixed(1) }, y: { min: 0, max: 60, label: 'Forward current (mA)' },
        series: [{ points: model.filter(p => p[1] <= 60), color: '#cbd5e1', label: 'model', width: 1.5, labelPos: 0.2 }, { points: pf, color: '#0e7490', label: 'readings' }],
        markers: pf.filter(p => p[1] <= 60).map(p => ({ x: p[0], y: p[1], r: 3.5, color: '#0e7490' })), vlines: [{ x: 0.7, label: '≈ 0.7 V knee', color: '#b45309' }] });
    const reverse = plot({ height: 280, x: { min: -21, max: 0, label: 'Reverse voltage (V)' }, y: { min: -50, max: 0, label: 'Reverse current (nA)', format: v => v.toFixed(0) },
        series: [{ points: pr, color: '#dc2626', label: 'readings' }], markers: pr.map(p => ({ x: p[0], y: p[1], r: 3.5, color: '#dc2626' })) });
    return h('div', { class: 'grid-2' }, h('div', {}, h('small', { class: 'muted' }, 'Quadrant I: forward bias (mA)'), forward), h('div', {}, h('small', { class: 'muted' }, 'Quadrant III: reverse bias (nA)'), reverse));
}

function bench(panel, ctx) {
    const st = { Vs: 0.6, reverse: false };
    const fig = h('div', { class: 'svg-box' });
    const meters = h('div');
    const graph = h('div');
    const render = () => {
        const r = diodeReading(st.Vs, st.reverse);
        fig.replaceChildren(svgBox(560, 230, vsource(60, 50, 190, 'RPS', { valueText: `${st.Vs.toFixed(2)} V` }), wire([60, 50], [110, 50]),
            s('circle', { cx: 140, cy: 50, r: 18, class: 'c-body' }), label(140, 55, 'mA', 'c-name'), wire([158, 50], [190, 50]),
            resistor(190, 50, 290, 50, 'R', { valueText: '100 Ω' }), wire([290, 50], [380, 50]),
            st.reverse ? diode(380, 190, 380, 50, '') : diode(380, 50, 380, 190, ''), label(325, 124, '1N4007', 'c-name'),
            wire([380, 190], [60, 190]), wire([380, 50], [470, 50], [470, 100]), s('circle', { cx: 470, cy: 120, r: 18, class: 'c-body' }), label(470, 125, 'V', 'c-name'), wire([470, 138], [470, 190], [380, 190]),
            label(300, 222, st.reverse ? 'Reverse bias: cathode to +' : 'Forward bias: anode to +', 'c-current')));
        meters.replaceChildren(h('div', { class: 'instruments' },
            h('div', { class: 'dmm' }, h('small', {}, 'VOLTMETER (across diode)'), h('div', { class: 'lcd lcd--dmm' }, `${r.Vd.toFixed(3)} V`)),
            h('div', { class: 'dmm' }, h('small', {}, st.reverse ? 'AMMETER (µA range)' : 'AMMETER (mA range)'), h('div', { class: 'lcd lcd--dmm' }, st.reverse ? `${(r.I * 1e6).toFixed(3)} µA` : `${(r.I * 1000).toFixed(3)} mA`))),
            h('div', { class: 'row' },
                h('button', { type: 'button', class: 'btn', onClick: () => { (st.reverse ? (ctx.obs.rev ??= []) : (ctx.obs.fwd ??= [])).push({ Vs: st.Vs, Vd: r.Vd, I: r.I }); ctx.save(); renderGraph(); } }, `Record reading in ${st.reverse ? 'Table 2' : 'Table 1'}`),
                h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { const steps = st.reverse ? [0, 2, 5, 10, 15, 20] : [0, 0.2, 0.4, 0.5, 0.6, 0.65, 0.7, 0.75, 1, 2, 3, 5]; const list = st.reverse ? (ctx.obs.rev = []) : (ctx.obs.fwd = []); steps.forEach(v => { const rr = diodeReading(v, st.reverse); list.push({ Vs: v, Vd: rr.Vd, I: rr.I }); }); ctx.save(); renderGraph(); } }, 'Take the full set of readings')));
    };
    const renderGraph = () => graph.replaceChildren(viGraph(ctx.obs.fwd ?? [], ctx.obs.rev ?? []), h('p', { class: 'muted' }, `${(ctx.obs.fwd ?? []).length} forward and ${(ctx.obs.rev ?? []).length} reverse readings recorded.`));
    const slider = h('input', { type: 'range', min: 0, max: 6, step: 0.01, value: st.Vs, 'aria-label': 'Supply voltage' });
    const seg = h('div', { class: 'seg' }, [['fwd', 'Forward bias'], ['rev', 'Reverse bias']].map(([id, l]) => h('button', { type: 'button', 'aria-pressed': String(id === 'fwd'), onClick: (e) => { st.reverse = id === 'rev'; slider.max = st.reverse ? 20 : 6; slider.step = st.reverse ? 0.5 : 0.01; st.Vs = 0; slider.value = 0; seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === e.target)); render(); } }, l)));
    slider.addEventListener('input', () => { st.Vs = Number(slider.value); render(); });
    panel.append(h('div', { class: 'row inputs-row' }, seg, h('label', { class: 'slider-field' }, h('span', {}, 'Supply voltage (RPS knob)'), slider)), fig, meters, h('h4', {}, 'Your V-I graph (updates as you record)'), graph,
        note('Go slowly between 0.5 V and 0.8 V on the supply: that is where the knee is and where the current starts to rise sharply.'));
    render();
    renderGraph();
}

export function render(page, { tab }) {
    return labPage(page, tab, def);
}
