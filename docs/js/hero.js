/* Grace Notes landing — hero: a real Three.js stained-glass window.
   Coloured panes in the app's own ten topic colours, lead came gaps,
   light rays and drifting dust. Single canvas, pauses off-screen,
   prefers-reduced-motion renders one static frame. */
import * as THREE from "../vendor/three.module.js";

(function () {
  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

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
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.1, 9);

  /* ---- Palette: the app's ten topic colours, plus gold and cream ---- */
  var GLASS = [
    "#8e2f38", "#2f4e7a", "#5b4a8a", "#c99a3c", "#a63a4b",
    "#2e6b4f", "#7a5a2e", "#3e6b7a", "#b07a2e", "#4a4458",
    "#e3c07a", "#d9c9a3", "#6b8cae", "#9a5f6e"
  ];

  /* ---- Window geometry: pointed Gothic arch, W x H ---- */
  var W = 3.8, H = 6.6, SPRING = 1.1; // springing line y
  var halfW = W / 2, topY = H / 2, botY = -H / 2;

  // Half-width of the arch interior at height y (lancet taper above the springing line).
  function archHalfWidth(y) {
    if (y <= SPRING) return halfW;
    var t = (y - SPRING) / (topY - SPRING);
    if (t >= 1) return 0.02;
    return halfW * (1 - Math.pow(t, 1.7) * 0.96);
  }

  function archShape(w, h, spring, top, bot) {
    var s = new THREE.Shape();
    var hw = w / 2;
    s.moveTo(-hw, bot);
    s.lineTo(-hw, spring);
    s.quadraticCurveTo(-hw, top - 0.35, 0, top);
    s.quadraticCurveTo(hw, top - 0.35, hw, spring);
    s.lineTo(hw, bot);
    s.closePath();
    return s;
  }

  var group = new THREE.Group();
  scene.add(group);

  // Stone frame: outer arch ring with the inner arch as a hole.
  var frameShape = archShape(W + 0.5, H + 0.5, SPRING + 0.18, topY + 0.22, botY - 0.22);
  frameShape.holes.push(new THREE.Path(archShape(W, H, SPRING, topY, botY).getPoints(24)));
  var frameGeo = new THREE.ShapeGeometry(frameShape, 24);
  var frameMat = new THREE.MeshStandardMaterial({ color: 0x2b2b3d, roughness: 0.9, metalness: 0.05 });
  var frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.06;
  group.add(frame);

  // Dark backing so the gaps between panes read as lead came.
  var backGeo = new THREE.ShapeGeometry(archShape(W, H, SPRING, topY, botY), 24);
  var back = new THREE.Mesh(backGeo, new THREE.MeshBasicMaterial({ color: 0x0a0a18 }));
  back.position.z = -0.12;
  group.add(back);

  // Sill.
  var sill = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.7, 0.22, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x33334a, roughness: 0.85, metalness: 0.05 })
  );
  sill.position.set(0, botY - 0.3, 0.02);
  group.add(sill);

  // Glass panes: grid of small planes, kept only where the cell centre is inside the arch.
  var cellW = 0.46, cellH = 0.56, gap = 0.07;
  var paneGeo = new THREE.PlaneGeometry(cellW - gap, cellH - gap);
  var colour = new THREE.Color();
  for (var y = botY + cellH / 2 + 0.08; y < topY - 0.2; y += cellH) {
    for (var x = -halfW + cellW / 2; x < halfW; x += cellW) {
      if (Math.abs(x) > archHalfWidth(y) - cellW / 2 - 0.02) continue;
      // Leave room for the central medallion.
      var dx = x, dy = y - 1.5;
      if (dx * dx + dy * dy < 0.85 * 0.85) continue;
      var pick = GLASS[Math.floor(Math.random() * GLASS.length)];
      colour.set(pick);
      var bright = 0.82 + Math.random() * 0.35;
      var mat = new THREE.MeshBasicMaterial({
        color: colour.clone().multiplyScalar(bright),
        transparent: true, opacity: 0.94
      });
      var pane = new THREE.Mesh(paneGeo, mat);
      pane.position.set(x, y, 0);
      group.add(pane);
    }
  }

  // Central medallion: gold ring, deep-red heart.
  var medallion = new THREE.Group();
  var ring = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 48),
    new THREE.MeshBasicMaterial({ color: 0xe3c07a })
  );
  var heart = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 48),
    new THREE.MeshBasicMaterial({ color: 0x8e2f38 })
  );
  heart.position.z = 0.01;
  var crossV = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.5, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xe3c07a })
  );
  crossV.position.z = 0.02;
  var crossH = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.07, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xe3c07a })
  );
  crossH.position.set(0, 0.06, 0.02);
  medallion.add(ring, heart, crossV, crossH);
  medallion.position.set(0, 1.5, 0.01);
  group.add(medallion);

  // Floating glass orbs: one for each of the app's ten topics, in the
  // topic colours, drifting in front of the glass. They sit inside the
  // window's span so they stay on screen at every width.
  // (ThreeUI glass-card pattern; palette "glass orbs".)
  var TOPIC_COLOURS = ["#8e2f38", "#2f4e7a", "#5b4a8a", "#c99a3c", "#a63a4b",
    "#2e6b4f", "#7a5a2e", "#3e6b7a", "#b07a2e", "#4a4458"];
  var orbs = [];
  var orbGeo = new THREE.SphereGeometry(1, 24, 18);
  for (var o = 0; o < TOPIC_COLOURS.length; o++) {
    var oang = (o / TOPIC_COLOURS.length) * Math.PI * 2 + 0.35;
    var ox = Math.cos(oang) * 1.7, oy = 0.1 + Math.sin(oang) * 3.0;
    var orad = 0.2 + (o % 3) * 0.05;
    var omat = new THREE.MeshStandardMaterial({
      color: TOPIC_COLOURS[o], emissive: TOPIC_COLOURS[o], emissiveIntensity: 0.55,
      transparent: true, opacity: 0.88, roughness: 0.15, metalness: 0.1
    });
    var orb = new THREE.Mesh(orbGeo, omat);
    orb.scale.setScalar(orad);
    orb.position.set(ox, oy, 0.5 + (o % 3) * 0.35);
    orb.userData = { bx: ox, by: oy, ph: o * 0.9, sp: 0.5 + (o % 4) * 0.12 };
    group.add(orb);
    orbs.push(orb);
  }

  // Golden light helix rising through the centre of the window, in front
  // of the panes — light itself, spiralling up. Two turns, 36 dots.
  // (ThreeUI Aniwall "slowly turning iridescent helix".)
  var helix = new THREE.Group();
  var helixGeo = new THREE.SphereGeometry(0.06, 12, 10);
  var helixMatA = new THREE.MeshBasicMaterial({ color: 0xe3c07a });
  var helixMatB = new THREE.MeshBasicMaterial({ color: 0xc99a3c });
  for (var h = 0; h < 36; h++) {
    var ht = h / 36; // 0..1 up the helix
    var ha = ht * Math.PI * 4; // two full turns
    var dot = new THREE.Mesh(helixGeo, h % 2 ? helixMatA : helixMatB);
    dot.position.set(Math.cos(ha) * 0.35, -3.0 + ht * 6.1, Math.sin(ha) * 0.35);
    helix.add(dot);
  }
  helix.position.set(0, 0, 0.6);
  group.add(helix);

  // Light rays slanting out of the window toward the viewer.
  var rays = [];
  var rayMat = new THREE.MeshBasicMaterial({
    color: 0xe3c07a, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  for (var r = 0; r < 3; r++) {
    var ray = new THREE.Mesh(new THREE.PlaneGeometry(1.1 + r * 0.5, 8.5), rayMat.clone());
    ray.position.set(-0.6 - r * 0.7, -1.2, 1.4 + r * 0.5);
    ray.rotation.z = 0.42 + r * 0.1;
    ray.rotation.x = -0.25;
    group.add(ray);
    rays.push(ray);
  }

  // Dust motes drifting in the light.
  var moteCount = 130;
  var motePos = new Float32Array(moteCount * 3);
  for (var m = 0; m < moteCount; m++) {
    motePos[m * 3] = -3 + Math.random() * 6;
    motePos[m * 3 + 1] = -3.5 + Math.random() * 7;
    motePos[m * 3 + 2] = 0.5 + Math.random() * 3;
  }
  var moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xe3c07a, size: 0.045, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  group.add(motes);

  // Lights for the stone frame.
  scene.add(new THREE.AmbientLight(0x8a86b8, 0.9));
  var dir = new THREE.DirectionalLight(0xffe6b0, 1.4);
  dir.position.set(-4, 5, 6);
  scene.add(dir);

  /* ---- Layout: window right of centre on wide screens, centred on narrow ---- */
  function layout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    group.position.x = camera.aspect > 1.15 ? 2.7 : 0;
    group.position.y = camera.aspect > 1.15 ? -0.15 : 0.3;
    var s = camera.aspect > 1.15 ? 1 : Math.min(1, (w / h) * 0.85 + 0.35);
    group.scale.setScalar(s);
  }
  layout();
  window.addEventListener("resize", layout);

  /* ---- Pointer parallax ---- */
  var targetRY = 0, targetRX = 0;
  window.addEventListener("pointermove", function (e) {
    if (reduceMotion) return;
    targetRY = (e.clientX / window.innerWidth - 0.5) * 0.14;
    targetRX = -(e.clientY / window.innerHeight - 0.5) * 0.07;
  }, { passive: true });

  /* ---- Pause when off-screen ---- */
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !reduceMotion) requestAnimationFrame(tick);
    }, { threshold: 0.02 }).observe(canvas);
  }

  /* ---- Scroll-driven 3D rotation: the window turns gently as the
     reader scrolls away from it. On first load it sits square-on,
     fully visible; scrolling adds the turn. (ThreeUI pinned-workflow
     pattern; GSAP ScrollTrigger-style scroll storytelling; palette
     "scroll-driven 3D rotation".) ---- */
  var scrollProgress = 0;
  function updateScroll() {
    var vh = window.innerHeight || 1;
    scrollProgress = Math.max(0, Math.min(1, window.scrollY / vh));
    if (reduceMotion) return;
    if (visible) renderFrame(clock.getElapsedTime());
  }
  window.addEventListener("scroll", updateScroll, { passive: true });

  var clock = new THREE.Clock();
  var smoothRY = 0, smoothRX = 0;
  function renderFrame(t) {
    var sway = Math.sin(t * 0.5);
    smoothRY += (targetRY - smoothRY) * 0.05;
    smoothRX += (targetRX - smoothRX) * 0.05;
    group.rotation.y = sway * 0.03 + smoothRY * 0.6 + scrollProgress * 0.5;
    group.rotation.x = smoothRX * 0.6 - scrollProgress * 0.06;
    medallion.rotation.z = Math.sin(t * 0.15) * 0.02;
    helix.rotation.y = t * 0.25;
    orbs.forEach(function (orb) {
      var u = orb.userData;
      orb.position.y = u.by + Math.sin(t * u.sp + u.ph) * 0.09;
      orb.position.x = u.bx + Math.sin(t * u.sp * 0.6 + u.ph) * 0.05;
    });
    rays.forEach(function (ray, i) {
      ray.material.opacity = 0.03 + 0.015 * Math.sin(t * 0.6 + i * 1.3);
    });
    var pos = moteGeo.attributes.position;
    for (var i = 0; i < moteCount; i++) {
      var yy = pos.getY(i) + 0.0016;
      if (yy > 3.5) yy = -3.5;
      pos.setY(i, yy);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.4 + i) * 0.0006);
    }
    pos.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function tick() {
    if (!visible || document.hidden) return;
    var t = clock.getElapsedTime();
    renderFrame(t);
    requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    renderFrame(0.8); // one still frame: panes, medallion, rays, motes
  } else {
    tick();
  }
})();
