// Draws a gate netlist as a schematic: input switches on the left, gates in columns
// by logic depth, LEDs on the right. Wires turn green when they carry a 1.

import { s } from './ui.js';

const GATE_W = 56;
const COL_W = 140;
const ROW_H = 78;

function gateHeight(n) {
    return Math.max(40, n * 16 + 10);
}

function shapePath(type, x, y, ht) {
    const x0 = x - GATE_W / 2;
    const x1 = x + GATE_W / 2;
    const y0 = y - ht / 2;
    const y1 = y + ht / 2;
    const bubble = ['NOT', 'NAND', 'NOR', 'XNOR'].includes(type);
    const end = bubble ? x1 - 8 : x1;
    const r = ht / 2;
    let d;
    if (type === 'AND' || type === 'NAND') d = `M${x0} ${y0} H${end - r} A${r} ${r} 0 0 1 ${end - r} ${y1} H${x0} Z`;
    else if (type === 'OR' || type === 'NOR' || type === 'XOR' || type === 'XNOR') {
        d = `M${x0} ${y0} Q${x0 + 12} ${y} ${x0} ${y1} Q${x0 + (end - x0) * 0.6} ${y1} ${end} ${y} Q${x0 + (end - x0) * 0.6} ${y0} ${x0} ${y0} Z`;
        if (type === 'XOR' || type === 'XNOR') d += ` M${x0 - 7} ${y0} Q${x0 + 5} ${y} ${x0 - 7} ${y1}`;
    } else d = `M${x0} ${y0} L${end} ${y} L${x0} ${y1} Z`;
    return { d, bubble: bubble ? { cx: x1 - 4, cy: y, r: 4 } : null };
}

function inputPinX(type, x) {
    const x0 = x - GATE_W / 2;
    return ['OR', 'NOR', 'XOR', 'XNOR'].includes(type) ? x0 + 4 : x0;
}

