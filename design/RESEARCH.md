# Design Research — Grace Notes

**Inspected:** 12 Nov 2026. Honest scope note: the five references below were
inspected via their live pages / published 2026 reviews (URLs given). I did
not complete a full interactive walkthrough of every app's logged-in flows;
what is recorded is what was actually read and what it changed in this design.
The three fleet projects were inspected on their live Vercel URLs.

## 1. YouVersion Bible (bible.com) — same category
- What was inspected: 2026 app reviews (bestchristianapps.com, warmpeach.com)
  describing the reading experience: free, ad-free, clean distraction-free
  text reading, verse-of-the-day, reading plans.
- Learn: text-first beats feature-first; the reading surface should be calm
  and the verse should be the biggest thing on the card.
- Do NOT copy: the plan/streak/social layer — Grace Notes is a reference
  tool, not a habit app.
- Translated: passage cards lead with the verse text in large serif; no
  streaks, no accounts, no notifications.

## 2. BibleNow / Dwell — same category (audio-first)
- What was inspected: biblenow.app review (30 days old at inspection):
  audio-first reading, an AI companion ("Lumi") that answers Scripture
  questions, meditation-style listening in Dwell.
- Learn: an "ask about Scripture" companion is a real, wanted interaction —
  but Dwell's lesson is that atmosphere must serve the text, not replace it.
- Do NOT copy: audio paywalls; an AI that answers from an opaque model.
- Translated: the Ask interaction exists, but its answers are retrieval-only
  from a checkable corpus — the anti-black-box version of Lumi.

## 3. Glorify — exceptional visual/motion system
- What was inspected: 2026 reviews describing visual devotionals, short
  guided readings, beautiful imagery and animation.
- Learn: short, guided, visually-led sessions feel devotional rather than
  reference-like; imagery carries emotional tone.
- Do NOT copy: devotional content written by the app; imagery that competes
  with the text.
- Translated: the stained-glass window carries the visual emotion so the
  text stays plain and quotable; imagery is structural (the window), not
  stock photos.

## 4. She Reads Truth — typography & hierarchy
- What was inspected: warmpeach.com review — "typography that respects the
  text", daily-plan reading that "feels like opening a designed book, not a
  generic app screen", CSB-anchored, design-forward.
- Learn: a Bible product earns trust through typographic care — generous
  leading, serif voice, restrained chrome.
- Do NOT copy: the subscription/plan paywall structure.
- Translated: serif-first type system, editorial section numerals (01–04),
  parchment paper background, generous spacing.

## 5. Stained glass as a spatial reference (3D / immersive)
- What was inspected: the stained-glass tradition as a spatial device —
  light, colour and geometry carrying meaning — plus the fleet's own 3D
  treatments (below). No single proprietary 3D scene was copied.
- Learn: a window is a natural 3D object: panes at different depths,
  light passing through, colour as information.
- Translated: the ten topic panes are a CSS-3D window (translateZ depth,
  pointer tilt, lift on hover) where colour = topic and clicking a pane
  filters the explorer. Fallback is a flat grid.

## Fleet comparison (registry)
See design/PROJECT_DESIGN_REGISTRY.md — NyayaSeal (dark legal, numbered
workflow, 3D document stack), YojanaSetu (officer dashboard, 3D district
map), CageCheck (dark terminal/cage). Grace Notes differs in concept
(chapel/parchment vs legal/government/terminal), palette (warm parchment +
gold + ruby vs dark navy/teal), typography (serif editorial vs sans
dashboard), layout (single editorial page vs multi-section workflow) and
3D (stained-glass window vs document stack / district map / cage).
