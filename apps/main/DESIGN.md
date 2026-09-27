---
name: Darb Main
description: Darb's public company surface, built as one route walked through doorways, in Arabic, Hebrew, and English.
colors:
  night: "#051711"
  forest-black: "#061a14"
  forest-deep: "#09291f"
  forest: "#123c2e"
  gold: "#daa64d"
  gold-bright: "#e9bd69"
  gold-soft: "#f2e3bd"
  gold-ink: "#6d4c17"
  gold-deep: "#8c6119"
  ivory: "#fffdf6"
  canvas: "#f2f0e9"
  ink: "#10241c"
  muted: "#56615b"
  on-dark-muted: "rgb(255 253 246 / 72%)"
  on-dark-faint: "rgb(255 253 246 / 56%)"
  line-dark: "rgb(255 253 246 / 14%)"
  line-light: "rgb(16 36 28 / 14%)"
typography:
  display:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "clamp(3rem, 1.2rem + 5.2vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "clamp(2.1rem, 1.1rem + 3.3vw, 4.4rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  voice:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "clamp(2.2rem, 0.9rem + 5.2vw, 6rem)"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "clamp(1.1rem, 1rem + 0.4vw, 1.35rem)"
    fontWeight: 600
    lineHeight: 1.3
  lead:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "clamp(1.02rem, 0.95rem + 0.25vw, 1.15rem)"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Ubuntu, Cairo, Heebo, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  plate: "2px"
  stone: "1px"
spacing:
  header: "4.5rem"
  rail-inset: "clamp(1.75rem, 4vw, 4rem)"
  gutter: "max(1.25rem, calc((100% - 80rem) / 2))"
  shell: "min(calc(100% - 2.5rem), 80rem)"
  section: "clamp(5rem, 9vw, 8rem)"
  target: "2.75rem"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-black}"
    rounded: "{rounded.plate}"
    padding: "0.7rem 1.35rem"
    height: "3rem"
  button-gold-hover:
    backgroundColor: "{colors.gold-bright}"
  button-line:
    backgroundColor: "rgb(5 23 17 / 35%)"
    textColor: "{colors.ivory}"
    rounded: "{rounded.plate}"
    padding: "0.7rem 1.35rem"
    height: "3rem"
  button-line-hover:
    backgroundColor: "rgb(5 23 17 / 65%)"
  button-compact:
    padding: "0.7rem 1rem"
    height: "2.75rem"
  plaque-open:
    backgroundColor: "{colors.forest-deep}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.plate}"
    padding: "clamp(1.25rem, 2vw, 1.75rem)"
  plaque-future:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "clamp(1.25rem, 2vw, 1.75rem)"
  stone:
    backgroundColor: "#f1ece1"
    textColor: "{colors.ink}"
    rounded: "{rounded.stone}"
    padding: "clamp(1.1rem, 2vw, 1.6rem)"
  directory-link:
    textColor: "{colors.ivory}"
    height: "4.25rem"
  locale-link:
    textColor: "{colors.on-dark-faint}"
    width: "2.75rem"
    height: "2.75rem"
---

# Design System: Darb Main

## Overview

**Creative North Star: "The Signed Route"**

The public site is one route walked from a doorway to an arrival, signed like a trilingual Israeli wayfinding system. Forest grounds are places you enter; ivory and canvas grounds are the route between them. A single 1px gold rail runs down the inline-start gutter, and every change of ground is marked by a gold diamond waypoint on that rail. Gold is light (the far end of the corridor, the glow on a lit plaque, an open doorway) and the route itself; it is also the one primary action.

Components are architectural rather than app-like: square plates with 2px corners, wayfinding plaques that carry a direction arrow and the product name in all three scripts, hairline rails, a bonded stone course for the shared foundation, and doorway elevations drawn at plan scale. The first viewport is a Three.js corridor of receding doorway frames with light at the far end; its pre-rendered poster is the complete design and the live scene is an enhancement. The approved Darb mark appears only through `@darb/ui` (`DarbBrandLockup`); the corridor frames and foundation doorways are architecture, never the mark.

Density is low and deliberate: sections breathe on clamped padding, headings are large and tight, and meaning never depends on canvas, script, or animation.

**Key Characteristics:**

