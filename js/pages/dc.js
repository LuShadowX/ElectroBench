// DC circuits: basic quantities, Ohm, KCL/KVL, dividers, series–parallel, star–delta,
// mesh and nodal analysis, Thevenin, Norton, superposition, maximum power transfer.

import { h, table, note } from '../core/ui.js';
import { pageTabs, num, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';
import { wire, dot, label, resistor, vsource, ground, arrow, svgBox } from '../core/draw.js';

export const intro = 'Everything you need to analyse a resistive DC circuit, from Ohm\'s law up to network theorems. Every circuit here is solved live: change a value and every voltage and current updates.';

/* ---------- the two-source network used by several tabs ----------
   V1 —R1— A —R3— V2, with R2 from node A to ground */
export function solveNetwork({ V1, V2, R1, R2, R3 }) {
    const VA = (V1 / R1 + V2 / R3) / (1 / R1 + 1 / R2 + 1 / R3);
    const I1 = (V1 - VA) / R1; // left source → node A
    const I3 = (V2 - VA) / R3; // right source → node A
    const I2 = VA / R2; // node A → ground
    return { VA, I1, I2, I3 };
}

function networkDiagram(p, r, { hideR2 = false, loadLabel = 'R2' } = {}) {
    const top = 50;
    const bot = 210;
    return svgBox(560, 260,
        wire([60, top], [60, top]), vsource(60, top, bot, 'V1', { valueText: `${p.V1} V` }),
        wire([60, top], [130, top]), resistor(130, top, 230, top, 'R1', { valueText: `${p.R1} Ω` }), wire([230, top], [260, top]),
        dot(260, top), label(260, top - 26, `A ${r ? `(${r.VA.toFixed(2)} V)` : ''}`, 'c-node'),
        hideR2 ? [label(260, 140, 'open', 'c-value'), s2(260, top, 260, 100), s2(260, 175, 260, bot)] : [wire([260, top], [260, 80]), resistor(260, 80, 260, 180, loadLabel, { valueText: `${p.R2} Ω` }), wire([260, 180], [260, bot])],
        wire([260, top], [290, top]), resistor(290, top, 390, top, 'R3', { valueText: `${p.R3} Ω` }), wire([390, top], [460, top]),
        vsource(460, top, bot, '', { valueText: '' }), label(492, 128, 'V2', 'c-name', 'start'), label(492, 144, `${p.V2} V`, 'c-value', 'start'),
        wire([60, bot], [460, bot]), dot(260, bot), ground(260, bot),
        r ? [arrow(60, 100, r.I1 >= 0 ? 'up' : 'down', `I1 = ${eng(Math.abs(r.I1), 'A')}`), !hideR2 ? arrow(260, 200, r.I2 >= 0 ? 'down' : 'up', `I2 = ${eng(Math.abs(r.I2), 'A')}`) : null, arrow(460, 100, r.I3 >= 0 ? 'up' : 'down', `I3 = ${eng(Math.abs(r.I3), 'A')}`)] : null);
}
const s2 = (x1, y1, x2, y2) => wire([x1, y1], [x2, y2]);

function networkInputs(params, onChange) {
    const fields = [['V1', 'V'], ['R1', 'Ω'], ['R2', 'Ω'], ['R3', 'Ω'], ['V2', 'V']].map(([key, unit]) => num(key, params[key], {
        unit, min: key.startsWith('R') ? 0.001 : -1000, onInput: v => { if (!Number.isNaN(v)) { params[key] = v; onChange(); } }
    }));
    return h('div', { class: 'row inputs-row' }, fields.map(f => f.el));
}

/* ---------- tabs ---------- */

function basics(panel) {
    const state = { V: 12, I: '', R: 470, P: '' };
    const out = h('div');
    const fields = ['V', 'I', 'R', 'P'].map(k => {
        const input = h('input', { class: 'input mono', type: 'number', value: state[k], placeholder: 'leave blank', 'aria-label': k, style: { width: '140px' } });
        input.addEventListener('input', () => { state[k] = input.value; calc(); });
        return h('label', { class: 'num-field' }, h('span', {}, { V: 'Voltage V (volt)', I: 'Current I (ampere)', R: 'Resistance R (ohm)', P: 'Power P (watt)' }[k]), input);
    });
    const calc = () => {
        const known = Object.entries(state).filter(([, v]) => v !== '' && Number.isFinite(Number(v))).map(([k, v]) => [k, Number(v)]);
        if (known.length !== 2) { out.replaceChildren(h('p', { class: 'note note--warn' }, 'Fill in exactly two values and leave the other two blank.')); return; }
        const k = Object.fromEntries(known);
        let { V, I, R, P } = k;
        const how = [];
        if (V !== undefined && R !== undefined) { I = V / R; P = V * I; how.push('I = V / R', 'P = V × I'); }
        else if (V !== undefined && I !== undefined) { R = V / I; P = V * I; how.push('R = V / I', 'P = V × I'); }
        else if (I !== undefined && R !== undefined) { V = I * R; P = V * I; how.push('V = I × R', 'P = I² × R'); }
        else if (P !== undefined && V !== undefined) { I = P / V; R = V / I; how.push('I = P / V', 'R = V² / P'); }
        else if (P !== undefined && I !== undefined) { V = P / I; R = V / I; how.push('V = P / I', 'R = P / I²'); }
        else if (P !== undefined && R !== undefined) { I = Math.sqrt(P / R); V = I * R; how.push('I = √(P / R)', 'V = √(P × R)'); }
        out.replaceChildren(h('div', { class: 'grid-4' }, tile('Voltage', eng(V, 'V')), tile('Current', eng(I, 'A')), tile('Resistance', eng(R, 'Ω')), tile('Power', eng(P, 'W'))),
            h('p', { class: 'muted' }, 'Used: ', how.join(',  '), `.  Energy in 1 hour = ${eng(P * 3600, 'J')} = ${eng(P / 1000, 'kWh')}.`));
    };
    panel.append(
        head('Basic quantities and Ohm\'s law', 'Ohm\'s law: the current through a conductor is proportional to the voltage across it, V = I × R, as long as temperature and other physical conditions stay constant.'),
        h('div', { class: 'grid-4 defs' }, [['Resistance R', 'Opposition to current. Unit ohm (Ω). R = ρL / A.'], ['Inductance L', 'Opposes change in current, stores energy in a magnetic field. Unit henry (H). E = ½LI².'], ['Capacitance C', 'Stores charge and energy in an electric field. Unit farad (F). Q = CV, E = ½CV².'], ['Power and energy', 'P = VI = I²R = V²/R watts. Energy = P × t joules (or kWh on your electricity bill).']].map(([t, p]) => h('div', { class: 'info-card' }, h('h4', {}, t), h('p', {}, p)))),
        h('h4', {}, 'Calculator: give any two'), h('div', { class: 'row' }, fields), out,
        note('Limitations of Ohm\'s law: it does not apply to non-linear devices like diodes and transistors, to arc lamps or electrolytes, or when temperature changes the resistance.'));
    calc();
}

function kirchhoff(panel) {
    const p = { V1: 12, V2: 6, R1: 100, R2: 220, R3: 150 };
    const fig = h('div', { class: 'svg-box' });
    const checks = h('div');
    const render = () => {
        const r = solveNetwork(p);
        fig.replaceChildren(networkDiagram(p, r));
        const loop1 = p.V1 - r.I1 * p.R1 - r.I2 * p.R2;
        const loop2 = p.V2 - r.I3 * p.R3 - r.I2 * p.R2;
        checks.replaceChildren(
            h('div', { class: 'grid-2' },
                h('div', { class: 'card' }, h('h3', {}, 'KCL at node A'), h('p', {}, 'Current in = current out (charge is conserved).'),
                    formula(`I1 + I3 = I2`), formula(`${eng(r.I1, 'A')} + ${eng(r.I3, 'A')} = ${eng(r.I1 + r.I3, 'A')}`, h('br'), `I2 = ${eng(r.I2, 'A')}`),
                    h('p', { class: 'note note--good' }, `Difference: ${eng(Math.abs(r.I1 + r.I3 - r.I2), 'A')} ✓`)),
                h('div', { class: 'card' }, h('h3', {}, 'KVL around each loop'), h('p', {}, 'The sum of rises and drops around any closed loop is zero (energy is conserved).'),
                    formula(`Left loop: V1 − I1·R1 − I2·R2 = ${p.V1} − ${(r.I1 * p.R1).toFixed(3)} − ${(r.I2 * p.R2).toFixed(3)} = ${(Math.abs(loop1) < 1e-9 ? 0 : loop1).toFixed(6)} V`),
                    formula(`Right loop: V2 − I3·R3 − I2·R2 = ${p.V2} − ${(r.I3 * p.R3).toFixed(3)} − ${(r.I2 * p.R2).toFixed(3)} = ${(Math.abs(loop2) < 1e-9 ? 0 : loop2).toFixed(6)} V`),
                    h('p', { class: 'note note--good' }, 'Both sums are 0 V ✓'))));
    };
    panel.append(head('Kirchhoff\'s laws', 'Change any value. Currents are found by nodal analysis, then both laws are checked numerically.'), networkInputs(p, render), fig, checks);
    render();
}

function dividers(panel) {
    const v = { Vin: 12, Ra: 1000, Rb: 2000, Rc: 3000 };
    const c = { It: 0.03, R1: 100, R2: 300 };
    const vOut = h('div');
    const cOut = h('div');
    const renderV = () => {
        const total = v.Ra + v.Rb + v.Rc;
        vOut.replaceChildren(h('div', { class: 'svg-box' }, svgBox(420, 220, vsource(50, 30, 190, 'Vin', { valueText: `${v.Vin} V` }), wire([50, 30], [200, 30]),
            resistor(200, 30, 200, 80, 'Ra', { valueText: `${eng(v.Vin * v.Ra / total, 'V')}` }), resistor(200, 80, 200, 135, 'Rb', { valueText: `${eng(v.Vin * v.Rb / total, 'V')}` }), resistor(200, 135, 200, 190, 'Rc', { valueText: `${eng(v.Vin * v.Rc / total, 'V')}` }),
            wire([200, 190], [50, 190]))),
            table(['Resistor', 'Formula', 'Voltage'], ['Ra', 'Rb', 'Rc'].map(k => [k, `Vin × ${k} / (Ra + Rb + Rc)`, eng(v.Vin * v[k] / total, 'V')])),
            h('p', { class: 'muted' }, `Check: the three drops add up to ${eng(v.Vin, 'V')} (KVL).`));
    };
    const renderC = () => {
        const i1 = c.It * c.R2 / (c.R1 + c.R2);
        const i2 = c.It * c.R1 / (c.R1 + c.R2);
        cOut.replaceChildren(table(['Branch', 'Formula', 'Current'], [['R1', 'IT × R2 / (R1 + R2)', eng(i1, 'A')], ['R2', 'IT × R1 / (R1 + R2)', eng(i2, 'A')]]),
            h('p', { class: 'muted' }, 'More current takes the path with LESS resistance. Check: I1 + I2 = IT (KCL).'));
    };
    panel.append(head('Voltage and current division', 'Shortcuts for series and parallel circuits, straight from Ohm\'s law and Kirchhoff\'s laws.'),
        h('div', { class: 'grid-2' },
            h('div', { class: 'card' }, h('h3', {}, 'Voltage division (series)'), h('div', { class: 'row inputs-row' }, ['Vin', 'Ra', 'Rb', 'Rc'].map(k => num(k, v[k], { unit: k === 'Vin' ? 'V' : 'Ω', min: 0.001, onInput: x => { if (!Number.isNaN(x)) { v[k] = x; renderV(); } } }).el)), vOut),
            h('div', { class: 'card' }, h('h3', {}, 'Current division (parallel)'), h('div', { class: 'row inputs-row' }, [['It', 'A'], ['R1', 'Ω'], ['R2', 'Ω']].map(([k, u]) => num(k, c[k], { unit: u, min: 0.000001, onInput: x => { if (!Number.isNaN(x)) { c[k] = x; renderC(); } } }).el)), cOut)));
    renderV();
    renderC();
}

// series–parallel expression:  10 + (20 || 30) + 4.7k
export function reduceNetwork(text) {
    const src = text.replace(/\s+/g, '').replace(/∥/g, '||');
    let i = 0;
    const steps = [];
    const fail = (m) => { throw new Error(m); };
    const number = () => {
        const m = /^(\d+(?:\.\d+)?)([kKmM]?)/.exec(src.slice(i));
        if (!m) fail(`Expected a resistor value at position ${i + 1}`);
        i += m[0].length;
        return Number(m[1]) * ({ k: 1e3, K: 1e3, M: 1e6, m: 1e-3 }[m[2]] ?? 1);
    };
    const factor = () => {
        if (src[i] === '(') { i++; const v = expr(); if (src[i] !== ')') fail('Missing ")"'); i++; return v; }
        return number();
    };
    const par = () => {
        let v = factor();
        while (src.startsWith('||', i)) {
            i += 2;
            const w = factor();
            const r = (v * w) / (v + w);
            steps.push(`${eng(v, 'Ω')} ∥ ${eng(w, 'Ω')} = (${+v.toPrecision(4)} × ${+w.toPrecision(4)}) / (${+v.toPrecision(4)} + ${+w.toPrecision(4)}) = ${eng(r, 'Ω')}`);
            v = r;
        }
        return v;
    };
    const expr = () => {
        let v = par();
        while (src[i] === '+') {
            i++;
            const w = par();
            steps.push(`${eng(v, 'Ω')} + ${eng(w, 'Ω')} = ${eng(v + w, 'Ω')}  (series)`);
            v += w;
        }
        return v;
    };
    if (!src) fail('Type a network');
    const total = expr();
    if (i < src.length) fail(`Unexpected "${src[i]}" at position ${i + 1}`);
    return { total, steps };
}

function seriesParallel(panel) {
    const input = h('input', { class: 'input mono big-input', value: '100 + (220 || 330) + (1k || 1k || 1k)', 'aria-label': 'Resistor network' });
    const out = h('div');
    const vIn = num('Applied voltage', 12, { unit: 'V', onInput: () => render() });
    const render = () => {
        try {
            const { total, steps } = reduceNetwork(input.value);
            input.classList.remove('is-bad');
            const V = vIn.value;
            out.replaceChildren(h('ol', { class: 'steps' }, steps.map(st => h('li', { class: 'mono' }, st))),
                h('div', { class: 'grid-3' }, tile('Equivalent resistance', eng(total, 'Ω')), tile('Total current', eng(V / total, 'A')), tile('Total power', eng(V * V / total, 'W'))));
        } catch (err) {
            input.classList.add('is-bad');
            out.replaceChildren(h('p', { class: 'note note--bad' }, err.message));
        }
    };
    input.addEventListener('input', render);
    panel.append(head('Series and parallel simplification', 'Type a network: + means series, || means parallel, brackets group. Values can use k and M (4.7k = 4700 Ω).'),
        h('div', { class: 'row' }, h('div', { style: { flex: 1 } }, input), vIn.el), out,
        h('div', { class: 'grid-2' }, formula('Series: R = R1 + R2 + … (same current)'), formula('Parallel: 1/R = 1/R1 + 1/R2 + … (same voltage)')));
    render();
}

function starDelta(panel) {
    const d = { Rab: 30, Rbc: 60, Rca: 90 };
    const y = { Ra: 10, Rb: 20, Rc: 30 };
    const dOut = h('div');
    const yOut = h('div');
    const tri = (labels) => svgBox(260, 210, wire([130, 30], [130, 30]),
        resistor(130, 30, 40, 175, labels[0], { side: -1 }), resistor(40, 175, 220, 175, labels[1], { side: -1 }), resistor(220, 175, 130, 30, labels[2]),
        dot(130, 30), dot(40, 175), dot(220, 175), label(130, 20, 'A'), label(26, 190, 'B'), label(236, 190, 'C'));
    const star = (labels) => svgBox(260, 210, resistor(130, 105, 130, 20, labels[0]), resistor(130, 105, 40, 180, labels[1], { side: -1 }), resistor(130, 105, 220, 180, labels[2]),
        dot(130, 105), dot(130, 20), dot(40, 180), dot(220, 180), label(130, 12, 'A'), label(26, 196, 'B'), label(236, 196, 'C'), label(146, 110, 'N', 'c-node', 'start'));
    const renderD = () => {
        const sum = d.Rab + d.Rbc + d.Rca;
        const Ra = d.Rab * d.Rca / sum;
        const Rb = d.Rab * d.Rbc / sum;
        const Rc = d.Rbc * d.Rca / sum;
        dOut.replaceChildren(h('div', { class: 'grid-2' }, h('div', { class: 'svg-box' }, tri(['Rab', 'Rbc', 'Rca'])), h('div', { class: 'svg-box' }, star([`Ra = ${eng(Ra, 'Ω')}`, `Rb = ${eng(Rb, 'Ω')}`, `Rc = ${eng(Rc, 'Ω')}`]))),
            formula(`Ra = Rab·Rca / (Rab + Rbc + Rca) = ${d.Rab}·${d.Rca} / ${sum} = ${eng(Ra, 'Ω')}`), formula(`Rb = Rab·Rbc / Σ = ${eng(Rb, 'Ω')}     Rc = Rbc·Rca / Σ = ${eng(Rc, 'Ω')}`));
    };
    const renderY = () => {
        const p = y.Ra * y.Rb + y.Rb * y.Rc + y.Rc * y.Ra;
        yOut.replaceChildren(formula(`Rab = (RaRb + RbRc + RcRa) / Rc = ${p} / ${y.Rc} = ${eng(p / y.Rc, 'Ω')}`), formula(`Rbc = Σ / Ra = ${eng(p / y.Ra, 'Ω')}     Rca = Σ / Rb = ${eng(p / y.Rb, 'Ω')}`));
    };
    panel.append(head('Star–delta transformation', 'Some networks are neither series nor parallel. Converting a Δ (delta) into a Y (star) or back makes them solvable.'),
        h('h4', {}, 'Delta → Star'), h('div', { class: 'row inputs-row' }, Object.keys(d).map(k => num(k, d[k], { unit: 'Ω', min: 0.001, onInput: v => { if (!Number.isNaN(v)) { d[k] = v; renderD(); } } }).el)), dOut,
        h('h4', {}, 'Star → Delta'), h('div', { class: 'row inputs-row' }, Object.keys(y).map(k => num(k, y[k], { unit: 'Ω', min: 0.001, onInput: v => { if (!Number.isNaN(v)) { y[k] = v; renderY(); } } }).el)), yOut,
        note('Memory aid: Δ→Y each star resistor = product of the two delta resistors touching that corner ÷ sum of all three. Equal resistors: R_Y = R_Δ / 3.'));
    renderD();
    renderY();
}

function meshNodal(panel) {
    const p = { V1: 12, V2: 6, R1: 100, R2: 220, R3: 150 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    const render = () => {
        const { V1, V2, R1, R2, R3 } = p;
        const a = R1 + R2;
        const b = -R2;
        const c = -R2;
        const d = R2 + R3;
        const det = a * d - b * c;
        const Ia = (V1 * d - b * -V2) / det;
        const Ib = (a * -V2 - c * V1) / det;
        const r = solveNetwork(p);
        fig.replaceChildren(networkDiagram(p, r));
        out.replaceChildren(h('div', { class: 'grid-2' },
            h('div', { class: 'card' }, h('h3', {}, 'Mesh analysis (KVL)'), h('p', { class: 'muted' }, 'Mesh currents Ia (left) and Ib (right), both clockwise.'),
                formula(`(R1 + R2)·Ia − R2·Ib = V1   →   ${a}·Ia − ${R2}·Ib = ${V1}`),
                formula(`−R2·Ia + (R2 + R3)·Ib = −V2   →   −${R2}·Ia + ${d}·Ib = ${-V2}`),
                formula(`Δ = ${a}·${d} − (${b})·(${c}) = ${det}`),
                formula(`Ia = ${eng(Ia, 'A')}     Ib = ${eng(Ib, 'A')}     I(R2) = Ia − Ib = ${eng(Ia - Ib, 'A')}`)),
            h('div', { class: 'card' }, h('h3', {}, 'Nodal analysis (KCL)'), h('p', { class: 'muted' }, 'One unknown: the voltage VA at node A (ground = 0 V).'),
                formula('(VA − V1)/R1 + VA/R2 + (VA − V2)/R3 = 0'),
                formula(`VA = (V1/R1 + V2/R3) / (1/R1 + 1/R2 + 1/R3) = ${eng(r.VA, 'V')}`),
                formula(`I(R2) = VA / R2 = ${eng(r.I2, 'A')}`),
                h('p', { class: `note ${Math.abs((Ia - Ib) - r.I2) < 1e-9 ? 'note--good' : 'note--bad'}` }, 'Both methods give the same current through R2 ✓'))));
    };
    panel.append(head('Mesh and nodal analysis', 'Two systematic methods that work for any circuit. Mesh uses KVL and loop currents. Nodal uses KCL and node voltages. Same circuit, same answer.'), networkInputs(p, render), fig, out,
        note('Independent sources keep a fixed value (a battery). Dependent sources depend on another voltage or current in the circuit: VCVS, VCCS, CCVS, CCCS (drawn as diamonds). Transistors and op-amps are modelled with dependent sources.'));
    render();
}

function theorems(panel) {
    const p = { V1: 12, V2: 6, R1: 100, R2: 220, R3: 150 };
    const out = h('div');
    const fig = h('div', { class: 'svg-box' });
    const render = () => {
        fig.replaceChildren(networkDiagram(p, null));
        const { V1, V2, R1, R2, R3 } = p;
        const Vth = (V1 * R3 + V2 * R1) / (R1 + R3);
        const Rth = (R1 * R3) / (R1 + R3);
        const IN = Vth / Rth;
        const IL = Vth / (Rth + R2);
        // superposition
        const VA1 = V1 * ((R2 * R3) / (R2 + R3)) / (R1 + (R2 * R3) / (R2 + R3));
        const VA2 = V2 * ((R1 * R2) / (R1 + R2)) / (R3 + (R1 * R2) / (R1 + R2));
        const full = solveNetwork(p);
        // max power
        const pts = [];
        const maxR = Rth * 5;
        for (let k = 1; k <= 120; k++) { const RL = (k / 120) * maxR; pts.push([RL, (Vth ** 2 * RL) / (Rth + RL) ** 2]); }
        const Pmax = Vth ** 2 / (4 * Rth);
        out.replaceChildren(
            h('div', { class: 'grid-2' },
                h('div', { class: 'card' }, h('h3', {}, 'Thevenin equivalent (seen by R2)'),
                    h('ol', { class: 'steps' },
                        h('li', {}, 'Remove the load R2 and find the open-circuit voltage at A: ', h('b', { class: 'mono' }, `Vth = (V1·R3 + V2·R1)/(R1 + R3) = ${eng(Vth, 'V')}`)),
                        h('li', {}, 'Replace sources by short circuits and find the resistance at A: ', h('b', { class: 'mono' }, `Rth = R1 ∥ R3 = ${eng(Rth, 'Ω')}`)),
                        h('li', {}, 'Reconnect the load: ', h('b', { class: 'mono' }, `IL = Vth/(Rth + R2) = ${eng(IL, 'A')}`))),
                    h('div', { class: 'svg-box' }, svgBox(380, 170, vsource(90, 30, 140, 'Vth', { valueText: eng(Vth, 'V') }), wire([90, 30], [130, 30]), resistor(130, 30, 230, 30, 'Rth', { valueText: eng(Rth, 'Ω') }), wire([230, 30], [280, 30]), resistor(280, 30, 280, 140, 'RL = R2', { valueText: `${R2} Ω` }), wire([280, 140], [90, 140])))),
                h('div', { class: 'card' }, h('h3', {}, 'Norton equivalent'),
                    h('p', {}, 'The same circuit as a current source in parallel with a resistor.'),
                    formula(`IN = Vth / Rth = ${eng(IN, 'A')}`), formula(`RN = Rth = ${eng(Rth, 'Ω')}`),
                    formula(`IL = IN · RN/(RN + RL) = ${eng(IN * Rth / (Rth + R2), 'A')}`),
                    h('p', { class: 'note note--good' }, `Matches the full solution: I(R2) = ${eng(full.I2, 'A')} ✓`))),
            h('div', { class: 'card' }, h('h3', {}, 'Superposition theorem'),
                h('p', {}, 'In a linear circuit with several sources, the response is the sum of the responses to each source acting alone (others replaced by their internal resistance: voltage sources shorted).'),
                table(['Case', 'Node voltage VA'], [['V1 alone (V2 shorted)', eng(VA1, 'V')], ['V2 alone (V1 shorted)', eng(VA2, 'V')], ['Sum', eng(VA1 + VA2, 'V')], ['Full circuit (nodal)', eng(full.VA, 'V')]])),
            h('div', { class: 'card' }, h('h3', {}, 'Maximum power transfer'),
                h('p', {}, `The load gets maximum power when RL = Rth = ${eng(Rth, 'Ω')}. Then Pmax = Vth²/(4·Rth) = ${eng(Pmax, 'W')}, at 50% efficiency.`),
                plot({ x: { min: 0, max: maxR, label: 'Load resistance RL (Ω)' }, y: { min: 0, max: Pmax * 1.15, label: 'Power in load (W)', unit: 'W' }, series: [{ points: pts, label: 'P(RL)', color: '#0e7490' }], markers: [{ x: Rth, y: Pmax, label: `max at RL = ${eng(Rth, 'Ω')}` }], vlines: [{ x: R2, label: `current R2 = ${R2} Ω`, color: '#f59e0b' }] })));
    };
    panel.append(head('Network theorems', 'Thevenin, Norton, superposition and maximum power transfer, all on the same two-source circuit so you can see they agree.'), networkInputs(p, render), fig, out);
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'dc', [
        { id: 'basics', label: 'Basics & Ohm\'s law', render: basics },
        { id: 'kirchhoff', label: 'KCL & KVL', render: kirchhoff },
        { id: 'dividers', label: 'Divider rules', render: dividers },
        { id: 'series', label: 'Series–parallel', render: seriesParallel },
        { id: 'stardelta', label: 'Star–delta', render: starDelta },
        { id: 'mesh', label: 'Mesh & nodal', render: meshNodal },
        { id: 'theorems', label: 'Theorems', render: theorems }
    ], tab);
}
