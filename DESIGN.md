---
version: alpha
colors:
  primary: "#e2c98a"
  ink: "#020617"
  surface: "#0b1530"
  white: "#f8fafc"
  muted: "#94a3b8"
  gold: "#e2c98a"
  gold-deep: "#c6a15b"
  cyan: "#22d3ee"
  violet: "#a855f7"
typography:
  sans:
    fontFamily: "Manrope, system-ui, sans-serif"
rounded:
  button: "10px"
  panel: "22px"
omitted:
  - section: spacing
    reason: "Responsive spacing is owned by static/index.css using clamp and --pad."
  - section: components
    reason: "Shared CSS classes own this single-page portfolio's component styles."
---

## Overview

Colin Heslin's personal portfolio helps collaborators explore his software and contact him. Preserve the black-and-gold CH monogram as the signature, with expressive project scenes and readable first-person writing. The user wants rich animation, optimized rather than removed.

## Colors

Runtime ownership: `static/index.css` :root variables are authoritative and map directly to the color names above (--ink, --surface, --white, --muted, --gold, --gold-deep, --cyan, --violet). `primary` is the documented alias for --gold. No generated token adapter. Gold connects the hero headline and primary action to the logo; cyan and violet remain the project and technical accents. Muted text must remain readable against navy.

## Typography

Manrope is the established display and body family; system-ui is its fallback. Large tightly tracked headings have explicit line breaks and sufficient descender clearance. Small uppercase text is reserved for navigation and metadata. Do not use generic claims or invent project metrics.

## Layout

A two-column hero leads into interests, three projects, About, and Contact. Alternating projects give the wider column to the visual. Below 1000px, projects stack in reading order. Mobile retains every navigation destination and places the hero mark below the copy rather than over it. Use natural content height rather than clipping copy into a viewport.

## Elevation & Depth

The gold logo floats and tilts; product scenes respond to hover and keyboard focus. Keep depth local to these visuals. Avoid full-screen blurs and layout-driven animation. Batch pointer writes through requestAnimationFrame and cache entry geometry.

## Shapes

Buttons use 10px corners; project panels use 22px desktop / 16px mobile corners. Circular arrows identify project links. Preserve the existing monogram asset.

## Components

`index.html` owns semantic structure. `static/index.css` owns shared buttons, project frames, navigation and focus styles. `static/index.js` progressively enhances reveal, progress and pointer behavior. Links retain native navigation; a skip link enters the main content. Decorative logo art is hidden from assistive technology. Content remains visible without JavaScript. Custom cursor activation requires a fine hover-capable pointer, a viewport over 640px, no forced colors and no reduced-motion preference. Changing any of these restores the native pointer.

## Do's and Don'ts

- Keep motion, keyboard focus, mobile navigation, and reduced-motion behavior consistent.
- Verify 320px, 390px, tablet and desktop widths, including resize and no-JavaScript states.
- Do not hide meaningful text behind JavaScript initialization or expose fake preview controls as working controls.
- Do not add ornamental section numbering that implies a nonexistent sequence.
- Keep project descriptions grounded in Colin's supplied history.