- Ground grammar: forest = place, ivory/canvas = route, gold waypoint at each change.
- One continuous gold rail on the inline-start edge, drawn in as it enters view.
- Square plates (2px), hairlines, soft deep shadows; no pills, no rounded cards.
- Type chosen by rendered script (Cairo, Heebo, Ubuntu), never by page locale.
- Direction is structural: arrows, rails, veils, and branches follow RTL; the doorway never mirrors.

## Colors

A night-forest and warm-ivory palette with one restrained gold that behaves as light.

### Primary

- **Lamplight Gold** (gold): the route rail, waypoints, junction branch that is open, focus rings on dark grounds, active states, the H1 accent line, and the fill of the primary action. Never a large surface.
- **Lit Gold** (gold-bright): hover state of the gold button only.
- **Parchment Gold** (gold-soft): status and industry text on forest plaques, active layer titles, hover borders on outlined controls, text selection.
- **Engraved Gold** (gold-ink) and **Burnished Gold** (gold-deep): gold that must read on light grounds. Engraved Gold for plaque industry lines and the lit foundation doorway stroke; Burnished Gold for the accent line and arrows in the three-voices passage.

### Secondary

- **Night** (night): the threshold ground, the WebGL clear color, and the fog.
- **Forest Black** (forest-black): the arrival, footer, directory panel, root background, and the text color on gold.
- **Deep Forest** (forest-deep): places (the Restaurant room) and the open plaque.
- **Forest** (forest): the foundation course's top edge, focus rings on light grounds, the principle line in the story.

### Neutral

- **Warm Ivory** (ivory): route ground and all primary text on dark grounds.
- **Warm Canvas** (canvas): the foundation ground and sealed (future) plaques.
- **Ink** (ink): primary text on light grounds.
- **Muted Sage** (muted): secondary text on light grounds.
- **Ivory 72 / Ivory 56** (on-dark-muted, on-dark-faint): secondary and tertiary text on forest.
- **Hairline Dark / Hairline Light** (line-dark, line-light): 1px dividers on forest and on ivory respectively.

### Named Rules

**The Ground Grammar Rule.** Forest is a place, ivory or canvas is the route. A new section chooses its ground by what it is, and each change of ground gets a gold waypoint on the rail.

**The Gold Is Light Rule.** Gold appears as a line, a glow, a waypoint, an active mark, or the single primary action per group. It never fills a section, a card, or decorative shapes.

## Typography

**Arabic:** Cairo. **Hebrew:** Heebo. **Latin:** Ubuntu. All loaded through `next/font/google` with `display: swap`.

**Character:** One family per script, one voice. Headings are set large and tight in Latin, with script-specific line height and tracking so Arabic and Hebrew never inherit Latin's negative tracking.

### Hierarchy

- **Display** (500, clamp to 6rem, 0.98, -0.04em): the threshold H1 only, two lines, the second line in gold. Arabic 600 / 1.22 / 0; Hebrew 1.05 / -0.02em. Below 48rem: clamp(2.4rem, 1.2rem + 7vw, 3.4rem).
- **Headline** (500, clamp to 4.4rem, 1.04, -0.035em): section H2s on route, place, and arrival. Arabic 600 / 1.3 / 0; Hebrew 1.12 / -0.015em.
- **Voice** (500, clamp to 6rem, 1.1): the three-voices statement, each line in its own script and direction. Arabic 600 / 1.35; English -0.04em.
- **Title** (600, up to 1.35rem, 1.3): layer titles and stone headings (1.15rem). Plaque product names run larger (up to 2.35rem, open plaque up to 3.25rem, 500, -0.02em).
- **Lead** (400, up to 1.15rem): section introductions, max 40 to 48rem.
- **Body** (400, 1.0625rem, 1.65; Arabic documents 1.8): running text; descriptions on plaques and layers at 0.97rem / 1.6.
- **Label** (600 to 700, 0.82 to 0.95rem): buttons (0.95rem / 700), plaque status, locale links, footer column heads (0.85rem). Sentence case, no uppercase tracking.

### Named Rules

**The Script, Not Locale Rule.** Font follows the glyphs. The base stack is Ubuntu, Cairo, Heebo; any element whose language differs from the page carries `lang` (and `dir`), which selects its script family.

**The Script Tuning Rule.** Every heading that sets negative Latin tracking must reset tracking to 0 (Arabic) or reduce it (Hebrew) and raise line height for Arabic.

