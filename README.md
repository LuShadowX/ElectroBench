# ElectroBench

An interactive workbench for basic electrical and electronics engineering. Every page is a working model: change a resistor and the mesh currents change, move the supply and the diode curve fills in, click a switch and a gate-level flip-flop toggles. The lab experiments have a virtual bench with instruments, and the readings you take fill in the observation tables of a printable lab record.

**Live:** https://lushadowx.github.io/ElectroBench/
**Project report (PDF):** [docs/ElectroBench_Report.pdf](docs/ElectroBench_Report.pdf)

Built with plain HTML, CSS and JavaScript (ES modules). No frameworks, no build step, no server.

## What's inside

| Section | Pages |
|---|---|
| **Electrical circuits** | DC circuits and theorems (Ohm, KCL/KVL, dividers, series–parallel, star–delta, mesh and nodal, Thevenin, Norton, superposition, max power) · AC circuits (RMS, phasors, RL/RC/RLC, resonance, power factor, three-phase) · Electrical machines (transformer, DC motor, induction motor, Fleming's rules) |
| **Electronic devices** | Semiconductors and diodes (doping, PN junction, V-I curve, Zener, varactor, rectifiers, testing) · BJT and MOSFET · Op-amps and filters (amplifiers, adder, subtractor, integrator, differentiator, filters, comparator and ABS) |
| **Embedded systems** | Arduino Uno pinout, analog vs digital, PWM, HC-SR04, DHT11/22, LDR, IR, microprocessor vs microcontroller, IoT |
| **Digital electronics** | Number systems and codes · Logic gates, Boolean laws and a K-map solver that builds the circuit · Adders, subtractors, MUX/DEMUX, decoder/encoder, comparators · Latches and flip-flops with gate delays and race-around · Shift registers and counters |
| **Lab (7 experiments)** | Components and instruments (colour code, breadboard, DMM, CRO) · KVL · Diode V-I · Universal gates (7400/7402) · Adders (7486/7408/7432) · JK flip-flop from NAND (7400 + 7410) · Arduino projects |

Each experiment has four tabs: aim and theory, virtual bench, observations and result, and viva questions. The **Lab record** page collects all of them into one printable file.

The **Course map** links every syllabus topic of ECE249, ECE279 and ECE131 to the page and tab that covers it.

## Run it locally

ES modules need to be served over HTTP, not opened from `file://`:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Progress and lab readings are saved in your browser (localStorage).

## How it is built

```
index.html
css/
  style.css         layout and shared components
  pages.css         circuit drawings, plots, instruments, lab pages
js/
  main.js           sidebar, router (#/page/tab), page loading
  core/
    logic.js        gate-level simulator with unit gate delays, expression parser, Quine–McCluskey
    schematic.js    draws any netlist as a schematic with live wire colours
    plot.js         SVG plots (linear and log axes, markers, hover readout)
    draw.js         circuit symbols: resistor, source, diode, capacitor, inductor, op-amp
    ic.js           14-pin DIP pinouts for the TTL chips used in the lab
    lab.js          shared experiment layout and saved observations
    page.js, ui.js, store.js
  pages/            one module per page, loaded when opened
docs/               project report and screenshots
```
