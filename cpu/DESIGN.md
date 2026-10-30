---
version: alpha
colors:
  background: "#ffffff"
  surface: "#f2f5f5"
  stage: "#f2f5f5"
  text: "#202428"
  muted: "#58626b"
  border: "#cbd1d5"
  primary: "#006d77"
  active: "#dceced"
  thumb: "#58626b"
  thumbHover: "#006d77"
typography:
  sans:
    fontFamily: "Manrope, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  control: "4px"
  viewer: "6px"
spacing:
  gutter: "3.5vw"
---

# CPU V2 design context

## Overview

A portfolio walkthrough of Colin's actual Minecraft CPU for programming engineers.
The build is the visual identity. Open with the direct name “8-bit redstone CPU”;
no promotional tagline, generic logic lesson, repair narrative, or test-report
copy. Show the finished machine, its real circuit locations, and its behavior.
The signature is a single physical model that follows the reader down the page,
moving from the complete machine into small circuits as the prose reaches them.

## Colors

Shared color and font ownership is `static/theme.css`, loaded after the scoped
`cpu/cpu.css`. The root DESIGN.md defines the portfolio palette. CPU-specific
geometry, controls, camera regions, and measured signal semantics remain local.
The shared --stage/--thumb/--thumb-hover aliases follow the surface, muted, and
accent tokens. Device appearance selects both light and dark themes without
changing content or geometry. Forced colors preserves native controls.

Minecraft wool colors come from the schematic palette with face shading.
Redstone dust is red physical geometry, connected according to its north/east/
south/west block properties, including up connections. Measured dust and component tips receive orange / dark-red power colors;
wooden torch stems and repeater bases keep their material colors. Blue marks explanatory locations; it is
not electrical power. Text labels supplement signal colors.

## Typography

Locally hosted Manrope carries the project name and readable 15–16px body text. Moderate
weight and tight tracking identify headings without a marketing voice. Monospace
is for words, bit fields, assembly, coordinates, and electrical readings. Labels
name real hardware, not decorative categories. Scene counts represent the actual
reading sequence. No remote font requests.

## Layout

Desktop uses a broad sticky model beside naturally scrolling sections. There is
no scene player, carousel, next button, timed slideshow, or scroll hijacking.
Header anchors jump to ROM, registers, ALU, and instructions. Wheel input over the model zooms; scrolling beside it moves the document.

Mobile stacks a compact sticky model above the reading area. The model is capped
at 46svh; chapter anchor offsets account for it once, without doubling CSS
scroll-padding and scroll-margin. Text keeps enough screen space to be read.
The instruction reference follows the walkthrough, then a quiet disclosure for
source files and hardware limitations. The homepage links here from an equally weighted CPU project chapter.

## Elevation & Depth

Actual block positions provide depth. Use circuit cutaways to expose components;
Whole CPU restores context. Probe overlays may be drawn through occluders so the
selected state remains visible. Leader lines end at real component positions.
Module frames are approximate viewing regions, not certified netlists. Do not
invent internal ALU wiring, model an unverified branch, or use generated imagery
as hardware evidence.

## Shapes

Restrained corners, fine rules, and one model surface. Avoid a grid of generic
cards. Dense bit fields and assembly listings belong to this subject. Redstone
geometry must show connected traces, not colored square placeholders. Cutaways
must not leave false holes in exposed register and ALU support blocks.

## Components

Seventeen scroll positions cover the complete build, ROM, an encoded word, LDI,
register banks, two captures of one inverter, storage locking, all register cells,
ADD decoding, ALU controls/propagation/output, zero detection, writeback, PC,
and recorded execution. Camera transitions ease unless reduced motion is requested.
The inverter has a higher frontal angle showing both the wire and attached torch.
Changing sections restores the relevant camera; manual orbit and zoom remain
available within a section. Camera controls are disabled until geometry is ready.

The optional cell inspector reaches all 240 storage locations. Register, bit, bank,
and playback speed use native selects: OS popup appearance and standard keyboard
behavior are intentional. The final recording control is separate from the scroll
walkthrough. It plays only on request, pauses on section change or page hiding,
and supports exact tick seeking. The selected tick drives the measured readout
and physical result wires. No pretend synchronized CPU phases.

## Do's and Don'ts

Describe this CPU with concrete instructions, values, and physical mechanisms.
Keep test details and conservative compiler policies in the technical reference.
Do not emphasize absent NOP padding in the product copy. Distinguish storage from
input repeaters, and electrical levels from inverted logical encoding. Show the
mapped zero detector; put unresolved branch/overflow details in the disclosure.
Every visible instruction semantic and highlighted coordinate needs source
support. Preserve the downloadable source schematic. Provide a static model and
readable prose if WebGL or JavaScript is unavailable.

Torch meshes have separate wooden stems and red caps. Wall torches tilt away from
the support indicated by their saved facing. Static cap colors come from the
schematic; electrical overlays use the full per-tick component capture during replay.

X-ray keeps the selected circuit opaque and renders the surrounding build as a
faint depth-tested silhouette, without hiding internal details behind it.
Replay camera following is optional and visits PC, ROM, decode, each written
register, and the ALU at recorded milestones. These are viewing intervals, backed by the matching per-tick physical signal capture.

Replay defaults to 1× and X-ray. One short title and caption live inside the
model frame; the side column remains static apart from playback controls.
The model's numeric strip shows recorded values. Its compact flow indicator
illustrates the current transfer stage, not an inferred physical wire route.
Flow motion pauses with playback and respects reduced motion.

Controller replay uses the full decoder region for both LDI and ADD. Only the
opcode landmark changes; it must not crop away neighboring instruction columns.

Full physical replay uses `data/physical-signals.json`: 16,818 sampled positions,
including every dust wire, repeater, comparator, torch, and all ROM programming
positions. The 870-tick capture on 29 October 2026 matches every original PC,
instruction bus, ALU, and R1–R3 sample in both banks. 5,520 positions change.
Dust retains its 0–15 strength; powered components use 15 and off uses 0.
The file stores initial values plus per-tick index/value pairs, allowing exact
backward seeking. Empty ROM positions have no geometry. Within-tick updates
are not captured, and this recording is not a general-purpose CPU emulator.
The lab snapshot was restored and observable CPU state matched afterward.

The renderer uploads a compact spatial signal texture rather than scanning a
large uniform probe list per vertex. Repeater bases and torch stems remain
neutral; their tips and actual connecting dust carry the power colors.
No synthetic connecting paths or estimated propagation have been added.
