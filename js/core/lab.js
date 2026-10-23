// Shared structure for the ECE279 experiments: aim/theory, virtual bench, observations, viva.
// Observations are saved per experiment so the Lab Record page can print them all.

import { h, table, note } from './ui.js';
import { store, bus } from './store.js';
import { pageTabs } from './page.js';

export const loadObs = (id) => store.get(`lab:${id}`, {});
export const saveObs = (id, data) => { store.set(`lab:${id}`, data); bus.emit('lab:obs', id); };

export function labPage(page, tab, def) {
    const obs = loadObs(def.id);
    const ctx = {
        obs,
        save: () => saveObs(def.id, obs),
        refresh: () => renderObs?.()
    };
    let renderObs;
    let cleanup;

    const aim = (panel) => {
        panel.append(
            h('div', { class: 'lab-aim' }, h('span', { class: 'lab-badge' }, `ECE279 · Experiment ${def.num}`), h('h3', {}, 'Aim'), h('p', {}, def.aim)),
            h('h4', {}, 'Apparatus / components'), table(['Component / equipment', 'Specification', 'Qty'], def.apparatus),
            h('h4', {}, 'Theory'), ...def.theory,
            h('h4', {}, 'Procedure'), h('ol', { class: 'steps' }, def.procedure.map(p => h('li', {}, p))),
            def.precautions ? [h('h4', {}, 'Precautions'), h('ul', { class: 'steps' }, def.precautions.map(p => h('li', {}, p)))] : '');
    };

    const bench = (panel) => {
        const r = def.bench(panel, ctx);
        cleanup = typeof r === 'function' ? r : r?.cleanup;
    };

    const observations = (panel) => {
        const body = h('div');
        renderObs = () => {
            const tables = def.observations(ctx);
            body.replaceChildren(...tables,
                h('h4', {}, 'Result'), h('p', { class: 'lab-result' }, def.result(ctx)),
                h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { Object.keys(obs).forEach(k => delete obs[k]); ctx.save(); renderObs(); } }, 'Clear readings'), h('a', { class: 'btn', href: '#/record' }, 'Open full lab record')));
        };
        panel.append(note('These tables fill in from your readings on the Virtual bench tab. They are saved in this browser.'), body);
        renderObs();
    };

    const viva = (panel) => {
        panel.append(h('p', { class: 'muted' }, 'Questions commonly asked in the viva for this experiment. Click to reveal the answer.'),
            ...def.viva.map(([q, a], i) => h('details', { class: 'viva' }, h('summary', {}, h('b', {}, `Q${i + 1}. `), q), h('p', {}, a))));
    };

    const view = pageTabs(page, def.id, [
        { id: 'aim', label: 'Aim & theory', render: aim },
        { id: 'bench', label: 'Virtual bench', render: bench },
        { id: 'observations', label: 'Observations & result', render: (p) => observations(p) },
        { id: 'viva', label: 'Viva questions', render: viva }
    ], tab);
    const off = bus.on('lab:obs', (id) => { if (id === def.id) renderObs?.(); });
    return { ...view, cleanup: () => { cleanup?.(); off(); } };
}

// small seeded random generator so "measured" values stay the same across reloads
export function seeded(seed) {
    let x = seed >>> 0 || 1;
    return () => {
        x ^= x << 13; x >>>= 0;
        x ^= x >> 17;
        x ^= x << 5; x >>>= 0;
        return x / 4294967296;
    };
}