## Layout

The shell is `min(100% - 2.5rem, 80rem)`; the gutter is the distance from viewport edge to shell and is where the rail lives. Railed content shifts inward by the rail inset so text never touches the rail. Sections use clamped vertical padding (5 to 8rem; the Restaurant room 6 to 10rem). The header is a fixed 72px bar at up to 88rem wide.

- **Threshold:** content at the inline-start gutter, max 40rem; the corridor's vanishing point sits at 67% (LTR) or 33% (RTL). The section is 150svh with a sticky stage under no-preference motion, 100svh otherwise. On phones and portrait tablets (below 48rem, or below 64rem in portrait) the corridor centres, content drops to the bottom, and the veil turns vertical.
- **Story:** 12-column grid, heading 7 columns, body 5 columns aligned to the end.
- **Junction:** four plaques in a `1.6fr 1fr 1fr 1fr` row under an SVG of one trunk branching into four paths. Below 64rem the branches hide, the open plaque spans the row, the gold rail moves to the plaques' inline-start border, and each plaque gets a short spur off the rail. Below 48rem, one column.
- **Foundation:** four doorway elevations aligned to the same `1.6fr 1fr 1fr 1fr` columns stand on a 12-column running-bond stone course (5/3/4 over 2/5/5). Below 48rem, one column with alternating 10% offsets so the bond still reads.
- **Arrival:** 5/7 split of the approved portrait hero (4:5, 4:3 on phones) and the closing actions.
- Breakpoints: 74.99rem (header nav collapses to the directory), 63.99rem, 47.99rem (buttons go full width). Touch targets are at least 2.75rem.

## Elevation & Depth

Depth comes from ground changes and light, with a small set of soft, deep, low-opacity shadows under the few objects that stand off the ground. No hard offset shadows.

### Shadow Vocabulary

- **Plate** (`box-shadow: 0 1.5rem 3.5rem -1.5rem rgb(2 14 10 / 55%)`): the open plaque and the arrival photograph.
- **Plate lifted** (`box-shadow: 0 2rem 4rem -1.5rem rgb(2 14 10 / 62%)`): open plaque on hover, with a 3px rise.
- **Layer plane** (`box-shadow: 0 1.25rem 2.5rem -1rem rgb(1 10 7 / 70%)`): each plane in the Restaurant layer stack.
- **Stone bevel** (`inset 0 1px 0 rgb(255 255 255 / 70%), inset 0 -2px 0 rgb(16 36 28 / 7%)`): foundation stones.

### Named Rules

