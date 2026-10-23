// Registers and counters: shift registers (SISO, SIPO, PISO, PIPO), ripple and synchronous counters,
// mod-N, ring and Johnson counters, with timing diagrams.

import { h, table, note } from '../core/ui.js';
import { pageTabs, tile, formula, head } from '../core/page.js';
import { timing } from './sequential.js';

export const intro = 'Put flip-flops side by side and you get registers (which store and shift words) and counters (which step through states on every clock). They are inside every processor, timer and digital clock.';

const ffBoxes = (bits, labels = ['Q0', 'Q1', 'Q2', 'Q3']) => h('div', { class: 'ff-row' }, bits.map((b, i) => h('div', { class: `ff-box${b ? ' is-on' : ''}` }, h('small', {}, `FF${i}`), h('b', {}, b), h('small', {}, labels[i]))));

function shiftRegister(panel) {
    const st = { mode: 'SISO', reg: [0, 0, 0, 0], serial: 1, par: [1, 0, 1, 1], hist: [], out: [], loadNext: true };
    const MODES = {
        SISO: 'Serial in, serial out. Data enters one bit per clock and leaves from the last flip-flop 4 clocks later. Used as a time delay and in serial communication buffers.',
        SIPO: 'Serial in, parallel out. Feed bits one at a time, then read all four at once. Converts serial data (e.g. from a modem or UART) into a parallel word.',
        PISO: 'Parallel in, serial out. Load all four bits at once, then shift them out one per clock. Converts a parallel word into a serial stream, like USB or SPI transmitters.',
        PIPO: 'Parallel in, parallel out. All bits are loaded and read together on one clock. Used as a temporary buffer register.'
    };
    const box = h('div');
    const seg = h('div', { class: 'seg' }, Object.keys(MODES).map(m => h('button', { type: 'button', dataset: { m }, onClick: () => { st.mode = m; st.reg = [0, 0, 0, 0]; st.hist = []; st.out = []; st.loadNext = true; render(); } }, m)));
    const record = (clk) => { st.hist.push({ clk, reg: [...st.reg], sin: st.serial }); if (st.hist.length > 32) st.hist.shift(); };
    const clock = () => {
        record(0);
        if (st.mode === 'PIPO' || (st.mode === 'PISO' && st.loadNext)) { st.reg = [...st.par]; st.loadNext = false; }
        else { st.out.push(st.reg[3]); st.reg = [st.mode === 'PISO' ? 0 : st.serial, ...st.reg.slice(0, 3)]; }
        record(1);
        render();
    };
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.m === st.mode));
        const serialIn = st.mode === 'SISO' || st.mode === 'SIPO';
        const parallelIn = st.mode === 'PISO' || st.mode === 'PIPO';
        if (!st.hist.length) record(0);
        box.replaceChildren(
            h('p', { class: 'muted' }, MODES[st.mode]),
            h('div', { class: 'row' },
                serialIn ? h('button', { type: 'button', class: `bitbtn${st.serial ? ' is-on' : ''}`, onClick: () => { st.serial ^= 1; render(); } }, h('small', {}, 'serial in'), st.serial) : '',
                parallelIn ? h('div', { class: 'row' }, h('span', { class: 'muted' }, 'parallel inputs'), ...st.par.map((b, i) => h('button', { type: 'button', class: `bitbtn${b ? ' is-on' : ''}`, onClick: () => { st.par[i] ^= 1; render(); } }, h('small', {}, `D${i}`), b))) : '',
                h('button', { type: 'button', class: 'btn', onClick: clock }, st.mode === 'PISO' && st.loadNext ? '⏵ Clock (load)' : '⏵ Clock (shift)'),
                st.mode === 'PISO' ? h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { st.loadNext = true; render(); } }, 'Load on next clock') : '',
                h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { st.reg = [0, 0, 0, 0]; st.hist = []; st.out = []; st.loadNext = true; render(); } }, 'Clear')),
            ffBoxes(st.reg),
            h('div', { class: 'grid-3' }, tile('Parallel output', st.mode === 'SISO' || st.mode === 'PISO' ? 'not available' : st.reg.join('')), tile('Serial output (Q3)', st.mode === 'SIPO' || st.mode === 'PIPO' ? 'not used' : String(st.reg[3])), tile('Bits shifted out so far', st.out.join(' ') || '—')),
            h('div', { class: 'svg-box' }, timing([{ name: 'CLK', values: st.hist.map(x => x.clk), color: '#64748b' }, ...(serialIn ? [{ name: 'Serial in', values: st.hist.map(x => x.sin) }] : []), ...[0, 1, 2, 3].map(i => ({ name: `Q${i}`, values: st.hist.map(x => x.reg[i]), color: '#dc2626' }))])));
    };
    panel.append(head('Shift registers', 'A chain of D flip-flops sharing one clock: each flip-flop passes its bit to the next on every clock edge.'), seg, box);
    render();
}

