// Electrical machines: transformer (incl. DC input), DC motor, induction motor, Fleming's rules.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, slider, tile, formula, head, eng } from '../core/page.js';

export const intro = 'Machines turn electrical energy into motion (motors), motion into electricity (generators), or one AC voltage into another (transformers). All of them rest on electromagnetic induction.';

/* ---------- transformer ---------- */
function transformer(panel) {
    const st = { N1: 400, N2: 100, V1: 230, RL: 20, dc: false };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    let t = 0;
    let running = true;
    const coil = (x, n, side) => {
        const turns = Math.max(3, Math.min(14, Math.round(n / 40)));
        const els = [];
        for (let k = 0; k < turns; k++) {
            const y = 60 + (k * 140) / turns;
            els.push(s('ellipse', { cx: x, cy: y + 5, rx: 22, ry: 5, class: `tf-turn tf-turn--${side}` }));
        }
        return els;
    };
    const draw = () => {
        if (!running) return;
        t += 0.12;
        const flux = st.dc ? 0 : Math.sin(t);
        fig.replaceChildren(s('svg', { viewBox: '0 0 520 260', class: 'circuit', role: 'img', 'aria-label': 'Transformer' },
            s('rect', { x: 120, y: 40, width: 280, height: 180, rx: 10, class: 'tf-core' }), s('rect', { x: 160, y: 80, width: 200, height: 100, rx: 6, fill: '#fff' }),
            s('rect', { x: 120, y: 40, width: 280, height: 180, rx: 10, fill: 'none', stroke: st.dc ? '#cbd5e1' : '#f59e0b', 'stroke-width': 6, 'stroke-dasharray': '14 10', 'stroke-dashoffset': -t * 18 * Math.sign(flux || 1), opacity: Math.abs(flux) }),
            ...coil(140, st.N1, 'p'), ...coil(380, st.N2, 'p'),
            s('text', { x: 140, y: 238, 'text-anchor': 'middle', class: 'c-label' }, `N1 = ${st.N1}`), s('text', { x: 380, y: 238, 'text-anchor': 'middle', class: 'c-label' }, `N2 = ${st.N2}`),
            s('text', { x: 60, y: 130, 'text-anchor': 'middle', class: 'c-label' }, st.dc ? `${st.V1} V DC` : `${st.V1} V AC`), s('line', { x1: 90, y1: 70, x2: 118, y2: 70, class: 'c-wire' }), s('line', { x1: 90, y1: 190, x2: 118, y2: 190, class: 'c-wire' }),
            s('text', { x: 460, y: 130, 'text-anchor': 'middle', class: 'c-label' }, `${st.dc ? 0 : (st.V1 * st.N2 / st.N1).toFixed(1)} V`), s('line', { x1: 402, y1: 70, x2: 430, y2: 70, class: 'c-wire' }), s('line', { x1: 402, y1: 190, x2: 430, y2: 190, class: 'c-wire' }),
            s('text', { x: 260, y: 30, 'text-anchor': 'middle', class: 'c-value' }, st.dc ? 'steady flux: no change, so no induced voltage' : 'alternating magnetic flux Φ in the iron core')));
        setTimeout(() => requestAnimationFrame(draw), 50);
    };
    const render = () => {
        const k = st.N2 / st.N1;
        const V2 = st.dc ? 0 : st.V1 * k;
        const I2 = V2 / st.RL;
        const I1 = I2 * k;
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Turns ratio K = N2/N1', k.toFixed(3), k > 1 ? 'step-up' : k < 1 ? 'step-down' : 'isolation (1:1)'), tile('Secondary voltage V2', eng(V2, 'V'), 'V2 = V1 × N2/N1'), tile('Secondary current I2', eng(I2, 'A'), `V2 / RL (RL = ${st.RL} Ω)`), tile('Primary current I1', st.dc ? 'very large!' : eng(I1, 'A'), 'I1 = I2 × N2/N1')),
            st.dc ? h('p', { class: 'note note--bad' }, h('b', {}, 'Transformer on DC: '), 'DC makes a constant flux, so dΦ/dt = 0 and NO voltage is induced in the secondary. The primary winding has very low resistance, so a huge current flows and it overheats and burns. Never connect a transformer to DC.')
                : h('p', { class: 'note note--good' }, `Ideal transformer: power in = power out. V1·I1 = ${eng(st.V1 * I1, 'W')} = V2·I2 = ${eng(V2 * I2, 'W')}.`),
            formula('V2/V1 = N2/N1 = I1/I2 = K       e = −N dΦ/dt  (Faraday\'s law of mutual induction)'));
    };
    panel.append(head('Transformer', 'Two coils on one iron core. AC in the primary creates a changing flux, and that flux induces a voltage in the secondary: mutual induction. The ratio of turns sets the ratio of voltages.'),
        h('div', { class: 'row inputs-row' },
            slider('Primary turns N1', st.N1, { min: 50, max: 1000, step: 10, onInput: v => { st.N1 = v; render(); } }).el,
            slider('Secondary turns N2', st.N2, { min: 50, max: 1000, step: 10, onInput: v => { st.N2 = v; render(); } }).el,
            slider('Input voltage V1', st.V1, { min: 10, max: 440, step: 5, unit: ' V', onInput: v => { st.V1 = v; render(); } }).el,
            h('label', { class: 'row' }, h('input', { type: 'checkbox', onChange: e => { st.dc = e.target.checked; render(); } }), 'Connect to DC instead of AC')),
        fig, out,
        h('h4', {}, 'Special transformers'),
        h('div', { class: 'info-cards' },
            [['Auto-transformer', 'A single winding with a sliding tap. Part of the winding is shared by both sides, so it is smaller and cheaper. Used in variacs and voltage stabilisers. No electrical isolation.'],
                ['Current transformer (CT)', 'Steps a large line current down to a small, safe value (e.g. 1000 A → 5 A) so ordinary meters and relays can measure it.'],
                ['Potential transformer (PT)', 'Steps a high voltage down (e.g. 11 kV → 110 V) for measurement and protection.'],
                ['Applications', 'Mobile chargers and adapters (step-down), power stations (step-up for transmission), isolation for safety, impedance matching in audio.']]
                .map(([tt, p]) => h('div', { class: 'info-card' }, h('h4', {}, tt), h('p', {}, p)))));
    render();
    draw();
    return () => { running = false; };
}

