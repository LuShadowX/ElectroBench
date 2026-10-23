// Logic gates, universal gates, Boolean laws, SOP/POS and a K-map solver that builds the circuit.

import { h, table, note } from '../core/ui.js';
import { pageTabs, tile, formula, head } from '../core/page.js';
import { Circuit, parseExpression, minterms, simplify, sopCircuit } from '../core/logic.js';
import { renderSchematic } from '../core/schematic.js';

export const intro = 'Logic gates are the building blocks of every digital circuit. Boolean algebra describes them, and Karnaugh maps simplify them so circuits need fewer gates.';

// Interactive schematic for a netlist, with a live truth table
export function liveCircuit(netlist, { labels, showTable = true } = {}) {
    const c = new Circuit(netlist);
    const wrap = h('div', { class: 'live-circuit' });
    const tableBox = h('div');
    let sch;
    const highlight = () => {
        if (!showTable) return;
        const idx = netlist.inputs.reduce((acc, name) => acc * 2 + c.get(name), 0);
        tableBox.querySelectorAll('tbody tr').forEach((tr, i) => tr.classList.toggle('is-current', i === idx));
    };
    const toggle = (name) => {
        c.set(name, c.get(name) ? 0 : 1);
        c.settle();
        sch.update();
        highlight();
    };
    sch = renderSchematic(c, { onToggle: toggle, labels });
    if (showTable) {
        const rows = c.truthTable();
        tableBox.replaceChildren(table([...netlist.inputs, ...netlist.outputs.map(o => o.name)], rows.map(r => [...r.ins, ...r.outs].map(String))));
    }
    wrap.append(h('div', { class: 'svg-box sch-box' }, sch.svg), showTable ? h('div', { class: 'tt-box' }, h('small', { class: 'muted' }, 'Truth table (current row highlighted)'), tableBox) : '');
    highlight();
    return { el: wrap, circuit: c, update: () => { sch.update(); highlight(); } };
}

const GATES = [
    ['AND', 'Y = A · B', '7408', 'Output is 1 only when ALL inputs are 1.'],
    ['OR', 'Y = A + B', '7432', 'Output is 1 when ANY input is 1.'],
    ['NOT', 'Y = A\'', '7404', 'Output is the opposite of the input (inverter).'],
    ['NAND', 'Y = (A · B)\'', '7400', 'AND followed by NOT. Universal gate.'],
    ['NOR', 'Y = (A + B)\'', '7402', 'OR followed by NOT. Universal gate.'],
    ['XOR', 'Y = A ⊕ B = A\'B + AB\'', '7486', 'Output is 1 when the inputs are DIFFERENT.'],
    ['XNOR', 'Y = (A ⊕ B)\'', '74266', 'Output is 1 when the inputs are the SAME (equality detector).']
];

function gates(panel) {
    const grid = h('div', { class: 'gate-grid' });
    GATES.forEach(([type, expr, ic, text]) => {
        const net = type === 'NOT' ? { inputs: ['A'], gates: [{ id: 'g', type, in: ['A'] }], outputs: [{ name: 'Y', from: 'g' }] } : { inputs: ['A', 'B'], gates: [{ id: 'g', type, in: ['A', 'B'] }], outputs: [{ name: 'Y', from: 'g' }] };
        const live = liveCircuit(net);
        grid.append(h('div', { class: 'card gate-card' }, h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, type), h('span', { class: 'chip mono' }, `IC ${ic}`)), h('p', { class: 'mono' }, expr), h('p', { class: 'muted' }, text), live.el));
    });
    panel.append(head('Basic, universal and special gates', 'Click the input switches. Green wires carry logic 1.'), grid);
}

const UNIVERSAL = {
    'NOT from NAND': { inputs: ['A'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'A'] }], outputs: [{ name: 'Y', from: 'n1' }], expr: 'Y = (A·A)\' = A\'' },
    'AND from NAND': { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'B'] }, { id: 'n2', type: 'NAND', in: ['n1', 'n1'] }], outputs: [{ name: 'Y', from: 'n2' }], expr: 'Y = ((AB)\')\' = AB' },
    'OR from NAND': { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'A'] }, { id: 'n2', type: 'NAND', in: ['B', 'B'] }, { id: 'n3', type: 'NAND', in: ['n1', 'n2'] }], outputs: [{ name: 'Y', from: 'n3' }], expr: 'Y = (A\'·B\')\' = A + B   (De Morgan)' },
    'XOR from NAND': { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NAND', in: ['A', 'B'] }, { id: 'n2', type: 'NAND', in: ['A', 'n1'] }, { id: 'n3', type: 'NAND', in: ['B', 'n1'] }, { id: 'n4', type: 'NAND', in: ['n2', 'n3'] }], outputs: [{ name: 'Y', from: 'n4' }], expr: 'Four NAND gates make XOR' },
    'NOT from NOR': { inputs: ['A'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'A'] }], outputs: [{ name: 'Y', from: 'n1' }], expr: 'Y = (A + A)\' = A\'' },
    'OR from NOR': { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'B'] }, { id: 'n2', type: 'NOR', in: ['n1', 'n1'] }], outputs: [{ name: 'Y', from: 'n2' }], expr: 'Y = ((A + B)\')\' = A + B' },
    'AND from NOR': { inputs: ['A', 'B'], gates: [{ id: 'n1', type: 'NOR', in: ['A', 'A'] }, { id: 'n2', type: 'NOR', in: ['B', 'B'] }, { id: 'n3', type: 'NOR', in: ['n1', 'n2'] }], outputs: [{ name: 'Y', from: 'n3' }], expr: 'Y = (A\' + B\')\' = AB   (De Morgan)' }
};

