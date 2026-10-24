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
south/west block properties, including up connections. Only measured probes
receive bright orange / gray overlays. Blue marks explanatory locations; it is
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
Header anchors jump to ROM, registers, ALU, and instructions. Normal wheel input
over the model scrolls the document; only Ctrl/Meta+wheel zooms.

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
