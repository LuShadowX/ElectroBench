// Arduino, sensors and IoT: signals and ADC, Uno pinout, PWM, HC-SR04, DHT11/22, LDR, IR, embedded systems and IoT.

import { h, s, table, note } from '../core/ui.js';
import { pageTabs, slider, tile, formula, head, eng } from '../core/page.js';
import { plot } from '../core/plot.js';

export const intro = 'An Arduino is a small microcontroller board that reads sensors and controls outputs. It is the bridge between the electronics in this course and real projects.';

export const code = (text) => h('pre', { class: 'code ino' }, text);

/* ---------- signals ---------- */
function signals(panel) {
    const st = { v: 2.5 };
    const out = h('div');
    const render = () => {
        const adc = Math.round((st.v / 5) * 1023);
        const analog = Array.from({ length: 201 }, (_, k) => { const t = k / 200; return [t, 2.5 + 2 * Math.sin(2 * Math.PI * 2 * t) + 0.4 * Math.sin(2 * Math.PI * 7 * t)]; });
        const digital = analog.map(([t, v]) => [t, v > 2.5 ? 5 : 0]);
        out.replaceChildren(
            plot({ height: 220, x: { min: 0, max: 1, label: 'Time (s)' }, y: { min: -0.5, max: 5.5, step: 1, label: 'Voltage (V)' }, series: [{ points: analog, label: 'analog (any value)', color: '#0e7490' }, { points: digital, label: 'digital (only 0 or 5 V)', color: '#f59e0b' }], readout: false }),
            h('div', { class: 'grid-4' }, tile('Voltage on A0', `${st.v.toFixed(2)} V`), tile('analogRead(A0)', String(adc), 'round(V / 5 × 1023)'), tile('Resolution', '4.89 mV', '5 V / 1024 steps (10-bit)'), tile('digitalRead', st.v >= 3 ? 'HIGH (1)' : st.v <= 1.5 ? 'LOW (0)' : 'undefined zone', '≥ 3 V HIGH, ≤ 1.5 V LOW')));
    };
    panel.append(head('Analog and digital signals', 'Analog signals vary continuously (temperature, sound, light). Digital signals have only two states (a button, an LED). Arduino reads analog voltages through a 10-bit ADC on pins A0–A5, giving 0–1023.'),
        h('div', { class: 'row inputs-row' }, slider('Voltage on pin A0', st.v, { min: 0, max: 5, step: 0.01, unit: ' V', format: v => v.toFixed(2), onInput: v => { st.v = v; render(); } }).el), out,
        table(['', 'Analog', 'Digital'], [['Values', 'Infinite, continuous', 'Two: HIGH / LOW'], ['Examples', 'Temperature, potentiometer, microphone, LDR', 'Push button, LED, IR sensor output'], ['Arduino pins', 'A0–A5 with analogRead()', 'D0–D13 with digitalRead() / digitalWrite()'], ['Noise', 'Easily affected', 'Very robust']]));
    render();
}

/* ---------- board ---------- */
const PINS = {
    D0: 'Digital 0 / RX: receives serial data (shared with USB).', D1: 'Digital 1 / TX: transmits serial data (shared with USB).',
    D2: 'Digital I/O. Also external interrupt 0.', D3: 'Digital I/O, PWM (~). External interrupt 1.', D4: 'Digital I/O.', D5: 'Digital I/O, PWM (~).', D6: 'Digital I/O, PWM (~).', D7: 'Digital I/O.', D8: 'Digital I/O.',
    D9: 'Digital I/O, PWM (~).', D10: 'Digital I/O, PWM (~). SPI SS.', D11: 'Digital I/O, PWM (~). SPI MOSI.', D12: 'Digital I/O. SPI MISO.', D13: 'Digital I/O. Built-in LED "L". SPI SCK.',
    A0: 'Analog input 0 (10-bit ADC). Can also be digital I/O.', A1: 'Analog input 1.', A2: 'Analog input 2.', A3: 'Analog input 3.', A4: 'Analog input 4. I²C SDA.', A5: 'Analog input 5. I²C SCL.',
    VIN: 'Input voltage when powered from the barrel jack (7–12 V recommended).', '5V': 'Regulated 5 V output for sensors.', '3.3V': '3.3 V output (max 50 mA).', GND: 'Ground (0 V reference).', RESET: 'Pull LOW to restart the program.', IOREF: 'Tells shields the board\'s logic voltage (5 V).', AREF: 'Optional reference voltage for the ADC.'
};

