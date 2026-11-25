/* Grace Notes landing — footer scene: a night sky of stars over two
   parallax ridgelines, with golden embers rising. Pattern: ThreeUI
   Workshop Codex "layered observatory footer with a star field,
   parallax ridgelines" + Corvane Vault "rising embers and
   pointer-driven firelight". Real Three.js r160. Single canvas,
   pauses off-screen, reduced-motion renders one still frame. */
import * as THREE from "../vendor/three.module.js";

(function () {
  var canvas = document.getElementById("footer-canvas");
  var footer = document.querySelector(".site-footer");
  if (!canvas || !footer) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    canvas.style.display = "none";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0.4, 5);

  /* ---- Star field ---- */
  var STAR_COUNT = 220;
  var starPos = new Float32Array(STAR_COUNT * 3);
  var starCol = new Float32Array(STAR_COUNT * 3);
  var starPalette = [new THREE.Color(0xf3e9d2), new THREE.Color(0x8fa8c8), new THREE.Color(0xe3c07a)];
  for (var s = 0; s < STAR_COUNT; s++) {
    starPos[s * 3] = (Math.random() * 2 - 1) * 9;
    starPos[s * 3 + 1] = Math.random() * 3.4 - 0.4;
    starPos[s * 3 + 2] = (Math.random() * 2 - 1) * 1.5;
    var c = starPalette[s % starPalette.length];
    starCol[s * 3] = c.r; starCol[s * 3 + 1] = c.g; starCol[s * 3 + 2] = c.b;
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false
  }));
  scene.add(stars);

  /* ---- Parallax ridgelines: jagged dark strips along the bottom ---- */
  function ridge(color, baseY, amp, seed) {
    var shape = new THREE.Shape();
    shape.moveTo(-10, -1.2);
    shape.lineTo(-10, baseY);
    var x = -10;
    var i = 0;
    while (x < 10) {
      var w = 1.1 + ((i * 7 + seed) % 5) * 0.35;
      var peak = baseY + amp * (0.35 + ((i * 13 + seed * 3) % 10) / 14);
      shape.lineTo(x + w / 2, peak);
      shape.lineTo(x + w, baseY);
      x += w;
      i++;
    }
    shape.lineTo(10, -1.2);
    shape.closePath();
    var mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: color })
    );
    mesh.position.z = -0.4;
    return mesh;
  }
  var ridgeFar = ridge(0x1a1d40, -0.55, 0.85, 3);
  var ridgeNear = ridge(0x12142f, -0.95, 0.7, 8);
  scene.add(ridgeFar, ridgeNear);

  /* ---- Rising embers ---- */
  var EMBER_COUNT = 36;
  var emberPos = new Float32Array(EMBER_COUNT * 3);
  var emberSpeed = new Float32Array(EMBER_COUNT);
  for (var e = 0; e < EMBER_COUNT; e++) {
    emberPos[e * 3] = (Math.random() * 2 - 1) * 8;
    emberPos[e * 3 + 1] = -1 + Math.random() * 3.6;
    emberPos[e * 3 + 2] = (Math.random() * 2 - 1) * 0.8;
    emberSpeed[e] = 0.002 + Math.random() * 0.004;
  }
  var emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPos, 3));
  var embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    color: 0xe3c07a, size: 0.06, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(embers);

  /* ---- Pointer parallax ---- */
  var targetPX = 0;
  footer.addEventListener("pointermove", function (e) {
    if (reduceMotion) return;
    var r = footer.getBoundingClientRect();
    targetPX = ((e.clientX - r.left) / r.width - 0.5) * 2;
  }, { passive: true });

  function layout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  layout();
  window.addEventListener("resize", layout);

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !reduceMotion) requestAnimationFrame(tick);
    }, { threshold: 0.02 }).observe(canvas);
  }

  var clock = new THREE.Clock();
  var smoothPX = 0;
  function renderFrame(t) {
    smoothPX += (targetPX - smoothPX) * 0.05;
    stars.position.x = smoothPX * 0.12;
    ridgeFar.position.x = smoothPX * 0.28;
    ridgeNear.position.x = smoothPX * 0.14;
    stars.material.opacity = 0.75 + 0.15 * Math.sin(t * 0.5);
    var attr = emberGeo.attributes.position;
    for (var i = 0; i < EMBER_COUNT; i++) {
      var y = attr.getY(i) + emberSpeed[i];
      if (y > 3.0) { y = -1.0; attr.setX(i, (Math.random() * 2 - 1) * 8); }
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin(t * 0.8 + i) * 0.0008);
    }
    attr.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function tick() {
    if (!visible || document.hidden) return;
    renderFrame(clock.getElapsedTime());
    requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    renderFrame(0.8); // one still frame
  } else {
    tick();
  }
})();
