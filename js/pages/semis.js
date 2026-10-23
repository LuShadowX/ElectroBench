// Semiconductors and diodes: doping, PN junction, V-I characteristics, Zener, varactor, rectifiers, switch and testing.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, num, slider, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';
import { wire, dot, label, resistor, vsource, diode, capacitor, svgBox } from '../core/draw.js';

export const intro = 'Silicon on its own barely conducts. Add a few impurity atoms and it becomes the material every diode, transistor and chip is made of.';

const VT = 0.02585; // thermal voltage at 300 K

export const diodeI = (V, Is = 1e-14, n = 1.0) => Is * (Math.exp(V / (n * VT)) - 1);

// operating point of a diode in series with R, from Vs: solve Vs = I·R + Vd (bisection)
export function diodePoint(Vs, R, Is = 1e-14, n = 1.0) {
    if (Vs <= 0) return { Vd: Vs, I: diodeI(Vs, Is, n) };
    let lo = 0;
    let hi = Vs;
    for (let k = 0; k < 80; k++) {
        const mid = (lo + hi) / 2;
        const f = mid + diodeI(mid, Is, n) * R - Vs;
        if (f > 0) hi = mid; else lo = mid;
    }
    const Vd = (lo + hi) / 2;
    return { Vd, I: (Vs - Vd) / R };
}

/* ---------- doping ---------- */
function doping(panel) {
    const st = { mode: 'intrinsic', temp: 300 };
    const fig = h('div', { class: 'svg-box' });
    const info = h('div');
    let t = 0;
    let running = true;
    const seg = h('div', { class: 'seg' }, [['intrinsic', 'Intrinsic (pure Si)'], ['n', 'N-type (+ phosphorus)'], ['p', 'P-type (+ boron)']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.mode = id; [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id)); renderInfo(); } }, l)));
    seg.children[0].setAttribute('aria-pressed', 'true');
    const draw = () => {
        if (!running) return;
        t += 0.04;
        const atoms = [];
        const carriers = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
            const x = 60 + c * 80;
            const y = 40 + r * 60;
            const special = (r === 1 && c === 2) || (r === 2 && c === 4);
            const kind = special && st.mode === 'n' ? 'P' : special && st.mode === 'p' ? 'B' : 'Si';
            if (c < 5) atoms.push(s('line', { x1: x + 18, y1: y, x2: x + 62, y2: y, class: 'lat-bond' }));
            if (r < 3) atoms.push(s('line', { x1: x, y1: y + 18, x2: x, y2: y + 42, class: 'lat-bond' }));
            atoms.push(s('circle', { cx: x, cy: y, r: 17, class: `lat-atom lat-atom--${kind.toLowerCase()}` }), s('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'lat-text' }, kind));
            if (kind === 'P') carriers.push(s('circle', { cx: x + 30 + Math.sin(t * 2 + c) * 26, cy: y - 22 + Math.cos(t * 1.6 + r) * 8, r: 6, class: 'carrier-e' }));
            if (kind === 'B') carriers.push(s('circle', { cx: x + 40, cy: y, r: 6, class: 'carrier-h' }));
        }
        // thermally generated pairs (more at higher temperature)
        const pairs = st.mode === 'intrinsic' ? Math.round((st.temp - 250) / 40) : 1;
        for (let k = 0; k < pairs; k++) {
            const x = 100 + ((k * 137) % 360);
            const y = 70 + ((k * 61) % 150);
            carriers.push(s('circle', { cx: x + Math.sin(t + k) * 20, cy: y, r: 5, class: 'carrier-e' }), s('circle', { cx: x - 22, cy: y + 4, r: 5, class: 'carrier-h' }));
        }
        fig.replaceChildren(s('svg', { viewBox: '0 0 520 240', class: 'circuit', role: 'img', 'aria-label': 'Silicon crystal lattice' }, ...atoms, ...carriers));
        setTimeout(() => requestAnimationFrame(draw), 50);
    };
    const renderInfo = () => {
        info.replaceChildren(st.mode === 'intrinsic' ? h('p', { class: 'note' }, 'Pure silicon has 4 valence electrons, all locked in covalent bonds. Heat breaks a few bonds, making equal numbers of free electrons (blue) and holes (orange). Raise the temperature to see more.')
            : st.mode === 'n' ? h('p', { class: 'note' }, 'Phosphorus has 5 valence electrons. Four bond, the fifth is free to move. Electrons are the majority carriers. The crystal is still electrically neutral.')
                : h('p', { class: 'note' }, 'Boron has only 3 valence electrons, leaving a missing bond: a hole. Neighbouring electrons jump into it, so holes move. Holes are the majority carriers.'));
    };
    panel.append(head('Semiconductors and doping'),
        h('div', { class: 'row' }, seg, slider('Temperature', st.temp, { min: 250, max: 450, step: 10, unit: ' K', onInput: v => { st.temp = v; } }).el),
        h('div', { class: 'split' }, fig, info),
        table(['', 'N-type', 'P-type'], [['Dopant', 'Pentavalent: phosphorus, arsenic', 'Trivalent: boron, indium'], ['Dopant called', 'Donor', 'Acceptor'], ['Majority carriers', 'Electrons', 'Holes'], ['Minority carriers', 'Holes', 'Electrons'], ['Net charge', 'Neutral', 'Neutral']]),
        h('div', { class: 'row legend' }, h('span', { class: 'chip' }, h('span', { class: 'dot', style: { background: '#2563eb' } }), 'free electron'), h('span', { class: 'chip' }, h('span', { class: 'dot', style: { background: '#f59e0b' } }), 'hole')));
    renderInfo();
    draw();
    return () => { running = false; };
}

