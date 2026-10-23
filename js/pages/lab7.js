// Experiment 7: Arduino projects — automatic street light (LDR + relay), temperature-controlled vent
// (DHT11 + servo) and a parking distance alarm (HC-SR04 + buzzer).

import { h, s, table, note } from '../core/ui.js';
import { tile, slider } from '../core/page.js';
import { labPage } from '../core/lab.js';
import { code } from './arduino.js';

export const intro = 'Three small embedded projects that read a sensor and drive an actuator: the same sense → decide → act loop used in every embedded and IoT system.';

const serial = (lines) => h('div', { class: 'serial' }, h('div', { class: 'serial__bar' }, 'Serial Monitor · 9600 baud'), h('pre', {}, lines.join('\n')));

const ldrAdc = (lux) => { const R = 500000 / Math.pow(lux + 1, 0.8); return Math.round((10000 / (R + 10000)) * 1023); };

export const PROJECTS = {
    light: {
        name: 'Automatic street light',
        blocks: ['LDR + 10 kΩ divider', 'Arduino Uno (A0, compare with 300)', 'Relay module (pin 7)', 'Lamp'],
        wiring: [['LDR', 'One leg to 5 V, other leg to A0'], ['10 kΩ resistor', 'A0 to GND (forms the divider)'], ['Relay module IN', 'Digital pin 7'], ['Relay VCC / GND', '5 V / GND'], ['Status LED', 'Pin 13 (on-board LED)'], ['Lamp', 'Through the relay COM and NO contacts']],
        sketch: 'const int ldrPin = A0;\nconst int relayPin = 7;\nconst int ledPin = 13;\nconst int threshold = 300;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(relayPin, OUTPUT);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  int light = analogRead(ldrPin);\n  bool dark = light < threshold;\n  digitalWrite(relayPin, dark ? HIGH : LOW);\n  digitalWrite(ledPin, dark ? HIGH : LOW);\n  Serial.print("LDR: ");\n  Serial.print(light);\n  Serial.println(dark ? "  -> lamp ON" : "  -> lamp OFF");\n  delay(500);\n}',
        input: { label: 'Light falling on the LDR', min: 0, max: 1000, step: 5, unit: ' lux', start: 400 },
        run: (lux) => { const adc = ldrAdc(lux); const on = adc < 300; return { reading: adc, on, line: `LDR: ${adc}  -> lamp ${on ? 'ON' : 'OFF'}`, row: [`${lux} lux`, String(adc), on ? 'ON' : 'OFF'] }; },
        cols: ['Light level', 'analogRead(A0)', 'Lamp (relay)']
    },
    vent: {
        name: 'Temperature-controlled vent',
        blocks: ['DHT11 (pin 2)', 'Arduino Uno (compare with 28 °C)', 'Servo motor (pin 5)', 'Vent flap'],
        wiring: [['DHT11 VCC / GND', '5 V / GND'], ['DHT11 DATA', 'Digital pin 2 (10 kΩ pull-up to 5 V)'], ['Servo signal (orange)', 'Digital pin 5 (PWM)'], ['Servo red / brown', '5 V / GND']],
        sketch: '#include <DHT.h>\n#include <Servo.h>\n\nDHT dht(2, DHT11);\nServo vent;\n\nvoid setup() {\n  Serial.begin(9600);\n  dht.begin();\n  vent.attach(5);\n  vent.write(0);\n}\n\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  if (isnan(t)) return;           // reading failed, try again\n  vent.write(t > 28 ? 90 : 0);    // open the vent when it is hot\n  Serial.print("Temp: "); Serial.print(t);\n  Serial.print(" C  Hum: "); Serial.print(h);\n  Serial.println(t > 28 ? " %  vent OPEN" : " %  vent CLOSED");\n  delay(2000);\n}',
        input: { label: 'Room temperature', min: 15, max: 45, step: 1, unit: ' °C', start: 26 },
        run: (t) => { const open = t > 28; return { reading: t, on: open, angle: open ? 90 : 0, line: `Temp: ${t.toFixed(2)} C  Hum: 55.00 %  vent ${open ? 'OPEN' : 'CLOSED'}`, row: [`${t} °C`, open ? '90°' : '0°', open ? 'Open' : 'Closed'] }; },
        cols: ['Temperature', 'Servo angle', 'Vent']
    },
    park: {
        name: 'Parking distance alarm',
        blocks: ['HC-SR04 (trig 9, echo 10)', 'Arduino Uno (distance < 20 cm?)', 'Buzzer (pin 8) + LED (pin 13)', 'Driver warning'],
        wiring: [['HC-SR04 VCC / GND', '5 V / GND'], ['HC-SR04 TRIG', 'Digital pin 9'], ['HC-SR04 ECHO', 'Digital pin 10'], ['Buzzer +', 'Digital pin 8'], ['Warning LED', 'Pin 13 through 220 Ω']],
        sketch: 'const int trigPin = 9;\nconst int echoPin = 10;\nconst int buzzer = 8;\nconst int ledPin = 13;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  pinMode(buzzer, OUTPUT);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH); delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n  long t = pulseIn(echoPin, HIGH);\n  float cm = t * 0.0343 / 2;\n  bool close = cm < 20;\n  digitalWrite(buzzer, close);\n  digitalWrite(ledPin, close);\n  Serial.print("Distance: "); Serial.print(cm);\n  Serial.println(close ? " cm  STOP!" : " cm");\n  delay(200);\n}',
        input: { label: 'Distance to the wall', min: 2, max: 200, step: 1, unit: ' cm', start: 60 },
        run: (d) => { const echo = Math.round((d * 2) / 0.0343); const close = d < 20; return { reading: echo, on: close, line: `Distance: ${d.toFixed(2)} cm${close ? '  STOP!' : ''}`, row: [`${d} cm`, `${echo} µs`, close ? 'ON' : 'OFF'] }; },
        cols: ['Distance', 'Echo pulse', 'Buzzer / LED']
    }
};

