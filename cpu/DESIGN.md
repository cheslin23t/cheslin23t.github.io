---
version: alpha
colors:
  background: "#061021"
  surface: "#0b1a2c"
  text: "#f3f7fb"
  muted: "#a8b9cb"
  border: "#294257"
  primary: "#67dce8"
  result: "#ef886f"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  control: "5px"
  console: "9px"
spacing:
  gutter: "6vw"
components:
  cpuViewer:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
---

# ches.dev design context

## Overview

The existing portfolio uses midnight navy, cyan highlights, system sans typography, and glass panels. Its source remains unchanged. `/cpu/` is a separate, unlinked brand story for the physical Minecraft redstone CPU. Reference: the pacing of a product launch, grounded in the actual exported build rather than an invented processor render. The memorable element is the real schematic moving through a guided tour.

## Colors

The CPU page's runtime token owner is `cpu/cpu.css` `:root`; the frontmatter records its mapping. `--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--warm` correspond in order to background, surface, text, muted, border, primary, result. Physical wool colors derive from Minecraft block-state color names in `build-viewer.js`; scene lighting shades them. Cyan is a temporary explanatory highlight, not simulated redstone power. The overview retains all original wool color identities.

## Typography

System sans avoids network font dependencies and layout shifts. Large, closely tracked headings carry the story. Monospace identifies code, binary values, addresses, and viewer captions. Body text uses normal tracking and generous line height.

## Layout

Desktop pairs long narrative chapters with a sticky physical model. Phone layouts place a compact model above the naturally scrolling chapter. The page is English. It is not linked from the homepage and has noindex metadata; this is discoverability control, not access control.

## Elevation & Depth

The model's actual geometry provides depth. Do not invent CPU internals, decorative circuit traces, or unsupported hardware claims. Console borders separate interactive demo state from physical model state.

## Shapes

Restrained 5px control corners and a 9px demo console. No default card grids. Diagram highlight boxes are inclusive, approximate framing regions, never certified wire ownership.

## Components

The physical viewer uses exact schematic positions and simplified block geometry. Mouse dragging rotates; focused wheel zoom and keyboard arrows/+/- provide direct control. Escape releases focus so page scrolling remains available. Restore returns to the current chapter view. Motion follows document scrolling without scroll-jacking; reduced motion removes camera easing. The addition console is separate host-side explanatory state and preserves the exact words, NOPs, alias addresses, and PC wrap. Unknown registers display `?` until written. Restart resets only the viewer demo, not the hardware.

## Do's and Don'ts

Keep module landmarks traceable to `cpu/data/landmarks.json` and the user-provided coordinate formulas. Highlight confirmed repeaters; frame approximate principal module regions. Preserve R15's physical presence while documenting its faulty reads. Keep the original saved ROM in the physical scene distinct from the addition demo. The page must work without remote assets; provide a schematic-derived static fallback when WebGL fails. Do not add a homepage link until requested.
