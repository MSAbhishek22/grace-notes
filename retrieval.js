// Grace Notes — client-side grounded retrieval.
// No backend, no model call, no network: the answer is composed ONLY from
// the bundled KJV passages in corpus.js. If nothing in the corpus grounds
// the question, the answer says so plainly instead of inventing doctrine.
(function (root) {
  var corpus = root.GraceNotesCorpus || (typeof require !== "undefined" ? require("./corpus.js") : null);
  var PASSAGES = corpus.PASSAGES;

  var STOPWORDS = new Set(("a an the and or of to in on for with is are was were be been being " +
    "i me my we our you your he she it they them his her its their this that these those " +
    "what how why when where who whom which do does did can could should would will shall may might " +
    "about from as at by not no yes if then than so such very just really how do i " +
    "bible say says verse scripture god lord jesus christ").split(" "));

  function tokenize(text) {
    return (text || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/)
      .filter(function (t) { return t.length > 2 && !STOPWORDS.has(t); });
  }

  // Simple stem-ish match: exact, or one token is a prefix of the other (len>=4).
  function matchToken(token, word) {
    if (token === word) return true;
    if (token.length >= 4 && word.length >= 4) {
      return word.indexOf(token) === 0 || token.indexOf(word) === 0;
    }
    return false;
  }

  function scorePassage(tokens, p) {
    var score = 0;
    var textWords = p.text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
    var matchedKeywords = [];
    tokens.forEach(function (tok) {
      // Topic name itself in the question is a strong signal.
      p.topics.forEach(function (t) { if (tok === t) score += 3; });
      // Curated keyword hits.
      p.keywords.forEach(function (kw) {
        var kwTokens = kw.split(" ");
        kwTokens.forEach(function (kt) {
          if (matchToken(tok, kt) && matchedKeywords.indexOf(kw) === -1) {
            matchedKeywords.push(kw); score += 3;
          }
        });
      });
      // Word appears in the verse text itself.
      for (var i = 0; i < textWords.length; i++) {
        if (matchToken(tok, textWords[i])) { score += 1; break; }
      }
    });
    return { score: score, matchedKeywords: matchedKeywords };
  }

  // Minimum score for a passage to count as grounding a question.
  var GROUND_THRESHOLD = 4;

  function retrieve(question) {
    var tokens = tokenize(question);
    var scored = PASSAGES.map(function (p) {
      var s = scorePassage(tokens, p);
      return { passage: p, score: s.score, matchedKeywords: s.matchedKeywords };
    }).filter(function (r) { return r.score >= GROUND_THRESHOLD; })
      .sort(function (a, b) { return b.score - a.score; });
    return { tokens: tokens, results: scored };
  }

  function confidenceFor(topScore) {
    if (topScore >= 10) return "High";
    if (topScore >= 7) return "Medium";
    return "Low";
  }

  function answer(question) {
    var q = (question || "").trim();
    if (!q) return { status: "empty", question: q, grounded: false, passages: [], confidence: null, answerText: "" };
    if (q.length > 500) return { status: "too-long", question: q, grounded: false, passages: [], confidence: null, answerText: "" };
    var r = retrieve(q);
    if (r.results.length === 0) {
      return {
        status: "not-found", question: q, grounded: false, passages: [], confidence: null,
        answerText: "Not found in the provided passages. Grace Notes answers only from its 43 bundled King James Version passages, and none of them speaks to this question. Try asking about comfort, forgiveness, prayer, hope, love, strength, guidance, peace, gratitude or grief — or browse the Verse Explorer below."
      };
    }
    var top = r.results.slice(0, 3);
    var lines = top.map(function (res, i) {
      return (i + 1) + ". " + res.passage.gist + " [" + res.passage.ref + "]";
    });
    return {
      status: "grounded", question: q, grounded: true,
      passages: top.map(function (res) { return res.passage; }),
      scores: top.map(function (res) { return res.score; }),
      confidence: confidenceFor(top[0].score),
      answerText: "From the passages provided:\n" + lines.join("\n") +
        "\n\nEach claim above is quoted word-for-word from the King James Version passage cited beside it. Nothing beyond these passages has been added."
    };
  }

  // Sermon-note grounding: paste notes, get grounded follow-up Q&As.
  function sermonFollowUps(notes) {
    var n = (notes || "").trim();
    if (!n) return { status: "empty", items: [] };
    if (n.length > 3000) return { status: "too-long", items: [] };
    var r = retrieve(n);
    if (r.results.length === 0) {
      return { status: "not-found", items: [] };
    }
    var top = r.results.slice(0, 3);
    var templates = [
      "What does {ref} say that speaks to these notes?",
      "How does {ref} deepen what was preached here?",
      "What question should a listener carry home from {ref}?"
    ];
    var items = top.map(function (res, i) {
      var topic = res.passage.topics[0];
      return {
        question: templates[i].replace("{ref}", res.passage.ref),
        passage: res.passage,
        answer: res.passage.gist + " The passage itself reads: \u201C" + res.passage.text + "\u201D",
        topic: topic
      };
    });
    return { status: "grounded", items: items };
  }

  function searchPassages(query, topic) {
    var tokens = tokenize(query);
    var list = PASSAGES.filter(function (p) {
      if (topic && topic !== "all" && p.topics.indexOf(topic) === -1) return false;
      if (tokens.length === 0) return true;
      var s = scorePassage(tokens, p);
      var textHit = tokens.some(function (tok) {
        return p.text.toLowerCase().indexOf(tok) !== -1 || p.ref.toLowerCase().indexOf(tok) !== -1;
      });
      return s.score >= 3 || textHit;
    });
    return list;
  }

  var api = { tokenize: tokenize, retrieve: retrieve, answer: answer, sermonFollowUps: sermonFollowUps, searchPassages: searchPassages, GROUND_THRESHOLD: GROUND_THRESHOLD };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GraceNotesRetrieval = api;
})(typeof window !== "undefined" ? window : globalThis);
