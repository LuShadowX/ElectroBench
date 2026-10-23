// BJT and MOSFET: construction, modes, CE characteristics with load line, switch, MOSFET curves.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, num, slider, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';
import { wire, label, resistor, vsource, ground, diode, svgBox } from '../core/draw.js';

export const intro = 'Transistors are the switches and amplifiers inside every electronic device. A small base current (BJT) or gate voltage (MOSFET) controls a much larger current.';

const VA = 80; // Early voltage
export const icOf = (ib, vce, beta) => beta * ib * (1 + vce / VA) * (1 - Math.exp(-vce / 0.08));

function construction(panel) {
    const block = (type) => {
        const n = type === 'NPN';
        return h('div', { class: 'card' }, h('h3', {}, type),
            svgBox(320, 150,
                s('rect', { x: 20, y: 40, width: 110, height: 70, class: n ? 'pn-n' : 'pn-p' }), s('rect', { x: 130, y: 40, width: 40, height: 70, class: n ? 'pn-p' : 'pn-n' }), s('rect', { x: 170, y: 40, width: 130, height: 70, class: n ? 'pn-n' : 'pn-p' }),
                label(75, 82, n ? 'N+' : 'P+', 'pn-big'), label(150, 82, n ? 'P' : 'N', 'pn-big'), label(235, 82, n ? 'N' : 'P', 'pn-big'),
                label(75, 30, 'Emitter (heavily doped)', 'c-value'), label(150, 132, 'Base (thin, lightly doped)', 'c-value'), label(235, 30, 'Collector (largest)', 'c-value'),
                label(130, 125, 'J_E', 'c-node'), label(170, 125, 'J_C', 'c-node')),
            h('p', { class: 'muted' }, n ? 'Arrow on the emitter points OUT. Electrons are the main carriers. Most used.' : 'Arrow on the emitter points IN. Holes are the main carriers.'));
    };
    panel.append(head('BJT construction', 'A bipolar junction transistor is three doped regions: emitter, base and collector, forming two PN junctions.'),
        h('div', { class: 'grid-2' }, block('NPN'), block('PNP')),
        h('h4', {}, 'Modes of operation'),
        table(['Mode', 'Emitter–base junction', 'Collector–base junction', 'Behaves like', 'Used for'], [
            ['Cut-off', 'Reverse', 'Reverse', 'Open switch (IC ≈ 0)', 'Switch OFF'],
            ['Active', 'Forward', 'Reverse', 'Current amplifier (IC = β·IB)', 'Amplifiers'],
            ['Saturation', 'Forward', 'Forward', 'Closed switch (VCE ≈ 0.2 V)', 'Switch ON'],
            ['Inverse active', 'Reverse', 'Forward', 'Poor amplifier', 'Rarely used']
        ]),
        formula('IE = IB + IC        IC = β·IB        α = IC/IE = β/(1 + β)        β = α/(1 − α)'),
        note('Working of NPN in CE: the forward-biased base–emitter junction injects electrons into the thin base. Very few recombine there (small IB). Most are swept across the reverse-biased collector junction, giving a large IC.'));
}