function board(panel) {
    const info = h('div', { class: 'card' }, h('h3', {}, 'Click any pin'), h('p', { class: 'muted' }, 'Its function appears here.'));
    const show = (pin) => {
        svg.querySelectorAll('.uno-pin').forEach(el => el.classList.toggle('is-selected', el.dataset.pin === pin));
        info.replaceChildren(h('h3', {}, pin), h('p', {}, PINS[pin]), /PWM/.test(PINS[pin]) ? h('span', { class: 'chip' }, 'analogWrite() works here') : '');
    };
    const pin = (name, x, y) => s('g', { class: 'uno-pin', dataset: { pin: name }, tabindex: 0, role: 'button', 'aria-label': name, onClick: () => show(name), onKeydown: e => { if (e.key === 'Enter') show(name); } },
        s('rect', { x: x - 9, y: y - 9, width: 18, height: 18, rx: 3 }), s('text', { x, y: y < 100 ? y + 26 : y - 16, 'text-anchor': 'middle', transform: `rotate(-90 ${x} ${y < 100 ? y + 26 : y - 16})` }, name.replace('D', '')));
    const top = ['AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8', null, 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];
    const bottom = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'VIN', null, 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
    const svg = s('svg', { viewBox: '0 0 620 340', class: 'uno', role: 'img', 'aria-label': 'Arduino Uno board' },
        s('rect', { x: 40, y: 30, width: 560, height: 280, rx: 16, class: 'uno-board' }),
        s('rect', { x: 0, y: 70, width: 90, height: 70, rx: 6, class: 'uno-usb' }), s('text', { x: 45, y: 110, 'text-anchor': 'middle', class: 'uno-text' }, 'USB-B'),
        s('rect', { x: 10, y: 220, width: 80, height: 60, rx: 6, class: 'uno-jack' }), s('text', { x: 50, y: 255, 'text-anchor': 'middle', class: 'uno-text' }, 'DC jack'),
        s('rect', { x: 300, y: 140, width: 220, height: 64, rx: 6, class: 'uno-chip' }), s('text', { x: 410, y: 178, 'text-anchor': 'middle', class: 'uno-chip-text' }, 'ATmega328P'),
        s('rect', { x: 150, y: 120, width: 50, height: 26, rx: 4, class: 'uno-xtal' }), s('text', { x: 175, y: 137, 'text-anchor': 'middle', class: 'uno-small' }, '16 MHz'),
        s('circle', { cx: 270, cy: 92, r: 7, class: 'uno-led' }), s('text', { x: 270, y: 112, 'text-anchor': 'middle', class: 'uno-small' }, 'L (13)'),
        s('rect', { x: 120, y: 245, width: 26, height: 26, rx: 4, class: 'uno-reset' }), s('text', { x: 133, y: 290, 'text-anchor': 'middle', class: 'uno-small' }, 'RESET'),
        s('rect', { x: 520, y: 230, width: 50, height: 40, rx: 4, class: 'uno-icsp' }), s('text', { x: 545, y: 290, 'text-anchor': 'middle', class: 'uno-small' }, 'ICSP'),
        s('text', { x: 380, y: 90, 'text-anchor': 'middle', class: 'uno-title' }, 'DIGITAL (PWM ~)'), s('text', { x: 420, y: 250, 'text-anchor': 'middle', class: 'uno-title' }, 'ANALOG IN'), s('text', { x: 200, y: 250, 'text-anchor': 'middle', class: 'uno-title' }, 'POWER'),
        ...top.map((p, i) => (p ? pin(p, 170 + i * 25, 46) : null)).filter(Boolean),
        ...bottom.map((p, i) => (p ? pin(p, 150 + i * 30 + (i > 7 ? 40 : 0), 294) : null)).filter(Boolean));
    panel.append(head('Arduino Uno: architecture and pin configuration'),
        h('div', { class: 'split' }, h('div', { class: 'svg-box' }, svg), info),
        table(['Specification', 'Value'], [['Microcontroller', 'ATmega328P (8-bit AVR)'], ['Operating voltage', '5 V'], ['Input voltage (recommended)', '7–12 V'], ['Clock speed', '16 MHz'], ['Digital I/O pins', '14 (D0–D13), 6 with PWM: 3, 5, 6, 9, 10, 11'], ['Analog inputs', '6 (A0–A5), 10-bit'], ['Flash / SRAM / EEPROM', '32 KB / 2 KB / 1 KB'], ['DC current per I/O pin', '20 mA (40 mA absolute max)']]),
        code('void setup() {\n  pinMode(13, OUTPUT);      // runs once\n}\n\nvoid loop() {               // runs forever\n  digitalWrite(13, HIGH);   // LED on\n  delay(500);\n  digitalWrite(13, LOW);    // LED off\n  delay(500);\n}'));
    show('D13');
}

