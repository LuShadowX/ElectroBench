// Course map: every syllabus topic of ECE131, ECE279 and ECE249 linked to the page and tab that covers it.

import { h, note } from '../core/ui.js';
import { pageTabs, head } from '../core/page.js';

export const intro = 'Every topic in the syllabus, unit by unit, with a link to the exact page and tab where you can work with it.';

const L = (to, text) => h('a', { href: `#/${to}` }, text);

// [topic from the syllabus, [[link, label], ...], what you do there]
export const ECE249 = [
    ['Unit 1 · Electrical laws and semiconductors', [
        ['Ohm\'s law, KCL, KVL', [['dc/basics', 'DC · Basics'], ['dc/kirchhoff', 'DC · KCL & KVL']], 'Solve a two-source network and watch currents balance at a node and voltages sum to zero around loops'],
        ['Voltage and current divider rules', [['dc/dividers', 'DC · Divider rules']], 'Change R1, R2 and the source; the divided voltage and currents update'],
        ['Intrinsic and extrinsic semiconductors', [['semis/doping', 'Semiconductors · Doping']], 'Silicon lattice with N-type and P-type doping, majority and minority carriers'],
        ['PN junction diode, V-I characteristics', [['semis/junction', 'Semiconductors · PN junction'], ['semis/vi', 'V-I curve'], ['lab3', 'Exp 3']], 'Depletion region in forward and reverse bias; Shockley-equation V-I curve'],
        ['Rectifiers (half wave, full wave, bridge)', [['semis/rectifiers', 'Semiconductors · Rectifiers']], 'Simulated output with and without a filter capacitor, ripple and DC level'],
        ['Diode as a switch', [['semis/switch', 'Semiconductors · Switch & testing']], 'ON/OFF states and the ideal-diode model'],
        ['BJT construction, types, modes, CE characteristics', [['transistors/construction', 'BJT · Construction & modes'], ['transistors/characteristics', 'CE characteristics']], 'NPN/PNP, four operating modes, output curves with load line and Q-point']
    ]],
    ['Unit 2 · Arduino and sensors', [
        ['Analog and digital signals', [['arduino/signals', 'Arduino · Analog vs digital']], 'Sampling and quantisation of a sine wave by a 10-bit ADC'],
        ['Arduino Uno board and pins', [['arduino/board', 'Arduino · Arduino Uno']], 'Click any pin of the board to see what it does'],
        ['Ultrasonic sensor HC-SR04', [['arduino/sensors', 'Arduino · Sensors'], ['lab7', 'Exp 7']], 'Trigger/echo timing, distance formula, sketch and serial output'],
        ['DHT11 / DHT22', [['arduino/sensors', 'Arduino · Sensors'], ['lab7', 'Exp 7']], 'The 40-bit data packet with checksum, DHT11 vs DHT22'],
        ['LDR and IR sensors', [['arduino/sensors', 'Arduino · Sensors'], ['lab7', 'Exp 7']], 'LDR divider to ADC value; IR obstacle detection']
    ]],
    ['Unit 3 · Number systems and logic', [
        ['Binary, octal, decimal, hexadecimal conversions', [['numbers/convert', 'Number systems · Conversions']], 'Step-by-step working for every conversion, including fractions'],
        ['1\'s and 2\'s complement, subtraction', [['numbers/complements', 'Complements & subtraction']], 'Subtraction by complement with the end-around carry shown'],
        ['BCD, Excess-3, Gray code', [['numbers/codes', 'BCD · Excess-3 · Gray']], 'Encode any number; Gray code with the XOR steps'],
        ['Logic gates and universal gates', [['logic/gates', 'Logic · Gates'], ['logic/universal', 'Universal gates'], ['lab4', 'Exp 4']], 'Every gate as a live circuit with its truth table'],
        ['Boolean laws, SOP and POS', [['logic/laws', 'Logic · Boolean laws']], 'Type an expression; the truth table, SOP and POS are generated'],
        ['Karnaugh maps', [['logic/kmap', 'Logic · K-map solver']], '2, 3 and 4-variable maps with don\'t-cares; minimised circuit is built and drawn']
    ]],
    ['Unit 4 · Combinational circuits', [
        ['Half and full adder', [['combinational/adders', 'Combinational · Adders'], ['combinational/ripple', '4-bit adder'], ['lab5', 'Exp 5']], 'Gate-level adders and a 4-bit ripple-carry adder'],
        ['Half and full subtractor', [['combinational/subtractors', 'Combinational · Subtractors']], 'Difference and borrow circuits'],
        ['Multiplexer 4:1 and demultiplexer 1:4', [['combinational/mux', 'Combinational · MUX & DEMUX']], 'Select lines route data; live circuits'],
        ['Decoder 2:4 and encoder 4:2', [['combinational/codec', 'Combinational · Decoder & encoder']], 'Live gate-level circuits'],
        ['1-bit and 2-bit comparators', [['combinational/comparators', 'Combinational · Comparators']], 'A > B, A = B, A < B outputs']
    ]],
    ['Unit 5 · Sequential circuits', [
        ['SR latch (NOR and NAND), D latch', [['sequential/latches', 'Sequential · Latches']], 'Cross-coupled gates with real gate delays, invalid states shown'],
        ['SR, JK, D and T flip-flops', [['sequential/flipflops', 'Flip-flops & timing'], ['lab6', 'Exp 6']], 'Clocked flip-flops with timing diagrams'],
        ['Race-around condition, master–slave JK', [['sequential/latches', 'Sequential · Latches'], ['sequential/flipflops', 'Flip-flops'], ['lab6', 'Exp 6']], 'Watch the output oscillate when the clock is held high, then fix it'],
        ['Flip-flop conversions', [['sequential/conversions', 'Sequential · Flip-flop conversion']], 'Any flip-flop into any other: excitation table, K-maps and equations generated']
    ]],
    ['Unit 6 · Registers and counters', [
        ['Shift registers SISO, SIPO, PISO, PIPO', [['counters/shift', 'Registers · Shift registers']], 'Clock data through bit by bit'],
        ['Asynchronous and synchronous counters, up/down', [['counters/counters', 'Registers · Counters']], 'Ripple counter glitches vs synchronous counter'],
        ['Mod-N, ring and Johnson counters', [['counters/counters', 'Registers · Counters']], 'State sequence and timing diagram for each']
    ]]
];

