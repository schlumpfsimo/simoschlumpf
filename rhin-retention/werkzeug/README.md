# Rheinbilanz

Führt die Abflüsse des Rheins von den Alpen bis Kaub zusammen, bildet die Bilanz je Messstelle und schreibt die Daten für die Karte unter simoschlumpf.ch/rhin-retention.

## Aufbau

| Teil | Datei | Aufgabe |
|---|---|---|
| Netz | `rheinbilanz/netz.py` | Messstellen, Kanten, Fliesszeiten, Seen, Referenzperioden |
| Datenbezug | `rheinbilanz/quellen.py` | BAFU (GraphQL), PEGELONLINE, Jahrbuch-PDF der BfG |
| Cache | `rheinbilanz/cache.py` | legt jede Antwort unverändert unter `cache/` ab |
| Zusammenführung | `rheinbilanz/daten.py` | ein Bestand: Wert und Freigabestatus je Tag |
| Rechnung | `rheinbilanz/bilanz.py` | Zwischengebiet, Kontrollbilanz, Anteile, MQ, NM7Q, Seespeicher |
| Ausgabe | `rheinbilanz/ausgabe.py` | JSON für die Karte, Texttabelle, CSV |
| Karte | `rheinbilanz/geometrie.py` | Flussläufe zwischen den Messstellen aus HydroRIVERS |

## Aufruf

Voraussetzung: Python ab 3.10 und `pdftotext` (Paket poppler-utils). Keine weiteren Pakete.

```bash
cd rhin-retention/werkzeug
python -m rheinbilanz stationen
python -m rheinbilanz aktualisieren            # alle Jahre neu schreiben
python -m rheinbilanz aktualisieren --ab 2025  # nur die jüngsten Jahresdateien
python -m rheinbilanz tabelle --ziel 25700100 --von 2018-10-15 --bis 2018-10-28
python -m rheinbilanz tabelle --ziel 2289 --von 2022-08-01 --bis 2022-08-31 --csv
python -m rheinbilanz karte                    # Kartengeometrie neu erzeugen (braucht pyshp und HydroRIVERS, siehe unten)
python -m unittest discover -s tests
```

Die Seite aktualisiert sich täglich über `.github/workflows/rhin-retention.yml` (Jahresdateien der letzten zwei Jahre und `meta.json`).

## Quellen

- BAFU, Hydrologische Beobachtungen, Datenplattform BAFU (`data.bafu.admin.ch/api`). Tagesmittel ab 1970. Lizenz: Freie Nutzung, Quellenangabe ist Pflicht.
- HLNUG, Pegelportal Hessen (`hlnug.de/static/pegel/wiskiweb3`): Tagesmittel der WSV-Pegel am Rhein und Main, ab 2006 (Mainz Abfluss ab 1930) bis zum Vortag.
- WSV, bereitgestellt durch die BfG: Deutsches Gewässerkundliches Jahrbuch (`dgj-daten.bafg.de`, PDF je Pegel, Tageswerte der Abflussjahre 2008–2025) und PEGELONLINE (Rohdaten der letzten 31 Tage).
- Karte: Flussläufe aus HydroRIVERS v1.0 (Lehner & Grill 2013, hydrosheds.org). Für `karte` das Paket `pyshp` installieren, `HydroRIVERS_v10_eu_shp.zip` von hydrosheds.org entpacken und `RHEINBILANZ_HYDRORIVERS` auf die `.shp`-Datei setzen. Grundkarte der Seite: swisstopo (Schweiz) und OpenStreetMap.
- Seen: Flächen sowie Nieder- und Hochwassergrenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020, bafu.admin.ch/de/wichtige-seeregulierungen). Für Neuenburger- und Murtensee nennt das Faktenblatt keine eigenen Grenzen. Als Hochwassergrenze gilt dort der Beginn der BAFU-Gefahrenstufe 4 (Neuenburgersee 430,50, Murtensee 430,85 m ü. M., hydrodaten.admin.ch). Bodensee: 536 km² nach IGKB, Aufteilung Obersee 473 / Untersee 63 km² nicht amtlich belegt. Die Werte stehen in `netz.py`.