/* ---------- PWM ---------- */
function pwm(panel) {
    const st = { duty: 128 };
    const out = h('div');
    const render = () => {
        const d = st.duty / 255;
        const pts = [];
        for (let k = 0; k <= 400; k++) { const t = (k / 400) * 4; pts.push([t * 2.04, t % 1 < d ? 5 : 0]); }
        out.replaceChildren(h('div', { class: 'split' },
            plot({ height: 220, x: { min: 0, max: 8.16, label: 'Time (ms) at 490 Hz' }, y: { min: -0.5, max: 5.5, step: 1, label: 'Pin voltage (V)' }, series: [{ points: pts, color: '#0e7490', label: 'PWM' }], hlines: [{ y: 5 * d, label: `average ${(5 * d).toFixed(2)} V`, color: '#f59e0b' }], readout: false }),
            h('div', { class: 'card center' }, h('div', { class: 'led-big', style: { '--b': d } }), h('p', {}, `analogWrite(9, ${st.duty})`), h('p', { class: 'muted' }, `duty cycle ${(d * 100).toFixed(0)}%`))),
            formula(`average voltage = duty × 5 V = ${st.duty}/255 × 5 = ${(5 * d).toFixed(2)} V`));
    };
    panel.append(head('PWM: faking analog output', 'Arduino has no true analog output. analogWrite() switches a pin on and off 490 times a second. The fraction of time it is ON (duty cycle) sets the average voltage, so an LED looks dimmer or a motor runs slower.'),
        h('div', { class: 'row inputs-row' }, slider('analogWrite value', st.duty, { min: 0, max: 255, step: 1, onInput: v => { st.duty = v; render(); } }).el), out);
    render();
}

