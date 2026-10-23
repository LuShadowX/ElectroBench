// Router and navigation. Pages are ES modules loaded on demand: #/<page>/<tab>

import { h, $, $$ } from './core/ui.js';
import { store, bus } from './core/store.js';

export const SECTIONS = [
    ['Start', [
        ['home', 'Home', 'Overview and quick start'],
        ['map', 'Course map', 'Every syllabus topic → where it is']
    ]],
    ['Electrical circuits', [
        ['dc', 'DC circuits & theorems', 'Ohm, KCL, KVL, dividers, star–delta, mesh, nodal, Thevenin, Norton, superposition, max power'],
        ['ac', 'AC circuits', 'RMS, phase, phasors, RL/RC/RLC, resonance, power factor, three-phase'],
        ['machines', 'Electrical machines', 'Transformer, DC motor, induction motor, Fleming\'s rules']
    ]],
    ['Electronic devices', [
        ['semis', 'Semiconductors & diodes', 'Doping, PN junction, diode V-I, Zener, varactor, rectifiers'],
        ['transistors', 'BJT & MOSFET', 'Construction, modes, CE characteristics, load line, switch, MOSFET'],
        ['opamp', 'Op-amps & filters', 'Inverting, non-inverting, adder, subtractor, integrator, differentiator, comparator, filters']
    ]],
    ['Embedded systems', [
        ['arduino', 'Arduino, sensors & IoT', 'Analog/digital, Uno pinout, PWM, HC-SR04, DHT11, LDR, IR, μP vs μC, IoT']
    ]],
    ['Digital electronics', [
        ['numbers', 'Number systems & codes', 'Conversions, complements, BCD, Excess-3, Gray'],
        ['logic', 'Logic gates & K-maps', 'Gates, universal gates, Boolean laws, SOP/POS, K-map solver'],
        ['combinational', 'Combinational circuits', 'Adders, subtractors, MUX, DEMUX, decoder, encoder, comparator'],
        ['sequential', 'Latches & flip-flops', 'SR, D, JK, T, master–slave, race-around, conversions'],
        ['counters', 'Registers & counters', 'SISO, SIPO, PISO, PIPO, ripple and synchronous counters, mod-N, ring, Johnson']
    ]],
    ['ECE279 lab', [
        ['lab1', 'Exp 1 · Components & instruments', 'Colour code, breadboard, DMM, function generator, CRO'],
        ['lab2', 'Exp 2 · KVL voltage hunt', 'Verify KVL in a T-network'],
        ['lab3', 'Exp 3 · Diode V-I', 'Forward and reverse characteristics'],
        ['lab4', 'Exp 4 · Universal gates', 'NOT, AND, OR from 7400 / 7402'],
        ['lab5', 'Exp 5 · Adders', 'Half and full adder with 7486, 7408, 7432'],
        ['lab6', 'Exp 6 · JK flip-flop (NAND)', '7400 + 7410, race-around'],
        ['lab7', 'Exp 7 · Arduino projects', 'Street light, temperature vent, parking alarm'],
        ['record', 'Lab record', 'All observations, printable']
    ]]
];

const PAGES = Object.fromEntries(SECTIONS.flatMap(([group, items]) => items.map(([id, title, sub], i) => [id, { id, title, sub, group }])));
const loaders = {
    home: () => import('./pages/home.js'), map: () => import('./pages/map.js'),
    dc: () => import('./pages/dc.js'), ac: () => import('./pages/ac.js'), machines: () => import('./pages/machines.js'),
    semis: () => import('./pages/semis.js'), transistors: () => import('./pages/transistors.js'), opamp: () => import('./pages/opamp.js'),
    arduino: () => import('./pages/arduino.js'),
    numbers: () => import('./pages/numbers.js'), logic: () => import('./pages/logic.js'), combinational: () => import('./pages/combinational.js'),
    sequential: () => import('./pages/sequential.js'), counters: () => import('./pages/counters.js'),
    lab1: () => import('./pages/lab1.js'), lab2: () => import('./pages/lab2.js'), lab3: () => import('./pages/lab3.js'),
    lab4: () => import('./pages/lab4.js'), lab5: () => import('./pages/lab5.js'), lab6: () => import('./pages/lab6.js'),
    lab7: () => import('./pages/lab7.js'), record: () => import('./pages/record.js')
};