export function renderSchematic(circuit, { onToggle, labels = {}, compact = false } = {}) {
    const { inputs, gates, outputs } = circuit;
    const byId = new Map(gates.map(g => [g.id, g]));

    // logic depth of every gate (feedback edges are ignored while measuring depth)
    const level = new Map();
    const depth = (id, stack = new Set()) => {
        if (inputs.includes(id)) return 0;
        if (level.has(id)) return level.get(id);
        if (stack.has(id)) return 0;
        stack.add(id);
        const g = byId.get(id);
        const d = 1 + Math.max(0, ...g.in.map(src => (stack.has(src) ? 0 : depth(src, stack))));
        stack.delete(id);
        level.set(id, d);
        return d;
    };
    gates.forEach(g => depth(g.id));
    const maxLevel = Math.max(1, ...level.values());

    // place inputs, then gates column by column, ordered by where their inputs come from
    const pos = new Map();
    const rowH = compact ? 64 : ROW_H;
    inputs.forEach((name, i) => pos.set(name, { x: 50, y: 40 + i * rowH }));
    for (let lv = 1; lv <= maxLevel; lv++) {
        const col = gates.filter(g => level.get(g.id) === lv);
        const key = (g) => {
            const ys = g.in.map(src => pos.get(src)?.y).filter(v => v !== undefined);
            return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
        };
        col.sort((a, b) => key(a) - key(b));
        let lastY = -Infinity;
        col.forEach(g => {
            const ht = gateHeight(g.in.length);
            let y = Math.max(key(g), lastY + Math.max(rowH, ht + 22));
            if (!Number.isFinite(y)) y = 40;
            pos.set(g.id, { x: 50 + lv * COL_W, y, ht });
            lastY = y;
        });
    }
    const outX = 50 + (maxLevel + 1) * COL_W - 20;
    outputs.forEach(o => { pos.set(`out:${o.name}`, { x: outX, y: pos.get(o.from).y }); });
    // separate outputs that would overlap
    const outs = outputs.map(o => pos.get(`out:${o.name}`)).sort((a, b) => a.y - b.y);
    for (let k = 1; k < outs.length; k++) if (outs[k].y - outs[k - 1].y < 46) outs[k].y = outs[k - 1].y + 46;

    const allY = [...pos.values()].map(p => p.y + (p.ht ?? 0) / 2);
    let bottom = Math.max(...allY) + 40;
    const top = Math.min(0, ...[...pos.values()].map(p => p.y - (p.ht ?? 32) / 2 - 24));
    const width = outX + 90;

    const wireEls = [];
    const wiresLayer = s('g', { class: 'sch-wires' });
    const partsLayer = s('g');
    const channelUse = new Map();
    let backIndex = 0;

    const sourcePoint = (src) => {
        if (inputs.includes(src)) { const p = pos.get(src); return [p.x + 30, p.y]; }
        const p = pos.get(src);
        return [p.x + GATE_W / 2, p.y];
    };

    // wires into gate inputs
    for (const g of gates) {
        const gp = pos.get(g.id);
        g.in.forEach((src, k) => {
            const [sx, sy] = sourcePoint(src);
            const ty = gp.y - gp.ht / 2 + ((k + 1) * gp.ht) / (g.in.length + 1);
            const tx = inputPinX(g.type, gp.x);
            let pts;
            const backward = sx >= tx - 10;
            if (backward) {
                const by = bottom + 14 + backIndex++ * 10;
                pts = [[sx, sy], [sx + 14, sy], [sx + 14, by], [tx - 24, by], [tx - 24, ty], [tx, ty]];
            } else {
                const colKey = Math.round(tx);
                const used = channelUse.get(colKey) ?? 0;
                channelUse.set(colKey, used + 1);
                const cx = tx - 14 - (used % 6) * 8;
                pts = [[sx, sy], [cx, sy], [cx, ty], [tx, ty]];
            }
            const el = s('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'sch-wire' });
            wiresLayer.append(el);
            wireEls.push({ el, src });
        });
    }
    bottom += backIndex * 10;

    // wires to outputs
    outputs.forEach(o => {
        const [sx, sy] = sourcePoint(o.from);
        const op = pos.get(`out:${o.name}`);
        const mid = sx + (op.x - 14 - sx) / 2;
        const el = s('polyline', { points: `${sx},${sy} ${mid},${sy} ${mid},${op.y} ${op.x - 14},${op.y}`, class: 'sch-wire' });
        wiresLayer.append(el);
        wireEls.push({ el, src: o.from });
    });

    // fan-out dots where one signal feeds several places
    const fan = new Map();
    wireEls.forEach(w => fan.set(w.src, (fan.get(w.src) ?? 0) + 1));
    const dots = [];
    fan.forEach((count, src) => {
        if (count < 2) return;
        const [x, y] = sourcePoint(src);
        const dot = s('circle', { cx: x + 6, cy: y, r: 3.2, class: 'sch-dot' });
        wiresLayer.append(dot);
        dots.push({ el: dot, src });
    });

    // input switches
    const switchEls = inputs.map(name => {
        const p = pos.get(name);
        const g = s('g', { class: 'sch-switch', tabindex: 0, role: 'switch', 'aria-label': `input ${name}` },
            s('rect', { x: p.x - 30, y: p.y - 16, width: 60, height: 32, rx: 8 }),
            s('text', { x: p.x - 16, y: p.y + 5, 'text-anchor': 'middle', class: 'sch-switch__name' }, labels[name] ?? name),
            s('text', { x: p.x + 14, y: p.y + 5, 'text-anchor': 'middle', class: 'sch-switch__val' }, '0'));
        if (onToggle) {
            g.addEventListener('click', () => onToggle(name));
            g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(name); } });
        }
        partsLayer.append(g);
        return { name, g };
    });

    // gates
    const gateEls = gates.map(g => {
        const p = pos.get(g.id);
        const { d, bubble } = shapePath(g.type, p.x, p.y, p.ht);
        const el = s('g', { class: `sch-gate sch-gate--${g.type.toLowerCase()}` },
            s('path', { d }),
            bubble ? s('circle', { ...bubble, class: 'sch-bubble' }) : null,
            s('text', { x: p.x - 4, y: p.y + p.ht / 2 + 13, 'text-anchor': 'middle', class: 'sch-gate__label' }, g.label ?? g.type));
        partsLayer.append(el);
        return { g, el };
    });

    // output LEDs
    const ledEls = outputs.map(o => {
        const p = pos.get(`out:${o.name}`);
        const el = s('g', { class: 'sch-led' },
            s('circle', { cx: p.x, cy: p.y, r: 13 }),
            s('text', { x: p.x + 22, y: p.y + 5, class: 'sch-led__name' }, labels[o.name] ?? o.name),
            s('text', { x: p.x, y: p.y + 4.5, 'text-anchor': 'middle', class: 'sch-led__val' }, '0'));
        partsLayer.append(el);
        return { o, el };
    });

    const svg = s('svg', { viewBox: `0 ${top} ${width} ${bottom + 10 - top}`, class: 'schematic', role: 'img', 'aria-label': 'Circuit diagram' }, wiresLayer, partsLayer);

    const update = () => {
        wireEls.forEach(w => w.el.classList.toggle('is-high', Boolean(circuit.values[w.src])));
        dots.forEach(d => d.el.classList.toggle('is-high', Boolean(circuit.values[d.src])));
        switchEls.forEach(({ name, g }) => {
            const v = circuit.values[name];
            g.classList.toggle('is-high', Boolean(v));
            g.querySelector('.sch-switch__val').textContent = v;
        });
        gateEls.forEach(({ g, el }) => el.classList.toggle('is-high', Boolean(circuit.values[g.id])));
        ledEls.forEach(({ o, el }) => {
            const v = circuit.values[o.from];
            el.classList.toggle('is-high', Boolean(v));
            el.querySelector('.sch-led__val').textContent = v;
        });
    };
    update();
    return { svg, update };
}
