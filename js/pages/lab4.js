// Experiment 4: Universal Gates — realise NOT, AND and OR using only 7400 (NAND) or only 7402 (NOR).

import { h, table, note } from '../core/ui.js';
import { formula } from '../core/page.js';
import { labPage } from '../core/lab.js';
import { drawIC } from '../core/ic.js';
import { liveCircuit } from './logic.js';

export const intro = 'Wire NOT, AND and OR gates using only NAND chips, then only NOR chips, and verify each truth table with LEDs.';

// pins: which pin of the chip each signal goes to, as wired in the lab manual
export const BUILDS = {
    'nand-not': { ic: 7400, name: 'NOT using NAND', expr: 'Y = (A·A)\' = A\'', net: { inputs: ['A'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'A'] }], outputs: [{ name: 'Y', from: 'n1' }] },
        pins: { 1: 'A', 2: 'A', 3: 'LED' }, wiring: [['Switch A', 'Pins 1 and 2 (both inputs of gate 1)'], ['Pin 3 (output 1Y)', 'LED through 330 Ω to GND']], expect: ([a]) => 1 - a },
    'nand-and': { ic: 7400, name: 'AND using NAND', expr: 'Y = ((A·B)\')\' = A·B', net: { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'B'] }, { id: 'n2', type: 'NAND', in: ['n1', 'n1'] }], outputs: [{ name: 'Y', from: 'n2' }] },
        pins: { 1: 'A', 2: 'B', 3: '→4,5', 4: 'from 3', 5: 'from 3', 6: 'LED' }, wiring: [['Switch A', 'Pin 1'], ['Switch B', 'Pin 2'], ['Pin 3 (NAND output)', 'Pins 4 and 5 (gate 2 used as NOT)'], ['Pin 6', 'LED']], expect: ([a, b]) => a & b },
    'nand-or': { ic: 7400, name: 'OR using NAND', expr: 'Y = (A\'·B\')\' = A + B', net: { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'A'] }, { id: 'n2', type: 'NAND', in: ['B', 'B'] }, { id: 'n3', type: 'NAND', in: ['n1', 'n2'] }], outputs: [{ name: 'Y', from: 'n3' }] },
        pins: { 1: 'A', 2: 'A', 3: '→9', 4: 'B', 5: 'B', 6: '→10', 8: 'LED', 9: 'from 3', 10: 'from 6' }, wiring: [['Switch A', 'Pins 1 and 2 (gate 1 gives A\')'], ['Switch B', 'Pins 4 and 5 (gate 2 gives B\')'], ['Pin 3', 'Pin 9'], ['Pin 6', 'Pin 10'], ['Pin 8 (gate 3 output)', 'LED']], expect: ([a, b]) => a | b },
    'nor-not': { ic: 7402, name: 'NOT using NOR', expr: 'Y = (A + A)\' = A\'', net: { inputs: ['A'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'A'] }], outputs: [{ name: 'Y', from: 'n1' }] },
        pins: { 2: 'A', 3: 'A', 1: 'LED' }, wiring: [['Switch A', 'Pins 2 and 3'], ['Pin 1 (output 1Y)', 'LED']], expect: ([a]) => 1 - a },
    'nor-or': { ic: 7402, name: 'OR using NOR', expr: 'Y = ((A + B)\')\' = A + B', net: { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'B'] }, { id: 'n2', type: 'NOR', in: ['n1', 'n1'] }], outputs: [{ name: 'Y', from: 'n2' }] },
        pins: { 2: 'A', 3: 'B', 1: '→5,6', 5: 'from 1', 6: 'from 1', 4: 'LED' }, wiring: [['Switch A', 'Pin 2'], ['Switch B', 'Pin 3'], ['Pin 1 (NOR output)', 'Pins 5 and 6 (gate 2 used as NOT)'], ['Pin 4', 'LED']], expect: ([a, b]) => a | b },
    'nor-and': { ic: 7402, name: 'AND using NOR', expr: 'Y = (A\' + B\')\' = A·B', net: { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'A'] }, { id: 'n2', type: 'NOR', in: ['B', 'B'] }, { id: 'n3', type: 'NOR', in: ['n1', 'n2'] }], outputs: [{ name: 'Y', from: 'n3' }] },
        pins: { 2: 'A', 3: 'A', 5: 'B', 6: 'B', 1: '→8', 4: '→9', 8: 'from 1', 9: 'from 4', 10: 'LED' }, wiring: [['Switch A', 'Pins 2 and 3 (gate 1 gives A\')'], ['Switch B', 'Pins 5 and 6 (gate 2 gives B\')'], ['Pin 1', 'Pin 8'], ['Pin 4', 'Pin 9'], ['Pin 10 (gate 3 output)', 'LED']], expect: ([a, b]) => a & b }
};

const rowsOf = (b) => Array.from({ length: 2 ** b.net.inputs.length }, (_, i) => b.net.inputs.map((_, k) => (i >> (b.net.inputs.length - 1 - k)) & 1));