function universal(panel) {
    const box = h('div');
    const seg = h('div', { class: 'seg seg--wrap' }, Object.keys(UNIVERSAL).map(k => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, k)));
    const show = (k) => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
        const net = UNIVERSAL[k];
        box.replaceChildren(formula(net.expr), liveCircuit({ inputs: net.inputs, gates: net.gates, outputs: net.outputs }).el);
    };
    panel.append(head('Universal gates', 'NAND and NOR are "universal": any logic function can be built from only NANDs or only NORs. Factories like this because one gate type is cheaper to make.'), seg, box);
    show('OR from NAND');
}

const LAWS = [
    ['Identity', 'A + 0', 'A', 'A · 1 = A'],
    ['Null', 'A + 1', '1', 'A · 0 = 0'],
    ['Idempotent', 'A + A', 'A', 'A · A = A'],
    ['Inverse', 'A + A\'', '1', 'A · A\' = 0'],
    ['Absorption', 'A + AB', 'A', 'A(A + B) = A'],
    ['De Morgan 1', '(AB)\'', 'A\' + B\'', 'NAND = bubbled OR'],
    ['De Morgan 2', '(A + B)\'', 'A\'B\'', 'NOR = bubbled AND'],
    ['Distributive', 'A + BC', '(A + B)(A + C)', 'A(B + C) = AB + AC'],
    ['Consensus', 'AB + A\'C + BC', 'AB + A\'C', 'The BC term is redundant']
];

function laws(panel) {
    const box = h('div');
    const seg = h('div', { class: 'seg seg--wrap' }, LAWS.map((l, i) => h('button', { type: 'button', dataset: { i }, onClick: () => show(i) }, l[0])));
    const show = (i) => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.i) === i));
        const [name, lhs, rhs, also] = LAWS[i];
        const L = parseExpression(lhs);
        const R = parseExpression(rhs);
        const vars = [...new Set([...L.vars, ...R.vars])].sort();
        const rows = Array.from({ length: 2 ** vars.length }, (_, m) => {
            const env = Object.fromEntries(vars.map((v, k) => [v, (m >> (vars.length - 1 - k)) & 1]));
            const l = minterms(L.ast, vars).includes(m) ? 1 : 0;
            const r = minterms(R.ast, vars).includes(m) ? 1 : 0;
            return [...vars.map(v => String(env[v])), String(l), String(r), l === r ? '✓' : '✗'];
        });
        box.replaceChildren(formula(`${name}:   ${lhs} = ${rhs}       (also: ${also})`), table([...vars, lhs, rhs, 'Equal?'], rows), h('p', { class: 'note note--good' }, 'Both columns match for every input combination, so the law holds.'));
    };
    panel.append(head('Boolean algebra laws', 'Each law is checked by building the truth table of both sides.'), seg, box);
    show(5);
}

