/* ==========================================================================
   SITE FOR YOU. — Unified Animated Background System & Interactive Effects
   1) Global Pointer & Section Atmosphere Tracker (--atmo-x / --atmo-y)
   2) Multi-Layered Continuously Flowing Hero Wave Field (#hero-fx)
   3) Section-Specific Interactive Vector Background System (.sec-fx):
      - #arbeiten:  Light Topographic Contour Waves
      - #preise:    Structured Precision Wave-Grid Hybrid
      - #betreuung: Calm Technical Radial-Contour Field
      - #kontakt:   Deep Atmospheric Finale Wave Field
   4) 3D Portfolio Card Tilt & Glare (.project)
   5) Pointer-Reactive Surface Illumination (.plan, .care__item, .summary, .rc)
   6) Multilingual Interactive Typography (.t-word, .t-w--hover, .t-ch)
   All background layers use pointer-events: none, never blur text, pause when
   offscreen, and respect prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var interactive = finePointer && !reduceMotion;

  /* ======================================================================
     0) Globaler Zeiger-Zustand (weich gedämpft für das gesamte Interface)
     ====================================================================== */
  var pointer = {
    rawX: window.innerWidth * 0.5,
    rawY: window.innerHeight * 0.4,
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    active: false,
    lastMove: 0
  };

  if (interactive) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      pointer.rawX = e.clientX;
      pointer.rawY = e.clientY;
      pointer.active = true;
      pointer.lastMove = performance.now();
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      pointer.active = false;
    });
  }

  function stepGlobalPointer() {
    pointer.x += (pointer.rawX - pointer.x) * 0.14;
    pointer.y += (pointer.rawY - pointer.y) * 0.14;
  }

  /* Aktualisiert die atmosphärischen Licht-Koordinaten (--atmo-x, --atmo-y) einer Sektion */
  function updateSectionAtmosphere(el, rect, timeSec, phaseOffset) {
    if (!el || !rect.width || !rect.height) return;
    var ax, ay;
    var inside = pointer.active &&
      pointer.rawY >= rect.top - 120 &&
      pointer.rawY <= rect.bottom + 120;

    if (inside) {
      var relX = ((pointer.x - rect.left) / rect.width) * 100;
      var relY = ((pointer.y - rect.top) / rect.height) * 100;
      ax = Math.min(86, Math.max(14, relX));
      ay = Math.min(84, Math.max(16, relY));
    } else {
      ax = 50 + Math.sin(timeSec * 0.32 + phaseOffset) * 14;
      ay = 42 + Math.cos(timeSec * 0.25 + phaseOffset * 1.3) * 10;
    }
    el.style.setProperty("--atmo-x", ax.toFixed(1) + "%");
    el.style.setProperty("--atmo-y", ay.toFixed(1) + "%");
  }

  /* ======================================================================
     1) Hero Multi-Layered Flowing Wave Field (#hero-fx)
     3 abgestimmte Tiefenebenen:
     - Ebene 0 (Hintergrund): Weite, ruhige Horizont-Wellen (0.45x Parallaxe)
     - Ebene 1 (Hauptfeld):   Kontinuierlich fließendes, elastisches Fadenfeld
     - Ebene 2 (Oberton):     Feine Gegenphasen-Fäden + lokaler Cursor-Glanz
     ====================================================================== */
  (function heroWaveField() {
    var canvas = document.getElementById("hero-fx");
    var hero = canvas && canvas.parentElement;
    if (!canvas || !canvas.getContext || !hero) return;
    var ctx = canvas.getContext("2d");

    var PRIMARY_ALPHA = 0.088;
    var DEEP_ALPHA = 0.036;
    var CREST_ALPHA = 0.044;
    var RADIUS = 230;
    var MAX_PULL = 26;
    var STIFFNESS = 0.072;
    var DAMPING = 0.82;

    var w = 0, h = 0, rows = 0, cols = 0;
    var baseX, baseY, offX, offY, velX, velY, curX, curY;
    var deepRows = 0;
    var visible = true, rafId = 0;
    var t0 = performance.now();

    function build() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var spacing = w < 720 ? 33 : 28;
      var step = w < 720 ? 30 : 25;
      rows = Math.ceil(h / spacing) + 1;
      cols = Math.ceil(w / step) + 1;
      deepRows = Math.max(6, Math.ceil(h / (spacing * 2.2)));

      var n = rows * cols;
      baseX = new Float32Array(n);
      baseY = new Float32Array(n);
      offX = new Float32Array(n);
      offY = new Float32Array(n);
      velX = new Float32Array(n);
      velY = new Float32Array(n);
      curX = new Float32Array(n);
      curY = new Float32Array(n);

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          baseX[i] = c * step;
          baseY[i] = 20 + r * spacing;
        }
      }
      renderFrame((performance.now() - t0) * 0.001);
    }

    function tracePrimaryPath(targetCtx) {
      targetCtx.beginPath();
      for (var r = 0; r < rows; r++) {
        var b = r * cols;
        targetCtx.moveTo(curX[b], curY[b]);
        for (var c = 1; c < cols - 1; c++) {
          var i = b + c;
          var x1 = curX[i], y1 = curY[i];
          var x2 = curX[i + 1], y2 = curY[i + 1];
          targetCtx.quadraticCurveTo(x1, y1, (x1 + x2) * 0.5, (y1 + y2) * 0.5);
        }
        var l = b + cols - 1;
        targetCtx.lineTo(curX[l], curY[l]);
      }
    }

    function renderFrame(timeSec) {
      if (!w || !h) return;
      var rect = hero.getBoundingClientRect();
      updateSectionAtmosphere(hero, rect, timeSec, 0.0);

      var px = pointer.x - rect.left;
      var py = pointer.y - rect.top;
      var heroActive = interactive && pointer.active &&
        pointer.rawY >= rect.top - 40 &&
        pointer.rawY <= rect.bottom + 40 &&
        pointer.rawX >= rect.left &&
        pointer.rawX <= rect.right;

      var R2 = RADIUS * RADIUS;
      var flowT = reduceMotion ? 0 : timeSec;

      /* 1. Knotenpositionen (kontinuierlicher Wellenfluss + Maus-Federphysik) berechnen */
      for (var r = 0; r < rows; r++) {
        var rowPhase = r * 0.38;
        var rowCounter = r * 0.23;
        var b = r * cols;
        for (var c = 0; c < cols; c++) {
          var i = b + c;
          var bx = baseX[i];
          var by = baseY[i];

          var waveY =
            Math.sin(bx * 0.0044 + rowPhase + flowT * 0.68) * 6.8 +
            Math.cos(bx * 0.0102 - rowCounter - flowT * 0.44) * 2.8 +
            Math.sin(bx * 0.0021 - rowPhase * 0.6 + flowT * 0.27) * 3.4;
          var waveX =
            Math.cos(by * 0.006 + rowPhase * 0.5 + flowT * 0.4) * 1.8;

          var rx = bx + waveX;
          var ry = by + waveY;

          var tx = 0, ty = 0;
          if (heroActive) {
            var dx = px - rx;
            var dy = py - ry;
            var d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > 0.01) {
              var d = Math.sqrt(d2);
              var f = 1 - d / RADIUS;
              var pull = Math.min(MAX_PULL * f * f, d * 0.52) / d;
              /* Sanfte Kombination aus Anziehung und vertikaler Wellen-Wölbung */
              tx = dx * pull * 0.85;
              ty = dy * pull + Math.sin(f * Math.PI) * 3.2;
            }
          }

          if (interactive) {
            var ax = (tx - offX[i]) * STIFFNESS;
            var ay = (ty - offY[i]) * STIFFNESS;
            velX[i] = (velX[i] + ax) * DAMPING;
            velY[i] = (velY[i] + ay) * DAMPING;
            offX[i] += velX[i];
            offY[i] += velY[i];
          }

          curX[i] = rx + offX[i];
          curY[i] = ry + offY[i];
        }
      }

      ctx.clearRect(0, 0, w, h);

      /* Ebene 0: Tiefe atmosphärische Horizont-Wellen (Hintergrund) */
      ctx.beginPath();
      var deepStepX = Math.max(36, Math.round(w / 28));
      var deepSpacingY = h / Math.max(1, deepRows);
      for (var dr = 0; dr <= deepRows; dr++) {
        var baseDeepY = 34 + dr * deepSpacingY;
        var prevX = 0, prevY = 0;
        for (var dxPos = 0; dxPos <= w + deepStepX; dxPos += deepStepX) {
          var xClamped = Math.min(w, dxPos);
          var dyWave =
            Math.sin(xClamped * 0.0029 + dr * 0.65 - flowT * 0.36) * 14 +
            Math.cos(xClamped * 0.0064 - dr * 0.4 + flowT * 0.22) * 5.5;
          var wy = baseDeepY + dyWave;
          var wx = xClamped;
          if (heroActive) {
            var ddx = px - wx, ddy = py - wy;
            var dd2 = ddx * ddx + ddy * ddy;
            var deepR = RADIUS * 1.25;
            if (dd2 < deepR * deepR && dd2 > 1) {
              var dd = Math.sqrt(dd2);
              var df = 1 - dd / deepR;
              wy += (ddy / dd) * (df * df * 11);
            }
          }
          if (dxPos === 0) {
            ctx.moveTo(wx, wy);
          } else {
            ctx.quadraticCurveTo(prevX, prevY, (prevX + wx) * 0.5, (prevY + wy) * 0.5);
          }
          prevX = wx; prevY = wy;
        }
      }
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = "rgba(250, 250, 248, " + DEEP_ALPHA + ")";
      ctx.stroke();

      /* Ebene 2 (Oberton-Fäden): Jede 2. Reihe leicht phasenversetzt für feine Tiefe */
      ctx.beginPath();
      for (var cr = 0; cr < rows; cr += 2) {
        var cb = cr * cols;
        for (var cc = 0; cc < cols; cc++) {
          var ci = cb + cc;
          var cx = curX[ci];
          var cy = curY[ci] + Math.sin(cx * 0.0075 - cr * 0.5 - flowT * 0.54) * 4.2 + 5.5;
          if (cc === 0) {
            ctx.moveTo(cx, cy);
          } else {
            var prevI = ci - 1;
            var px0 = curX[prevI];
            var py0 = curY[prevI] + Math.sin(px0 * 0.0075 - cr * 0.5 - flowT * 0.54) * 4.2 + 5.5;
            ctx.quadraticCurveTo(px0, py0, (px0 + cx) * 0.5, (py0 + cy) * 0.5);
          }
        }
      }
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "rgba(250, 250, 248, " + CREST_ALPHA + ")";
      ctx.stroke();

      /* Ebene 1 (Haupt-Fadenfeld) */
      tracePrimaryPath(ctx);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(250, 250, 248, " + PRIMARY_ALPHA + ")";
      ctx.stroke();

      /* Lokaler Cursor-Glanz direkt auf den Vektorlinien (niemals über Text) */
      if (heroActive) {
        var grad = ctx.createRadialGradient(px, py, 8, px, py, RADIUS * 1.08);
        grad.addColorStop(0, "rgba(250, 250, 248, 0.16)");
        grad.addColorStop(0.5, "rgba(250, 250, 248, 0.065)");
        grad.addColorStop(1, "rgba(250, 250, 248, 0)");
        ctx.lineWidth = 1.15;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    function loop(now) {
      rafId = 0;
      if (!visible || document.hidden || reduceMotion) return;
      stepGlobalPointer();
      renderFrame((now - t0) * 0.001);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (rafId || !visible || document.hidden || reduceMotion) return;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    build();
    if (!reduceMotion) start();

    var resizeTimer = 0;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 100);
      }).observe(hero);
    } else {
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 100);
      });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      }, { threshold: 0.01 }).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (visible) start();
    });
  })();

  /* ======================================================================
     2) Unified Section Background System (.sec-fx)
     Verbindet alle Sektionen (#arbeiten, #preise, #betreuung, #kontakt, .legal)
     zu einer gemeinsamen visuellen Familie mit sektionsspezifischer Charakteristik:
     - "work"    (#arbeiten):  Sanfte topografische Konturwellen (hell)
     - "pricing" (#preise):    Strukturiertes Präzisions-Wellen-Raster (hell-alt)
     - "care"    (#betreuung): Ruhiges technisches Radial- & Trägerwellen-Feld
     - "contact" (#kontakt):   Tiefes atmosphärisches Finale-Wellenfeld (dunkel)
     ====================================================================== */
  (function sectionBackgroundSystem() {
    var specs = [
      { sel: "#arbeiten", mode: "work", phase: 1.1 },
      { sel: "#preise", mode: "pricing", phase: 2.3 },
      { sel: "#betreuung", mode: "care", phase: 3.7 },
      { sel: "#kontakt", mode: "contact", phase: 5.1 },
      { sel: "main.legal", mode: "work", phase: 0.7 }
    ];

    var instances = [];
    var t0 = performance.now();
    var rafId = 0;

    function createInstance(el, mode, phase) {
      var canvas = el.querySelector(":scope > .sec-fx");
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = "sec-fx";
        canvas.setAttribute("aria-hidden", "true");
        el.insertBefore(canvas, el.firstChild);
      }
      if (!canvas.getContext) return null;
      var ctx = canvas.getContext("2d");

      var inst = {
        el: el,
        canvas: canvas,
        ctx: ctx,
        mode: mode,
        phase: phase,
        w: 0,
        h: 0,
        visible: false,
        /* Geglätteter lokaler Cursor für weiche Trägheit in jeder Sektion */
        lx: 0,
        ly: 0,
        strength: 0
      };

      inst.resize = function () {
        var cw = el.clientWidth;
        var ch = el.clientHeight;
        if (!cw || !ch) return;
        inst.w = cw;
        inst.h = ch;
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!inst.lx && !inst.ly) {
          inst.lx = cw * 0.5;
          inst.ly = ch * 0.45;
        }
        drawSection(inst, (performance.now() - t0) * 0.001);
      };

      return inst;
    }

    /* Lokale Auslenkung eines Punktes (x, y) durch den Mauszeiger berechnen */
    function cursorDeflect(x, y, px, py, radius, maxPull, strength) {
      if (strength <= 0.005) return { dx: 0, dy: 0, prox: 0 };
      var vx = px - x;
      var vy = py - y;
      var d2 = vx * vx + vy * vy;
      var r2 = radius * radius;
      if (d2 >= r2 || d2 < 0.01) return { dx: 0, dy: 0, prox: 0 };
      var d = Math.sqrt(d2);
      var f = (1 - d / radius) * strength;
      var pull = Math.min(maxPull * f * f, d * 0.45) / d;
      return {
        dx: vx * pull * 0.7,
        dy: vy * pull + Math.sin(f * Math.PI) * 2.5,
        prox: f
      };
    }

    /* 2.1 #arbeiten: Topografische Konturwellen (sehr feiner Kontrast auf #FAFAF8) */
    function drawWork(inst, t, px, py) {
      var ctx = inst.ctx, w = inst.w, h = inst.h, s = inst.strength;
      var spacing = w < 720 ? 52 : 44;
      var stepX = w < 720 ? 36 : 28;
      var rows = Math.ceil(h / spacing) + 1;
      var radius = 225;

      /* Sekundäre Echo-Konturen (Höhenlinien-Anmutung) */
      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var by = 26 + r * spacing + 9;
        var prevX = 0, prevY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0036 + r * 0.58 + t * 0.34 + 0.45) * 10.5 +
            Math.cos(xc * 0.0082 - r * 0.34 - t * 0.22) * 4.2;
          var def = cursorDeflect(xc, wy, px, py, radius, 14, s);
          var fx = xc + def.dx;
          var fy = wy + def.dy;
          if (x === 0) ctx.moveTo(fx, fy);
          else ctx.quadraticCurveTo(prevX, prevY, (prevX + fx) * 0.5, (prevY + fy) * 0.5);
          prevX = fx; prevY = fy;
        }
      }
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.024)";
      ctx.stroke();

      /* Primäre topografische Konturlinien */
      ctx.beginPath();
      for (var r2 = 0; r2 < rows; r2++) {
        var by2 = 26 + r2 * spacing;
        var pX = 0, pY = 0;
        for (var x2 = 0; x2 <= w + stepX; x2 += stepX) {
          var xc2 = Math.min(w, x2);
          var wy2 = by2 +
            Math.sin(xc2 * 0.0036 + r2 * 0.58 + t * 0.34) * 10.5 +
            Math.cos(xc2 * 0.0082 - r2 * 0.34 - t * 0.22) * 4.2 +
            Math.sin(xc2 * 0.0018 - r2 * 0.25 + t * 0.16) * 4.0;
          var def2 = cursorDeflect(xc2, wy2, px, py, radius, 18, s);
          var fx2 = xc2 + def2.dx;
          var fy2 = wy2 + def2.dy;
          if (x2 === 0) ctx.moveTo(fx2, fy2);
          else ctx.quadraticCurveTo(pX, pY, (pX + fx2) * 0.5, (pY + fy2) * 0.5);
          pX = fx2; pY = fy2;
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.048)";
      ctx.stroke();

      if (s > 0.02) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.095 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.038 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    /* 2.2 #preise: Strukturiertes Präzisions-Wellen-Raster (Ordnung, Klarheit, Präzision) */
    function drawPricing(inst, t, px, py) {
      var ctx = inst.ctx, w = inst.w, h = inst.h, s = inst.strength;
      var colSpacing = w < 720 ? 96 : 116;
      var rowSpacing = w < 720 ? 50 : 44;
      var stepX = w < 720 ? 34 : 26;
      var stepY = 36;
      var radius = 220;

      /* 1.Feine vertikale Struktur-Haarlinien */
      ctx.beginPath();
      var startColX = (w % colSpacing) * 0.5;
      for (var gx = startColX; gx < w; gx += colSpacing) {
        var prevX = gx, prevY = 0;
        for (var gy = 0; gy <= h + stepY; gy += stepY) {
          var yc = Math.min(h, gy);
          var driftX = Math.sin(yc * 0.006 + gx * 0.01 + t * 0.25) * 1.4;
          var defV = cursorDeflect(gx + driftX, yc, px, py, radius, 8, s);
          var fx = gx + driftX + defV.dx;
          var fy = yc;
          if (gy === 0) ctx.moveTo(fx, fy);
          else ctx.quadraticCurveTo(prevX, prevY, (prevX + fx) * 0.5, (prevY + fy) * 0.5);
          prevX = fx; prevY = fy;
        }
      }
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.025)";
      ctx.stroke();

      /* 2. Geordnete, harmonische Horizontal-Wellen */
      var rows = Math.ceil(h / rowSpacing) + 1;
      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var by = 24 + r * rowSpacing;
        var pX = 0, pY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0046 + r * 0.42 + t * 0.30) * 5.2 +
            Math.cos(xc * 0.0094 - r * 0.22 - t * 0.20) * 2.1;
          var defH = cursorDeflect(xc, wy, px, py, radius, 16, s);
          var fxH = xc + defH.dx;
          var fyH = wy + defH.dy;
          if (x === 0) ctx.moveTo(fxH, fyH);
          else ctx.quadraticCurveTo(pX, pY, (pX + fxH) * 0.5, (pY + fyH) * 0.5);
          pX = fxH; pY = fyH;
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.048)";
      ctx.stroke();

      if (s > 0.02) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.095 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.036 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      /* 3. Feine Präzisions-Kreuzmarken (+) an ausgewählten Rasterknoten */
      ctx.beginPath();
      var nearTicks = [];
      for (var rTick = 1; rTick < rows; rTick += 2) {
        var tyBase = 24 + rTick * rowSpacing;
        for (var txBase = startColX; txBase < w; txBase += colSpacing * 2) {
          var twy = tyBase +
            Math.sin(txBase * 0.0046 + rTick * 0.42 + t * 0.30) * 5.2 +
            Math.cos(txBase * 0.0094 - rTick * 0.22 - t * 0.20) * 2.1;
          var defT = cursorDeflect(txBase, twy, px, py, radius, 16, s);
          var cx = txBase + defT.dx;
          var cy = twy + defT.dy;
          ctx.moveTo(cx - 3, cy);
          ctx.lineTo(cx + 3, cy);
          ctx.moveTo(cx, cy - 3);
          ctx.lineTo(cx, cy + 3);
          if (defT.prox > 0.08) {
            nearTicks.push({ x: cx, y: cy, p: defT.prox });
          }
        }
      }
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.065)";
      ctx.stroke();

      if (nearTicks.length) {
        ctx.beginPath();
        for (var k = 0; k < nearTicks.length; k++) {
          var nt = nearTicks[k];
          ctx.moveTo(nt.x - 3.5, nt.y);
          ctx.lineTo(nt.x + 3.5, nt.y);
          ctx.moveTo(nt.x, nt.y - 3.5);
          ctx.lineTo(nt.x, nt.y + 3.5);
        }
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(21, 23, 25, " + (0.16 * s).toFixed(3) + ")";
        ctx.stroke();
      }
    }

    /* 2.3 #betreuung: Ruhiges technisches Radial- & Trägerwellen-Feld (Stabilität & Verlässlichkeit) */
    function drawCare(inst, t, px, py) {
      var ctx = inst.ctx, w = inst.w, h = inst.h, s = inst.strength;
      var radius = 215;

      /* 1. Konzentrische technische Feld-Ellipsen um ein ruhiges Zentrum */
      var focusX = w * 0.5 + Math.sin(t * 0.22) * 32 + (px - w * 0.5) * 0.14 * s;
      var focusY = h * 0.52 + Math.cos(t * 0.18) * 20 + (py - h * 0.52) * 0.14 * s;
      var maxR = Math.max(w, h) * 0.62;
      var ringCount = 6;

      ctx.beginPath();
      for (var ri = 1; ri <= ringCount; ri++) {
        var baseR = (maxR / ringCount) * ri + Math.sin(t * 0.35 + ri * 0.7) * 5;
        var rx = baseR * 1.18;
        var ry = baseR * 0.64;
        var segs = 64;
        for (var a = 0; a <= segs; a++) {
          var ang = (a / segs) * Math.PI * 2;
          var wobble = Math.sin(ang * 3 + t * 0.28 + ri) * 4.5 + Math.cos(ang * 2 - t * 0.22) * 3.0;
          var ex = focusX + Math.cos(ang) * (rx + wobble);
          var ey = focusY + Math.sin(ang) * (ry + wobble * 0.65);
          var defE = cursorDeflect(ex, ey, px, py, radius, 12, s);
          var fx = ex + defE.dx;
          var fy = ey + defE.dy;
          if (a === 0) ctx.moveTo(fx, fy);
          else ctx.lineTo(fx, fy);
        }
      }
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.032)";
      ctx.stroke();

      /* 2. Ruhige, verlässliche horizontale Trägerwellen */
      var rowSpacing = w < 720 ? 50 : 44;
      var stepX = w < 720 ? 34 : 26;
      var rows = Math.ceil(h / rowSpacing) + 1;

      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var by = 24 + r * rowSpacing;
        var pX = 0, pY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0040 + r * 0.48 + t * 0.26) * 6.5 +
            Math.cos(xc * 0.0078 - r * 0.28 - t * 0.18) * 2.6;
          var defW = cursorDeflect(xc, wy, px, py, radius, 15, s);
          var fxW = xc + defW.dx;
          var fyW = wy + defW.dy;
          if (x === 0) ctx.moveTo(fxW, fyW);
          else ctx.quadraticCurveTo(pX, pY, (pX + fxW) * 0.5, (pY + fyW) * 0.5);
          pX = fxW; pY = fyW;
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.044)";
      ctx.stroke();

      if (s > 0.02) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.09 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.034 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    /* 2.4 #kontakt: Tiefes atmosphärisches Finale-Wellenfeld (Dunkler Studio-Abschluss) */
    function drawContact(inst, t, px, py) {
      var ctx = inst.ctx, w = inst.w, h = inst.h, s = inst.strength;
      var spacing = w < 720 ? 42 : 36;
      var stepX = w < 720 ? 34 : 26;
      var rows = Math.ceil(h / spacing) + 1;
      var radius = 235;

      /* Tiefe Hintergrund-Dünung */
      ctx.beginPath();
      for (var r = 0; r < rows; r += 2) {
        var by = 22 + r * spacing + 12;
        var prevX = 0, prevY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0032 + r * 0.45 - t * 0.28) * 11.5 +
            Math.cos(xc * 0.0070 - r * 0.30 + t * 0.20) * 4.5;
          var def = cursorDeflect(xc, wy, px, py, radius * 1.15, 13, s);
          var fx = xc + def.dx;
          var fy = wy + def.dy;
          if (x === 0) ctx.moveTo(fx, fy);
          else ctx.quadraticCurveTo(prevX, prevY, (prevX + fx) * 0.5, (prevY + fy) * 0.5);
          prevX = fx; prevY = fy;
        }
      }
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = "rgba(250, 250, 248, 0.028)";
      ctx.stroke();

      /* Primäre atmosphärische Wellenlinien */
      ctx.beginPath();
      for (var r2 = 0; r2 < rows; r2++) {
        var by2 = 22 + r2 * spacing;
        var pX = 0, pY = 0;
        for (var x2 = 0; x2 <= w + stepX; x2 += stepX) {
          var xc2 = Math.min(w, x2);
          var wy2 = by2 +
            Math.sin(xc2 * 0.0042 + r2 * 0.40 + t * 0.40) * 7.5 +
            Math.cos(xc2 * 0.0096 - r2 * 0.24 - t * 0.28) * 3.0;
          var def2 = cursorDeflect(xc2, wy2, px, py, radius, 20, s);
          var fx2 = xc2 + def2.dx;
          var fy2 = wy2 + def2.dy;
          if (x2 === 0) ctx.moveTo(fx2, fy2);
          else ctx.quadraticCurveTo(pX, pY, (pX + fx2) * 0.5, (pY + fy2) * 0.5);
          pX = fx2; pY = fy2;
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(250, 250, 248, 0.058)";
      ctx.stroke();

      if (s > 0.02) {
        var grad = ctx.createRadialGradient(px, py, 8, px, py, radius * 1.06);
        grad.addColorStop(0, "rgba(250, 250, 248, " + (0.135 * s).toFixed(3) + ")");
        grad.addColorStop(0.5, "rgba(250, 250, 248, " + (0.05 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(250, 250, 248, 0)");
        ctx.lineWidth = 1.15;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    function drawSection(inst, timeSec) {
      if (!inst.w || !inst.h) return;
      var rect = inst.el.getBoundingClientRect();
      var flowT = reduceMotion ? 0 : timeSec;

      updateSectionAtmosphere(inst.el, rect, flowT, inst.phase);

      var inBounds = interactive && pointer.active &&
        pointer.rawY >= rect.top - 90 &&
        pointer.rawY <= rect.bottom + 90 &&
        pointer.rawX >= rect.left - 40 &&
        pointer.rawX <= rect.right + 40;

      var targetStrength = inBounds ? 1 : 0;
      inst.strength += (targetStrength - inst.strength) * 0.12;

      if (inBounds) {
        var tx = pointer.x - rect.left;
        var ty = pointer.y - rect.top;
        inst.lx += (tx - inst.lx) * 0.18;
        inst.ly += (ty - inst.ly) * 0.18;
      }

      inst.ctx.clearRect(0, 0, inst.w, inst.h);

      if (inst.mode === "work") {
        drawWork(inst, flowT, inst.lx, inst.ly);
      } else if (inst.mode === "pricing") {
        drawPricing(inst, flowT, inst.lx, inst.ly);
      } else if (inst.mode === "care") {
        drawCare(inst, flowT, inst.lx, inst.ly);
      } else if (inst.mode === "contact") {
        drawContact(inst, flowT, inst.lx, inst.ly);
      }
    }

    function anyVisible() {
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].visible) return true;
      }
      return false;
    }

    function frame(now) {
      rafId = 0;
      if (document.hidden || reduceMotion || !anyVisible()) return;
      stepGlobalPointer();
      var tSec = (now - t0) * 0.001;
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].visible) {
          drawSection(instances[i], tSec);
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (rafId || document.hidden || reduceMotion || !anyVisible()) return;
      rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    for (var s = 0; s < specs.length; s++) {
      var el = document.querySelector(specs[s].sel);
      if (!el) continue;
      var inst = createInstance(el, specs[s].mode, specs[s].phase);
      if (inst) instances.push(inst);
    }

    if (!instances.length) return;

    for (var i = 0; i < instances.length; i++) {
      instances[i].resize();
    }

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          var target = entries[e].target;
          for (var j = 0; j < instances.length; j++) {
            if (instances[j].el === target) {
              instances[j].resize();
            }
          }
        }
      });
      for (var k = 0; k < instances.length; k++) {
        ro.observe(instances[k].el);
      }
    } else {
      window.addEventListener("resize", function () {
        for (var j = 0; j < instances.length; j++) instances[j].resize();
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          var target = entries[e].target;
          for (var j = 0; j < instances.length; j++) {
            if (instances[j].el === target) {
              instances[j].visible = entries[e].isIntersecting;
              if (instances[j].visible && reduceMotion) {
                drawSection(instances[j], 0);
              }
            }
          }
        }
        if (anyVisible()) startLoop();
        else stopLoop();
      }, { threshold: 0.01, rootMargin: "100px 0px 100px 0px" });

      for (var m = 0; m < instances.length; m++) {
        io.observe(instances[m].el);
      }
    } else {
      for (var n = 0; n < instances.length; n++) instances[n].visible = true;
      startLoop();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopLoop();
      else if (anyVisible()) startLoop();
    });
  })();

  /* ======================================================================
     3) 3D-Neigung der Portfolio-Vorschauen (Klicks vollständig bewahrt)
     Listener liegen auf dem <a class="project__link">; die Referenz-Box wird
     aus dem untransformierten Anker gelesen, sodass die 3D-Neigung niemals
     den Hit-Test unter dem Mauszeiger verschiebt oder Klicks abfängt.
     ====================================================================== */
  (function tilt() {
    if (!interactive) return;
    var MAX_DEG = 5, SCALE = 1.024;

    Array.prototype.forEach.call(document.querySelectorAll(".project"), function (card) {
      var link = card.querySelector(".project__link");
      var media = card.querySelector(".project__media");
      if (!link || !media) return;
      var glare = media.querySelector(".project__glare");
      if (!glare) {
        glare = document.createElement("span");
        glare.className = "project__glare";
        glare.setAttribute("aria-hidden", "true");
        media.appendChild(glare);
      }

      var cx = 0, cy = 0, raf = 0;

      function apply() {
        raf = 0;
        var rect = link.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var mediaH = media.offsetHeight || rect.height;
        var nx = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
        var ny = Math.min(1, Math.max(0, (cy - rect.top) / mediaH));
        media.style.setProperty("--ry", ((nx - 0.5) * 2 * MAX_DEG).toFixed(2) + "deg");
        media.style.setProperty("--rx", ((0.5 - ny) * 2 * MAX_DEG).toFixed(2) + "deg");
        media.style.setProperty("--s", SCALE);
        media.style.setProperty("--gx", (nx * 100).toFixed(1) + "%");
        media.style.setProperty("--gy", (ny * 100).toFixed(1) + "%");
      }
      function reset() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.classList.remove("is-tilting");
        media.style.setProperty("--rx", "0deg");
        media.style.setProperty("--ry", "0deg");
        media.style.setProperty("--s", 1);
      }

      link.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        card.classList.add("is-tilting");
      });
      link.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        card.classList.add("is-tilting");
        cx = e.clientX; cy = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      link.addEventListener("pointerleave", reset);
    });
  })();

  /* ======================================================================
     4) Zeigerabhängige Beleuchtung & feine Magnetik für Karten & Buttons
     Aktualisiert --mx / --my für das weichgezeichnete Halo hinter der Karte
     sowie den feinen Oberflächenglanz und eine subtile Button-Reaktion,
     ohne Text oder Klicks zu beeinflussen.
     ====================================================================== */
  (function cardGlow() {
    if (!interactive) return;
    Array.prototype.forEach.call(document.querySelectorAll(".plan, .care__item, .summary, .rc, .btn"), function (el) {
      var raf = 0, cx = 0, cy = 0;
      var isBtn = el.classList.contains("btn");
      function update() {
        raf = 0;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = Math.min(1, Math.max(0, (cx - r.left) / r.width));
        var ny = Math.min(1, Math.max(0, (cy - r.top) / r.height));
        el.style.setProperty("--mx", (nx * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (ny * 100).toFixed(1) + "%");
        if (isBtn) {
          el.style.setProperty("--tx", ((nx - 0.5) * 3.2).toFixed(2) + "px");
          el.style.setProperty("--ty", ((ny - 0.5) * 2.2).toFixed(2) + "px");
        }
      }
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        cx = e.clientX; cy = e.clientY;
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive: true });
      if (isBtn) {
        el.addEventListener("pointerleave", function () {
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
          el.style.setProperty("--tx", "0px");
          el.style.setProperty("--ty", "0px");
        });
      }
    });
  })();

  /* ======================================================================
     5) Interaktive Typografie (Wort-Hover für Haupt-Slogans, Buchstaben-Hover
        für statischen Fließ- und Oberflächentext)
     Nutzt Intl.Segmenter für korrekte Unicode-Grapheme, bewahrt Zeilenumbruch
     durch Wort-Wrapper (.t-w), erhält arabische Ligaturen (Wort-Level) und
     unterstützt chinesische Wort-/Zeichen-Segmentierung ohne JS-Hover-Listener.
     ====================================================================== */
  (function typography() {
    if (!interactive) return;

    var hasSegmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";
    var graphemeSeg = hasSegmenter ? new Intl.Segmenter("de", { granularity: "grapheme" }) : null;
    var zhWordSeg = hasSegmenter ? new Intl.Segmenter("zh-Hans", { granularity: "word" }) : null;
    var arabicRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    var cjkRe = /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

    function toGraphemes(str) {
      if (graphemeSeg) {
        var out = [], it = graphemeSeg.segment(str)[Symbol.iterator](), step;
        while (!(step = it.next()).done) out.push(step.value.segment);
        return out;
      }
      return Array.from ? Array.from(str) : str.split("");
    }

    function toZhWords(str) {
      if (zhWordSeg) {
        var raw = [], it = zhWordSeg.segment(str)[Symbol.iterator](), step;
        while (!(step = it.next()).done) raw.push(step.value);
        /* Satzzeichen direkt an das vorangehende Wort binden, damit sie nie isoliert umbrechen */
        var merged = [];
        for (var i = 0; i < raw.length; i++) {
          var seg = raw[i].segment;
          if (!raw[i].isWordLike && merged.length && /^[。，、！？：；.!?:;]$/.test(seg)) {
            merged[merged.length - 1].text += seg;
          } else {
            merged.push({ text: seg, isSpace: /^\s+$/.test(seg) });
          }
        }
        return merged;
      }
      return [{ text: str, isSpace: false }];
    }

    var SKIP_TAGS = {
      SCRIPT: 1, STYLE: 1, SVG: 1, CANVAS: 1, INPUT: 1, TEXTAREA: 1,
      SELECT: 1, OPTION: 1, NOSCRIPT: 1, IMG: 1, BR: 1, HR: 1
    };

    function shouldSkipElement(el) {
      if (!el || el.nodeType !== 1) return true;
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.hasAttribute("data-typo-done") || el.hasAttribute("data-typo-skip") || el.isContentEditable) return true;
      if (el.classList.contains("hp") || el.classList.contains("err") ||
          el.classList.contains("status") || el.classList.contains("arrow") ||
          el.classList.contains("plan__sel") || el.classList.contains("care__sel") ||
          el.classList.contains("care-context__check") || el.classList.contains("lang")) {
        return true;
      }
      return false;
    }

    function getActiveLang() {
      return document.documentElement.getAttribute("lang") || "de";
    }

    function segmentTextNode(node, mode) {
      var raw = node.nodeValue;
      if (!raw || !/\S/.test(raw)) return;

      var lang = getActiveLang();
      var isArabic = lang === "ar" || arabicRe.test(raw);
      var isCjk = lang === "zh-Hans" || cjkRe.test(raw);

      var segWrap = document.createElement("span");
      segWrap.className = "t-seg";
      segWrap.setAttribute("data-typo-done", "1");

      /* 1. Chinesische Hauptüberschriften: lexikalische Wort-/Phrasen-Segmentierung */
      if (isCjk && mode === "words") {
        var zhTokens = toZhWords(raw);
        for (var z = 0; z < zhTokens.length; z++) {
          if (zhTokens[z].isSpace) {
            segWrap.appendChild(document.createTextNode(zhTokens[z].text));
          } else {
            var zw = document.createElement("span");
            zw.className = "t-word";
            zw.setAttribute("data-typo-done", "1");
            zw.textContent = zhTokens[z].text;
            segWrap.appendChild(zw);
          }
        }
        if (node.parentNode) node.parentNode.replaceChild(segWrap, node);
        return;
      }

      /* 2. Chinesischer Fließtext: Einzelzeichen-Hover ohne nowrap-Blockade */
      if (isCjk && mode !== "words") {
        var cjkChars = toGraphemes(raw);
        for (var k = 0; k < cjkChars.length; k++) {
          var g = cjkChars[k];
          if (/^\s+$/.test(g)) {
            segWrap.appendChild(document.createTextNode(g));
          } else {
            var cs = document.createElement("span");
            cs.className = "t-ch";
            cs.textContent = g;
            segWrap.appendChild(cs);
          }
        }
        if (node.parentNode) node.parentNode.replaceChild(segWrap, node);
        return;
      }

      /* 3. Arabisch & alle alphabetischen Sprachen */
      var parts = raw.split(/([ \t\r\n]+)/);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!p) continue;
        if (/^[ \t\r\n]+$/.test(p)) {
          segWrap.appendChild(document.createTextNode(p));
        } else if (mode === "words") {
          var w = document.createElement("span");
          w.className = "t-word";
          w.setAttribute("data-typo-done", "1");
          w.textContent = p;
          segWrap.appendChild(w);
        } else if (isArabic || arabicRe.test(p)) {
          /* Arabisch: Wort als verbundene Einheit animieren, damit Buchstabenformen
             und Ligaturen niemals durch Einzel-Spans unterbrochen werden */
          var aw = document.createElement("span");
          aw.className = "t-w t-w--hover";
          aw.setAttribute("data-typo-done", "1");
          aw.textContent = p;
          segWrap.appendChild(aw);
        } else {
          var wWrap = document.createElement("span");
          wWrap.className = "t-w";
          wWrap.setAttribute("data-typo-done", "1");
          var chars = toGraphemes(p);
          for (var c = 0; c < chars.length; c++) {
            var ch = chars[c];
            if (ch === "\u00A0") {
              wWrap.appendChild(document.createTextNode(ch));
            } else {
              var s = document.createElement("span");
              s.className = "t-ch";
              s.textContent = ch;
              wWrap.appendChild(s);
            }
          }
          segWrap.appendChild(wWrap);
        }
      }
      if (node.parentNode) node.parentNode.replaceChild(segWrap, node);
    }

    function enhanceTree(root, inheritedMode) {
      if (!root || shouldSkipElement(root)) return;
      var mode = root.getAttribute("data-typo") === "words" ? "words" : (inheritedMode || "chars");
      if (!root.children.length && root.textContent && !root.hasAttribute("data-raw-text")) {
        root.setAttribute("data-raw-text", root.textContent);
      }
      var childNodes = Array.prototype.slice.call(root.childNodes);
      for (var i = 0; i < childNodes.length; i++) {
        var n = childNodes[i];
        if (n.nodeType === 3) {
          segmentTextNode(n, mode);
        } else if (n.nodeType === 1) {
          enhanceTree(n, mode);
        }
      }
    }

    window.SFY_TYPO_ENHANCE = function (el) {
      if (!el) return;
      var mode = (el.closest && el.closest('[data-typo="words"]')) ? "words" : "chars";
      enhanceTree(el, mode);
    };

    window.SFY_TYPO_REBUILD = function () {
      enhanceTree(document.body, "chars");
    };

    enhanceTree(document.body, "chars");
  })();
})();
