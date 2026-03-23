/**
 * effector-docs — lobster cursor + dual-track dot trail
 *
 * - 光标：较大 SVG 龙虾
 * - 轨迹：沿路径等步长；左右交替、两侧距路径不同、椭圆「高矮」不同、微抖动；
 *   浅色粒子，淡出较快以便辨认
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !document.body) return;
  if (window.__effectorDocsCursorTrailInit) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  window.__effectorDocsCursorTrailInit = true;

  var STEP = 12;
  var FADE_MS = 2400;
  var MAX_DOTS = 1000;
  var Z_INDEX = 149;

  /** 左右轨与路径垂线距离（px），中间留空，略不对称 → 参差 */
  var OFF_LEFT = 5;
  var OFF_RIGHT = 6.8;

  var particles = [];
  var lastDotX = null;
  var lastDotY = null;
  var trailStep = 0;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:' + Z_INDEX + ';';
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.length = 0;
    lastDotX = null;
    lastDotY = null;
    trailStep = 0;
  }

  resize();
  window.addEventListener('resize', resize);

  function pushParticle(px, py, now, rx, ry, rot) {
    particles.push({ x: px, y: py, t: now, rx: rx, ry: ry, rot: rot });
    if (particles.length > MAX_DOTS) {
      particles.splice(0, particles.length - MAX_DOTS);
    }
  }

  function onMove(e) {
    var bx = e.clientX;
    var by = e.clientY;
    var now = performance.now();

    if (lastDotX === null) {
      lastDotX = bx;
      lastDotY = by;
      return;
    }

    var dx = bx - lastDotX;
    var dy = by - lastDotY;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.0001) return;

    var ux = dx / d;
    var uy = dy / d;

    while (d >= STEP) {
      lastDotX += ux * STEP;
      lastDotY += uy * STEP;
      var ang = Math.atan2(uy, ux);
      var nx = -uy;
      var ny = ux;

      var jitter =
        Math.sin(trailStep * 1.17) * 0.55 + Math.cos(trailStep * 0.61) * 0.35;
      var stagger = (trailStep % 5) * 0.12 - 0.24;

      var leftTurn = trailStep % 2 === 0;
      var dist = leftTurn ? OFF_LEFT + stagger : OFF_RIGHT - stagger * 0.6;
      dist += jitter * 0.25;

      var side = leftTurn ? -1 : 1;
      var px = lastDotX + nx * side * dist;
      var py = lastDotY + ny * side * dist;

      if (leftTurn) {
        pushParticle(px, py, now, 1.35, 2.55, ang + Math.PI / 2);
      } else {
        pushParticle(px, py, now, 2.25, 1.2, ang);
      }

      trailStep++;

      dx = bx - lastDotX;
      dy = by - lastDotY;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.0001) break;
      ux = dx / d;
      uy = dy / d;
    }
  }

  document.addEventListener('mousemove', onMove, { passive: true });

  function tick(now) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    var i = 0;
    while (i < particles.length) {
      var p = particles[i];
      var age = now - p.t;
      if (age > FADE_MS) {
        particles.splice(i, 1);
        continue;
      }
      var fade = 1 - age / FADE_MS;
      var alpha = 0.28 * Math.pow(fade, 1.15);
      ctx.fillStyle = 'rgba(248, 248, 252, ' + alpha.toFixed(4) + ')';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, Math.PI * 2);
      ctx.fill();
      i++;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.body.appendChild(canvas);

  // Replace the cursor icon with the "Deal With It" meme pointer.
  // Note: the PNG is loaded from the third-party CDN.
  var cursorUrl =
    'url("https://cdn.custom-cursor.com/db/pointer/32/Deal_With_It_Pointer.png") 0 0, auto';
  document.documentElement.style.cursor = cursorUrl;
  document.body.style.cursor = cursorUrl;
})();