const visitedPages = () => new Set(store.get('visited', []).map(k => k.split('/')[0]));

function renderNav(active) {
    const seen = visitedPages();
    let labNum = 0;
    let topicNum = 0;
    $('#nav').replaceChildren(...SECTIONS.map(([group, items]) => h('div', {},
        h('p', { class: 'side__group' }, group),
        ...items.map(([id, title]) => {
            const isLab = id.startsWith('lab');
            const num = isLab ? String(++labNum) : ['home', 'map', 'record'].includes(id) ? '•' : String(++topicNum);
            return h('a', { href: `#/${id}`, class: id === active ? 'is-active' : '', 'aria-current': id === active ? 'page' : null },
                h('span', { class: 'num' }, num), h('span', {}, title), h('span', { class: `tick${seen.has(id) ? ' is-done' : ''}`, 'aria-hidden': 'true' }));
        }))),
    h('div', { class: 'side__progress' }, (() => {
        const ids = Object.keys(PAGES).filter(id => !['home', 'map', 'record'].includes(id));
        const done = ids.filter(id => seen.has(id)).length;
        return [h('p', { class: 'side__group' }, 'Your progress'), h('div', { class: 'meter' }, h('span', { style: { '--v': `${(done / ids.length) * 100}%`, '--c': '#22c55e' } })), h('small', {}, `${done} of ${ids.length} topics and experiments opened`)];
    })()));
}

let cleanup = null;
let currentPage = null;
let currentView = null;

async function route() {
    const [, pageId = 'home', tab] = location.hash.split('/');
    const id = PAGES[pageId] ? pageId : 'home';
    const meta = PAGES[id];
    document.title = `${meta.title} | ElectroBench`;
    $('#crumbs').replaceChildren(meta.group, ' › ', h('b', {}, meta.title));
    $('#tags').replaceChildren(...tagsFor(id).map(t => h('span', { class: 'chip' }, t)));
    $('#side').classList.remove('is-open');

    if (id === currentPage && currentView) {
        if (tab) currentView.show?.(tab);
        renderNav(id);
        return;
    }
    cleanup?.();
    cleanup = null;
    currentPage = id;
    const page = $('#page');
    page.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
    try {
        const module = await loaders[id]();
        page.replaceChildren(h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, meta.group), h('h1', {}, meta.title), h('p', {}, module.intro ?? meta.sub)));
        const result = module.render(page, { tab, go: (to) => { location.hash = `#/${to}`; } }) ?? {};
        currentView = result;
        cleanup = result.cleanup ?? null;
        if (tab) result.show?.(tab);
    } catch (err) {
        console.error(err);
        page.replaceChildren(h('p', { class: 'note note--bad' }, `This page failed to load: ${err.message}`));
    }
    renderNav(id);
    scrollTo(0, 0);
}

function tagsFor(id) {
    const map = {
        dc: ['ECE131 U-I', 'ECE249 U-1', 'Lab 2'], ac: ['ECE131 U-II'], machines: ['ECE131 U-III'],
        semis: ['ECE131 U-IV', 'ECE249 U-1', 'Lab 3'], transistors: ['ECE131 U-IV', 'ECE249 U-1'], opamp: ['ECE131 U-V'],
        arduino: ['ECE131 U-VI', 'ECE249 U-2', 'Lab 7'], numbers: ['ECE249 U-3'], logic: ['ECE249 U-3', 'ECE131 U-IV', 'Lab 4'],
        combinational: ['ECE249 U-4', 'Lab 5'], sequential: ['ECE249 U-5', 'Lab 6'], counters: ['ECE249 U-6'],
        lab1: ['ECE279'], lab2: ['ECE279'], lab3: ['ECE279'], lab4: ['ECE279'], lab5: ['ECE279'], lab6: ['ECE279'], lab7: ['ECE279'], record: ['ECE279']
    };
    return map[id] ?? [];
}

$('#menu-button').addEventListener('click', () => {
    const open = $('#side').classList.toggle('is-open');
    $('#menu-button').setAttribute('aria-expanded', open);
});
bus.on('visited', () => renderNav(currentPage));
addEventListener('hashchange', route);
if (!location.hash) history.replaceState(null, '', '#/home');
route();

export { PAGES };