export const ECE279 = [
    ['1', 'Introduction to electronic components and instruments', 'lab1', 'Colour-code reader, breadboard, RPS, DMM, function generator and CRO with Autoset'],
    ['2', 'KVL voltage hunt (verify KVL)', 'lab2', 'T-network on a 10 V supply, measure drops with probes, loop sums'],
    ['3', 'Diode V-I characteristics', 'lab3', '1N4007 forward and reverse, knee voltage, static and dynamic resistance'],
    ['4', 'Universal gates', 'lab4', 'NOT, AND, OR from 7400 and 7402 with pin-level wiring'],
    ['5', 'Half and full adder', 'lab5', '7486 + 7408 + 7432 pin wiring, truth tables'],
    ['6', 'JK flip-flop using NAND gates', 'lab6', '7400 + 7410, short pulse vs held clock (race-around)'],
    ['7', 'Arduino projects with sensors', 'lab7', 'Street light (LDR + relay), temperature vent (DHT11 + servo), parking alarm (HC-SR04)']
];

export const ECE131 = [
    ['Unit I · DC circuits', 'CO1, CO2', [
        ['R, L, C, voltage, current, power, energy; Ohm\'s law; Kirchhoff\'s laws', [['dc/basics', 'DC · Basics'], ['dc/kirchhoff', 'KCL & KVL']]],
        ['Series–parallel simplification, voltage and current division', [['dc/series', 'Series–parallel'], ['dc/dividers', 'Divider rules']]],
        ['Star–delta transformation; dependent and independent sources', [['dc/stardelta', 'Star–delta'], ['dc/mesh', 'Mesh & nodal']]],
        ['Mesh and nodal analysis', [['dc/mesh', 'Mesh & nodal']]],
        ['Thevenin, Norton, maximum power transfer, superposition', [['dc/theorems', 'Theorems']]]
    ]],
    ['Unit II · AC circuits', 'CO2', [
        ['Amplitude, phase, phase difference, RMS and average value', [['ac/waveform', 'AC waveform']]],
        ['Impedance, RL, RC, RLC series, power factor and power', [['ac/series', 'RL · RC · RLC']]],
        ['Series resonance', [['ac/resonance', 'Resonance']]],
        ['Three-phase star and delta, line and phase relations', [['ac/threephase', 'Three-phase']]]
    ]],
    ['Unit III · Electrical machines', 'CO3', [
        ['Mutual inductance, transformer working, turns ratio, on DC, auto- and instrument transformers', [['machines/transformer', 'Transformer']]],
        ['DC machines: working, classification, starting, speed control', [['machines/dcmotor', 'DC motor']]],
        ['Single- and three-phase induction motors, applications', [['machines/induction', 'Induction motor']]],
        ['Fleming\'s left- and right-hand rules', [['machines/fleming', 'Fleming\'s rules']]]
    ]],
    ['Unit IV · Semiconductor devices', 'CO4', [
        ['PN junction diode working and characteristics', [['semis/junction', 'PN junction'], ['semis/vi', 'V-I curve'], ['lab3', 'Exp 3']]],
        ['Zener diode and varactor diode', [['semis/zener', 'Zener'], ['semis/varactor', 'Varactor']]],
        ['Half wave, full wave and bridge rectifiers', [['semis/rectifiers', 'Rectifiers']]],
        ['Testing of diode and BJT', [['semis/switch', 'Switch & testing']]],
        ['MOSFET representation and characteristics', [['transistors/mosfet', 'MOSFET']]],
        ['Logic gates', [['logic/gates', 'Logic gates'], ['lab4', 'Exp 4']]]
    ]],
    ['Unit V · Filters and op-amps', 'CO5', [
        ['Op-amp properties, virtual ground', [['opamp/properties', 'Properties']]],
        ['Inverting, non-inverting, adder, subtractor', [['opamp/configs', 'Amplifiers, adder, subtractor']]],
        ['Integrator and differentiator', [['opamp/integrator', 'Integrator & differentiator']]],
        ['Low-pass, high-pass, band-pass, band-stop (passive and active)', [['opamp/filters', 'Filters']]],
        ['Comparator and its use in anti-lock braking', [['opamp/comparator', 'Comparator & ABS']]]
    ]],
    ['Unit VI · Embedded systems and IoT', 'CO6', [
        ['Embedded systems, microprocessor vs microcontroller', [['arduino/embedded', 'Embedded systems & IoT']]],
        ['Arduino and sensors', [['arduino/board', 'Arduino Uno'], ['arduino/sensors', 'Sensors'], ['lab7', 'Exp 7']]],
        ['IoT and cloud in plants, healthcare, agriculture, manufacturing, automobiles, smart grid', [['arduino/embedded', 'Embedded systems & IoT']]]
    ]]
];

