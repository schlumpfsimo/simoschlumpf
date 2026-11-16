# Prüfprotokoll vom 16.11.2026

Acht unabhängige Prüfläufe haben Daten, Rechnung, Seite und Texte nachgeprüft. Jeder Lauf hat mit eigenen Skripten gearbeitet und am Repo nichts geändert. Die Korrekturen sind danach von Hand eingebaut worden.

## 1 Was geprüft wurde

| Lauf | Gegenstand | Umfang |
|---|---|---|
| A | Schweizer Abflüsse und Seestände gegen die BAFU-Datenplattform und die BAFU-Jahrestabellen (PDF) | 12 Stationen, 9 Seepegel, 8 Jahre: 60'354 Tageswerte; 103 Jahrestabellen |
| B | Kaub, Mainz, Worms und die Kennwerte der sieben Richtpegel gegen Jahrbuch, HLNUG, PEGELONLINE, GDWS-Hinweis und ZKR-Beschluss | 2018, 2022, 2025, 2026 Tag für Tag |
| C | Zuflüsse, Abflüsse und Seen über alle Jahre 1970–2026 | Rest je Knoten, Kontrollbilanz Aare, Fliesszeiten per Kreuzkorrelation, langjährige Mittel |
| D | Simulation mit eigener Python-Rechnung nachgebaut | 24 Fälle (2011, 2018, 2022, 2026 × Stufe 1–3 × zwei Rechenweisen) |
| E | Seite in DE und FR durchgeklickt, Zahlen gegen die Daten | 4 Varianten, je 686 Bedienschritte, 12 CSV |
| F | Sachaussagen gegen die Primärquellen | ZKR, GDWS, IGKB, KHR, BAFU, Kantonsverfassung Thurgau |
| G | Neue Simulation nach den Korrekturen | 24 Fälle: Massenbilanz und Schranken Tag für Tag |
| H | Sichtbare Texte nach den Korrekturen | DE und FR |

## 2 Bestätigt

- BAFU: alle 60'354 verglichenen Tageswerte stimmen, kein Datumsversatz, keine Einheitenfehler. Jahresmittel und Jahresminimum stimmen mit den gedruckten Jahrestabellen überein (Basel 2018: 941 / 940,7 m³/s; Minimum 389 / 389,2).
- Kaub, Mainz, Worms: 2018, 2022 und 2025 an je 365 von 365 Tagen gleich dem Jahrbuch. 2026 stimmen alle vorhandenen Werte mit HLNUG und PEGELONLINE überein.
- Ankerwerte: Kaub 25 cm am 22.10.2018, 32 cm am 15./16.8.2022.
- Kennwerte: GlW, Fahrrinnentiefe unter GlW, höchster Schifffahrtswasserstand und Abschnittsgrenzen aller sieben Richtpegel stimmen mit PEGELONLINE, GDWS-Hinweis 2925/2022 und ZKR-Beschluss 2022-II-19 überein.
- Abflusskurve Kaub: bei 400–900 m³/s im Mittel 0,2–0,4 cm Abweichung, höchstens 1 cm. Q(GlW 77 cm) = 774,7 m³/s gegen amtlich 773 m³/s.
- Formel der Fahrrinnentiefe: 48 Werte der ELWIS-Grafik vom 10.–15.11.2026 stimmen auf 0,3 cm.
- Fliesszeiten: Basel–Maxau 0,8, Maxau–Worms 0,8, Basel–Kaub 2,2 Tage gemessen gegen 1, 1 und 2 Tage angenommen.
- Bedarf bis GlW: 2009 = 85, 2011 = 181, 2015 = 139, 2017 = 178, 2018 = 967, 2022 = 288 Mio. m³.
- Simulation: Die unabhängige Nachrechnung traf alle 24 Fälle exakt. Nach dem Umbau: Massenbilanz Tag für Tag auf unter 1 m³, Speicher nie negativ, Rückhalt nie über 10 % des Abflusses in Kaub, kein Tag durch Rückhalt unter den GlW gedrückt.
- Seite: keine Skriptfehler, kein «NaN», kein Überlauf; DE und FR zahlengleich; CSV gleich Anzeige.
- Quellen: ZKR-Stützwerte, IGKB-Angaben (90 m³/s, 15 cm, 8 %, rund 4 Tage), § 76 Abs. 3 KV Thurgau, Seeflächen, Reguliergrenzen und Gefahrenstufe 4 im Wortlaut gelesen.