Jede Ausgabe nennt BAFU und WSV/BfG als Quelle.

## Rechenlogik

- Graph: Knoten = Messstellen, Kanten = Fliessstrecken.
- Je Knoten: gemessener Abfluss, Summe der Knoten oberhalb, Differenz = Zwischengebiet. Das Zwischengebiet ist ein Rest und wird immer so bezeichnet.
- Fliesszeiten in ganzen Tagen je Kante (`netz.py`). Es sind Annahmen: Basel–Maxau 1 Tag, Maxau–Worms 1 Tag, Neckar–Worms 1 Tag, sonst 0. Basel–Kaub ergibt 2 Tage.
- Kontrollbilanz: Aare Brugg + Reuss Mellingen + Limmat Baden gegen Aare Stilli. Die Abweichung erscheint als eigenes Bilanzglied.
- Anteile am Abfluss in Basel und Kaub: Summe des Glieds durch Summe des Zielabflusses, für MQ (alle Tage der Periode), Niedrigwasser (Tage der jährlichen NM7Q-Fenster am Ziel) und frei gewählte Zeiträume.
- MQ und NM7Q sind aus den Tageswerten gerechnet. Periode BAFU 1991–2020, deutsche Pegel 2010–2020. NM7Q = kleinstes Mittel über 7 Tage im Kalenderjahr.
- Seen: Speicheränderung = Fläche × Änderung des Tagesmittels. Genutztes Band = 1. bis 99. Perzentil des Wasserstands 1991–2020.

## Grundsätze

- Kein Wert wird erfunden oder interpoliert. Fehlt ein Wert, fehlt das Ergebnis.
- Fehlt die Reihe eines Nebenflusses, steckt er im Zwischengebiet; die Ausgabe nennt ihn.
- Jeder Wert trägt seinen Freigabestatus: roh, provisorisch, validiert, definitiv (BAFU) oder geprüft (DGJ).
- Ist eine Quelle nicht erreichbar, meldet das Werkzeug das und lässt den Teil leer.

## Bekannte Lücken

- Maxau, Speyer, Mannheim, Oestrich und der Neckar: keine Tageswerte zwischen 1.1.2026 und dem Beginn des 31-Tage-Fensters von PEGELONLINE (Mitte Oktober 2026). Einmal geholte Rohwerte bleiben in der Jahresdatei erhalten.
- Neckar (Rockenau): Abfluss im Jahrbuch nur 2010–2020.
- Die Nahe (Mündung bei Bingen) ist nicht als Messstelle geführt; sie steckt im Zwischengebiet Mainz–Kaub.
- Die Simulation verschiebt das Volumen nur mit der Fliesszeit, ohne Abflachung der Welle und ohne Regulierreglemente.

## Die Seite

`index.html`, `rhin.css`, `rhin.js` (Leaflet). Die Seite ist zweisprachig (`?l=fr`) und in zwei Teile und einen Anhang gegliedert: Teil 1 «Abfluss und Fahrbarkeit bis Kaub» (Kapitel 1 und 2, nur gemessene Werte), Teil 2 «Retentionssimulator» (Kapitel 3 und 4), Anhang (Herleitung mit der Bilanz des gewählten Tages, Datensatz, fehlende Daten). In den Kapiteln 1 bis 3 bleibt die Grafik stehen, der Text läuft in Schritten daran vorbei und verändert sie.

