# ADVENTSRUBBEL bei SimOil

Adventskalender als Tankstelle. 24 gedruckte Rubbellose (A6, 4 pro A4-Blatt) mit je 4 Feldern. Unter jedem
Feld liegt ein QR-Code mit Kürzel. Sie rubbelt nach der Regel des Tages, fotografiert das Los im Terminal,
die Seite liest die Codes und zeigt das Ergebnis. Punkte tauscht sie im Regal gegen Ware. Simo, der
Kassierer, spricht über Sprechblasen mit ihr.

- Seite (nur Handy): `https://www.simoschlumpf.ch/advent/?t=<Spielerinnen-Token>` (Token danach im Browser gespeichert)
- Testzugang: gleiche Adresse mit dem Test-Token (eigene Daten, eigenes Testdatum)
- Admin: `https://www.simoschlumpf.ch/advent/admin.html?t=<Admin-Token>`
- Druckvorlage: `https://www.simoschlumpf.ch/advent/druck.html` (Admin-Token nötig)

## Was du selbst ändern kannst

| Was | Wo |
|---|---|
| Alle Texte, auch Simos Sprechblasen | `texte.json` (Abschnitt `simo` = Sprechblasen, `texte` = alles andere) |
| Farben, Schriften, Rundungen, Schatten | `farben.css` (nur die Variablen oben) |
| Ware im Regal | Admin-Seite → Reiter «Ware» (oder direkt im Blatt «Ware») |
| Zeichnungen der Ware | `ware.js` (Namen: kaffee, croissant, gluehwein, konzert, herz, pflanze, schlittschuh, zug, schokolade, duftbaum, kino, brief, koffer, paket, buch, kerze, blume, gutschein) |
| Simo, Stern, Wimpel, Logo | `grafik.js` |
| Lose (Verteilung der Effekte) | Admin-Seite → «Lose erzeugen» (Aufbau siehe `beispiel-konfiguration.json`) |
| Einstellungen (Nachholen, Serienbonus, Jackpot, Testdatum, E-Mail) | Admin-Seite → «Einstellungen» |

Simos Sprechblasen: Jede Situation ist eine Liste von Sätzen, die nacheinander erscheinen. Mehrere
Varianten als Liste von Listen; dann wählt die Seite zufällig eine. Situationen: `begruessung`,
`begruessung_erledigt`, `vor_start`, `ende`, `sonntag`, `los_pruefen`, `nichts_erkannt`, `gewinn`,
`niete`, `ungueltig`, `jackpot`, `sofortgewinn`, `regal`, `neue_ware`, `kauf`, `zu_wenig`, `oeffnen`, `fehler`.
Platzhalter: `{punkte}`, `{saldo}`, `{tag}`, `{ware}`, `{fehlend}`, `{datum}`.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | die Seite (Tankstelle, Terminal, Regal) |
| `app.js` | Gerüst: Wechsel zwischen den drei Ansichten, Knöpfe, Leiste |
| `tankstelle.js` | Startseite mit Schild, Leuchtschrift, Preistafel, Sonntagsverkauf |
| `terminal.js` | Lotto-Terminal: Foto, Erkennung, Korrektur, Einreichen, Ergebnis, Quittung |
| `regal.js` | Regal: Ware, Zustände, Kauf, Öffnen |
| `simo.js` | Sprechblase |
| `grafik.js`, `ware.js` | alle Zeichnungen als SVG |
| `klappziffern.js`, `konfetti.js`, `klang.js` | Klappziffern, Konfetti, Geräusche (standardmässig aus) |
| `erkennung.js` | QR-Codes im Browser lesen (zxing-wasm) |
| `kern.js`, `config.js` | Verbindung zum Server, Texte, Datum |
| `farben.css`, `simoil.css` | Aussehen |
| `admin.html`, `admin.js`, `admin.css` | Admin-Seite |
| `druck.html`, `druck.js` | Druckvorlage mit Testblatt |
| `fonts/` | Fredoka und VT323 (beide SIL Open Font License, Lizenztexte liegen bei) |
| `lib/` | zxing-wasm 3.1.6 (MIT), qrcode-generator (MIT) |
| `gas/*.gs` | Backend für Google Apps Script |
| `test/` | Tests |

Geheim bleibt, was im Sheet steht: Feldinhalte, Gewinne, Ware-Inhalte, Tokens. Das Repo ist öffentlich,
darum gehört die echte Los-Konfiguration nie hierher, sondern nur auf die Admin-Seite. Die Beispielware in
`beispiel-ware.json` dient nur den Tests.

## Einrichtung (einmal, ca. 20 Minuten)

### 1. Google Sheet und Apps Script
1. In Google Drive ein neues Google Sheet anlegen, z. B. «SimOil 2026».
2. Im Sheet: Erweiterungen → Apps Script.
3. Für jede Datei aus `advent/gas/` eine Skriptdatei mit gleichem Namen anlegen (Plus neben «Dateien» → Skript):
   `Admin`, `Api`, `Daten`, `Einrichten`, `Generator`, `Spiel`, `Ware`. Inhalt jeweils ganz hineinkopieren.
   Die leere `Code.gs` löschen.
