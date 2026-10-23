// Combinational circuits: adders, subtractors, MUX, DEMUX, decoder, encoder, comparators, 4-bit adder.

import { h, table, note } from '../core/ui.js';
import { pageTabs, tile, formula, head } from '../core/page.js';
import { liveCircuit } from './logic.js';

export const intro = 'A combinational circuit\'s output depends only on its present inputs: no memory, no clock. Every circuit below is built from real gates. Click the input switches to drive them.';

export const CIRCUITS = {
    halfAdder: {
        name: 'Half adder', ic: '7486 + 7408',
        exprs: ['Sum S = A ⊕ B', 'Carry C = A · B'],
        text: 'Adds two single bits. It has no carry input, so it can only be the first stage of a bigger adder.',
        net: { inputs: ['A', 'B'], gates: [{ id: 's', type: 'XOR', in: ['A', 'B'] }, { id: 'c', type: 'AND', in: ['A', 'B'] }], outputs: [{ name: 'S', from: 's' }, { name: 'C', from: 'c' }] }
    },
    fullAdder: {
        name: 'Full adder', ic: '7486 + 7408 + 7432',
        exprs: ['Sum S = A ⊕ B ⊕ Cin', 'Cout = AB + Cin(A ⊕ B)'],
        text: 'Adds three bits: A, B and the carry from the previous stage. Built here from two half adders and an OR gate, exactly as in Experiment 5.',
        net: { inputs: ['A', 'B', 'Cin'], gates: [{ id: 'x1', type: 'XOR', in: ['A', 'B'] }, { id: 'a1', type: 'AND', in: ['A', 'B'] }, { id: 's', type: 'XOR', in: ['x1', 'Cin'] }, { id: 'a2', type: 'AND', in: ['x1', 'Cin'] }, { id: 'c', type: 'OR', in: ['a2', 'a1'] }], outputs: [{ name: 'S', from: 's' }, { name: 'Cout', from: 'c' }] }
    },
    halfSub: {
        name: 'Half subtractor', ic: '7486 + 7404 + 7408',
        exprs: ['Difference D = A ⊕ B', 'Borrow Bo = A\' · B'],
        text: 'Computes A − B for single bits. A borrow is needed when A = 0 and B = 1.',
        net: { inputs: ['A', 'B'], gates: [{ id: 'd', type: 'XOR', in: ['A', 'B'] }, { id: 'na', type: 'NOT', in: ['A'] }, { id: 'b', type: 'AND', in: ['na', 'B'] }], outputs: [{ name: 'D', from: 'd' }, { name: 'Bo', from: 'b' }] }
    },
    fullSub: {
        name: 'Full subtractor', ic: '7486 + 7404 + 7408 + 7432',
        exprs: ['D = A ⊕ B ⊕ Bin', 'Bo = A\'B + Bin(A ⊕ B)\''],
        text: 'Computes A − B − Bin, including the borrow from the previous stage.',
        net: { inputs: ['A', 'B', 'Bin'], gates: [{ id: 'x1', type: 'XOR', in: ['A', 'B'] }, { id: 'd', type: 'XOR', in: ['x1', 'Bin'] }, { id: 'na', type: 'NOT', in: ['A'] }, { id: 'a1', type: 'AND', in: ['na', 'B'] }, { id: 'nx', type: 'NOT', in: ['x1'] }, { id: 'a2', type: 'AND', in: ['nx', 'Bin'] }, { id: 'b', type: 'OR', in: ['a1', 'a2'] }], outputs: [{ name: 'D', from: 'd' }, { name: 'Bo', from: 'b' }] }
    },
    mux: {
        name: '4 : 1 multiplexer', ic: '74153',
        exprs: ['Y = S1\'S0\'·I0 + S1\'S0·I1 + S1S0\'·I2 + S1S0·I3'],
        text: 'A data selector: the select lines S1 S0 choose which of the four inputs reaches the output. Used to share one wire between many signals.',
        net: { inputs: ['S1', 'S0', 'I0', 'I1', 'I2', 'I3'], gates: [{ id: 'n1', type: 'NOT', in: ['S1'] }, { id: 'n0', type: 'NOT', in: ['S0'] }, { id: 'g0', type: 'AND', in: ['n1', 'n0', 'I0'] }, { id: 'g1', type: 'AND', in: ['n1', 'S0', 'I1'] }, { id: 'g2', type: 'AND', in: ['S1', 'n0', 'I2'] }, { id: 'g3', type: 'AND', in: ['S1', 'S0', 'I3'] }, { id: 'y', type: 'OR', in: ['g0', 'g1', 'g2', 'g3'] }], outputs: [{ name: 'Y', from: 'y' }] }
    },
    demux: {
        name: '1 : 4 demultiplexer', ic: '74155',
        exprs: ['Y0 = D·S1\'S0\'', 'Y1 = D·S1\'S0', 'Y2 = D·S1S0\'', 'Y3 = D·S1S0'],
        text: 'A data distributor: sends the single input D to the output chosen by S1 S0.',
        net: { inputs: ['D', 'S1', 'S0'], gates: [{ id: 'n1', type: 'NOT', in: ['S1'] }, { id: 'n0', type: 'NOT', in: ['S0'] }, { id: 'y0', type: 'AND', in: ['D', 'n1', 'n0'] }, { id: 'y1', type: 'AND', in: ['D', 'n1', 'S0'] }, { id: 'y2', type: 'AND', in: ['D', 'S1', 'n0'] }, { id: 'y3', type: 'AND', in: ['D', 'S1', 'S0'] }], outputs: [{ name: 'Y0', from: 'y0' }, { name: 'Y1', from: 'y1' }, { name: 'Y2', from: 'y2' }, { name: 'Y3', from: 'y3' }] }
    },
    decoder: {
        name: '2 : 4 decoder', ic: '74139 (74138 is 3:8)',
        exprs: ['Y0 = A\'B\'', 'Y1 = A\'B', 'Y2 = AB\'', 'Y3 = AB'],
        text: 'Turns a 2-bit binary code into one of four active lines. Used to select memory chips and drive displays.',
        net: { inputs: ['A', 'B'], gates: [{ id: 'na', type: 'NOT', in: ['A'] }, { id: 'nb', type: 'NOT', in: ['B'] }, { id: 'y0', type: 'AND', in: ['na', 'nb'] }, { id: 'y1', type: 'AND', in: ['na', 'B'] }, { id: 'y2', type: 'AND', in: ['A', 'nb'] }, { id: 'y3', type: 'AND', in: ['A', 'B'] }], outputs: [{ name: 'Y0', from: 'y0' }, { name: 'Y1', from: 'y1' }, { name: 'Y2', from: 'y2' }, { name: 'Y3', from: 'y3' }] }
    },
    encoder: {
        name: '4 : 2 encoder', ic: '74148 (priority, 8:3)',
        exprs: ['Y1 = D2 + D3', 'Y0 = D1 + D3'],
        text: 'The reverse of a decoder: exactly one input should be 1, and the output is its binary number. If two inputs are 1 the output is wrong, which is why real chips are priority encoders (the highest input wins).',
        net: { inputs: ['D0', 'D1', 'D2', 'D3'], gates: [{ id: 'y1', type: 'OR', in: ['D2', 'D3'] }, { id: 'y0', type: 'OR', in: ['D1', 'D3'] }], outputs: [{ name: 'Y1', from: 'y1' }, { name: 'Y0', from: 'y0' }] }
    },
    comp1: {
        name: '1-bit magnitude comparator', ic: '7485 (4-bit)',
        exprs: ['A > B : A·B\'', 'A = B : (A ⊕ B)\'', 'A < B : A\'·B'],
        text: 'Compares two bits and says which is bigger, or whether they are equal.',
        net: { inputs: ['A', 'B'], gates: [{ id: 'na', type: 'NOT', in: ['A'] }, { id: 'nb', type: 'NOT', in: ['B'] }, { id: 'gt', type: 'AND', in: ['A', 'nb'] }, { id: 'eq', type: 'XNOR', in: ['A', 'B'] }, { id: 'lt', type: 'AND', in: ['na', 'B'] }], outputs: [{ name: 'A>B', from: 'gt' }, { name: 'A=B', from: 'eq' }, { name: 'A<B', from: 'lt' }] }
    },
    comp2: {
        name: '2-bit magnitude comparator', ic: '7485 (4-bit)',
        exprs: ['A = B : (A1 ⊙ B1)(A0 ⊙ B0)', 'A > B : A1B1\' + (A1 ⊙ B1)A0B0\'', 'A < B : A1\'B1 + (A1 ⊙ B1)A0\'B0'],
        text: 'Compares the most significant bits first. Only if they are equal do the lower bits decide.',
        net: {
            inputs: ['A1', 'A0', 'B1', 'B0'],
            gates: [{ id: 'e1', type: 'XNOR', in: ['A1', 'B1'] }, { id: 'e0', type: 'XNOR', in: ['A0', 'B0'] }, { id: 'nb1', type: 'NOT', in: ['B1'] }, { id: 'nb0', type: 'NOT', in: ['B0'] }, { id: 'na1', type: 'NOT', in: ['A1'] }, { id: 'na0', type: 'NOT', in: ['A0'] },
                { id: 'eq', type: 'AND', in: ['e1', 'e0'] }, { id: 'g1', type: 'AND', in: ['A1', 'nb1'] }, { id: 'g0', type: 'AND', in: ['e1', 'A0', 'nb0'] }, { id: 'gt', type: 'OR', in: ['g1', 'g0'] },
                { id: 'l1', type: 'AND', in: ['na1', 'B1'] }, { id: 'l0', type: 'AND', in: ['e1', 'na0', 'B0'] }, { id: 'lt', type: 'OR', in: ['l1', 'l0'] }],
            outputs: [{ name: 'A>B', from: 'gt' }, { name: 'A=B', from: 'eq' }, { name: 'A<B', from: 'lt' }]
        }
    }
};