const links = (list) => h('span', { class: 'map-links' }, ...list.flatMap(([to, text], i) => (i ? [' · ', L(to, text)] : [L(to, text)])));

function ece249(panel) {
    panel.append(head('ECE249 · Basic Electrical and Electronics Engineering (earlier syllabus)', 'The earlier version of the course, with more digital electronics. Each row is a topic from its unit notes and the place in ElectroBench where it is built.'),
        ...ECE249.map(([unit, rows]) => h('div', { class: 'card map-unit' }, h('h3', {}, unit),
            h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', {}, 'Syllabus topic'), h('th', {}, 'Where'), h('th', {}, 'What you can do there'))),
                h('tbody', {}, ...rows.map(([topic, where, what]) => h('tr', {}, h('td', {}, topic), h('td', {}, links(where)), h('td', {}, what))))))));
}

function ece279(panel) {
    panel.append(head('ECE279 · Basic Electrical and Electronics Engineering Laboratory', 'Every experiment has its aim and theory, a virtual bench, observation tables that fill in from your readings, and viva questions.'),
        h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', {}, 'Exp'), h('th', {}, 'Experiment'), h('th', {}, 'Virtual bench'))),
            h('tbody', {}, ...ECE279.map(([n, name, to, what]) => h('tr', {}, h('td', {}, n), h('td', {}, L(to, name)), h('td', {}, what))))),
        note('All readings are collected on the ', L('record', 'Lab record'), ' page, which prints as a lab file.'));
}

function ece131(panel) {
    panel.append(head('ECE131 · Basic Electrical and Electronics Engineering (2026-27)', 'All six units of the current syllabus. Each row is a line from the syllabus and the page and tab that covers it; the chip next to each unit is its course outcome.'),
        ...ECE131.map(([unit, co, rows]) => h('div', { class: 'card map-unit' }, h('div', { class: 'row' }, h('h3', {}, unit), h('span', { class: 'chip' }, co)),
            h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', {}, 'Syllabus topic'), h('th', {}, 'Where'))),
                h('tbody', {}, ...rows.map(([topic, where]) => h('tr', {}, h('td', {}, topic), h('td', {}, links(where)))))))),
        h('h4', {}, 'Course outcomes'),
        h('table', { class: 'data' }, h('tbody', {}, ...[['CO1', 'Enumerate basic terminology of electrical and electronics engineering', 'Glossary-style basics on every page; DC · Basics; Exp 1'], ['CO2', 'Understand behaviour and notation of electrical circuits', 'DC circuits and AC circuits pages'], ['CO3', 'Principles and applications of electrical machines', 'Electrical machines page'], ['CO4', 'Characteristics of semiconductor devices', 'Semiconductors, BJT & MOSFET, Exp 3'], ['CO5', 'Working of filters and op-amps', 'Op-amps & filters page'], ['CO6', 'IoT, cloud and embedded systems in various fields', 'Arduino, sensors & IoT page; Exp 7']].map(r => h('tr', {}, ...r.map(c => h('td', {}, c)))))));
}

export function render(page, { tab }) {
    return pageTabs(page, 'map', [
        { id: 'ece131', label: 'ECE131 (2026-27)', render: ece131 },
        { id: 'ece279', label: 'ECE279 lab', render: ece279 },
        { id: 'ece249', label: 'ECE249 (earlier syllabus)', render: ece249 }
    ], tab);
}
