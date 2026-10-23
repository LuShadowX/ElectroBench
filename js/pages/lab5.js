// Experiment 5: Adders — half adder and full adder with 7486 (XOR), 7408 (AND) and 7432 (OR).

import { h, table, note } from '../core/ui.js';
import { formula } from '../core/page.js';
import { labPage } from '../core/lab.js';
import { drawIC } from '../core/ic.js';
import { liveCircuit } from './logic.js';
import { CIRCUITS } from './combinational.js';

export const intro = 'Build a half adder and a full adder from XOR, AND and OR chips, wire them pin by pin, and verify the sum and carry outputs.';

export const BUILDS = {
    half: {
        name: 'Half adder', c: CIRCUITS.halfAdder,
        chips: [[7486, { 1: 'A', 2: 'B', 3: 'SUM' }], [7408, { 1: 'A', 2: 'B', 3: 'CARRY' }]],
        wiring: [['Switch A', '7486 pin 1 and 7408 pin 1'], ['Switch B', '7486 pin 2 and 7408 pin 2'], ['7486 pin 3', 'LED "S"'], ['7408 pin 3', 'LED "C"']],
        expect: ([a, b]) => [a ^ b, a & b]
    },
    full: {
        name: 'Full adder', c: CIRCUITS.fullAdder,
        chips: [[7486, { 1: 'A', 2: 'B', 3: '→4', 4: 'A⊕B', 5: 'Cin', 6: 'SUM' }], [7408, { 1: 'A', 2: 'B', 3: '→OR 1', 4: 'A⊕B', 5: 'Cin', 6: '→OR 2' }], [7432, { 1: 'AB', 2: 'Cin(A⊕B)', 3: 'COUT' }]],
        wiring: [['Switch A', '7486 pin 1, 7408 pin 1'], ['Switch B', '7486 pin 2, 7408 pin 2'], ['Switch Cin', '7486 pin 5, 7408 pin 5'], ['7486 pin 3 (A⊕B)', '7486 pin 4 and 7408 pin 4'], ['7486 pin 6', 'LED "S"'], ['7408 pin 3 (AB)', '7432 pin 1'], ['7408 pin 6 (Cin·(A⊕B))', '7432 pin 2'], ['7432 pin 3', 'LED "Cout"']],
        expect: ([a, b, c]) => [a ^ b ^ c, (a & b) | (c & (a ^ b))]
    }
};

const rowsOf = (n) => Array.from({ length: 2 ** n }, (_, i) => Array.from({ length: n }, (_, k) => (i >> (n - 1 - k)) & 1));

