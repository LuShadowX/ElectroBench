// 14-pin DIP pinouts of the TTL chips used in the lab, drawn with the pins you wire highlighted.

import { s } from './ui.js';

const QUAD_2IN = { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' };

export const ICS = {
    7400: { name: '7400', title: 'Quad 2-input NAND', pins: QUAD_2IN },
    7408: { name: '7408', title: 'Quad 2-input AND', pins: QUAD_2IN },
    7432: { name: '7432', title: 'Quad 2-input OR', pins: QUAD_2IN },
    7486: { name: '7486', title: 'Quad 2-input XOR', pins: QUAD_2IN },
    7402: { name: '7402', title: 'Quad 2-input NOR', pins: { 1: '1Y', 2: '1A', 3: '1B', 4: '2Y', 5: '2A', 6: '2B', 7: 'GND', 8: '3A', 9: '3B', 10: '3Y', 11: '4A', 12: '4B', 13: '4Y', 14: 'VCC' } },
    7410: { name: '7410', title: 'Triple 3-input NAND', pins: { 1: '1A', 2: '1B', 3: '2A', 4: '2B', 5: '2C', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '3C', 12: '1Y', 13: '1C', 14: 'VCC' } }
};

// used: { pinNumber: 'what it connects to' }
export function drawIC(part, used = {}) {
    const ic = ICS[part];
    const w = 420;
    const els = [s('rect', { x: 60, y: 60, width: 300, height: 110, rx: 8, class: 'ic-body' }), s('path', { d: 'M60 100 a15 15 0 0 1 0 30', class: 'ic-notch' }),
        s('text', { x: 210, y: 112, 'text-anchor': 'middle', class: 'ic-name' }, `IC ${ic.name}`), s('text', { x: 210, y: 132, 'text-anchor': 'middle', class: 'ic-title' }, ic.title)];
    for (let p = 1; p <= 14; p++) {
        const bottom = p <= 7;
        const x = bottom ? 80 + (p - 1) * 43.3 : 80 + (14 - p) * 43.3;
        const y = bottom ? 170 : 40;
        const isUsed = used[p] !== undefined || p === 7 || p === 14;
        const role = p === 7 ? 'GND' : p === 14 ? '+5 V' : used[p];
        els.push(
            s('rect', { x: x - 9, y, width: 18, height: 20, rx: 2, class: `ic-pin${isUsed ? ' is-used' : ''}${p === 14 ? ' is-vcc' : ''}${p === 7 ? ' is-gnd' : ''}` }),
            s('text', { x, y: bottom ? 158 : 76, 'text-anchor': 'middle', class: 'ic-pin-label' }, ic.pins[p]),
            s('text', { x, y: bottom ? 205 : 33, 'text-anchor': 'middle', class: 'ic-pin-num' }, String(p)));
        if (role) els.push(s('text', { x, y: bottom ? 222 : 16, 'text-anchor': 'middle', class: 'ic-role' }, role));
    }
    return s('svg', { viewBox: `0 0 ${w} 232`, class: 'ic-svg', role: 'img', 'aria-label': `IC ${ic.name} pinout` }, ...els);
}
