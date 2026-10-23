// Minimal SVG chart: axes, grid, several line series, markers, reference lines,
// optional log-scale x axis, and a hover readout.

import { s, h } from './ui.js';

const PAD = { l: 58, r: 16, t: 16, b: 44 };

const niceStep = (span, count) => {
    const raw = span / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
};

export const fmt = (v, digits = 3) => {
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e6) return `${+(v / 1e6).toPrecision(digits)}M`;
    if (a >= 1e3) return `${+(v / 1e3).toPrecision(digits)}k`;
    if (a >= 1) return `${+v.toPrecision(digits)}`;
    if (a >= 1e-3) return `${+(v * 1e3).toPrecision(digits)}m`;
    if (a >= 1e-6) return `${+(v * 1e6).toPrecision(digits)}µ`;
    return `${+(v * 1e9).toPrecision(digits)}n`;
};

export function plot({ width = 640, height = 300, x, y, series = [], markers = [], vlines = [], hlines = [], readout = true }) {
    const W = width - PAD.l - PAD.r;
    const H = height - PAD.t - PAD.b;
    const logX = x.log;
    const tx = (v) => PAD.l + (logX ? (Math.log10(v) - Math.log10(x.min)) / (Math.log10(x.max) - Math.log10(x.min)) : (v - x.min) / (x.max - x.min)) * W;
    const ty = (v) => PAD.t + H - ((v - y.min) / (y.max - y.min)) * H;
    const clampY = (v) => Math.max(PAD.t - 4, Math.min(PAD.t + H + 4, ty(v)));

    const grid = s('g', { class: 'plot-grid' });
    const labels = s('g', { class: 'plot-ticks' });
    if (logX) {
        for (let e = Math.ceil(Math.log10(x.min)); e <= Math.floor(Math.log10(x.max)); e++) {
            const v = 10 ** e;
            grid.append(s('line', { x1: tx(v), x2: tx(v), y1: PAD.t, y2: PAD.t + H }));
            labels.append(s('text', { x: tx(v), y: PAD.t + H + 16, 'text-anchor': 'middle' }, fmt(v, 2)));
            for (let k = 2; k < 10; k++) if (v * k < x.max) grid.append(s('line', { x1: tx(v * k), x2: tx(v * k), y1: PAD.t, y2: PAD.t + H, class: 'minor' }));
        }
    } else {
        const step = x.step ?? niceStep(x.max - x.min, 8);
        for (let v = Math.ceil(x.min / step) * step; v <= x.max + 1e-9; v += step) {
            grid.append(s('line', { x1: tx(v), x2: tx(v), y1: PAD.t, y2: PAD.t + H, class: Math.abs(v) < 1e-12 ? 'axis0' : '' }));
            labels.append(s('text', { x: tx(v), y: PAD.t + H + 16, 'text-anchor': 'middle' }, x.format ? x.format(v) : fmt(v)));
        }
    }
    const ystep = y.step ?? niceStep(y.max - y.min, 6);
    for (let v = Math.ceil(y.min / ystep) * ystep; v <= y.max + 1e-9; v += ystep) {
        grid.append(s('line', { x1: PAD.l, x2: PAD.l + W, y1: ty(v), y2: ty(v), class: Math.abs(v) < 1e-12 ? 'axis0' : '' }));
        labels.append(s('text', { x: PAD.l - 8, y: ty(v) + 4, 'text-anchor': 'end' }, y.format ? y.format(v) : fmt(v)));
    }

    const lines = s('g');
    for (const sr of series) {
        const pts = sr.points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py) && (!logX || px > 0));
        if (!pts.length) continue;
        lines.append(s('polyline', {
            points: pts.map(([px, py]) => `${tx(px).toFixed(1)},${clampY(py).toFixed(1)}`).join(' '),
            class: `plot-line${sr.dashed ? ' is-dashed' : ''}`, stroke: sr.color ?? '#2563eb', 'stroke-width': sr.width ?? 2.2
        }));
        if (sr.label && sr.labelAt !== false) {
            const [lx, ly] = pts[Math.min(pts.length - 1, Math.floor(pts.length * (sr.labelPos ?? 0.92)))];
            lines.append(s('text', { x: Math.min(tx(lx) + 4, PAD.l + W - 4), y: clampY(ly) - 6, class: 'plot-series-label', fill: sr.color ?? '#2563eb', 'text-anchor': tx(lx) > PAD.l + W - 60 ? 'end' : 'start' }, sr.label));
        }
    }
    const refs = s('g', { class: 'plot-refs' });
    vlines.forEach(v => refs.append(s('line', { x1: tx(v.x), x2: tx(v.x), y1: PAD.t, y2: PAD.t + H, stroke: v.color ?? '#94a3b8' }), v.label ? s('text', { x: tx(v.x) + 4, y: PAD.t + 12, fill: v.color ?? '#64748b' }, v.label) : ''));
    hlines.forEach(v => refs.append(s('line', { x1: PAD.l, x2: PAD.l + W, y1: ty(v.y), y2: ty(v.y), stroke: v.color ?? '#94a3b8' }), v.label ? s('text', { x: PAD.l + 6, y: ty(v.y) - 5, fill: v.color ?? '#64748b' }, v.label) : ''));
    const marks = s('g');
    markers.forEach(m => marks.append(
        s('circle', { cx: tx(m.x), cy: clampY(m.y), r: m.r ?? 5, fill: m.color ?? '#dc2626', class: 'plot-marker' }),
        m.label ? s('text', { x: tx(m.x) + 8, y: clampY(m.y) - 8, class: 'plot-marker-label', fill: m.color ?? '#dc2626' }, m.label) : ''));

    const axisLabels = s('g', { class: 'plot-axis-labels' },
        s('text', { x: PAD.l + W / 2, y: height - 6, 'text-anchor': 'middle' }, x.label ?? ''),
        s('text', { x: 14, y: PAD.t + H / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${PAD.t + H / 2})` }, y.label ?? ''));

    const cross = s('g', { class: 'plot-cross', visibility: 'hidden' }, s('line', { y1: PAD.t, y2: PAD.t + H }), s('text', { y: PAD.t + 12 }));
    const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, class: 'plot', role: 'img', 'aria-label': `${y.label ?? ''} against ${x.label ?? ''}` },
        s('rect', { x: PAD.l, y: PAD.t, width: W, height: H, class: 'plot-bg' }), grid, refs, lines, marks, labels, axisLabels, cross);

    if (readout && series.length) {
        svg.addEventListener('pointermove', e => {
            const box = svg.getBoundingClientRect();
            const px = ((e.clientX - box.left) / box.width) * width;
            if (px < PAD.l || px > PAD.l + W) { cross.setAttribute('visibility', 'hidden'); return; }
            const frac = (px - PAD.l) / W;
            const xv = logX ? 10 ** (Math.log10(x.min) + frac * (Math.log10(x.max) - Math.log10(x.min))) : x.min + frac * (x.max - x.min);
            const parts = series.filter(sr => sr.points.length).map(sr => {
                let best = sr.points[0];
                for (const p of sr.points) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
                return `${sr.label ? sr.label + ': ' : ''}${fmt(best[1])}${y.unit ?? ''}`;
            });
            cross.setAttribute('visibility', 'visible');
            cross.querySelector('line').setAttribute('x1', px);
            cross.querySelector('line').setAttribute('x2', px);
            const text = cross.querySelector('text');
            text.textContent = `${x.label?.split(' (')[0] ?? 'x'} = ${fmt(xv)}${x.unit ?? ''} · ${parts.join(' · ')}`;
            text.setAttribute('x', px > PAD.l + W / 2 ? px - 6 : px + 6);
            text.setAttribute('text-anchor', px > PAD.l + W / 2 ? 'end' : 'start');
        });
        svg.addEventListener('pointerleave', () => cross.setAttribute('visibility', 'hidden'));
    }
    return h('div', { class: 'plot-wrap' }, svg);
}