1. Der Rhein bis Kaub (nur gemessene Werte, immer an Kaub; der frühere Schalter «Bilanz für Basel» entfällt): Kennzahlen des gewählten Tages, Karte in sechs Schritten (Pegel Kaub, GlW, Abschnitte, Staustufen, Seen, Herkunft), danach Fahrbarkeit je Abschnitt, Längsschnitt, Herkunft, Bilanz und Seen.
2. Die Jahre: Abfluss in Kaub für 2019, 2018, 2022 und das laufende Jahr, Tage unter dem GlW schraffiert; für das laufende Jahr die Herkunft in den sieben trockensten Tagen gegen das mittlere Niedrigwasser. Nur gemessene Werte.
3. Rückhalt in den Seen: wählbares Jahr, sieben Schritte (ein Zentimeter, wie der Rückhalt wirkt, zwei Rechenweisen, Stufen 1, 2, 3, GlW an allen Tagen), danach die Liste «Nötige Speicherkapazität pro Jahr». Die gerechnete Linie erscheint erst im Schritt, der sie einführt.
4. Simulator: beginnt mit der nötigen Speicherkapazität des gewählten Jahres (Fehlmenge bis zum GlW, nötige Kapazität mit Voraussicht und mit Betriebsregel, bei Bedarf ohne Schranken, daneben der Platz je Stufe; `suche`, `bedarfZeichnen`). Das Jahr wird in der grossen Jahreszahl gewählt. Danach Stufe, Rechenweise und Zusatzstau je See; Verlauf, Speicher, Abgabe, Fahrbarkeit im Jahr, Nutzen nach Staukapazität, Seestand je See.
5. Herleitung: jede Formel mit den Zahlen des angezeigten Tages.
6. Datensatz.

Stufen (`stufeCM`, `stufeZiel`, `szenario` in `rhin.js`):

- Stufe 1a, im genutzten Band: bis zum 99. Perzentil des Seestands 1991–2020 (`band.hoch`), ohne Reserve.
- Stufe 1b, bis zur Hochwassergrenze: bis 20 cm unter die amtliche Hochwassergrenze; Neuenburger- und Murtensee (ohne amtliche Grenze) bleiben im Band.
- Stufe 1c: dazu Neuenburger- und Murtensee bis 20 cm unter den Beginn der Gefahrenstufe 4.
- Stufe 2, über der Hochwassergrenze: dazu 50 cm über der Grenze (im Simulator einstellbar).
- Stufe 3, mit Bodensee: dazu derselbe Zusatzstau auf Ober- und Untersee.

Stufe «Unbegrenzt» (`UNB`, `unbAnwenden`, `noetigZeichnen`): Die Staukapazität ist frei in Mio. m³ einstellbar, ohne Obergrenze und ohne Hochwassergrenze, und wird im Verhältnis der Fläche auf die regulierten Seen (wahlweise mit Bodensee) verteilt. Die Seite sucht durch Halbieren die kleinste Kapazität, mit der Kaub im gewählten Jahr an keinem Tag unter dem GlW liegt, für die gewählte Rechenweise, bis höchstens 10'000 Mio. m³. Wahlweise ohne Schranken: Dann dürfen die Seen ihren ganzen Abfluss zurückhalten und es gilt keine 10-%-Grenze in Kaub. Das ist die physikalische Obergrenze, nicht zulässig.

Füllen je See (`becken.fuellen`): Der Rückhalt aller Seen oberhalb einer Messstelle bleibt unter deren Grenze (20 % des Abflusses, nie unter den Tiefstwert im Fenster). Was ein See deshalb nicht aufnehmen kann, geht an die übrigen Seen. Vorher bestimmte die engste Messstelle den Rückhalt aller Seen.

Hochwasserschutz: Als Hochwassertag zählt jeder Tag, an dem ein See mit Zusatzstau über seiner heutigen Hochwassergrenze steht (`O.ueber`, je See `O.hwSee`). Die Seite markiert diese Tage schwarz in den Grafiken, umrandet die Zahl in den Tabellen und zeigt im Simulator einen umrandeten Hinweis mit den Tagen je See.

