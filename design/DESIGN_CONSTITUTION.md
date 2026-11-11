# Grace Notes — Design Constitution

**Project:** Grace Notes — grounded church Q&A (AI for Church Hackathon 2026, Discipleship & Spiritual Growth track)
**Author:** M S Abhishek · **Date:** 12 Nov 2026 · **Version:** 1.0

## Personality & emotional tone
Quiet, reverent, unhurried. A chapel at dusk, not a dashboard. The product
speaks softly and refuses to bluff: when it does not know, it says so. Warmth
comes from language and light, never from decoration or noise.

## Target user & context
A church member, small-group leader or pastor, on a phone after a service or
at a desk preparing a sermon. They want a trustworthy verse for a real
pastoral moment — grief, forgiveness, anxiety — and they want to *check* the
answer against the text, not trust a black box.

## Central visual metaphor
**Light through a stained-glass window onto parchment.** The hero is a real
interactive window: ten coloured panes, one per topic. Light (gold) falls on
warm paper (parchment). Scripture is set in serif, like a printed Bible;
chrome and controls stay minimal so the text leads.

## Palette (semantic roles)
| Role | Colour | Use |
|---|---|---|
| Parchment `#f7f1e3` | page background | the paper everything sits on |
| Deep parchment `#efe6cf` | hover / secondary surfaces | |
| Ink `#241b12` | primary text, primary buttons | |
| Soft ink `#5b4c3a` | secondary text | |
| Gold `#a97e1f` / soft `#c99a3c` | accents, eyebrows, focus | candlelight; never a background wash |
| Ruby `#8e2f38` | emphasis, links, "not found" | the one strong accent |
| Rule `#d8c9a8` | borders, dividers | |
| Card `#fffdf6` | answer / passage cards | |
| Pane colours (10) | stained-glass topics | each topic owns one glass colour (see corpus.js TOPICS) |

## Typography
- Display / scripture: Iowan Old Style, Palatino, Georgia, serif — a printed-Bible voice.
- UI / body: system-ui stack — quiet, fast, no webfont download.
- Hierarchy: hero 2.3–3.6rem serif → section 1.7–2.4rem serif → passage text
  1.08rem serif → body 17px sans → meta 0.88–0.92rem.
- Verse text is always serif, quoted, with its reference set bold beside it.

## Layout & grid
Single page, max-width 1080px, generous vertical rhythm (52px sections).
Hero: two columns (copy left, window right) collapsing to one column under
820px. Sections numbered 01–04 in large gold serif numerals — an editorial,
chapter-like device. Passage explorer: responsive auto-fill card grid
(min 300px). No sidebar, no dashboard chrome.

## Navigation & IA
Sticky header: brand + 4 anchor links (Ask / Verse Explorer / Sermon Notes /
How grounding works) + low-motion toggle. Skip link first in tab order.
One page, four sections, in the order a visitor thinks: ask → browse →
prepare → understand.

## Components & interaction patterns
- Buttons: pill-shaped; primary is ink-on-parchment, ghost is outlined ink.
- Chips (samples, topics): pill toggles; active topic is filled ink.
- Answer card: gold left border; "not found" is ruby — the two states are
  visually distinct at a glance.
- Confidence badge: High (green), Medium (amber), Low / Not grounded (ruby).
- Copy verse: inline button, confirms "Copied ✓" for 1.8s.
- Every control gives immediate pressed/focus feedback; async work is
  instant (client-side) so no spinners are needed; errors are inline alerts.

## Motion language
- Scroll reveal + stagger (transform + opacity only, IntersectionObserver).
- Mask reveal (clip-path) on the hero headline; kinetic-type letter stagger
  on the word "Ask".
- Magnetic hover on topic chips (small translate toward the pointer).
- 3D tilt on the stained-glass frame (pointer-driven rotateX/rotateY, ≤7°).
- No continuous animation, no particles, no auto-playing motion.
- `prefers-reduced-motion` and the in-page low-motion toggle freeze all of it;
  every workflow remains fully usable with motion off.

## 3D concept
The stained-glass window is the 3D element: a perspective frame whose ten
panes sit at translateZ(18px) and lift to 30px on hover/focus. It is
purposeful — each pane *is* a topic filter, the window *is* the navigation
into the corpus — not decoration. Fallback: with reduced motion, or no
pointer, or no 3D support, the panes render as a flat, fully clickable grid.
Keyboard: every pane is a real `<button>`.

## Responsive behaviour
- Desktop: two-column hero, 3-column passage grid.
- Tablet/mobile (<820px): single column, nav wraps full-width, panes stay
  tappable (min-height 74px), no horizontal overflow.
- Touch: tilt is pointer:fine-only; nothing depends on hover.

## Accessibility
Semantic landmarks (header/main/footer, labelled sections), aria-live regions
for answers and results, aria-pressed on toggles, visible 3px gold focus
outlines, labels on every input, sufficient contrast (ink on parchment
≈ 13:1; gold on parchment used only for large/bold text).

## References & original decisions
See design/RESEARCH.md. Original decisions: the refusal state as a first-class
designed state (ruby, not an error toast); the window-as-navigation; the
43-passage auditable corpus instead of a model call.