/* ---------- DC motor ---------- */
function dcMotor(panel) {
    const st = { V: 220, flux: 1, Ra: 0.5, load: 20, starter: 0 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    let angle = 0;
    let running = true;
    let speed = 0;
    const k = 1.8; // machine constant (Eb = k·Φ·ω)
    const solve = () => {
        // Torque = k·Φ·Ia = load torque → Ia = load / (kΦ);  Eb = V − Ia(Ra + Rstarter);  ω = Eb / (kΦ)
        const Rt = st.Ra + st.starter;
        const Ia = st.load / (k * st.flux);
        const Eb = Math.max(0, st.V - Ia * Rt);
        const w = Eb / (k * st.flux);
        return { Ia, Eb, w, rpm: (w * 60) / (2 * Math.PI), Istart: st.V / Rt };
    };
    const draw = () => {
        if (!running) return;
        const r = solve();
        speed += (r.rpm - speed) * 0.05;
        angle += speed / 600;
        const rot = (deg) => `rotate(${deg} 260 130)`;
        fig.replaceChildren(s('svg', { viewBox: '0 0 520 260', class: 'circuit', role: 'img', 'aria-label': 'DC motor' },
            s('path', { d: 'M150 50 h60 v160 h-60 a30 30 0 0 1 0 -160z', class: 'mt-pole mt-pole--n' }), s('text', { x: 172, y: 136, class: 'mt-pole-label' }, 'N'),
            s('path', { d: 'M370 50 h-60 v160 h60 a30 30 0 0 0 0 -160z', class: 'mt-pole mt-pole--s' }), s('text', { x: 336, y: 136, class: 'mt-pole-label' }, 'S'),
            ...[0, 1, 2, 3, 4].map(i => s('line', { x1: 214, y1: 70 + i * 30, x2: 306, y2: 70 + i * 30, class: 'mt-field', opacity: st.flux })),
            s('g', { transform: rot((angle * 180) / Math.PI) },
                s('circle', { cx: 260, cy: 130, r: 46, class: 'mt-rotor' }),
                s('rect', { x: 255, y: 86, width: 10, height: 88, rx: 3, class: 'mt-coil' }),
                s('circle', { cx: 260, cy: 92, r: 6, class: 'mt-dot' }), s('text', { x: 260, y: 176, 'text-anchor': 'middle', class: 'mt-x' }, '×')),
            s('text', { x: 260, y: 245, 'text-anchor': 'middle', class: 'c-label' }, `${Math.round(speed)} rpm`)));
        setTimeout(() => requestAnimationFrame(draw), 33);
    };
    const render = () => {
        const r = solve();
        out.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Armature current Ia', eng(r.Ia, 'A'), 'set by the load torque'), tile('Back EMF Eb', eng(r.Eb, 'V'), 'Eb = V − Ia·(Ra + starter)'), tile('Speed', `${Math.round(r.rpm)} rpm`, 'N ∝ Eb / Φ'), tile('Current at the instant of starting', eng(r.Istart, 'A'), 'Eb = 0 when not rotating')),
            r.Istart > 100 ? h('p', { class: 'note note--bad' }, `Starting current would be ${eng(r.Istart, 'A')}, which would burn the armature. That is why a starter adds resistance at start-up and removes it as the motor speeds up and Eb builds. Try raising the starter resistance.`) : h('p', { class: 'note note--good' }, 'Starting current is limited by the starter resistance.'),
            formula('V = Eb + Ia·Ra        Eb = PΦZN / 60A        T ∝ Φ·Ia        N ∝ (V − Ia·Ra) / Φ'));
    };
    panel.append(head('DC motor', 'A current-carrying conductor in a magnetic field feels a force (Fleming\'s left-hand rule). The commutator reverses the current every half turn so the armature keeps turning the same way.'),
        h('div', { class: 'row inputs-row' },
            slider('Supply voltage V', st.V, { min: 0, max: 250, step: 5, unit: ' V', onInput: v => { st.V = v; render(); } }).el,
            slider('Field flux Φ (field control)', st.flux, { min: 0.4, max: 1.4, step: 0.05, format: v => v.toFixed(2), onInput: v => { st.flux = v; render(); } }).el,
            slider('Load torque', st.load, { min: 0, max: 80, step: 1, unit: ' N·m', onInput: v => { st.load = v; render(); } }).el,
            slider('Starter resistance', st.starter, { min: 0, max: 10, step: 0.5, unit: ' Ω', onInput: v => { st.starter = v; render(); } }).el),
        h('div', { class: 'split' }, fig, out),
        h('h4', {}, 'Speed control'),
        table(['Method', 'How', 'Effect'], [['Armature voltage control', 'Change V (or add resistance in the armature)', 'Speed below rated speed'], ['Field (flux) control', 'Weaken Φ with a field rheostat', 'Speed ABOVE rated speed (N ∝ 1/Φ). Try lowering Φ above.']]),
        h('h4', {}, 'Types and applications'),
        table(['Type', 'Field connection', 'Character', 'Used in'], [['Series', 'Field in series with armature', 'Very high starting torque, speed varies with load', 'Electric trains, cranes, hoists'], ['Shunt', 'Field in parallel with armature', 'Nearly constant speed', 'Lathes, fans, conveyors'], ['Compound', 'Both series and shunt fields', 'Good starting torque and steady speed', 'Presses, rolling mills, elevators']]));
    render();
    draw();
    return () => { running = false; };
}

