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

`index.html`, `rhin.css`, `rhin.js` (Leaflet). Aufbau von oben nach unten:

1. Lage am angezeigten Tag: Abfluss und Pegel Kaub, Abstand zum GlW, Fahrrinnentiefe, Abfluss Basel, dazu Vorhersage und aktueller Rohwert.
2. Karte und Herkunft: Anteile nach Herkunftsgruppen (Schraffuren) und die Bilanz je Glied.
3. Rückhalt für die Schifffahrt: Einstellbar sind die zusätzliche Staukapazität je See und das Ziel der Abgabe (bis zum GlW heben oder ohne Deckel heben). Die Regeln stehen in `rheinbilanz/simulation.py`.
   Darunter: Verlauf an einer wählbaren Messstelle (Ziel, Basel oder die Messstelle unterhalb eines Sees), Speicherinhalt, Abgabe und Rückhalt je Tag nach Seegruppe und eine Tabelle je Seegruppe (Anteil, abgegebenes Volumen, grösste Abgabe, grösster Rückhalt, kleinster Abfluss unterhalb).
4. Herleitung: jede Formel mit den Zahlen des angezeigten Tages.

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
