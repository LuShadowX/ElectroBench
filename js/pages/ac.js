// AC circuits: waveform values, phasors and impedance, RL/RC/RLC series, resonance, power, three-phase.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, num, slider, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';

export const intro = 'Alternating current changes direction many times a second. Here you can see what RMS really means, how phase shifts appear in R, L and C, and why three-phase supply is used for power.';

const TAU = 2 * Math.PI;
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

/* ---------- phasor diagram ---------- */
function phasorDiagram(vectors, size = 260) {
    const c = size / 2;
    const max = Math.max(...vectors.map(v => v.mag), 1e-12);
    const scale = (c - 30) / max;
    const els = [s('circle', { cx: c, cy: c, r: c - 30, class: 'ph-ring' }), s('line', { x1: 10, y1: c, x2: size - 10, y2: c, class: 'ph-axis' }), s('line', { x1: c, y1: 10, x2: c, y2: size - 10, class: 'ph-axis' })];
    vectors.forEach(v => {
        const x = c + Math.cos(v.angle) * v.mag * scale;
        const y = c - Math.sin(v.angle) * v.mag * scale;
        const ang = Math.atan2(c - y, x - c);
        const ah = 9;
        const p1 = [x - ah * Math.cos(ang - 0.4), y + ah * Math.sin(ang - 0.4)];
        const p2 = [x - ah * Math.cos(ang + 0.4), y + ah * Math.sin(ang + 0.4)];
        els.push(s('line', { x1: c, y1: c, x2: x, y2: y, stroke: v.color, class: 'ph-vec' }),
            s('path', { d: `M${x} ${y} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z`, fill: v.color }),
            s('text', { x: x + (x >= c ? 6 : -6), y: y + (y <= c ? -6 : 14), fill: v.color, class: 'ph-label', 'text-anchor': x >= c ? 'start' : 'end' }, v.label));
    });
    return s('svg', { viewBox: `0 0 ${size} ${size}`, class: 'phasor', role: 'img', 'aria-label': 'Phasor diagram' }, ...els);
}

/* ---------- waveform basics ---------- */
function waveform(panel) {
    const st = { Vm: 325, f: 50, phi: -30 };
    const out = h('div');
    const render = () => {
        const { Vm, f, phi } = st;
        const T = 1 / f;
        const vPts = [];
        const iPts = [];
        for (let k = 0; k <= 400; k++) {
            const t = (k / 400) * 2 * T;
            vPts.push([t * 1000, Vm * Math.sin(TAU * f * t)]);
            iPts.push([t * 1000, Vm * 0.6 * Math.sin(TAU * f * t + rad(phi))]);
        }
        const Vrms = Vm / Math.SQRT2;
        const Vavg = (2 * Vm) / Math.PI;
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Peak (amplitude) Vm', eng(Vm, 'V')), tile('RMS value', eng(Vrms, 'V'), 'Vm / √2 = 0.707 Vm'), tile('Average (half cycle)', eng(Vavg, 'V'), '2Vm / π = 0.637 Vm'), tile('Period T', eng(T, 's'), `T = 1/f, ω = ${(TAU * f).toFixed(1)} rad/s`)),
            h('div', { class: 'grid-4' }, tile('Peak-to-peak', eng(2 * Vm, 'V')), tile('Form factor', (Vrms / Vavg).toFixed(3), 'RMS / average = 1.11'), tile('Peak factor', (Vm / Vrms).toFixed(3), 'peak / RMS = 1.414'), tile('Phase difference', `${Math.abs(phi)}°`, phi < 0 ? 'current LAGS voltage' : phi > 0 ? 'current LEADS voltage' : 'in phase')),
            plot({ x: { min: 0, max: 2 * T * 1000, label: 'Time (ms)', unit: ' ms' }, y: { min: -Vm * 1.1, max: Vm * 1.1, label: 'Instantaneous value', unit: '' }, series: [{ points: vPts, label: 'v(t)', color: '#0e7490' }, { points: iPts, label: 'i(t) (scaled)', color: '#f59e0b' }], hlines: [{ y: Vrms, label: 'Vrms', color: '#7c3aed' }] }),
            formula(`v(t) = Vm sin(ωt) = ${Vm} sin(${(TAU * f).toFixed(1)} t)       i(t) = Im sin(ωt ${phi >= 0 ? '+' : '−'} ${Math.abs(phi)}°)`));
    };
    panel.append(head('AC waveform and its values', 'Indian mains: 230 V RMS, 50 Hz, so the peak is 230 × √2 ≈ 325 V. Lowercase v, i mean instantaneous values. Capital V, I mean RMS values or phasors.'),
        h('div', { class: 'row inputs-row' },
            slider('Peak voltage Vm', st.Vm, { min: 10, max: 400, unit: ' V', onInput: v => { st.Vm = v; render(); } }).el,
            slider('Frequency f', st.f, { min: 10, max: 200, unit: ' Hz', onInput: v => { st.f = v; render(); } }).el,
            slider('Phase of current φ', st.phi, { min: -90, max: 90, unit: '°', onInput: v => { st.phi = v; render(); } }).el),
        out);
    render();
}