/* ---------- PN junction ---------- */
function junction(panel) {
    const st = { V: 0 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const render = () => {
        const Vbi = 0.7;
        const w = 60 * Math.sqrt(Math.max(0.05, Vbi - Math.min(st.V, 0.65)) / Vbi);
        const I = diodeI(Math.min(st.V, 0.85));
        const forward = st.V > 0;
        fig.replaceChildren(svgBox(560, 200,
            s('rect', { x: 60, y: 40, width: 220 - w / 2, height: 100, class: 'pn-p' }), s('rect', { x: 280 + w / 2, y: 40, width: 220 - w / 2, height: 100, class: 'pn-n' }),
            s('rect', { x: 280 - w / 2, y: 40, width: w, height: 100, class: 'pn-dep' }),
            label(150, 95, 'P', 'pn-big'), label(410, 95, 'N', 'pn-big'),
            label(280, 32, `depletion region (${(w / 6).toFixed(1)} µm, scaled)`, 'c-value'),
            ...[0, 1, 2].map(k => [s('text', { x: 280 - w / 2 + 10, y: 66 + k * 30, class: 'pn-ion' }, '−'), s('text', { x: 280 + w / 2 - 18, y: 66 + k * 30, class: 'pn-ion' }, '+')]),
            label(150, 170, forward ? '+ terminal' : st.V < 0 ? '− terminal' : 'no bias', 'c-name'), label(410, 170, forward ? '− terminal' : st.V < 0 ? '+ terminal' : '', 'c-name'),
            forward && I > 1e-6 ? s('text', { x: 280, y: 190, 'text-anchor': 'middle', class: 'c-current' }, `current flows → ${eng(I, 'A')}`) : null));
        out.replaceChildren(h('div', { class: 'grid-3' }, tile('Applied voltage', `${st.V.toFixed(2)} V`), tile('Bias', forward ? 'Forward' : st.V < 0 ? 'Reverse' : 'Unbiased'), tile('Diode current', eng(I, 'A'))),
            h('p', { class: 'note' }, forward ? 'Forward bias pushes holes and electrons toward the junction. The depletion region narrows, and above about 0.7 V (silicon) current rises sharply.' : st.V < 0 ? 'Reverse bias pulls carriers away. The depletion region widens and only a tiny leakage current from minority carriers flows.' : 'At the junction, electrons and holes recombine, leaving a region with no free carriers: the depletion region, with a barrier potential of about 0.7 V for silicon (0.3 V for germanium).'));
    };
    panel.append(head('PN junction'), h('div', { class: 'row inputs-row' }, slider('Bias voltage', st.V, { min: -5, max: 0.8, step: 0.05, unit: ' V', format: v => v.toFixed(2), onInput: v => { st.V = v; render(); } }).el), fig, out);
    render();
}

/* ---------- V-I ---------- */
function vi(panel) {
    const st = { q: 0.7 };
    const out = h('div');
    const render = () => {
        const si = [];
        const ge = [];
        for (let k = 0; k <= 160; k++) {
            const v = -2 + (k / 160) * 3;
            si.push([v, v < 0 ? -0.0004 * (1 - Math.exp(v)) : diodeI(v) * 1000]);
            ge.push([v, v < 0 ? -0.004 * (1 - Math.exp(v * 3)) : diodeI(v, 1e-8, 1.1) * 1000]);
        }
        const I = diodeI(st.q) * 1000;
        const dI = (diodeI(st.q + 0.005) - diodeI(st.q - 0.005)) / 0.01;
        out.replaceChildren(
            plot({ x: { min: -2, max: 1, label: 'Diode voltage (V)', unit: ' V' }, y: { min: -2, max: 60, label: 'Current (mA)', unit: ' mA' }, series: [{ points: si, label: 'Silicon', color: '#0e7490' }, { points: ge, label: 'Germanium', color: '#f59e0b', labelPos: 0.75 }], markers: [{ x: st.q, y: I, label: `Q (${st.q} V, ${I.toFixed(2)} mA)` }], vlines: [{ x: 0.7, label: 'Si knee 0.7 V', color: '#0e7490' }, { x: 0.3, label: 'Ge 0.3 V', color: '#f59e0b' }] }),
            h('div', { class: 'grid-3' }, tile('Static resistance', eng(st.q / (I / 1000), 'Ω'), 'R = V / I at the Q-point'), tile('Dynamic resistance', eng(1 / dI, 'Ω'), 'r = ΔV / ΔI ≈ VT / I'), tile('Reverse current', 'nA – µA', 'almost flat until breakdown')),
            formula('Shockley equation: I = Is (e^(V / ηVT) − 1),  VT = kT/q ≈ 26 mV at room temperature'));
    };
    panel.append(head('Diode V-I characteristics', 'Forward region: almost no current until the knee voltage, then a steep rise. Reverse region: a tiny leakage current until breakdown. Move the Q-point to see static and dynamic resistance.'),
        h('div', { class: 'row inputs-row' }, slider('Q-point voltage', st.q, { min: 0.55, max: 0.78, step: 0.01, unit: ' V', format: v => v.toFixed(2), onInput: v => { st.q = v; render(); } }).el), out,
        note('Breakdown: at a large reverse voltage, current suddenly rises (avalanche or Zener breakdown). A normal diode is damaged there, a Zener diode is designed to work there.'));
    render();
}

/* ---------- Zener ---------- */
function zener(panel) {
    const st = { Vin: 12, Rs: 220, Vz: 5.1, RL: 1000, Pz: 0.5 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const render = () => {
        const { Vin, Rs, Vz, RL, Pz } = st;
        const Vopen = (Vin * RL) / (Rs + RL);
        const on = Vopen > Vz;
        const Vout = on ? Vz : Vopen;
        const Is = (Vin - Vout) / Rs;
        const IL = Vout / RL;
        const Iz = on ? Is - IL : 0;
        const P = Iz * Vz;
        fig.replaceChildren(svgBox(560, 220, vsource(60, 40, 180, 'Vin', { valueText: `${Vin} V` }), wire([60, 40], [120, 40]), resistor(120, 40, 240, 40, 'Rs', { valueText: `${Rs} Ω` }), wire([240, 40], [420, 40]),
            dot(300, 40), diode(300, 180, 300, 40, 'Zener', { zener: true }), resistor(420, 40, 420, 180, 'RL', { valueText: `${RL} Ω` }), wire([60, 180], [420, 180]), dot(300, 180),
            label(470, 110, `Vout = ${Vout.toFixed(2)} V`, 'c-node', 'start')));
        const curve = [];
        for (let k = 0; k <= 120; k++) { const v = -Vz - 0.6 + (k / 120) * (Vz + 1.4); curve.push([v, v <= -Vz ? (v + Vz) * 200 : v > 0.6 ? (v - 0.6) * 200 : 0]); }
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Output voltage', `${Vout.toFixed(2)} V`, on ? 'regulated at Vz' : 'Zener OFF: not regulating'), tile('Series current Is', eng(Is, 'A')), tile('Load current IL', eng(IL, 'A')), tile('Zener current Iz', eng(Iz, 'A'), `power ${eng(P, 'W')}`)),
            P > Pz ? h('p', { class: 'note note--bad' }, `Zener dissipates ${eng(P, 'W')}, more than its ${Pz} W rating. Increase Rs.`) : on ? h('p', { class: 'note note--good' }, 'Change Vin or RL: Vout stays at Vz. The Zener absorbs the extra current.') : h('p', { class: 'note note--warn' }, 'Vin is too low (or RL too small), so the Zener never reaches breakdown. Output just follows the divider.'),
            plot({ height: 220, x: { min: -Vz - 0.6, max: 0.8, label: 'Voltage (V)' }, y: { min: -60, max: 40, label: 'Current (mA)' }, series: [{ points: curve, label: 'Zener', color: '#7c3aed' }], vlines: [{ x: -Vz, label: `Vz = −${Vz} V`, color: '#7c3aed' }], readout: false }));
    };
    panel.append(head('Zener diode as a voltage regulator', 'A Zener is a heavily doped diode made to work in reverse breakdown, where its voltage stays almost constant.'),
        h('div', { class: 'row inputs-row' }, [['Vin', 'V', 0], ['Rs', 'Ω', 1], ['Vz', 'V', 1], ['RL', 'Ω', 1]].map(([k, u, min]) => num(k, st[k], { unit: u, min, onInput: v => { if (!Number.isNaN(v)) { st[k] = v; render(); } } }).el)), fig, out);
    render();
}

/* ---------- varactor ---------- */
function varactor(panel) {
    const st = { Vr: 4 };
    const out = h('div');
    const C = (vr) => 50 / Math.sqrt(1 + vr / 0.7);
    const render = () => {
        const pts = Array.from({ length: 101 }, (_, k) => { const v = (k / 100) * 20; return [v, C(v)]; });
        const L = 1e-6;
        const f = 1 / (2 * Math.PI * Math.sqrt(L * C(st.Vr) * 1e-12));
        out.replaceChildren(plot({ height: 240, x: { min: 0, max: 20, label: 'Reverse voltage (V)' }, y: { min: 0, max: 55, label: 'Capacitance (pF)' }, series: [{ points: pts, color: '#0e7490', label: 'C(Vr)' }], markers: [{ x: st.Vr, y: C(st.Vr), label: `${C(st.Vr).toFixed(1)} pF` }] }),
            h('div', { class: 'grid-2' }, tile('Capacitance', `${C(st.Vr).toFixed(2)} pF`, 'C = C0 / √(1 + Vr/Vbi)'), tile('Tuned frequency with a 1 µH coil', eng(f, 'Hz'), 'f = 1 / (2π√(LC))')));
    };
    panel.append(head('Varactor (varicap) diode', 'In reverse bias the depletion region acts like the gap between capacitor plates. More reverse voltage = wider gap = smaller capacitance. So a voltage can tune a circuit.'),
        h('div', { class: 'row inputs-row' }, slider('Reverse voltage', st.Vr, { min: 0, max: 20, step: 0.5, unit: ' V', onInput: v => { st.Vr = v; render(); } }).el), out,
        note('Used in FM radio and TV tuners, voltage-controlled oscillators and phase-locked loops: turning a knob changes a voltage, which changes C and the tuned frequency.'));
    render();
}

/* ---------- rectifiers ---------- */
export function rectify({ type, Vm, f, RL, C }) {
    const w = 2 * Math.PI * f;
    const T = 1 / f;
    const N = 1200;
    const dt = (3 * T) / N;
    let vc = 0;
    const vin = [];
    const vout = [];
    const drop = type === 'bridge' ? 1.4 : 0.7;
    for (let k = 0; k <= N; k++) {
        const t = k * dt;
        const vs = Vm * Math.sin(w * t);
        let rect = type === 'half' ? vs - drop : Math.abs(vs) - drop;
        rect = Math.max(0, rect);
        if (C > 0) vc = Math.max(rect, vc * Math.exp(-dt / (RL * C)));
        else vc = rect;
        vin.push([t * 1000, vs]);
        vout.push([t * 1000, vc]);
    }
    const last = vout.slice(Math.floor((2 * N) / 3));
    const mean = last.reduce((a, p) => a + p[1], 0) / last.length;
    const rms = Math.sqrt(last.reduce((a, p) => a + p[1] ** 2, 0) / last.length);
    const ripple = Math.max(...last.map(p => p[1])) - Math.min(...last.map(p => p[1]));
    const rf = Math.sqrt(Math.max(0, rms ** 2 - mean ** 2)) / mean;
    return { vin, vout, mean, rms, ripple, rf };
}

function rectifiers(panel) {
    const st = { type: 'bridge', Vm: 12, f: 50, RL: 1000, C: 0, phase: 0 };
    const seg = h('div', { class: 'seg' }, [['half', 'Half-wave'], ['center', 'Full-wave centre-tap'], ['bridge', 'Full-wave bridge']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.type = id; render(); } }, l)));
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const halfSeg = h('div', { class: 'seg' }, [['pos', 'Positive half'], ['neg', 'Negative half']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.phase = id === 'pos' ? 0 : 1; render(); } }, l)));
    const drawCircuit = () => {
        const pos = st.phase === 0;
        if (st.type === 'bridge') {
            const on = (d) => (pos ? d === 1 || d === 3 : d === 2 || d === 4) ? 'is-on' : 'is-off';
            return svgBox(560, 240, vsource(50, 50, 190, 'AC in', { ac: true }), wire([50, 50], [200, 50], [200, 70]), wire([50, 190], [200, 190], [200, 170]),
                diode(200, 70, 260, 120, 'D1', { cls: on(1) }), diode(140, 120, 200, 70, 'D4', { cls: on(4) }), diode(200, 170, 260, 120, 'D2', { cls: on(2) }), diode(140, 120, 200, 170, 'D3', { cls: on(3) }),
                wire([260, 120], [420, 120], [420, 140]), resistor(420, 140, 420, 200, 'RL'), wire([420, 200], [420, 220], [110, 220], [110, 120], [140, 120]),
                label(470, 110, '+ out', 'c-node', 'start'), label(300, 236, pos ? 'Positive half: D1 and D3 conduct' : 'Negative half: D2 and D4 conduct', 'c-current'));
        }
        if (st.type === 'half') return svgBox(560, 220, vsource(60, 50, 180, 'AC in', { ac: true }), diode(60, 50, 300, 50, 'D', { cls: pos ? 'is-on' : 'is-off' }), wire([300, 50], [400, 50]), resistor(400, 50, 400, 180, 'RL'), wire([400, 180], [60, 180]),
            label(260, 210, pos ? 'Positive half: D conducts' : 'Negative half: D is reverse biased, output 0', 'c-current'));
        return svgBox(560, 240, vsource(50, 40, 200, 'AC in', { ac: true }), wire([50, 40], [130, 40]), wire([50, 200], [130, 200]), s('line', { x1: 140, y1: 30, x2: 140, y2: 210, class: 'c-wire' }), s('line', { x1: 148, y1: 30, x2: 148, y2: 210, class: 'c-wire' }),
            wire([160, 40], [200, 40]), wire([160, 200], [200, 200]), wire([160, 120], [300, 120]), label(170, 135, 'CT', 'c-value'),
            diode(200, 40, 330, 40, 'D1', { cls: pos ? 'is-on' : 'is-off' }), diode(200, 200, 330, 200, 'D2', { cls: pos ? 'is-off' : 'is-on' }), wire([330, 40], [400, 40], [400, 200], [330, 200]), dot(400, 120), wire([400, 120], [460, 120]),
            resistor(460, 120, 460, 220, 'RL'), wire([460, 220], [300, 220], [300, 120]), label(260, 236, pos ? 'Positive half: D1 conducts' : 'Negative half: D2 conducts', 'c-current'));
    };
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.type));
        [...halfSeg.children].forEach(b => b.setAttribute('aria-pressed', (b.dataset.id === 'pos') === (st.phase === 0)));
        fig.replaceChildren(drawCircuit());
        const r = rectify(st);
        const full = st.type !== 'half';
        const theory = full ? { vdc: (2 * st.Vm) / Math.PI, rf: 0.482, eta: 81.2 } : { vdc: st.Vm / Math.PI, rf: 1.21, eta: 40.6 };
        const piv = st.type === 'center' ? 2 * st.Vm : st.Vm;
        out.replaceChildren(
            plot({ height: 260, x: { min: 0, max: 3000 / st.f, label: 'Time (ms)', unit: ' ms' }, y: { min: -st.Vm * 1.1, max: st.Vm * 1.1, label: 'Voltage (V)', unit: ' V' }, series: [{ points: r.vin, label: 'input', color: '#94a3b8', dashed: true }, { points: r.vout, label: 'output', color: '#0e7490', width: 2.8 }] }),
            h('div', { class: 'grid-4' }, tile('DC output (simulated)', eng(r.mean, 'V'), `ideal formula: ${eng(theory.vdc, 'V')}`), tile('Ripple factor', r.rf.toFixed(3), st.C ? 'reduced by the capacitor' : `ideal: ${theory.rf}`), tile('Peak-to-peak ripple', eng(r.ripple, 'V')), tile('PIV per diode', eng(piv, 'V'), st.type === 'center' ? '2Vm' : 'Vm')),
            table(['', 'Half-wave', 'Full-wave (centre-tap)', 'Full-wave (bridge)'], [['Diodes', '1', '2', '4'], ['Vdc', 'Vm/π = 0.318 Vm', '2Vm/π = 0.636 Vm', '2Vm/π = 0.636 Vm'], ['Ripple factor', '1.21', '0.482', '0.482'], ['Max efficiency', '40.6%', '81.2%', '81.2%'], ['PIV', 'Vm', '2Vm', 'Vm'], ['Ripple frequency', 'f', '2f', '2f'], ['Needs centre-tapped transformer', 'No', 'Yes', 'No']]));
    };
    panel.append(head('Rectifiers', 'Rectifiers turn AC into DC. Every phone charger starts with one. The output is simulated cycle by cycle, including the 0.7 V drop of each conducting diode.'),
        h('div', { class: 'row' }, seg, halfSeg),
        h('div', { class: 'row inputs-row' },
            slider('Peak input Vm', st.Vm, { min: 2, max: 30, step: 1, unit: ' V', onInput: v => { st.Vm = v; render(); } }).el,
            slider('Load RL', st.RL, { min: 100, max: 5000, step: 100, unit: ' Ω', onInput: v => { st.RL = v; render(); } }).el,
            slider('Filter capacitor', st.C * 1e6, { min: 0, max: 1000, step: 10, unit: ' µF', onInput: v => { st.C = v * 1e-6; render(); } }).el),
        fig, out);
    render();
}

