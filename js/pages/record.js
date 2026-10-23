// Lab record: every experiment's aim, apparatus, observations and result in one printable file.

import { h, table, note } from '../core/ui.js';
import { bus } from '../core/store.js';
import { loadObs } from '../core/lab.js';

export const intro = 'Your lab file, written from the readings you took on each virtual bench. Print it or save it as a PDF.';

const LABS = ['lab1', 'lab2', 'lab3', 'lab4', 'lab5', 'lab6', 'lab7'];

export function render(page) {
    const body = h('div', { class: 'record' });
    let defs = [];
    const draw = () => {
        const done = defs.filter(d => Object.keys(loadObs(d.id)).length).length;
        body.replaceChildren(
            h('div', { class: 'row no-print' }, h('button', { type: 'button', class: 'btn', onClick: () => print() }, 'Print / save as PDF'), h('span', { class: 'muted' }, `${done} of ${defs.length} experiments have readings.`)),
            h('table', { class: 'data record-index' }, h('thead', {}, h('tr', {}, h('th', {}, 'Exp'), h('th', {}, 'Title'), h('th', {}, 'Status'))),
                h('tbody', {}, ...defs.map(d => h('tr', {}, h('td', {}, String(d.num)), h('td', {}, d.aim.replace(/^To /, '').replace(/\.$/, '')), h('td', {}, Object.keys(loadObs(d.id)).length ? 'Readings taken' : h('a', { href: `#/${d.id}/bench` }, 'Not started')))))),
            ...defs.map(d => {
                const obs = loadObs(d.id);
                const ctx = { obs, save: () => {}, refresh: () => {} };
                return h('section', { class: 'record-exp' },
                    h('h2', {}, `Experiment ${d.num}`),
                    h('p', {}, h('b', {}, 'Aim: '), d.aim),
                    h('h4', {}, 'Apparatus'), table(['Component / equipment', 'Specification', 'Qty'], d.apparatus),
                    h('h4', {}, 'Observations'), ...d.observations(ctx),
                    h('h4', {}, 'Result'), h('p', { class: 'lab-result' }, d.result(ctx)));
            }));
    };
    page.append(note('Take readings on each experiment\'s Virtual bench tab first. Nothing leaves your browser.'), body);
    Promise.all(LABS.map(id => import(`./${id}.js`))).then(mods => { defs = mods.map(m => m.def); draw(); });
    const off = bus.on('lab:obs', () => defs.length && draw());
    return { cleanup: off };
}
