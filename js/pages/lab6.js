// Experiment 6: JK flip-flop from NAND gates (7400 + 7410), including the race-around condition.

import { h, table, note } from '../core/ui.js';
import { formula } from '../core/page.js';
import { labPage } from '../core/lab.js';
import { drawIC } from '../core/ic.js';
import { Circuit, OPS } from '../core/logic.js';
import { renderSchematic } from '../core/schematic.js';
import { timing } from './sequential.js';

export const intro = 'Build a JK flip-flop from one 7410 and one 7400, verify its truth table with short clock pulses, and see the race-around condition when the clock is held high.';

// 7410 gate 1 (pins 1, 2, 13 → 12) and gate 2 (3, 4, 5 → 6) are the steering gates.
// 7400 gate 1 (1, 2 → 3) gives Q and gate 2 (4, 5 → 6) gives Q'.
export const JK_NET = {
    inputs: ['J', 'K', 'CLK'],
    gates: [{ id: 'gj', type: 'NAND', in: ['J', 'CLK', 'Qb'], init: 1 }, { id: 'gk', type: 'NAND', in: ['K', 'CLK', 'Q'], init: 1 }, { id: 'Q', type: 'NAND', in: ['gj', 'Qb'] }, { id: 'Qb', type: 'NAND', in: ['gk', 'Q'], init: 1 }],
    outputs: [{ name: 'Q', from: 'Q' }, { name: "Q'", from: 'Qb' }]
};

// Settle; if the latch is left in the symmetric Q = Q' state, let real-world timing
// differences break the tie (a few in-order passes), like the Circuit constructor does.
function settleLatch(c) {
    if (c.settle().stable) return;
    for (let k = 0; k < 4; k++) c.gates.forEach(g => { c.values[g.id] = OPS[g.type](g.in.map(sig => c.get(sig))) ? 1 : 0; });
    c.settle();
}

export const expectJK = (j, k, q) => (j && k ? 1 - q : j ? 1 : k ? 0 : q);

const WIRING = [['Switch J', '7410 pin 1'], ['Switch K', '7410 pin 3'], ['Clock (pulser)', '7410 pins 2 and 4'], ['7410 pin 12 (gate 1 out)', '7400 pin 1'], ['7410 pin 6 (gate 2 out)', '7400 pin 4'], ['7400 pin 3 (Q)', '7400 pin 5, 7410 pin 5, LED "Q"'], ['7400 pin 6 (Q\')', '7400 pin 2, 7410 pin 13, LED "Q\'"'], ['Pin 14 of both ICs', '+5 V'], ['Pin 7 of both ICs', 'GND']];

export const def = {
    id: 'lab6', num: 6,
    aim: 'To construct a JK flip-flop using NAND gates (ICs 7400 and 7410), verify its truth table, and observe the race-around condition.',
    apparatus: [['IC 7400', 'Quad 2-input NAND', '1'], ['IC 7410', 'Triple 3-input NAND', '1'], ['Digital trainer kit', '+5 V, logic switches, pulser, LEDs', '1'], ['Breadboard', 'Standard', '1'], ['Connecting wires', 'Single strand', 'As required']],
    theory: [
        h('p', {}, 'The JK flip-flop removes the invalid state of the SR flip-flop. Q is fed back to the K steering gate and Q\' to the J steering gate, so when J = K = 1 the flip-flop ', h('b', {}, 'toggles'), '.'),
        formula('Characteristic equation: Q(n+1) = J·Q\'(n) + K\'·Q(n)'),
        h('p', {}, h('b', {}, 'Race-around condition: '), 'with J = K = 1, if the clock stays high longer than the propagation delay of the gates, the output toggles, feeds back, and toggles again, many times within one clock pulse. The final state is unpredictable.'),
        h('p', {}, 'It is avoided by keeping the clock pulse shorter than the propagation delay (hard in practice), by a master–slave JK flip-flop, or by an edge-triggered flip-flop.')
    ],
    procedure: ['Insert the 7410 and 7400 and connect pin 14 to +5 V and pin 7 to GND on both.', 'Wire the steering gates and the cross-coupled latch according to the connection table.', 'Connect J and K to logic switches, CLK to the pulser, and Q and Q\' to LEDs.', 'For each combination of J and K, note the present state Q(n), apply one clock pulse and note Q(n+1).', 'Set J = K = 1 and hold the clock high (use a logic switch instead of the pulser). Observe the LEDs.'],
    precautions: ['Use a debounced pulser for the clock; a mechanical switch bounces and gives several pulses.', 'Note Q(n) before every clock pulse.', 'Switch the supply off while wiring.'],
    bench: (panel, ctx) => bench(panel, ctx),
    observations: (ctx) => {
        const rows = ctx.obs.rows ?? [];
        const out = [h('h4', {}, 'Table 1: JK flip-flop truth table (one clock pulse per row)'),
            rows.length ? table(['#', 'J', 'K', 'Q(n)', 'Q(n+1) observed', 'Q(n+1) expected', 'Operation', ''], rows.map((r, i) => { const e = expectJK(r.J, r.K, r.q); return [String(i + 1), String(r.J), String(r.K), String(r.q), String(r.next), String(e), ['Hold', 'Reset', 'Set', 'Toggle'][r.J * 2 + r.K], r.next === e ? '✓' : '✗']; })) : h('p', { class: 'muted' }, 'No clock pulses recorded yet.')];
        if (ctx.obs.race) out.push(h('h4', {}, 'Race-around observation'), h('p', {}, `With J = K = 1 and the clock held high, Q changed state ${ctx.obs.race} times before the clock was released.`));
        return out;
    },
    result: (ctx) => {
        const rows = ctx.obs.rows ?? [];
        const ops = new Set(rows.filter(r => r.next === expectJK(r.J, r.K, r.q)).map(r => r.J * 2 + r.K));
        if (ops.size < 4) return `Record a clock pulse for all four J, K combinations (${ops.size} of 4 done).`;
        return `The JK flip-flop was built with ICs 7400 and 7410 and its truth table (hold, reset, set, toggle) was verified.${ctx.obs.race ? ` With J = K = 1 and the clock held high, the output oscillated (${ctx.obs.race} transitions): the race-around condition.` : ''}`;
    },
    viva: [
        ['What is the advantage of a JK over an SR flip-flop?', 'The JK has no invalid state. J = K = 1 makes it toggle instead.'],
        ['What is the race-around condition?', 'With J = K = 1, if the clock pulse is wider than the propagation delay, the output toggles repeatedly within a single clock pulse.'],
        ['How is race-around removed?', 'Using a master–slave JK flip-flop, an edge-triggered flip-flop, or a clock pulse narrower than the propagation delay.'],
        ['Why is the 7410 used here?', 'The steering gates need three inputs each: J (or K), the clock, and the fed-back output.'],
        ['How do you make a T flip-flop from a JK?', 'Tie J and K together and call that input T.'],
        ['How do you make a D flip-flop from a JK?', 'Connect D to J and D\' to K through an inverter.']
    ]
};

