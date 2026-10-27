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
  artifact: "14px"
  header: "18px"
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

The wordmark is ches.dev on the homepage, engineering notes, and CPU walkthrough. A compact introduction and four-link work index lead to four continuous project chapters. The project index is anchor navigation, not a selector hiding other work. Descriptions and artifacts share a consistent grid; individual artifacts are author-supplied app screenshots, an order workflow, a command registry, and a CPU explanation. Full-width chapter bands alternate the base and --section-bg surfaces, separated by visible seams and open gutters. Minor projects form six smaller native disclosures. About and contact finish the page. Three short static engineering-note routes share the same shell; /cpu/ preserves the detailed physical walkthrough. Mobile keeps the desktop design intact while stacking content in document flow: a two-column navigation has 44px targets, and the Printed request/review panels stack below 480px. No scroll-jacking, forced full-height sections, or horizontal-only actions.

## Elevation & Depth

Use restrained glass-inspired chrome: a fine highlight, a translucent tint, and a shallow static shadow. Only the bounded navigation header may use backdrop blur (10px); artifact panels never use live blur. The header supports touch and desktop layouts, including iOS Safari with prefixed backdrop-filter. static/appearance.js enables glass when supported unless reduced motion/transparency, forced colors, data saving, or known very limited hardware (at most 2GB RAM or two logical cores) calls for the solid fallback. Missing hardware hints do not exclude Safari. Brief frame sampling during scroll disables blur for the rest of the page visit after sustained slow rendering; it stops when idle or hidden. No benchmark or permanent render loop runs. Disabled JavaScript and unsupported CSS use the solid header. No full-screen filters, animated refraction, or permanent GPU-layer promotion. Static surfaces keep the same contrast and geometry. A small shadow also belongs to authentic app captures. BadAvo screenshots keep their full aspect ratio with 18px CSS corners; desktop displays up to 460px tall, and phone layouts stack the image above its controls. Do not generate project visuals or reconstruct fake product screens. No glows, magnetic controls, custom cursors, or decorative parallax.

## Shapes

5px control, 14px artifact, and 18px desktop header corners. The favicon uses a crisp vector c-and-dot mark, with a matching 64px PNG fallback. A filled Explore the CPU in 3D link and a short destination description make the separate /cpu/ route explicit. The Printed view selector uses a 12px outer and 8px inner radius. Open text remains unboxed. Dividers encode section and workflow boundaries.

## Components

static/index.css owns content layout and shared controls; static/index.js progressively enhances the homepage. All essential content and links work without JavaScript. Demo controls remain disabled until handlers are installed. Printed loads the original published project at https://ches.dev/3D-Printing-Order-Management/index.html?embed=1 inside a sandboxed iframe. No local storefront copy or replacement form logic is maintained in this repository. Touch devices start with the iframe inert and pointer events passing to the portfolio, so swipes continue down the page. Use Printed explicitly enables frame interaction; Resume page scrolling, a touch outside the frame, or leaving the viewport restores scroll-through behavior. Desktop pointer interaction remains immediate. Native Storefront / Order workflow buttons switch the preview without reloading the storefront iframe or discarding its in-memory form state. At tablet/desktop widths a shared CSS grid row reserves both panel sizes, so switching cannot move the next chapter; the inactive panel is visibility-hidden and inaccessible. Phones retain natural panel height. The workflow panel explains HTML/Bootstrap inputs, JavaScript conditional fields, Python/Flask validation, and parameterized MySQL storage. Admin approval is not part of Colin’s presented workflow. The original project owns embed mode: it skips the initial dialog, preserves the original customer fields, keeps navigation within the frame, and disables its particle loop. Submission gives inline archive status without sending orders or payments. Original visual styling and assets remain project-owned. JB-X demonstrates verified command help and aliases without third-party API requests. CPU uses the compact recorded program at addresses 1,2,3, preserving A58B/3C4B/48C1. Registers begin unknown until written; playback finishes after ADD without implying hardware HALT. Pause when offscreen or hidden. Keep full model/recording on /cpu/; do not rewrite hardware source data. Native details provide keyboard-operable minor-project disclosure. Clipboard failure has inline recovery. The system pointer, visible focus, 44px controls, semantic statuses, natural scrolling, and reduced-motion behavior apply throughout.

## Do's and Don'ts

- Preserve all four featured projects and six smaller projects, original destinations, and maturity distinctions.
- Use real captures, measured data, source-linked explanations, and honest local demo labels.
- Do not invent accuracy, speed, adoption, current market values, or personal engineering decisions.
- Keep light/dark content and geometry identical and image colors authentic.
- Verify 320px, phone, tablet, desktop, text zoom, no-JavaScript, and reduced motion.
- Maintain technical notes as short editable HTML, with no generated filler or unfinished public placeholders.

## Live services

The homepage adds a compact Live services section between Other projects and About. It reports only services returned by the public Service Status API; no featured-project availability is inferred from Minecraft or unrelated services. Web and Minecraft groups use two columns on desktop and one on phones. Additional categories appear automatically. Rows use labeled static dots, names and check times, with safe public links when supplied. Runtime status tokens belong to static/theme.css: --status-online (#167047 light / #7bd5aa dark) and --status-warning (#85520a light / #efbd70 dark). Offline, unknown and last-known values use the existing muted token.

static/services.js owns read-only fetching and rendering. Poll every 30 seconds only while the section and tab are visible, never less than 10 seconds apart, with one request at a time and an eight-second timeout. Rows are keyed by API id and sorted by category/name, independent of response order. Respect stale even on HTTP 200. Errors retain last-known values with an outdated notice; no data means Status unavailable. A snapshot older than 60 seconds is marked outdated when revisited. Unrecognized states are Unknown and inactive. Status changes use one polite message; routine timestamps do not announce repeatedly. No authentication, persistent cache, animation or backend changes.
