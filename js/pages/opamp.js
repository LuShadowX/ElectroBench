// Operational amplifiers and filters: properties, configurations, integrator/differentiator,
// passive and active filters with Bode plots, comparator and ABS.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, num, slider, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';
import { wire, dot, label, resistor, capacitor, ground, opamp as opampSym, svgBox } from '../core/draw.js';

export const intro = 'An op-amp is a very high gain differential amplifier on one chip (like the 741). With a few resistors and capacitors it can add, subtract, integrate, differentiate, filter and compare signals.';

const VSAT = 13.5;
const clip = (v) => Math.max(-VSAT, Math.min(VSAT, v));

function properties(panel) {
    panel.append(head('Op-amp abstraction and ideal properties'),
        h('div', { class: 'grid-2' },
            h('div', { class: 'svg-box' }, (() => { const o = opampSym(220, 110); return svgBox(420, 220, o.el, wire([100, 96], [o.inv[0], o.inv[1]]), wire([100, 124], [o.non[0], o.non[1]]), wire([o.out[0], o.out[1]], [340, 110]),
                label(90, 100, 'V− (inverting)', 'c-name', 'end'), label(90, 128, 'V+ (non-inverting)', 'c-name', 'end'), label(346, 114, 'Vout', 'c-name', 'start'), label(220, 60, '+Vcc', 'c-value'), label(220, 170, '−Vee', 'c-value'), label(220, 200, 'Vout = A (V+ − V−)', 'c-current')); })()),
            table(['Property', 'Ideal', 'Real (741)'], [['Open-loop gain A', '∞', '~200,000'], ['Input impedance', '∞', '2 MΩ'], ['Output impedance', '0', '75 Ω'], ['Bandwidth', '∞', '1 MHz (gain × BW)'], ['CMRR', '∞', '90 dB'], ['Input current', '0', '~80 nA'], ['Output swing', '±Vcc', '≈ ±13.5 V on ±15 V']])),
        h('div', { class: 'grid-2' },
            h('div', { class: 'card' }, h('h3', {}, 'Rule 1: no current into the inputs'), h('p', {}, 'Because input impedance is (almost) infinite.')),
            h('div', { class: 'card' }, h('h3', {}, 'Rule 2: virtual short'), h('p', {}, 'With negative feedback, the op-amp drives its output until V− = V+. If V+ is grounded, V− sits at 0 V without being connected to ground: a virtual ground.'))),
        note('These two rules are all you need to derive every formula on the next tabs.'));
}

const CONFIGS = {
    inverting: { name: 'Inverting amplifier', gain: 'Vout = −(Rf / Rin) · Vin' },
    noninverting: { name: 'Non-inverting amplifier', gain: 'Vout = (1 + Rf / Rin) · Vin' },
    follower: { name: 'Voltage follower (buffer)', gain: 'Vout = Vin (gain 1, very high input impedance)' },
    adder: { name: 'Inverting adder (summer)', gain: 'Vout = −Rf (V1/R1 + V2/R2)' },
    subtractor: { name: 'Difference amplifier (subtractor)', gain: 'Vout = (Rf / R1)(V2 − V1)  (with matched resistors)' }
};

export function opampOut(cfg, { Rin, Rf, V1, V2 }) {
    switch (cfg) {
        case 'inverting': return clip(-(Rf / Rin) * V1);
        case 'noninverting': return clip((1 + Rf / Rin) * V1);
        case 'follower': return clip(V1);
        case 'adder': return clip(-Rf * (V1 / Rin + V2 / Rin));
        case 'subtractor': return clip((Rf / Rin) * (V2 - V1));
    }
    return 0;
}

