/* Grace Notes landing — page logic.
   Demo + explorer run the app's own retrieval code (js/retrieval.js)
   over the app's own corpus (js/corpus.js). Nothing is invented here. */
(function () {
  "use strict";

  var corpus = window.GraceNotesCorpus;
  var retrieval = window.GraceNotesRetrieval;

  /* ---------- Kinetic hero title ---------- */
  var title = document.getElementById("hero-title");
  if (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.innerHTML = words.map(function (w) {
      return '<span class="word"><span>' + w + "</span></span>";
    }).join(" ");
    var spans = title.querySelectorAll(".word > span");
    spans.forEach(function (s, i) { s.style.transitionDelay = (i * 0.07) + "s"; });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { title.classList.add("in"); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Live demo ---------- */
  var answerBox = document.getElementById("answer");
  var askForm = document.getElementById("ask-form");
  var askInput = document.getElementById("ask-input");
  var chips = document.querySelectorAll(".chip[data-q]");

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderAnswer(question) {
    if (!retrieval) {
      answerBox.innerHTML = '<div class="answer-card"><p class="answer-text">The demo could not load its retrieval code. Please open the live app instead.</p></div>';
      return;
    }
    var res = retrieval.answer(question);
    var html = "";
    if (res.status === "empty") {
      html = '<div class="answer-card"><p class="answer-text">Ask a question first — pick one of the examples above, or type your own.</p></div>';
    } else if (res.status === "too-long") {
      html = '<div class="answer-card not-found"><div class="answer-head"><span class="badge badge-notfound">Too long</span></div><p class="answer-text">Please keep the question under 500 characters.</p></div>';
    } else if (res.status === "not-found") {
      html = '<div class="answer-card not-found">' +
        '<div class="answer-head"><span class="badge badge-notfound">Not found</span><span class="label">in the provided passages</span></div>' +
        '<p class="answer-text">' + escapeHtml(res.answerText) + "</p></div>";
    } else {
      var badgeClass = res.confidence === "High" ? "badge-high" : res.confidence === "Medium" ? "badge-medium" : "badge-low";
      var lines = res.answerText.split("\n").filter(function (l) { return l.trim().length > 0; });
      var head = lines[0];
      var claims = lines.slice(1);
      var quoted = res.passages[0];
      html = '<div class="answer-card">' +
        '<div class="answer-head"><span class="badge ' + badgeClass + '">' + res.confidence + ' confidence</span>' +
        '<span class="label">Grounded in ' + res.passages.length + " passage" + (res.passages.length > 1 ? "s" : "") + "</span></div>" +
        '<p class="answer-text">' + escapeHtml(head) + "\n" + claims.map(function (c) {
          return escapeHtml(c).replace(/\[([^\]]+)\]/, "<strong>[$1]</strong>");
        }).join("\n") + "</p>" +
        '<blockquote class="verse-quote">\u201C' + escapeHtml(quoted.text) + "\u201D<cite>" + escapeHtml(quoted.ref) + " — King James Version</cite></blockquote>" +
        '<ul class="sources">' + res.passages.map(function (p, i) {
          return "<li>" + escapeHtml(p.ref) + " — match score " + res.scores[i] + " · topics: " + escapeHtml(p.topics.join(", ")) + "</li>";
        }).join("") + "</ul></div>";
    }
    answerBox.innerHTML = html;
    answerBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function ask(question) {
    askInput.value = question;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-q") === question ? "true" : "false"); });
    renderAnswer(question);
  }

  chips.forEach(function (c) {
    c.setAttribute("aria-pressed", "false");
    c.addEventListener("click", function () { ask(c.getAttribute("data-q")); });
  });
  askForm.addEventListener("submit", function (e) {
    e.preventDefault();
    chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    renderAnswer(askInput.value);
  });

  /* ---------- Verse & topic explorer ---------- */
  var grid = document.getElementById("verse-grid");
  var countEl = document.getElementById("verse-count");
  var searchInput = document.getElementById("verse-search");
  var filterBox = document.getElementById("topic-filter");
  var activeTopic = "all";

  var allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "topic-btn";
  allBtn.setAttribute("aria-pressed", "true");
  allBtn.textContent = "All topics";
  allBtn.addEventListener("click", function () { setTopic("all"); });
  filterBox.appendChild(allBtn);

  corpus.TOPICS.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "topic-btn";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("data-topic", t.id);
    var sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = t.color;
    b.appendChild(sw);
    b.appendChild(document.createTextNode(t.label));
    b.addEventListener("click", function () { setTopic(t.id); });
    filterBox.appendChild(b);
  });

  function setTopic(id) {
    activeTopic = id;
    filterBox.querySelectorAll(".topic-btn").forEach(function (b) {
      var isActive = (id === "all" && !b.getAttribute("data-topic")) || b.getAttribute("data-topic") === id;
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    renderVerses();
  }

  // The 3D topic wheel (js/cylinder.js) filters the explorer through this.
  window.GraceNotesSetTopic = setTopic;

  function renderVerses() {
    var q = searchInput.value;
    var list = retrieval.searchPassages(q, activeTopic === "all" ? null : activeTopic);
    countEl.textContent = list.length + " of 43 passages";
    if (list.length === 0) {
      grid.innerHTML = '<p class="verse-empty">No passage matches that search. Try another word, or choose a different topic.</p>';
      return;
    }
    grid.innerHTML = list.map(function (p) {
      return '<article class="verse-card"><blockquote>\u201C' + escapeHtml(p.text) + "\u201D</blockquote>" +
        '<div class="ref">' + escapeHtml(p.ref) + "</div>" +
        '<div class="verse-tags">' + p.topics.map(function (t) { return "<span>" + escapeHtml(t) + "</span>"; }).join("") + "</div></article>";
    }).join("");
  }

  searchInput.addEventListener("input", renderVerses);
  renderVerses();
})();