// counter timeline: each clock period is split into sub-steps so ripple delays are visible
function counterTimeline({ kind, bits, mod, steps, start = 0 }) {
    const SUB = 6;
    const max = 2 ** bits;
    const seq = [];
    let q = start;
    const clk = [];
    const states = Array.from({ length: bits }, () => []);
    const glitches = [];
    const nextOf = (v) => {
        if (kind === 'down') return (v - 1 + max) % max;
        if (kind === 'ring') return ((v << 1) | (v >> (bits - 1))) & (max - 1);
        if (kind === 'johnson') return ((v << 1) | ((v >> (bits - 1)) ^ 1)) & (max - 1);
        return (v + 1) % max;
    };
    for (let c = 0; c < steps; c++) {
        let target = nextOf(q);
        const ripple = kind === 'up' || kind === 'down' || kind === 'mod';
        const values = [];
        if (kind === 'mod' && target === mod) target = mod; // reaches N briefly, then clears
        for (let s = 0; s < SUB; s++) {
            clk.push(s < SUB / 2 ? 1 : 0);
            let cur;
            if (!ripple || kind === 'sync') cur = s >= 1 ? target : q;
            else {
                // bit i changes i sub-steps after the edge (ripple)
                cur = 0;
                for (let b = 0; b < bits; b++) {
                    const changed = ((q ^ target) >> b) & 1;
                    const from = (q >> b) & 1;
                    const to = (target >> b) & 1;
                    cur |= (changed ? (s >= 1 + b ? to : from) : from) << b;
                }
                if (kind === 'mod' && target === mod && s >= bits + 1) cur = 0;
            }
            values.push(cur);
            for (let b = 0; b < bits; b++) states[b].push((cur >> b) & 1);
        }
        const transient = [...new Set(values.slice(1, -1))].filter(v => v !== q && v !== target && !(kind === 'mod' && v === 0));
        if (transient.length) glitches.push(`${q.toString(2).padStart(bits, '0')} → ${target === mod && kind === 'mod' ? '0'.repeat(bits) : target.toString(2).padStart(bits, '0')} passes through ${transient.map(v => v.toString(2).padStart(bits, '0')).join(', ')}`);
        seq.push(q);
        q = kind === 'mod' && target === mod ? 0 : target;
    }
    return { clk, states, seq, glitches, end: q };
}

