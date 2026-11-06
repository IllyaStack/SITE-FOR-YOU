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

  /* ---------- Reveal beim Scrollen ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
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
      img.alt = "Vorschau des Website-Konzepts " + name;
      img.width = 1600; img.height = 1000;
      img.loading = card.classList.contains("project--featured") ? "eager" : "lazy";
      img.decoding = "async";
      img.onerror = function () { img.remove(); media.classList.remove("has-img"); };
      media.appendChild(img);
      media.classList.add("has-img");
    }

    if (conf.url) {
      link.href = conf.url;
      link.setAttribute("aria-label", name + " – Live-Demo öffnen (neuer Tab)");
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
  var nameInput = $("#name");

  $$("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      select.value = packages[btn.getAttribute("data-package")];
      var target = $("#kontakt");
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      /* Nächster Schritt: Name-Feld fokussieren, sobald der Scroll fertig ist */
      setTimeout(function () { nameInput.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    });
  });

  /* ---------- Formular ---------- */
  var form = $("#form");
  var submitBtn = $("#submit");
  var label = $(".btn__label", submitBtn);
  var statusEl = $("#status");
  var busy = false;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, msg) {
    var field = input.closest(".field");
    $(".err", field).textContent = msg;
    field.classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function validate() {
    var ok = true, first = null;
    if (!nameInput.value.trim()) { setError(nameInput, "Bitte gib deinen Namen oder dein Unternehmen an."); first = first || nameInput; ok = false; }
    else setError(nameInput, "");
    var em = $("#email");
    var v = em.value.trim();
    if (!v) { setError(em, "Bitte gib deine E-Mail-Adresse an."); first = first || em; ok = false; }
    else if (!emailRe.test(v)) { setError(em, "Bitte gib eine gültige E-Mail-Adresse ein."); first = first || em; ok = false; }
    else setError(em, "");
    if (first) first.focus();
    return ok;
  }

  ["#name", "#email"].forEach(function (s) {
    $(s).addEventListener("input", function () { if (this.closest(".field").classList.contains("is-invalid")) setError(this, ""); });
  });

  function showStatus(type, title, html) {
    statusEl.className = "status is-visible is-" + type;
    statusEl.innerHTML = "<strong></strong><span></span>";
    $("strong", statusEl).textContent = title;
    $("span", statusEl).innerHTML = html;
    void statusEl.offsetWidth;
    statusEl.classList.add("is-in");
    statusEl.focus({ preventScroll: true });
  }
  function hideStatus() { statusEl.className = "status"; statusEl.textContent = ""; }

  function mailHint() {
    return mail ? ' Du kannst uns auch direkt schreiben: <a href="mailto:' + encodeURIComponent(mail).replace("%40", "@") + '">' + mail.replace(/</g, "&lt;") + "</a>." : "";
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (busy) return;
    hideStatus();
    if (!validate()) return;

    /* Honeypot: Bots erhalten keine Rückmeldung */
    if (form.elements._gotcha && form.elements._gotcha.value) return;

    if (!cfg.formEndpoint) {
      console.warn("[SITE FOR YOU.] Kein Formular-Endpoint konfiguriert. Trage formEndpoint in config.js ein (z. B. Formspree). Es wurde nichts gesendet.");
      showStatus("error", "Senden derzeit nicht möglich.", "Das Formular ist noch nicht eingerichtet." + mailHint());
      return;
    }

    busy = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("aria-busy", "true");
    label.textContent = "Wird gesendet";

    fetch(cfg.formEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json().catch(function () { return {}; });
    }).then(function (data) {
      if (data && data.errors) throw new Error("Provider error");
      form.reset();
      showStatus("success", "Danke für deine Anfrage!", "Wir melden uns persönlich bei dir. Es ist noch nichts verbindlich.");
    }).catch(function (err) {
      console.error("[SITE FOR YOU.] Formular-Fehler:", err);
      showStatus("error", "Das hat leider nicht geklappt.", "Bitte versuche es gleich noch einmal." + mailHint());
    }).then(function () {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
      label.textContent = "Anfrage senden";
    });
  });
})();