function configurations(panel) {
    const st = { cfg: 'inverting', Rin: 10000, Rf: 47000, V1: 1, V2: 0.5 };
    const seg = h('div', { class: 'seg seg--wrap' }, Object.entries(CONFIGS).map(([id, c]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.cfg = id; render(); } }, c.name.split(' (')[0])));
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const draw = () => {
        const o = opampSym(330, 120, { flip: st.cfg === 'noninverting' || st.cfg === 'follower' });
        const parts = [o.el, wire([o.out[0], o.out[1]], [460, 120]), label(466, 124, 'Vout', 'c-name', 'start')];
        if (st.cfg === 'inverting' || st.cfg === 'adder') {
            parts.push(resistor(140, o.inv[1], 250, o.inv[1], st.cfg === 'adder' ? 'R1' : 'Rin'), wire([250, o.inv[1]], o.inv), dot(260, o.inv[1]),
                wire([260, o.inv[1]], [260, 50]), resistor(260, 50, 400, 50, 'Rf'), wire([400, 50], [400, 120]), dot(400, 120),
                wire(o.non, [270, o.non[1]], [270, 180]), ground(270, 180), label(130, o.inv[1] + 4, 'V1', 'c-name', 'end'), label(256, o.inv[1] + 22, 'virtual ground', 'c-value', 'end'));
            if (st.cfg === 'adder') parts.push(resistor(140, 80, 240, 80, 'R2'), wire([240, 80], [260, 80]), label(130, 84, 'V2', 'c-name', 'end'));
        } else if (st.cfg === 'noninverting' || st.cfg === 'follower') {
            parts.push(wire([140, o.non[1]], o.non), label(130, o.non[1] + 4, 'Vin', 'c-name', 'end'));
            if (st.cfg === 'follower') parts.push(wire(o.inv, [270, o.inv[1]], [270, 190], [400, 190], [400, 120]));
            else parts.push(wire(o.inv, [260, o.inv[1]], [260, 190]), resistor(260, 190, 260, 230, 'Rin'), wire([260, 190], [400, 190]), resistor(400, 190, 400, 120, 'Rf'));
        } else {
            parts.push(resistor(140, o.inv[1], 250, o.inv[1], 'R1'), wire([250, o.inv[1]], o.inv), dot(260, o.inv[1]), wire([260, o.inv[1]], [260, 50]), resistor(260, 50, 400, 50, 'Rf'), wire([400, 50], [400, 120]),
                resistor(140, o.non[1], 250, o.non[1], 'R1'), wire([250, o.non[1]], o.non), dot(260, o.non[1]), resistor(260, o.non[1], 260, 220, 'Rf'),
                label(130, o.inv[1] + 4, 'V1', 'c-name', 'end'), label(130, o.non[1] + 4, 'V2', 'c-name', 'end'));
        }
        return svgBox(560, 250, ...parts);
    };
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.cfg));
        fig.replaceChildren(draw());
        const vout = opampOut(st.cfg, st);
        const ideal = st.cfg === 'inverting' ? -(st.Rf / st.Rin) * st.V1 : st.cfg === 'noninverting' ? (1 + st.Rf / st.Rin) * st.V1 : st.cfg === 'follower' ? st.V1 : st.cfg === 'adder' ? -st.Rf * (st.V1 + st.V2) / st.Rin : (st.Rf / st.Rin) * (st.V2 - st.V1);
        const sat = Math.abs(ideal) > VSAT;
        const wave = Array.from({ length: 201 }, (_, k) => { const t = k / 200 * 2; const vin = st.V1 * Math.sin(2 * Math.PI * t); return [t, vin, opampOut(st.cfg, { ...st, V1: vin, V2: st.cfg === 'adder' || st.cfg === 'subtractor' ? st.V2 : 0 })]; });
        out.replaceChildren(
            formula(CONFIGS[st.cfg].gain),
            h('div', { class: 'grid-3' }, tile('Output (DC inputs)', `${vout.toFixed(3)} V`), tile('Ideal value', `${ideal.toFixed(3)} V`), tile('Status', sat ? 'SATURATED' : 'linear', sat ? `cannot exceed ±${VSAT} V` : 'within supply')),
            plot({ height: 230, x: { min: 0, max: 2, label: 'Time (cycles)', format: v => v.toFixed(1) }, y: { min: -15, max: 15, step: 5, label: 'Voltage (V)' }, series: [{ points: wave.map(w => [w[0], w[1]]), label: 'V1 as a sine', color: '#94a3b8', dashed: true }, { points: wave.map(w => [w[0], w[2]]), label: 'Vout', color: '#0e7490' }], hlines: [{ y: VSAT, label: '+Vsat', color: '#dc2626' }, { y: -VSAT, label: '−Vsat', color: '#dc2626' }] }));
    };
    panel.append(head('Basic op-amp circuits'), seg,
        h('div', { class: 'row inputs-row' }, [['Rin', 'Ω'], ['Rf', 'Ω'], ['V1', 'V'], ['V2', 'V']].map(([k, u]) => num(k === 'Rin' ? 'Rin (R1)' : k, st[k], { unit: u, min: k.startsWith('R') ? 1 : -15, onInput: v => { if (!Number.isNaN(v)) { st[k] = v; render(); } } }).el)),
        fig, out);
    render();
}