/* ---------- induction motor ---------- */
function induction(panel) {
    const st = { f: 50, P: 4, slip: 4 };
    const fig = h('div', { class: 'svg-box' });
    const out = h('div');
    let t = 0;
    let rotor = 0;
    let running = true;
    const draw = () => {
        if (!running) return;
        t += 0.05;
        const field = t * (st.f / 50) * (4 / st.P);
        rotor += 0.05 * (st.f / 50) * (4 / st.P) * (1 - st.slip / 100);
        const coils = [0, 120, 240].map((a, i) => {
            const strength = Math.cos(t * (st.f / 50) * (4 / st.P) * (st.P / 2) - (i * 2 * Math.PI) / 3);
            const r = (a * Math.PI) / 180;
            return s('g', {}, s('rect', { x: 260 + Math.cos(r) * 100 - 14, y: 130 - Math.sin(r) * 100 - 14, width: 28, height: 28, rx: 6, fill: ['#dc2626', '#ca8a04', '#2563eb'][i], opacity: 0.25 + 0.75 * Math.abs(strength) }),
                s('text', { x: 260 + Math.cos(r) * 100, y: 135 - Math.sin(r) * 100, 'text-anchor': 'middle', class: 'mt-pole-label', style: 'font-size:13px' }, ['R', 'Y', 'B'][i]));
        });
        fig.replaceChildren(s('svg', { viewBox: '0 0 520 260', class: 'circuit', role: 'img', 'aria-label': 'Rotating magnetic field' },
            s('circle', { cx: 260, cy: 130, r: 118, class: 'im-stator' }), ...coils,
            s('line', { x1: 260, y1: 130, x2: 260 + Math.cos(field) * 80, y2: 130 - Math.sin(field) * 80, class: 'im-field' }),
            s('g', { transform: `rotate(${(-rotor * 180) / Math.PI} 260 130)` }, s('circle', { cx: 260, cy: 130, r: 52, class: 'mt-rotor' }), ...[0, 60, 120].map(a => s('line', { x1: 260, y1: 80, x2: 260, y2: 180, class: 'im-bar', transform: `rotate(${a} 260 130)` }))),
            s('text', { x: 20, y: 24, class: 'c-value' }, 'orange arrow: rotating magnetic field (synchronous speed)'), s('text', { x: 20, y: 244, class: 'c-value' }, 'grey rotor: always a little slower (slip)')));
        setTimeout(() => requestAnimationFrame(draw), 40);
    };
    const render = () => {
        const Ns = (120 * st.f) / st.P;
        const N = Ns * (1 - st.slip / 100);
        out.replaceChildren(h('div', { class: 'grid-3' }, tile('Synchronous speed Ns', `${Math.round(Ns)} rpm`, 'Ns = 120 f / P'), tile('Rotor speed N', `${Math.round(N)} rpm`, 'N = Ns (1 − s)'), tile('Slip s', `${st.slip}%`, 's = (Ns − N) / Ns')),
            note('Why the rotor can never reach Ns: if it did, the field would not cut the rotor bars, no current would be induced, and there would be no torque. Some slip (usually 2–6%) is always needed.'));
    };
    panel.append(head('Induction motor', 'Three-phase currents in the stator create a magnetic field that rotates at synchronous speed. It induces currents in the rotor bars, and the rotor follows the field. This is the most used motor in the world.'),
        h('div', { class: 'row inputs-row' },
            slider('Supply frequency f', st.f, { min: 25, max: 60, step: 5, unit: ' Hz', onInput: v => { st.f = v; render(); } }).el,
            slider('Poles P', st.P, { min: 2, max: 8, step: 2, onInput: v => { st.P = v; render(); } }).el,
            slider('Slip', st.slip, { min: 1, max: 15, step: 1, unit: '%', onInput: v => { st.slip = v; render(); } }).el),
        h('div', { class: 'split' }, fig, out),
        h('h4', {}, 'Single-phase vs three-phase'),
        table(['', 'Single-phase induction motor', 'Three-phase induction motor'], [['Starting', 'Not self-starting: needs an auxiliary winding and a capacitor (capacitor-start) to create a rotating field', 'Self-starting'], ['Rating', 'Small (fractional kW)', 'Large (kW to MW)'], ['Applications', 'Fans, mixers, washing machines, pumps at home', 'Industrial pumps, compressors, lifts, conveyors, lathes']]),
        h('h4', {}, 'Applications of AC motors'), h('div', { class: 'row' }, ['Ceiling fans', 'Water pumps', 'Air conditioners', 'Lifts and escalators', 'Industrial conveyors', 'Electric vehicles (induction and synchronous motors)'].map(x => h('span', { class: 'chip' }, x))));
    render();
    draw();
    return () => { running = false; };
}

