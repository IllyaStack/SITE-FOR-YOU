/* ==========================================================================
   SITE FOR YOU. — Unified Animated Background System & Interactive Effects
   1) Global Pointer & Controlled Section Glow State Machine:
      Cursor glow → smooth fade-out (420 ms) → invisible coordinate reset →
      default ambient glow fade-in (640 ms) → continuous ambient drift.
   2) Refined Single-Family Hero Wave Field (#hero-fx) & Section Vector System (.sec-fx):
      - .hero:      Expressive harmonic filament field (consolidated, no duplicate layers)
      - #arbeiten:  Light Topographic Contour Waves
      - #preise:    Structured Precision Wave-Grid Hybrid
      - #betreuung: Calm Technical Radial-Contour Field
      - #kontakt:   Quiet Nocturnal Finale Wave Field (consolidated, no duplicate layers)
   3) 3D Portfolio Card Tilt, Glare & Cinematic Focus Blur (.project)
   4) Pointer-Reactive Surface Illumination (.plan, .care__item, .summary, .rc, .btn)
   5) Multilingual Interactive Typography (.t-word, .t-w--hover, .t-ch) +
      Delegated Neighboring-Letter Underline Ripple (.is-u1, .is-u2)
   All background layers use pointer-events: none, never blur active text, pause when
   offscreen, and respect prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var interactive = finePointer && !reduceMotion;

  /* ======================================================================
     0) Globaler Zeiger-Zustand & Sanfte Glow-Zustandsmaschine
        Regel: Ein sichtbares Lichtfeld springt oder teleportiert niemals.
        Cursor-Licht → sanftes Ausblenden an letzter Position (420 ms) →
        unsichtbares Zurücksetzen auf Standardposition (bei alpha = 0) →
        sanftes Einblenden des ruhigen Standard-Lichtfelds (640 ms).
     ====================================================================== */
  var FADE_OUT_MS = 420;
  var FADE_IN_AMBIENT_MS = 640;
  var ENTER_CROSSFADE_OUT_MS = 160;
  var ENTER_FADE_IN_MS = 320;

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
    pointer.x += (pointer.rawX - pointer.x) * 0.16;
    pointer.y += (pointer.rawY - pointer.y) * 0.16;
  }

  function easeOutCubic(t) {
    var inv = 1 - Math.min(1, Math.max(0, t));
    return 1 - inv * inv * inv;
  }

  function easeInOutCubic(t) {
    var x = Math.min(1, Math.max(0, t));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function clamp(min, max, val) {
    return Math.min(max, Math.max(min, val));
  }

  function createGlowController(el, phaseOffset) {
    var glow = {
      el: el,
      phase: phaseOffset || 0,
      state: "ambient", /* "ambient" | "entering-fade-out" | "cursor" | "fading-out" | "fading-in-ambient" */
      alpha: 1,
      cursorAlpha: 0,
      pctX: 50,
      pctY: 42,
      localX: 0,
      localY: 0,
      initedLocal: false,
      hovered: false,
      stateStart: 0,
      fromAlpha: 1,
      fromCursorAlpha: 0,
      resetDoneCount: 0
    };

    function getDefaultPct(timeSec) {
      return {
        x: 50 + Math.sin(timeSec * 0.32 + glow.phase) * 14,
        y: 42 + Math.cos(timeSec * 0.25 + glow.phase * 1.3) * 10
      };
    }

    function triggerEnter(rect, clientX, clientY, now) {
      if (!rect || !rect.width || !rect.height) return;
      var tx = clamp(0, rect.width, clientX - rect.left);
      var ty = clamp(0, rect.height, clientY - rect.top);
      var entryPctX = clamp(14, 86, (tx / rect.width) * 100);
      var entryPctY = clamp(16, 84, (ty / rect.height) * 100);
      var dist = Math.hypot(entryPctX - glow.pctX, entryPctY - glow.pctY);

      if (glow.state === "fading-out") {
        /* Schneller Wiedereintritt während des Ausblendens */
        if (dist <= 16 || glow.alpha <= 0.04) {
          if (glow.alpha <= 0.04) {
            glow.localX = tx;
            glow.localY = ty;
            glow.pctX = entryPctX;
            glow.pctY = entryPctY;
          }
          glow.state = "cursor";
          glow.fromAlpha = glow.alpha;
          glow.fromCursorAlpha = glow.cursorAlpha;
          glow.stateStart = now;
        } else {
          /* Eintritt weit entfernt: erst auf 0 fertig ausblenden, dann unsichtbar umsetzen */
          glow.state = "entering-fade-out";
          glow.fromAlpha = glow.alpha;
          glow.fromCursorAlpha = glow.cursorAlpha;
          glow.stateStart = now;
        }
      } else if (glow.alpha > 0.05 && dist > 12) {
        /* Sanfter Crossfade, damit das Licht beim Eintritt weit abseits der Mitte niemals springt */
        glow.state = "entering-fade-out";
        glow.fromAlpha = glow.alpha;
        glow.fromCursorAlpha = glow.cursorAlpha;
        glow.stateStart = now;
      } else {
        if (glow.alpha <= 0.05 || !glow.initedLocal) {
          glow.localX = tx;
          glow.localY = ty;
          glow.pctX = entryPctX;
          glow.pctY = entryPctY;
          glow.initedLocal = true;
        }
        glow.state = "cursor";
        glow.fromAlpha = glow.alpha;
        glow.fromCursorAlpha = glow.cursorAlpha;
        glow.stateStart = now;
      }
    }

    function triggerLeave(now) {
      if (glow.state === "ambient" || glow.state === "fading-in-ambient" || glow.state === "fading-out") {
        return;
      }
      /* Letzte bekannte Position einfrieren und dort sanft auf 0 ausblenden */
      glow.state = "fading-out";
      glow.fromAlpha = glow.alpha;
      glow.fromCursorAlpha = glow.cursorAlpha;
      glow.stateStart = now;
    }

    if (interactive && el) {
      el.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        pointer.rawX = e.clientX;
        pointer.rawY = e.clientY;
        pointer.active = true;
        var rect = el.getBoundingClientRect();
        glow.hovered = true;
        triggerEnter(rect, e.clientX, e.clientY, performance.now());
      }, { passive: true });

      el.addEventListener("pointerleave", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        glow.hovered = false;
        triggerLeave(performance.now());
      }, { passive: true });
    }

    glow.step = function (rect, now, timeSec) {
      if (!rect || !rect.width || !rect.height) return;
      var def = getDefaultPct(timeSec);

      if (!glow.initedLocal) {
        glow.localX = rect.width * (def.x / 100);
        glow.localY = rect.height * (def.y / 100);
        glow.pctX = def.x;
        glow.pctY = def.y;
        glow.initedLocal = true;
      }

      /* Geometrische Prüfung (z. B. wenn durch Scrollen die Sektion unter dem Mauszeiger wechselt) */
      var insideGeom = interactive && pointer.active &&
        pointer.rawY >= rect.top &&
        pointer.rawY <= rect.bottom &&
        pointer.rawX >= rect.left &&
        pointer.rawX <= rect.right;

      if (insideGeom && !glow.hovered && glow.state !== "cursor" && glow.state !== "entering-fade-out") {
        glow.hovered = true;
        triggerEnter(rect, pointer.rawX, pointer.rawY, now);
      } else if (!insideGeom && glow.hovered) {
        glow.hovered = false;
        triggerLeave(now);
      }

      if (glow.state === "fading-out") {
        var pOut = Math.min(1, Math.max(0, (now - glow.stateStart) / FADE_OUT_MS));
        var kOut = 1 - easeOutCubic(pOut);
        glow.alpha = glow.fromAlpha * kOut;
        glow.cursorAlpha = glow.fromCursorAlpha * kOut;
        /* WICHTIG: glow.pctX, glow.pctY, glow.localX, glow.localY bleiben während des Ausblendens
           exakt an ihrer letzten bekannten Position eingefroren! */
        if (pOut >= 1) {
          glow.alpha = 0;
          glow.cursorAlpha = 0;
          /* Erst bei vollständiger Unsichtbarkeit (alpha = 0) Position auf Standard zurücksetzen */
          glow.pctX = def.x;
          glow.pctY = def.y;
          glow.localX = rect.width * (def.x / 100);
          glow.localY = rect.height * (def.y / 100);
          glow.resetDoneCount++;
          glow.state = "fading-in-ambient";
          glow.stateStart = now;
        }
      } else if (glow.state === "fading-in-ambient") {
        var pIn = Math.min(1, Math.max(0, (now - glow.stateStart) / FADE_IN_AMBIENT_MS));
        glow.pctX = def.x;
        glow.pctY = def.y;
        glow.localX = rect.width * (def.x / 100);
        glow.localY = rect.height * (def.y / 100);
        glow.alpha = easeInOutCubic(pIn);
        glow.cursorAlpha = 0;
        if (pIn >= 1) {
          glow.alpha = 1;
          glow.state = "ambient";
        }
      } else if (glow.state === "entering-fade-out") {
        var pCross = Math.min(1, Math.max(0, (now - glow.stateStart) / ENTER_CROSSFADE_OUT_MS));
        var kCross = 1 - easeOutCubic(pCross);
        glow.alpha = glow.fromAlpha * kCross;
        glow.cursorAlpha = glow.fromCursorAlpha * kCross;
        if (pCross >= 1) {
          glow.alpha = 0;
          glow.cursorAlpha = 0;
          var tx0 = clamp(0, rect.width, pointer.rawX - rect.left);
          var ty0 = clamp(0, rect.height, pointer.rawY - rect.top);
          glow.localX = tx0;
          glow.localY = ty0;
          glow.pctX = clamp(14, 86, (tx0 / rect.width) * 100);
          glow.pctY = clamp(16, 84, (ty0 / rect.height) * 100);
          glow.state = "cursor";
          glow.fromAlpha = 0;
          glow.fromCursorAlpha = 0;
          glow.stateStart = now;
        }
      } else if (glow.state === "cursor") {
        var tx = clamp(0, rect.width, pointer.rawX - rect.left);
        var ty = clamp(0, rect.height, pointer.rawY - rect.top);
        glow.localX += (tx - glow.localX) * 0.2;
        glow.localY += (ty - glow.localY) * 0.2;
        glow.pctX = clamp(14, 86, (glow.localX / rect.width) * 100);
        glow.pctY = clamp(16, 84, (glow.localY / rect.height) * 100);

        var pCur = Math.min(1, Math.max(0, (now - glow.stateStart) / ENTER_FADE_IN_MS));
        var kCur = easeOutCubic(pCur);
        glow.alpha = glow.fromAlpha + (1 - glow.fromAlpha) * kCur;
        glow.cursorAlpha = glow.fromCursorAlpha + (1 - glow.fromCursorAlpha) * kCur;
      } else {
        /* "ambient" */
        glow.pctX = def.x;
        glow.pctY = def.y;
        glow.localX = rect.width * (def.x / 100);
        glow.localY = rect.height * (def.y / 100);
        glow.alpha = 1;
        glow.cursorAlpha = 0;
      }

      el.style.setProperty("--atmo-x", glow.pctX.toFixed(1) + "%");
      el.style.setProperty("--atmo-y", glow.pctY.toFixed(1) + "%");
      el.style.setProperty("--atmo-alpha", glow.alpha.toFixed(3));
    };

    if (el) el._sfyGlow = glow;
    return glow;
  }

  /* ======================================================================
     1) Hero Wave Field (#hero-fx)
        Konsolidiertes, harmonisch fließendes Fadenfeld ohne überlappende
        Duplikat-Wellen. Tiefe entsteht durch subtile Phasen- und Kontrast-
        abstufung zwischen Haupt- und Nebenfäden derselben Wellenfamilie.
     ====================================================================== */
  (function heroWaveField() {
    var canvas = document.getElementById("hero-fx");
    var hero = canvas && canvas.parentElement;
    if (!canvas || !canvas.getContext || !hero) return;
    var ctx = canvas.getContext("2d");

    var PRIMARY_ALPHA = 0.072;
    var SUB_ALPHA = 0.038;
    var RADIUS = 230;
    var MAX_PULL = 24;
    var STIFFNESS = 0.072;
    var DAMPING = 0.82;

    var w = 0, h = 0, rows = 0, cols = 0;
    var baseX, baseY, offX, offY, velX, velY, curX, curY;
    var visible = true, rafId = 0;
    var t0 = performance.now();
    var glow = createGlowController(hero, 0.0);

    function build() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var spacing = w < 720 ? 36 : 32;
      var step = w < 720 ? 30 : 25;
      rows = Math.ceil(h / spacing) + 1;
      cols = Math.ceil(w / step) + 1;

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
          baseY[i] = 22 + r * spacing;
        }
      }
      var now = performance.now();
      renderFrame(now, (now - t0) * 0.001);
    }

    function traceRowsByParity(targetCtx, parity) {
      targetCtx.beginPath();
      for (var r = parity; r < rows; r += 2) {
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

    function renderFrame(now, timeSec) {
      if (!w || !h) return;
      var rect = hero.getBoundingClientRect();
      var flowT = reduceMotion ? 0 : timeSec;
      glow.step(rect, now, flowT);

      var px = glow.localX;
      var py = glow.localY;
      var cStrength = glow.cursorAlpha;
      var R2 = RADIUS * RADIUS;

      /* Knotenpositionen (kontinuierlicher Wellenfluss + gedämpfte Maus-Federphysik) */
      for (var r = 0; r < rows; r++) {
        var rowPhase = r * 0.36;
        var rowCounter = r * 0.21;
        var b = r * cols;
        for (var c = 0; c < cols; c++) {
          var i = b + c;
          var bx = baseX[i];
          var by = baseY[i];

          var waveY =
            Math.sin(bx * 0.0042 + rowPhase + flowT * 0.62) * 6.4 +
            Math.cos(bx * 0.0096 - rowCounter - flowT * 0.40) * 2.5 +
            Math.sin(bx * 0.0020 - rowPhase * 0.55 + flowT * 0.25) * 3.0;
          var waveX =
            Math.cos(by * 0.0055 + rowPhase * 0.45 + flowT * 0.36) * 1.6;

          var rx = bx + waveX;
          var ry = by + waveY;

          var tx = 0, ty = 0;
          if (cStrength > 0.01) {
            var dx = px - rx;
            var dy = py - ry;
            var d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > 0.01) {
              var d = Math.sqrt(d2);
              var f = (1 - d / RADIUS) * cStrength;
              var pull = Math.min(MAX_PULL * f * f, d * 0.5) / d;
              tx = dx * pull * 0.85;
              ty = dy * pull + Math.sin(f * Math.PI) * 2.8;
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

      /* Ungerade Reihen: feinere, zurückgenommene Tiefenfäden (kein Überlappen, klare Geometrie) */
      traceRowsByParity(ctx, 1);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(250, 250, 248, " + SUB_ALPHA + ")";
      ctx.stroke();

      /* Gerade Reihen: primäre Ausdrucksfäden */
      traceRowsByParity(ctx, 0);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(250, 250, 248, " + PRIMARY_ALPHA + ")";
      ctx.stroke();

      /* Lokaler Cursor-Glanz entlang der Linien (blendet mit cursorAlpha an letzter Position sanft aus) */
      if (cStrength > 0.008) {
        ctx.beginPath();
        for (var rAll = 0; rAll < rows; rAll++) {
          var bAll = rAll * cols;
          ctx.moveTo(curX[bAll], curY[bAll]);
          for (var cAll = 1; cAll < cols - 1; cAll++) {
            var idx = bAll + cAll;
            ctx.quadraticCurveTo(curX[idx], curY[idx], (curX[idx] + curX[idx + 1]) * 0.5, (curY[idx] + curY[idx + 1]) * 0.5);
          }
          var lastIdx = bAll + cols - 1;
          ctx.lineTo(curX[lastIdx], curY[lastIdx]);
        }
        var grad = ctx.createRadialGradient(px, py, 8, px, py, RADIUS * 1.08);
        grad.addColorStop(0, "rgba(250, 250, 248, " + (0.145 * cStrength).toFixed(3) + ")");
        grad.addColorStop(0.5, "rgba(250, 250, 248, " + (0.058 * cStrength).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(250, 250, 248, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    function loop(now) {
      rafId = 0;
      if (!visible || document.hidden || reduceMotion) return;
      stepGlobalPointer();
      renderFrame(now, (now - t0) * 0.001);
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
        glow: createGlowController(el, phase)
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
        var now = performance.now();
        drawSection(inst, now, (now - t0) * 0.001);
      };

      return inst;
    }

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
        dy: vy * pull + Math.sin(f * Math.PI) * 2.4,
        prox: f
      };
    }

    /* 2.1 #arbeiten: Sanfte topografische Konturwellen (einzelne klare Wellenfamilie) */
    function drawWork(inst, t, px, py, s) {
      var ctx = inst.ctx, w = inst.w, h = inst.h;
      var spacing = w < 720 ? 52 : 46;
      var stepX = w < 720 ? 36 : 28;
      var rows = Math.ceil(h / spacing) + 1;
      var radius = 225;

      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var by = 26 + r * spacing;
        var pX = 0, pY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0036 + r * 0.56 + t * 0.32) * 9.5 +
            Math.cos(xc * 0.0080 - r * 0.32 - t * 0.20) * 3.8 +
            Math.sin(xc * 0.0018 - r * 0.24 + t * 0.15) * 3.5;
          var def = cursorDeflect(xc, wy, px, py, radius, 17, s);
          var fx = xc + def.dx;
          var fy = wy + def.dy;
          if (x === 0) ctx.moveTo(fx, fy);
          else ctx.quadraticCurveTo(pX, pY, (pX + fx) * 0.5, (pY + fy) * 0.5);
          pX = fx; pY = fy;
        }
      }
      ctx.lineWidth = 0.95;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.044)";
      ctx.stroke();

      if (s > 0.01) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.09 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.035 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.05;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    /* 2.2 #preise: Strukturiertes Präzisions-Wellen-Raster */
    function drawPricing(inst, t, px, py, s) {
      var ctx = inst.ctx, w = inst.w, h = inst.h;
      var colSpacing = w < 720 ? 96 : 116;
      var rowSpacing = w < 720 ? 50 : 44;
      var stepX = w < 720 ? 34 : 26;
      var stepY = 36;
      var radius = 220;

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
      ctx.strokeStyle = "rgba(21, 23, 25, 0.024)";
      ctx.stroke();

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
      ctx.strokeStyle = "rgba(21, 23, 25, 0.046)";
      ctx.stroke();

      if (s > 0.01) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.092 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.035 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }

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
            nearTicks.push({ x: cx, y: cy });
          }
        }
      }
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(21, 23, 25, 0.062)";
      ctx.stroke();

      if (nearTicks.length && s > 0.01) {
        ctx.beginPath();
        for (var k = 0; k < nearTicks.length; k++) {
          var nt = nearTicks[k];
          ctx.moveTo(nt.x - 3.5, nt.y);
          ctx.lineTo(nt.x + 3.5, nt.y);
          ctx.moveTo(nt.x, nt.y - 3.5);
          ctx.lineTo(nt.x, nt.y + 3.5);
        }
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(21, 23, 25, " + (0.155 * s).toFixed(3) + ")";
        ctx.stroke();
      }
    }

    /* 2.3 #betreuung: Ruhiges technisches Radial- & Trägerwellen-Feld */
    function drawCare(inst, t, px, py, s) {
      var ctx = inst.ctx, w = inst.w, h = inst.h;
      var radius = 215;

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
      ctx.strokeStyle = "rgba(21, 23, 25, 0.030)";
      ctx.stroke();

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
      ctx.strokeStyle = "rgba(21, 23, 25, 0.042)";
      ctx.stroke();

      if (s > 0.01) {
        var grad = ctx.createRadialGradient(px, py, 6, px, py, radius * 1.05);
        grad.addColorStop(0, "rgba(21, 23, 25, " + (0.088 * s).toFixed(3) + ")");
        grad.addColorStop(0.55, "rgba(21, 23, 25, " + (0.032 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(21, 23, 25, 0)");
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    /* 2.4 #kontakt: Ruhiges, weiches Finale-Wellenfeld (konsolidiert, ohne doppelte Wellenebene) */
    function drawContact(inst, t, px, py, s) {
      var ctx = inst.ctx, w = inst.w, h = inst.h;
      var spacing = w < 720 ? 50 : 44;
      var stepX = w < 720 ? 34 : 26;
      var rows = Math.ceil(h / spacing) + 1;
      var radius = 235;

      /* Einzelne, fein abgestimmte Wellenfamilie (ruhiger & sanfter als im Hero) */
      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var by = 26 + r * spacing;
        var pX = 0, pY = 0;
        for (var x = 0; x <= w + stepX; x += stepX) {
          var xc = Math.min(w, x);
          var wy = by +
            Math.sin(xc * 0.0038 + r * 0.42 + t * 0.34) * 6.8 +
            Math.cos(xc * 0.0086 - r * 0.24 - t * 0.22) * 2.6;
          var def = cursorDeflect(xc, wy, px, py, radius, 18, s);
          var fx = xc + def.dx;
          var fy = wy + def.dy;
          if (x === 0) ctx.moveTo(fx, fy);
          else ctx.quadraticCurveTo(pX, pY, (pX + fx) * 0.5, (pY + fy) * 0.5);
          pX = fx; pY = fy;
        }
      }
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(250, 250, 248, 0.044)";
      ctx.stroke();

      if (s > 0.008) {
        var grad = ctx.createRadialGradient(px, py, 8, px, py, radius * 1.06);
        grad.addColorStop(0, "rgba(250, 250, 248, " + (0.11 * s).toFixed(3) + ")");
        grad.addColorStop(0.5, "rgba(250, 250, 248, " + (0.042 * s).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(250, 250, 248, 0)");
        ctx.lineWidth = 1.05;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }

    function drawSection(inst, now, timeSec) {
      if (!inst.w || !inst.h) return;
      var rect = inst.el.getBoundingClientRect();
      var flowT = reduceMotion ? 0 : timeSec;

      inst.glow.step(rect, now, flowT);

      var px = inst.glow.localX;
      var py = inst.glow.localY;
      var s = inst.glow.cursorAlpha;

      inst.ctx.clearRect(0, 0, inst.w, inst.h);

      if (inst.mode === "work") {
        drawWork(inst, flowT, px, py, s);
      } else if (inst.mode === "pricing") {
        drawPricing(inst, flowT, px, py, s);
      } else if (inst.mode === "care") {
        drawCare(inst, flowT, px, py, s);
      } else if (inst.mode === "contact") {
        drawContact(inst, flowT, px, py, s);
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
          drawSection(instances[i], now, tSec);
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
        var now = performance.now();
        for (var e = 0; e < entries.length; e++) {
          var target = entries[e].target;
          for (var j = 0; j < instances.length; j++) {
            if (instances[j].el === target) {
              instances[j].visible = entries[e].isIntersecting;
              if (instances[j].visible && reduceMotion) {
                drawSection(instances[j], now, 0);
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
     3) 3D-Neigung & Kinematischer Fokus der Portfolio-Vorschauen (.project)
     Listener liegen auf dem <a class="project__link">; bei Hover oder
     Tastaturfokus (.is-focused) wird die aktive Karte gestochen scharf
     hervorgehoben, während die Geschwisterkarten sanft in den Hintergrund
     treten (ohne Flackern beim direkten Wechsel zwischen Karten).
     ====================================================================== */
  (function tilt() {
    if (!interactive) return;
    var MAX_DEG = 5, SCALE = 1.024;
    var workSection = document.getElementById("arbeiten");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".project"));
    var focusClearTimer = 0;

    function activateFocus(activeCard) {
      clearTimeout(focusClearTimer);
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.toggle("is-focused", cards[i] === activeCard);
      }
      if (workSection) workSection.classList.add("has-focus-project");
    }

    function scheduleClearFocus(leavingCard) {
      clearTimeout(focusClearTimer);
      focusClearTimer = setTimeout(function () {
        if (leavingCard) leavingCard.classList.remove("is-focused");
        var anyFocused = false;
        for (var i = 0; i < cards.length; i++) {
          if (cards[i].classList.contains("is-focused")) {
            anyFocused = true;
            break;
          }
        }
        if (!anyFocused && workSection) {
          workSection.classList.remove("has-focus-project");
        }
      }, 32);
    }

    cards.forEach(function (card) {
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
        scheduleClearFocus(card);
      }

      link.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        card.classList.add("is-tilting");
        activateFocus(card);
      });
      link.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        card.classList.add("is-tilting");
        activateFocus(card);
        cx = e.clientX; cy = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      link.addEventListener("pointerleave", reset);

      /* Tastatur-Fokus für barrierefreie Hervorhebung */
      link.addEventListener("focus", function () {
        activateFocus(card);
      });
      link.addEventListener("blur", function () {
        scheduleClearFocus(card);
      });
    });
  })();

  /* ======================================================================
     4) Zeigerabhängige Beleuchtung & feine Magnetik für Karten & Buttons
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
     5) Interaktive Typografie + Delegierter Nachbar-Unterstreichungs-Effekt
        - Große Überschriften (data-typo="words"): Wort-Skalierung (.t-word)
        - Kleinerer Text (Standard): Buchstaben-Skalierung (.t-ch) + sanfte
          Unterstreichung der direkten (±1: .is-u1) und zweiten (±2: .is-u2)
          Nachbarbuchstaben.
        - Arabisch: verbundene Wort-Einheiten (.t-w--hover) zur Wahrung der
          Ligaturen mit Wort-Nachbarschafts-Unterstreichung.
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

    /* Speichert die aktuell unterstrichenen Nachbar-Spans (max. 4 Knoten) für O(1)-Bereinigung */
    var activeNeighbors = [];
    var currentHoveredUnit = null;

    function clearNeighborUnderlines() {
      for (var i = 0; i < activeNeighbors.length; i++) {
        var n = activeNeighbors[i];
        n.classList.remove("is-u1", "is-u2", "is-u-left", "is-u-right");
      }
      activeNeighbors.length = 0;
      currentHoveredUnit = null;
    }

    function activateNeighborUnderlines(unit) {
      if (unit === currentHoveredUnit) return;
      clearNeighborUnderlines();
      if (!unit || !unit._uList) return;
      currentHoveredUnit = unit;
      var list = unit._uList;
      var idx = unit._uIdx;

      if (idx - 1 >= 0) {
        var l1 = list[idx - 1];
        l1.classList.add("is-u1", "is-u-left");
        activeNeighbors.push(l1);
      }
      if (idx + 1 < list.length) {
        var r1 = list[idx + 1];
        r1.classList.add("is-u1", "is-u-right");
        activeNeighbors.push(r1);
      }
      if (idx - 2 >= 0) {
        var l2 = list[idx - 2];
        l2.classList.add("is-u2", "is-u-left");
        activeNeighbors.push(l2);
      }
      if (idx + 2 < list.length) {
        var r2 = list[idx + 2];
        r2.classList.add("is-u2", "is-u-right");
        activeNeighbors.push(r2);
      }
    }

    /* Einziger delegierter Listener für den gesamten Dokumentbaum */
    document.addEventListener("pointerover", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var t = e.target;
      if (t && t._uList) {
        activateNeighborUnderlines(t);
      } else if (currentHoveredUnit) {
        clearNeighborUnderlines();
      }
    }, { passive: true });

    document.addEventListener("pointerout", function (e) {
      if (!currentHoveredUnit) return;
      var rel = e.relatedTarget;
      if (!rel || !rel._uList) {
        clearNeighborUnderlines();
      }
    }, { passive: true });

    document.addEventListener("mouseleave", clearNeighborUnderlines);

    function registerUnit(span, list) {
      span._uList = list;
      span._uIdx = list.length;
      list.push(span);
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

      var units = [];

      /* 2. Chinesischer Fließtext: Einzelzeichen-Hover + Nachbar-Unterstreichung */
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
            registerUnit(cs, units);
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
          /* Arabisch: Wort als verbundene Einheit animieren (Ligaturen geschützt) */
          var aw = document.createElement("span");
          aw.className = "t-w t-w--hover";
          aw.setAttribute("data-typo-done", "1");
          aw.textContent = p;
          registerUnit(aw, units);
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
              registerUnit(s, units);
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
      clearNeighborUnderlines();
      var mode = (el.closest && el.closest('[data-typo="words"]')) ? "words" : "chars";
      enhanceTree(el, mode);
    };

    window.SFY_TYPO_REBUILD = function () {
      clearNeighborUnderlines();
      enhanceTree(document.body, "chars");
    };

    enhanceTree(document.body, "chars");
  })();
})();
