// Number systems, complements and binary codes (BCD, Excess-3, Gray).

import { h, table, note } from '../core/ui.js';
import { pageTabs, tile, formula, head } from '../core/page.js';

export const intro = 'Digital circuits only understand 0 and 1. This page covers how numbers are written in different bases, how computers subtract using complements, and the special codes used in displays and encoders.';

const BASES = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
const VALID = { 2: /^[01]+(\.[01]+)?$/, 8: /^[0-7]+(\.[0-7]+)?$/, 10: /^\d+(\.\d+)?$/, 16: /^[\da-f]+(\.[\da-f]+)?$/i };
const DIG = '0123456789ABCDEF';

export function toDecimal(text, base) {
    const [int, frac = ''] = text.toUpperCase().split('.');
    let v = [...int].reduce((a, d) => a * base + DIG.indexOf(d), 0);
    [...frac].forEach((d, i) => { v += DIG.indexOf(d) * base ** -(i + 1); });
    return v;
}

export function fromDecimal(v, base, places = 6) {
    let int = Math.floor(v);
    let frac = v - int;
    let s = int === 0 ? '0' : '';
    while (int > 0) { s = DIG[int % base] + s; int = Math.floor(int / base); }
    if (frac > 1e-12) {
        s += '.';
        for (let i = 0; i < places && frac > 1e-12; i++) { frac *= base; const d = Math.floor(frac + 1e-12); s += DIG[d]; frac -= d; }
    }
    return s;
}

function convert(panel) {
    const st = { text: '45.375', base: 10 };
    const input = h('input', { class: 'input mono big-input', value: st.text, 'aria-label': 'Number' });
    const sel = h('select', { class: 'select', 'aria-label': 'Base' }, Object.entries(BASES).map(([b, n]) => h('option', { value: b, selected: Number(b) === st.base }, `${n} (base ${b})`)));
    const out = h('div');
    const render = () => {
        const text = input.value.trim();
        const ok = VALID[st.base].test(text);
        input.classList.toggle('is-bad', !ok && Boolean(text));
        if (!ok) { out.replaceChildren(h('p', { class: 'note note--bad' }, text ? `Not a valid ${BASES[st.base].toLowerCase()} number.` : 'Type a number.')); return; }
        const v = toDecimal(text, st.base);
        const [intPart, fracPart] = [Math.floor(v), v - Math.floor(v)];
        const divRows = [];
        let n = intPart;
        while (n > 0) { divRows.push([`${n} ÷ 2`, Math.floor(n / 2), n % 2]); n = Math.floor(n / 2); }
        const mulRows = [];
        let f = fracPart;
        for (let i = 0; i < 6 && f > 1e-12; i++) { const p = f * 2; mulRows.push([`${+f.toFixed(6)} × 2`, +p.toFixed(6), Math.floor(p + 1e-12)]); f = p - Math.floor(p + 1e-12); }
        out.replaceChildren(
            h('div', { class: 'grid-4' }, [2, 8, 10, 16].map(b => tile(BASES[b], fromDecimal(v, b)))),
            h('div', { class: 'grid-2' },
                h('div', {}, h('h4', {}, `Integer part ${intPart} → binary (divide by 2)`), divRows.length ? table(['Step', 'Quotient', 'Remainder'], divRows) : h('p', {}, '0'), h('p', { class: 'muted' }, 'Read the remainders bottom → top.')),
                h('div', {}, h('h4', {}, `Fraction part → binary (multiply by 2)`), mulRows.length ? table(['Step', 'Result', 'Carry bit'], mulRows) : h('p', { class: 'muted' }, 'No fractional part.'), h('p', { class: 'muted' }, 'Read the carry bits top → bottom.'))),
            formula(`Grouping shortcut: binary ${fromDecimal(intPart, 2)} → octal (groups of 3) ${fromDecimal(intPart, 8)}, hex (groups of 4) ${fromDecimal(intPart, 16)}`));
    };
    input.addEventListener('input', render);
    sel.addEventListener('change', () => { st.base = Number(sel.value); render(); });
    panel.append(head('Number system conversions', 'Decimal to any base: divide the integer part repeatedly and multiply the fraction part repeatedly. Any base to decimal: positional weights.'), h('div', { class: 'row' }, h('div', { style: { flex: 1 } }, input), sel), out);
    render();
}

