// Shared page scaffolding: tabs that sync with the URL, number inputs, result tiles.

import { h, tabs } from './ui.js';

export function pageTabs(container, pageId, items, tab) {
    const view = tabs(items, {
        app: pageId,
        onChange: (id) => {
            const want = `#/${pageId}/${id}`;
            if (location.hash !== want) history.replaceState(null, '', want);
        }
    });
    container.append(view.el);
    if (tab) view.show(tab);
    return view;
}

// Labelled number input. onInput receives the parsed number (NaN if invalid).
export function num(label, value, { unit = '', min, max, step = 'any', onInput, width = '110px' } = {}) {
    const input = h('input', { class: 'input mono', type: 'number', value, min, max, step, style: { width }, 'aria-label': label });
    const wrap = h('label', { class: 'num-field' }, h('span', {}, label), h('span', { class: 'num-field__row' }, input, unit ? h('small', {}, unit) : null));
    input.addEventListener('input', () => {
        const v = Number(input.value);
        const bad = input.value.trim() === '' || !Number.isFinite(v) || (min !== undefined && v < min) || (max !== undefined && v > max);
        input.classList.toggle('is-bad', bad);
        onInput?.(bad ? NaN : v);
    });
    return { el: wrap, input, get value() { return Number(input.value); } };
}

export function slider(label, value, { min, max, step = 1, unit = '', format, onInput } = {}) {
    const out = h('b', { class: 'mono' });
    const show = (v) => { out.textContent = `${format ? format(v) : v}${unit}`; };
    const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
    input.addEventListener('input', () => { show(Number(input.value)); onInput?.(Number(input.value)); });
    show(value);
    return { el: h('label', { class: 'slider-field' }, h('span', {}, label, ' ', out), input), input, get value() { return Number(input.value); } };
}

export const tile = (label, value, sub) => h('div', { class: 'stat' }, h('span', {}, label), h('b', { class: 'mono' }, value), sub ? h('small', { class: 'muted' }, sub) : null);

export const formula = (...parts) => h('div', { class: 'formula' }, ...parts);

export const head = (title, text) => h('div', { class: 'app-head' }, h('div', {}, h('h3', {}, title), text ? h('p', {}, text) : null));

// engineering formatting with unit: 0.0123 A -> 12.3 mA
export function eng(v, unit = '', digits = 3) {
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return `0 ${unit}`;
    const a = Math.abs(v);
    const table = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
    for (const [f, p] of table) if (a >= f * 0.9995) return `${+(v / f).toPrecision(digits)} ${p}${unit}`;
    return `${v.toExponential(2)} ${unit}`;
}