export const def = {
    id: 'lab5', num: 5,
    aim: 'To design and verify the half adder and full adder circuits using logic gate ICs 7486 (XOR), 7408 (AND) and 7432 (OR).',
    apparatus: [['IC 7486', 'Quad 2-input XOR', '1'], ['IC 7408', 'Quad 2-input AND', '1'], ['IC 7432', 'Quad 2-input OR', '1'], ['Digital trainer kit', '+5 V, logic switches, LEDs', '1'], ['Connecting wires', 'Single strand', 'As required']],
    theory: [
        h('p', {}, h('b', {}, 'Half adder: '), 'adds two bits A and B. The sum is 1 when exactly one input is 1 (XOR), and the carry is 1 only when both are 1 (AND).'),
        formula('S = A ⊕ B        C = A · B'),
        h('p', {}, h('b', {}, 'Full adder: '), 'adds three bits, A, B and a carry-in from the previous stage. It is made of two half adders whose carries are ORed.'),
        formula('S = A ⊕ B ⊕ Cin        Cout = A·B + Cin·(A ⊕ B)'),
        h('p', {}, 'Chaining n full adders, carry out to carry in, gives an n-bit ripple-carry adder (see Combinational circuits → Ripple adder).')
    ],
    procedure: ['Verify the three ICs.', 'Connect pin 14 of each IC to +5 V and pin 7 to GND.', 'Wire the half adder using the pin table and apply all four input combinations. Note S and C.', 'Wire the full adder using the pin table and apply all eight combinations. Note S and Cout.', 'Compare the observed outputs with the truth tables.'],
    precautions: ['Make all connections with the supply off.', 'Check the IC orientation from the notch before switching on.', 'Use the same ground for the trainer and the ICs.'],
    bench: (panel, ctx) => bench(panel, ctx),
    observations: (ctx) => {
        const done = Object.keys(BUILDS).filter(k => ctx.obs[k]);
        if (!done.length) return [h('p', { class: 'muted' }, 'No readings yet. Test the adders on the Virtual bench.')];
        return done.map(k => {
            const b = BUILDS[k];
            const ins = b.c.net.inputs;
            const outs = b.c.net.outputs.map(o => o.name);
            return h('div', {}, h('h4', {}, `${b.name}: truth table`), table([...ins, ...outs.map(o => `${o} expected`), ...outs.map(o => `${o} observed`), ''],
                rowsOf(ins.length).map(r => { const exp = b.expect(r); const got = ctx.obs[k][r.join('')]; return [...r.map(String), ...exp.map(String), ...(got ? got.map(String) : outs.map(() => '—')), got ? (got.every((v, i) => v === exp[i]) ? '✓' : '✗') : '']; })));
        });
    },
    result: (ctx) => {
        const ok = Object.keys(BUILDS).filter(k => ctx.obs[k] && rowsOf(BUILDS[k].c.net.inputs.length).every(r => { const g = ctx.obs[k][r.join('')]; return g && g.every((v, i) => v === BUILDS[k].expect(r)[i]); }));
        return ok.length ? `The ${ok.map(k => BUILDS[k].name.toLowerCase()).join(' and ')} ${ok.length > 1 ? 'were' : 'was'} designed using ICs 7486, 7408${ok.includes('full') ? ' and 7432' : ''}, and the truth table${ok.length > 1 ? 's were' : ' was'} verified.` : 'Complete all rows of at least one adder to obtain the result.';
    },
    viva: [
        ['What is the difference between a half adder and a full adder?', 'A half adder adds two bits and has no carry input. A full adder adds three bits, including the carry from the previous stage.'],
        ['How many half adders make a full adder?', 'Two half adders and one OR gate.'],
        ['Why does a ripple-carry adder get slow for many bits?', 'Each stage must wait for the carry from the stage before, so the delay grows with the number of bits.'],
        ['What is a carry look-ahead adder?', 'An adder that calculates all carries in parallel from the generate (AB) and propagate (A⊕B) signals, removing the ripple delay.'],
        ['Which IC numbers did you use and what do they contain?', '7486: four 2-input XOR gates. 7408: four 2-input AND gates. 7432: four 2-input OR gates.'],
        ['Can a full adder be used as a subtractor?', 'Yes. Invert B and set Cin = 1: A + B\' + 1 = A − B (2\'s complement).']
    ]
};

function bench(panel, ctx) {
    const box = h('div');
    const seg = h('div', { class: 'seg' }, Object.entries(BUILDS).map(([k, b]) => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, b.name)));
    const show = (k) => {
        [...seg.children].forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.k === k));
        const b = BUILDS[k];
        const net = b.c.net;
        const live = liveCircuit(net, { showTable: false });
        const status = h('p', { class: 'muted' });
        const save = (c) => { (ctx.obs[k] ??= {})[net.inputs.map(n => c.get(n)).join('')] = net.outputs.map(o => c.out(o.name)); };
        const recordRow = () => {
            save(live.circuit);
            ctx.save();
            status.textContent = `Recorded. ${Object.keys(ctx.obs[k]).length} of ${2 ** net.inputs.length} rows done.`;
        };
        const testAll = () => {
            rowsOf(net.inputs.length).forEach(r => { net.inputs.forEach((n, i) => live.circuit.set(n, r[i])); live.circuit.settle(); save(live.circuit); });
            ctx.save();
            live.update();
            status.textContent = 'All rows recorded. See the Observations tab.';
        };
        box.replaceChildren(h('h3', {}, b.name), ...b.c.exprs.map(e => formula(e)),
            h('div', { class: 'grid-2' },
                h('div', {}, h('h4', {}, 'Pin connections'), ...b.chips.map(([ic, pins]) => h('div', { class: 'svg-box' }, drawIC(ic, pins))), table(['From', 'To'], [...b.wiring, ['Pin 14 of every IC', '+5 V'], ['Pin 7 of every IC', 'GND']])),
                h('div', {}, h('h4', {}, 'Circuit (click the switches)'), live.el, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onClick: recordRow }, 'Record this row'), h('button', { type: 'button', class: 'btn btn--ghost', onClick: testAll }, 'Test all combinations')), status)));
    };
    panel.append(seg, box, note('In the full adder, gate 1 of the 7486 makes A⊕B and gate 2 adds Cin to it. The same A⊕B also goes to the second AND gate.'));
    show('half');
}

export function render(page, { tab }) {
    return labPage(page, tab, def);
}
