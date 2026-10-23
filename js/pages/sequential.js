// Latches and flip-flops: gate-level latches with feedback, race-around, edge-triggered flip-flops
// with timing diagrams, master–slave JK, and a general flip-flop conversion solver.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, formula, head } from '../core/page.js';
import { Circuit, minimise, implicantToTerm } from '../core/logic.js';
import { renderSchematic } from '../core/schematic.js';

export const intro = 'Sequential circuits have memory: their output depends on the present inputs AND on what happened before. The basic memory element is the latch, and a clocked latch becomes a flip-flop.';

// Draw stacked digital waveforms
export function timing(signals, { width = 760, rowH = 38 } = {}) {
    const n = Math.max(1, ...signals.map(sg => sg.values.length));
    const step = (width - 90) / Math.max(n, 8);
    const els = [];
    signals.forEach((sg, r) => {
        const y0 = 14 + r * rowH;
        const hi = y0 + 4;
        const lo = y0 + rowH - 12;
        els.push(s('text', { x: 8, y: (hi + lo) / 2 + 4, class: 'td-name' }, sg.name));
        let d = '';
        sg.values.forEach((v, i) => {
            const x = 80 + i * step;
            const y = v === null ? (hi + lo) / 2 : v ? hi : lo;
            d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
            d += ` L${x + step} ${y}`;
        });
        els.push(s('line', { x1: 80, y1: lo, x2: width - 10, y2: lo, class: 'td-base' }), s('path', { d, class: `td-wave${sg.color ? '' : ''}`, stroke: sg.color ?? '#0e7490' }));
    });
    for (let i = 0; i <= n; i++) els.unshift(s('line', { x1: 80 + i * step, y1: 6, x2: 80 + i * step, y2: 14 + signals.length * rowH, class: 'td-grid' }));
    return s('svg', { viewBox: `0 0 ${width} ${20 + signals.length * rowH}`, class: 'timing', role: 'img', 'aria-label': 'Timing diagram' }, ...els);
}

/* ---------- gate-level latches ---------- */
const LATCHES = {
    nor: {
        name: 'SR latch (NOR, active-high)',
        net: { inputs: ['S', 'R'], gates: [{ id: 'Q', type: 'NOR', in: ['R', 'Qb'] }, { id: 'Qb', type: 'NOR', in: ['S', 'Q'], init: 1 }], outputs: [{ name: 'Q', from: 'Q' }, { name: "Q'", from: 'Qb' }] },
        table: [['0', '0', 'Q (no change, memory)'], ['0', '1', '0 (reset)'], ['1', '0', '1 (set)'], ['1', '1', 'invalid: Q = Q\' = 0']],
        cols: ['S', 'R', 'Q next']
    },
    nand: {
        name: 'S\'R\' latch (NAND, active-low)',
        net: { inputs: ["S'", "R'"], gates: [{ id: 'Q', type: 'NAND', in: ["S'", 'Qb'] }, { id: 'Qb', type: 'NAND', in: ["R'", 'Q'], init: 1 }], outputs: [{ name: 'Q', from: 'Q' }, { name: "Q'", from: 'Qb' }], start: { "S'": 1, "R'": 1 } },
        table: [['1', '1', 'Q (no change)'], ['1', '0', '0 (reset)'], ['0', '1', '1 (set)'], ['0', '0', 'invalid: Q = Q\' = 1']],
        cols: ["S'", "R'", 'Q next']
    },
    d: {
        name: 'Gated D latch (transparent)',
        net: { inputs: ['D', 'EN'], gates: [{ id: 'nd', type: 'NOT', in: ['D'] }, { id: 's', type: 'NAND', in: ['D', 'EN'] }, { id: 'r', type: 'NAND', in: ['nd', 'EN'] }, { id: 'Q', type: 'NAND', in: ['s', 'Qb'] }, { id: 'Qb', type: 'NAND', in: ['r', 'Q'], init: 1 }], outputs: [{ name: 'Q', from: 'Q' }, { name: "Q'", from: 'Qb' }] },
        table: [['0', 'X', 'Q (holds)'], ['1', '0', '0'], ['1', '1', '1']],
        cols: ['EN', 'D', 'Q next']
    },
    jk: {
        name: 'JK flip-flop from NAND (level-triggered)',
        net: { inputs: ['J', 'K', 'CLK'], gates: [{ id: 'gj', type: 'NAND', in: ['J', 'CLK', 'Qb'], init: 1 }, { id: 'gk', type: 'NAND', in: ['K', 'CLK', 'Q'], init: 1 }, { id: 'Q', type: 'NAND', in: ['gj', 'Qb'] }, { id: 'Qb', type: 'NAND', in: ['gk', 'Q'], init: 1 }], outputs: [{ name: 'Q', from: 'Q' }, { name: "Q'", from: 'Qb' }] },
        table: [['0', 'X', 'X', 'Q (clock low)'], ['1', '0', '0', 'Q (hold)'], ['1', '0', '1', '0 (reset)'], ['1', '1', '0', '1 (set)'], ['1', '1', '1', 'Q\' (toggle) → race-around while CLK stays high']],
        cols: ['CLK', 'J', 'K', 'Q next']
    }
};

