/* SITE FOR YOU. — Interaktive Effekte (Filament-Hero, 3D-Portfolio-Karten).
   Beide Effekte sind rein dekorativ, blockieren keine Klicks und sind bei
   prefers-reduced-motion bzw. auf Touch-Geräten deaktiviert oder statisch. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var interactive = finePointer && !reduceMotion;

  /* ======================================================================
     1) Interactive Filament Field (Hero + Header-Bereich)
     Feine Linien ab y=0 direkt hinter dem Header, die sich dem Mauszeiger
     elastisch annähern und danach in ihre Ruheposition zurückfedern.
     ====================================================================== */
  (function filament() {
    var canvas = document.getElementById("hero-fx");
    var hero = canvas && canvas.parentElement;
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var LINE_ALPHA = 0.085;   /* Linien-Deckkraft */
    var RADIUS = 190;         /* Einflussradius des Zeigers in px */
    var MAX_PULL = 24;        /* maximale Auslenkung in px */
    var STIFFNESS = 0.07, DAMPING = 0.8;

    var w = 0, h = 0, rows = 0, cols = 0;
    var restX, restY, offX, offY, velX, velY;
    var pcx = 0, pcy = 0, active = false;
    var running = false, visible = true, rafId = 0;
    var left = 0, top = 0;

    function build() {
      w = hero.clientWidth; h = hero.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var spacing = w < 720 ? 34 : 30, step = w < 720 ? 30 : 26;
      rows = Math.ceil(h / spacing) + 1;
      cols = Math.ceil(w / step) + 1;
      var n = rows * cols;
      restX = new Float32Array(n); restY = new Float32Array(n);
      offX = new Float32Array(n); offY = new Float32Array(n);
      velX = new Float32Array(n); velY = new Float32Array(n);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c, x = c * step;
          restX[i] = x;
          /* Erste Linien laufen bereits direkt hinter dem Header (ab ~22 px) */
          restY[i] = 22 + r * spacing + Math.sin(x * 0.0045 + r * 0.42) * 6 + Math.sin(x * 0.011 - r * 0.2) * 2.5;
        }
      }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      for (var r = 0; r < rows; r++) {
        var b = r * cols;
        ctx.moveTo(restX[b] + offX[b], restY[b] + offY[b]);
        for (var c = 1; c < cols - 1; c++) {
          var i = b + c;
          var x1 = restX[i] + offX[i], y1 = restY[i] + offY[i];
          var x2 = restX[i + 1] + offX[i + 1], y2 = restY[i + 1] + offY[i + 1];
          ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
        }
        var l = b + cols - 1;
        ctx.lineTo(restX[l] + offX[l], restY[l] + offY[l]);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(250,250,248," + LINE_ALPHA + ")";
      ctx.stroke();
    }

    function step() {
      var px = pcx - left, py = pcy - top, energy = 0, R2 = RADIUS * RADIUS;
      for (var i = 0, n = rows * cols; i < n; i++) {
        var tx = 0, ty = 0;
        if (active) {
          var dx = px - restX[i], dy = py - restY[i];
          var d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            var d = Math.sqrt(d2), f = 1 - d / RADIUS;
            var pull = Math.min(MAX_PULL * f * f, d * 0.5) / d;
            tx = dx * pull; ty = dy * pull;
          }
        }
        var ax = (tx - offX[i]) * STIFFNESS, ay = (ty - offY[i]) * STIFFNESS;
        velX[i] = (velX[i] + ax) * DAMPING; velY[i] = (velY[i] + ay) * DAMPING;
        offX[i] += velX[i]; offY[i] += velY[i];
        energy += Math.abs(velX[i]) + Math.abs(velY[i]) + Math.abs(tx - offX[i]) + Math.abs(ty - offY[i]);
      }
      return energy;
    }

    function frame() {
      rafId = 0;
      if (!visible || document.hidden) { running = false; return; }
      var rect = hero.getBoundingClientRect();
      left = rect.left; top = rect.top;
      var e = step();
      draw();
      if (active || e > 0.05) rafId = requestAnimationFrame(frame);
      else {
        offX.fill(0); offY.fill(0); velX.fill(0); velY.fill(0);
        draw(); running = false;
      }
    }
    function start() {
      if (running || !visible || document.hidden) return;
      running = true; rafId = requestAnimationFrame(frame);
    }

    build();

    var resizeTimer = 0;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 120);
      }).observe(hero);
    } else window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 120); });

    if (!interactive) return;

    /* Auf window lauschen, damit auch Bewegungen über dem integrierten Header
       die Fäden im oberen Hero-Bereich nahtlos ansprechen */
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !visible) return;
      var rect = hero.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right) {
        pcx = e.clientX; pcy = e.clientY; active = true; start();
      } else if (active) {
        active = false; start();
      }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { if (active) { active = false; start(); } });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) { active = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; running = false; }
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; running = false; }
    });
  })();

  /* ======================================================================
     2) 3D-Neigung der Portfolio-Vorschauen (Klicks vollständig bewahrt)
     Listener liegen auf dem <a class="project__link">; die Referenz-Box wird
     aus dem untansformierten Anker gelesen, sodass die 3D-Neigung niemals
     den Hit-Test unter dem Mauszeiger verschiebt oder Klicks abfängt.
     ====================================================================== */
  (function tilt() {
    if (!interactive) return;
    var MAX_DEG = 5, SCALE = 1.024;

    Array.prototype.forEach.call(document.querySelectorAll(".project"), function (card) {
      var link = card.querySelector(".project__link");
      var media = card.querySelector(".project__media");
      if (!link || !media) return;
      var glare = document.createElement("span");
      glare.className = "project__glare";
      glare.setAttribute("aria-hidden", "true");
      media.appendChild(glare);

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
     3) Subtile zeigerabhängige Beleuchtung für Preis- & Betreuungskarten
     Aktualisiert --mx / --my für das weichgezeichnete Halo hinter der Karte,
     ohne den Kartentext oder Klicks zu beeinflussen.
     ====================================================================== */
  (function cardGlow() {
    if (!interactive) return;
    Array.prototype.forEach.call(document.querySelectorAll(".plan, .care__item"), function (card) {
      var raf = 0, cx = 0, cy = 0;
      function update() {
        raf = 0;
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var mx = Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100));
        var my = Math.min(100, Math.max(0, ((cy - r.top) / r.height) * 100));
        card.style.setProperty("--mx", mx.toFixed(1) + "%");
        card.style.setProperty("--my", my.toFixed(1) + "%");
      }
      card.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        cx = e.clientX; cy = e.clientY;
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive: true });
    });
  })();

  /* ======================================================================
     4) Interaktive Typografie (Wort-Hover für Haupt-Slogans, Buchstaben-Hover
        für statischen Fließ- und Oberflächentext)
     Nutzt Intl.Segmenter für korrekte Unicode-Grapheme, bewahrt Zeilenumbruch
     durch Wort-Wrapper (.t-w) und kommt komplett ohne JS-Hover-Listener aus.
     ====================================================================== */
  (function typography() {
    if (!interactive) return;

    var seg = (typeof Intl !== "undefined" && Intl.Segmenter)
      ? new Intl.Segmenter("de", { granularity: "grapheme" })
      : null;

    function toGraphemes(str) {
      if (seg) {
        var out = [], it = seg.segment(str)[Symbol.iterator](), step;
        while (!(step = it.next()).done) out.push(step.value.segment);
        return out;
      }
      return Array.from ? Array.from(str) : str.split("");
    }

    var SKIP_TAGS = {
      SCRIPT: 1, STYLE: 1, SVG: 1, CANVAS: 1, INPUT: 1, TEXTAREA: 1,
      SELECT: 1, OPTION: 1, NOSCRIPT: 1, IMG: 1, BR: 1, HR: 1
    };

    function shouldSkipElement(el) {
      if (!el || el.nodeType !== 1) return true;
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.hasAttribute("data-typo-done") || el.isContentEditable) return true;
      if (el.classList.contains("hp") || el.classList.contains("err") ||
          el.classList.contains("status") || el.classList.contains("arrow") ||
          el.classList.contains("plan__sel") || el.classList.contains("care__sel") ||
          el.classList.contains("care-context__check")) {
        return true;
      }
      return false;
    }

    function segmentTextNode(node, mode) {
      var raw = node.nodeValue;
      if (!raw || !/\S/.test(raw)) return;
      var parts = raw.split(/([ \t\r\n]+)/);
      var segWrap = document.createElement("span");
      segWrap.className = "t-seg";
      segWrap.setAttribute("data-typo-done", "1");
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
      /* Falls root selbst ein einzelnes dynamisches Textelement ist, Rohwert merken */
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

    enhanceTree(document.body, "chars");
  })();
})();