function circuitTab(keys, title, text) {
    return (panel) => {
        const box = h('div');
        const seg = h('div', { class: 'seg seg--wrap' }, keys.map(k => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, CIRCUITS[k].name)));
        const show = (k) => {
            [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
            const c = CIRCUITS[k];
            box.replaceChildren(
                h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, c.name), h('span', { class: 'chip mono' }, `IC ${c.ic}`)),
                h('p', { class: 'muted' }, c.text),
                ...c.exprs.map(e => formula(e)),
                liveCircuit(c.net).el);
        };
        panel.append(head(title, text), seg, box);
        show(keys[0]);
    };
}

function rippleAdder(panel) {
    const st = { a: [1, 0, 1, 1], b: [0, 1, 1, 1], cin: 0 };
    const out = h('div');
    const bits = (key) => h('div', { class: 'bit-row' }, st[key].map((v, i) => h('button', { type: 'button', class: `bitbtn${v ? ' is-on' : ''}`, 'aria-pressed': Boolean(v), onClick: () => { st[key][i] ^= 1; render(); } }, v)));
    const render = () => {
        const stages = [];
        let carry = st.cin;
        for (let i = 3; i >= 0; i--) {
            const a = st.a[i];
            const b = st.b[i];
            const sum = a ^ b ^ carry;
            const cout = (a & b) | (carry & (a ^ b));
            stages.unshift({ a, b, cin: carry, sum, cout, bit: 3 - i });
            carry = cout;
        }
        const A = parseInt(st.a.join(''), 2);
        const B = parseInt(st.b.join(''), 2);
        out.replaceChildren(
            h('div', { class: 'row' }, h('span', { class: 'mono' }, 'A ='), bits('a'), h('b', { class: 'mono' }, `= ${A}`)),
            h('div', { class: 'row' }, h('span', { class: 'mono' }, 'B ='), bits('b'), h('b', { class: 'mono' }, `= ${B}`)),
            h('div', { class: 'fa-chain' }, h('div', { class: 'fa-out' }, h('small', {}, 'Cout'), h('b', {}, carry)), ...stages.map(sg => h('div', { class: 'fa-stage' }, h('small', {}, `FA${sg.bit}`), h('div', { class: 'mono' }, `${sg.a}+${sg.b}+${sg.cin}`), h('b', {}, `S${sg.bit} = ${sg.sum}`), h('small', { class: sg.cout ? 'ok-text' : 'muted' }, `carry ${sg.cout} ←`)))),
            h('div', { class: 'grid-3' }, tile('Sum (binary)', `${carry}${stages.map(sg => sg.sum).join('')}`), tile('Sum (decimal)', String(A + B)), tile('Check', `${A} + ${B} = ${A + B} ✓`)),
            note('Each full adder waits for the carry from the one on its right, so the carry "ripples" through. A 4-bit adder like the 7483/74LS83 is four of these. Faster chips use carry look-ahead.'));
    };
    panel.append(head('4-bit ripple-carry adder', 'Four full adders chained together. Click the bits to change A and B.'), out);
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'combinational', [
        { id: 'adders', label: 'Adders', render: circuitTab(['halfAdder', 'fullAdder'], 'Adders', 'Binary addition, one bit at a time.') },
        { id: 'ripple', label: '4-bit adder', render: rippleAdder },
        { id: 'subtractors', label: 'Subtractors', render: circuitTab(['halfSub', 'fullSub'], 'Subtractors', 'Binary subtraction with borrow.') },
        { id: 'mux', label: 'MUX & DEMUX', render: circuitTab(['mux', 'demux'], 'Multiplexer and demultiplexer', 'Data selection and distribution circuits.') },
        { id: 'codec', label: 'Decoder & encoder', render: circuitTab(['decoder', 'encoder'], 'Decoder and encoder', 'Code converters between binary and one-hot lines.') },
        { id: 'comparators', label: 'Comparators', render: circuitTab(['comp1', 'comp2'], 'Magnitude comparators', 'Decide whether A > B, A = B or A < B.') }
    ], tab);
}
