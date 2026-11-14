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
| Karte | `rheinbilanz/geometrie.py` | Flussläufe zwischen den Messstellen |

## Aufruf

Voraussetzung: Python ab 3.10 und `pdftotext` (Paket poppler-utils). Keine weiteren Pakete.

```bash
cd rhin-retention/werkzeug
python -m rheinbilanz stationen
python -m rheinbilanz aktualisieren            # alle Jahre neu schreiben
python -m rheinbilanz aktualisieren --ab 2025  # nur die jüngsten Jahresdateien
python -m rheinbilanz tabelle --ziel 25700100 --von 2018-10-15 --bis 2018-10-28
python -m rheinbilanz tabelle --ziel 2289 --von 2022-08-01 --bis 2022-08-31 --csv
python -m rheinbilanz karte                    # Kartengeometrie neu erzeugen
python -m unittest discover -s tests
```

Die Seite aktualisiert sich nicht von selbst. Für neue Werte `aktualisieren` ausführen und `daten/` einchecken.

## Quellen

- BAFU, Hydrologische Beobachtungen, Datenplattform BAFU (`data.bafu.admin.ch/api`). Tagesmittel ab 1970. Lizenz: Freie Nutzung, Quellenangabe ist Pflicht.
- WSV, bereitgestellt durch die BfG: Deutsches Gewässerkundliches Jahrbuch (`dgj-daten.bafg.de`, PDF je Pegel, Tageswerte der Abflussjahre 2008–2025) und PEGELONLINE (Rohdaten der letzten 31 Tage).
- Karte: Rheinachse von GeoRhena (Ebene `water:rhin`), übrige Flüsse und Seen von Natural Earth.
- Seeflächen: Wikidata, nicht amtlich. Thunersee ungeprüft (Wikidata 43,8 km², andere Angaben rund 48 km²). Die Werte stehen in `netz.py`.

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

- Deutsche Pegel: keine Tageswerte vor November 2007 und keine zwischen 1.1.2026 und dem Beginn des 31-Tage-Fensters von PEGELONLINE. Einmal geholte Rohwerte bleiben in der Jahresdatei erhalten.
- Neckar (Rockenau): Abfluss im Jahrbuch nur 2010–2020.
- Die Nahe (Mündung bei Bingen) ist nicht als Messstelle geführt; sie steckt im Zwischengebiet Mainz–Kaub.
- Der Stausimulator verschiebt das Volumen nur mit der Fliesszeit, ohne Abflachung der Welle und ohne Regulierreglemente.
