# CPU V2 physical walkthrough

Serve the repository root with `python3 -m http.server 8087`, then open `/cpu/`.
No package installation or remote runtime assets are required for the CPU tour.
The homepage now links here through a featured CPU section. Its instruction-level register demo uses this tour’s verified compact program
at addresses 1–3. The homepage explanation is accelerated and separate from
the physical recording; it does not execute redstone or imply a hardware HALT.
The route retains `noindex, nofollow`; it is linked, not access-controlled.

## What the page shows

The player moves from the complete build into a specific R1 input inverter, a
locked storage cell, the operation signs, and the measured ALU output. Seventeen sections follow normal document scrolling. The physical model stays
in view and follows the current section; no scene buttons are required. A separate recording scrubber
replays 870 actual game-tick samples; it is not a browser redstone simulator.

`data/recording.json` contains two controlled inverter captures, the compact ROM,
the per-tick trace, a 240-cell register snapshot, and three native-clock test results. Only measured probes use
orange (electrical 1) or gray (electrical 0); blue indicates a location highlight.
Probe overlays remain visible through intervening geometry. Other power states
are not animated or inferred. Repeater storage is electrically inverted.

## Physical source

`data/8bCPU-repaired-v1.schem` is the byte-for-byte physical export from
`cheslin23t/CPUV2-Compiler` commit `1851180869f97ff15ae081e659b1f57ea1209675`.
SHA-256: `7485daa252e126b7ca49d26235e1d47318c78b09fdf3d986da77560b7daac5c9`.

Regenerate browser geometry with the Python standard library:

```sh
python3 cpu/tools/export_schematic.py cpu/data/8bCPU-repaired-v1.schem cpu/data/build.json
```

The decoder asserts the source checksum, all palette references, 266,175 cells,
and 32,543 non-air blocks. `build.json` preserves source positions and states.
The renderer uses simplified block shapes and the source's Minecraft wool colors.
Dust geometry follows all saved side/up connection properties, including vertical
traces. `block-geometry.mjs` owns this shape generation.
It is not a textured Minecraft client. No wiring is invented.

For playback, the renderer replaces only the 1,024 documented ROM programming
cells with the tested three-instruction program. Addresses 1–3 contain A58B,
3C4B, and 48C1; address 0 and unused words are zero. The downloaded source
schematic and `build.json` retain their original saved ROM. The static overview
also depicts that original export, not the compact playback program.

Exact landmarks and approximate module frames are in `data/landmarks.json`.
The new circuit crops are in `build-viewer.js`. Coordinates below are local to
the repaired export; add world minimum `(256,72,-4)` to obtain lab coordinates.

| Landmark                                   | Local coordinate            |
| ------------------------------------------ | --------------------------- |
| R1 bit 0 input wire                        | `(60,22,43)`                |
| Supporting block                           | `(61,22,43)`                |
| East-facing inverter torch                 | `(62,22,43)`                |
| R1 bit 0 storage / adjacent input repeater | `(62,22,39)` / `(62,22,40)` |
| R3 bit 0 storage                           | `(66,22,39)`                |
| ADD / LDI signs                            | `(55,26,60)` / `(75,26,60)` |
| ALU bit i                                  | `(52,22+2i,18)`             |
| PC bit i                                   | `(41,7+2i,15)`              |

## Hardware capture, 2026-10-18

The local Java 1.21.7 Fabric lab used vanilla redstone behavior and the repaired
146-game-tick native clock. Tests used a fresh world snapshot, cleared registers
as explicit test setup, programmed the documented ROM cells, and recorded native
execution. After testing, the snapshot was restored and observable PC, ALU,
register, manual-control, tick-rate, and ROM state were checked against the
pre-test state. No hardware repairs were made for this website redesign.

Two settled manual captures selected `LDI R1,0` and `LDI R1,1`. The input wire
read power 0 / 15 respectively, and the _same_ torch read lit=true / false.
The memory example uses native trace tick 350: R1 storage is off and locked,
while its adjacent input repeater is on. R1 remains 165 while R2 receives 60.

The complete run was sampled every game tick at a target of 200 TPS. Playback
speed is relative to normal 20 TPS game time, not recording wall time. Repeaters
encode `(powered ? 1 : 0) + (locked ? 2 : 0)`; wires retain analog strength.
The browser never drops recorded transient values when seeking individual ticks.
Real-time playback can naturally skip display frames depending on screen refresh.

| Measurement                         | Game tick |
| ----------------------------------- | --------- |
| ADD instruction bus settles to 48C1 | 443       |
| ALU reaches 225                     | 497       |
| R3 reaches 225                      | 509       |
| Next PC advance                     | 569       |
| ALU is 0 while R3 still holds 225   | 650       |

The compact addition sequence passed at both 20 and 200 TPS in both register
banks. A six-consecutive-instruction LDI/LDI/ADD/SUB/AND/XOR program also passed
at 200 TPS: R3=225, R4=151, R5=36, R6=153. No interleaved NOPs were needed for
these sequences. This does not certify every program or source/destination
aliasing pattern. `data/HANDOFF.md` and `data/cpu.json` describe the older
conservative padded compiler policy; they are historical references, not the
current website playback program. `data/CPU_REPAIRS.md` documents the repair.

Known limits remain: faulty R15 reads, DEC, ROM fetch aliases 60→56 and 61→57;
branches and overflow are not certified here. PC reset does not clear registers.
There is no verified hardware HALT; the trace ending is only the end of playback.

## Controls and fallbacks

Document scrolling drives the walkthrough. Drag or use orbit/zoom sliders;
with the model focused, arrows rotate, +/- zoom, Home restores framing, and
Escape releases focus. Wheel input over the model zooms; scroll beside it to move the page.
Whole CPU preserves spatial context around the
selected circuit. Reduced motion removes camera easing; playback is user-started.
Changing sections or hiding the page pauses recording. Mobile keeps a compact
model above the text, capped at 46svh. Themes follow the device light/dark setting.
The optional register inspector covers every bit in both physical banks.

The schematic-derived PNG and static article remain available without WebGL.
A recording failure disables playback and reports the failure. The page also
provides a no-JavaScript overview. Run `node cpu/tools/verify.mjs` from the repository root to check dust connections,
all register coordinates, trace milestones, recorded gate states, and source integrity.

`data/build-overview.png` is the original
schematic overview; regenerate it if the physical source changes.

Torch meshes have separate wooden stems and red caps. Wall torches tilt away from
the support indicated by their saved facing. Static cap colors come from the
schematic; electrical overlays remain limited to recorded probes.

X-ray keeps the selected circuit opaque and renders the surrounding build as a
faint depth-tested silhouette, without hiding internal details behind it.
Replay camera following is optional and visits PC, ROM, decode, each written
register, and the ALU at recorded milestones. These are viewing intervals, not
an invented cycle-accurate simulation of unmeasured wires.

Replay defaults to 1× and X-ray. One short title and caption live inside the
model frame; the side column remains static apart from playback controls.
The model's numeric strip shows recorded values. Its compact flow indicator
illustrates the current transfer stage, not an inferred physical wire route.
Flow motion pauses with playback and respects reduced motion.
