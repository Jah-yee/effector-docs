/**
 * effector-docs — lobster cursor + uniform dot trail
 *
 * - 光标：SVG 龙虾（data URI）
 * - 轨迹：沿鼠标路径按固定步长打点，与速度无关；浅灰白小点随时间淡出
 * - 禁用：prefers-reduced-motion、非精细指针（触摸为主）
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !document.body) return;
  if (window.__effectorDocsCursorTrailInit) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  window.__effectorDocsCursorTrailInit = true;

  var STEP = 13;
  var DOT_R = 1.25;
  var FADE_MS = 2800;
  var MAX_DOTS = 900;
  var Z_INDEX = 149;

  var particles = [];
  var lastDotX = null;
  var lastDotY = null;

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
  }

  resize();
  window.addEventListener('resize', resize);

  function pushDot(x, y, now) {
    particles.push({ x: x, y: y, t: now });
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
      pushDot(lastDotX, lastDotY, now);
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
      var alpha = 0.11 * fade * fade;
      ctx.fillStyle = 'rgba(238, 238, 242, ' + alpha.toFixed(4) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, DOT_R, 0, Math.PI * 2);
      ctx.fill();
      i++;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.body.appendChild(canvas);

  var lobsterSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
    '<ellipse cx="14" cy="17" rx="8" ry="5.5" fill="#E85A4A"/>' +
    '<ellipse cx="14" cy="10" rx="5" ry="4" fill="#E85A4A"/>' +
    '<ellipse cx="6" cy="15" rx="2.8" ry="2" fill="#D6453D" transform="rotate(-22 6 15)"/>' +
    '<ellipse cx="22" cy="15" rx="2.8" ry="2" fill="#D6453D" transform="rotate(22 22 15)"/>' +
    '<path d="M10 20 Q14 24 18 20" stroke="#C43E3E" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
    '<path d="M7 8 Q5 4 6 2" stroke="#C43E3E" stroke-width="1.2" fill="none"/>' +
    '<path d="M21 8 Q23 4 22 2" stroke="#C43E3E" stroke-width="1.2" fill="none"/>' +
    '</svg>';
  var cursorUrl =
    'url("data:image/svg+xml,' + encodeURIComponent(lobsterSvg) + '") 14 12, auto';
  document.documentElement.style.cursor = cursorUrl;
  document.body.style.cursor = cursorUrl;
})();
