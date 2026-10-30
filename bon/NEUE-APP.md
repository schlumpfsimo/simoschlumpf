# Neue Bon-App bauen

Anleitung für jeden Chat, der eine App für meinen Bondrucker baut. Zuerst ganz lesen, dann
bon/index.html, bon/text/index.html und bon/bild/index.html anschauen. Wer etwas Neues
über Drucker, Bon-Post oder Mac herausfindet, ergänzt es hier im selben PR.

Startprompt für einen neuen Chat:

> Lies bon/NEUE-APP.md und bau mir eine App, die …

## Was es schon gibt
- /bon/ ist die ungelistete Startseite mit Kacheln für alle Bon-Apps. Jede App hat einen
  eigenen Ordner bon/<pfad>/index.html und damit eine eigene Adresse.
- Neue Kachel: eine Zeile in der Liste `APPS` in bon/index.html (pfad, name), direkt vor
  «Namen», das immer zuletzt bleibt. Die Kacheln zeigen nur Nummer und Name, keine
  Beschreibung. Sonst nichts an der Startseite ändern.
- Vorlagen:
  - bon/text/: Text in IBM Plex Sans auf einer Leinwand gesetzt und gerastert → 1-Bit-PNG →
    Bon-Post, HTML-Bon. Die Vorschau ist genau der Druck. Für schöne Schrift so vorgehen statt
    `format: 'text'` (das druckt nur die eingebaute Drucker-Schrift).
  - bon/bild/: Bild umrechnen und rastern → 1-Bit-PNG → Bon-Post, HTML-Bon.
  - bon/namen/: druckt direkt per USB, über Stunden im Takt.
  - bon/glueckskeks/, bon/menu/, bon/kniffel/, bon/vokabeln/: mehrere Bons auf einmal. Jeder Bon
    ist eine eigene Einreichung, nacheinander mit `await` (Titel «… 2/5»), so schneidet das Messer
    jeden einzeln ab. Bricht es ab, sagen, wie viele gesendet sind, und nur den Rest anbieten.
  - bon/kniffel/, bon/schiffe/: Raster und Tabellen zum Ausfüllen. Mit `fillRect` auf ganzen
    Punkten zeichnen, Linien 2 Punkte, Rahmen 4 Punkte, Kästchen zum Schreiben mindestens 6–7 mm.
  - bon/vokabeln/: Text auf dem Kopf (translate + rotate(π) auf der Leinwand) und Falzkarten.
  - bon/postkarte/: Foto, Briefmarke, Poststempel. bon/spaziergang/: selbst gezeichnete Karte.
  - bon/rezept/: eigene Datensammlung (200 Rezepte in rezepte.js), Filter, Mengen umrechnen, Liste
    mit Kästchen zum Abhaken. Bettet das PNG schon nach der Regel mit 272 px und H × 17/36 px ein.
- Schriften (alle OFL) relativ einbinden statt kopieren: IBM Plex Sans (bon/text/), IBM Plex Serif
  inkl. kursiv und Playfair Display Black (bon/depeche/), Playfair Display Italic (bon/menu/),
  Caveat als Handschrift und Dancing Script als Schreibschrift (bon/postkarte/). Neue Schriften
  von Fontsource über jsDelivr, Lizenz prüfen. Vor dem Messen `document.fonts.load(...)`.
  Plex hat keine Pfeile (→ ↔), kein ≠ ✂ ▲ und kein schmales geschütztes Leerzeichen.
- Gesperrte Schrift auf der Leinwand Zeichen für Zeichen setzen: `ctx.letterSpacing` kann nicht
  jedes Safari.
- Stil wie /euroturbo: weiss, schwarz, Monospace, eckig, keine Schatten, keine Rundungen.
  Kopf, Knöpfe und Farben aus bon/text/ übernehmen.
- Jede App bindet gleich nach `</main>` und vor dem eigenen Skript `<script src="../protokoll.js"></script>`
  ein. Das zeigt unten das aufklappbare Feld «Druckaufträge»: alle Bons, die von diesem Gerät eingereicht
  wurden (localStorage `bon.protokoll`, gemeinsam für alle Apps), mit Stand wartet, wird gesendet,
  eingereicht, Fehler, abgebrochen. Das Skript fängt den `fetch` an die Bon-Post selbst ab, die App muss
  nichts tun. Nur bei mehreren Bons nacheinander vorher `window.bonProtokoll?.warten([titel, …])` aufrufen,
  dann stehen die noch nicht gesendeten als «wartet» drin. Druck direkt per USB (bon/namen/):
  `const e = window.bonProtokoll?.beginnen({ titel, weg: 'usb' })`, dann `e?.gedruckt()` oder
  `e?.fehler(text)`. Ob der Mac einen eingereichten Bon schon gedruckt hat, weiss die Website nicht
  (der Web-Schlüssel darf nicht abholen).
