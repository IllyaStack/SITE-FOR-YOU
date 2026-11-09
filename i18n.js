/* ==========================================================================
   SITE FOR YOU. — Mehrsprachigkeits-System (i18n)
   Unterstützte Sprachen (BCP 47): de, en, uk, tr, it, zh-Hans, ar
   Standard: Deutsch (de). Keine automatische Browser-Spracherkennung.
   ========================================================================== */
(function () {
  "use strict";

  var SUPPORTED = ["de", "en", "uk", "tr", "it", "zh-Hans", "ar"];
  var SLUG_TO_LANG = {
    "": "de",
    "de": "de",
    "en": "en",
    "uk": "uk",
    "tr": "tr",
    "it": "it",
    "zh": "zh-Hans",
    "zh-hans": "zh-Hans",
    "ar": "ar"
  };
  var LANG_TO_SLUG = {
    "de": "",
    "en": "en",
    "uk": "uk",
    "tr": "tr",
    "it": "it",
    "zh-Hans": "zh",
    "ar": "ar"
  };
  var STORAGE_KEY = "sfy_lang";
  var locales = window.SFY_LOCALES || {};
  var listeners = [];
  var missingKeys = [];

  function normalizeLang(raw) {
    if (!raw) return null;
    var s = String(raw).trim();
    if (SUPPORTED.indexOf(s) !== -1) return s;
    var lower = s.toLowerCase();
    if (SLUG_TO_LANG[lower]) return SLUG_TO_LANG[lower];
    return null;
  }

  /* Vollständigkeitsprüfung aller Übersetzungen gegenüber Deutsch (de) */
  function checkCompleteness() {
    missingKeys = [];
    var base = locales["de"];
    if (!base) return missingKeys;

    function walk(obj, prefix, target, langCode) {
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var path = prefix ? (prefix + "." + k) : k;
        var val = obj[k];
        var tVal = target ? target[k] : undefined;
        if (val && typeof val === "object" && !Array.isArray(val)) {
          walk(val, path, tVal || {}, langCode);
        } else if (typeof tVal !== "string") {
          missingKeys.push(langCode + ":" + path);
        }
      }
    }

    for (var i = 0; i < SUPPORTED.length; i++) {
      var code = SUPPORTED[i];
      if (code === "de") continue;
      if (!locales[code]) {
        missingKeys.push(code + ":<entire-locale-missing>");
        continue;
      }
      walk(base, "", locales[code], code);
    }
    if (missingKeys.length && window.console && console.warn) {
      console.warn("[SITE FOR YOU. i18n] Fehlende Übersetzungsschlüssel:", missingKeys);
    }
    return missingKeys;
  }

  function resolveKey(lang, keyPath) {
    var parts = String(keyPath).split(".");
    function lookup(dict) {
      var cur = dict;
      for (var i = 0; i < parts.length; i++) {
        if (!cur || typeof cur !== "object") return undefined;
        cur = cur[parts[i]];
      }
      return typeof cur === "string" ? cur : undefined;
    }
    var res = lookup(locales[lang]);
    if (res !== undefined) return res;
    if (lang !== "de") {
      if (window.console && console.warn) {
        console.warn("[SITE FOR YOU. i18n] Fallback auf DE für Schlüssel:", lang + ":" + keyPath);
      }
      res = lookup(locales["de"]);
    }
    return res !== undefined ? res : keyPath;
  }

  var currentLang = "de";

  function t(keyPath, vars) {
    var str = resolveKey(currentLang, keyPath);
    if (vars && typeof str === "string") {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return str;
  }

  function getSavedLang() {
    try {
      return normalizeLang(window.localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* Private Mode ignorieren */ }
  }

  function detectRouteLang() {
    if (window.SFY_ROUTE_LANG) {
      var explicit = normalizeLang(window.SFY_ROUTE_LANG);
      if (explicit) return explicit;
    }
    try {
      var params = new URLSearchParams(window.location.search);
      var qLang = normalizeLang(params.get("lang"));
      if (qLang) return qLang;
    } catch (e) {}
    var m = (window.location.pathname || "").match(/(?:^|\/)(en|uk|tr|it|zh|ar)(?:\/|$|\/index\.html$)/i);
    if (m) return normalizeLang(m[1]);
    return null;
  }

  function detectInitialLang() {
    var routeLang = detectRouteLang();
    if (routeLang) {
      saveLang(routeLang);
      return routeLang;
    }
    var saved = getSavedLang();
    if (saved) return saved;
    return "de";
  }

  function updateSeoMeta(lang) {
    var pageType = document.body.getAttribute("data-page") || "home";
    var siteUrl = ((window.SITE_CONFIG && window.SITE_CONFIG.siteUrl) || "https://siteforyou.at").replace(/\/$/, "");
    var slug = LANG_TO_SLUG[lang] || "";

    if (pageType === "impressum") {
      document.title = t("meta.impressumTitle");
      var descImp = document.querySelector('meta[name="description"]');
      if (descImp) descImp.setAttribute("content", t("meta.impressumDesc"));
    } else if (pageType === "privacy") {
      document.title = t("meta.privacyTitle");
      var descPriv = document.querySelector('meta[name="description"]');
      if (descPriv) descPriv.setAttribute("content", t("meta.privacyDesc"));
    } else {
      document.title = t("meta.title");
      var desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", t("meta.description"));
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", t("meta.ogTitle"));
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", t("meta.ogDescription"));
      var ogLoc = document.querySelector('meta[property="og:locale"]');
      if (ogLoc) ogLoc.setAttribute("content", t("meta.ogLocale"));
      var pageUrl = slug ? (siteUrl + "/" + slug + "/") : (siteUrl + "/");
      var canon = document.querySelector('link[rel="canonical"]');
      if (canon) canon.setAttribute("href", pageUrl);
      var ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute("content", pageUrl);
    }
  }

  function updateDomStrings() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-i18n");
      var val = t(key);
      el.setAttribute("data-raw-text", val);
      el.textContent = val;
    }

    var htmlNodes = document.querySelectorAll("[data-i18n-html]");
    for (var h = 0; h < htmlNodes.length; h++) {
      var hEl = htmlNodes[h];
      var hKey = hEl.getAttribute("data-i18n-html");
      var hVal = t(hKey);
      hEl.innerHTML = hVal;
      hEl.hidden = !hVal;
    }

    var ariaNodes = document.querySelectorAll("[data-i18n-aria]");
    for (var a = 0; a < ariaNodes.length; a++) {
      var aEl = ariaNodes[a];
      aEl.setAttribute("aria-label", t(aEl.getAttribute("data-i18n-aria")));
    }

    var altNodes = document.querySelectorAll("[data-i18n-alt]");
    for (var m = 0; m < altNodes.length; m++) {
      var mEl = altNodes[m];
      mEl.setAttribute("alt", t(mEl.getAttribute("data-i18n-alt")));
    }

    var phNodes = document.querySelectorAll("[data-i18n-placeholder]");
    for (var p = 0; p < phNodes.length; p++) {
      var pEl = phNodes[p];
      pEl.setAttribute("placeholder", t(pEl.getAttribute("data-i18n-placeholder")));
    }
  }

  function updateSwitcherUI(lang) {
    var curCode = document.getElementById("lang-current");
    if (curCode) curCode.textContent = resolveKey(lang, "meta.short");
    var btn = document.getElementById("lang-btn");
    var menu = document.getElementById("lang-menu");
    var ariaTxt = t("nav.langAria") + " (" + resolveKey(lang, "meta.nativeName") + ")";
    if (btn) btn.setAttribute("aria-label", ariaTxt);
    if (menu) menu.setAttribute("aria-label", t("nav.langAria"));

    var opts = document.querySelectorAll("#lang-menu [role='option']");
    for (var i = 0; i < opts.length; i++) {
      var isSel = opts[i].getAttribute("data-lang") === lang;
      opts[i].setAttribute("aria-selected", isSel ? "true" : "false");
      opts[i].classList.toggle("is-active", isSel);
    }
  }

  function getBasePath() {
    var path = window.location.pathname || "/";
    var basePath = path
      .replace(/\/(en|uk|tr|it|zh|ar)\/(index\.html)?$/i, "/")
      .replace(/\/(index|impressum|datenschutz)\.html$/i, "/");
    if (basePath.slice(-1) !== "/") basePath += "/";
    return basePath;
  }

  function normalizeSubpathAssets(basePath) {
    if (window.location.protocol === "file:") return;
    var fav = document.querySelector('link[rel="icon"]');
    if (fav) {
      fav.setAttribute("href", basePath + "assets/favicon.svg");
    }
    var impLinks = document.querySelectorAll('a[href*="impressum.html"]');
    for (var i = 0; i < impLinks.length; i++) {
      impLinks[i].setAttribute("href", basePath + "impressum.html");
    }
    var privLinks = document.querySelectorAll('a[href*="datenschutz.html"]');
    for (var j = 0; j < privLinks.length; j++) {
      privLinks[j].setAttribute("href", basePath + "datenschutz.html");
    }
    var imgs = document.querySelectorAll('img[src*="assets/"]');
    for (var k = 0; k < imgs.length; k++) {
      var src = imgs[k].getAttribute("src");
      if (src) {
        imgs[k].setAttribute("src", basePath + src.replace(/^(\.\.\/)+/, "").replace(/^\//, ""));
      }
      var srcset = imgs[k].getAttribute("srcset");
      if (srcset) {
        var updatedSet = srcset.replace(/(?:(\.\.\/)+|\/)?(assets\/[^\s,]+)/g, basePath + "$2");
        imgs[k].setAttribute("srcset", updatedSet);
      }
    }
  }

  function updateHistoryUrl(lang) {
    if (!window.history || !window.history.replaceState) return;
    if (window.location.protocol === "file:") return;
    var pageType = document.body.getAttribute("data-page") || "home";
    var basePath = getBasePath();
    normalizeSubpathAssets(basePath);
    if (pageType !== "home") return;

    var path = window.location.pathname || "/";
    var slug = LANG_TO_SLUG[lang] || "";
    var nextPath = slug ? (basePath + slug + "/") : basePath;
    var hash = window.location.hash || "";

    /* Falls die Seite aus einem Unterordner geladen wurde (/en/) oder auf Root liegt,
       aktualisieren wir die URL ohne Reload */
    if (nextPath !== path) {
      try {
        window.history.replaceState({ lang: lang }, "", nextPath + hash);
      } catch (e) {}
    }
  }

  function setLanguage(lang, options) {
    var opts = options || {};
    var norm = normalizeLang(lang) || "de";
    var prevLang = currentLang;
    var keepScroll = opts.preserveScroll !== false && window.scrollY > 0;
    var savedScrollY = window.scrollY;
    currentLang = norm;

    if (opts.persist !== false) {
      saveLang(norm);
    }

    var dir = resolveKey(norm, "meta.dir") || "ltr";
    document.documentElement.setAttribute("lang", norm);
    document.documentElement.setAttribute("dir", dir);

    updateSeoMeta(norm);
    updateDomStrings();
    updateSwitcherUI(norm);

    if (opts.updateUrl !== false) {
      updateHistoryUrl(norm);
    }

    /* Alle registrierten Komponenten (Formular-Status, Typografie) benachrichtigen */
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](norm, prevLang);
      } catch (e) {
        if (window.console && console.error) console.error(e);
      }
    }

    if (window.SFY_TYPO_REBUILD) {
      window.SFY_TYPO_REBUILD();
    }

    if (keepScroll && Math.abs(window.scrollY - savedScrollY) > 0) {
      window.scrollTo(0, savedScrollY);
    }
  }

  /* ---------- Sprachumschalter im Header initialisieren ---------- */
  function initSwitcher() {
    var wrap = document.getElementById("lang-switcher");
    var btn = document.getElementById("lang-btn");
    var menu = document.getElementById("lang-menu");
    if (!wrap || !btn || !menu) return;

    /* Optionen aufbauen, falls noch leer */
    if (!menu.children.length) {
      for (var i = 0; i < SUPPORTED.length; i++) {
        var code = SUPPORTED[i];
        var li = document.createElement("li");
        li.className = "lang__opt";
        li.setAttribute("role", "option");
        li.setAttribute("id", "lang-opt-" + code);
        li.setAttribute("data-lang", code);
        li.setAttribute("tabindex", "-1");
        li.setAttribute("aria-selected", code === currentLang ? "true" : "false");

        var nameSpan = document.createElement("span");
        nameSpan.className = "lang__name";
        nameSpan.textContent = resolveKey(code, "meta.nativeName");
        /* Eigennamen der Sprache in ihrer jeweiligen Schrift/Richtung darstellen */
        nameSpan.setAttribute("lang", code);
        nameSpan.setAttribute("dir", resolveKey(code, "meta.dir") || "ltr");

        var shortSpan = document.createElement("span");
        shortSpan.className = "lang__short";
        shortSpan.textContent = resolveKey(code, "meta.short");

        li.appendChild(nameSpan);
        li.appendChild(shortSpan);
        menu.appendChild(li);
      }
    }

    var isOpen = false;

    function getOptions() {
      return Array.prototype.slice.call(menu.querySelectorAll("[role='option']"));
    }

    function openMenu(focusSelected) {
      if (isOpen) return;
      isOpen = true;
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      if (focusSelected) {
        var activeOpt = menu.querySelector('[data-lang="' + currentLang + '"]') || menu.firstElementChild;
        if (activeOpt) activeOpt.focus({ preventScroll: true });
      }
    }

    function closeMenu(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (returnFocus) btn.focus({ preventScroll: true });
    }

    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (isOpen) closeMenu(false);
      else openMenu(false);
    });

    btn.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        openMenu(true);
      } else if (ev.key === "Escape" && isOpen) {
        ev.preventDefault();
        closeMenu(true);
      }
    });

    menu.addEventListener("click", function (ev) {
      var opt = ev.target.closest ? ev.target.closest("[role='option']") : null;
      if (!opt) return;
      ev.stopPropagation();
      var chosen = opt.getAttribute("data-lang");
      closeMenu(false);
      if (chosen) setLanguage(chosen, { persist: true, updateUrl: true });
    });

    menu.addEventListener("keydown", function (ev) {
      var opts = getOptions();
      var idx = opts.indexOf(document.activeElement);
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeMenu(true);
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        var next = opts[(idx + 1) % opts.length] || opts[0];
        if (next) next.focus({ preventScroll: true });
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        var prev = opts[(idx - 1 + opts.length) % opts.length] || opts[0];
        if (prev) prev.focus({ preventScroll: true });
      } else if (ev.key === "Home") {
        ev.preventDefault();
        if (opts[0]) opts[0].focus({ preventScroll: true });
      } else if (ev.key === "End") {
        ev.preventDefault();
        if (opts[opts.length - 1]) opts[opts.length - 1].focus({ preventScroll: true });
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (idx !== -1) {
          var chosen = opts[idx].getAttribute("data-lang");
          closeMenu(true);
          if (chosen) setLanguage(chosen, { persist: true, updateUrl: true });
        }
      } else if (ev.key === "Tab") {
        closeMenu(false);
      }
    });

    document.addEventListener("pointerdown", function (ev) {
      if (isOpen && !wrap.contains(ev.target)) {
        closeMenu(false);
      }
    });
  }

  checkCompleteness();
  currentLang = detectInitialLang();

  window.SFY_I18N = {
    supported: SUPPORTED,
    missingKeys: missingKeys,
    t: t,
    getLang: function () { return currentLang; },
    getDir: function () { return resolveKey(currentLang, "meta.dir") || "ltr"; },
    getNativeName: function (code) { return resolveKey(code || currentLang, "meta.nativeName"); },
    setLanguage: setLanguage,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    checkCompleteness: checkCompleteness
  };

  initSwitcher();
  /* Beim ersten Laden Sprache anwenden; URL nur aktualisieren, falls explizit per Saved Preference gewechselt */
  setLanguage(currentLang, { persist: !!detectRouteLang() || !!getSavedLang(), updateUrl: true });
})();