export function latchLab(key) {
    const L = LATCHES[key];
    const c = new Circuit(L.net);
    Object.entries(L.net.start ?? {}).forEach(([k, v]) => c.set(k, v));
    c.settle();
    const status = h('p');
    const history = { names: [...L.net.inputs, 'Q', "Q'"], rows: [] };
    const td = h('div', { class: 'svg-box' });
    let animating = null;
    let sch;
    const record = () => {
        history.rows.push([...L.net.inputs.map(n => c.get(n)), c.get('Q'), c.get('Qb')]);
        if (history.rows.length > 28) history.rows.shift();
        td.replaceChildren(timing(history.names.map((name, i) => ({ name, values: history.rows.map(r => r[i]), color: i >= L.net.inputs.length ? '#dc2626' : '#0e7490' }))));
    };
    const report = (stable) => {
        const q = c.get('Q');
        const qb = c.get('Qb');
        if (!stable) { status.className = 'note note--bad'; status.textContent = 'OSCILLATING: the output keeps toggling every few gate delays while the clock is high. This is the race-around condition. Real designs fix it with a master–slave or edge-triggered flip-flop.'; }
        else if (q === qb) { status.className = 'note note--warn'; status.textContent = `Invalid state: Q and Q' are both ${q}. When the inputs return to the hold state, the result is unpredictable.`; }
        else { status.className = 'note note--good'; status.textContent = `Q = ${q}, Q' = ${qb}`; }
    };
    const toggle = (name) => {
        clearInterval(animating);
        c.set(name, c.get(name) ? 0 : 1);
        const res = c.settle();
        sch.update();
        record();
        report(res.stable);
        if (!res.stable) {
            // show the oscillation slowly, one gate delay at a time
            animating = setInterval(() => { c.step(); sch.update(); record(); }, 260);
        }
    };
    sch = renderSchematic(c, { onToggle: toggle });
    record();
    report(true);
    const el = h('div', {},
        h('div', { class: 'live-circuit' }, h('div', { class: 'svg-box sch-box' }, sch.svg), h('div', { class: 'tt-box' }, table(L.cols, L.table))),
        status, h('h4', {}, 'Timing diagram (each change you make adds a step)'), td);
    return { el, stop: () => clearInterval(animating) };
}

function latches(panel) {
    const box = h('div');
    let current;
    const seg = h('div', { class: 'seg seg--wrap' }, Object.entries(LATCHES).map(([k, l]) => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, l.name.split(' (')[0])));
    const show = (k) => {
        current?.stop();
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
        current = latchLab(k);
        box.replaceChildren(h('h3', {}, LATCHES[k].name), current.el);
    };
    panel.append(head('Latches built from gates', 'Two cross-coupled gates feed each other: that feedback loop is what stores one bit. These are real gate-level simulations with gate delays.'), seg, box,
        note('Try the JK: set J = 1, K = 1, then CLK = 1. Because the clock stays high for much longer than a gate delay, the output toggles again and again.'));
    show('nor');
    return () => current?.stop();
}

/* ---------- edge-triggered flip-flops ---------- */
const FF = {
    SR: { inputs: ['S', 'R'], next: ({ S, R }, q) => (S && R ? null : S ? 1 : R ? 0 : q), eq: 'Q(n+1) = S + R\'Q   (SR = 0)', table: [['0', '0', 'Q', 'hold'], ['0', '1', '0', 'reset'], ['1', '0', '1', 'set'], ['1', '1', '?', 'invalid']] },
    JK: { inputs: ['J', 'K'], next: ({ J, K }, q) => (J && K ? 1 - q : J ? 1 : K ? 0 : q), eq: 'Q(n+1) = JQ\' + K\'Q', table: [['0', '0', 'Q', 'hold'], ['0', '1', '0', 'reset'], ['1', '0', '1', 'set'], ['1', '1', 'Q\'', 'toggle']] },
    D: { inputs: ['D'], next: ({ D }) => D, eq: 'Q(n+1) = D', table: [['0', '0', 'reset'], ['1', '1', 'set']] },
    T: { inputs: ['T'], next: ({ T }, q) => (T ? 1 - q : q), eq: 'Q(n+1) = T ⊕ Q', table: [['0', 'Q', 'hold'], ['1', 'Q\'', 'toggle']] }
};

