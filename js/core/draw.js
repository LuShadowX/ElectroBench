// Analog schematic symbols for SVG circuit drawings.

import { s } from './ui.js';

const seg = (x1, y1, x2, y2) => ({ len: Math.hypot(x2 - x1, y2 - y1), ux: (x2 - x1) / Math.hypot(x2 - x1, y2 - y1), uy: (y2 - y1) / Math.hypot(x2 - x1, y2 - y1) });

export const wire = (...pts) => s('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'c-wire' });

export const dot = (x, y) => s('circle', { cx: x, cy: y, r: 3.5, class: 'c-dot' });

export const label = (x, y, text, cls = '', anchor = 'middle') => s('text', { x, y, class: `c-label ${cls}`, 'text-anchor': anchor }, text);

// zigzag resistor between two points
export function resistor(x1, y1, x2, y2, text, { valueText, side = 1, cls = '' } = {}) {
    const { len, ux, uy } = seg(x1, y1, x2, y2);
    const body = 40;
    const lead = (len - body) / 2;
    const px = -uy;
    const py = ux;
    const pts = [[x1, y1], [x1 + ux * lead, y1 + uy * lead]];
    for (let k = 0; k < 6; k++) {
        const t = lead + (k + 0.5) * (body / 6);
        const off = (k % 2 ? -1 : 1) * 7;
        pts.push([x1 + ux * t + px * off, y1 + uy * t + py * off]);
    }
    pts.push([x1 + ux * (lead + body), y1 + uy * (lead + body)], [x2, y2]);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const vertical = Math.abs(uy) > Math.abs(ux);
    return s('g', { class: `c-res ${cls}` },
        s('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'c-wire' }),
        text ? label(vertical ? mx + 16 * side : mx, vertical ? my - 2 : my - 14 * side, text, 'c-name', vertical ? (side > 0 ? 'start' : 'end') : 'middle') : null,
        valueText ? label(vertical ? mx + 16 * side : mx, vertical ? my + 14 : my + (side > 0 ? 24 : -26), valueText, 'c-value', vertical ? (side > 0 ? 'start' : 'end') : 'middle') : null);
}

// independent DC voltage source (circle with + and −), drawn vertically between y1 (top, +) and y2
export function vsource(x, y1, y2, text, { ac = false, valueText } = {}) {
    const my = (y1 + y2) / 2;
    return s('g', { class: 'c-src' },
        s('line', { x1: x, y1, x2: x, y2: my - 18, class: 'c-wire' }),
        s('line', { x1: x, y1: my + 18, x2: x, y2, class: 'c-wire' }),
        s('circle', { cx: x, cy: my, r: 18, class: 'c-body' }),
        ac ? s('path', { d: `M${x - 10} ${my} q5 -10 10 0 t10 0`, class: 'c-wire' }) : [label(x, my - 3, '+', 'c-sign'), label(x, my + 13, '−', 'c-sign')],
        text ? label(x - 26, my - 2, text, 'c-name', 'end') : null,
        valueText ? label(x - 26, my + 14, valueText, 'c-value', 'end') : null);
}

export function ground(x, y) {
    return s('g', { class: 'c-gnd' }, s('line', { x1: x, y1: y, x2: x, y2: y + 8, class: 'c-wire' }),
        s('line', { x1: x - 12, y1: y + 8, x2: x + 12, y2: y + 8, class: 'c-wire' }),
        s('line', { x1: x - 7, y1: y + 13, x2: x + 7, y2: y + 13, class: 'c-wire' }),
        s('line', { x1: x - 3, y1: y + 18, x2: x + 3, y2: y + 18, class: 'c-wire' }));
}

// diode pointing from (x1,y1) anode to (x2,y2) cathode
export function diode(x1, y1, x2, y2, text, { led = false, zener = false, cls = '' } = {}) {
    const { len, ux, uy } = seg(x1, y1, x2, y2);
    const px = -uy;
    const py = ux;
    const a = (len - 22) / 2;
    const ax = x1 + ux * a;
    const ay = y1 + uy * a;
    const cx = ax + ux * 22;
    const cy = ay + uy * 22;
    const bar = zener
        ? `M${cx + px * 12 - ux * 5} ${cy + py * 12 - uy * 5} L${cx + px * 12} ${cy + py * 12} L${cx - px * 12} ${cy - py * 12} L${cx - px * 12 + ux * 5} ${cy - py * 12 + uy * 5}`
        : `M${cx + px * 12} ${cy + py * 12} L${cx - px * 12} ${cy - py * 12}`;
    return s('g', { class: `c-diode ${cls}` },
        s('line', { x1, y1, x2: ax, y2: ay, class: 'c-wire' }),
        s('line', { x1: cx, y1: cy, x2, y2, class: 'c-wire' }),
        s('path', { d: `M${ax + px * 12} ${ay + py * 12} L${cx} ${cy} L${ax - px * 12} ${ay - py * 12} Z`, class: 'c-body c-diode__tri' }),
        s('path', { d: bar, class: 'c-wire' }),
        led ? s('path', { d: `M${cx + px * 6 + ux * 4} ${cy + py * 14} l${px * 9 + ux * 6} ${py * 9 + uy * 6} M${cx + px * 2 - ux * 6} ${cy + py * 16} l${px * 9 + ux * 6} ${py * 9 + uy * 6}`, class: 'c-wire c-led-rays' }) : null,
        text ? label((x1 + x2) / 2 + px * 26, (y1 + y2) / 2 + py * 26 + 4, text, 'c-name') : null);
}

export function capacitor(x1, y1, x2, y2, text, { valueText } = {}) {
    const { len, ux, uy } = seg(x1, y1, x2, y2);
    const px = -uy;
    const py = ux;
    const a = len / 2 - 5;
    const p1 = [x1 + ux * a, y1 + uy * a];
    const p2 = [x1 + ux * (a + 10), y1 + uy * (a + 10)];
    const vertical = Math.abs(uy) > Math.abs(ux);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return s('g', { class: 'c-cap' },
        s('line', { x1, y1, x2: p1[0], y2: p1[1], class: 'c-wire' }),
        s('line', { x1: p2[0], y1: p2[1], x2, y2, class: 'c-wire' }),
        s('line', { x1: p1[0] + px * 14, y1: p1[1] + py * 14, x2: p1[0] - px * 14, y2: p1[1] - py * 14, class: 'c-wire c-plate' }),
        s('line', { x1: p2[0] + px * 14, y1: p2[1] + py * 14, x2: p2[0] - px * 14, y2: p2[1] - py * 14, class: 'c-wire c-plate' }),
        text ? label(vertical ? mx + 20 : mx, vertical ? my : my - 20, text, 'c-name', vertical ? 'start' : 'middle') : null,
        valueText ? label(vertical ? mx + 20 : mx, vertical ? my + 14 : my + 28, valueText, 'c-value', vertical ? 'start' : 'middle') : null);
}

export function inductor(x1, y1, x2, y2, text, { valueText } = {}) {
    const { len, ux, uy } = seg(x1, y1, x2, y2);
    const lead = (len - 48) / 2;
    const sx = x1 + ux * lead;
    const sy = y1 + uy * lead;
    let d = `M${x1} ${y1} L${sx} ${sy}`;
    const vertical = Math.abs(uy) > Math.abs(ux);
    for (let k = 0; k < 4; k++) {
        const ex = sx + ux * 12 * (k + 1);
        const ey = sy + uy * 12 * (k + 1);
        d += ` A6 6 0 0 ${vertical ? 0 : 1} ${ex} ${ey}`;
    }
    d += ` L${x2} ${y2}`;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return s('g', { class: 'c-ind' }, s('path', { d, class: 'c-wire' }),
        text ? label(vertical ? mx + 18 : mx, vertical ? my : my - 16, text, 'c-name', vertical ? 'start' : 'middle') : null,
        valueText ? label(vertical ? mx + 18 : mx, vertical ? my + 14 : my + 24, valueText, 'c-value', vertical ? 'start' : 'middle') : null);
}

// op-amp triangle; returns pin coordinates too
export function opamp(x, y, { flip = false } = {}) {
    const inv = [x - 40, flip ? y + 14 : y - 14];
    const non = [x - 40, flip ? y - 14 : y + 14];
    const out = [x + 40, y];
    const el = s('g', { class: 'c-opamp' },
        s('path', { d: `M${x - 40} ${y - 36} L${x + 40} ${y} L${x - 40} ${y + 36} Z`, class: 'c-body' }),
        label(x - 30, inv[1] + 5, '−', 'c-sign', 'middle'),
        label(x - 30, non[1] + 5, '+', 'c-sign', 'middle'));
    return { el, inv, non, out };
}

// current arrow along a wire with a label
export function arrow(x, y, dir, text) {
    const d = { right: `M${x - 8} ${y - 5} L${x + 2} ${y} L${x - 8} ${y + 5}`, left: `M${x + 8} ${y - 5} L${x - 2} ${y} L${x + 8} ${y + 5}`, down: `M${x - 5} ${y - 8} L${x} ${y + 2} L${x + 5} ${y - 8}`, up: `M${x - 5} ${y + 8} L${x} ${y - 2} L${x + 5} ${y + 8}` }[dir];
    const lx = dir === 'down' || dir === 'up' ? x + 10 : x;
    const ly = dir === 'down' || dir === 'up' ? y + 4 : y - 10;
    return s('g', { class: 'c-arrow' }, s('path', { d }), text ? label(lx, ly, text, 'c-current', dir === 'down' || dir === 'up' ? 'start' : 'middle') : null);
}

export const svgBox = (w, ht, ...children) => s('svg', { viewBox: `0 0 ${w} ${ht}`, class: 'circuit', role: 'img' }, ...children);
