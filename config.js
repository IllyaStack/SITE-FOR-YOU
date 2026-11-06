/* ==========================================================================
   SITE FOR YOU. — zentrale Konfiguration
   Alle veränderlichen Werte stehen hier. Keine Geheimnisse eintragen:
   Die Formspree-URL ist öffentlich und darf im Frontend stehen.
   ========================================================================== */
window.SITE_CONFIG = {
  /* Produktions-Domain (ohne Slash am Ende). */
  siteUrl: "https://siteforyou.at",

  /* Öffentliche Kontakt-E-Mail (Fallback bei Formularfehlern). */
  email: "sobotovychillya@gmail.com",

  /* FORMSPREE_ENDPOINT — Form-URL aus dem Formspree-Dashboard:
     https://formspree.io/f/FORM_ID
     Leer = Formular sendet nichts und zeigt einen Fehlerhinweis. */
  FORMSPREE_ENDPOINT: "https://formspree.io/f/mzeeqpjl",

  /* PORTFOLIO: Live-Demos (GitHub Pages) und optionale Vorschaubilder.
     image = Screenshot (1440×900 WebP) plus gleichnamige Datei "-720.webp" (720×450)
     für kleine Bildschirme. Leer = gestalteter Platzhalter. */
  projects: {
    h11:       { url: "https://illyastack.github.io/H11-demo/",            image: "assets/portfolio/h11.webp" },       // H11 Neubau
    hairnails: { url: "https://illyastack.github.io/HairNails-demo/",      image: "assets/portfolio/hairnails.webp" }, // Hairnails
    loz:       { url: "https://illyastack.github.io/loz-redesign-demo/",   image: "assets/portfolio/loz.webp" }        // Loz
  }
};