function flipflops(panel) {
    const st = { type: 'JK', ins: { S: 0, R: 0, J: 1, K: 1, D: 0, T: 1 }, q: 0, hist: [], ms: false };
    const seg = h('div', { class: 'seg' }, Object.keys(FF).map(t => h('button', { type: 'button', dataset: { t }, onClick: () => { st.type = t; st.hist = []; render(); } }, `${t} flip-flop`)));
    const box = h('div');
    const push = (clk, q) => {
        st.hist.push({ clk, ins: { ...st.ins }, q, slave: st.slave });
        if (st.hist.length > 30) st.hist.shift();
    };
    const pulse = () => {
        const f = FF[st.type];
        push(0, st.q);
        // rising edge: master samples (shown as clk high)
        const nq = f.next(st.ins, st.q);
        push(1, st.ms ? st.q : (nq ?? st.q));
        st.q = nq ?? st.q;
        if (st.ms) push(0, st.q); // slave copies on the falling edge
        render(nq === null ? 'S = R = 1 is not allowed: the next state is undefined. ' : '');
    };
    const render = (warn = '') => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.t === st.type));
        const f = FF[st.type];
        if (!st.hist.length) push(0, st.q);
        const insEls = f.inputs.map(name => h('button', { type: 'button', class: `bitbtn${st.ins[name] ? ' is-on' : ''}`, 'aria-pressed': Boolean(st.ins[name]), onClick: () => { st.ins[name] ^= 1; push(0, st.q); render(); } }, h('small', {}, name), st.ins[name]));
        const sigs = [{ name: 'CLK', values: st.hist.map(x => x.clk), color: '#64748b' }, ...f.inputs.map(n => ({ name: n, values: st.hist.map(x => x.ins[n]), color: '#0e7490' })), { name: 'Q', values: st.hist.map(x => x.q), color: '#dc2626' }];
        const cur = f.inputs.map(n => st.ins[n]).join('');
        box.replaceChildren(
            h('div', { class: 'row' }, ...insEls, h('button', { type: 'button', class: 'btn', onClick: pulse }, '⏵ Clock pulse'), h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { st.q = 0; st.hist = []; render(); } }, 'Reset Q = 0'),
                h('span', { class: `q-led${st.q ? ' is-on' : ''}` }, `Q = ${st.q}`), h('span', { class: `q-led q-led--bar${st.q ? '' : ' is-on'}` }, `Q' = ${1 - st.q}`),
                h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: st.ms, onChange: e => { st.ms = e.target.checked; render(); } }), 'Master–slave (output changes on the falling edge)')),
            warn ? h('p', { class: 'note note--bad' }, warn) : '',
            h('div', { class: 'svg-box' }, timing(sigs)),
            h('div', { class: 'grid-2' },
                h('div', {}, h('h4', {}, 'Characteristic table'), (() => { const t = table([...f.inputs, 'Q(n+1)', 'Action'], f.table); t.querySelectorAll('tbody tr').forEach(tr => { if ([...tr.children].slice(0, f.inputs.length).map(td => td.textContent).join('') === cur) tr.classList.add('is-current'); }); return t; })()),
                h('div', {}, h('h4', {}, 'Characteristic equation'), formula(f.eq),
                    st.type === 'JK' ? note('J = K = 1 toggles. In an edge-triggered (or master–slave) JK the output can only change once per clock pulse, so there is no race-around.') : '',
                    st.type === 'T' ? note('Tie J and K together and you get a T flip-flop. Each clock pulse with T = 1 halves the frequency: the basis of counters.') : '',
                    st.type === 'D' ? note('D "delays" the input by one clock. Every register in a CPU is built from D flip-flops.') : '')));
    };
    panel.append(head('Edge-triggered flip-flops', 'A flip-flop only changes at the clock edge, no matter how the inputs move in between. Set the inputs, then press Clock pulse, and watch the timing diagram.'), seg, box,
        h('h4', {}, 'Master–slave JK flip-flop'),
        h('div', { class: 'grid-2' },
            h('div', { class: 'card' }, h('p', {}, 'Two latches in series: the master is enabled while the clock is HIGH, the slave while it is LOW (through an inverter). The master can follow J and K during the high phase, but the output (slave) only updates when the clock falls, so it changes exactly once per pulse.')),
            h('div', { class: 'ms-block' }, h('div', {}, h('b', {}, 'Master'), h('small', {}, 'enabled when CLK = 1')), h('span', {}, '→'), h('div', {}, h('b', {}, 'Slave'), h('small', {}, 'enabled when CLK = 0')), h('span', {}, '→ Q'))));
    render();
}

