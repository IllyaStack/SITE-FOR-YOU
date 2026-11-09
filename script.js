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

  function computeScrollTargetY(el) {
    if (!el || el.id === "top") return 0;

    /* Dynamische Klapp-Container, Reveal-Elemente und Überschriften-Parallaxe im Zielbereich
       für die Messung kurz auf Endzustand setzen, damit die Zielberechnung 100 % exakt ist. */
    var transient = $$(".collapse, .reveal, .section__head", el);
    for (var i = 0; i < transient.length; i++) {
      transient[i].style.transition = "none";
      if (transient[i].classList.contains("section__head")) {
        transient[i].style.setProperty("--py", "0px");
      }
    }
    void el.offsetHeight;

    var vh = window.innerHeight || document.documentElement.clientHeight || 800;
    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    var curY = window.scrollY || window.pageYOffset || 0;
    var hh = header ? header.offsetHeight : (vw >= 720 ? 76 : 64);
    var absTop = function (node) { return node.getBoundingClientRect().top + curY; };
    var targetY = 0;

    if (el.id === "preise") {
      var headEl = $(".section__head", el);
      var cardsEl = $(".plans", el);
      var firstCard = $(".plan", el);
      var firstBtn = $("[data-package]", el);
      if (cardsEl) {
        var cardsTop = absTop(cardsEl);
        var headTop = headEl ? absTop(headEl) : cardsTop;
        var headGap = Math.max(0, cardsTop - headTop);
        var activeCard = (vw >= 980 || !firstCard) ? cardsEl : firstCard;
        var cardsH = activeCard.offsetHeight;
        var ctaBottomOffset = firstBtn ? ((absTop(firstBtn) + firstBtn.offsetHeight) - cardsTop) : cardsH;
        var bottomPad = Math.max(14, Math.round(vh * 0.025));

        var idealWithHead = (hh + 10) + headGap;
        var maxForFullCards = vh - bottomPad - cardsH;
        var maxForCta = vh - bottomPad - ctaBottomOffset;

        var cardsVpTop;
        if (maxForFullCards >= idealWithHead) {
          /* Genug Platz für Überschrift + komplette Karten (z. B. 900p, 1080p) */
          cardsVpTop = idealWithHead;
        } else if (maxForFullCards >= hh + 6) {
          /* Karten passen komplett unter den Header (z. B. 768p) */
          cardsVpTop = Math.min(idealWithHead, maxForFullCards);
        } else {
          /* Niedriges Viewport (z. B. 600p): Preis, Leistungsliste und CTA-Buttons sicher sichtbar halten */
          cardsVpTop = Math.max(-28, Math.min(hh + 6, maxForCta));
        }
        targetY = cardsTop - cardsVpTop;
      } else {
        targetY = absTop(el) - hh;
      }
    } else if (el.id === "betreuung") {
      var cHeadEl = $(".section__head", el);
      var ctxEl = $("#care-context");
      var careCardsEl = $(".care", el);
      var firstCareCard = $(".care__item", el);
      var skipEl = $("#care-skip");
      if (careCardsEl) {
        var hasCtx = ctxEl && !ctxEl.classList.contains("is-closed");
        var hasSkip = skipEl && !skipEl.classList.contains("is-closed");
        var cCardsTop = absTop(careCardsEl);
        var cHeadTop = cHeadEl ? absTop(cHeadEl) : cCardsTop;
        var ctxTop = hasCtx ? absTop(ctxEl) : cCardsTop;
        var cHeadGap = Math.max(0, cCardsTop - cHeadTop);
        var ctxGap = hasCtx ? Math.max(0, cCardsTop - ctxTop) : 0;

        var blockBottom;
        if (vw >= 720) {
          blockBottom = (hasSkip && skipEl) ? (absTop(skipEl) + skipEl.offsetHeight) : (cCardsTop + careCardsEl.offsetHeight);
        } else {
          blockBottom = cCardsTop + (firstCareCard ? firstCareCard.offsetHeight : careCardsEl.offsetHeight);
        }
        var blockH = Math.max(0, blockBottom - cCardsTop);
        var cBottomPad = Math.max(10, Math.round(vh * 0.025));
        var cMaxForBottom = vh - cBottomPad - blockH;
        var minForCtx = (hh + 6) + ctxGap;
        var cIdealWithHead = (hh + 12) + cHeadGap;

        var cCardsVpTop;
        if (cMaxForBottom >= cIdealWithHead) {
          /* Genug Höhe für Überschrift + Kontextbanner + Karten + Skip-Button (z. B. 900p, 1080p) */
          cCardsVpTop = cIdealWithHead;
        } else {
          /* Auf kompakteren Höhen (z. B. 600p, 768p) Kontextbanner + Karten + Skip-Button optimal rahmen,
             ohne die Überschrift halb hinter dem Header abzuschneiden */
          var framedCtxVpTop = (hh + Math.round(Math.max(6, Math.min(24, (vh - 600) * 0.1)))) + ctxGap;
          cCardsVpTop = Math.max(minForCtx - 2, Math.min(framedCtxVpTop, cMaxForBottom));
        }
        targetY = cCardsTop - cCardsVpTop;
      } else {
        targetY = absTop(el) - hh;
      }
    } else {
      var inner = $(".contact__in, .section__head", el) || el;
      var innerTop = absTop(inner);
      var topOffset = hh + Math.round(Math.max(18, Math.min(40, vh * 0.04)));
      targetY = innerTop - topOffset;
    }

    requestAnimationFrame(function () {
      for (var j = 0; j < transient.length; j++) {
        transient[j].style.transition = "";
      }
    });

    var maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    return Math.max(0, Math.min(maxScroll, Math.round(targetY)));
  }

  function scrollToSection(el, afterScroll) {
    if (!el) return;
    pulseDepth();
    /* Ziel-Elemente sofort einblenden, damit beim programmatischen Sprung keine Verzögerung entsteht */
    $$(".reveal", el).forEach(function (r) { r.classList.add("is-in"); });
    if (el.id === "kontakt" && form) form.classList.add("is-in");
    var destY = computeScrollTargetY(el);
    window.scrollTo({ top: destY, behavior: reduceMotion ? "auto" : "smooth" });
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
  var rootPrefix = window.SFY_ROOT || "";
  function tr(key, fallback, vars) {
    if (window.SFY_I18N && window.SFY_I18N.t) return window.SFY_I18N.t(key, vars);
    return fallback !== undefined ? fallback : key;
  }

  $$(".project").forEach(function (card) {
    var projKey = card.getAttribute("data-project");
    var conf = (cfg.projects || {})[projKey] || {};
    var link = $(".project__link", card);
    var media = $(".project__media", card);
    var cta = $(".project__cta", card);
    var name = $("h3", card).textContent;

    if (conf.image) {
      var imgPath = rootPrefix + conf.image;
      var existingImg = $("img", media);
      if (!existingImg) {
        var img = new Image();
        img.src = imgPath;
        img.srcset = imgPath.replace(/\.webp$/, "-720.webp") + " 720w, " + imgPath + " 1440w";
        img.sizes = card.classList.contains("project--featured") ? "(min-width: 1300px) 1130px, 100vw" : "(min-width: 720px) 50vw, 100vw";
        img.alt = tr("work." + projKey + "Alt", "Startseite des Website-Konzepts " + name);
        img.setAttribute("data-i18n-alt", "work." + projKey + "Alt");
        img.width = 1440; img.height = 900;
        img.loading = card.classList.contains("project--featured") ? "eager" : "lazy";
        img.decoding = "async";
        media.appendChild(img);
        media.classList.add("has-img");
      }
    }

    var finalUrl = conf.url || (link && link.getAttribute("href")) || "";
    if (finalUrl && finalUrl !== "#") {
      link.href = finalUrl;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.setAttribute("aria-label", tr("work." + projKey + "Aria", name + " – Website-Konzept als Live-Demo öffnen (neuer Tab)"));
      if (cta) setDynamicText(cta, tr("work.cta", "Live-Demo"));
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
  var selErr = $("#sel-err");

  var companyInput = $("#company");
  var nameInput = $("#name");
  var emailInput = $("#email");
  var urlInput = $("#url");

  /* Stellt sicher, dass die 3 animierten Zusammenfassungs-Zeilen in #summary-list
     immer existieren – selbst falls das HTML aus einer älteren Vorlage stammt */
  var sumRowEmpty = $("#sum-row-empty");
  var sumEmptyTxt = $("#sum-empty-txt");
  var sumRowWeb = $("#sum-row-web");
  var sumWebVal = $("#sum-web-val");
  var sumRowCare = $("#sum-row-care");
  var sumCareVal = $("#sum-care-val");
  var sumCareTag = $("#sum-care-tag");

  function ensureSummaryRows() {
    if (!summaryList || (sumRowEmpty && summaryList.contains(sumRowEmpty))) return;
    summaryList.textContent = "";
    summaryList.className = "summary__rows";
    summaryList.innerHTML =
      '<div class="summary__row" id="sum-row-empty"><div class="summary__row-in"><div class="summary__empty" id="sum-empty-txt">Bitte wähle ein Website-Paket.</div></div></div>' +
      '<div class="summary__row is-closed" id="sum-row-web"><div class="summary__row-in"><div class="summary__item"><span class="summary__val" id="sum-web-val"></span><span class="summary__tag">Website</span></div></div></div>' +
      '<div class="summary__row is-closed" id="sum-row-care"><div class="summary__row-in"><div class="summary__item"><span class="summary__val" id="sum-care-val"></span><span class="summary__tag" id="sum-care-tag">Betreuung</span></div></div></div>';
    sumRowEmpty = $("#sum-row-empty");
    sumEmptyTxt = $("#sum-empty-txt");
    sumRowWeb = $("#sum-row-web");
    sumWebVal = $("#sum-web-val");
    sumRowCare = $("#sum-row-care");
    sumCareVal = $("#sum-care-val");
    sumCareTag = $("#sum-care-tag");
    if (window.SFY_TYPO_ENHANCE) window.SFY_TYPO_ENHANCE(summaryList);
  }
  ensureSummaryRows();

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

  function setDynamicText(el, nextText) {
    if (!el) return false;
    var prev = el.getAttribute("data-raw-text");
    if (prev === null) prev = el.textContent;
    if (prev === nextText) return false;
    el.setAttribute("data-raw-text", nextText);
    el.textContent = nextText;
    if (window.SFY_TYPO_ENHANCE) window.SFY_TYPO_ENHANCE(el);
    return !!prev;
  }

  function setSummaryVal(el, nextText) {
    if (!el) return;
    var hadPrev = setDynamicText(el, nextText);
    if (hadPrev && nextText && !reduceMotion) {
      el.classList.remove("is-swapping");
      void el.offsetWidth;
      el.classList.add("is-swapping");
    }
  }

  function getPkgDisplayLabel(key) {
    if (!key) return "";
    return tr("form.pkgLabel." + key, PKG_LABELS[key] || "");
  }

  function getCareDisplayLabel(key) {
    if (!key) return "";
    return tr("form.careLabel." + key, CARE_LABELS[key] || "");
  }

  function renderState() {
    var isMaint = state.inquiryType === "maintenance";
    var hasWebsite = !isMaint && !!state.websitePackage;

    /* 1. Preiskarten markieren + CTA-Text konsistent in aktueller Sprache setzen */
    var PLAN_CTA_DEFAULT = {
      starter: tr("price.starter.cta", "Starter anfragen"),
      business: tr("price.business.cta", "Business anfragen"),
      custom: tr("price.custom.cta", "Projekt anfragen")
    };
    var PLAN_CTA_SELECTED = {
      starter: tr("price.starter.ctaSelected", "✓ Starter ausgewählt"),
      business: tr("price.business.ctaSelected", "✓ Business ausgewählt"),
      custom: tr("price.custom.ctaSelected", "✓ Custom ausgewählt")
    };
    $$("[data-plan]").forEach(function (card) {
      var key = card.getAttribute("data-plan");
      var sel = !isMaint && state.websitePackage === key;
      card.classList.toggle("is-selected", sel);
      var btn = $("[data-package]", card);
      if (btn) {
        btn.setAttribute("aria-pressed", sel ? "true" : "false");
        setDynamicText(btn, sel ? PLAN_CTA_SELECTED[key] : PLAN_CTA_DEFAULT[key]);
      }
    });

    /* 2. Betreuungskarten + Kontext-Banner + Ohne-Betreuung-Button */
    setCollapse(careContext, hasWebsite);
    setCollapse(careSkip, hasWebsite);
    if (hasWebsite && careContextPkg) {
      setDynamicText(careContextPkg, getPkgDisplayLabel(state.websitePackage));
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
        if (sel) {
          setDynamicText(lbl, tr("care." + key + ".ctaSelected", "✓ " + baseName + " ausgewählt"));
        } else if (hasWebsite) {
          setDynamicText(lbl, tr("care." + key + ".ctaAdd", baseName + " hinzufügen"));
        } else {
          setDynamicText(lbl, tr("care." + key + ".ctaRequest", baseName + " anfragen"));
        }
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
      setDynamicText(selToggle, showPicker ? tr("form.toggleCollapse", "Auswahl einklappen") : tr("form.toggleExpand", "Auswahl anpassen"));
    }

    /* 6. Zusammenfassung animiert aktualisieren (jede Zeile gleitet sanft ein/aus) */
    ensureSummaryRows();
    var showEmpty = isMaint ? !state.carePackage : !state.websitePackage;
    var showWebRow = !isMaint && !!state.websitePackage;
    var showCareRow = isMaint ? !!state.carePackage : (!!state.websitePackage && !!state.carePackage);

    if (sumEmptyTxt) {
      setSummaryVal(sumEmptyTxt, isMaint ? tr("form.emptyMaint", "Bitte wähle Basic Care oder Premium Care.") : tr("form.emptyWebsite", "Bitte wähle ein Website-Paket."));
    }
    if (showWebRow && sumWebVal) {
      setSummaryVal(sumWebVal, getPkgDisplayLabel(state.websitePackage));
    }
    if (showCareRow && sumCareVal) {
      setSummaryVal(sumCareVal, getCareDisplayLabel(state.carePackage));
    }
    var sumWebTag = $("#sum-web-tag");
    if (sumWebTag) {
      setDynamicText(sumWebTag, tr("form.tagWebsite", "Website"));
    }
    if (sumCareTag) {
      setDynamicText(sumCareTag, isMaint ? tr("form.tagMaintOnly", "Website-Betreuung") : tr("form.tagCare", "Betreuung"));
    }
    if (sumRowCare) {
      sumRowCare.classList.toggle("has-top-line", showWebRow && showCareRow);
    }
    setCollapse(sumRowEmpty, showEmpty);
    setCollapse(sumRowWeb, showWebRow);
    setCollapse(sumRowCare, showCareRow);

    if (hasCompleteSelection && selErr) {
      selErr.textContent = "";
      selErr.removeAttribute("data-err-key");
    }
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
        state.websitePackage = null;
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
      state.websitePackage = null;
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

  function setError(input, msg, errKey) {
    var field = input && input.closest ? input.closest(".field") : null;
    if (!field) return;
    var errEl = $(".err", field);
    if (errEl) {
      errEl.textContent = msg;
      if (msg && errKey) errEl.setAttribute("data-err-key", errKey);
      else errEl.removeAttribute("data-err-key");
    }
    field.classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function validate() {
    var first = null;
    function bad(input, key, fallback) { setError(input, tr(key, fallback), key); first = first || input; }

    /* Auswahl prüfen */
    if (state.inquiryType === "website" && !state.websitePackage) {
      state.pickerOpen = true;
      renderState();
      if (selErr) {
        selErr.textContent = tr("form.err.pkg", "Bitte wähle ein Website-Paket aus.");
        selErr.setAttribute("data-err-key", "form.err.pkg");
      }
      first = first || $('input[name="w_pkg"]');
    } else if (state.inquiryType === "maintenance" && !state.carePackage) {
      state.pickerOpen = true;
      renderState();
      if (selErr) {
        selErr.textContent = tr("form.err.care", "Bitte wähle Basic Care oder Premium Care aus.");
        selErr.setAttribute("data-err-key", "form.err.care");
      }
      first = first || $('input[name="m_care"]');
    } else if (selErr) {
      selErr.textContent = "";
      selErr.removeAttribute("data-err-key");
    }

    if (!singleLine(companyInput.value, 100)) bad(companyInput, "form.err.company", "Bitte gib den Namen deines Unternehmens an."); else setError(companyInput, "");
    if (!singleLine(nameInput.value, 100)) bad(nameInput, "form.err.name", "Bitte gib deinen Namen an."); else setError(companyInput === first ? nameInput : nameInput, "");
    var v = emailInput.value.trim();
    if (!v) bad(emailInput, "form.err.emailRequired", "Bitte gib deine E-Mail-Adresse an.");
    else if (!emailRe.test(v)) bad(emailInput, "form.err.emailInvalid", "Bitte gib eine gültige E-Mail-Adresse ein.");
    else setError(emailInput, "");

    /* Bestehende Website (nur Betreuung, optional) */
    if (state.inquiryType === "maintenance" && urlInput.value.trim() && !normalizeUrl(urlInput.value)) {
      bad(urlInput, "form.err.urlInvalid", "Bitte gib eine gültige Adresse ein, z. B. https://beispiel.at");
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

  var lastStatus = null;

  function showStatus(type, titleKey, textKey, withMail, vars, noFocus) {
    lastStatus = { type: type, titleKey: titleKey, textKey: textKey, withMail: withMail, vars: vars };
    statusEl.className = "status is-visible is-" + type;
    statusEl.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = tr(titleKey, titleKey, vars);
    var span = document.createElement("span");
    span.textContent = tr(textKey, textKey, vars);
    statusEl.appendChild(strong);
    statusEl.appendChild(span);
    if (withMail && mail) {
      span.appendChild(document.createTextNode(tr("form.status.directMail", " Du kannst uns auch direkt schreiben: ")));
      var a = document.createElement("a");
      a.href = "mailto:" + mail;
      a.dir = "ltr";
      a.textContent = mail;
      span.appendChild(a);
      span.appendChild(document.createTextNode("."));
    }
    void statusEl.offsetWidth;
    statusEl.classList.add("is-in");
    if (!noFocus) statusEl.focus({ preventScroll: true });
  }
  function hideStatus() { lastStatus = null; statusEl.className = "status"; statusEl.textContent = ""; }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
    if (on) submitBtn.setAttribute("aria-busy", "true"); else submitBtn.removeAttribute("aria-busy");
    setDynamicText(label, on ? tr("form.submitting", "Wird gesendet") : tr("form.submit", "Anfrage senden"));
  }

  /* Bei Sprachwechsel alle dynamischen Zustände, Fehlermeldungen und Statusboxen sofort aktualisieren */
  if (window.SFY_I18N && window.SFY_I18N.onChange) {
    window.SFY_I18N.onChange(function () {
      renderState();
      setBusy(busy);
      $$(".err[data-err-key]").forEach(function (errEl) {
        var k = errEl.getAttribute("data-err-key");
        if (k) errEl.textContent = tr(k, errEl.textContent);
      });
      if (lastStatus) {
        showStatus(lastStatus.type, lastStatus.titleKey, lastStatus.textKey, lastStatus.withMail, lastStatus.vars, true);
      }
    });
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
      showStatus("error", "form.status.unconfiguredTitle", "form.status.unconfiguredText", true);
      return;
    }

    if (!attemptRef) attemptRef = makeReference();
    if (!attemptRef) {
      showStatus("error", "form.status.noCryptoTitle", "form.status.noCryptoText", true);
      return;
    }

    var company = singleLine(companyInput.value, 100);
    var isMaint = state.inquiryType === "maintenance";
    var activeLang = (window.SFY_I18N && window.SFY_I18N.getLang) ? window.SFY_I18N.getLang() : "de";
    var activeLangName = (window.SFY_I18N && window.SFY_I18N.getNativeName) ? window.SFY_I18N.getNativeName(activeLang) : "Deutsch";

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
    data.set("Sprache", activeLang + " (" + activeLangName + ")");
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
      showStatus("success", "form.status.successTitle", "form.status.successText", false, { ref: sentRef });
    }).catch(function (err) {
      /* Eingaben bleiben erhalten; attemptRef bleibt für den Wiederholungsversuch gleich */
      console.error("[SITE FOR YOU.] Formular-Fehler:", err);
      showStatus("error", "form.status.errorTitle", "form.status.errorText", true);
    }).then(function () {
      if (timer) clearTimeout(timer);
      setBusy(false);
    });
  });
})();