export const def = {
    id: 'lab7', num: 7,
    aim: 'To interface sensors (LDR, DHT11, HC-SR04) and actuators (relay, servo motor, buzzer) with an Arduino Uno and build three automation projects.',
    apparatus: [['Arduino Uno + USB cable', 'ATmega328P', '1'], ['LDR + 10 kΩ resistor', '5 mm LDR', '1'], ['Relay module', '5 V, single channel', '1'], ['DHT11 sensor', 'Temperature and humidity', '1'], ['Servo motor', 'SG90', '1'], ['Ultrasonic sensor', 'HC-SR04', '1'], ['Buzzer, LED, 220 Ω', 'Active buzzer', '1 each'], ['Breadboard and jumper wires', 'Male–male', 'As required']],
    theory: [
        h('p', {}, 'Every project follows the same loop: ', h('b', {}, 'sense'), ' (read a sensor), ', h('b', {}, 'decide'), ' (compare with a threshold in code), ', h('b', {}, 'act'), ' (switch an output).'),
        h('p', {}, h('b', {}, 'LDR: '), 'its resistance falls with light. In a divider with 10 kΩ it gives 0–5 V at A0, which the 10-bit ADC turns into 0–1023. Below 300 it is dark enough to switch the lamp on through a relay.'),
        h('p', {}, h('b', {}, 'DHT11: '), 'sends a 40-bit digital packet (humidity, temperature, checksum) on one wire. A servo turns to an angle set by the width of a PWM pulse (1 ms = 0°, 2 ms = 180°).'),
        h('p', {}, h('b', {}, 'HC-SR04: '), 'a 10 µs trigger pulse sends 40 kHz ultrasound; the echo pin stays high for the round-trip time. Distance = time × 0.0343 / 2 cm.')
    ],
    procedure: ['Wire the project on the breadboard following its connection table.', 'Open the Arduino IDE, select Board: Arduino Uno and the correct COM port.', 'Type (or open) the sketch, verify it, and upload it.', 'Open the Serial Monitor at 9600 baud.', 'Change the sensor condition (cover the LDR, warm the DHT11, move your hand in front of the HC-SR04) and record the reading and output each time.'],
    precautions: ['Never connect a mains lamp to the relay without supervision; use a low-voltage lamp in the lab.', 'Power the servo from 5 V and a common ground; do not draw large currents from an Arduino pin.', 'Disconnect USB before rewiring.'],
    bench: (panel, ctx) => bench(panel, ctx),
    observations: (ctx) => {
        const done = Object.keys(PROJECTS).filter(k => ctx.obs[k]?.length);
        if (!done.length) return [h('p', { class: 'muted' }, 'No readings yet. Run a project on the Virtual bench and record readings.')];
        return done.map((k, i) => h('div', {}, h('h4', {}, `Table ${i + 1}: ${PROJECTS[k].name}`), table(['#', ...PROJECTS[k].cols], ctx.obs[k].map((r, j) => [String(j + 1), ...r]))));
    },
    result: (ctx) => {
        const done = Object.keys(PROJECTS).filter(k => ctx.obs[k]?.length >= 2);
        return done.length ? `The ${done.map(k => PROJECTS[k].name.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1')} ${done.length > 1 ? 'were' : 'was'} built with the Arduino Uno, and the output switched correctly at the set threshold.` : 'Record at least two readings (one on each side of the threshold) for a project to obtain the result.';
    },
    viva: [
        ['What is the resolution of the Arduino Uno ADC?', '10 bits: 0–1023 for 0–5 V, so about 4.9 mV per step.'],
        ['Why is a relay needed to switch a lamp?', 'An Arduino pin gives only 5 V and about 20 mA. The relay lets that small signal switch a separate, higher-power circuit, with electrical isolation.'],
        ['What do setup() and loop() do?', 'setup() runs once at power-on to configure pins and serial. loop() then runs again and again forever.'],
        ['How does a servo know what angle to go to?', 'From the width of a pulse sent every 20 ms: about 1 ms for 0°, 1.5 ms for 90° and 2 ms for 180°.'],
        ['Why divide by 2 in the ultrasonic distance formula?', 'The pulse width is the time to the object and back again; the distance is only half of that path.'],
        ['What is the difference between an embedded system and an IoT device?', 'An embedded system is a dedicated computer inside a product. An IoT device is an embedded system that is also connected to a network so it can send data and be controlled remotely.']
    ]
};

