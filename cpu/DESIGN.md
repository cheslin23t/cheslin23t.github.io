---
version: alpha
colors:
  background: "#f5f7f8"
  surface: "#ffffff"
  stage: "#e8edf0"
  text: "#202c37"
  muted: "#536372"
  border: "#cad4dc"
  primary: "#1769a0"
  active: "#e0edf5"
  thumb: "#91a0ac"
  thumbHover: "#637887"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
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

Ownership model B: `cpu/cpu.css` is canonical; this file mirrors it. The light
frontmatter maps background/surface/stage/text/muted/border/primary/active/thumb/
thumbHover to --bg/--surface/--stage/--ink/--muted/--line/--accent/--active/--thumb/
--thumb-hover. Components consume these semantic variables.

`prefers-color-scheme: dark` automatically maps the same roles to #171c22,
#20272e, #222c35, #e7edf2, #b3c1cc, #3d4b58, #82c4ec, #2e4555, #637887,
and #93a8b7 respectively. No saved theme override or startup flash. Both themes
retain identical hierarchy, geometry, and controls. Forced colors keeps native
controls and scrollbars usable.

Minecraft wool colors come from the schematic palette with face shading.
Redstone dust is red physical geometry, connected according to its north/east/
south/west block properties, including up connections. Only measured probes
receive bright orange / gray overlays. Blue marks explanatory locations; it is
not electrical power. Text labels supplement signal colors.

## Typography

System sans carries the project name and readable 15–16px body text. Moderate
weight and tight tracking identify headings without a marketing voice. Monospace
is for words, bit fields, assembly, coordinates, and electrical readings. Labels
name real hardware, not decorative categories. Scene counts represent the actual
reading sequence. No remote fonts or font swaps.

## Layout

Desktop uses a broad sticky model beside naturally scrolling sections. There is
no scene player, carousel, next button, timed slideshow, or scroll hijacking.
Header anchors jump to ROM, registers, ALU, and instructions. Normal wheel input
over the model scrolls the document; only Ctrl/Meta+wheel zooms.

Mobile stacks a compact sticky model above the reading area. The model is capped
at 46svh; chapter anchor offsets account for it once, without doubling CSS
scroll-padding and scroll-margin. Text keeps enough screen space to be read.
The instruction reference follows the walkthrough, then a quiet disclosure for
source files and hardware limitations. The homepage remains unchanged.

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
