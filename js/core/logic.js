// A small gate-level logic simulator.
// Every gate has one unit of delay, so circuits with feedback (latches, flip-flops)
// settle step by step, and unstable ones (JK race-around) can be seen oscillating.

export const OPS = {
    AND: v => v.every(Boolean),
    OR: v => v.some(Boolean),
    NOT: v => !v[0],
    BUF: v => Boolean(v[0]),
    NAND: v => !v.every(Boolean),
    NOR: v => !v.some(Boolean),
    XOR: v => v.filter(Boolean).length % 2 === 1,
    XNOR: v => v.filter(Boolean).length % 2 === 0
};

export class Circuit {
    // inputs: ['A', 'B'], gates: [{ id: 'g1', type: 'AND', in: ['A', 'B'] }], outputs: [{ name: 'Y', from: 'g1' }]
    constructor({ inputs, gates, outputs }) {
        this.inputs = inputs;
        this.gates = gates;
        this.outputs = outputs;
        this.values = {};
        inputs.forEach(name => { this.values[name] = 0; });
        gates.forEach(g => { this.values[g.id] = g.init ?? 0; });
        // A perfectly symmetric start (both latch outputs equal) never settles in a
        // unit-delay model. Real circuits break the tie with tiny timing differences,
        // so do the same with a few in-order passes, then settle normally.
        if (!this.settle().stable) {
            for (let k = 0; k < 4; k++) this.gates.forEach(g => { this.values[g.id] = OPS[g.type](g.in.map(sig => this.get(sig))) ? 1 : 0; });
            this.settle();
        }
    }

    set(name, value) {
        this.values[name] = value ? 1 : 0;
    }

    get(signal) {
        return this.values[signal] ?? 0;
    }

    out(name) {
        return this.get(this.outputs.find(o => o.name === name).from);
    }

    // One gate delay: every gate looks at the values from the previous instant.
    step() {
        const next = {};
        let changed = false;
        for (const g of this.gates) {
            const v = OPS[g.type](g.in.map(sig => this.get(sig))) ? 1 : 0;
            next[g.id] = v;
            if (v !== this.values[g.id]) changed = true;
        }
        Object.assign(this.values, next);
        return changed;
    }

    // Keep stepping until nothing changes. If it never settles, the circuit is oscillating.
    settle(max = 64) {
        for (let i = 0; i < max; i++) {
            if (!this.step()) return { stable: true, steps: i };
        }
        return { stable: false, steps: max };
    }

    // Truth table for purely combinational circuits
    truthTable() {
        const n = this.inputs.length;
        const rows = [];
        const saved = { ...this.values };
        for (let i = 0; i < 2 ** n; i++) {
            const ins = this.inputs.map((_, k) => (i >> (n - 1 - k)) & 1);
            this.inputs.forEach((name, k) => this.set(name, ins[k]));
            this.settle();
            rows.push({ ins, outs: this.outputs.map(o => this.get(o.from)) });
        }
        this.values = saved;
        return rows;
    }
}

/* ---------------- Boolean expressions ---------------- */