function visual(k, r) {
    if (k === 'light') {
        return s('svg', { viewBox: '0 0 200 150', class: 'proj-svg' }, s('rect', { x: 96, y: 40, width: 8, height: 100, class: 'proj-pole' }), s('path', { d: 'M100 40 Q100 20 130 20 L150 20', class: 'proj-arm' }),
            s('circle', { cx: 150, cy: 30, r: 12, class: `proj-lamp${r.on ? ' is-on' : ''}` }), r.on ? s('path', { d: 'M135 45 L120 90 L180 90 L165 45 Z', class: 'proj-beam' }) : '', s('text', { x: 20, y: 30, class: 'proj-txt' }, r.on ? 'Night' : 'Day'));
    }
    if (k === 'vent') {
        const a = (r.angle * Math.PI) / 180;
        return s('svg', { viewBox: '0 0 200 150', class: 'proj-svg' }, s('rect', { x: 40, y: 60, width: 60, height: 40, rx: 6, class: 'proj-servo' }), s('circle', { cx: 85, cy: 80, r: 6, class: 'proj-hub' }),
            s('line', { x1: 85, y1: 80, x2: 85 + 70 * Math.cos(a), y2: 80 - 70 * Math.sin(a), class: 'proj-flap' }), s('text', { x: 110, y: 135, class: 'proj-txt' }, `${r.angle}°  ${r.on ? 'OPEN' : 'CLOSED'}`));
    }
    const d = Math.min(200, r.cm);
    return s('svg', { viewBox: '0 0 200 150', class: 'proj-svg' }, s('rect', { x: 186, y: 20, width: 10, height: 110, class: 'proj-wall' }), s('rect', { x: 186 - 20 - d * 0.75, y: 80, width: 20, height: 30, rx: 4, class: `proj-car${r.on ? ' is-on' : ''}` }),
        s('text', { x: 10, y: 30, class: 'proj-txt' }, r.on ? 'STOP!' : `${r.cm} cm`));
}

function bench(panel, ctx) {
    const box = h('div');
    const seg = h('div', { class: 'seg seg--wrap' }, Object.entries(PROJECTS).map(([k, p]) => h('button', { type: 'button', dataset: { k }, onClick: () => show(k) }, p.name)));
    const show = (k) => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
        const p = PROJECTS[k];
        let value = p.input.start;
        const lines = [];
        const live = h('div');
        const recorded = h('p', { class: 'muted' });
        const update = () => {
            const r = { ...p.run(value), cm: value };
            lines.push(r.line);
            if (lines.length > 8) lines.shift();
            live.replaceChildren(h('div', { class: 'grid-3' }, ...p.cols.map((c, i) => tile(c, r.row[i]))), h('div', { class: 'grid-2 proj-live' }, h('div', { class: 'svg-box' }, visual(k, r)), serial(lines)));
            return r;
        };
        const sl = slider(p.input.label, value, { min: p.input.min, max: p.input.max, step: p.input.step, unit: p.input.unit, onInput: v => { value = v; update(); } });
        box.replaceChildren(h('h3', {}, p.name),
            h('div', { class: 'block-flow' }, ...p.blocks.flatMap((b, i) => (i ? [h('span', { class: 'block-arrow' }, '→'), h('div', { class: 'block' }, b)] : [h('div', { class: 'block' }, b)]))),
            h('div', { class: 'row inputs-row' }, sl.el, h('button', { type: 'button', class: 'btn', onClick: () => { (ctx.obs[k] ??= []).push(p.run(value).row); ctx.save(); recorded.textContent = `${ctx.obs[k].length} readings recorded.`; } }, 'Record reading')),
            live, recorded,
            h('div', { class: 'grid-2' }, h('div', {}, h('h4', {}, 'Sketch'), code(p.sketch)), h('div', {}, h('h4', {}, 'Connections'), table(['Component pin', 'Arduino'], p.wiring))));
        update();
    };
    panel.append(seg, box, note('Move the slider to change what the sensor sees. The output, the serial monitor and the picture follow the same logic as the sketch.'));
    show('light');
}

export function render(page, { tab }) {
    return labPage(page, tab, def);
}