function characteristics(panel) {
    const st = { VBB: 2, RB: 47000, VCC: 12, RC: 1000, beta: 150 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const render = () => {
        const { VBB, RB, VCC, RC, beta } = st;
        const IB = Math.max(0, (VBB - 0.7) / RB);
        // solve IC on the load line: VCE = VCC − IC·RC and IC = icOf(IB, VCE)
        let lo = 0;
        let hi = VCC;
        for (let k = 0; k < 60; k++) { const vce = (lo + hi) / 2; if (icOf(IB, vce, beta) > (VCC - vce) / RC) hi = vce; else lo = vce; }
        const VCE = (lo + hi) / 2;
        const IC = (VCC - VCE) / RC;
        const region = IB <= 0 ? 'Cut-off' : VCE < 0.3 ? 'Saturation' : 'Active';
        fig.replaceChildren(svgBox(560, 230, vsource(50, 70, 190, 'VBB', { valueText: `${VBB} V` }), wire([50, 70], [80, 70]), resistor(80, 70, 200, 70, 'RB', { valueText: eng(RB, 'Ω') }), wire([200, 70], [260, 110]),
            s('circle', { cx: 290, cy: 120, r: 30, class: 'c-body' }), s('line', { x1: 270, y1: 100, x2: 270, y2: 140, class: 'c-wire' }), wire([260, 110], [270, 120]), s('line', { x1: 270, y1: 112, x2: 300, y2: 92, class: 'c-wire' }), s('line', { x1: 270, y1: 128, x2: 300, y2: 148, class: 'c-wire' }), s('path', { d: 'M292 140 l9 9 l-12 2 z', class: 'c-diode__tri' }),
            wire([300, 92], [300, 60], [400, 60]), resistor(400, 60, 400, 20, '', {}), label(420, 44, `RC ${eng(RC, 'Ω')}`, 'c-value', 'start'), wire([400, 20], [480, 20]), vsource(480, 20, 190, '', {}), label(510, 110, `VCC ${VCC} V`, 'c-value', 'start'),
            wire([300, 148], [300, 190]), wire([50, 190], [480, 190]), ground(300, 190),
            label(240, 220, `IB = ${eng(IB, 'A')}    IC = ${eng(IC, 'A')}    VCE = ${VCE.toFixed(2)} V    → ${region}`, 'c-current')));
        const ibs = [10, 20, 30, 40, 50, 60].map(u => u * 1e-6);
        const series = ibs.map((ib, i) => ({ points: Array.from({ length: 121 }, (_, k) => { const v = (k / 120) * VCC * 1.2; return [v, icOf(ib, v, beta) * 1000]; }), label: `IB = ${ib * 1e6} µA`, color: ['#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'][i], width: 1.6, labelPos: 0.97 }));
        series.push({ points: [[0, (VCC / RC) * 1000], [VCC, 0]], label: 'load line', color: '#f59e0b', width: 2.4, dashed: true, labelPos: 0.1 });
        const inputCurves = [1, 5, 10].map((vce, i) => ({ points: Array.from({ length: 81 }, (_, k) => { const v = (k / 80) * 0.9; return [v, Math.max(0, 1e-15 * (Math.exp((v - 0.004 * vce) / 0.02585) - 1)) * 1e6]; }), label: `VCE = ${vce} V`, color: ['#0e7490', '#0891b2', '#22d3ee'][i], labelPos: 0.98 }));
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Base current IB', eng(IB, 'A'), '(VBB − 0.7) / RB'), tile('Collector current IC', eng(IC, 'A'), region === 'Active' ? `≈ β·IB = ${eng(beta * IB, 'A')}` : region === 'Saturation' ? 'limited by RC' : '≈ 0'), tile('VCE', `${VCE.toFixed(2)} V`, 'VCC − IC·RC'), tile('Region', region)),
            h('div', { class: 'grid-2' },
                h('div', {}, h('h4', {}, 'Input characteristics (IB vs VBE)'), plot({ height: 260, x: { min: 0, max: 0.9, label: 'VBE (V)' }, y: { min: 0, max: 200, label: 'IB (µA)', unit: ' µA' }, series: inputCurves })),
                h('div', {}, h('h4', {}, 'Output characteristics (IC vs VCE) + load line'), plot({ height: 260, x: { min: 0, max: VCC * 1.2, label: 'VCE (V)' }, y: { min: 0, max: Math.max(12, (VCC / RC) * 1000 * 1.1, beta * 60e-6 * 1000 * 1.25), label: 'IC (mA)', unit: ' mA' }, series, markers: [{ x: VCE, y: IC * 1000, label: 'Q-point' }], vlines: [{ x: 0.3, label: 'saturation', color: '#dc2626' }] }))),
            note('Output regions: saturation (left, VCE < ~0.3 V), active (flat part, IC set by IB), cut-off (IB = 0, bottom). Increase VBB or lower RB to push the Q-point into saturation.'));
    };
    panel.append(head('CE configuration: characteristics and load line', 'Common-emitter: input between base and emitter, output between collector and emitter. Change the bias and watch the Q-point move.'),
        h('div', { class: 'row inputs-row' }, [['VBB', 'V', 0], ['RB', 'Ω', 100], ['VCC', 'V', 1], ['RC', 'Ω', 10], ['beta', 'β', 10]].map(([k, u, min]) => num(k === 'beta' ? 'β (gain)' : k, st[k], { unit: u === 'β' ? '' : u, min, onInput: v => { if (!Number.isNaN(v)) { st[k] = v; render(); } } }).el)), fig, out);
    render();
}

function bjtSwitch(panel) {
    const st = { on: false, beta: 100, RC: 330, VCC: 5 };
    const fig = h('div', { class: 'svg-box' });
    const btn = h('button', { type: 'button', class: 'btn', onClick: () => { st.on = !st.on; render(); } });
    const out = h('div');
    const render = () => {
        btn.textContent = st.on ? 'Input LOW (0 V)' : 'Input HIGH (5 V)';
        const IcSat = (st.VCC - 2 - 0.2) / st.RC;
        const IbMin = IcSat / st.beta;
        const RBmax = (5 - 0.7) / IbMin;
        fig.replaceChildren(svgBox(520, 220, label(40, 125, st.on ? '5 V' : '0 V', 'c-node'), wire([60, 120], [90, 120]), resistor(90, 120, 200, 120, 'RB 4.7k'), wire([200, 120], [240, 120]),
            s('circle', { cx: 270, cy: 130, r: 28, class: `c-body ${st.on ? 'sw-on' : ''}` }), s('line', { x1: 252, y1: 110, x2: 252, y2: 150, class: 'c-wire' }), wire([240, 120], [252, 120]), s('line', { x1: 252, y1: 122, x2: 280, y2: 104, class: 'c-wire' }), s('line', { x1: 252, y1: 138, x2: 280, y2: 156, class: 'c-wire' }),
            wire([280, 104], [280, 80]), diode(280, 30, 280, 80, 'LED', { led: true, cls: st.on ? 'is-lit' : '' }), wire([280, 30], [280, 15], [400, 15]), label(420, 20, '+5 V', 'c-node', 'start'), wire([280, 156], [280, 190]), ground(280, 190),
            label(380, 140, st.on ? 'saturated: switch ON, LED lit' : 'cut-off: switch OFF', 'c-current', 'start')));
        out.replaceChildren(h('div', { class: 'grid-3' }, tile('IC(sat)', eng(IcSat, 'A'), '(VCC − V_LED − 0.2) / RC'), tile('Minimum IB', eng(IbMin, 'A'), 'IC(sat) / β'), tile('Largest RB that still saturates', eng(RBmax, 'Ω'), 'design with RB well below this')));
    };
    panel.append(head('Transistor as a switch', 'A microcontroller pin can only give a few mA. A transistor lets that tiny current switch a bigger load like an LED strip, relay or motor.'), btn, fig, out);
    render();
}

