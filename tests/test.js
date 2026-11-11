// Grace Notes — automated tests. Run: node tests/test.js
// No dependencies. Counts as the QA receipt for Gate D.
const fs = require("fs");
const path = require("path");
const corpus = require("../corpus.js");
const retrieval = require("../retrieval.js");

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; failures.push(name + (extra ? " — " + extra : "")); console.log("  FAIL " + name + (extra ? " — " + extra : "")); }
}

// ---- Corpus integrity ----
console.log("Corpus:");
check("43 passages bundled", corpus.PASSAGES.length === 43, "got " + corpus.PASSAGES.length);
check("10 topics defined", corpus.TOPICS.length === 10, "got " + corpus.TOPICS.length);
const ids = new Set();
let corpusOk = true;
corpus.PASSAGES.forEach((p) => {
  if (ids.has(p.id)) corpusOk = false;
  ids.add(p.id);
  if (!p.ref || !p.text || !p.gist || !p.topics.length || !p.keywords.length) corpusOk = false;
  if (!/^[A-Za-z123 ]+ \d+:\d+(-\d+)?$/.test(p.ref)) corpusOk = false;
  if (/TODO|FIXME|Lorem|placeholder/i.test(p.text + p.gist)) corpusOk = false;
});
check("every passage has unique id, ref, text, gist, topics, keywords; refs well-formed; no placeholder text", corpusOk);
corpus.TOPICS.forEach((t) => {
  const n = corpus.PASSAGES.filter((p) => p.topics.includes(t.id)).length;
  check("topic '" + t.id + "' has >=3 passages (" + n + ")", n >= 3);
});
check("every passage topic exists in TOPICS", corpus.PASSAGES.every((p) => p.topics.every((t) => corpus.TOPICS.some((x) => x.id === t))));

// ---- Retrieval: grounded answers ----
console.log("Retrieval — grounded:");
let r = retrieval.answer("How can I find comfort when I am grieving?");
check("grief/comfort question is grounded", r.grounded === true && r.status === "grounded");
check("grief answer cites Matthew 5:4 or Psalm 23:4 or Psalm 34:18",
  r.passages.some((p) => ["mt5-4", "ps23-4", "ps34-18", "rev21-4"].includes(p.id)),
  JSON.stringify(r.passages.map((p) => p.id)));
check("grief answer confidence is High/Medium/Low", ["High", "Medium", "Low"].includes(r.confidence));
check("answer text names each cited ref", r.passages.every((p) => r.answerText.includes(p.ref)));

r = retrieval.answer("What does the Bible say about forgiveness?");
check("forgiveness question grounded with a forgiveness passage",
  r.grounded && r.passages.some((p) => p.topics.includes("forgiveness")),
  JSON.stringify(r.passages.map((p) => p.id)));
check("forgiveness top passage is 1 John 1:9 or Psalm 103:12",
  ["jn1-9", "ps103-12"].includes(r.passages[0].id), "top=" + r.passages[0].id);

r = retrieval.answer("How should I pray when I feel anxious?");
check("prayer question grounded with a prayer passage",
  r.grounded && r.passages.some((p) => p.topics.includes("prayer")),
  JSON.stringify(r.passages.map((p) => p.id)));

r = retrieval.answer("Where can I find hope for the future?");
check("hope question grounded with a hope passage",
  r.grounded && r.passages.some((p) => p.topics.includes("hope")),
  JSON.stringify(r.passages.map((p) => p.id)));

r = retrieval.answer("How do I know God loves me?");
check("love question grounded with a love passage",
  r.grounded && r.passages.some((p) => p.topics.includes("love")),
  JSON.stringify(r.passages.map((p) => p.id)));

r = retrieval.answer("I need strength to keep going");
check("strength question grounded", r.grounded && r.passages.some((p) => p.topics.includes("strength")),
  JSON.stringify(r.passages.map((p) => p.id)));

r = retrieval.answer("How can I be thankful and grateful?");
check("gratitude question grounded", r.grounded && r.passages.some((p) => p.topics.includes("gratitude")),
  JSON.stringify(r.passages.map((p) => p.id)));

