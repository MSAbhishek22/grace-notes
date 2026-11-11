"""Grace Notes — Playwright E2E + local-draft demo recording.
Run: python3 tests/e2e_record.py
Serves the app over local HTTP, drives real interactions in Chromium,
records the session video (LOCAL DRAFT — re-record from the live URL
once deployed), and prints a pass/fail receipt.
"""
import http.server, functools, json, os, socketserver, subprocess, sys, threading, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "submission", "demo")
os.makedirs(OUT, exist_ok=True)

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

from playwright.sync_api import sync_playwright

results = []
def check(name, cond, extra=""):
    results.append((name, bool(cond), extra))
    print(("  PASS " if cond else "  FAIL ") + name + ((" — " + extra) if extra and not cond else ""))

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1280, "height": 800},
                               record_video_dir=OUT, record_video_size={"width": 1280, "height": 800})
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(1200)
    check("page loads, title correct", "Grace Notes" in page.title())
    check("hero headline visible", page.locator("#hero-title").is_visible())
    check("10 stained-glass panes rendered", page.locator(".glass-pane").count() == 10)
    check("43 passage cards rendered", page.locator(".passage-card").count() == 43)
    page.screenshot(path=os.path.join(OUT, "shot-hero.png"))

    # 1. Ask a grounded question (typed, real action)
    page.fill("#question-input", "How can I find comfort when I am grieving?")
    page.click("#ask-submit")
    page.wait_for_selector(".answer-card", timeout=5000)
    body = page.locator("#answer-region").inner_text()
    check("grief question -> grounded answer", "grounded" in body.lower() and "Matthew 5:4" in body or "Psalm 23:4" in body, body[:120])
    check("answer shows confidence badge", page.locator(".confidence-badge").count() >= 1)
    page.screenshot(path=os.path.join(OUT, "shot-answer.png"))
    page.wait_for_timeout(600)

    # 2. Honest refusal via the sample chip
    page.click("#sample-chips button[data-q='What is the stock market outlook for next week?']")
    page.wait_for_timeout(400)
    body = page.locator("#answer-region").inner_text()
    check("stock-market question -> not-found card", "Not found in the provided passages" in body, body[:120])
    page.screenshot(path=os.path.join(OUT, "shot-notfound.png"))
    page.wait_for_timeout(600)

    # 3. Explorer: topic filter + search
    page.locator("#topic-chips button[data-topic='forgiveness']").click()
    page.wait_for_timeout(400)
    check("Forgiveness filter shows 6 passages", "6 passages" in page.locator("#result-count").inner_text())
    page.fill("#explorer-search", "peace")
    page.wait_for_timeout(400)
    check("search within a topic can honestly return zero", page.locator(".passage-card").count() == 0 and "No passages match" in page.locator("#passage-grid").inner_text())
    page.locator("#topic-chips button[data-topic='all']").click()
    page.wait_for_timeout(400)
    check("search 'peace' across all topics returns >=3", page.locator(".passage-card").count() >= 3)
    page.fill("#explorer-search", "")
    page.locator("#topic-chips button[data-topic='all']").click()
    page.wait_for_timeout(300)

    # 4. Stained-glass pane filters the explorer
    page.locator(".glass-pane[data-topic='hope']").click()
    page.wait_for_timeout(800)
    check("Hope glass pane filters explorer", "hope" in page.locator("#result-count").inner_text().lower())
    page.screenshot(path=os.path.join(OUT, "shot-explorer.png"))
    page.wait_for_timeout(600)

    # 5. Sermon-note grounding
    page.fill("#sermon-input", "Sunday's sermon was on forgiveness — forgiving others as God forgave us, letting go of bitterness.")
    page.click("#sermon-submit")
    page.wait_for_selector("#sermon-results .answer-card", timeout=5000)
    sbody = page.locator("#sermon-results").inner_text()
    check("sermon notes -> 3 grounded follow-ups", sbody.count("?") >= 3 and "1 John 1:9" in sbody or "Psalm 103:12" in sbody, sbody[:120])
    page.screenshot(path=os.path.join(OUT, "shot-sermon.png"))
    page.wait_for_timeout(600)

    # 6. Low-motion toggle + copy button
    page.click("#motion-toggle")
    check("low-motion toggle turns on", "on" in page.locator("#motion-toggle").inner_text())
    page.click("#motion-toggle")
    ctx.grant_permissions(["clipboard-read", "clipboard-write"])
    page.locator(".passage-card .copy-btn").first.click()
    page.wait_for_timeout(400)
    check("copy verse confirms", "Copied" in page.locator(".passage-card .copy-btn").first.inner_text())

    # 7. Mobile viewport
    mob = browser.new_page(viewport={"width": 390, "height": 844})
    mob.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    mob.wait_for_timeout(800)
    overflow = mob.evaluate("document.documentElement.scrollWidth > 390")
    check("mobile 390px: no horizontal overflow", not overflow)
    check("mobile: panes + ask form visible", mob.locator(".glass-pane").count() == 10 and mob.locator("#ask-form").is_visible())
    mob.screenshot(path=os.path.join(OUT, "shot-mobile.png"))
    mob.close()

    check("no console errors / page errors", len(errors) == 0, "; ".join(errors[:3]))
    video_path = page.video.path() if page.video else None
    ctx.close()
    browser.close()

httpd.shutdown()
httpd.server_close()
passed = sum(1 for _, ok, _ in results if ok)
failed = [n for n, ok, _ in results if not ok]
print(f"\nE2E: {passed} passed, {len(failed)} failed.")
if video_path:
    print("VIDEO_RAW: " + str(video_path))
if failed:
    print("Failures: " + "; ".join(failed)); sys.exit(1)