function integrator(panel) {
    const st = { mode: 'integrator', wave: 'square', R: 10000, C: 0.1e-6, f: 1000, A: 1 };
    const seg = h('div', { class: 'seg' }, [['integrator', 'Integrator'], ['differentiator', 'Differentiator']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.mode = id; st.wave = id === 'integrator' ? 'square' : 'triangle'; render(); } }, l)));
    const wseg = h('div', { class: 'seg' }, ['square', 'triangle', 'sine'].map(id => h('button', { type: 'button', dataset: { id }, onClick: () => { st.wave = id; render(); } }, id)));
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.mode));
        [...wseg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.wave));
        const o = opampSym(330, 120);
        const integ = st.mode === 'integrator';
        fig.replaceChildren(svgBox(560, 220, o.el, label(130, o.inv[1] + 4, 'Vin', 'c-name', 'end'),
            integ ? resistor(140, o.inv[1], 250, o.inv[1], 'R') : capacitor(140, o.inv[1], 250, o.inv[1], 'C'), wire([250, o.inv[1]], o.inv), dot(260, o.inv[1]), wire([260, o.inv[1]], [260, 50]),
            integ ? capacitor(260, 50, 400, 50, 'C') : resistor(260, 50, 400, 50, 'R'), wire([400, 50], [400, 120]), wire([o.out[0], o.out[1]], [460, 120]), label(466, 124, 'Vout', 'c-name', 'start'), wire(o.non, [270, o.non[1]], [270, 180]), ground(270, 180)));
        const T = 1 / st.f;
        const N = 800;
        const dt = (3 * T) / N;
        const vin = (t) => { const ph = (t / T) % 1; if (st.wave === 'square') return ph < 0.5 ? st.A : -st.A; if (st.wave === 'triangle') return st.A * (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph); return st.A * Math.sin(2 * Math.PI * ph); };
        const RC = st.R * st.C;
        const pin = [];
        const pout = [];
        let acc = 0;
        let mean = 0;
        for (let k = 0; k <= N; k++) mean += vin(k * dt) / (N + 1);
        for (let k = 0; k <= N; k++) {
            const t = k * dt;
            let vo;
            if (integ) { acc += -((vin(t) - mean) / RC) * dt; vo = clip(acc); } else vo = clip(-RC * (vin(t + dt / 2) - vin(t - dt / 2)) / dt);
            pin.push([t * 1000, vin(t)]);
            pout.push([t * 1000, vo]);
        }
        const peak = Math.max(...pout.map(p => Math.abs(p[1])), st.A);
        out.replaceChildren(formula(integ ? 'Vout = −(1/RC) ∫ Vin dt      square → triangle, sine → (−)cosine' : 'Vout = −RC · dVin/dt      triangle → square, sine → (−)cosine'),
            tile('Time constant RC', eng(RC, 's'), `period ${eng(T, 's')}`),
            plot({ height: 250, x: { min: 0, max: 3 * T * 1000, label: 'Time (ms)' }, y: { min: -peak * 1.15, max: peak * 1.15, label: 'Voltage (V)' }, series: [{ points: pin, label: 'Vin', color: '#94a3b8' }, { points: pout, label: 'Vout', color: '#0e7490', width: 2.6 }] }),
            note(integ ? 'In practice a large resistor is placed across C so tiny DC offsets do not slowly drive the output into saturation.' : 'Real differentiators add a small resistor in series with C to stop high-frequency noise being amplified.'));
    };
    panel.append(head('Op-amp RC circuits: integrator and differentiator'), h('div', { class: 'row' }, seg, wseg),
        h('div', { class: 'row inputs-row' }, slider('Frequency', st.f, { min: 100, max: 5000, step: 100, unit: ' Hz', onInput: v => { st.f = v; render(); } }).el, slider('Amplitude', st.A, { min: 0.2, max: 5, step: 0.1, unit: ' V', format: v => v.toFixed(1), onInput: v => { st.A = v; render(); } }).el), fig, out);
    render();
}