r = retrieval.answer("Show me the way, guide my decisions");
check("guidance question grounded", r.grounded && r.passages.some((p) => p.topics.includes("guidance")),
  JSON.stringify(r.passages.map((p) => p.id)));

// ---- Retrieval: honest refusal ----
console.log("Retrieval — refusal:");
r = retrieval.answer("What is the stock market outlook for next week?");
check("unrelated question returns not-found", r.status === "not-found" && r.grounded === false);
check("not-found text says so plainly", /not found in the provided passages/i.test(r.answerText));
r = retrieval.answer("xyzqqq blorp wumpus");
check("gibberish returns not-found", r.status === "not-found");
r = retrieval.answer("   ");
check("empty question returns empty status", r.status === "empty");
r = retrieval.answer("x".repeat(501));
check("over-long question returns too-long status", r.status === "too-long");
check("at most 3 passages per answer", retrieval.answer("forgiveness prayer hope love comfort strength").passages.length <= 3);

// ---- Sermon follow-ups ----
console.log("Sermon notes:");
let s = retrieval.sermonFollowUps("Sunday's sermon was on forgiveness — forgiving others as God forgave us, letting go of bitterness.");
check("sermon notes grounded", s.status === "grounded" && s.items.length === 3, "status=" + s.status);
check("sermon items each cite a real passage",
  s.status === "grounded" && s.items.every((it) => it.passage && it.passage.ref && it.answer.includes(it.passage.text.slice(0, 20))));
check("sermon items each ask a question", s.status === "grounded" && s.items.every((it) => it.question.includes("?")));
s = retrieval.sermonFollowUps("   ");
check("empty sermon notes return empty", s.status === "empty");
s = retrieval.sermonFollowUps("quantum chromodynamics and semiconductor lithography nodes");
check("unrelated sermon notes return not-found", s.status === "not-found");

// ---- Explorer search ----
console.log("Explorer:");
check("search 'peace' returns passages", retrieval.searchPassages("peace", "all").length >= 3);
check("topic filter 'hope' returns only hope passages",
  retrieval.searchPassages("", "hope").every((p) => p.topics.includes("hope")) &&
  retrieval.searchPassages("", "hope").length >= 3);
check("search 'John 3:16' finds John 3:16", retrieval.searchPassages("John 3:16", "all").some((p) => p.id === "jn3-16"));
check("empty search + all topics returns all 43", retrieval.searchPassages("", "all").length === 43);

// ---- Static cross-checks: HTML/JS wiring ----
console.log("Static wiring:");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
["ask-form", "question-input", "ask-submit", "ask-clear", "answer-region", "sample-chips",
 "topic-chips", "explorer-search", "passage-grid", "result-count", "sermon-form",
 "sermon-input", "sermon-submit", "sermon-clear", "sermon-results", "motion-toggle",
 "glass-grid", "glass-frame", "glass-caption-topic"].forEach((id) => {
  check("id '" + id + "' exists in index.html", html.includes('id="' + id + '"'));
});
check("app.js references no id missing from HTML", (() => {
  const idsUsed = [...appJs.matchAll(/\$\("([a-z-]+)"\)/g)].map((m) => m[1]);
  const missing = idsUsed.filter((id) => !html.includes('id="' + id + '"'));
  return missing.length === 0;
})());
check("no href='#' dead links in HTML", !/href="#"/.test(html));
check("no TODO/FIXME in app JS or HTML", !/TODO|FIXME/.test(appJs + html));
check("no external script/style dependencies (fully self-contained)",
  !/<script[^>]+src="http/.test(html) && !/<link[^>]+href="http/.test(html));
check("no secrets committed (no api key/token/password literals)",
  !/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{8,}/i.test(appJs + html) &&
  !/password\s*[:=]\s*['"][^'"]{3,}/i.test(appJs + html));
check("honesty note present on page", /only from the 43 bundled/i.test(html));
check("all internal anchor targets exist", (() => {
  const targets = [...html.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]);
  return targets.every((t) => html.includes('id="' + t + '"'));
})());

console.log("\n" + pass + " passed, " + fail + " failed.");
if (fail > 0) { console.log("Failures: " + failures.join(" | ")); process.exit(1); }