4. Projekteinstellungen (Zahnrad) → «Manifestdatei appsscript.json im Editor anzeigen» einschalten, dann
   `appsscript.json` mit dem Inhalt aus `advent/gas/appsscript.json` ersetzen.
5. Speichern. Oben die Funktion `einrichten` wählen und ▶ Ausführen. Berechtigungen erlauben (Sheet, Drive,
   Mail). Bei «Google hat diese App nicht überprüft»: Erweitert → Weiter.
6. Im Ausführungsprotokoll stehen die drei Links (Spielerin, Testzugang, Admin). Später nochmals:
   Funktion `zugaengeAnzeigen` ausführen.

Mit clasp geht es auch: im Ordner `advent/gas` `clasp create --type sheets --title "SimOil 2026"`, dann `clasp push`.

### 2. Als Web-App bereitstellen
1. Bereitstellen → Neue Bereitstellung → Typ «Web-App». Ausführen als «Ich», Zugriff «Jeder».
2. Die URL (endet auf `/exec`) in `advent/config.js` bei `window.ADVENT_API` eintragen, committen, pushen.
3. Nach jeder Änderung am Skript: Bereitstellen → Bereitstellungen verwalten → Stift → Version «Neue Version».
   So bleibt die URL gleich.

### 3. GitHub Pages
Die Website läuft schon über GitHub Pages (www.simoschlumpf.ch). Nach dem Merge auf `main` ist der Ordner
unter `/advent/` erreichbar. Alle Seiten haben `noindex` und sind nirgends verlinkt.

### 4. Ware und Lose
1. Admin → «Ware»: Ware anlegen. Sofortgewinne als Zustand «versteckt» mit Preis 0; sie erscheinen erst im
   Regal, wenn sie gewonnen sind. Ihre ID (z. B. W90) kommt in die Los-Konfiguration als `S:W90`.
2. Admin → «Lose erzeugen»: Konfiguration einfügen, «Prüfen» (zeigt min./max. Punkte pro Los), dann «Erzeugen».
3. `druck.html`: Feldgrösse auf die Rubbelkleber einstellen, zuerst das Testblatt drucken (Skalierung 100 %,
   Hintergrundgrafiken an), mit dem Testzugang einlesen, dann alles drucken.
4. Nach dem Testen: Admin → Testzugang → «Testdaten löschen».

Neu erzeugen vergibt neue Codes. Gedruckte Lose werden dann ungültig.

## Spielregeln (Kurzfassung, Details oben in `gas/Spiel.gs`)
- Ein Los gilt ab seinem Datum (Europe/Zurich). Frühere Lose dürfen nachgeholt werden (einstellbar).
- normal und sonntag: 2 Felder. quiz: 1 Feld, nur das richtige zählt. Pro Los einstellbar.
- Zu wenige Codes: Meldung, nichts verbraucht. Zu viele: Los ungültig, 0 Punkte.
- Multiplikator wirkt auf die Feldpunkte desselben Loses. Serienbonus (an/aus) für Lose am eigenen Tag.
- Jackpot: ab «Jackpot ab» Punkten aus einem Los (Standard 100).
- Sofortgewinn: Die Ware gehört ihr sofort und steht im Regal.

## Testzugang
Eigene Einsendungen, Punkte und Käufe. Das Testdatum (Admin → Einstellungen) gilt nur für ihn. So kannst du
im Dezember parallel testen. Bestell-Mails aus dem Testzugang tragen «[Test]» im Betreff.

## Tests
```
node --test advent/test/*.test.js           # Regeln, Ware, Kauf, Admin, 24-Tage-Simulation (10 Durchläufe)
node advent/test/e2e-druck.js <ordner>      # Druckvorlage → PDF
node advent/test/e2e-simoil.js <ordner>     # Tankstelle, Terminal mit Foto, Regal mit Kauf (iPhone/Android)
node advent/test/e2e-admin.js <ordner>      # Admin-Seite
node advent/test/e2e-24tage.js <ordner>     # alle 24 Tage im Browser mit Fotos und Testdatum
node advent/test/server.js                  # lokaler Testserver zum Ausprobieren
```
Die Tests bauen Sheet, Drive und Mail im Speicher nach (`test/gas-umgebung.js`). Die Browsertests laufen in
Chromium mit iPhone- und Android-Emulation. Echte Geräte und das echte Apps Script prüfen sie nicht: dafür
die Checkliste unten.

## Checkliste vor dem 1.12. (echte Geräte)
1. Testlink auf dem iPhone in Safari öffnen: Tankstelle erscheint, Simo spricht, Ton-Knopf schaltet.
2. Testdatum auf den 1.12. setzen, Testblatt mit Kleber drucken, ein Feld rubbeln, im Terminal «Foto»:
   Kamera öffnet, Code wird erkannt. Zweites Feld rubbeln, nochmals, einreichen.
3. Dasselbe auf Android in Chrome.
4. Regal: Ware kaufen, E-Mail kommt an, «gehört dir» erscheint, Öffnen zeigt den Inhalt.
5. Admin: Einsendung mit Foto sichtbar, Testdaten löschen, Testdatum entfernen.