function bench(panel, ctx) {
    const c = new Circuit(JK_NET);
    const hist = [];
    const td = h('div', { class: 'svg-box' });
    const status = h('p', { class: 'note' });
    let timer = null;
    let flips = 0;
    const log = () => {
        hist.push([c.get('J'), c.get('K'), c.get('CLK'), c.get('Q'), c.get('Qb')]);
        if (hist.length > 32) hist.shift();
        td.replaceChildren(timing(['J', 'K', 'CLK', 'Q', 'Q\''].map((name, i) => ({ name, values: hist.map(r => r[i]), color: i >= 3 ? '#dc2626' : '#0e7490' }))));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const say = (cls, text) => { status.className = `note ${cls}`; status.textContent = text; };
    let sch;
    const toggle = (name) => {
        if (name === 'CLK') return c.get('CLK') ? release() : hold();
        stop();
        c.set(name, c.get(name) ? 0 : 1);
        c.settle();
        sch.update();
        log();
        say('', `J = ${c.get('J')}, K = ${c.get('K')}. Present state Q = ${c.get('Q')}. Apply a clock pulse.`);
    };
    const doPulse = () => {
        stop();
        const q = c.get('Q');
        const J = c.get('J');
        const K = c.get('K');
        c.set('CLK', 1); c.step(); log(); c.step(); log();
        c.set('CLK', 0); settleLatch(c); log();
        sch.update();
        const next = c.get('Q');
        (ctx.obs.rows ??= []).push({ J, K, q, next });
        ctx.save();
        say(next === expectJK(J, K, q) ? 'note--good' : 'note--bad', `Short pulse: J = ${J}, K = ${K}, Q(n) = ${q} → Q(n+1) = ${next} (${['hold', 'reset', 'set', 'toggle'][J * 2 + K]}). Recorded in Table 1.`);
    };
    const hold = () => {
        stop();
        c.set('CLK', 1);
        flips = 0;
        let last = c.get('Q');
        say('note--warn', 'Clock held HIGH. Watch Q…');
        timer = setInterval(() => {
            c.step();
            if (c.get('Q') !== last) { flips++; last = c.get('Q'); }
            sch.update();
            log();
            if (c.get('J') && c.get('K') && flips > 1) say('note--bad', `RACE-AROUND: Q has toggled ${flips} times while the clock is high. Release the clock to see where it stops — the final state is unpredictable.`);
            else if (flips <= 1 && !(c.get('J') && c.get('K'))) say('', `Clock held high with J = ${c.get('J')}, K = ${c.get('K')}: the output settles at Q = ${c.get('Q')}.`);
        }, 220);
    };
    const release = () => {
        stop();
        c.set('CLK', 0);
        settleLatch(c);
        sch.update();
        log();
        if (c.get('J') && c.get('K') && flips > 1) { ctx.obs.race = flips; ctx.save(); say('note--bad', `Clock released after ${flips} toggles. Q stopped at ${c.get('Q')}. Recorded as the race-around observation.`); }
        else say('', `Clock released. Q = ${c.get('Q')}.`);
    };
    sch = renderSchematic(c, { onToggle: toggle });
    log();
    say('', 'Set J and K with the switches, then apply a short clock pulse.');
    panel.append(
        h('h4', {}, 'Gate-level circuit (click J and K to set them)'), h('div', { class: 'svg-box sch-box' }, sch.svg),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onClick: doPulse }, 'Short clock pulse ⎍'), h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => (timer ? release() : hold()) }, 'Hold clock high / release')), status,
        h('h4', {}, 'Timing diagram (one column per gate delay)'), td,
        h('h4', {}, 'Pin connections'),
        h('div', { class: 'grid-2' }, h('div', { class: 'svg-box' }, drawIC(7410, { 1: 'J', 2: 'CLK', 13: 'Q\'', 12: '→7400·1', 3: 'K', 4: 'CLK', 5: 'Q', 6: '→7400·4' })), h('div', { class: 'svg-box' }, drawIC(7400, { 1: '7410·12', 2: 'Q\'', 3: 'Q', 4: '7410·6', 5: 'Q', 6: 'Q\'' }))),
        table(['From', 'To'], WIRING),
        note('A short pulse lasts two gate delays: long enough for the flip-flop to change once, too short for the change to come round again. Holding the clock high with J = K = 1 shows the race-around condition.'));
    return () => stop();
}

export function render(page, { tab }) {
    return labPage(page, tab, def);
}
