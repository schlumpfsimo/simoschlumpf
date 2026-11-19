# Rubbellos-Adventskalender 2026

Arbeitstitel. 24 gedruckte Lose mit je 4 Rubbelfeldern. Unter jedem Feld liegt ein QR-Code mit
Kürzel. Die Spielerin rubbelt, fotografiert das Los, die Seite liest die Codes und zeigt das Ergebnis.
Punkte tauscht sie im Katalog gegen Geschenke.

- Seite: `https://www.simoschlumpf.ch/advent/?t=<Token>` (Token danach im Browser gespeichert)
- Admin: `https://www.simoschlumpf.ch/advent/admin.html?t=<Admin-Token>`
- Druckvorlage: `https://www.simoschlumpf.ch/advent/druck.html` (Admin-Token nötig)

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `index.html`, `app.js` | Seite der Spielerin (Start, Los einlesen, Ergebnis, Katalog, Geschenke, Verlauf) |
| `admin.html`, `admin.js` | Admin-Seite |
| `druck.html`, `druck.js` | Druckvorlage A4 mit 4 Losen und Testblatt |
| `config.js` | Adresse der Apps-Script-Web-App |
| `theme/theme.json` | Alle Texte und der Name des Reveal-Moduls |
| `theme/theme.css` | Farben, Schriften, Abstände als CSS-Variablen |
| `theme/reveal/*.js` | Reveal-Animationen, austauschbar |
| `lib/` | zxing-wasm 3.1.6 (QR lesen, MIT), qrcode-generator (QR erzeugen, MIT) |
| `gas/*.gs` | Backend für Google Apps Script |
| `beispiel-konfiguration.json` | Beispiel für den Los-Generator (nicht die echte!) |
| `test/` | Tests (Node, ohne Google-Konto) |

Geheim bleibt, was im Sheet steht: Feldinhalte, Gewinne, Katalog, Geschenke, Tokens. Das Repo ist
öffentlich, darum gehört die echte Los-Konfiguration nie hierher, sondern nur auf die Admin-Seite.

## Einrichtung (einmal, ca. 20 Minuten)

### 1. Google Sheet und Apps Script
1. In Google Drive ein neues Google Sheet anlegen, z. B. «Rubbellos 2026».
2. Im Sheet: Erweiterungen → Apps Script.
3. Im Editor für jede Datei aus `advent/gas/` eine Skriptdatei mit gleichem Namen anlegen
   (Plus-Zeichen neben «Dateien» → Skript): `Admin`, `Api`, `Daten`, `Einrichten`, `Generator`,
   `Katalog`, `Spiel`. Den Inhalt jeweils ganz hineinkopieren. Die leere `Code.gs` löschen.
4. Projekteinstellungen (Zahnrad) → «Manifestdatei appsscript.json im Editor anzeigen» einschalten,
   dann `appsscript.json` mit dem Inhalt aus `advent/gas/appsscript.json` ersetzen.
5. Speichern. Oben die Funktion `einrichten` wählen und ▶ Ausführen. Google fragt nach Berechtigungen
   (Sheet, Drive, Mail): erlauben. Bei «Google hat diese App nicht überprüft»: Erweitert → Weiter.
6. Unten im Ausführungsprotokoll stehen die drei Links (Spielerin, Testzugang, Admin).
   Später nochmals anzeigen: Funktion `zugaengeAnzeigen` ausführen.

Alternative mit clasp (wie bei der Bon-Post): `clasp create --type sheets --title "Rubbellos 2026"`
im Ordner `advent/gas`, dann `clasp push`.

### 2. Als Web-App bereitstellen
1. Bereitstellen → Neue Bereitstellung → Typ «Web-App».
2. Ausführen als: «Ich». Zugriff: «Jeder».
3. Bereitstellen, die URL (endet auf `/exec`) kopieren.
4. In `advent/config.js` bei `window.ADVENT_API` eintragen, committen, pushen.

Nach jeder Änderung am Skript: Bereitstellen → Bereitstellungen verwalten → Stift → Version «Neue Version»
→ Bereitstellen. So bleibt die URL gleich. Ohne diesen Schritt läuft die alte Version weiter.

### 3. GitHub Pages
Die Website läuft schon über GitHub Pages (www.simoschlumpf.ch). Der Ordner `advent/` ist nach dem
Merge auf `main` automatisch unter `/advent/` erreichbar. Die Seiten haben `noindex` und sind nirgends verlinkt.

### 4. Inhalte im Sheet
- **Geschenke**: ID (z. B. G01), Titel, Art (`text`, `code`, `link`, `bild`), Inhalt, Beschreibung.
  Bei `bild` ist der Inhalt die Drive-Datei-ID oder der Drive-Link. Bilder höchstens etwa 800 px breit.
- **Katalog**: ID, Titel, Beschreibung, Bild (Drive-Link, optional), Preis, Sichtbarkeit
  (`sichtbar`, `verdeckt mit Preis`, `ganz verdeckt`), Sichtbar ab, Verfügbar bis (Datum als
  `2026-12-05` oder `5.12.2026`, leer = immer), Bestand (leer = unbegrenzt), Geschenk-ID (optional).
- **Einstellungen**: Nachholen erlaubt, Serienbonus, Serienbonus ab, E-Mail, Testdatum.
  Alle Blätter sind als Text formatiert. So bleiben Kürzel und Daten, wie sie sind.

### 5. Lose erzeugen und drucken
1. Admin-Seite → «Lose erzeugen». Konfiguration einfügen (Aufbau siehe `beispiel-konfiguration.json`
   und Kommentar oben in `gas/Generator.gs`). Zuerst «Prüfen», dann «Erzeugen».
2. `druck.html` öffnen, Feldgrösse auf die Rubbelkleber einstellen, zuerst das Testblatt drucken,
   mit dem Testzugang einlesen, dann alle Blätter drucken.
3. Nach dem Testen: Admin → Testzugang → «Testdaten löschen».

Wichtig: Wer die Lose neu erzeugt, macht gedruckte Lose ungültig (neue Codes).

## Testzugang
Der Testzugang hat eigene Einsendungen, Punkte und Bestellungen. Das Testdatum (Admin → Einstellungen)
gilt nur für ihn. So kannst du im Dezember parallel testen, ohne den Spielstand der Spielerin zu berühren.
Bestell-Mails aus dem Testzugang tragen «[Test]» im Betreff.

## Spielregeln im Code
Kommentar oben in `gas/Spiel.gs`. Kurz: Los ab seinem Datum (Europe/Zurich). Genau die verlangte
Felderzahl rubbeln (normal 2, Quiz 1). Zu wenige erkannt: Meldung, nichts verbraucht. Zu viele: Los
ungültig, 0 Punkte. Multiplikator wirkt auf die Feldpunkte desselben Loses. Serienbonus ab N Tagen in
Folge, nur für Lose, die am eigenen Tag eingereicht wurden.

## Theme ändern
- Texte: `theme/theme.json`. Platzhalter in geschweiften Klammern, z. B. `{punkte}`.
- Farben und Schriften: `theme/theme.css` (nur die Variablen oben ändern).
- Reveal: neue Datei in `theme/reveal/` nach dem Muster von `schlicht.js`, dann in `theme.json` bei
  `"reveal"` den Dateinamen eintragen.

## Tests
```
node --test advent/test/*.test.js
```
Die Tests bauen Sheet, Drive und Mail im Speicher nach (`test/gas-umgebung.js`) und spielen die Regeln durch.