function mosfet(panel) {
    const st = { VGS: 4, Vth: 2, k: 0.5 };
    const out = h('div');
    const id = (vgs, vds) => { const ov = vgs - st.Vth; if (ov <= 0) return 0; return vds < ov ? st.k * (2 * ov * vds - vds * vds) : st.k * ov * ov * (1 + 0.02 * vds); };
    const render = () => {
        const transfer = Array.from({ length: 101 }, (_, k) => { const v = (k / 100) * 8; return [v, id(v, 10) * 1000]; });
        const outs = [3, 4, 5, 6].map((vg, i) => ({ points: Array.from({ length: 101 }, (_, k) => { const v = (k / 100) * 10; return [v, id(vg, v) * 1000]; }), label: `VGS = ${vg} V`, color: ['#94a3b8', '#64748b', '#334155', '#0f172a'][i], width: 1.6, labelPos: 0.97 }));
        const boundary = Array.from({ length: 41 }, (_, k) => { const ov = (k / 40) * 4; return [ov, st.k * ov * ov * 1000]; });
        outs.push({ points: boundary, label: 'VDS = VGS − Vth', color: '#dc2626', dashed: true, labelPos: 0.5 });
        out.replaceChildren(h('div', { class: 'grid-2' },
            h('div', {}, h('h4', {}, 'Transfer characteristic (ID vs VGS)'), plot({ height: 250, x: { min: 0, max: 8, label: 'VGS (V)' }, y: { min: 0, max: st.k * 36 * 1000 * 1.1, label: 'ID (mA)' }, series: [{ points: transfer, color: '#0e7490', label: 'ID' }], vlines: [{ x: st.Vth, label: `Vth = ${st.Vth} V`, color: '#dc2626' }], markers: [{ x: st.VGS, y: id(st.VGS, 10) * 1000, label: `${eng(id(st.VGS, 10), 'A')}` }] })),
            h('div', {}, h('h4', {}, 'Output characteristics (ID vs VDS)'), plot({ height: 250, x: { min: 0, max: 10, label: 'VDS (V)' }, y: { min: 0, max: st.k * 16 * 1000 * 1.15, label: 'ID (mA)' }, series: outs }))),
            formula('Cut-off: VGS < Vth → ID = 0      Ohmic: ID = k[2(VGS − Vth)VDS − VDS²]      Saturation: ID = k(VGS − Vth)²'),
            table(['', 'BJT', 'MOSFET'], [['Controlled by', 'Base current', 'Gate voltage (almost no gate current)'], ['Input impedance', 'Low (kΩ)', 'Very high (MΩ – GΩ)'], ['Carriers', 'Electrons and holes (bipolar)', 'One type (unipolar)'], ['Used in', 'Analog amplifiers', 'Every CPU and memory chip (CMOS), power switches, chargers']]));
    };
    panel.append(head('MOSFET', 'Metal-Oxide-Semiconductor FET. The gate is insulated by a thin oxide layer, so it is controlled by voltage. An n-channel enhancement MOSFET is OFF until VGS passes the threshold Vth, which creates a conducting channel.'),
        h('div', { class: 'row inputs-row' }, slider('VGS', st.VGS, { min: 0, max: 8, step: 0.1, unit: ' V', format: v => v.toFixed(1), onInput: v => { st.VGS = v; render(); } }).el, slider('Threshold Vth', st.Vth, { min: 1, max: 4, step: 0.1, unit: ' V', format: v => v.toFixed(1), onInput: v => { st.Vth = v; render(); } }).el), out,
        h('h4', {}, 'Types'), table(['Type', 'Channel at VGS = 0', 'Symbol line'], [['Enhancement', 'None (normally OFF)', 'Broken line'], ['Depletion', 'Exists (normally ON)', 'Solid line']]));
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'transistors', [
        { id: 'construction', label: 'BJT construction & modes', render: construction },
        { id: 'characteristics', label: 'CE characteristics', render: characteristics },
        { id: 'switch', label: 'BJT as a switch', render: bjtSwitch },
        { id: 'mosfet', label: 'MOSFET', render: mosfet }
    ], tab);
}