/* ---------- Fleming's rules ---------- */
const DIRS = { right: [1, 0, 0], left: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0], out: [0, 0, 1], in: [0, 0, -1] };
const NAMES = { right: '→ right', left: '← left', up: '↑ up', down: '↓ down', out: '⊙ out of the page', in: '⊗ into the page' };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nameOf = (v) => Object.entries(DIRS).find(([, d]) => d.every((x, i) => x === v[i]))?.[0];

function fleming(panel) {
    const st = { rule: 'left', a: 'right', b: 'in' };
    const out = h('div');
    const sel = (key, label) => h('label', { class: 'num-field' }, h('span', {}, label), h('select', { class: 'select', onChange: e => { st[key] = e.target.value; render(); } }, Object.keys(DIRS).map(d => h('option', { value: d, selected: st[key] === d }, NAMES[d]))));
    const box = h('div');
    const render = () => {
        const left = st.rule === 'left';
        // motor: F = I × B ; generator: I = v × B
        const A = DIRS[st.a];
        const B = DIRS[st.b];
        const r = cross(A, B);
        const name = nameOf(r);
        const arrowSvg = (dir, color, text, cx) => {
            const v = DIRS[dir] ?? [0, 0, 0];
            let shape;
            if (v[2] === 1) shape = [s('circle', { cx, cy: 80, r: 22, fill: 'none', stroke: color, 'stroke-width': 3 }), s('circle', { cx, cy: 80, r: 5, fill: color })];
            else if (v[2] === -1) shape = [s('circle', { cx, cy: 80, r: 22, fill: 'none', stroke: color, 'stroke-width': 3 }), s('path', { d: `M${cx - 12} 68 l24 24 M${cx + 12} 68 l-24 24`, stroke: color, 'stroke-width': 3 })];
            else if (dir) shape = [s('line', { x1: cx - v[0] * 32, y1: 80 + v[1] * 32, x2: cx + v[0] * 32, y2: 80 - v[1] * 32, stroke: color, 'stroke-width': 4 }), s('circle', { cx: cx + v[0] * 32, cy: 80 - v[1] * 32, r: 6, fill: color })];
            else shape = [s('text', { x: cx, y: 86, 'text-anchor': 'middle', class: 'c-label' }, '0')];
            return s('g', {}, ...shape, s('text', { x: cx, y: 140, 'text-anchor': 'middle', class: 'c-label', fill: color }, text));
        };
        box.replaceChildren(s('svg', { viewBox: '0 0 480 160', class: 'circuit', role: 'img' },
            arrowSvg(st.a, '#2563eb', left ? 'Current I (middle finger)' : 'Motion v (thumb)', 80),
            arrowSvg(st.b, '#16a34a', 'Field B (first finger)', 240),
            arrowSvg(name, '#dc2626', left ? 'Force F (thumb)' : 'Induced current I (middle finger)', 400)));
        out.replaceChildren(name
            ? h('p', { class: 'note note--good' }, left ? `The conductor is pushed ${NAMES[name]}.` : `The induced current flows ${NAMES[name]}.`)
            : h('p', { class: 'note note--warn' }, 'The two directions are parallel, so there is no force / no induced current. They must be at right angles.'),
            formula(left ? 'F = B·I·L   (direction: F = I × B)' : 'e = B·L·v   (direction: I along v × B)'));
    };
    const ruleSeg = h('div', { class: 'seg' }, [['left', 'Left-hand rule (motor)'], ['right', 'Right-hand rule (generator)']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.rule = id; [...ruleSeg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id)); inputs.replaceChildren(sel('a', id === 'left' ? 'Current I' : 'Motion v'), sel('b', 'Magnetic field B (N → S)')); render(); } }, l)));
    ruleSeg.children[0].setAttribute('aria-pressed', 'true');
    const inputs = h('div', { class: 'row inputs-row' }, sel('a', 'Current I'), sel('b', 'Magnetic field B (N → S)'));
    panel.append(head('Fleming\'s rules', 'Hold your thumb, first finger and middle finger at right angles. First finger = Field, seCond finger = Current, thuMb = Motion. Left hand for motors, right hand for generators.'),
        ruleSeg, inputs, h('div', { class: 'svg-box' }, box), out);
    render();
}

export function render(page, { tab }) {
    const cleanups = [];
    const view = pageTabs(page, 'machines', [
        { id: 'transformer', label: 'Transformer', render: (p) => cleanups.push(transformer(p)) },
        { id: 'dcmotor', label: 'DC motor', render: (p) => cleanups.push(dcMotor(p)) },
        { id: 'induction', label: 'Induction motor', render: (p) => cleanups.push(induction(p)) },
        { id: 'fleming', label: 'Fleming\'s rules', render: fleming }
    ], tab);
    return { ...view, cleanup: () => cleanups.forEach(fn => fn()) };
}
