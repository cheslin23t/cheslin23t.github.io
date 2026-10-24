---
version: alpha
colors:
  background: "#ffffff"
  surface: "#f2f5f5"
  text: "#202428"
  muted: "#58626b"
  border: "#cbd1d5"
  accent: "#006d77"
  primary: "#006d77"
typography:
  sans:
    fontFamily: "Manrope, system-ui, sans-serif"
  mono:
    fontFamily: "Plex Mono, ui-monospace, monospace"
rounded:
  control: "5px"
  artifact: "6px"
spacing:
  gutter: "4.3vw"
components:
  artifact:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  caption:
    textColor: "{colors.muted}"
  primaryButton:
    backgroundColor: "{colors.primary}"
  link:
    textColor: "{colors.accent}"
---

## Overview

Colin Heslin's portfolio presents inspectable software and systems to employers and technical reviewers. Precision comes from typography, proportion, authentic artifacts, and concise evidence. This replaces the navy/gold showcase and the rejected generated-image/project-selector explorations. All four featured projects have the same heading hierarchy and comparable presentation: BadAvo, Printed, JB-X, CPU V2. No project owns the hero. Copy is deliberately short so Colin can replace it with personal build notes.

## Colors

Runtime ownership is static/theme.css: --bg, --surface, --ink, --muted, --line, and --accent map to the frontmatter. Light appearance is white, cool silver, charcoal, and deep teal. System dark appearance uses #141619 / #1e2328 / #eff2f4 / #b2bbc2 / #4b5962 / #9dd6d8, respectively. --on-accent is white in light mode and carbon in dark mode. --active marks state selection. CSS prefers-color-scheme owns appearance, with no persistent override or startup script. Native controls receive color-scheme. The CPU route loads the same tokens after its scoped stylesheet; physical probe colors and recorded data retain their meaning.

## Typography

Manrope is locally hosted at weights 400–700; Plex Mono identifies addresses, commands, and technical metadata. Body text is normal tracking. Headings use deliberate tight tracking. Arrows are real SVG icons to avoid missing font glyphs. Font licenses and asset provenance live under static/assets.

## Layout

A compact introduction and four-link work index lead to four continuous project chapters. The project index is anchor navigation, not a selector hiding other work. Descriptions and artifacts share a consistent grid; individual artifacts are app screenshots, an order workflow, a command registry, and a CPU explanation. Minor projects form six smaller native disclosures. About and contact finish the page. Three short static engineering-note routes share the same shell; /cpu/ preserves the detailed physical walkthrough. Mobile stacks content in document flow. No scroll-jacking, forced full-height sections, or horizontal-only actions.

## Elevation & Depth

Keep surfaces flat and restrained. A small shadow belongs only to authentic app captures. Do not generate project visuals or reconstruct fake product screens. No glows, magnetic controls, custom cursors, or decorative parallax.

## Shapes

5px control and 6px artifact corners. Open text remains unboxed. Dividers encode section and workflow boundaries.

## Components

static/index.css owns content layout and shared controls; static/index.js progressively enhances the homepage. All essential content and links work without JavaScript. Demo controls remain disabled until handlers are installed. Printed is explicitly fictional, local workflow state. JB-X demonstrates verified command help and aliases without third-party API requests. CPU uses the compact recorded program at addresses 1,2,3, preserving A58B/3C4B/48C1. Registers begin unknown until written; playback finishes after ADD without implying hardware HALT. Pause when offscreen or hidden. Keep full model/recording on /cpu/; do not rewrite hardware source data. Native details provide keyboard-operable minor-project disclosure. Clipboard failure has inline recovery. The system pointer, visible focus, 44px controls, semantic statuses, natural scrolling, and reduced-motion behavior apply throughout.

## Do's and Don'ts

- Preserve all four featured projects and six smaller projects, original destinations, and maturity distinctions.
- Use real captures, measured data, source-linked explanations, and honest local demo labels.
- Do not invent accuracy, speed, adoption, current market values, or personal engineering decisions.
- Keep light/dark content and geometry identical and image colors authentic.
- Verify 320px, phone, tablet, desktop, text zoom, no-JavaScript, and reduced motion.
- Maintain technical notes as short editable HTML, with no generated filler or unfinished public placeholders.