/* ---------- series RL / RC / RLC ---------- */
export function seriesAC({ type, R, L, C, V, f }) {
    const w = TAU * f;
    const XL = type.includes('L') ? w * L : 0;
    const XC = type.includes('C') ? 1 / (w * C) : 0;
    const X = XL - XC;
    const Z = Math.hypot(R, X);
    const theta = Math.atan2(X, R);
    const I = V / Z;
    return { XL, XC, X, Z, theta, I, VR: I * R, VL: I * XL, VC: I * XC, pf: Math.cos(theta), P: V * I * Math.cos(theta), Q: V * I * Math.sin(theta), S: V * I };
}

function seriesCircuits(panel) {
    const st = { type: 'RLC', R: 50, L: 0.2, C: 50e-6, V: 230, f: 50 };
    const seg = h('div', { class: 'seg' }, ['RL', 'RC', 'RLC'].map(t => h('button', { type: 'button', dataset: { t }, onClick: () => { st.type = t; render(); } }, `Series ${t}`)));
    const inputs = h('div', { class: 'row inputs-row' },
        num('R', st.R, { unit: 'Ω', min: 0.001, onInput: v => { if (!Number.isNaN(v)) { st.R = v; render(); } } }).el,
        num('L', st.L, { unit: 'H', min: 0, onInput: v => { if (!Number.isNaN(v)) { st.L = v; render(); } } }).el,
        num('C (µF)', st.C * 1e6, { unit: 'µF', min: 0.0001, onInput: v => { if (!Number.isNaN(v)) { st.C = v * 1e-6; render(); } } }).el,
        num('V (RMS)', st.V, { unit: 'V', min: 0, onInput: v => { if (!Number.isNaN(v)) { st.V = v; render(); } } }).el,
        num('f', st.f, { unit: 'Hz', min: 0.1, onInput: v => { if (!Number.isNaN(v)) { st.f = v; render(); } } }).el);
    const out = h('div');
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.t === st.type));
        const r = seriesAC(st);
        const nature = Math.abs(r.X) < 1e-9 ? 'purely resistive (at resonance)' : r.X > 0 ? 'inductive: current lags voltage' : 'capacitive: current leads voltage';
        const vecs = [
            { mag: r.VR, angle: 0, label: `VR ${eng(r.VR, 'V')}`, color: '#0e7490' },
            { mag: st.V, angle: r.theta, label: `V ${eng(st.V, 'V')}`, color: '#0f172a' },
            // current is the reference (0°); its length is just scaled to be visible
            { mag: Math.max(st.V, r.VL, r.VC) * 0.45, angle: 0, label: `I ${eng(r.I, 'A')}`, color: '#f59e0b' }
        ];
        if (r.VL) vecs.push({ mag: r.VL, angle: Math.PI / 2, label: `VL ${eng(r.VL, 'V')}`, color: '#7c3aed' });
        if (r.VC) vecs.push({ mag: r.VC, angle: -Math.PI / 2, label: `VC ${eng(r.VC, 'V')}`, color: '#16a34a' });
        const tri = s('svg', { viewBox: '0 0 260 200', class: 'phasor', role: 'img', 'aria-label': 'Power triangle' },
            s('polygon', { points: `30,${r.Q >= 0 ? 160 : 40} 230,${r.Q >= 0 ? 160 : 40} 230,${r.Q >= 0 ? 160 - 120 * Math.min(1, Math.abs(Math.tan(r.theta))) : 40 + 120 * Math.min(1, Math.abs(Math.tan(r.theta)))}`, class: 'pt-tri' }),
            s('text', { x: 130, y: r.Q >= 0 ? 180 : 30, 'text-anchor': 'middle', class: 'ph-label' }, `P = ${eng(r.P, 'W')}`),
            s('text', { x: 236, y: 100, class: 'ph-label' }, `Q = ${eng(Math.abs(r.Q), 'VAR')}`),
            s('text', { x: 110, y: r.Q >= 0 ? 95 : 105, class: 'ph-label', 'text-anchor': 'end' }, `S = ${eng(r.S, 'VA')}`));
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('XL = 2πfL', eng(r.XL, 'Ω')), tile('XC = 1/(2πfC)', eng(r.XC, 'Ω')), tile('Impedance |Z|', eng(r.Z, 'Ω'), `Z = ${r.Z ? `${st.R} ${r.X >= 0 ? '+' : '−'} j${Math.abs(r.X).toFixed(2)}` : ''} Ω`), tile('Phase angle θ', `${deg(r.theta).toFixed(2)}°`, nature)),
            h('div', { class: 'grid-4' }, tile('Current I = V/Z', eng(r.I, 'A')), tile('Power factor cos θ', r.pf.toFixed(3), r.X > 0 ? 'lagging' : r.X < 0 ? 'leading' : 'unity')),
            h('div', { class: 'grid-3' },
                h('div', { class: 'card' }, h('h3', {}, 'Phasor diagram'), phasorDiagram(vecs)),
                h('div', { class: 'card' }, h('h3', {}, 'Power triangle'), tri, formula(`P = VI cos θ    Q = VI sin θ    S = VI`)),
                h('div', { class: 'card' }, h('h3', {}, 'Voltages'), table(['Across', 'Voltage'], [['R', eng(r.VR, 'V')], ['L', eng(r.VL, 'V')], ['C', eng(r.VC, 'V')], ['Supply', eng(st.V, 'V')]]),
                    h('p', { class: 'muted' }, 'VL and VC can each exceed the supply! They are 180° apart, so they partly cancel: V = √(VR² + (VL − VC)²).'))));
    };
    panel.append(head('Series RL, RC and RLC circuits', 'Steady-state analysis using complex impedance Z = R + j(XL − XC).'), seg, inputs, out);
    render();
}

