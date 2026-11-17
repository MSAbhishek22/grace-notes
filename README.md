# Grace Notes — Ask in faith. Answer only from Scripture.

**Live demo:** https://grace-notes.vercel.app

Ask in faith — and get an answer drawn only from Scripture, with a citation for every claim.

**AI for Church Hackathon 2026** · Discipleship & Spiritual Growth track ·
Built by **M S Abhishek** (GitHub: MSAbhishek22)

A grounded church Q&A web app. Ask a faith or pastoral question and get an
answer drawn **only** from 43 bundled King James Version passages (public
domain), with a citation for every claim. If no passage grounds the question,
it says so plainly — "not found in the provided passages" — instead of
inventing doctrine.

## Features
1. **Ask with cited answers** — retrieval over the bundled corpus, confidence
   badge (High/Medium/Low), source list with match scores, and an honest
   not-found state.
2. **Verse & topic explorer** — browse all 43 passages by ten topics
   (comfort, forgiveness, prayer, hope, love, strength, guidance, peace,
   gratitude, grief), full-text search, copy-a-verse.
3. **Sermon-note grounding** — paste sermon notes, get grounded follow-up
   questions and answers for the week, each tied to a passage.
4. **Stained-glass window** — a CSS-3D interactive window; each pane is a
   topic filter. Pointer tilt, keyboard accessible, flat fallback.

## Honest architecture
No backend, no model call, no network. The corpus (`corpus.js`) and the
retrieval (`retrieval.js`) run entirely in the browser. Nothing you type
leaves your device. This is deliberate: a small corpus a pastor can audit
beats a large model a congregation cannot verify. A human stays in the loop —
every answer is meant to be checked against its cited verse.

## Run locally
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
No build step, no dependencies, no environment variables.

## Deploy (Vercel, free static)
```bash
vercel deploy --prod   # static site; see deployment/DEPLOYMENT_RUNBOOK.md
```
`vercel.json` serves the static files as-is.

## Tests
```bash
node tests/test.js   # 67 assertions, no dependencies
```

## Structure
```
index.html      page + copy
styles.css      parchment-editorial design system
app.js          UI wiring (all controls)
corpus.js       43 KJV passages, 10 topics (public domain)
retrieval.js    client-side grounded retrieval + sermon follow-ups
tests/test.js   automated QA (67 checks)
design/         constitution, registry comparison, research
qa/             interaction inventory, test report
deployment/     runbook, release manifest
submission/     submission pack, demo-video manifest
```

## Hackathon compliance
- Fresh build in the window (30 Oct–27 Nov 2026); built 12 Nov 2026.
- Solo entry; free to enter; worldwide 18+ (author is 18+).
- One project, one track: Discipleship & Spiritual Growth.
- Submission = description + demo video (≤5 min) via the hackathon platform.
- Deadline: **27 Nov 2026, 11:59 PM ET (28 Nov 2026, 10:29 IST)**.
- Prize amounts: the official page currently lists cash prizes as
  "To Be Announced Soon" (verified 12 Nov 2026) — the earlier $2,500 split
  no longer appears on the page.

## Licence
MIT — see LICENSE. Scripture quotations are from the King James Version,
which is public domain.
