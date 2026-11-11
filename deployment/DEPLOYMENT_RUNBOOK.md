# Deployment Runbook — Grace Notes

## Stack
Static site, zero dependencies, no build step, no backend, no environment
variables, no secrets. Files: `index.html`, `styles.css`, `app.js`,
`corpus.js`, `retrieval.js`, `vercel.json`.

## Provider
Vercel (free tier, static). `vercel.json` serves the files as-is.

## Deploy steps (once Vercel auth exists)
1. `cd grace-notes && node tests/test.js` — must be 67/67 PASS.
2. `vercel deploy --prod` (or connect the GitHub repo
   `MSAbhishek22/grace-notes` to Vercel for auto-deploy from `main`).
3. Open the production URL in a fresh browser session; run the smoke list:
   - page loads, hero window renders, 10 panes visible;
   - ask "How can I find comfort when I am grieving?" → grounded answer;
   - ask "What is the stock market outlook?" → not-found card;
   - explorer shows 43 passages; topic filter + search work;
   - sermon notes → 3 follow-ups;
   - mobile viewport (390px): no horizontal overflow.
4. Record the production URL + deployed commit SHA in
   `deployment/RELEASE_MANIFEST.json`.

## Rollback
Static site: redeploy the previous commit, or revert the commit and
redeploy. No database, no migrations, nothing to roll back.

## Health check
`curl -I <production-url>` → 200. No API, no /health endpoint needed
(nothing server-side exists to be unhealthy).

## Ownership
M S Abhishek (MSAbhishek22). Free-only; no paid plan, no card on file.

## Current status (12 Nov 2026)
- Build: passing locally (67/67 tests; local HTTP smoke 200).
- Vercel auth: **absent in this sandbox** (no `~/.vercel`, no token;
  Vercel MCP connector `status` = not_connected). A deploy was attempted
  non-interactively and stopped at the login prompt,
  per the task rules — no account was created. The real Vercel CLI is not
  installed; an `npx -y vercel deploy` attempt on 12 Nov did not finish
  downloading the CLI within 100s (SIGTERM by timeout) and never reached a
  login prompt. Deploy-ready, not deployed.
- GitHub repo `MSAbhishek22/grace-notes`: **does not exist yet** (verified by
  GitHub search, 0 results, 12 Nov). Repo creation via the connector returns
  403 (known); creation needs the parent's live browser. Snapshot-push
  manifest is prepared (see `../grace-notes-paths`); push is blocked until
  the repo exists.