export const def = {
    id: 'lab4', num: 4,
    aim: 'To realise the basic gates NOT, AND and OR using only NAND gates (IC 7400) and only NOR gates (IC 7402), and verify their truth tables.',
    apparatus: [['IC 7400', 'Quad 2-input NAND', '1'], ['IC 7402', 'Quad 2-input NOR', '1'], ['Digital trainer kit', '+5 V supply, logic switches, LEDs', '1'], ['Breadboard', 'Standard', '1'], ['LED + resistor', 'Red LED, 330 Ω', '1'], ['Connecting wires', 'Single strand', 'As required']],
    theory: [
        h('p', {}, 'A gate is called ', h('b', {}, 'universal'), ' when every other gate, and therefore any Boolean function, can be built from it alone. NAND and NOR are both universal.'),
        h('p', {}, 'Tying both inputs of a NAND or NOR together gives an inverter. Adding an inverter after a NAND gives AND; inverting both inputs of a NAND gives OR (De Morgan). For NOR it is the mirror image.'),
        formula('De Morgan:  (A·B)\' = A\' + B\'      (A + B)\' = A\'·B\''),
        h('p', {}, 'Pin 14 of both chips goes to +5 V and pin 7 to ground. Note that the 7402 has a different pinout from the 7400: its outputs are on pins 1, 4, 10 and 13.')
    ],
    procedure: ['Check each IC on the trainer\'s IC tester (or by verifying one gate) before wiring.', 'Place the IC across the centre channel of the breadboard, notch to the left.', 'Connect pin 14 to +5 V and pin 7 to GND.', 'Wire the circuit according to the pin table for the gate being realised.', 'Apply every input combination with the logic switches and note whether the LED is ON (1) or OFF (0).', 'Compare with the expected truth table. Repeat for every circuit.'],
    precautions: ['Never connect the supply in reverse; it destroys TTL chips instantly.', 'Do not leave TTL inputs floating; they behave like logic 1.', 'Switch the supply off before changing wiring.'],
    bench: (panel, ctx) => bench(panel, ctx),
    observations: (ctx) => {
        const done = Object.keys(BUILDS).filter(k => ctx.obs[k]);
        if (!done.length) return [h('p', { class: 'muted' }, 'No circuits tested yet. Build a circuit on the Virtual bench and record its rows.')];
        return done.map(k => {
            const b = BUILDS[k];
            const rec = ctx.obs[k];
            return h('div', {}, h('h4', {}, `${b.name} (IC ${b.ic})`), table([...b.net.inputs, 'Expected Y', 'Observed Y (LED)', ''],
                rowsOf(b).map(ins => { const key = ins.join(''); const got = rec[key]; return [...ins.map(String), String(b.expect(ins)), got === undefined ? '—' : got ? '1 (ON)' : '0 (OFF)', got === undefined ? '' : got === b.expect(ins) ? '✓' : '✗']; })));
        });
    },
    result: (ctx) => {
        const verified = Object.keys(BUILDS).filter(k => { const rec = ctx.obs[k]; return rec && rowsOf(BUILDS[k]).every(ins => rec[ins.join('')] === BUILDS[k].expect(ins)); });
        if (!verified.length) return 'Complete all rows of at least one circuit to obtain the result.';
        return `The truth tables of ${verified.map(k => BUILDS[k].name).join(', ')} were verified. NAND and NOR gates are universal gates.`;
    },
    viva: [
        ['Why are NAND and NOR called universal gates?', 'Because any Boolean function (and every other gate) can be built using only NAND gates or only NOR gates.'],
        ['How many NAND gates are needed for AND, OR and XOR?', 'AND: 2, OR: 3, XOR: 4.'],
        ['What happens if a TTL input is left unconnected?', 'It floats and is read as logic 1, but it picks up noise, so unused inputs should be tied to Vcc or GND.'],
        ['What are the supply and ground pins of a 14-pin TTL IC?', 'Pin 14 is Vcc (+5 V) and pin 7 is GND.'],
        ['Why are universal gates preferred in manufacturing?', 'A single gate type means one standard cell, which is cheaper and simpler to fabricate. NAND is also the fastest in CMOS.'],
        ['State De Morgan\'s theorems.', '(A·B)\' = A\' + B\' and (A + B)\' = A\'·B\'.']
    ]
};

function bench(panel, ctx) {
    const box = h('div');
    const seg = h('div', { class: 'seg seg--wrap' }, Object.entries(BUILDS).map(([k, b]) => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, b.name)));
    const show = (k) => {
        [...seg.children].forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.k === k));
        const b = BUILDS[k];
        const live = liveCircuit(b.net, { showTable: false });
        const status = h('p', { class: 'muted' });
        const recordRow = () => {
            const ins = b.net.inputs.map(n => live.circuit.get(n));
            (ctx.obs[k] ??= {})[ins.join('')] = live.circuit.out('Y');
            ctx.save();
            status.textContent = `Recorded ${b.net.inputs.map((n, i) => `${n} = ${ins[i]}`).join(', ')} → Y = ${live.circuit.out('Y')}. ${Object.keys(ctx.obs[k]).length} of ${2 ** ins.length} rows done.`;
        };
        const testAll = () => {
            const c = live.circuit;
            rowsOf(b).forEach(ins => { b.net.inputs.forEach((n, i) => c.set(n, ins[i])); c.settle(); (ctx.obs[k] ??= {})[ins.join('')] = c.out('Y'); });
            ctx.save();
            live.update();
            status.textContent = 'All rows recorded. See the Observations tab.';
        };
        box.replaceChildren(h('h3', {}, `${b.name} — IC ${b.ic}`), formula(b.expr),
            h('div', { class: 'grid-2' }, h('div', {}, h('h4', {}, 'Pin connections'), h('div', { class: 'svg-box' }, drawIC(b.ic, b.pins)), table(['From', 'To'], [...b.wiring, ['Pin 14', '+5 V'], ['Pin 7', 'GND']])),
                h('div', {}, h('h4', {}, 'Circuit (click the switches)'), live.el, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onClick: recordRow }, 'Record this row'), h('button', { type: 'button', class: 'btn btn--ghost', onClick: testAll }, 'Test all combinations')), status)));
    };
    panel.append(seg, box, note('Highlighted pins are the ones you wire. The text above or below each pin says what it connects to.'));
    show('nand-not');
}

export function render(page, { tab }) {
    return labPage(page, tab, def);
}