Betriebsregel (`regel`, `REGEL`): stauen nur in den Staumonaten (Standard April bis September) und nur über einem Abfluss in Kaub (Standard 1'000 m³/s); abgeben unter dem GlW, höchstens so viel, dass ein voller Speicher 30 Tage reicht; Winterleerung ab 1. November über 30 Tage (bis Ende Februar wird nicht gestaut). Reserve zur Grenze 20 cm. Alle Werte sind im Simulator einstellbar.

Speicher je See (nur `rhin.js`, Funktion `becken`): Jeder See führt seinen eigenen Inhalt. Gefüllt wird im Verhältnis des freien Platzes bis 20 cm unter die Hochwassergrenze (`RESERVE`), geleert im Verhältnis des Inhalts. Steigt ein See über die Grenze, gibt er den Überschuss ab, höchstens mit 20 % des Abflusses unterhalb. Reicht das nicht, zählt der Tag als «Tag mit einem See über der Grenze». `simulation.py` rechnet weiterhin mit einem gemeinsamen Speicher und dient nur noch den Tests der Grundregeln.

Zwei Rechenweisen: «mit Voraussicht» kennt alle Tageswerte des Speicherjahrs im Voraus (Bestfall); von Januar bis März wird zusätzlich gestaut, sobald Kaub mindestens 10 cm über dem GlW liegt, und dieses Wasser aus dem Winter geht ins nächste Speicherjahr (`VORRAT`), die Betriebsregel nur den Abfluss des Tages und den Speicherinhalt. Die Jahresliste rechnet die Stufen mit der Betriebsregel. Beim simulierten Pegel gilt 1 cm Toleranz zum GlW (Abweichung zwischen Messung und Abflusskurve).

Fliesszeit Bodensee: kein Zuschlag. Eine Änderung in Neuhausen erscheint nach den Messreihen am selben Tag in Rekingen und Basel (Regression der Tagesdifferenzen). Die Angabe der IGKB (2024) von rund vier Tagen bis Mannheim meint die Laufzeit des Wassers.

Unter jeder Grafik steht ein Knopf «CSV herunterladen» mit den Werten der Grafik.

Ansichten: Heute, Extremwerte (die zwölf tiefsten jährlichen NM7Q), Datum (jeder Tag seit 1970), Mittelwasser, mittleres Niedrigwasser.

## Fahrbarkeit

Die Seite beantwortet zwei Fragen: Was bedingt die Fahrbarkeit, und was brächte eine Retention.

- Basel–Iffezheim (Rheinkilometer 170–334): staugeregelt. Die Seite zeigt die Staustufen (Lage nach Wikidata) und setzt dort keine Abhängigkeit vom Abfluss an.
- Unterhalb Iffezheim: sieben Abschnitte nach dem schifffahrtspolizeilichen Hinweis der GDWS über die Fahrrinnenverhältnisse auf der deutschen Rheinstrecke (GlW 2022, ELWIS, Nachricht 2925/2022): Maxau km 334–384, Speyer 384–410,5, Mannheim 410,5–431,5, Worms 431,5–462, Mainz 462–508, Oestrich 508–540, Kaub 540–566 (`netz.RICHTPEGEL`). GlW, Fahrrinnentiefe unter GlW und höchster Schifffahrtswasserstand kommen aus PEGELONLINE, die Wasserstände aus dem Jahrbuch (ab 2008) und den Rohwerten der letzten 31 Tage.
- Oestrich fehlt im Jahrbuch. An Tagen ohne Wert dient der Pegel Bingen (km 528,4, im selben Abschnitt), auf den GlW von Oestrich umgerechnet: W = W_Bingen − GlW_Bingen + GlW_Oestrich. Die Abweichung an den gemeinsamen Tagen steht in `meta.json` (`richtpegel[].ersatz`).
- Fahrrinnentiefe = W − GlW + Tiefe unter GlW. Das ist dieselbe Rechnung wie die «rechnerisch verfügbaren Fahrrinnentiefen» der WSV auf ELWIS; für Maxau und Kaub am 10. bis 14.11.2026 gegen deren Grafik geprüft, die Werte stimmen überein.
- Zustand je Abschnitt: `schifffahrt.fahrbarkeit` (voll, bis 30 cm, 30 bis 60 cm, mehr als 60 cm unter GlW, gesperrt über HSW). Die Stufen sind eine Darstellungswahl.
- Simuliert: W_sim = W + f(Q + ΔQ) − f(Q) mit der Bezugskurve des Pegels; Q ist der Abfluss am Bezugspegel im Netz. Mannheim und Oestrich haben keine eigene Abflussreihe und beziehen sich auf Maxau bzw. Mainz.
- Karte: Abschnitte entlang der Rheinkilometrierung (GeoRhena nach WSV), Strichart nach Zustand.

## Vier Grafiken

- Längsschnitt Basel–Kaub: Fahrrinnentiefe je Abschnitt über dem Rheinkilometer am gewählten Tag, gemessen und simuliert, mit Soll und Staustufen.
- Jahresband: Zustand je Abschnitt und Tag des Jahres, gemessen und simuliert.
- Kapazitätskurve: kleinste Fahrrinnentiefe in Kaub gegen die zusätzliche Staukapazität; die gewählten Stauhöhen werden gemeinsam skaliert.
- Jahresvergleich Kaub: je Jahr ab 2008 Tage unter GlW, kleinste Fahrrinnentiefe gemessen und simuliert, Bedarf bis zum GlW.

Alle vier rechnet `rhin.js` im Browser aus den Jahresdateien.

## Datensatz auf der Seite

Der Abschnitt «Datensatz» zeigt jede Reihe mit Quelle, Zeitraum, Anzahl Tage und Status (`meta.json`, Feld `reihen`), die Tageswerte des gewählten Jahres als Tabelle und einen CSV-Export für ein Jahr oder alle Jahre. Die CSV-Datei entsteht im Browser aus den Jahresdateien; Abflussspalten tragen je eine Statusspalte.

## Schifffahrt und Schätzung

- `rheinbilanz/schifffahrt.py`: Abflusskurve Kaub (Stützpunkte aus Tageswertpaaren W/Q des jüngsten Jahrbuchjahres und den Rohwerten danach), Fahrrinnentiefe = W − GlW + Tiefe unter GlW, Kennwerte und 4-Tage-Vorhersage aus PEGELONLINE.
- Lücke nach dem Jahrbuch: Für Kaub, Mainz, Worms, Bingen und Frankfurt Osthafen liefert das Pegelportal des HLNUG (`quellen.hlnug_tagesmittel`) Tagesmittel bis zum Vortag (Status «Tagesmittel WSV über HLNUG»). Reihenfolge je Tag: Jahrbuch, HLNUG, PEGELONLINE.
- Abfluss Kaub: Das HLNUG führt für Kaub nur den Wasserstand. An Tagen ohne Abflusswert wird er aus dem Wasserstand über die Abflusskurve gerechnet (`schifffahrt.abfluss_aus_wasserstand`, Status «aus Wasserstand»); unter dem tiefsten Stützpunkt wird die Kurve um höchstens 12 cm linear verlängert (eigener Status). Wasserstand und Fahrrinnentiefe sind an diesen Tagen gemessen. Ein gemessener Abfluss ersetzt den gerechneten, sobald er vorliegt.
- `rheinbilanz/simulation.py`: Rückhalt und Abgabe (Speicherjahr vom 1. April bis 31. März, Rückhalt höchstens 10 % des Abflusses; die Seite setzt das Kalenderjahr aus zwei Speicherjahren zusammen und übergibt den Rest als Anfangsinhalt `start_m3`, der Speicher läuft also über den Jahreswechsel). Zwei Ziele: `heben` hebt die Tage unter dem GlW in Kaub, die tiefsten zuerst auf ein gemeinsames Niveau L*, höchstens bis zum GlW; gestaut wird nur über H* ≥ GlW (Standard der Seite). `optimieren` hebt den kleinsten Tagesabfluss ohne Deckel. Hochwassergrenze (`speichergrenze`): Seestand plus Zusatzstau bleibt unter der Hochwassergrenze des Sees; liegt der Inhalt darüber, wird der Überschuss am selben Tag abgegeben. Betriebsregel ohne Voraussicht (`regel`): unter dem GlW auffüllen, höchstens so, dass ein voller Speicher D Tage reicht (Standard 30), stauen ab einem festen Abfluss in Kaub (Standard 1'000 m³/s); sie läuft durchgehend über Vorjahr, Jahr und Folgejahr. Die Seite zeigt beide Rechenweisen und den Abstand zwischen ihnen. Grenze je See (`seegrenze`): Rückhalt höchstens 20 % des Abflusses an der Messstelle unterhalb und nie unter deren gemessenen Jahrestiefstwert; die Seen stauen im Verhältnis ihrer Kapazität, der engste See bestimmt den Rückhalt aller. Dieselben Regeln rechnet `rhin.js` im Browser.
- Auslastung der Flotte (`schifffahrt.auslastung`): Stützwerte nach ZKR, «Act now!» Ed. 3.0 (2023), am Beispiel eines Containerschiffs: 100 % ab 250 cm am Pegel Kaub, 50 % bei 134 cm, 25 % bei 72 cm, 15 % bei 44 cm, unter 40 cm keine Schifffahrt. Zwischen den Stützwerten wird linear gerechnet (Annahme). Die Werte stehen in `meta.auslastung`.
- Füllung und Entleerung je See: Die Seite zeigt für den gewählten See den gemessenen Seestand, den Seestand mit Rückhalt und die Hochwassergrenze. Gefüllt wird aus dem gemessenen Abfluss an der Messstelle unterhalb des Sees (nicht aus Zuflussmessungen oberhalb). Die Änderung wirkt in Basel am selben Tag, in Kaub zwei Tage später (Annahme, ohne Abflachung der Welle).
- Kaub, Tage ohne Wasserstand: Das Pegelportal des HLNUG liefert für Kaub keine Tagesmittel um und unter 0 cm. 2026 fehlten deshalb gerade die tiefsten Tage (25.–27.9., 29.9.–2.10., 6.–8.10.). `daten._kaub` leitet sie aus dem Pegel Bingen ab: Kaub = Bingen + mittlerer Abstand beider Pegel an den Niedrigwassertagen desselben Jahres (2026: −23,0 cm, Streuung 2,0 cm, 96 Wertepaare). Der Abfluss folgt aus der Abflusskurve, die dafür um höchstens 20 cm verlängert wird. Status 9. Gegenprobe: Für den 1.10.2026 ergibt das −6 cm, die WSV meldete laut Presse −6 cm.
- Füllwerte der Quelle (z. B. −32763) werden beim Lesen verworfen.
- Prüfung vom 16.11.2026 (sechs unabhängige Prüfläufe): BAFU-Reihen an 60'354 Tageswerten ohne Abweichung; Kaub, Mainz, Worms 2018, 2022, 2025 Tag für Tag gleich dem Jahrbuch; Abflusskurve Kaub bei Niedrigwasser auf 0,4 cm; Q(GlW) 774,7 m³/s gegen amtlich 773. Offene Punkte: Seestände ohne Status; Thur auf 0,1 m³/s gerundet (bis 1,8 %); Bezugskurven Speyer und Mannheim bei Niedrigwasser ungenau (−17 und −39 cm beim GlQ), die simulierte Hebung dort ist nicht belastbar; Rest Basel–Rheinfelden und Kaub–Mainz in einzelnen Jahren negativ; Referenzperiode Kaub 2010–2020 trockener als 1991–2020.