// Grammar:  expr := term ('+' term)*      (OR)
//           term := xor (('.' | '*' | implicit) xor)*   (AND)
//           xor  := unary ('^' unary)*
//           unary:= factor "'"*  |  '!' unary  |  '~' unary
//           factor := VAR | '0' | '1' | '(' expr ')'
export function parseExpression(text) {
    const src = text.replace(/\s+/g, '');
    let i = 0;
    const vars = new Set();
    const peek = () => src[i];
    const fail = (msg) => { throw new Error(`${msg} at position ${i + 1}`); };

    const factor = () => {
        const c = peek();
        if (c === '(') {
            i++;
            const e = expr();
            if (peek() !== ')') fail('Missing ")"');
            i++;
            return e;
        }
        if (c === '0' || c === '1') { i++; return { t: 'const', v: Number(c) }; }
        if (/[A-Za-z]/.test(c ?? '')) { i++; const name = c.toUpperCase(); vars.add(name); return { t: 'var', name }; }
        fail(c ? `Unexpected "${c}"` : 'Expression ends too early');
    };
    const unary = () => {
        if (peek() === '!' || peek() === '~') { i++; return { t: 'not', a: unary() }; }
        let node = factor();
        while (peek() === "'") { i++; node = { t: 'not', a: node }; }
        return node;
    };
    const xor = () => {
        let node = unary();
        while (peek() === '^') { i++; node = { t: 'xor', a: node, b: unary() }; }
        return node;
    };
    const term = () => {
        let node = xor();
        while (peek() === '.' || peek() === '*' || /[A-Za-z01(!~]/.test(peek() ?? '')) {
            if (peek() === '.' || peek() === '*') i++;
            node = { t: 'and', a: node, b: xor() };
        }
        return node;
    };
    const expr = () => {
        let node = term();
        while (peek() === '+' || peek() === '|') { i++; node = { t: 'or', a: node, b: term() }; }
        return node;
    };

    if (!src) throw new Error('Type an expression');
    const ast = expr();
    if (i < src.length) fail(`Unexpected "${src[i]}"`);
    return { ast, vars: [...vars].sort() };
}

export function evaluate(ast, env) {
    switch (ast.t) {
        case 'const': return ast.v;
        case 'var': return env[ast.name] ? 1 : 0;
        case 'not': return evaluate(ast.a, env) ? 0 : 1;
        case 'and': return evaluate(ast.a, env) & evaluate(ast.b, env);
        case 'or': return evaluate(ast.a, env) | evaluate(ast.b, env);
        case 'xor': return evaluate(ast.a, env) ^ evaluate(ast.b, env);
    }
    return 0;
}

export function minterms(ast, vars) {
    const out = [];
    for (let m = 0; m < 2 ** vars.length; m++) {
        const env = Object.fromEntries(vars.map((v, k) => [v, (m >> (vars.length - 1 - k)) & 1]));
        if (evaluate(ast, env)) out.push(m);
    }
    return out;
}

/* ---------------- Quine–McCluskey minimisation ---------------- */

const bitsOn = (n) => n.toString(2).split('').filter(b => b === '1').length;

// Implicant = { value, mask } where mask bits are "don't care" (combined) positions
export function primeImplicants(ones, n, dontCares = []) {
    let groups = [...new Set([...ones, ...dontCares])].map(m => ({ value: m, mask: 0, covers: [m] }));
    const primes = [];
    while (groups.length) {
        const used = new Set();
        const next = new Map();
        for (let a = 0; a < groups.length; a++) {
            for (let b = a + 1; b < groups.length; b++) {
                const x = groups[a];
                const y = groups[b];
                if (x.mask !== y.mask) continue;
                const diff = x.value ^ y.value;
                if (bitsOn(diff) !== 1) continue;
                const value = x.value & ~diff;
                const mask = x.mask | diff;
                const key = `${value}/${mask}`;
                if (!next.has(key)) next.set(key, { value, mask, covers: [...new Set([...x.covers, ...y.covers])].sort((p, q) => p - q) });
                used.add(a);
                used.add(b);
            }
        }
        groups.forEach((g, k) => { if (!used.has(k)) primes.push(g); });
        groups = [...next.values()];
    }
    // drop duplicates
    const seen = new Set();
    return primes.filter(p => { const k = `${p.value}/${p.mask}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

// Pick a small set of prime implicants that covers every required minterm:
// essential primes first, then greedily the one covering the most remaining terms.
export function minimise(ones, n, dontCares = []) {
    if (!ones.length) return [];
    if (ones.length + dontCares.length === 2 ** n) return [{ value: 0, mask: 2 ** n - 1, covers: ones }];
    const primes = primeImplicants(ones, n, dontCares);
    const remaining = new Set(ones);
    const chosen = [];
    for (const m of ones) {
        const covering = primes.filter(p => p.covers.includes(m));
        if (covering.length === 1 && !chosen.includes(covering[0])) {
            chosen.push(covering[0]);
            covering[0].covers.forEach(c => remaining.delete(c));
        }
    }
    while (remaining.size) {
        const best = primes.filter(p => !chosen.includes(p))
            .sort((p, q) => q.covers.filter(c => remaining.has(c)).length - p.covers.filter(c => remaining.has(c)).length || bitsOn(q.mask) - bitsOn(p.mask))[0];
        chosen.push(best);
        best.covers.forEach(c => remaining.delete(c));
    }
    return chosen;
}

export function implicantToTerm(imp, vars, form = 'sop') {
    const n = vars.length;
    const parts = [];
    for (let k = 0; k < n; k++) {
        const bit = 1 << (n - 1 - k);
        if (imp.mask & bit) continue;
        const one = Boolean(imp.value & bit);
        if (form === 'sop') parts.push(one ? vars[k] : `${vars[k]}'`);
        else parts.push(one ? `${vars[k]}'` : vars[k]);
    }
    if (form === 'sop') return parts.join('') || '1';
    return parts.length > 1 ? `(${parts.join(' + ')})` : parts[0] ?? '0';
}

export function simplify(ones, vars) {
    const n = vars.length;
    const sop = minimise(ones, n);
    const zeros = [...Array(2 ** n).keys()].filter(m => !ones.includes(m));
    const pos = minimise(zeros, n);
    return {
        sop, pos,
        sopText: ones.length === 0 ? '0' : sop.map(p => implicantToTerm(p, vars, 'sop')).join(' + '),
        posText: zeros.length === 0 ? '1' : pos.map(p => implicantToTerm(p, vars, 'pos')).join('')
    };
}

// Build a gate netlist (NOT → AND → OR) for a minimal SOP so it can be drawn and simulated
export function sopCircuit(implicants, vars, outName = 'F') {
    const n = vars.length;
    const gates = [];
    const inverted = new Set();
    const terms = [];
    implicants.forEach((imp, t) => {
        const lits = [];
        for (let k = 0; k < n; k++) {
            const bit = 1 << (n - 1 - k);
            if (imp.mask & bit) continue;
            if (imp.value & bit) lits.push(vars[k]);
            else { inverted.add(vars[k]); lits.push(`n${vars[k]}`); }
        }
        if (lits.length === 1) terms.push(lits[0]);
        else if (lits.length > 1) { gates.push({ id: `t${t}`, type: 'AND', in: lits }); terms.push(`t${t}`); }
    });
    inverted.forEach(v => gates.unshift({ id: `n${v}`, type: 'NOT', in: [v], label: `${v}'` }));
    let out;
    if (!implicants.length) { gates.push({ id: 'zero', type: 'AND', in: [vars[0], `n${vars[0]}`] }); if (!inverted.has(vars[0])) gates.unshift({ id: `n${vars[0]}`, type: 'NOT', in: [vars[0]] }); out = 'zero'; }
    else if (terms.length === 1 && gates.some(g => g.id === terms[0])) out = terms[0];
    else if (terms.length === 1) { gates.push({ id: 'buf', type: 'BUF', in: [terms[0]] }); out = 'buf'; }
    else { gates.push({ id: 'or', type: 'OR', in: terms }); out = 'or'; }
    return { inputs: vars, gates, outputs: [{ name: outName, from: out }] };
}
