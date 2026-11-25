/* Grace Notes landing — "Verses in the round": a three-dimensional
   wheel of the ten topics. One face per topic, in its own colour, with
   the real passage count from the corpus. Drag it, use the arrow keys,
   or tap a face — tapping filters the verse explorer below to that
   topic. Pattern: ThreeUI Volta Atelier "three-dimensional cylinder"
   carousel (draggable, keyboard-accessible). Real Three.js r160.
   Single canvas, pauses off-screen, reduced-motion renders static
   frames (drag and keys still work, re-rendering on demand). */
import * as THREE from "../vendor/three.module.js";

(function () {
  var wrap = document.querySelector(".cylinder-wrap");
  var canvas = document.getElementById("cylinder-canvas");
  var labelEl = document.getElementById("cyl-face-label");
  var fallback = document.getElementById("cyl-fallback");
  if (!canvas || !wrap) return;

  var corpus = window.GraceNotesCorpus;
  if (!corpus || !corpus.TOPICS || !corpus.PASSAGES) {
    wrap.style.display = "none";
    if (fallback) fallback.hidden = false;
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var topics = corpus.TOPICS;
  var STEP = (Math.PI * 2) / topics.length;
  var RADIUS = 2.3;

  function countFor(topicId) {
    var n = 0;
    corpus.PASSAGES.forEach(function (p) {
      if (p.topics.indexOf(topicId) !== -1) n++;
    });
    return n;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    wrap.style.display = "none";
    if (fallback) fallback.hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.35, 6.4);

  scene.add(new THREE.AmbientLight(0x8a86b8, 1.0));
  var dir = new THREE.DirectionalLight(0xffe6b0, 1.6);
  dir.position.set(-4, 5, 6);
  scene.add(dir);

  var wheel = new THREE.Group();
  scene.add(wheel);

  /* ---- Face textures: real topic label + real passage count ---- */
  function faceTexture(topic) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 336;
    var g = c.getContext("2d");
    g.fillStyle = topic.color;
    g.fillRect(0, 0, 512, 336);
    g.fillStyle = "rgba(12, 14, 36, 0.55)";
    g.fillRect(0, 0, 512, 336);
    g.strokeStyle = "#c99a3c";
    g.lineWidth = 6;
    g.strokeRect(16, 16, 480, 304);
    // Small gold cross.
    g.fillStyle = "#e3c07a";
    g.fillRect(246, 52, 20, 64);
    g.fillRect(222, 76, 68, 20);
    // Topic label.
    g.fillStyle = "#f3e9d2";
    g.font = "600 58px Georgia, 'Palatino Linotype', serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(topic.label, 256, 168, 440);
    // Passage count.
    var n = countFor(topic.id);
    g.fillStyle = "#e3c07a";
    g.font = "34px Georgia, serif";
    g.fillText(n + (n === 1 ? " passage" : " passages"), 256, 232);
    // Hint.
    g.fillStyle = "rgba(243, 233, 210, 0.75)";
    g.font = "24px system-ui, sans-serif";
    g.fillText("Tap to explore", 256, 282);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  var faces = [];
  var faceGeo = new THREE.PlaneGeometry(1.6, 1.05);
  topics.forEach(function (topic, i) {
    var mat = new THREE.MeshStandardMaterial({
      map: faceTexture(topic), roughness: 0.55, metalness: 0.05
    });
    var face = new THREE.Mesh(faceGeo, mat);
    var a = i * STEP;
    face.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS);
    face.rotation.y = a;
    face.userData.topic = topic;
    face.userData.index = i;
    wheel.add(face);
    faces.push(face);
  });

  // Gold hub: axle + two rings.
  var hubMat = new THREE.MeshStandardMaterial({
    color: 0xc99a3c, roughness: 0.35, metalness: 0.6
  });
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.5, 24), hubMat);
  wheel.add(hub);
  [0.78, -0.78].forEach(function (y) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 12, 40), hubMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    wheel.add(ring);
  });

  /* ---- Layout / resize ---- */
  function layout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Closer on wide screens so the wheel fills the frame; farther on
    // narrow screens so the side faces are not cut off.
    camera.position.z = camera.aspect > 1 ? 5.4 : 6.8;
    camera.updateProjectionMatrix();
  }
  layout();
  window.addEventListener("resize", layout);

  /* ---- Rotation state ---- */
  var phi = 0;            // current wheel angle
  var targetPhi = 0;      // snap target in manual mode
  var mode = reduceMotion ? "manual" : "auto";
  var dragging = false;
  var dragStartX = 0, dragStartPhi = 0, dragMoved = 0;
  var lastInteract = 0;
  var loopAlive = false;  // true while the animation loop is scheduled

  function facingIndex(angle) {
    var m = Math.round(-angle / STEP) % topics.length;
    return (m + topics.length) % topics.length;
  }

  function snapTarget(angle) {
    return Math.round(angle / STEP) * STEP;
  }

  function updateLabel() {
    if (!labelEl) return;
    var t = topics[facingIndex(phi)];
    labelEl.textContent = t.label + " — " + countFor(t.id) +
      (countFor(t.id) === 1 ? " passage" : " passages");
  }

  function goManual() {
    mode = "manual";
    lastInteract = performance.now();
  }

  function stepFace(dir) {
    goManual();
    targetPhi = snapTarget(phi) + dir * STEP;
    // If the animation loop is not running (wheel off-screen, tab
    // hidden, or reduced motion), apply the turn at once instead of
    // leaving the label behind the target.
    if (!loopAlive) { phi = targetPhi; renderFrame(); }
    updateLabel();
  }

  function activateTopic(topic) {
    goManual();
    var i = topics.indexOf(topic);
    var want = -i * STEP;
    // Bring the wanted angle near the current angle (shortest turn).
    var diff = want - phi;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    targetPhi = phi + diff;
    if (!loopAlive) { phi = targetPhi; renderFrame(); }
    updateLabel();
    if (typeof window.GraceNotesSetTopic === "function") {
      window.GraceNotesSetTopic(topic.id);
    }
    var verses = document.getElementById("verses");
    if (verses) verses.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---- Pointer drag ---- */
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true;
    dragMoved = 0;
    dragStartX = e.clientX;
    dragStartPhi = phi;
    goManual();
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));
    phi = dragStartPhi + dx * 0.005;
    updateLabel();
    if (reduceMotion) renderFrame();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = "grab";
    if (dragMoved < 6 && e.type === "pointerup") {
      // A tap, not a drag: raycast for the face under the pointer.
      var rect = canvas.getBoundingClientRect();
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      var ray = new THREE.Raycaster();
      ray.setFromCamera({ x: nx, y: ny }, camera);
      var hits = ray.intersectObjects(faces);
      if (hits.length > 0) {
        activateTopic(hits[0].object.userData.topic);
        return;
      }
    }
    targetPhi = snapTarget(phi);
    goManual();
    updateLabel();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* ---- Keyboard + buttons ---- */
  canvas.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); stepFace(1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stepFace(-1); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateTopic(topics[facingIndex(phi)]);
    }
  });
  var prevBtn = document.getElementById("cyl-prev");
  var nextBtn = document.getElementById("cyl-next");
  if (prevBtn) prevBtn.addEventListener("click", function () { stepFace(1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { stepFace(-1); });

  /* ---- Pause when off-screen; restart when it returns ---- */
  var visible = true;
  function maybeStartLoop() {
    if (visible && !reduceMotion && !loopAlive) requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      maybeStartLoop();
    }, { threshold: 0.02 }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) maybeStartLoop();
  });

  function renderFrame() {
    wheel.rotation.y = phi;
    renderer.render(scene, camera);
  }

  var lastT = 0;
  function tick(now) {
    if (!visible || document.hidden) {
      loopAlive = false;
      // Settle: if a turn was mid-flight when the loop stopped (wheel
      // scrolled out of view, tab hidden), finish it at once so the
      // label always matches the wheel's target.
      if (mode === "manual" && phi !== targetPhi) {
        phi = targetPhi;
        updateLabel();
        renderFrame();
      }
      return;
    }
    loopAlive = true;
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    if (mode === "auto") {
      phi += 0.12 * dt;
    } else {
      phi += (targetPhi - phi) * 0.18;
      if (Math.abs(targetPhi - phi) < 0.0005) phi = targetPhi;
      if (performance.now() - lastInteract > 4000 && !dragging) mode = "auto";
    }
    updateLabel();
    renderFrame();
    requestAnimationFrame(tick);
  }

  updateLabel();
  if (reduceMotion) {
    renderFrame(); // one still frame
  } else {
    requestAnimationFrame(tick);
  }
})();