/* ---------- sensors ---------- */
function sensors(panel) {
    const st = { which: 'ultra', dist: 40, temp: 27, hum: 55, lux: 300, ir: true, dht: 'DHT11' };
    const seg = h('div', { class: 'seg seg--wrap' }, [['ultra', 'Ultrasonic HC-SR04'], ['dht', 'DHT11 / DHT22'], ['ldr', 'LDR'], ['ir', 'IR sensor']].map(([id, l]) => h('button', { type: 'button', dataset: { id }, onClick: () => { st.which = id; render(); } }, l)));
    const body = h('div');
    const serial = (lines) => h('div', { class: 'serial' }, h('div', { class: 'serial__bar' }, 'Serial Monitor · 9600 baud'), h('pre', {}, lines.join('\n')));
    const render = () => {
        [...seg.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === st.which));
        if (st.which === 'ultra') {
            const time = (st.dist * 2) / 0.0343;
            const trig = [[0, 0], [10, 0], [10, 5], [20, 5], [20, 0], [Math.max(600, time + 600), 0]];
            const echo = [[0, 0], [470, 0], [470, 5], [470 + time, 5], [470 + time, 0], [Math.max(600, time + 600), 0]];
            body.replaceChildren(
                h('div', { class: 'row inputs-row' }, slider('Object distance', st.dist, { min: 2, max: 400, step: 1, unit: ' cm', onInput: v => { st.dist = v; render(); } }).el),
                h('div', { class: 'grid-3' }, tile('Echo pulse width', eng(time * 1e-6, 's')), tile('Distance', `${st.dist.toFixed(1)} cm`, 'time × 0.0343 / 2'), tile('Range', '2 – 400 cm', '40 kHz ultrasound')),
                plot({ height: 200, x: { min: 0, max: Math.max(600, time + 600), label: 'Time (µs)' }, y: { min: -0.5, max: 11.5, step: 5, label: '' }, series: [{ points: trig.map(([a, b]) => [a, b + 6]), label: 'TRIG (10 µs pulse)', color: '#f59e0b' }, { points: echo, label: 'ECHO (high while sound travels)', color: '#0e7490' }], readout: false }),
                h('div', { class: 'grid-2' }, code('const int trigPin = 9;\nconst int echoPin = 10;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH); delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n  long duration = pulseIn(echoPin, HIGH);\n  float distance = duration * 0.0343 / 2;  // speed of sound, there and back\n  Serial.print("Distance: ");\n  Serial.print(distance);\n  Serial.println(" cm");\n  delay(500);\n}'),
                    serial(Array.from({ length: 6 }, (_, k) => `Distance: ${(st.dist + (k % 3 - 1) * 0.3).toFixed(2)} cm`))),
                note('Pins: VCC (5 V), Trig, Echo, GND. Principle: transmit a burst, it reflects off the object, the receiver hears the echo. Distance = speed of sound × time / 2.'));
        } else if (st.which === 'dht') {
            const dht11 = st.dht === 'DHT11';
            const h1 = Math.round(st.hum);
            const t1 = Math.trunc(st.temp);
            const td = dht11 ? 0 : Math.round((st.temp - t1) * 10);
            const bytes = [h1, 0, t1, td];
            const sum = bytes.reduce((a, b) => a + b, 0) & 255;
            const bits = [...bytes, sum].map(b => b.toString(2).padStart(8, '0'));
            body.replaceChildren(
                h('div', { class: 'row inputs-row' }, h('div', { class: 'seg' }, ['DHT11', 'DHT22'].map(m => h('button', { type: 'button', 'aria-pressed': st.dht === m, onClick: () => { st.dht = m; render(); } }, m))),
                    slider('Temperature', st.temp, { min: dht11 ? 0 : -40, max: dht11 ? 50 : 80, step: 0.1, unit: ' °C', format: v => v.toFixed(1), onInput: v => { st.temp = v; render(); } }).el,
                    slider('Humidity', st.hum, { min: dht11 ? 20 : 0, max: dht11 ? 90 : 100, step: 1, unit: ' %', onInput: v => { st.hum = v; render(); } }).el),
                h('h4', {}, 'The 40-bit packet the sensor sends on its single data wire'),
                h('div', { class: 'dht-bits' }, ['Humidity (int)', 'Humidity (dec)', 'Temp (int)', 'Temp (dec)', 'Checksum'].map((n, i) => h('div', {}, h('small', {}, n), h('code', {}, bits[i]), h('b', {}, i === 4 ? `${sum} = sum of first 4 & 255` : String([h1, 0, t1, td][i]))))),
                table(['', 'DHT11', 'DHT22'], [['Temperature range', '0–50 °C (±2 °C)', '−40–80 °C (±0.5 °C)'], ['Humidity range', '20–90% (±5%)', '0–100% (±2%)'], ['Sampling rate', '1 reading per second', '1 reading every 2 seconds'], ['Cost', 'Lower', 'Higher']]),
                h('div', { class: 'grid-2' }, code('#include <DHT.h>\nDHT dht(2, DHT11);   // data pin 2\n\nvoid setup() {\n  Serial.begin(9600);\n  dht.begin();\n}\n\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  Serial.print("Temp: "); Serial.print(t);\n  Serial.print(" C  Humidity: "); Serial.print(h);\n  Serial.println(" %");\n  delay(2000);\n}'), serial(Array.from({ length: 5 }, () => `Temp: ${(dht11 ? Math.round(st.temp) : st.temp).toFixed(2)} C  Humidity: ${st.hum.toFixed(2)} %`))),
                note('Working: humidity changes the resistance between two electrodes on a moisture-holding substrate. Temperature is measured with an NTC thermistor. A small chip converts both to the digital packet above. Pins: VCC, Data, NC, GND.'));
        } else if (st.which === 'ldr') {
            const R = 500000 / Math.pow(st.lux + 1, 0.8);
            const V = (5 * 10000) / (R + 10000);
            const adc = Math.round((V / 5) * 1023);
            body.replaceChildren(
                h('div', { class: 'row inputs-row' }, slider('Light level', st.lux, { min: 0, max: 1000, step: 5, unit: ' lux', onInput: v => { st.lux = v; render(); } }).el),
                h('div', { class: 'grid-4' }, tile('LDR resistance', eng(R, 'Ω'), 'falls as light rises'), tile('Voltage at A0', `${V.toFixed(2)} V`, '5 × 10k / (R_LDR + 10k)'), tile('analogRead(A0)', String(adc)), tile('Lamp', adc < 300 ? 'ON (dark)' : 'OFF', 'threshold 300')),
                h('div', { class: 'grid-2' }, code('const int ldrPin = A0;\nconst int lampPin = 7;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(lampPin, OUTPUT);\n}\n\nvoid loop() {\n  int value = analogRead(ldrPin);\n  digitalWrite(lampPin, value < 300 ? HIGH : LOW);\n  Serial.println(value);\n  delay(200);\n}'), serial(Array.from({ length: 6 }, (_, k) => String(adc + (k % 3) - 1)))),
                note('Photoconductivity: light gives electrons enough energy to conduct, so resistance drops from MΩ in darkness to a few hundred Ω in bright light. Wired as a voltage divider with a 10 kΩ resistor so the Arduino can read it.'));
        } else {
            body.replaceChildren(
                h('div', { class: 'row inputs-row' }, h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: st.ir, onChange: e => { st.ir = e.target.checked; render(); } }), 'Object in front of the sensor')),
                h('div', { class: 'grid-3' }, tile('IR LED', 'emitting 940 nm'), tile('Photodiode', st.ir ? 'receives reflection' : 'nothing reflected'), tile('OUT pin', st.ir ? 'LOW (0)' : 'HIGH (1)', 'most modules are active-low')),
                h('div', { class: 'grid-2' }, code('const int irPin = 4;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(irPin, INPUT);\n}\n\nvoid loop() {\n  if (digitalRead(irPin) == LOW) Serial.println("Obstacle!");\n  else Serial.println("Clear");\n  delay(300);\n}'), serial(Array.from({ length: 5 }, () => (st.ir ? 'Obstacle!' : 'Clear')))),
                note('An IR LED shines invisible infrared light. If an object is close, it reflects back into the photodiode. A comparator on the module (often an LM393) turns that into a clean digital signal. Pins: VCC, GND, OUT. Used in line-follower robots and touchless taps.'));
        }
    };
    panel.append(head('Sensors'), seg, body);
    render();
}