/* ---------- resonance ---------- */
function resonance(panel) {
    const st = { R: 20, L: 0.1, C: 10e-6, V: 10 };
    const out = h('div');
    const render = () => {
        const f0 = 1 / (TAU * Math.sqrt(st.L * st.C));
        const Q = (1 / st.R) * Math.sqrt(st.L / st.C);
        const bw = f0 / Q;
        const pts = [];
        for (let k = 0; k <= 300; k++) {
            const f = f0 * 10 ** (-1 + (2 * k) / 300);
            const r = seriesAC({ type: 'RLC', R: st.R, L: st.L, C: st.C, V: st.V, f });
            pts.push([f, r.I]);
        }
        const Imax = st.V / st.R;
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Resonant frequency f0', eng(f0, 'Hz'), 'f0 = 1 / (2π√(LC))'), tile('Current at resonance', eng(Imax, 'A'), 'Z = R (minimum)'), tile('Quality factor Q', Q.toFixed(2), 'Q = (1/R)√(L/C)'), tile('Bandwidth', eng(bw, 'Hz'), 'BW = f0 / Q')),
            plot({ x: { min: f0 / 10, max: f0 * 10, log: true, label: 'Frequency (Hz, log scale)', unit: ' Hz' }, y: { min: 0, max: Imax * 1.12, label: 'Current (A)', unit: 'A' }, series: [{ points: pts, label: 'I(f)', color: '#0e7490' }], markers: [{ x: f0, y: Imax, label: `f0 = ${eng(f0, 'Hz')}` }], hlines: [{ y: Imax / Math.SQRT2, label: 'half-power (0.707 Imax)', color: '#f59e0b' }] }),
            note('At resonance XL = XC, so they cancel. Impedance is smallest, current is largest, and the circuit is purely resistive (power factor = 1). Radio tuners use this to pick one station.'));
    };
    panel.append(head('Resonance in a series RLC circuit'),
        h('div', { class: 'row inputs-row' },
            num('R', st.R, { unit: 'Ω', min: 0.1, onInput: v => { if (!Number.isNaN(v)) { st.R = v; render(); } } }).el,
            num('L', st.L, { unit: 'H', min: 1e-6, onInput: v => { if (!Number.isNaN(v)) { st.L = v; render(); } } }).el,
            num('C (µF)', st.C * 1e6, { unit: 'µF', min: 1e-4, onInput: v => { if (!Number.isNaN(v)) { st.C = v * 1e-6; render(); } } }).el,
            num('V', st.V, { unit: 'V', min: 0.1, onInput: v => { if (!Number.isNaN(v)) { st.V = v; render(); } } }).el), out);
    render();
}

