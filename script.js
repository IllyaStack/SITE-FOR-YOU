/* SITE FOR YOU. — Verhalten. Einstellungen stehen in config.js */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Header & subtiler Tiefen-Impuls bei Abschnittswechseln ---------- */
  var header = $("#header");
  var hero = $(".hero");
  var contactSection = $("#kontakt");
  var veil = $("#depth-veil");
  var sectionHeads = $$(".section__head");
  var veilTimer = 0;

  function onScroll() {
    var y = window.scrollY;
    var hh = header ? header.offsetHeight : 64;
    var pastHero = hero ? y > hero.offsetHeight - hh - 4 : y > 40;
    var inDarkContact = false;
    if (contactSection && pastHero) {
      var cr = contactSection.getBoundingClientRect();
      inDarkContact = cr.top <= hh && cr.bottom > hh;
    }
    if (header) {
      header.classList.toggle("is-solid", pastHero && !inDarkContact);
      header.classList.toggle("is-dark-section", inDarkContact);
    }
    /* Sehr dezente Parallaxe der Abschnittsüberschriften */
    if (!reduceMotion) {
      var vh = window.innerHeight || 800;
      for (var i = 0; i < sectionHeads.length; i++) {
        var r = sectionHeads[i].getBoundingClientRect();
        if (r.bottom > -100 && r.top < vh + 100) {
          var norm = (r.top + r.height * 0.5 - vh * 0.5) / vh;
          var py = Math.max(-7, Math.min(7, -norm * 10));
          sectionHeads[i].style.setProperty("--py", py.toFixed(1) + "px");
        }
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  function pulseDepth() {
    if (!veil || reduceMotion) return;
    clearTimeout(veilTimer);
    veil.classList.add("is-active");
    veilTimer = setTimeout(function () { veil.classList.remove("is-active"); }, 520);
  }

  function scrollToSection(el, afterScroll) {
    if (!el) return;
    pulseDepth();
    /* Ziel-Elemente sofort einblenden, damit beim programmatischen Sprung keine Verzögerung entsteht */
    $$(".reveal", el).forEach(function (r) { r.classList.add("is-in"); });
    if (el.id === "kontakt" && form) form.classList.add("is-in");
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (afterScroll) setTimeout(afterScroll, reduceMotion ? 0 : 620);
  }

  /* Sanfte Übergänge auch für Header-/Hero-Ankerlinks */
  $$('a[href^="#"]').forEach(function (a) {
    if (a.hasAttribute("data-package") || a.hasAttribute("data-care")) return;
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = $(id);
      if (!target) return;
      ev.preventDefault();
      scrollToSection(target);
    });
  });

  /* ---------- Reveal beim Scrollen + gestaffelter Formulareingang ---------- */
  var form = $("#form");
  if (form) {
    var seqItems = $$("#form > fieldset, #form > .summary, #form > .collapse, #form > .field, #form > .form__submit");
    seqItems.forEach(function (el, idx) {
      el.classList.add("seq-item");
      el.style.setProperty("--d", (idx * 45) + "ms");
    });
  }

  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio >= 0.12) e.target.classList.add("is-in");
        else if (!e.isIntersecting) e.target.classList.remove("is-in");
      });
    }, { threshold: [0, 0.12], rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    if (form) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.intersectionRatio >= 0.08) form.classList.add("is-in");
          else if (!e.isIntersecting) form.classList.remove("is-in");
        });
      }, { threshold: [0, 0.08], rootMargin: "0px 0px -30px 0px" }).observe(form);
    }

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
    if (form) form.classList.add("is-in");
  }

  /* ---------- Portfolio: Links & Bilder stehen bereits im HTML; config.js überschreibt nur bei Bedarf ---------- */
  $$(".project").forEach(function (card) {
    var conf = (cfg.projects || {})[card.getAttribute("data-project")] || {};
    var link = $(".project__link", card);
    var media = $(".project__media", card);
    var cta = $(".project__cta", card);
    var name = $("h3", card).textContent;

    if (conf.image) {
      var existingImg = $("img", media);
      if (!existingImg) {
        var img = new Image();
        img.src = conf.image;
        img.srcset = conf.image.replace(/\.webp$/, "-720.webp") + " 720w, " + conf.image + " 1440w";
        img.sizes = card.classList.contains("project--featured") ? "(min-width: 1300px) 1130px, 100vw" : "(min-width: 720px) 50vw, 100vw";
        img.alt = "Startseite des Website-Konzepts " + name;
        img.width = 1440; img.height = 900;
        img.loading = card.classList.contains("project--featured") ? "eager" : "lazy";
        img.decoding = "async";
        media.appendChild(img);
        media.classList.add("has-img");
      } else if (existingImg.getAttribute("src") !== conf.image) {
        existingImg.src = conf.image;
      }
    }

    var finalUrl = conf.url || (link && link.getAttribute("href")) || "";
    if (finalUrl && finalUrl !== "#") {
      link.href = finalUrl;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.setAttribute("aria-label", name + " – Website-Konzept als Live-Demo öffnen (neuer Tab)");
      if (cta) cta.textContent = "Live-Demo";
      card.classList.add("is-live");
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

  /* ======================================================================
     Zentrales Zustandsmodell für die Angebots-Auswahl
     Reise: Website wählen → Betreuung (optional) → Kontaktformular
            ODER direkt Betreuung wählen → Kontaktformular
     ====================================================================== */
  var PKG_LABELS = {
    starter: "Starter — 300 €",
    business: "Business — 500 €",
    custom: "Custom — ab 1.000 €"
  };
  var CARE_LABELS = {
    basic: "Basic Care — 20 €/Monat",
    premium: "Premium Care — 40 €/Monat"
  };

  var state = {
    inquiryType: "website",   /* "website" | "maintenance" */
    websitePackage: null,     /* null | "starter" | "business" | "custom" */
    carePackage: null,        /* null | "basic" | "premium" */
    pickerOpen: true          /* true bis eine geführte Auswahl abgeschlossen ist */
  };
  window.SFY_STATE = state;

  var careContext = $("#care-context");
  var careContextPkg = $("#care-context-pkg");
  var careSkip = $("#care-skip");
  var skipCareBtn = $("#skip-care");
  var selCollapse = $("#sel");
  var selToggle = $("#sel-toggle");
  var panelWebsite = $("#panel-website");
  var panelMaint = $("#panel-maint");
  var panelUrl = $("#panel-url");
  var summaryList = $("#summary-list");
  var sumRowEmpty = $("#sum-row-empty");
  var sumEmptyTxt = $("#sum-empty-txt");
  var sumRowWeb = $("#sum-row-web");
  var sumWebVal = $("#sum-web-val");
  var sumRowCare = $("#sum-row-care");
  var sumCareVal = $("#sum-care-val");
  var sumCareTag = $("#sum-care-tag");
  var selErr = $("#sel-err");

  var companyInput = $("#company");
  var nameInput = $("#name");
  var emailInput = $("#email");
  var urlInput = $("#url");

  function setCollapse(el, open) {
    if (!el) return;
    el.classList.toggle("is-closed", !open);
    if (open) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
    $$("input, button, select, textarea, a", el).forEach(function (ctrl) {
      if (open) ctrl.removeAttribute("tabindex");
      else ctrl.setAttribute("tabindex", "-1");
    });
  }

  function setSummaryVal(el, nextText) {
    if (!el) return;
    var prev = el.textContent;
    if (prev === nextText) return;
    el.textContent = nextText;
    if (prev && nextText && !reduceMotion) {
      el.classList.remove("is-swapping");
      void el.offsetWidth;
      el.classList.add("is-swapping");
    }
  }

  function renderState() {
    var isMaint = state.inquiryType === "maintenance";
    var hasWebsite = !isMaint && !!state.websitePackage;

    /* 1. Preiskarten markieren */
    $$("[data-plan]").forEach(function (card) {
      var key = card.getAttribute("data-plan");
      var sel = !isMaint && state.websitePackage === key;
      card.classList.toggle("is-selected", sel);
      var btn = $("[data-package]", card);
      if (btn) btn.setAttribute("aria-pressed", sel ? "true" : "false");
    });

    /* 2. Betreuungskarten + Kontext-Banner + Ohne-Betreuung-Button */
    setCollapse(careContext, hasWebsite);
    setCollapse(careSkip, hasWebsite);
    if (hasWebsite && careContextPkg) {
      careContextPkg.textContent = PKG_LABELS[state.websitePackage] || "";
    }

    $$("[data-care-card]").forEach(function (card) {
      var key = card.getAttribute("data-care-card");
      var sel = state.carePackage === key;
      card.classList.toggle("is-selected", sel);
      var btn = $("a[data-care]", card);
      var lbl = $(".care__cta-label", card);
      if (btn) btn.setAttribute("aria-pressed", sel ? "true" : "false");
      if (lbl) {
        var baseName = key === "basic" ? "Basic Care" : "Premium Care";
        lbl.textContent = hasWebsite ? (baseName + " hinzufügen") : (baseName + " anfragen");
      }
    });

    /* 3. Anfrageart-Radios im Formular */
    $$('input[name="Anfrageart"]').forEach(function (r) {
      r.checked = (r.value === state.inquiryType);
    });

    /* 4. Paket- & Care-Radios im Formular */
    $$('input[name="w_pkg"]').forEach(function (r) {
      r.checked = (!isMaint && r.value === state.websitePackage);
    });
    var wCareVal = (!isMaint && state.carePackage) ? state.carePackage : "none";
    $$('input[name="w_care"]').forEach(function (r) {
      r.checked = (r.value === wCareVal);
    });
    $$('input[name="m_care"]').forEach(function (r) {
      r.checked = (isMaint && r.value === state.carePackage);
    });

    /* 5. Sanftes Umschalten der Formular-Panels */
    var hasCompleteSelection = isMaint ? !!state.carePackage : !!state.websitePackage;
    var showPicker = state.pickerOpen || !hasCompleteSelection;

    setCollapse(selCollapse, showPicker);
    setCollapse(panelWebsite, showPicker && !isMaint);
    setCollapse(panelMaint, showPicker && isMaint);
    setCollapse(panelUrl, isMaint);

    if (!isMaint && urlInput) setError(urlInput, "");

    if (selToggle) {
      selToggle.setAttribute("aria-expanded", showPicker ? "true" : "false");
      selToggle.textContent = showPicker ? "Auswahl einklappen" : "Auswahl anpassen";
    }

    /* 6. Zusammenfassung animiert aktualisieren (jede Zeile gleitet sanft ein/aus) */
    var showEmpty = isMaint ? !state.carePackage : !state.websitePackage;
    var showWebRow = !isMaint && !!state.websitePackage;
    var showCareRow = isMaint ? !!state.carePackage : (!!state.websitePackage && !!state.carePackage);

    if (sumEmptyTxt) {
      setSummaryVal(sumEmptyTxt, isMaint ? "Bitte wähle Basic Care oder Premium Care." : "Bitte wähle ein Website-Paket.");
    }
    if (showWebRow && sumWebVal) {
      setSummaryVal(sumWebVal, PKG_LABELS[state.websitePackage]);
    }
    if (showCareRow && sumCareVal) {
      setSummaryVal(sumCareVal, CARE_LABELS[state.carePackage]);
    }
    if (sumCareTag) {
      sumCareTag.textContent = isMaint ? "Website-Betreuung" : "Betreuung";
    }
    if (sumRowCare) {
      sumRowCare.classList.toggle("has-top-line", showWebRow && showCareRow);
    }
    setCollapse(sumRowEmpty, showEmpty);
    setCollapse(sumRowWeb, showWebRow);
    setCollapse(sumRowCare, showCareRow);

    if (hasCompleteSelection && selErr) selErr.textContent = "";
  }

  /* 3.1 Klick auf Website-Paket → speichern & zur Website-Betreuung scrollen */
  $$("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      state.inquiryType = "website";
      state.websitePackage = btn.getAttribute("data-package");
      state.carePackage = null;
      state.pickerOpen = false;
      renderState();
      scrollToSection($("#betreuung"));
    });
  });

  /* Link „Ändern“ im Betreuungs-Kontextbanner */
  var careChange = $("#care-change");
  if (careChange) {
    careChange.addEventListener("click", function (ev) {
      ev.preventDefault();
      scrollToSection($("#preise"));
    });
  }

  /* 3.2 & 3.4 Klick auf Basic Care / Premium Care in der Betreuungs-Sektion */
  $$("a[data-care]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      var careKey = btn.getAttribute("data-care");
      if (state.websitePackage) {
        /* Zuvor wurde eine Website gewählt → Website + Betreuung kombinieren */
        state.inquiryType = "website";
        state.carePackage = careKey;
      } else {
        /* Direkt Betreuung gewählt → nur Website-Betreuung (ohne Starter!) */
        state.inquiryType = "maintenance";
        state.websitePackage = null;
        state.carePackage = careKey;
      }
      state.pickerOpen = false;
      renderState();
      scrollToSection($("#kontakt"), function () {
        if (!companyInput.value) companyInput.focus({ preventScroll: true });
      });
    });
  });

  /* 3.3 Klick auf „Ohne Betreuung fortfahren“ */
  if (skipCareBtn) {
    skipCareBtn.addEventListener("click", function () {
      state.inquiryType = "website";
      state.carePackage = null;
      state.pickerOpen = false;
      renderState();
      scrollToSection($("#kontakt"), function () {
        if (!companyInput.value) companyInput.focus({ preventScroll: true });
      });
    });
  }

  /* Ein-/Ausklappen der Auswahl im Formular (ohne Scroll-Auslösung) */
  if (selToggle) {
    selToggle.addEventListener("click", function () {
      state.pickerOpen = !state.pickerOpen;
      renderState();
    });
  }

  /* Manuelle Änderungen direkt im Formular (lösen kein automatisches Scrollen aus) */
  $$('input[name="Anfrageart"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (!r.checked) return;
      state.inquiryType = r.value;
      if (state.inquiryType === "maintenance") {
        if (!state.carePackage) state.carePackage = "basic";
      }
      state.pickerOpen = true;
      renderState();
    });
  });

  $$('input[name="w_pkg"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (!r.checked) return;
      state.inquiryType = "website";
      state.websitePackage = r.value;
      renderState();
    });
  });

  $$('input[name="w_care"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (!r.checked) return;
      state.carePackage = r.value === "none" ? null : r.value;
      renderState();
    });
  });

  $$('input[name="m_care"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (!r.checked) return;
      state.inquiryType = "maintenance";
      state.carePackage = r.value;
      renderState();
    });
  });

  renderState();

  /* ---------- Formular (Formspree, AJAX) ---------- */
  var submitBtn = $("#submit");
  var label = $(".btn__label", submitBtn);
  var statusEl = $("#status");
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
    if (!field) return;
    $(".err", field).textContent = msg;
    field.classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function validate() {
    var first = null;
    function bad(input, msg) { setError(input, msg); first = first || input; }

    /* Auswahl prüfen */
    if (state.inquiryType === "website" && !state.websitePackage) {
      state.pickerOpen = true;
      renderState();
      if (selErr) selErr.textContent = "Bitte wähle ein Website-Paket aus.";
      first = first || $('input[name="w_pkg"]');
    } else if (state.inquiryType === "maintenance" && !state.carePackage) {
      state.pickerOpen = true;
      renderState();
      if (selErr) selErr.textContent = "Bitte wähle Basic Care oder Premium Care aus.";
      first = first || $('input[name="m_care"]');
    } else if (selErr) {
      selErr.textContent = "";
    }

    if (!singleLine(companyInput.value, 100)) bad(companyInput, "Bitte gib den Namen deines Unternehmens an."); else setError(companyInput, "");
    if (!singleLine(nameInput.value, 100)) bad(nameInput, "Bitte gib deinen Namen an."); else setError(companyInput === first ? nameInput : nameInput, "");
    var v = emailInput.value.trim();
    if (!v) bad(emailInput, "Bitte gib deine E-Mail-Adresse an.");
    else if (!emailRe.test(v)) bad(emailInput, "Bitte gib eine gültige E-Mail-Adresse ein.");
    else setError(emailInput, "");

    /* Bestehende Website (nur Betreuung, optional) */
    if (state.inquiryType === "maintenance" && urlInput.value.trim() && !normalizeUrl(urlInput.value)) {
      bad(urlInput, "Bitte gib eine gültige Adresse ein, z. B. https://beispiel.at");
    } else setError(urlInput, "");

    if (first) first.focus();
    return !first;
  }

  /* Gibt eine bereinigte http(s)-URL zurück oder "" bei ungültiger Eingabe */
  function normalizeUrl(raw) {
    var s = singleLine(raw, 200).replace(/\s/g, "");
    if (!s) return "";
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
    try {
      var u = new URL(s);
      if ((u.protocol !== "http:" && u.protocol !== "https:") || u.hostname.indexOf(".") < 1 || /\.$/.test(u.hostname)) return "";
      return u.href;
    } catch (e) { return ""; }
  }

  [companyInput, nameInput, emailInput, urlInput].forEach(function (inp) {
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
    var isMaint = state.inquiryType === "maintenance";
    var data = new FormData();
    data.set("Anfragenummer", attemptRef);
    data.set("Anfrageart", isMaint ? "Website-Betreuung" : "Neue Website");
    if (!isMaint && state.websitePackage) {
      data.set("Website-Paket", PKG_LABELS[state.websitePackage]);
    }
    data.set("Betreuung", state.carePackage ? CARE_LABELS[state.carePackage] : "Keine Betreuung");
    if (isMaint && urlInput.value.trim()) {
      data.set("Bestehende-Website", normalizeUrl(urlInput.value));
    }
    data.set("Unternehmen", company);
    data.set("Kontaktperson", singleLine(nameInput.value, 100));
    data.set("email", emailInput.value.trim());
    var phoneVal = singleLine($("#phone").value, 40);
    if (phoneVal) data.set("Telefon", phoneVal);
    data.set("Projektbeschreibung", ($("#message").value || "").trim());
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
      state.inquiryType = "website";
      state.websitePackage = null;
      state.carePackage = null;
      state.pickerOpen = true;
      renderState();
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