function counters(panel) {
    const st = { kind: 'up', sync: false, bits: 4, mod: 6, steps: 10 };
    const box = h('div');
    const KINDS = { up: 'Up counter', down: 'Down counter', mod: 'Mod-N counter', ring: 'Ring counter', johnson: 'Johnson counter' };
    const seg = h('div', { class: 'seg seg--wrap' }, Object.entries(KINDS).map(([k, l]) => h('button', { type: 'button', dataset: { k }, onClick: () => { st.kind = k; render(); } }, l)));
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === st.kind));
        const ripplable = ['up', 'down', 'mod'].includes(st.kind);
        const kind = ripplable && st.sync ? (st.kind === 'mod' ? 'mod' : 'sync') : st.kind;
        const start = st.kind === 'ring' ? 1 : st.kind === 'down' ? 2 ** st.bits - 1 : 0;
        const t = st.kind === 'down' && st.sync
            ? counterTimeline({ kind: 'down', bits: st.bits, steps: st.steps, start }) // sync down: compute then flatten ripple below
            : counterTimeline({ kind: kind === 'sync' ? 'sync' : st.kind, bits: st.bits, mod: st.mod, steps: st.steps, start });
        if (st.sync && ripplable) {
            // synchronous: all bits change together right after the edge
            const SUB = 6;
            t.states = t.states.map(() => []);
            t.glitches = [];
            let q = start;
            const max = 2 ** st.bits;
            t.seq = [];
            for (let c = 0; c < st.steps; c++) {
                const nxt = st.kind === 'down' ? (q - 1 + max) % max : st.kind === 'mod' ? (q + 1) % st.mod : (q + 1) % max;
                for (let s = 0; s < SUB; s++) { const cur = s >= 1 ? nxt : q; for (let b = 0; b < st.bits; b++) t.states[b].push((cur >> b) & 1); }
                t.seq.push(q);
                q = nxt;
            }
        }
        const states = st.kind === 'ring' ? st.bits : st.kind === 'johnson' ? 2 * st.bits : st.kind === 'mod' ? st.mod : 2 ** st.bits;
        box.replaceChildren(
            h('div', { class: 'grid-4' }, tile('Number of states (modulus)', String(states)), tile('Flip-flops', String(st.bits)), tile('Clocking', ripplable ? (st.sync ? 'synchronous' : 'asynchronous (ripple)') : 'synchronous (shift register)'), tile('Sequence', t.seq.map(v => v.toString(2).padStart(st.bits, '0')).slice(0, 6).join(' → ') + ' …')),
            h('div', { class: 'svg-box' }, timing([{ name: 'CLK', values: t.clk, color: '#64748b' }, ...t.states.map((v, b) => ({ name: `Q${b}`, values: v, color: '#dc2626' }))], { rowH: 34 })),
            ripplable && !st.sync && t.glitches.length ? h('div', { class: 'note note--warn' }, h('b', {}, 'Ripple glitches: '), 'each flip-flop is clocked by the previous one, so bits change one after another. During that time the counter briefly shows wrong values:', h('ul', {}, t.glitches.slice(0, 3).map(g => h('li', { class: 'mono' }, g)))) : '',
            st.kind === 'mod' ? h('p', { class: 'note' }, `Mod-${st.mod}: a gate watches for the count ${st.mod} (${st.mod.toString(2).padStart(st.bits, '0')}) and immediately clears all flip-flops, so the counter goes 0, 1, … ${st.mod - 1}, 0. ${st.sync ? 'In the synchronous design, the next-state logic simply sends the count from ' + (st.mod - 1) + ' to 0.' : 'Notice the brief spike of the unwanted state before it resets.'}`) : '',
            st.kind === 'ring' ? h('p', { class: 'note' }, 'A ring counter is a shift register whose last output feeds back to the first. A single 1 circulates, giving n states with n flip-flops. No decoding needed: each flip-flop is one state.') : '',
            st.kind === 'johnson' ? h('p', { class: 'note' }, 'A Johnson (twisted ring) counter feeds back the INVERTED last output. With n flip-flops it has 2n states, and only one bit changes at a time. Used to generate multiphase clocks.') : '');
    };
    panel.append(head('Counters', 'Choose a counter and watch its timing diagram. For up, down and mod-N you can switch between ripple (asynchronous) and synchronous clocking.'),
        seg, h('div', { class: 'row inputs-row' },
            h('label', { class: 'row' }, h('input', { type: 'checkbox', onChange: e => { st.sync = e.target.checked; render(); } }), 'Synchronous (all flip-flops share one clock)'),
            h('label', { class: 'num-field' }, h('span', {}, 'N for mod-N'), h('select', { class: 'select', onChange: e => { st.mod = Number(e.target.value); render(); } }, [3, 5, 6, 10, 12].map(n => h('option', { value: n, selected: n === st.mod }, `Mod-${n}`))))), box,
        h('h4', {}, 'Asynchronous vs synchronous'),
        table(['', 'Asynchronous (ripple)', 'Synchronous'], [['Clock', 'Only the first flip-flop; each one clocks the next', 'All flip-flops at once'], ['Speed', 'Slow: delays add up (n × tpd)', 'Fast: one delay'], ['Glitches', 'Yes, during rippling', 'No'], ['Circuit', 'Simple, no extra gates', 'Needs AND gates for the T/JK inputs'], ['Example', 'Frequency dividers, simple timers', 'Processors, high-speed counters']]),
        formula('Mod-N needs n flip-flops where 2^n ≥ N.  A 4-bit counter divides the clock frequency by 16 (Q3 toggles at f/16).'));
    render();
}

export function render(page, { tab }) {
    return pageTabs(page, 'counters', [
        { id: 'shift', label: 'Shift registers', render: shiftRegister },
        { id: 'counters', label: 'Counters', render: counters }
    ], tab);
}
