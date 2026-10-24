// Home: what ElectroBench is, the sections, and where to start.

import { h } from '../core/ui.js';
import { store } from '../core/store.js';
import { SECTIONS } from '../main.js';

export const intro = 'An interactive workbench for basic electrical and electronics engineering: circuits you can change, devices you can probe, and a virtual lab for every experiment.';

export function render(page) {
    const seen = new Set(store.get('visited', []).map(k => k.split('/')[0]));
    const topics = SECTIONS.slice(1).flatMap(([, items]) => items).filter(([id]) => id !== 'record');
    const firstUnseen = topics.find(([id]) => !seen.has(id));
    page.append(
        h('div', { class: 'home-hero card' },
            h('div', {}, h('h2', {}, 'Learn it by changing it'), h('p', {}, 'Every page here is a working model, not a picture. Move a slider and the current in a mesh changes, the diode curve shifts, the filter\'s cut-off moves, or the flip-flop toggles. The ECE279 experiments have a virtual bench with instruments, and your readings fill in the observation tables of a printable lab record.'),
                h('div', { class: 'row' }, h('a', { class: 'btn', href: `#/${firstUnseen ? firstUnseen[0] : 'dc'}` }, firstUnseen && seen.size ? `Continue: ${firstUnseen[1]}` : 'Start with DC circuits'), h('a', { class: 'btn btn--ghost', href: '#/map' }, 'See the course map'))),
            h('div', { class: 'home-stats' }, ...[[String(topics.filter(([id]) => !id.startsWith('lab')).length), 'topic pages'], ['7', 'lab experiments'], ['3', 'courses mapped'], [`${topics.filter(([id]) => seen.has(id)).length}/${topics.length}`, 'opened by you']].map(([v, l]) => h('div', { class: 'stat' }, h('b', { class: 'mono' }, v), h('span', {}, l))))),
        h('div', { class: 'home-courses' },
            ...[['ECE131', 'Basic Electrical & Electronics Engineering (2026-27)', 'DC circuits and theorems, AC and three-phase circuits, machines, semiconductor devices, op-amps and filters, embedded systems and IoT.'],
                ['ECE279', 'Basic Electrical & Electronics Engineering Lab', 'Seven experiments, each with aim, theory, virtual bench, observation tables and viva questions.'],
                ['ECE249', 'Earlier syllabus of the same course', 'Also covered: number systems, logic gates, K-maps, combinational and sequential circuits, counters.']]
                .map(([code, name, text]) => h('a', { class: 'card home-course', href: `#/map/${code.toLowerCase()}` }, h('span', { class: 'chip' }, code), h('h3', {}, name), h('p', {}, text)))),
        ...SECTIONS.slice(1).map(([group, items]) => h('section', { class: 'home-section' }, h('h3', {}, group),
            h('div', { class: 'home-grid' }, ...items.map(([id, title, sub]) => h('a', { class: `card home-card${seen.has(id) ? ' is-seen' : ''}`, href: `#/${id}` }, h('b', {}, title), h('small', {}, sub)))))));
}