// colour per prime implicant group
const GROUP_COLORS = ['#ef4444', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

function kmapGrid(ones, vars, groups) {
    const n = vars.length;
    const gray = (k) => [[0], [0, 1], [0, 1, 3, 2]][k];
    const rowBits = n === 4 ? 2 : 1;
    const colBits = n - rowBits;
    const rows = rowBits === 1 ? [0, 1] : gray(2);
    const cols = colBits === 1 ? [0, 1] : gray(2);
    const rowVars = vars.slice(0, rowBits).join('');
    const colVars = vars.slice(rowBits).join('');
    const fmtBits = (v, w) => v.toString(2).padStart(w, '0');
    return h('table', { class: 'kmap' },
        h('thead', {}, h('tr', {}, h('th', { class: 'kmap-corner' }, `${rowVars} \\ ${colVars}`), ...cols.map(c => h('th', {}, fmtBits(c, colBits))))),
        h('tbody', {}, rows.map(r => h('tr', {}, h('th', {}, fmtBits(r, rowBits)), ...cols.map(c => {
            const m = (r << colBits) | c;
            const covering = groups.map((g, gi) => (g.covers.includes(m) ? gi : -1)).filter(gi => gi >= 0);
            return h('td', { class: ones.includes(m) ? 'is-one' : '' },
                h('span', { class: 'kmap-val' }, ones.includes(m) ? '1' : '0'), h('small', { class: 'kmap-m' }, `m${m}`),
                ...covering.map((gi, k) => h('span', { class: 'kmap-group', style: { '--c': GROUP_COLORS[gi % GROUP_COLORS.length], '--i': k } })));
        })))));
}

function kmap(panel) {
    const input = h('input', { class: 'input mono big-input', value: "A'B'C' + A'BC' + AB'C + ABC + A'B'C", 'aria-label': 'Boolean expression or minterms' });
    const varSel = h('select', { class: 'select', 'aria-label': 'Variables for minterm list' }, [2, 3, 4].map(n => h('option', { value: n, selected: n === 4 }, `${n} variables`)));
    const out = h('div');
    const examples = h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Try:'), ...["A'B + AB'", '(A + B)(A + C)', 'm(0,2,5,7,8,10,13,15)', 'm(1,3,7,11,15)', "AB + A'C + BC", 'A ^ B ^ C'].map(ex => h('button', { type: 'button', class: 'chip chip-btn', onClick: () => { input.value = ex; render(); } }, ex)));
    const render = () => {
        const text = input.value.trim();
        let vars;
        let ones;
        try {
            const m = /^(?:m|Σm?|sum)?\s*\(?\s*([\d\s,]+)\)?$/i.exec(text);
            if (m) {
                const n = Number(varSel.value);
                vars = 'ABCD'.slice(0, n).split('');
                ones = [...new Set(m[1].split(/[\s,]+/).filter(Boolean).map(Number))].sort((a, b) => a - b);
                if (ones.some(x => x >= 2 ** n)) throw new Error(`Minterm ${Math.max(...ones)} is too big for ${n} variables (max ${2 ** n - 1}).`);
            } else {
                const p = parseExpression(text);
                vars = p.vars.length ? p.vars : ['A'];
                if (vars.length > 4) throw new Error('Use at most 4 variables (A–D) for a K-map.');
                if (vars.length < 2) vars = [...new Set([...vars, vars[0] === 'A' ? 'B' : 'A'])].sort();
                ones = minterms(p.ast, vars);
            }
            input.classList.remove('is-bad');
        } catch (err) {
            input.classList.add('is-bad');
            out.replaceChildren(h('p', { class: 'note note--bad' }, err.message, '. Use letters A–D, \' for NOT, + for OR, juxtaposition or . for AND, ^ for XOR, brackets.'));
            return;
        }
        const n = vars.length;
        const zeros = [...Array(2 ** n).keys()].filter(x => !ones.includes(x));
        const simp = simplify(ones, vars);
        const net = sopCircuit(simp.sop, vars);
        const literals = (txt) => (txt.match(/[A-D]/g) ?? []).length;
        out.replaceChildren(
            h('div', { class: 'grid-2' },
                h('div', {}, h('h4', {}, 'Truth table'), table([...vars, 'F'], [...Array(2 ** n).keys()].map(m => [...vars.map((_, k) => String((m >> (n - 1 - k)) & 1)), ones.includes(m) ? '1' : '0']))),
                h('div', {},
                    h('h4', {}, 'Canonical forms'),
                    formula(`F = Σm(${ones.join(', ') || '—'})`), formula(`F = ΠM(${zeros.join(', ') || '—'})`),
                    h('h4', {}, `K-map (${n} variables, Gray-code order)`), kmapGrid(ones, vars, simp.sop),
                    h('div', { class: 'kmap-legend' }, simp.sop.map((g, gi) => h('span', { class: 'chip', style: { '--c': GROUP_COLORS[gi % GROUP_COLORS.length] } }, h('span', { class: 'dot', style: { background: GROUP_COLORS[gi % GROUP_COLORS.length] } }), `group of ${g.covers.length}: m(${g.covers.join(',')})`))),
                    h('h4', {}, 'Minimal expressions'),
                    h('div', { class: 'grid-2' }, tile('Minimal SOP', simp.sopText, `${literals(simp.sopText)} literals`), tile('Minimal POS', simp.posText, `${literals(simp.posText)} literals`)))),
            h('h4', {}, 'Circuit for the minimal SOP (click the inputs)'),
            liveCircuit(net, { showTable: false }).el,
            note('Grouping rules: groups must be rectangles of 1, 2, 4, 8 or 16 cells, can wrap around the edges, and should be as large and as few as possible. Each group gives one product term; variables that change inside the group drop out.'));
    };
    input.addEventListener('input', render);
    varSel.addEventListener('change', render);
    panel.append(head('SOP, POS and K-map simplification', 'Type a Boolean expression (A\'B + AB\') or a minterm list (m(1,3,5,7)). The solver uses the Quine–McCluskey method, which is the same result a correctly drawn K-map gives.'),
        h('div', { class: 'row' }, h('div', { style: { flex: 1 } }, input), varSel), examples, out);
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'logic', [
        { id: 'gates', label: 'Logic gates', render: gates },
        { id: 'universal', label: 'Universal gates', render: universal },
        { id: 'laws', label: 'Boolean laws', render: laws },
        { id: 'kmap', label: 'K-map solver', render: kmap }
    ], tab);
}