function complements(panel) {
    const st = { a: 13, b: 9, bits: 6 };
    const out = h('div');
    const inputs = ['a', 'b'].map(k => {
        const el = h('input', { class: 'input mono', type: 'number', value: st[k], min: 0, max: 31, style: { width: '90px' }, 'aria-label': k === 'a' ? 'Minuend' : 'Subtrahend' });
        el.addEventListener('input', () => { st[k] = Math.max(0, Math.min(31, Math.floor(Number(el.value) || 0))); render(); });
        return h('label', { class: 'num-field' }, h('span', {}, k === 'a' ? 'A (minuend)' : 'B (subtrahend)'), el);
    });
    const render = () => {
        const n = st.bits;
        const bin = (v) => (v >>> 0).toString(2).padStart(n, '0').slice(-n);
        const ones = (v) => bin(v).split('').map(b => (b === '1' ? '0' : '1')).join('');
        const twos = (v) => bin(((~v) + 1) & ((1 << n) - 1));
        const A = bin(st.a);
        const B = bin(st.b);
        const sum = st.a + (((~st.b) + 1) & ((1 << n) - 1));
        const carry = sum >> n;
        const res = sum & ((1 << n) - 1);
        const resultText = carry ? `carry 1 → discard it. Result is positive: ${bin(res)} = ${res}` : `no carry → result is negative. Take 2's complement of ${bin(res)}: −${parseInt(twos(res), 2)} (= ${st.a - st.b})`;
        // 1's complement method
        const sum1 = st.a + parseInt(ones(st.b), 2);
        const c1 = sum1 >> n;
        const r1 = (sum1 & ((1 << n) - 1)) + c1;
        out.replaceChildren(
            h('div', { class: 'grid-3' }, tile(`B = ${st.b}`, B), tile('1\'s complement of B', ones(st.b), 'flip every bit'), tile('2\'s complement of B', twos(st.b), '1\'s complement + 1')),
            h('div', { class: 'grid-2' },
                h('div', { class: 'card' }, h('h3', {}, `A − B using 2's complement (${n} bits)`), h('pre', { class: 'code' }, `  ${A}   (A = ${st.a})\n+ ${twos(st.b)}   (2's complement of B)\n${'-'.repeat(n + 4)}\n ${carry}${bin(res)}`), h('p', {}, resultText)),
                h('div', { class: 'card' }, h('h3', {}, 'Same with 1\'s complement'), h('pre', { class: 'code' }, `  ${A}\n+ ${ones(st.b)}\n${'-'.repeat(n + 4)}\n ${c1}${bin(sum1 & ((1 << n) - 1))}`), h('p', {}, c1 ? `End-around carry: add the carry back → ${bin(r1)} = ${r1}` : `No carry → negative: −(1's complement of result) = ${st.a - st.b}`))),
            note('Why computers use 2\'s complement: subtraction becomes addition, so one adder circuit does both, and there is only one zero (1\'s complement has +0 and −0).'));
    };
    panel.append(head('Complements and binary subtraction', 'r\'s complement and (r − 1)\'s complement. For binary: 2\'s complement and 1\'s complement.'), h('div', { class: 'row inputs-row' }, inputs), out);
    render();
}

const gray = (n) => n ^ (n >> 1);

function codes(panel) {
    const st = { dec: '2593', bin: '1011' };
    const decIn = h('input', { class: 'input mono big-input', value: st.dec, 'aria-label': 'Decimal number', style: { maxWidth: '220px' } });
    const binIn = h('input', { class: 'input mono big-input', value: st.bin, 'aria-label': 'Binary number', style: { maxWidth: '220px' } });
    const bcdOut = h('div');
    const grayOut = h('div');
    const renderBCD = () => {
        const d = decIn.value.trim();
        if (!/^\d{1,8}$/.test(d)) { decIn.classList.add('is-bad'); bcdOut.replaceChildren(h('p', { class: 'note note--bad' }, 'Type up to 8 decimal digits.')); return; }
        decIn.classList.remove('is-bad');
        const digits = [...d].map(Number);
        bcdOut.replaceChildren(h('div', { class: 'code-groups' }, digits.map(x => h('div', {}, h('b', {}, x), h('code', {}, x.toString(2).padStart(4, '0')), h('code', { class: 'xs3' }, (x + 3).toString(2).padStart(4, '0'))))),
            h('div', { class: 'grid-3' }, tile('Pure binary', Number(d).toString(2)), tile('BCD (8421)', digits.map(x => x.toString(2).padStart(4, '0')).join(' ')), tile('Excess-3', digits.map(x => (x + 3).toString(2).padStart(4, '0')).join(' '))),
            h('p', { class: 'muted' }, 'Each decimal digit becomes its own 4-bit group. Excess-3 = BCD + 0011, and it is self-complementing: the 9\'s complement is just the bits flipped.'));
    };
    const renderGray = () => {
        const b = binIn.value.trim();
        if (!/^[01]{1,12}$/.test(b)) { binIn.classList.add('is-bad'); grayOut.replaceChildren(h('p', { class: 'note note--bad' }, 'Type up to 12 binary digits.')); return; }
        binIn.classList.remove('is-bad');
        const g = [b[0]];
        for (let i = 1; i < b.length; i++) g.push(String(Number(b[i - 1]) ^ Number(b[i])));
        grayOut.replaceChildren(
            formula(`Binary → Gray: keep the MSB, then each Gray bit = XOR of neighbouring binary bits`),
            h('div', { class: 'xor-steps' }, [...b].map((bit, i) => h('div', {}, h('code', {}, i === 0 ? bit : `${b[i - 1]}⊕${bit}`), h('b', {}, g[i])))),
            tile('Gray code', g.join('')),
            table(['Decimal', 'Binary', 'Gray'], Array.from({ length: 8 }, (_, n) => [String(n), n.toString(2).padStart(3, '0'), gray(n).toString(2).padStart(3, '0')])),
            note('Gray code changes only ONE bit between neighbouring values, so rotary encoders never read a wrong in-between value while bits switch.'));
    };
    decIn.addEventListener('input', renderBCD);
    binIn.addEventListener('input', renderGray);
    panel.append(head('Binary codes'),
        h('div', { class: 'grid-2' },
            h('div', { class: 'card' }, h('h3', {}, 'BCD and Excess-3'), decIn, bcdOut),
            h('div', { class: 'card' }, h('h3', {}, 'Gray code'), binIn, grayOut)));
    renderBCD();
    renderGray();
}

export function render(page, { tab }) {
    return pageTabs(page, 'numbers', [
        { id: 'convert', label: 'Conversions', render: convert },
        { id: 'complements', label: 'Complements & subtraction', render: complements },
        { id: 'codes', label: 'BCD · Excess-3 · Gray', render: codes }
    ], tab);
}