export function filterGain(kind, f, { R, C, R2 = R, C2 = C, K = 1 }) {
    const w = 2 * Math.PI * f;
    const lp = (r, c) => 1 / Math.sqrt(1 + (w * r * c) ** 2);
    const hp = (r, c) => (w * r * c) / Math.sqrt(1 + (w * r * c) ** 2);
    switch (kind) {
        case 'low': return K * lp(R, C);
        case 'high': return K * hp(R, C);
        case 'band': return K * hp(R, C) * lp(R2, C2);
        case 'stop': { const f0 = 1 / (2 * Math.PI * Math.sqrt(R * C * R2 * C2)); const Q = 0.7; const x = f / f0 - f0 / f; return K * Math.abs(x) / Math.sqrt(x * x + 1 / (Q * Q)); }
    }
    return 0;
}

function filters(panel) {
    const st = { kind: 'low', R: 1600, C: 0.1e-6, R2: 160, C2: 0.1e-6, active: true, K: 2 };
    const seg = h('div', { class: 'seg seg--wrap' }, [['low', 'Low-pass'], ['high', 'High-pass'], ['band', 'Band-pass'], ['stop', 'Band-stop']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.kind = id; render(); } }, l)));
    const out = h('div');
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.kind));
        const K = st.active ? st.K : 1;
        const fc1 = 1 / (2 * Math.PI * st.R * st.C);
        const fc2 = 1 / (2 * Math.PI * st.R2 * st.C2);
        const pts = [];
        for (let k = 0; k <= 300; k++) { const f = 10 * 10 ** ((k / 300) * 5); pts.push([f, 20 * Math.log10(Math.max(1e-6, filterGain(st.kind, f, { ...st, K })))]); }
        const two = st.kind === 'band' || st.kind === 'stop';
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile(two ? 'Lower cut-off' : 'Cut-off frequency fc', eng(two ? Math.min(fc1, fc2) : fc1, 'Hz'), 'fc = 1 / (2πRC)'), two ? tile('Upper cut-off', eng(Math.max(fc1, fc2), 'Hz')) : tile('Order', '1st order', '−20 dB per decade'), tile('Passband gain', st.active ? `${K}× (${(20 * Math.log10(K)).toFixed(1)} dB)` : '1× (0 dB) or less', st.active ? 'K = 1 + Rf/R1 (non-inverting)' : 'passive filters cannot amplify'), tile('Type', st.active ? 'Active (op-amp)' : 'Passive (R, C only)')),
            plot({ height: 280, x: { min: 10, max: 1e6, log: true, label: 'Frequency (Hz)', unit: ' Hz' }, y: { min: -50, max: 15, step: 10, label: 'Gain (dB)', unit: ' dB' }, series: [{ points: pts, label: 'gain', color: '#0e7490', width: 2.6 }], hlines: [{ y: 20 * Math.log10(K) - 3, label: '−3 dB', color: '#f59e0b' }], vlines: [{ x: fc1, color: '#dc2626' }].concat(two ? [{ x: fc2, color: '#dc2626' }] : []) }),
            table(['Filter', 'Passes', 'Blocks', 'Example use'], [['Low-pass', 'Below fc', 'Above fc', 'Removing hiss from audio, smoothing sensor data'], ['High-pass', 'Above fc', 'Below fc', 'Blocking DC, tweeter crossover'], ['Band-pass', 'Between f1 and f2', 'Outside the band', 'Radio tuning, ECG signal 0.5–40 Hz'], ['Band-stop (notch)', 'Outside the band', 'Between f1 and f2', 'Removing 50 Hz mains hum']]));
    };
    panel.append(head('Filters', 'Filters let some frequencies through and block others. Passive filters use only R and C. Active filters add an op-amp, so they can also amplify and do not load the source.'),
        h('div', { class: 'row' }, seg, h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: true, onChange: e => { st.active = e.target.checked; render(); } }), 'Active (with op-amp)')),
        h('div', { class: 'row inputs-row' },
            num('R', st.R, { unit: 'Ω', min: 1, onInput: v => { if (!Number.isNaN(v)) { st.R = v; render(); } } }).el, num('C (µF)', st.C * 1e6, { unit: 'µF', min: 0.0001, onInput: v => { if (!Number.isNaN(v)) { st.C = v * 1e-6; render(); } } }).el,
            num('R2 (band)', st.R2, { unit: 'Ω', min: 1, onInput: v => { if (!Number.isNaN(v)) { st.R2 = v; render(); } } }).el, num('Gain K', st.K, { min: 1, onInput: v => { if (!Number.isNaN(v)) { st.K = v; render(); } } }).el), out);
    render();
}