/* ---------- switch + testing ---------- */
function switchTest(panel) {
    const st = { on: true };
    const fig = h('div', { class: 'svg-box' });
    const btn = h('button', { type: 'button', class: 'btn', onClick: () => { st.on = !st.on; render(); } });
    const render = () => {
        btn.textContent = st.on ? 'Reverse the battery' : 'Forward the battery';
        const r = diodePoint(st.on ? 5 : -5, 330);
        fig.replaceChildren(svgBox(560, 200, vsource(70, 40, 170, st.on ? '+5 V' : '−5 V'), wire([70, 40], [140, 40]), diode(140, 40, 260, 40, 'D', { cls: st.on ? 'is-on' : 'is-off' }), resistor(260, 40, 380, 40, '330 Ω'),
            wire([380, 40], [440, 40]), diode(440, 40, 440, 170, 'LED', { led: true, cls: st.on ? 'is-lit' : '' }), wire([440, 170], [70, 170]),
            label(300, 195, st.on ? `Forward: switch CLOSED, I = ${eng(r.I, 'A')}, drop ${r.Vd.toFixed(2)} V` : 'Reverse: switch OPEN, I ≈ 0', 'c-current')));
    };
    panel.append(head('Diode as a switch', 'Forward biased, a diode is like a closed switch with a ~0.7 V drop. Reverse biased, it is an open switch. Used in logic gates, protection circuits and rectifiers.'), btn, fig,
        h('h4', {}, 'Testing a diode with a digital multimeter (diode mode)'),
        table(['Red probe on', 'Black probe on', 'Good diode reads', 'Faulty'], [['Anode', 'Cathode', '0.5 – 0.7 V (silicon)', 'OL = open diode'], ['Cathode', 'Anode', 'OL (no conduction)', '≈ 0 V both ways = shorted diode']]),
        h('h4', {}, 'Testing a BJT (two diodes back to back)'),
        table(['Junction', 'NPN: red on base', 'PNP: black on base'], [['Base → Emitter', '≈ 0.7 V', '≈ 0.7 V'], ['Base → Collector', '≈ 0.7 V', '≈ 0.7 V'], ['Collector ↔ Emitter', 'OL both ways', 'OL both ways']]),
        note('If the base reads 0.7 V to both other legs with the RED probe on base, it is NPN. With the BLACK probe on base, it is PNP. The B–E reading is usually slightly higher than B–C, which tells emitter from collector.'));
    render();
}

export function render(page, { tab }) {
    const cleanups = [];
    const view = pageTabs(page, 'semis', [
        { id: 'doping', label: 'Doping', render: (p) => cleanups.push(doping(p)) },
        { id: 'junction', label: 'PN junction', render: junction },
        { id: 'vi', label: 'V-I curve', render: vi },
        { id: 'zener', label: 'Zener', render: zener },
        { id: 'varactor', label: 'Varactor', render: varactor },
        { id: 'rectifiers', label: 'Rectifiers', render: rectifiers },
        { id: 'switch', label: 'Switch & testing', render: switchTest }
    ], tab);
    return { ...view, cleanup: () => cleanups.forEach(fn => fn()) };
}