- Jede App hat oben links einen Knopf «← Zurück» zur Startseite (`href="../"`) und
  `<meta name="robots" content="noindex, nofollow">`. Sie ist von nirgends sonst verlinkt.
- Vor allem am Handy benutzt: Felder mit 16 px Schrift, damit iOS nicht zoomt, grosse Knöpfe,
  nichts darf über den Rand ragen.
- Sprache Deutsch, Schweizer Schreibweise («ss» statt «ß»). Mit mir in einfachen Worten reden,
  ohne Fachjargon.

## Der Drucker
- Equip 351003, 80 mm Thermo, ESC/POS, 203 dpi. Druckbreite 576 Punkte = 72 mm. Er hängt per
  USB an meinem MacBook Air (Druckerwarteschlange «POS80», roh, ohne Treiber).
- Er hat ein Schneidemesser. Oben an jedem Bon bleibt deshalb immer etwa 1–2 cm leer. Das ist normal.
- Die USB-Verbindung reisst selten kurz ab (im CUPS-Log «Unable to send data to printer»,
  schon seit September 2026). Bricht ein Druck mittendrin ab, wartet der Drucker noch auf
  Bilddaten und druckt den nächsten Bon als Zeichensalat. Abhilfe: Drucker aus- und einschalten.

## Weg 1: Bon-Post (Standard, immer zuerst prüfen)
- Bon-Post ist mein Google Apps Script. Apps reichen Bons ein, der Mac holt sie jede Minute ab
  und druckt sie. Funktioniert von jedem Gerät, auch vom Handy.
- Einreichen: `fetch` POST an
  `https://script.google.com/macros/s/AKfycbybhUj3fPzuWVAq5YSFySGDCOMm71ju701daFsumULrEZquLH13QnX97s5kP8P5EDly/exec`
  mit `Content-Type: text/plain` und einem JSON-String als Body, damit es keinen
  CORS-Preflight gibt: `{key, inhalt, format, titel, quelle}`.
  Antwort `{ok:true,id}` oder `{ok:false,fehler}`.
- `key` ist SCHLUESSEL_WEB = `web_0513d4bd6bdab3921edc5a817f93029b`. Er darf nur einreichen,
  nicht abholen, und steht bewusst im JavaScript.
- `format: 'text'`:
  - Zeichen in CP850, 48 Zeichen pro Zeile, der Drucker bricht um.
  - `titel` wird NICHT gedruckt. Ein Titel muss selbst oben in `inhalt` stehen (siehe bon/text/).
- Ohne `format` ist `inhalt` HTML:
  - Der Mac rendert es mit Chrome auf 72 mm (272 CSS-Pixel). Daraus macht er ein
    Schwarz-Weiss-Bild mit fester Schwelle: Alles dunkler als etwa 67 % Grau wird schwarz,
    alles hellere weiss, ohne Rastern.
  - Gestaltung deshalb: schwarz auf weiss, Masse in mm/pt, Inhalt 68 mm breit mit 2 mm Rand,
    keine Grautöne.
  - Fotos und Verläufe: selbst rastern wie in bon/bild/ und als 1-Bit-PNG mit 576 px Breite
    einbetten, mit fester Höhe, denn der Mac misst den Bon, bevor Bilder geladen sind.
  - Punktgenau kommt das PNG nur so an: Höhe H in Punkten auf ein Vielfaches von 36 aufrunden
    (`Math.ceil(h / 36) * 36`, unten weiss auffüllen) und in CSS-Pixeln einbetten:
    `width:272px;height:<H*17/36>px`. Mit `width:72mm` (= 272,13 px) oder krummen Höhen verdoppelt
    Chrome irgendwo eine Punktzeile. Bei bon/text/ und bon/bild/ ist das noch nicht umgestellt.
- Der Bon kommt innerhalb einer Minute, wenn der Mac wach ist. Ein gedruckter Bon bleibt
  14 Tage im Drive-Ordner «Bon-Post/gedruckt».

## Weg 2: direkt per USB (nur wenn die Bon-Post nicht reicht)
- Nur wenn es Sekundentakt oder einen laufenden Strom braucht, wie in bon/namen/. Geht nur in
  Chrome am Mac, an dem der Drucker hängt, mit WebUSB.
- Die USB-Teile aus bon/namen/ übernehmen:
  - Gerät nur während des Drucks öffnen, danach schliessen.
  - Nach `claimInterface` `selectAlternateInterface` und `clearHalt`.
  - Vor jedem Druck Nullbytes als Puffer.
  - Antwort jedes `transferOut` prüfen, bei `stall` nochmals senden.
  - Ohne künstliche Pausen senden, sonst stottert der Drucker und es gibt weisse Linien.