/* ---------- embedded + IoT ---------- */
function embedded(panel) {
    panel.append(head('Embedded systems and IoT', 'An embedded system is a computer built into a product to do one job: a washing machine controller, an airbag unit, a smartwatch. Connect it to the internet and it becomes part of the Internet of Things.'),
        h('h4', {}, 'Microprocessor vs microcontroller'),
        table(['', 'Microprocessor', 'Microcontroller'], [['What it is', 'Only the CPU', 'CPU + RAM + ROM + I/O + timers + ADC on one chip'], ['Examples', 'Intel Core i5, AMD Ryzen', 'ATmega328P (Arduino), ESP32, PIC'], ['Needs external chips', 'Yes: RAM, storage, I/O', 'No: a complete small computer'], ['Speed', 'GHz', 'MHz'], ['Power', 'Watts to tens of watts', 'Milliwatts'], ['Cost', 'High', 'A few hundred rupees'], ['Used in', 'PCs, laptops, servers', 'Appliances, toys, cars, sensors, IoT']]),
        h('h4', {}, 'IoT system architecture'),
        h('div', { class: 'iot-flow' }, [['Sensors', 'measure the world'], ['Microcontroller', 'reads and pre-processes'], ['Connectivity', 'Wi-Fi, Bluetooth, LoRa, 4G'], ['Cloud', 'stores, analyses, alerts'], ['App / dashboard', 'people act on it']].map(([a, b]) => h('div', {}, h('b', {}, a), h('small', {}, b)))),
        h('h4', {}, 'IoT and cloud for condition monitoring'),
        h('div', { class: 'info-cards' }, [
            ['🏭 Plant processes', 'Vibration and temperature sensors on pumps and motors warn of a failure before it happens (predictive maintenance).'],
            ['🏥 Healthcare', 'Wearables stream heart rate and SpO₂ to the cloud. Doctors get alerts for patients at home.'],
            ['🌾 Agriculture', 'Soil-moisture sensors switch irrigation only when needed. Weather data guides spraying.'],
            ['⚙️ Manufacturing', 'Machines report output and faults in real time. Digital twins simulate the line.'],
            ['🚗 Automobiles', 'Engine, tyre-pressure and GPS data for fleet tracking, diagnostics and over-the-air updates.'],
            ['⚡ Smart grid', 'Smart meters report usage every few minutes. The grid balances supply, demand and solar input automatically.']
        ].map(([t, p]) => h('div', { class: 'info-card' }, h('h4', {}, t), h('p', {}, p)))),
        note('Cloud computing gives IoT devices storage and processing they could never hold themselves: years of sensor history, machine-learning predictions and dashboards you can open from anywhere.'));
}

export function render(page, { tab }) {
    return pageTabs(page, 'arduino', [
        { id: 'signals', label: 'Analog vs digital', render: signals },
        { id: 'board', label: 'Arduino Uno', render: board },
        { id: 'pwm', label: 'PWM', render: pwm },
        { id: 'sensors', label: 'Sensors', render: sensors },
        { id: 'embedded', label: 'Embedded systems & IoT', render: embedded }
    ], tab);
}
