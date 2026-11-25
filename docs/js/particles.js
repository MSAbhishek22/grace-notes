/* Grace Notes landing — drifting light particles across the whole page.
   One fixed, pointer-transparent canvas of small gold dust motes rising
   slowly, like light through a cathedral. Pattern: ThreeUI Fathomless
   "interactive particle specimens" + Workshop Codex star field, kept
   deliberately light — 70 points, one draw call, no lights, no
   textures. Real Three.js r160. Pauses when the tab is hidden;
   reduced-motion renders one still frame. */
import * as THREE from "../vendor/three.module.js";

(function () {
  var canvas = document.getElementById("page-particles");
  if (!canvas) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  } catch (e) {
    canvas.style.display = "none";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 20);
  camera.position.z = 6;

  var COUNT = 70;
  var pos = new Float32Array(COUNT * 3);
  var speed = new Float32Array(COUNT);
  var phase = new Float32Array(COUNT);
  var halfH = 3.6, halfW = 6;

  function seed() {
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * halfW;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * halfH;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 1.0;
      speed[i] = 0.0006 + Math.random() * 0.0012;
      phase[i] = Math.random() * Math.PI * 2;
    }
  }
  seed();

  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var motes = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xe3c07a, size: 0.05, transparent: true, opacity: 0.38,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(motes);

  function layout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfW = halfH * camera.aspect;
    seed();
  }
  layout();
  window.addEventListener("resize", layout);

  function renderFrame(t) {
    var attr = geo.attributes.position;
    for (var i = 0; i < COUNT; i++) {
      var y = attr.getY(i) + speed[i];
      if (y > halfH + 0.2) y = -halfH - 0.2;
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin(t * 0.3 + phase[i]) * 0.0006);
    }
    attr.needsUpdate = true;
    renderer.render(scene, camera);
  }

  var clock = new THREE.Clock();
  function tick() {
    if (document.hidden) return;
    renderFrame(clock.getElapsedTime());
    requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    renderFrame(0.8); // one still frame
  } else {
    tick();
  }
})();
