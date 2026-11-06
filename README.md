# SITE FOR YOU. — Website

Statische Website (HTML, CSS, Vanilla JS). Kein Build-Schritt, keine Abhängigkeiten, keine externen Schriften, Skripte oder Tracker. Produktions-Domain: https://siteforyou.at

## Lokal ansehen

```
python -m http.server 8000
```
Dann `http://localhost:8000` öffnen (oder `index.html` direkt öffnen).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Seite (Texte, Struktur, Meta-Tags, Canonical/Open Graph) |
| `styles.css` | Design |
| `script.js` | Paketauswahl, Formular, Animationen |
| `config.js` | **Zentrale Einstellungen** (`FORMSPREE_ENDPOINT`, Demo-URLs, E-Mail) |
| `impressum.html`, `datenschutz.html` | Rechtstexte |
| `assets/` | Favicon, optionale Vorschaubilder |

## Kontaktformular (Formspree)

- Endpoint: `config.js` → **`FORMSPREE_ENDPOINT`** (`https://formspree.io/f/FORM_ID`). Die Form-ID ist öffentlich; es gehören keine Passwörter oder API-Schlüssel ins Repository.
- Das Feld `email` setzt bei Formspree den Reply-To-Header. `_subject` setzt den Betreff: `SFY-JJJJMMTT-XXXXXXXX | Unternehmen`.
- Die Anfragenummer wird im Browser mit `crypto.getRandomValues` erzeugt (kein fortlaufender Zähler) und bei einem Wiederholungsversuch nach Fehler beibehalten.
- Spam-Schutz: Honeypot-Feld `_gotcha`; zusätzlich in Formspree „reCAPTCHA“ bzw. Spam-Filter nach Bedarf aktivieren.
- Ohne gültigen Endpoint wird nichts gesendet und es erscheint kein Erfolg.

**Formspree einrichten / prüfen**
1. Im Formspree-Dashboard das Formular `mzeeqpjl` öffnen, Empfänger `sobotovychillya@gmail.com` bestätigen (Bestätigungsmail).
2. Unter *Settings* die Domain/Origin-Beschränkung prüfen (`https://siteforyou.at`, zum Test auch `http://localhost:8000`), und dass reCAPTCHA nicht für AJAX-Anfragen blockiert.
3. Testanfrage über die Website senden. Erwartet: Erfolgsmeldung mit Anfragenummer; im Gmail-Postfach eine Mail mit Betreff `SFY-… | Firmenname`; „Antworten“ geht an die E-Mail des Interessenten; alle Felder (Anfragenummer, Unternehmen, Paket, Kontaktperson, Telefon, Projektbeschreibung) sind enthalten. Auch im Spam-Ordner nachsehen.
4. Bei Formspree *Free* gelten Limits (Anzahl Einreichungen/Monat); Details im aktuellen Preisplan prüfen.

## Cloudflare Pages

Das Projekt ist rein statisch, die Dateien liegen im Repository-Root.

- Neues Projekt: *Workers & Pages → Create → Pages → Connect to Git* → Repository `IllyaStack/SITE-FOR-YOU`
- Production branch: `main`
- Framework preset: **None**
- Build command: *(leer lassen)*
- Build output directory: **`/`** (Repository-Root)
- Danach *Custom domains* → `siteforyou.at` hinzufügen. DNS-Einträge bei easyname gemäß den Anweisungen von Cloudflare setzen (bzw. Nameserver wechseln); das geschieht außerhalb dieses Projekts.

Alle Pfade sind relativ und funktionieren im Domain-Root.

## Vor dem öffentlichen Start prüfen

- Formspree-Formular bestätigt und Test-Mail erhalten (siehe oben).
- Datenschutz: Aussagen zu Löschfristen (6 Monate) mit der tatsächlichen Praxis im Gmail-Postfach **und** in Formspree (Einreichungsarchiv) abgleichen; ggf. Einreichungen in Formspree löschen. Formspree-Datenverarbeitungsvereinbarung (DPA) und aktuelle Übermittlungsgrundlage selbst prüfen.
- Datenschutz/Impressum von einer fachkundigen Stelle (z. B. Wirtschaftskammer, Rechtsberatung) gegenlesen lassen.
- Cloudflare: Prüfen, ob in deinem Setup Cookies (z. B. durch Bot-Schutz) gesetzt werden (Browser-Entwicklertools → Application → Cookies), und die Cookie-Aussage ggf. präzisieren.
- Demo-Links in Inkognito-Fenster testen (insbesondere HairNails).
- Optional: Vorschaubilder in `assets/` ablegen und in `config.js` (`image`) eintragen; `og:image` ergänzen.