**The Light Through An Opening Rule.** Glows are radial gradients of gold at 12 to 30% opacity placed where an opening would admit light (top of the Restaurant room, top of the open plaque, the corridor's far end). They are never ambient decoration.

## Shapes

Square plates with a 2px radius on buttons, plaques, the menu button, the arrival figure, and layer planes; stones use 1px. The recurring forms are the 1px rail, the 9px diamond waypoint (a square rotated 45deg), the same diamond as the layer-list marker, and the doorway elevation (a jambed opening with a sloped head, drawn from one fixed path). The only round form is the open plaque's status lamp. Places enter through an arched `clip-path` that opens to a full rectangle.

## Components

### Buttons

Square, weighted, confident.

- **Shape:** 2px plate, min height 3rem (2.75rem compact).
- **Gold (primary):** gold fill, forest-black text, 700 weight, optional direction arrow after the label. Hover lightens to Lit Gold; active presses down 1px.
- **Line (secondary):** 1px ivory border at 38%, translucent night fill; hover shifts the border to Parchment Gold and deepens the fill. Used beside the gold button on dark grounds.
- **Focus:** 2px gold outline at 3px offset (forest on route and foundation grounds).
- Colour, background, and border transitions are 180ms. Below 48rem buttons are full width.

### Wayfinding Plaques

The junction's destinations, signed in three scripts.

- **Open plaque:** a link on Deep Forest with a top gold glow and the Plate shadow. Stack: product name in all three scripts (page locale large and first in reading weight, the other two faint and `aria-hidden`), industry line in Parchment Gold, description, then a hairline foot with a status lamp and a gold "visit" action with a direction arrow. Hover lifts 3px.
- **Sealed plaque:** not a link. Canvas ground, 1px dashed ink border at 30%, muted text, Engraved Gold industry line, "coming soon" status in muted text. Its junction branch is a dashed ink line, never gold.

### Stone Course

The foundation's shared capabilities as a bonded course: 6px mortar joints in a warm grey bed (`--stone-joint`, `#d6cebd`), a 3px Forest top edge, stones in a vertical gradient from `--stone-face` (`#f1ece1`) to `--stone-face-low` (`#e9e3d6`) with the Stone bevel, each holding a title and short description. The gold rail turns along the bed and enters the lit Restaurant doorway above it.

### Layer Explorer

The Restaurant room's anatomy. An isometric stack of planes (rotateX 58deg, rotateZ -38deg; +38deg in RTL) beside an ordered list of layer buttons (`aria-pressed`). Activating a layer by click, focus, or mouse hover lifts its plane, turns its border and schematic gold, and fades planes above it to 55%. The list uses hairline rows, a diamond marker that fills gold when active, and Parchment Gold titles when active. Plane transforms run 520ms on the out curve. The stage is `aria-hidden`; the list carries the meaning. Below 64rem the stage sits above the list.

### Navigation

- **Header:** fixed, 72px, night at 86% with a 14px blur and a hairline bottom edge. Under scroll-driven animation it starts transparent and settles over the first 28vh. Links are muted ivory at 0.9rem / 500, turning ivory on hover with a 1px gold underline that draws from the inline start. Locale links are 2.75rem squares; the current locale is ivory with a 2px gold underline.
- **Directory:** below 75rem, a modal `<dialog>` panel up to 30rem wide on Forest Black, anchored to the inline end. It opens with a `clip-path` wipe from the inline end (420ms), and its rows arrive with a 40ms stagger. Rows are 4.25rem tall, large type (up to 2rem), hairline dividers, and a gold direction arrow. Locale links and a full-width gold and line button pair sit at the foot. Closing returns focus to the menu button.

### Threshold Corridor

Eight doorway frames (six on compact) in extruded forest with a gold reveal, receding along a night floor with a gold route strip down the centre, exponential fog, and a warm light at the far end. Scrolling dollies the camera through the first frame; pointer adds slight parallax. The live scene loads only after idle, with hardware WebGL, hover and fine pointer, no reduced motion, no data saver, and at least 4GB device memory. Otherwise the AVIF/WebP poster (wide LTR, wide RTL, and tall frames) is the design, with a compositor-only scale and brightness dolly on scroll. The canvas fades in over 900ms once ready and hands back to the poster on context loss. All media is `aria-hidden`.

### Motion

One easing, `cubic-bezier(0.16, 1, 0.3, 1)`. Operational transitions 160 to 260ms; spatial moves 420 to 520ms. Scroll-linked effects (rail draw, branch draw, place opening, header settle, poster dolly) use CSS scroll and view timelines inside `@supports (animation-timeline: ...)` and `prefers-reduced-motion: no-preference`; without either, every element renders in its final static state. Under reduced motion all durations collapse to 0.01ms and smooth scrolling is off.

## Do's and Don'ts

### Do:

- **Do** mark every change of ground with a gold diamond waypoint on the inline-start rail, and keep the rail one continuous 1px line.
- **Do** render the Darb mark only through `@darb/ui` (`DarbBrandLockup`, `DarbMark`); draw doorways as architecture with the shared elevation path.
- **Do** set any foreign-script run with `lang` and `dir` so it picks Cairo, Heebo, or Ubuntu by script.
- **Do** mirror arrows (`scaleX(-1)` in RTL), route diagrams, veils, and the vanishing point for RTL; render RTL corridor posters from the camera, not by flipping images.
- **Do** ship a static final state for every scroll-driven effect and a poster for every canvas.
- **Do** keep sealed destinations as non-links in canvas with dashed borders and muted text.

### Don't:

- **Don't** mirror the doorway: not the corridor frames, the poster, the foundation elevations, or the arrival photograph.
- **Don't** use pills, large radii, or rounded cards; plates are 2px and the status lamp is the only circle.
- **Don't** fill surfaces with gold or use it as decoration; it is light, route, active state, or the primary action.
- **Don't** apply Latin negative tracking to Arabic or Hebrew headings.
- **Don't** place small label lines or kickers above headings; headings open their section directly.
- **Don't** use hard offset shadows or glyph characters as icons; icons come from `@darb/icons`.
