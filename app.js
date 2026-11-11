// Grace Notes — UI wiring. All logic is client-side; retrieval.js does the
// answering, corpus.js holds the passages. Every visible control works:
// see qa/INTERACTION_INVENTORY.md.
(function () {
  "use strict";
  var corpus = window.GraceNotesCorpus;
  var retrieval = window.GraceNotesRetrieval;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Stained-glass window (CSS 3D) ----------
  var glassGrid = $("glass-grid");
  var glassFrame = $("glass-frame");
  var glassCaption = $("glass-caption-topic");
  corpus.TOPICS.forEach(function (topic, i) {
    var pane = document.createElement("button");
    pane.type = "button";
    pane.className = "glass-pane";
    pane.style.setProperty("--pane-color", topic.color);
    pane.style.setProperty("--pane-delay", (i * 0.06) + "s");
    pane.setAttribute("data-topic", topic.id);
    pane.setAttribute("aria-label", "Explore passages about " + topic.label);
    pane.innerHTML = "<span class='pane-label'>" + topic.label + "</span>";
    pane.addEventListener("click", function () {
      setTopic(topic.id);
      document.getElementById("explorer").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
      glassCaption.textContent = topic.label + " — " + countForTopic(topic.id) + " passages below";
    });
    glassGrid.appendChild(pane);
  });

  // Gentle 3D tilt of the whole window following the pointer (transform only).
  var tiltOn = !reducedMotion();
  if (tiltOn && window.matchMedia("(pointer: fine)").matches) {
    glassFrame.addEventListener("pointermove", function (e) {
      var r = glassFrame.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      glassFrame.style.transform = "perspective(900px) rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (-y * 5).toFixed(2) + "deg)";
    });
    glassFrame.addEventListener("pointerleave", function () { glassFrame.style.transform = ""; });
  }

  function countForTopic(id) {
    return corpus.PASSAGES.filter(function (p) { return p.topics.indexOf(id) !== -1; }).length;
  }

  // ---------- Topic chips + explorer ----------
  var topicChips = $("topic-chips");
  var currentTopic = "all";
  var allChip = chip("all", "All topics · 43");
  topicChips.appendChild(allChip);
  corpus.TOPICS.forEach(function (t) {
    topicChips.appendChild(chip(t.id, t.label + " · " + countForTopic(t.id)));
  });
  function chip(id, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "topic-chip" + (id === "all" ? " active" : "");
    b.setAttribute("data-topic", id);
    b.setAttribute("aria-pressed", id === "all" ? "true" : "false");
    b.textContent = label;
    b.addEventListener("click", function () { setTopic(id); });
    return b;
  }
  function setTopic(id) {
    currentTopic = id;
    var chips = topicChips.querySelectorAll(".topic-chip");
    chips.forEach(function (c) {
      var on = c.getAttribute("data-topic") === id;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderExplorer();
  }

  var passageGrid = $("passage-grid");
  var resultCount = $("result-count");
  var searchInput = $("explorer-search");

  function renderExplorer() {
    var q = searchInput.value;
    var list = retrieval.searchPassages(q, currentTopic);
    resultCount.textContent = list.length + (list.length === 1 ? " passage" : " passages") +
      (currentTopic !== "all" ? " on " + currentTopic : "") +
      (q.trim() ? " matching \u201C" + q.trim() + "\u201D" : "") + " · King James Version (public domain)";
    passageGrid.innerHTML = "";
    if (list.length === 0) {
      passageGrid.innerHTML = "<p class='empty-state'>No passages match. Try another word, or clear the topic filter.</p>";
      return;
    }
    list.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "passage-card reveal";
      card.innerHTML =
        "<p class='passage-topics'>" + p.topics.map(escapeHtml).join(" · ") + "</p>" +
        "<h3 class='passage-ref'>" + escapeHtml(p.ref) + "</h3>" +
        "<blockquote class='passage-text'>\u201C" + escapeHtml(p.text) + "\u201D</blockquote>" +
        "<p class='passage-gist'>" + escapeHtml(p.gist) + "</p>" +
        "<button type='button' class='btn btn-small copy-btn'>Copy verse</button>";
      card.querySelector(".copy-btn").addEventListener("click", function (ev) {
        copyText(p.text + " — " + p.ref + " (KJV)", ev.currentTarget);
      });
      passageGrid.appendChild(card);
    });
    observeReveals();
  }
  searchInput.addEventListener("input", renderExplorer);
  renderExplorer();

  // ---------- Ask ----------
  var askForm = $("ask-form");
  var questionInput = $("question-input");
  var answerRegion = $("answer-region");

  document.querySelectorAll("#sample-chips button").forEach(function (b) {
    b.addEventListener("click", function () {
      questionInput.value = b.getAttribute("data-q");
      questionInput.focus();
      askForm.requestSubmit();
    });
  });
  $("ask-clear").addEventListener("click", function () {
    questionInput.value = "";
    answerRegion.innerHTML = "<p class='empty-state'>No question asked yet. Your grounded answer — with a citation for every claim — will appear here.</p>";
    questionInput.focus();
  });
  askForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var res = retrieval.answer(questionInput.value);
    if (res.status === "empty") {
      answerRegion.innerHTML = "<div class='answer-card answer-error' role='alert'><h3>Ask something first</h3><p>Type a question above, or tap one of the sample questions.</p></div>";
      return;
    }
    if (res.status === "too-long") {
      answerRegion.innerHTML = "<div class='answer-card answer-error' role='alert'><h3>That question is too long</h3><p>Please keep it under 500 characters so it can be matched against the passages.</p></div>";
      return;
    }
    if (!res.grounded) {
      answerRegion.innerHTML =
        "<div class='answer-card answer-notfound' role='status'>" +
        "<p class='confidence-badge confidence-none'>Not grounded</p>" +
        "<h3>Not found in the provided passages</h3>" +
        "<p>" + escapeHtml(res.answerText) + "</p>" +
        "<p class='answer-meta'>Checked against all 43 bundled passages · no passage scored above the grounding threshold.</p>" +
        "</div>";
      answerRegion.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
      return;
    }
    var items = res.passages.map(function (p, i) {
      return "<li class='source-item'><p class='source-gist'>" + escapeHtml(p.gist) + "</p>" +
        "<blockquote>\u201C" + escapeHtml(p.text) + "\u201D</blockquote>" +
        "<p class='source-ref'><strong>" + escapeHtml(p.ref) + "</strong> · KJV · topics: " + p.topics.map(escapeHtml).join(", ") +
        " · match score " + res.scores[i] + "</p>" +
        "<button type='button' class='btn btn-small copy-btn' data-copy='" + escapeAttr(p.text + " — " + p.ref + " (KJV)") + "'>Copy verse</button></li>";
    }).join("");
    answerRegion.innerHTML =
      "<div class='answer-card' role='status'>" +
      "<p class='confidence-badge confidence-" + res.confidence.toLowerCase() + "'>" + res.confidence + " confidence · grounded in " + res.passages.length + (res.passages.length === 1 ? " passage" : " passages") + "</p>" +
      "<h3>Answer — from the passages provided</h3>" +
      "<p class='answer-question'>\u201C" + escapeHtml(res.question) + "\u201D</p>" +
      "<ol class='source-list'>" + items + "</ol>" +
      "<p class='answer-meta'>Every claim above is quoted word-for-word from the King James Version passage cited beside it. Nothing beyond these passages has been added. A pastor or church leader should still weigh the answer — the app grounds, it does not preach.</p>" +
      "</div>";
    answerRegion.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) { copyText(btn.getAttribute("data-copy"), ev.currentTarget); });
    });
    answerRegion.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
  });

  // ---------- Sermon notes ----------
  var sermonForm = $("sermon-form");
  var sermonInput = $("sermon-input");
  var sermonResults = $("sermon-results");
  $("sermon-clear").addEventListener("click", function () {
    sermonInput.value = "";
    sermonResults.innerHTML = "<p class='empty-state'>No notes grounded yet. Your follow-up questions will appear here, each tied to a passage.</p>";
    sermonInput.focus();
  });
  sermonForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var res = retrieval.sermonFollowUps(sermonInput.value);
    if (res.status === "empty") {
      sermonResults.innerHTML = "<div class='answer-card answer-error' role='alert'><h3>Paste your notes first</h3><p>A paragraph of sermon notes is enough — the follow-ups are drawn from what your notes actually touch.</p></div>";
      return;
    }
    if (res.status === "too-long") {
      sermonResults.innerHTML = "<div class='answer-card answer-error' role='alert'><h3>Those notes are too long</h3><p>Please keep them under 3,000 characters.</p></div>";
      return;
    }
    if (res.status === "not-found") {
      sermonResults.innerHTML = "<div class='answer-card answer-notfound' role='status'><p class='confidence-badge confidence-none'>Not grounded</p><h3>Nothing in the provided passages matches these notes</h3><p>Your notes did not touch any of the 43 bundled passages closely enough to ground a follow-up. Try notes centred on comfort, forgiveness, prayer, hope, love, strength, guidance, peace, gratitude or grief.</p></div>";
      return;
    }
    var items = res.items.map(function (item) {
      return "<li class='source-item'><h4>" + escapeHtml(item.question) + "</h4>" +
        "<p>" + escapeHtml(item.answer) + "</p>" +
        "<p class='source-ref'><strong>" + escapeHtml(item.passage.ref) + "</strong> · KJV · topic: " + escapeHtml(item.topic) + "</p></li>";
    }).join("");
    sermonResults.innerHTML =
      "<div class='answer-card' role='status'><h3>Grounded follow-ups for the week</h3>" +
      "<ol class='source-list'>" + items + "</ol>" +
      "<p class='answer-meta'>Each question is answered only from the passage cited beside it. Nothing beyond the bundled passages has been added.</p></div>";
    sermonResults.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
  });

  // ---------- Copy helper ----------
  function copyText(text, btn) {
    function done(ok) {
      var original = btn.textContent;
      btn.textContent = ok ? "Copied ✓" : "Copy failed — select manually";
      btn.disabled = ok;
      setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(ta); done(ok);
    }
  }

  // ---------- Low-motion toggle ----------
  var motionToggle = $("motion-toggle");
  function reducedMotion() {
    return document.body.classList.contains("low-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  motionToggle.addEventListener("click", function () {
    var on = document.body.classList.toggle("low-motion");
    motionToggle.textContent = "Low-motion: " + (on ? "on" : "off");
    motionToggle.setAttribute("aria-pressed", on ? "true" : "false");
    glassFrame.style.transform = "";
  });

  // ---------- Scroll reveal (transform + opacity only) ----------
  var revealObserver = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("revealed"); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.12 }) : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.revealed)").forEach(function (el) {
      if (revealObserver) revealObserver.observe(el); else el.classList.add("revealed");
    });
  }
  document.querySelectorAll(".section, .hero-copy, .hero-glass, .honesty-bar").forEach(function (el) {
    el.classList.add("reveal"); observeReveals();
  });

  // ---------- Magnetic hover on topic chips (transform only, fine pointers) ----------
  if (window.matchMedia("(pointer: fine)").matches && !reducedMotion()) {
    document.querySelectorAll(".topic-chip").forEach(function (chipEl) {
      chipEl.addEventListener("pointermove", function (e) {
        var r = chipEl.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.12;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.2;
        chipEl.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      chipEl.addEventListener("pointerleave", function () { chipEl.style.transform = ""; });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }
})();
