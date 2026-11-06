/* ==========================================================================
   SITE FOR YOU. — zentrale Konfiguration
   Alle Werte, die du vor der Veröffentlichung ersetzen musst, stehen hier.
   ========================================================================== */
window.SITE_CONFIG = {
  /* FINAL DOMAIN: z. B. "https://www.siteforyou.at" (ohne Slash am Ende).
     Wird für Open Graph / Canonical benötigt – siehe auch <head> in index.html. */
  siteUrl: "",

  /* DEINE ECHTE E-MAIL-ADRESSE: z. B. "hallo@siteforyou.at".
     Wird als Alternative zum Formular angezeigt. Leer = Hinweis wird ausgeblendet. */
  email: "",

  /* FORMULAR-ENDPOINT: z. B. Formspree "https://formspree.io/f/xxxxxxxx".
     Leer = Formular sendet nichts (Entwicklungshinweis in der Konsole). */
  formEndpoint: "",

  /* PORTFOLIO: Live-Demo-URL (GitHub Pages) und Vorschaubild je Projekt.
     url leer  = Karte ist nicht klickbar, zeigt „Demo folgt“.
     image leer = gestalteter Platzhalter. Bild z. B. "assets/work-h11.jpg"
     (empfohlen: 1600×1000 px, WebP/JPG, unter 200 KB). */
  projects: {
    h11:       { url: "", image: "" }, // H11 Neubau
    hairnails: { url: "", image: "" }, // Hairnails
    loz:       { url: "", image: "" }  // Loz
  }
};