## 3 Fehler und Korrekturen

| Nr. | Befund | Korrektur |
|---|---|---|
| 1 | Kaub 2026: Die zehn tiefsten Tage fehlten (25.–27.9., 29.9.–2.10., 6.–8.10.). Das HLNUG liefert für Kaub keine Tagesmittel um und unter 0 cm. Tage unter GlW, Tiefststand, NM7Q und Bedarf waren zu günstig. | Diese Tage sind aus dem Pegel Bingen abgeleitet (Abstand −23,0 cm, Streuung 2,0 cm, 96 Wertepaare) und als Status 9 bezeichnet. Gegenprobe: 1.10.2026 = −6 cm, die WSV meldete laut Presse −6 cm. |
| 2 | Folge von 1: NM7Q Kaub 2026 stand bei 476 m³/s (12.–18.8.). | Neu 422 m³/s (26.9.–2.10.). |
| 3 | Worms 2006: zwei Füllwerte −32763 cm als Wasserstand übernommen. | Entfernt; Füllwerte werden beim Lesen verworfen. |
| 4 | Simulation: Überschuss über der Hochwassergrenze wurde an einem Tag abgegeben. Das erzeugte künstliche Spitzen (Brügg 2018: 471 → 1'933 m³/s). | Entlastung höchstens 20 % des Abflusses unterhalb. Reicht das nicht, zählt der Tag als «Tag mit einem See über der Grenze». Grösste Entlastung jetzt 113–406 m³/s in Kaub. |
| 5 | Simulation: Der engste See deckelte den Inhalt aller Seen, auch den Bodensee. | Jeder See führt seinen eigenen Inhalt. |
| 6 | Simulation: Die Seen standen wochenlang genau an der Hochwassergrenze. | Gefüllt wird bis 20 cm unter die Grenze. |
| 7 | Zwei Tage zusätzliche Fliesszeit für den Bodensee: von den Messreihen nicht gestützt (Neuhausen wirkt am selben Tag in Basel). | Zurückgenommen. |
| 8 | «Kein Betrieb kann besser sein» stimmte nur für den tiefsten Stand, nicht für die Tage unter dem GlW. | Text berichtigt. |
| 9 | Zwei Zählweisen für simulierte Tage unter GlW (mit und ohne 1 cm Toleranz). | Einheitlich mit 1 cm Toleranz. |
| 10 | Kapitel 1: Satz «am weitesten darunter» erschien auch ohne Abschnitt unter dem GlW; Pegel und Abfluss aus verschiedenen Reihen oder Zeiträumen. | Der Text nennt die gemessenen Werte des angezeigten Tages. |
| 11 | Simulator: Jahresauswahl zeigte «2026», gerechnet wurde ein Jahr vor 2008. | Auswahl enthält alle Jahre. |
| 12 | «sichert … Fahrrinnentiefe», «Kaub ist die flachste Stelle», «Die Reedereien richten die Ladung nach diesem Pegel (ZKR)»: ungenau oder nicht in der Quelle. | Nach GDWS und ZKR neu gefasst (Sollwert, Strecke Budenheim–St. Goar). |
| 13 | «Unter 40 cm keine Schifffahrt»: Die ZKR schreibt «kann keine Binnenschifffahrt stattfinden, auch wenn einige Schiffe … bis zu 35 cm ausgelegt sind». | «praktisch keine Schifffahrt», mit dem Zusatz zu 35 cm. |
| 14 | Thurgau: nur der Kanton genannt, «Eingriffe» statt «Massnahmen», kein Datum. | Volksabstimmung vom 26. August 1973, Kanton und Gemeinden, Wortlaut nach § 76 Abs. 3. |
| 15 | «KHR und IGKB halten eine Regulierung für kaum realisierbar»: Das Urteil stammt von der KHR und betrifft die politische Machbarkeit. | Getrennt: KHR politisch und rechtlich, IGKB ökologisch. |
| 16 | Bodensee «Aufteilung nicht amtlich»: Die IGKB nennt 473 und 63 km² selbst. | Vorbehalt gestrichen. |
| 17 | Französisch: «Niveau» für Stufe und für Wasserstand; «guère réalisable» ohne «ne»; gewöhnliche Leerzeichen vor : ; % und in « »; «Basel» auf dem Knopf. | «Palier»; «difficilement réalisable»; geschützte Leerzeichen; «Bâle». |
| 18 | Unbenutzte Texte mit rhetorischen Fragen im Code. | Gelöscht. |
| 19 | Ältere Grafiken auf dem Telefon mit 4 px Schrift. | Mindestbreite 760 px, seitlich verschiebbar. |

## 4 Was sich an den Ergebnissen geändert hat

Kaub 2026, gemessen bzw. abgeleitet:

| | vor der Prüfung | nach der Prüfung |
|---|---|---|
| Tage mit Wert | 306 | 317 |
| Tage unter GlW | 114 | 125 |
| Tage unter 40 cm | 79 | 89 |
| Tiefster Stand | 1 cm (28.9.) | −6 cm (1.10.) |
| Kleinste Fahrrinnentiefe | 114 cm | 107 cm |
| Bedarf bis GlW | 2'015 Mio. m³ | 2'324 Mio. m³ |

Verbleibende Tage unter GlW mit der Betriebsregel, Stufe 1 / 2 / 3:

| Jahr | gemessen | vor der Prüfung | nach der Prüfung |
|---|---|---|---|
| 2018 | 102 | 43 / 25 / 15 | 37 / 15 / 0 |
| 2026 | 114 bzw. 125 | 91 / 80 / 73 | 96 / 81 / 60 |

Tage mit einem See über der Grenze (Betriebsregel, Stufe 1): 2011: 51, 2018: 30, 2022: 40, 2026: 43. Mit Voraussicht: 0 bis 2.

## 5 Offen

- Stufe 1 bleibt eine Obergrenze. Für Neuenburger- und Murtensee ist die Grenze der Beginn der Gefahrenstufe 4, und 52 % der Kapazität der Stufe 1 liegen dort.
- Die Betriebsregel hält den Speicher über den Winter voll. Daher die Tage über der Grenze.
- Die Tage unter dem GlW sind für alle Jahre mit 77 cm gezählt. Mit dem bis 2022 gültigen GlW von 78 cm wären es 2018 107 statt 102 und 2022 41 statt 40.
- Der Schutz vor einem Absinken unter den GlW gilt nur für Kaub. Worms fällt in einem Fall an 8 Tagen bis 17 cm darunter.
- Bezugskurven Speyer und Mannheim: beim GlQ 17 und 39 cm unter dem GlW. Die simulierte Hebung dort ist nicht belastbar; gemessene Werte sind nicht betroffen.
- «Unterhalb Basel 2026» im Herkunftsvergleich: Die Richtung stimmt, die Zahl ist unsicher (Kaub aus dem Wasserstand gerechnet, Zwischenpegel fehlen). In den Trockensommern 2018 und 2022 ergab dieselbe Rechnung 146 und 113 m³/s.
- Worms 2026: Wasserstand fehlt an 48 Tagen (dieselbe Ursache wie in Kaub), nicht ersetzt.
- Neckar fehlt vom 1.1.2021 bis 14.10.2026; sein Abfluss steckt in dieser Zeit im Rest Worms.
- Rest Basel–Rheinfelden und Rest Kaub–Mainz sind in einzelnen Jahren negativ. Die Kontrollbilanz Aare driftet 2011–2017 um −6 bis −12 m³/s.
- Referenzperiode Kaub 2010–2020 ist trockener als 1991–2020 (Mainz MQ 1'545 statt 1'602 m³/s).
- Seestände tragen keinen Status; 2026 sind sie roh. Thunersee 23.5.–30.11.2025: Rohwerte, die das BAFU-Jahrbuch nicht führt.
- Thur: auf 0,1 m³/s gerundet, bei Niedrigwasser bis 1,8 % Abweichung.
- Zählung 2026 in der Herleitung (287 gerechnete Tage) und im Text (285): zwei Tage Unterschied, nicht geklärt.
- Französische Fassung: Reihennamen im Datensatz, Bemerkungen in den See-Popups und einzelne Quellenzeilen der Herleitung sind noch deutsch.
- Abstimmungsergebnis Thurgau 1973: Datum belegt (KHR), Stimmenzahlen nur aus zweiter Hand.

## 6 Berichte der Prüfläufe

Die vollständigen Berichte mit allen Zahlen lagen während der Sitzung unter `scratchpad/pruef/` (bafu.md, wsv.md, bilanz.md, sim.md, seite.md, quellen.md). Sie sind nicht Teil des Repos.

## 7 Nachtrag vom 16.11.2026: Stufen, Hochwasserschutz, Betriebsregel

- Stufe 1 ist unterteilt in 1a (genutztes Band), 1b (bis zur amtlichen Hochwassergrenze) und 1c (Jurarandseen bis Gefahrenstufe 4).
- Hochwassertage sind neu definiert: Tage, an denen ein See mit Zusatzstau über seiner heutigen Hochwassergrenze steht. Sie sind in Grafiken, Tabellen und im Simulator markiert.
- Die Betriebsregel staut nur noch von April bis September und leert den Speicher ab 1. November. Die Zahlen in Abschnitt 4 zur Betriebsregel gelten damit nicht mehr.

Verbleibende Tage unter GlW mit der Betriebsregel, Stufen 1a / 1b / 1c / 2 / 3, dahinter in Klammern die Hochwassertage:

| Jahr | gemessen | 1a | 1b | 1c | 2 | 3 |
|---|---|---|---|---|---|---|
| 2011 | 28 | 16 (2) | 12 (3) | 1 (3) | 0 (82) | 0 (71) |
| 2018 | 102 | 50 (0) | 47 (0) | 39 (0) | 17 (142) | 6 (140) |
| 2022 | 40 | 15 (0) | 10 (2) | 0 (0) | 0 (32) | 0 (13) |
| 2026 | 125 | 110 (0) | 107 (0) | 106 (0) | 106 (0) | 103 (0) |

2026 bringt keine Stufe viel, weil der Rhein von April bis September kaum über 1'000 m³/s führte und der Speicher sich nicht füllte.

## 8 Nachtrag: Stufe «Unbegrenzt» und Füllen je See

- Der Simulator hat eine Stufe «Unbegrenzt»: Kapazität ohne Obergrenze, und die Seite rechnet die nötige Staukapazität für den GlW an allen Tagen aus.
- Das Füllen beachtet jetzt die Grenze jeder Messstelle unterhalb der Seen einzeln. Vorher deckelte die engste Messstelle alle Seen. Die Zahlen der Stufen ändern sich dadurch leicht (2018, Betriebsregel, Stufe 3: 2 statt 6 Tage unter GlW).

Nötige Staukapazität auf den regulierten Seen, mit Schranken:

| Jahr | Summe der Fehlbeträge | mit Voraussicht | Betriebsregel |
|---|---|---|---|
| 2011 | 181 | 170 | 334 |
| 2018 | 967 | 978 | 1'379 |
| 2022 | 288 | 270 | 516 |
| 2026 | 2'324 | nicht erreichbar | nicht erreichbar |

2026 reicht auch eine unbegrenzte Kapazität nicht, weil das Wasser zum Füllen fehlt. Mit der Betriebsregel bleiben bei 10'000 Mio. m³ 101 von 125 Tagen unter dem GlW, ohne Schranken 91.