/* ---------- three phase ---------- */
function threePhase(panel) {
    const st = { conn: 'star', VL: 400, R: 30, X: 40, t: 0 };
    const seg = h('div', { class: 'seg' }, [['star', 'Star (Y)'], ['delta', 'Delta (Δ)']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.conn = id; render(); } }, l)));
    const out = h('div');
    const ph = h('div', { class: 'card' });
    let running = true;
    const draw = () => {
        if (!running) return;
        st.t += 0.02;
        const vecs = [['R', 0, '#dc2626'], ['Y', -TAU / 3, '#ca8a04'], ['B', TAU / 3, '#2563eb']].map(([n, a, col]) => ({ mag: 1, angle: a + st.t, label: `V${n}`, color: col }));
        ph.replaceChildren(h('h3', {}, 'Rotating phasors, 120° apart'), phasorDiagram(vecs, 240));
        setTimeout(() => requestAnimationFrame(draw), 40);
    };
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.conn));
        const Zp = Math.hypot(st.R, st.X);
        const pf = st.R / Zp;
        const Vph = st.conn === 'star' ? st.VL / Math.sqrt(3) : st.VL;
        const Iph = Vph / Zp;
        const IL = st.conn === 'star' ? Iph : Iph * Math.sqrt(3);
        const P = Math.sqrt(3) * st.VL * IL * pf;
        const pts = (shift, col, lab) => ({ points: Array.from({ length: 241 }, (_, k) => [k * 1.5, Math.sin(rad(k * 1.5) + shift)]), color: col, label: lab });
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Phase voltage Vph', eng(Vph, 'V'), st.conn === 'star' ? 'VL / √3' : '= VL'), tile('Phase current Iph', eng(Iph, 'A'), 'Vph / |Zph|'), tile('Line current IL', eng(IL, 'A'), st.conn === 'star' ? '= Iph' : '√3 × Iph'), tile('Total power P', eng(P, 'W'), `√3 VL IL cos φ, pf = ${pf.toFixed(2)}`)),
            h('div', { class: 'split' }, plot({ height: 240, x: { min: 0, max: 360, step: 60, label: 'Angle (degrees)' }, y: { min: -1.2, max: 1.2, step: 0.5, label: 'Voltage (per unit)' }, series: [pts(0, '#dc2626', 'R'), pts(-TAU / 3, '#ca8a04', 'Y'), pts(TAU / 3, '#2563eb', 'B')], readout: false }), ph),
            table(['', 'Star (Y)', 'Delta (Δ)'], [['Voltage', 'VL = √3 Vph', 'VL = Vph'], ['Current', 'IL = Iph', 'IL = √3 Iph'], ['Neutral wire', 'Yes (4-wire possible)', 'No'], ['Used for', 'Distribution to homes (400 V line, 230 V phase)', 'Motors and transmission'], ['Power', 'P = √3 VL IL cos φ', 'P = √3 VL IL cos φ']]));
    };
    panel.append(head('Three-phase circuits', 'Three AC voltages of equal size, 120° apart, named R, Y and B. They deliver smooth, constant power and need less copper than single-phase.'),
        h('div', { class: 'row' }, seg), h('div', { class: 'row inputs-row' },
            num('Line voltage VL', st.VL, { unit: 'V', min: 1, onInput: v => { if (!Number.isNaN(v)) { st.VL = v; render(); } } }).el,
            num('Load R per phase', st.R, { unit: 'Ω', min: 0.01, onInput: v => { if (!Number.isNaN(v)) { st.R = v; render(); } } }).el,
            num('Load X per phase', st.X, { unit: 'Ω', min: 0, onInput: v => { if (!Number.isNaN(v)) { st.X = v; render(); } } }).el), out);
    render();
    draw();
    return () => { running = false; };
}

export function render(page, { tab }) {
    const cleanups = [];
    const view = pageTabs(page, 'ac', [
        { id: 'waveform', label: 'AC waveform', render: waveform },
        { id: 'series', label: 'RL · RC · RLC', render: seriesCircuits },
        { id: 'resonance', label: 'Resonance', render: resonance },
        { id: 'threephase', label: 'Three-phase', render: (p) => cleanups.push(threePhase(p)) }
    ], tab);
    return { ...view, cleanup: () => cleanups.forEach(fn => fn()) };
}
