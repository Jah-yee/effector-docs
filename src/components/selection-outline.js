/**
 * effector-docs — custom text selection outline
 *
 * 无填充 + #eae6e1 虚线框，虚线顺时针流动。
 * 逐行合并 + 顺时针轮廓，支持矩形、L 形、多行等。
 *
 * z-index: 198 — 低于 .search-overlay (200)，避免盖住搜索层。
 * 类名 / keyframes 使用 edo- 前缀，避免与站内其它样式冲突。
 */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.getSelection) return;
  if (window.__effectorDocsSelectionOutlineInit) return;
  window.__effectorDocsSelectionOutlineInit = true;

  var overlay = null;
  var styleEl = null;
  var raf = null;

  var CLS_OVERLAY = 'edo-selection-overlay';
  var ANIM = 'edo-selection-dash';

  function ensureOverlay() {
    if (overlay) return overlay;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-effector-docs', 'selection-outline');
      styleEl.textContent = [
        '.' + CLS_OVERLAY + '{position:fixed;pointer-events:none;z-index:198;left:0;top:0;overflow:visible;}',
        '.' + CLS_OVERLAY + ' svg{position:absolute;left:0;top:0;display:block;}',
        '.' + CLS_OVERLAY + ' path{fill:none;stroke:#eae6e1;stroke-width:2;stroke-dasharray:10 8;stroke-linecap:round;stroke-linejoin:round;animation:' + ANIM + ' 0.6s linear infinite;}',
        '@keyframes ' + ANIM + '{to{stroke-dashoffset:-18}}',
      ].join('');
      document.head.appendChild(styleEl);
    }
    overlay = document.createElement('div');
    overlay.setAttribute('class', CLS_OVERLAY);
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<svg><path/></svg>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      var p = overlay.querySelector('path');
      if (p) p.setAttribute('d', '');
    }
    if (raf) cancelAnimationFrame(raf);
  }

  function buildRows(clientRects) {
    var list = [];
    for (var i = 0; i < clientRects.length; i++) {
      var r = clientRects[i];
      if (r.width < 1 || r.height < 1) continue;
      list.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    }
    if (!list.length) return [];

    list.sort(function (a, b) {
      return a.t - b.t || a.l - b.l;
    });

    var rows = [];
    var c = { l: list[0].l, r: list[0].r, t: list[0].t, b: list[0].b };

    for (var j = 1; j < list.length; j++) {
      var rect = list[j];
      var overlap = Math.min(c.b, rect.b) - Math.max(c.t, rect.t);
      var minH = Math.min(c.b - c.t, rect.b - rect.t);
      if (minH > 0 && overlap > minH * 0.3) {
        c.l = Math.min(c.l, rect.l);
        c.r = Math.max(c.r, rect.r);
        c.t = Math.min(c.t, rect.t);
        c.b = Math.max(c.b, rect.b);
      } else {
        rows.push(c);
        c = { l: rect.l, r: rect.r, t: rect.t, b: rect.b };
      }
    }
    rows.push(c);

    for (var k = 0; k < rows.length - 1; k++) {
      var gap = rows[k + 1].t - rows[k].b;
      if (gap > 0 && gap < 4) {
        var mid = (rows[k].b + rows[k + 1].t) / 2;
        rows[k].b = mid;
        rows[k + 1].t = mid;
      }
    }

    return rows;
  }

  function rowsToPath(rows, offX, offY) {
    if (!rows.length) return '';
    var pts = [];

    pts.push([rows[0].l, rows[0].t]);
    pts.push([rows[0].r, rows[0].t]);

    for (var i = 0; i < rows.length; i++) {
      pts.push([rows[i].r, rows[i].b]);
      if (i < rows.length - 1) {
        pts.push([rows[i + 1].r, rows[i + 1].t]);
      }
    }

    pts.push([rows[rows.length - 1].l, rows[rows.length - 1].b]);

    for (var ri = rows.length - 1; ri >= 0; ri--) {
      pts.push([rows[ri].l, rows[ri].t]);
      if (ri > 0) {
        pts.push([rows[ri - 1].l, rows[ri - 1].b]);
      }
    }

    var clean = [pts[0]];
    for (var pi = 1; pi < pts.length; pi++) {
      var p = pts[pi];
      var prev = clean[clean.length - 1];
      if (Math.abs(p[0] - prev[0]) > 0.5 || Math.abs(p[1] - prev[1]) > 0.5) {
        clean.push(p);
      }
    }
    if (clean.length > 1) {
      var f = clean[0];
      var la = clean[clean.length - 1];
      if (Math.abs(f[0] - la[0]) < 0.5 && Math.abs(f[1] - la[1]) < 0.5) clean.pop();
    }

    var finalPts = [];
    var n = clean.length;
    for (var fi = 0; fi < n; fi++) {
      var prev2 = clean[(fi - 1 + n) % n];
      var curr = clean[fi];
      var next = clean[(fi + 1) % n];
      var sameX = Math.abs(prev2[0] - curr[0]) < 0.5 && Math.abs(curr[0] - next[0]) < 0.5;
      var sameY = Math.abs(prev2[1] - curr[1]) < 0.5 && Math.abs(curr[1] - next[1]) < 0.5;
      if (!sameX && !sameY) finalPts.push(curr);
    }
    if (finalPts.length < 3) finalPts = clean;

    var R = 5;
    var fn = finalPts.length;
    var d = [];
    for (var vi = 0; vi < fn; vi++) {
      var pv = finalPts[(vi - 1 + fn) % fn];
      var cr = finalPts[vi];
      var nx = finalPts[(vi + 1) % fn];
      var dx1 = cr[0] - pv[0];
      var dy1 = cr[1] - pv[1];
      var dx2 = nx[0] - cr[0];
      var dy2 = nx[1] - cr[1];
      var len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < 0.1 || len2 < 0.1) continue;
      var rr = Math.min(R, len1 / 2, len2 / 2);
      var bx = (cr[0] - (dx1 / len1) * rr - offX).toFixed(1);
      var by = (cr[1] - (dy1 / len1) * rr - offY).toFixed(1);
      var cx = (cr[0] - offX).toFixed(1);
      var cy = (cr[1] - offY).toFixed(1);
      var ax = (cr[0] + (dx2 / len2) * rr - offX).toFixed(1);
      var ay = (cr[1] + (dy2 / len2) * rr - offY).toFixed(1);
      if (vi === 0) {
        d.push('M' + bx + ',' + by);
      } else {
        d.push('L' + bx + ',' + by);
      }
      d.push('Q' + cx + ',' + cy + ' ' + ax + ',' + ay);
    }
    d.push('Z');
    return d.join(' ');
  }

  function updateBox() {
    var sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      hideOverlay();
      return;
    }
    var range = sel.getRangeAt(0);
    if (!document.body.contains(range.commonAncestorContainer)) {
      hideOverlay();
      return;
    }
    if (!sel.toString().trim()) {
      hideOverlay();
      return;
    }
    var rects = range.getClientRects();
    if (!rects || rects.length === 0) {
      hideOverlay();
      return;
    }
    var rows = buildRows(rects);
    if (!rows.length) {
      hideOverlay();
      return;
    }

    var minX = rows[0].l;
    var minY = rows[0].t;
    var maxX = rows[0].r;
    var maxY = rows[0].b;
    for (var ri2 = 1; ri2 < rows.length; ri2++) {
      if (rows[ri2].l < minX) minX = rows[ri2].l;
      if (rows[ri2].t < minY) minY = rows[ri2].t;
      if (rows[ri2].r > maxX) maxX = rows[ri2].r;
      if (rows[ri2].b > maxY) maxY = rows[ri2].b;
    }

    var pad = 10;
    var oL = minX - pad;
    var oT = minY - pad;
    var oW = maxX - minX + pad * 2;
    var oH = maxY - minY + pad * 2;

    var pathStr = rowsToPath(rows, oL, oT);
    if (!pathStr) {
      hideOverlay();
      return;
    }

    var el = ensureOverlay();
    el.style.display = '';
    el.style.left = oL + 'px';
    el.style.top = oT + 'px';
    el.style.width = oW + 'px';
    el.style.height = oH + 'px';

    var svg = el.querySelector('svg');
    var path = el.querySelector('path');
    if (svg && path) {
      svg.setAttribute('width', oW);
      svg.setAttribute('height', oH);
      path.setAttribute('d', pathStr);
    }
  }

  function onSelectionChange() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      raf = null;
      updateBox();
    });
  }

  function onScrollResize() {
    var sel = document.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) updateBox();
  }

  document.addEventListener('selectionchange', onSelectionChange);
  window.addEventListener('scroll', onScrollResize, true);
  window.addEventListener('resize', onScrollResize);
})();
