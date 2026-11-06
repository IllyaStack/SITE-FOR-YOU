/* SITE FOR YOU. — Verhalten. Einstellungen stehen in config.js */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Header: solid nach dem Hero ---------- */
  var header = $("#header");
  var hero = $(".hero");
  function onScroll() {
    var limit = hero ? hero.offsetHeight - header.offsetHeight : 40;
    header.classList.toggle("is-solid", window.scrollY > limit);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Reveal beim Scrollen (wiederholt bei jedem Wiedereintritt) ----------
     Einblenden ab 12 % Sichtbarkeit; Zurücksetzen erst, wenn das Element den
     Viewport komplett verlassen hat (Hysterese gegen Flackern an der Kante). */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio >= 0.12) e.target.classList.add("is-in");
        else if (!e.isIntersecting) e.target.classList.remove("is-in");
      });
    }, { threshold: [0, 0.12], rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    /* Hero-Einlaufanimation erneut abspielen, wenn man zurück nach oben scrollt */
    if (hero) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) hero.classList.add("is-reset");
          else if (hero.classList.contains("is-reset")) {
            void hero.offsetWidth;
            hero.classList.remove("is-reset");
          }
        });
      }, { threshold: [0] }).observe(hero);
    }
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Portfolio aus config.js ---------- */
  $$(".project").forEach(function (card) {
    var conf = (cfg.projects || {})[card.getAttribute("data-project")] || {};
    var link = $(".project__link", card);
    var media = $(".project__media", card);
    var cta = $("[data-cta]", card);
    var name = $("h3", card).textContent;

    if (conf.image) {
      var img = new Image();
      img.src = conf.image;
      /* Responsive: <name>-720.webp (720 px) und <name>.webp (1440 px) */
      img.srcset = conf.image.replace(/\.webp$/, "-720.webp") + " 720w, " + conf.image + " 1440w";
      img.sizes = card.classList.contains("project--featured") ? "(min-width: 1300px) 1130px, 100vw" : "(min-width: 720px) 50vw, 100vw";
      img.alt = "Startseite des Website-Konzepts " + name;
      img.width = 1440; img.height = 900;
      img.loading = card.classList.contains("project--featured") ? "eager" : "lazy";
      img.decoding = "async";
      img.onerror = function () { img.remove(); media.classList.remove("has-img"); };
      media.appendChild(img);
      media.classList.add("has-img");
    }

    if (conf.url) {
      link.href = conf.url;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.setAttribute("aria-label", name + " – Website-Konzept als Live-Demo öffnen (neuer Tab)");
      cta.textContent = "Live-Demo";
      card.classList.add("is-live");
    } else {
      /* Keine URL: kein toter Link */
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });

  /* ---------- E-Mail-Alternative ---------- */
  var mail = (cfg.email || "").trim();
  if (mail) {
    var ml = $("#mail-link");
    ml.href = "mailto:" + mail;
    ml.textContent = mail;
    $("#mail-fallback").hidden = false;
  }

  /* ---------- Paket-Vorauswahl ---------- */
  var packages = { starter: "Starter — 300 €", business: "Business — 500 €", custom: "Custom — ab 1.000 €" };
  var select = $("#package");
  var companyInput = $("#company");

  $$("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      select.value = packages[btn.getAttribute("data-package")];
      var target = $("#kontakt");
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      /* Nächster Schritt: erstes Feld fokussieren, sobald der Scroll fertig ist */
      setTimeout(function () { companyInput.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    });
  });

  /* ---------- Formular (Formspree, AJAX) ---------- */
  var form = $("#form");
  var submitBtn = $("#submit");
  var label = $(".btn__label", submitBtn);
  var statusEl = $("#status");
  var nameInput = $("#name");
  var emailInput = $("#email");
  var busy = false;
  var attemptRef = null; /* Anfragenummer des aktuellen Versuchs; bleibt bei Wiederholung gleich */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var endpointRe = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/;

  /* Zeilenumbrüche/Steuerzeichen entfernen (verhindert Header-Injection im Betreff) */
  function singleLine(s, max) {
    return String(s).replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  }

  /* SFY-JJJJMMTT-XXXXXXXX (8 Hex-Zeichen aus crypto.getRandomValues) */
  function makeReference() {
    var c = window.crypto;
    if (!c || !c.getRandomValues) return null;
    var b = c.getRandomValues(new Uint8Array(4));
    var hex = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("").toUpperCase();
    var d = new Date();
    var p = function (n) { return ("0" + n).slice(-2); };
    return "SFY-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + hex;
  }

  function setError(input, msg) {
    var field = input.closest(".field");
    $(".err", field).textContent = msg;
    field.classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function validate() {
    var first = null;
    function bad(input, msg) { setError(input, msg); first = first || input; }

    if (!singleLine(companyInput.value, 100)) bad(companyInput, "Bitte gib den Namen deines Unternehmens an."); else setError(companyInput, "");
    if (!singleLine(nameInput.value, 100)) bad(nameInput, "Bitte gib deinen Namen an."); else setError(nameInput, "");
    var v = emailInput.value.trim();
    if (!v) bad(emailInput, "Bitte gib deine E-Mail-Adresse an.");
    else if (!emailRe.test(v)) bad(emailInput, "Bitte gib eine gültige E-Mail-Adresse ein.");
    else setError(emailInput, "");

    if (first) first.focus();
    return !first;
  }

  [companyInput, nameInput, emailInput].forEach(function (inp) {
    inp.addEventListener("input", function () { if (inp.closest(".field").classList.contains("is-invalid")) setError(inp, ""); });
  });

  function showStatus(type, title, text, withMail) {
    statusEl.className = "status is-visible is-" + type;
    statusEl.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = title;
    var span = document.createElement("span");
    span.textContent = text;
    statusEl.appendChild(strong);
    statusEl.appendChild(span);
    if (withMail && mail) {
      span.appendChild(document.createTextNode(" Du kannst uns auch direkt schreiben: "));
      var a = document.createElement("a");
      a.href = "mailto:" + mail;
      a.textContent = mail;
      span.appendChild(a);
      span.appendChild(document.createTextNode("."));
    }
    void statusEl.offsetWidth;
    statusEl.classList.add("is-in");
    statusEl.focus({ preventScroll: true });
  }
  function hideStatus() { statusEl.className = "status"; statusEl.textContent = ""; }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
    if (on) submitBtn.setAttribute("aria-busy", "true"); else submitBtn.removeAttribute("aria-busy");
    label.textContent = on ? "Wird gesendet" : "Anfrage senden";
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (busy) return;
    hideStatus();
    if (!validate()) return;

    /* Honeypot: Bots erhalten keine Rückmeldung und es wird nichts gesendet */
    if (form.elements._gotcha && form.elements._gotcha.value) return;

    var endpoint = (cfg.FORMSPREE_ENDPOINT || "").trim();
    if (!endpointRe.test(endpoint)) {
      console.warn("[SITE FOR YOU.] FORMSPREE_ENDPOINT fehlt oder ist ungültig (erwartet: https://formspree.io/f/FORM_ID). Es wurde nichts gesendet.");
      showStatus("error", "Senden derzeit nicht möglich.", "Das Formular ist noch nicht eingerichtet.", true);
      return;
    }

    if (!attemptRef) attemptRef = makeReference();
    if (!attemptRef) {
      showStatus("error", "Senden nicht möglich.", "Dein Browser unterstützt die Erstellung der Anfragenummer nicht. Bitte nutze einen aktuellen Browser.", true);
      return;
    }

    var company = singleLine(companyInput.value, 100);
    var data = new FormData(form);
    data.delete("_gotcha");
    data.set("Unternehmen", company);
    data.set("Kontaktperson", singleLine(nameInput.value, 100));
    data.set("email", emailInput.value.trim());
    data.set("Telefon", singleLine($("#phone").value, 40));
    data.set("Anfragenummer", attemptRef);
    data.set("_subject", attemptRef + " | " + company);

    var sentRef = attemptRef;
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    setBusy(true);

    fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok || (json && (json.errors || json.ok === false))) throw new Error("Formspree HTTP " + res.status);
      });
    }).then(function () {
      form.reset();
      attemptRef = null;
      showStatus("success", "Vielen Dank!", "Deine Anfrage wurde erfolgreich übermittelt. Deine Anfragenummer: " + sentRef + ". Wir melden uns persönlich bei dir.");
    }).catch(function (err) {
      /* Eingaben bleiben erhalten; attemptRef bleibt für den Wiederholungsversuch gleich */
      console.error("[SITE FOR YOU.] Formular-Fehler:", err);
      showStatus("error", "Das hat leider nicht geklappt.", "Deine Anfrage konnte nicht übermittelt werden. Deine Eingaben sind noch vorhanden – bitte versuche es erneut.", true);
    }).then(function () {
      if (timer) clearTimeout(timer);
      setBusy(false);
    });
  });
})();