function comparator(panel) {
    const st = { vref: 0.5, abs: true, brake: 1 };
    const out = h('div');
    const absOut = h('div');
    const render = () => {
        const pts = Array.from({ length: 401 }, (_, k) => { const t = k / 200; const v = Math.sin(2 * Math.PI * t); return [t, v, v > st.vref ? VSAT : -VSAT]; });
        out.replaceChildren(plot({ height: 220, x: { min: 0, max: 2, label: 'Time (cycles)', format: v => v.toFixed(1) }, y: { min: -15, max: 15, step: 5, label: 'Voltage (V)' }, series: [{ points: pts.map(p => [p[0], p[1] * 10]), label: 'Vin (×10)', color: '#94a3b8' }, { points: pts.map(p => [p[0], p[2]]), label: 'Vout', color: '#0e7490', width: 2.6 }], hlines: [{ y: st.vref * 10, label: `Vref (×10) = ${st.vref} V`, color: '#f59e0b' }] }));
        // ABS: wheel speed vs vehicle speed during hard braking
        const dt = 0.01;
        let v = 25;
        let w = 25;
        let pressure = 0;
        const vehicle = [];
        const wheel = [];
        const valve = [];
        let stop = 0;
        for (let t = 0; t <= 6 && v > 0.2; t += dt) {
            const target = st.brake;
            const slip = v > 0 ? (v - w) / v : 0;
            const release = st.abs && slip > 0.2; // the comparator: slip above threshold
            pressure += ((release ? 0 : target) - pressure) * 0.15;
            const mu = slip < 0.2 ? 0.9 * (slip / 0.2) + 0.1 : 0.9 - 0.3 * (slip - 0.2);
            const decel = Math.min(9.81 * Math.max(0.3, mu), 9.81 * pressure * 1.2);
            v = Math.max(0, v - decel * dt);
            w = Math.max(0, w - (pressure * 40 - mu * 30) * dt);
            w = Math.min(w, v);
            vehicle.push([t, v * 3.6]);
            wheel.push([t, w * 3.6]);
            valve.push([t, release ? 10 : 0]);
            stop = t;
        }
        absOut.replaceChildren(plot({ height: 240, x: { min: 0, max: Math.max(3, stop), label: 'Time (s)', format: v => v.toFixed(1) }, y: { min: 0, max: 100, label: 'Speed (km/h)' }, series: [{ points: vehicle, label: 'vehicle', color: '#0f172a', labelPos: 0.25 }, { points: wheel, label: 'wheel', color: '#0e7490', labelPos: 0.45 }, { points: valve, label: 'comparator output (release)', color: '#dc2626', width: 1.4, labelPos: 0.08 }] }),
            h('p', { class: `note ${st.abs ? 'note--good' : 'note--bad'}` }, st.abs ? `With ABS the comparator watches wheel slip. When the wheel starts to lock (slip > 20%), its output goes high and releases brake pressure for a moment, so the wheel keeps turning and the driver can still steer. Stopped in ${stop.toFixed(2)} s.` : `Without ABS the wheel locks almost immediately (wheel speed = 0) while the car slides on. A sliding tyre has less grip and cannot steer. Stopped in ${stop.toFixed(2)} s.`));
    };
    panel.append(head('Op-amp as a comparator', 'With no feedback, the huge gain makes the output slam to +Vsat when V+ > V− and to −Vsat otherwise. It answers one question: is the input above the reference?'),
        h('div', { class: 'row inputs-row' }, slider('Reference Vref', st.vref, { min: -0.9, max: 0.9, step: 0.05, unit: ' V', format: v => v.toFixed(2), onInput: v => { st.vref = v; render(); } }).el), out,
        h('h4', {}, 'Application: anti-lock braking system (ABS)'),
        h('div', { class: 'row inputs-row' }, h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: true, onChange: e => { st.abs = e.target.checked; render(); } }), 'ABS enabled'), slider('Brake pedal', st.brake, { min: 0.4, max: 1, step: 0.05, format: v => `${Math.round(v * 100)}%`, onInput: v => { st.brake = v; render(); } }).el),
        absOut);
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'opamp', [
        { id: 'properties', label: 'Properties', render: properties },
        { id: 'configs', label: 'Amplifiers, adder, subtractor', render: configurations },
        { id: 'integrator', label: 'Integrator & differentiator', render: integrator },
        { id: 'filters', label: 'Filters', render: filters },
        { id: 'comparator', label: 'Comparator & ABS', render: comparator }
    ], tab);
}