- WebUSB und die Bon-Post dürfen nicht gleichzeitig drucken, sonst gibt es Zeichensalat. In der
  App einen Hinweis zeigen, dass ich die Abholung vorher anhalte:
  `launchctl bootout gui/$(id -u)/ch.bonpost.abholen`
  und danach wieder einschalte:
  `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ch.bonpost.abholen.plist`

## Öffentliche Daten (getestet, ohne Schlüssel, vom Browser aus abrufbar)
- Vorlage für eine Zeitung aus vielen Quellen mit Spalten, Rubriken und Wetter-Piktogrammen: bon/depeche/.
- Wetter: Open-Meteo `api.open-meteo.com/v1/forecast` (Basel 47.5596, 7.5886, `timezone=Europe/Zurich`).
  Zeiten kommen als Ortszeit ohne Zone («2026-10-24T08:05»), also nicht mit `new Date` umrechnen.
- Open-Meteo hat auch `uv_index`, `uv_index_max`, `apparent_temperature`, `wind_gusts_10m`. Eine Antwort
  rechnet nur mit der heutigen Zeitverschiebung: Liegt die Zeitumstellung im Zeitraum, sind die Zeiten
  danach eine Stunde falsch. Sonnenzeiten darum selbst rechnen (sonnenzeit() in bon/depeche/).
- Rhein (Vorlage bon/rhy/): BAFU über `api.existenz.ch/apiv1/hydro/latest?locations=…&parameters=temperature,flow,height`
  (CORS offen). 2613 Weil, Palmrainbrücke: Wassertemperatur. 2289 Basel, Rheinhalle: Abfluss und
  Wasserstand `height` in m ü. M., keine Temperatur. 2091 Rheinfelden: Temperatur und Abfluss als Ersatz.
  Verlauf: `…/hydro/daterange?locations=2613&parameters=temperature&startdate=…&enddate=<morgen>`,
  Zeitstempel in Unix-Sekunden. Rheinschwimmen laut basel.com ab 18 °C und unter 246,5 m ü. M.
- Abfuhrtermine Basel-Stadt: data.bs.ch Datensatz 100096
  (`data.bs.ch/api/explore/v2.1/catalog/datasets/100096/records?select=termin,art&where=zone%3D%22D%22%20and%20termin%3E%3D%22JJJJ-MM-TT%22&order_by=termin&limit=100`).
  CORS erlaubt. Zonen A–H, Daten jeweils nur bis Ende Jahr. `geo_shape` ist ein GeoJSON-Polygon; ältere
  Jahre haben andere Zonengrenzen, für die Form den neusten Eintrag nehmen. Aus der Cloud-Testumgebung
  geht es mit curl nie, mit Chromium manchmal; vom Handy und von GitHub aus geht es.
- OpenStreetMap (Vorlage bon/spaziergang/): Overpass mit `fetch` POST an `overpass-api.de/api/interpreter`,
  Body `data=<Abfrage>`, `application/x-www-form-urlencoded` (kein Preflight). Ersatz `overpass.kumi.systems`,
  `overpass.private.coffee`. Gehsteige und Fussgängerstreifen weglassen. Nominatim nur auf Knopfdruck und
  ohne `no-referrer`. Karten selbst zeichnen statt Kacheln drucken, «© OpenStreetMap-Mitwirkende» auf den Bon.
  Aus der Cloud-Testumgebung nicht erreichbar: im Test die Antwort abfangen und nachbauen.
- Piktogramme aus bon/depeche/: nach `wolke()` die Füllfarbe wieder auf Schwarz setzen.
- Fahrplan: `transport.opendata.ch/v1/stationboard?station=…`.
- Wikipedia Deutsch, alles in einem Abruf: `de.wikipedia.org/api/rest_v1/feed/featured/JJJJ/MM/TT`
  (Artikel des Tages, «Was geschah am», «Schon gewusst?», Bild des Tages).
- Kurse der EZB: `api.frankfurter.dev/v1/latest?base=CHF`.
- Schlagzeilen: `/feed/data/news.json` liegt auf derselben Website und wird stündlich aufgefrischt.
- Ölpreis (Brent, WTI): keine freie Quelle mit CORS. `.github/workflows/bon-maerkte.yml` holt die Kurse
  alle drei Stunden bei Yahoo Finance und legt sie als `bon/depeche/maerkte.json` ab.

