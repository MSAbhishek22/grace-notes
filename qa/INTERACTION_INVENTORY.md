# Interaction Inventory — Grace Notes

Every visible control, what it does, and its test evidence. Status after
`node tests/test.js` (67/67 PASS) + Playwright E2E run (see qa/TEST_REPORT.md).

| # | Location | Control | Action | Expected | Evidence | Status |
|---|---|---|---|---|---|---|
| 1 | Header | Brand link | Click | Scrolls to top (#top) | E2E click, no error | PASS |
| 2 | Header | Nav "Ask" | Click | Jumps to #ask | E2E click | PASS |
| 3 | Header | Nav "Verse Explorer" | Click | Jumps to #explorer | E2E click | PASS |
| 4 | Header | Nav "Sermon Notes" | Click | Jumps to #sermon | E2E click | PASS |
| 5 | Header | Nav "How grounding works" | Click | Jumps to #how | E2E click | PASS |
| 6 | Header | Low-motion toggle | Click | Toggles body.low-motion, label + aria-pressed update, animations freeze | E2E toggle on/off | PASS |
| 7 | Hero | "Ask a question" button | Click | Jumps to #ask | E2E click | PASS |
| 8 | Hero | "Browse the passages" button | Click | Jumps to #explorer | E2E click | PASS |
| 9 | Hero | Stained-glass pane (×10) | Click | Filters explorer to that topic, scrolls to explorer, caption updates | E2E: clicked "Hope" pane → 6 hope passages shown | PASS |
| 10 | Hero | Glass frame tilt | Pointer move | Frame tilts ≤7° (transform only); no tilt on touch/reduced-motion | Manual code check + E2E no-error | PASS |
| 11 | Ask | Sample question chip (×6) | Click | Fills textarea and submits; answer appears | E2E: grief chip → grounded answer with citations | PASS |
| 12 | Ask | Question textarea | Type | Accepts ≤500 chars; longer input blocked by maxlength | Unit test (too-long) | PASS |
| 13 | Ask | "Ask Grace Notes" submit | Click/Enter | Grounded answer card with confidence + cited passages, or honest not-found | Unit tests ×8 + E2E | PASS |
| 14 | Ask | "Clear" | Click | Empties textarea + answer region, focuses input | E2E click | PASS |
| 15 | Ask | Copy verse (in answer) | Click | Copies "text — ref (KJV)"; button confirms "Copied ✓" | E2E click (clipboard permission granted in test) | PASS |
| 16 | Ask | Empty submit | Submit empty | Inline alert "Ask something first" | Unit test (empty) + E2E | PASS |
| 17 | Explorer | Topic chip (×11 incl. All) | Click | Filters grid; count text updates; aria-pressed updates | E2E: "Forgiveness" → 6 passages | PASS |
| 18 | Explorer | Search input | Type | Live-filters by word/book/reference | Unit tests + E2E ("peace" → ≥3) | PASS |
| 19 | Explorer | Copy verse (per card) | Click | Copies verse; confirms | E2E click | PASS |
| 20 | Explorer | Empty result | Search nonsense | "No passages match" empty state | Unit test logic + E2E | PASS |
| 21 | Sermon | Notes textarea | Type | Accepts ≤3000 chars | Unit test (too-long) | PASS |
| 22 | Sermon | "Ground my notes" submit | Click | 3 grounded follow-up Q&As, each citing a passage | Unit tests + E2E | PASS |
| 23 | Sermon | "Clear" | Click | Empties notes + results, focuses input | E2E click | PASS |
| 24 | Sermon | Empty submit | Submit empty | Inline alert "Paste your notes first" | Unit test (empty) | PASS |
| 25 | Sermon | Unrelated notes | Submit | Honest "Nothing in the provided passages matches" card | Unit test (not-found) | PASS |
| 26 | Footer | "AI for Church Hackathon" link | Click | Opens https://aiforchurch.com/hackathon in new tab | Static check (URL verified live 12 Nov) | PASS |
| 27 | Footer | "Source on GitHub" link | Click | Opens https://github.com/MSAbhishek22/grace-notes (repo pending creation — see release card; link target is the intended repo) | Static check | BLOCKED* |
| 28 | Page | Skip link | Tab + Enter | Jumps to #ask | Static check (target exists) | PASS |

\* Control 27: the link target is correct and will resolve once the repo is
created (parent's browser step). The control itself works; the destination
does not exist yet. Tracked as a release blocker, not a UI defect.

No dead buttons, no `href="#"`, no decorative controls. Verified by
`node tests/test.js` static checks + Playwright E2E (qa/TEST_REPORT.md).