/* ---------- conversions ---------- */
const EXCITE = {
    SR: { inputs: ['S', 'R'], need: (q, n) => (q === 0 ? (n === 0 ? [0, null] : [1, 0]) : (n === 0 ? [0, 1] : [null, 0])) },
    JK: { inputs: ['J', 'K'], need: (q, n) => (q === 0 ? (n === 0 ? [0, null] : [1, null]) : (n === 0 ? [null, 1] : [null, 0])) },
    D: { inputs: ['D'], need: (q, n) => [n] },
    T: { inputs: ['T'], need: (q, n) => [q ^ n] }
};

function conversions(panel) {
    const st = { from: 'SR', to: 'JK' };
    const out = h('div');
    const sel = (key, label) => h('label', { class: 'num-field' }, h('span', {}, label), h('select', { class: 'select', onChange: e => { st[key] = e.target.value; render(); } }, Object.keys(FF).map(t => h('option', { value: t, selected: st[key] === t }, `${t} flip-flop`))));
    const render = () => {
        if (st.from === st.to) { out.replaceChildren(h('p', { class: 'note note--warn' }, 'Pick two different flip-flops.')); return; }
        const target = FF[st.to];
        const avail = EXCITE[st.from];
        const vars = [...target.inputs, 'Q'];
        const n = vars.length;
        const rows = [];
        const ones = avail.inputs.map(() => []);
        const dcs = avail.inputs.map(() => []);
        for (let m = 0; m < 2 ** n; m++) {
            const bits = vars.map((_, k) => (m >> (n - 1 - k)) & 1);
            const ins = Object.fromEntries(target.inputs.map((v, k) => [v, bits[k]]));
            const q = bits[n - 1];
            const next = target.next(ins, q);
            if (next === null) { avail.inputs.forEach((_, k) => dcs[k].push(m)); rows.push([...bits.map(String), 'X', ...avail.inputs.map(() => 'X')]); continue; }
            const need = avail.need(q, next);
            need.forEach((v, k) => { if (v === null) dcs[k].push(m); else if (v) ones[k].push(m); });
            rows.push([...bits.map(String), String(next), ...need.map(v => (v === null ? 'X' : String(v)))]);
        }
        const exprs = avail.inputs.map((name, k) => {
            const imps = minimise(ones[k], n, dcs[k]);
            const text = ones[k].length ? imps.map(p => implicantToTerm(p, vars.map(v => (v === 'Q' ? 'Q' : v)), 'sop')).join(' + ') : '0';
            return `${name} = ${text.replace(/'/g, '\'')}`;
        });
        out.replaceChildren(
            h('ol', { class: 'steps' },
                h('li', {}, `Write the characteristic table of the flip-flop you WANT (${st.to}): inputs ${target.inputs.join(', ')} and present state Q give Q(n+1).`),
                h('li', {}, `For each row, look up the excitation table of the flip-flop you HAVE (${st.from}) to find which inputs produce that change Q → Q(n+1). X means don't care.`),
                h('li', {}, `Simplify each required input with a K-map (don't cares help make bigger groups).`)),
            table([...vars, 'Q(n+1)', ...avail.inputs.map(i => `${i} (needed)`)], rows),
            h('h4', {}, 'Result'), ...exprs.map(e => formula(e)),
            h('p', { class: 'muted' }, `So: add gates that compute ${exprs.join(' and ')} in front of a ${st.from} flip-flop and it behaves exactly like a ${st.to} flip-flop.`));
    };
    panel.append(head('Converting one flip-flop into another', 'Pick the flip-flop you have and the one you want. The steps, table and simplified equations are generated for any pair.'), h('div', { class: 'row inputs-row' }, sel('from', 'I have'), sel('to', 'I want')), out,
        h('h4', {}, 'Excitation tables (what input causes a given change)'),
        table(['Q → Q(n+1)', 'S R', 'J K', 'D', 'T'], [['0 → 0', '0 X', '0 X', '0', '0'], ['0 → 1', '1 0', '1 X', '1', '1'], ['1 → 0', '0 1', 'X 1', '0', '1'], ['1 → 1', 'X 0', 'X 0', '1', '0']]));
    render();
}

export function render(page, { tab }) {
    const cleanups = [];
    const view = pageTabs(page, 'sequential', [
        { id: 'latches', label: 'Latches (gate level)', render: (p) => cleanups.push(latches(p)) },
        { id: 'flipflops', label: 'Flip-flops & timing', render: flipflops },
        { id: 'conversions', label: 'Flip-flop conversion', render: conversions }
    ], tab);
    return { ...view, cleanup: () => cleanups.forEach(fn => fn?.()) };
}