## Zeitplan: Bon zu einer festen Zeit (Beispiel bon/depeche/)
- Eine Webseite kann nur drucken, solange sie offen ist. Darum so:
  1. Die App speichert Uhrzeit, Wochentage und Einstellungen in der Bon-Post
     (`{key, aktion:'plan', plan}`, lesen mit `{key, aktion:'plan-lesen'}`).
  2. bon/bonpost/plan.gs in der Bon-Post prüft jede Minute und stösst zur Zeit (2 Minuten vorher)
     auf GitHub `.github/workflows/bon-depeche.yml` an. Dazu braucht es die Skripteigenschaft
     GITHUB_TOKEN (fine-grained, nur dieses Repo, «Actions: Read and write»). Den Token nie in den Chat
     und nie ins Repo schreiben.
  3. Der Workflow öffnet `bon/depeche/?auto=1&halt=…&teile=…` in Chrome (.github/scripts/bon-depeche.mjs).
     Die Seite holt frische Daten, reicht den Bon selbst ein und meldet `data-fertig="ok"`.
- Lokal ausprobieren ohne Druck:
  `npm i --no-save playwright-core && TROCKEN=1 CHROME=<pfad zu chrome> node .github/scripts/bon-depeche.mjs`
- Wikipedia drosselt Abrufe ohne Absender (Fehler 429). Darum `Api-User-Agent` mitschicken.
- plan.gs speichert nur aktiv, zeit, tage, halt und teile (a–z und Komma). Weitere Einstellungen als
  Kürzel in teile mitgeben, z. B. die Abfuhrzone als «zoned». Ein gespeicherter Zeitplan kennt neue
  Teile erst, wenn man ihn in der App neu speichert.

## Mac-Seite (zur Info)
- ~/bonpost/bonpost.sh holt die Bons ab. Text geht roh an `lp -d POS80 -o raw`. HTML wird mit
  Chrome zum Bild, dann als `GS v 0`-Raster in Blöcken zu 128 Zeilen gesendet. Am Ende folgen
  Vorschub `ESC d 6` und Schnitt `ESC i`.
- Vor jedem Bon sendet es 9300 Nullbytes. Hängt der Drucker an einem halben Bild, füllt er es
  damit auf statt Zeichensalat zu drucken.
- Die Warteschlange POS80 hat `printer-error-policy=retry-job`. Nach einem Fehler hält sie
  nicht an, sondern versucht es nach 30 Sekunden nochmals.

## Nicht anfassen
- ~/bonpost auf meinem Mac (bonpost.sh, installiere.sh, url.txt, log.txt) nur nach
  ausdrücklicher Rückfrage ändern.
- Den Bon-Post-Server (Apps Script, Script-ID
  `1vOh5XqS3-jIKzh6jWYJq__9Mk9SYVNB3oEa_qw9w187CAyeGe_r9cwPf`) nur ändern, wenn ich es
  ausdrücklich verlange. Dann über clasp, und die bestehende Bereitstellung mit
  `clasp deploy -i AKfycbybhUj3fPzuWVAq5YSFySGDCOMm71ju701daFsumULrEZquLH13QnX97s5kP8P5EDly`
  aktualisieren, damit die URL gleich bleibt.
- Den Hauptschlüssel SCHLUESSEL nie im Chat ausgeben und nie in eine Datei im Repo schreiben.

## Arbeitsweise
- Unklare Annahmen vorher fragen, zum Beispiel die Länge einer Papierrolle oder wie lang ein
  Bon höchstens werden darf.
- Testen mit Playwright:
  - Bon-Post und Drucker abfangen und nachbauen, damit nichts gedruckt wird.
  - Bei HTML-Bons: das Rendering der Bon-Post mit Chromium nachstellen (272 px, Schwelle 170) und
    das Ergebnis anschauen. In Playwright den Faktor mit `deviceScaleFactor: 2.117647` im Context
    setzen, `--force-device-scale-factor` allein wirkt dort nicht. Mit dem PNG vergleichen, Ziel
    0 abweichende Punkte.
  - Keinen festen Port für den Testserver (andere Chats testen gleichzeitig), oder die Dateien mit
    `ctx.route` direkt ausliefern. Nie `pkill -f` mit einem Muster, das die eigene Shell trifft.
  - Screenshots in 390 px und 1100 px Breite prüfen.
- Einen echten Test-Bon nur nach Rückfrage einreichen.
- Vor jedem Push origin/main holen und meinen Branch darauf bringen. Andere Chats ändern
  gleichzeitig bon/index.html.
- Ich merge PRs oft sofort. Vor jedem weiteren Push prüfen, ob der PR schon gemergt ist. Wenn
  ja, einen neuen PR von main aus öffnen und mir das sagen.
- Am Schluss in einfachen Worten: was die App macht, was getestet ist und was nicht, und was
  ich tun muss (mergen, welche Adresse öffnen, was ausprobieren).
