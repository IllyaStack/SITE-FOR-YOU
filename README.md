# SITE FOR YOU. — Website

Einseitige, statische Website (HTML, CSS, Vanilla JS). Kein Build, keine Abhängigkeiten, keine Tracker, keine externen Schriften.

## Lokal ansehen

Doppelklick auf `index.html` genügt. Besser mit lokalem Server:

```
python -m http.server 8000
```
Dann `http://localhost:8000` öffnen (alternativ `npx serve`).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Seite (Texte, Struktur, Meta-Tags) |
| `styles.css` | Design |
| `script.js` | Verhalten (Paketauswahl, Formular, Animationen) |
| `config.js` | **Zentrale Einstellungen** |
| `impressum.html`, `datenschutz.html` | **Platzhalter – müssen ersetzt werden** |
| `assets/` | Favicon und deine Vorschaubilder |

## Das musst du vor der Veröffentlichung ersetzen

1. **E-Mail-Adresse** → `config.js`, `email`.
2. **Formular-Endpoint** → `config.js`, `formEndpoint`. Konto bei [Formspree](https://formspree.io) anlegen, Formular erstellen, URL `https://formspree.io/f/xxxxxxxx` eintragen. Solange das Feld leer ist, wird nichts gesendet und es erscheint ein Fehlerhinweis (Details in der Browser-Konsole). Erfolg wird nur angezeigt, wenn der Anbieter die Anfrage bestätigt hat.
3. **Projekt-URLs (GitHub Pages)** → `config.js`, `projects.h11.url`, `.hairnails.url`, `.loz.url`. Ohne URL ist die Karte nicht klickbar und zeigt „Demo folgt“.
4. **Vorschaubilder** → Screenshots in `assets/` legen (z. B. `work-h11.jpg`, 1600×1000 px, WebP/JPG, < 200 KB) und in `config.js` unter `image` eintragen.
5. **Domain** → in `index.html` im `<head>`: `canonical` und `og:url` (aktuell `https://example.invalid/`). Optional `og:image` einkommentieren und ein Bild (1200×630) in `assets/` legen.
6. **Impressum** → `impressum.html` komplett mit deinen Angaben ersetzen.
7. **Datenschutz** → `datenschutz.html` komplett ersetzen (inkl. Hinweis auf den Formular-Anbieter und das Hosting).
8. In beiden Rechtsseiten das Hinweisfeld und `<meta name="robots" content="noindex">` entfernen.

> **Wichtig:** Impressum und Datenschutz sind nur Platzhalter. Die Website darf **nicht öffentlich** gehen, bevor beide Seiten vollständig und rechtlich korrekt sind. Es wurden bewusst keine Firmendaten erfunden.

## Auf GitHub Pages veröffentlichen

1. Neues Repository auf GitHub erstellen und alle Dateien hochladen (`index.html` im Hauptordner).
2. **Settings → Pages → Build and deployment**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
3. Nach kurzer Zeit ist die Seite unter `https://<benutzername>.github.io/<repository>/` erreichbar. Alle Pfade sind relativ, das funktioniert auch in einem Unterpfad.
4. Eigene Domain: unter Pages „Custom domain“ eintragen, DNS bei deinem Anbieter setzen, „Enforce HTTPS“ aktivieren und danach Punkt 5 oben anpassen.

## Hinweise

- Preise und Texte stehen direkt in `index.html`.
- Das Paket-Dropdown im Formular wird bei Klick auf die Preisbuttons automatisch vorausgewählt.
- Animationen respektieren `prefers-reduced-motion`.
- Schrift: Inter, falls auf dem Gerät installiert, sonst die Systemschrift (bewusst ohne externe Anfragen). Wenn du Inter einbinden willst, lege die Schriftdatei lokal in `assets/` ab (`@font-face`).
