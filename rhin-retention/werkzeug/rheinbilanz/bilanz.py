"""Rechnung. Reine Funktionen über Reihen {datum: wert}; kein Datenbezug, keine Ausgabe.

Grundsatz: Fehlt ein Wert, fehlt das Ergebnis (None). Es wird nichts interpoliert.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass

from .netz import Netz

EIN_TAG = dt.timedelta(days=1)


@dataclass
class Knotenbilanz:
    gemessen: float | None          # Abfluss am Knoten
    summe_oben: float | None        # Summe der oberliegenden Knoten (um die Fliesszeit versetzt)
    rest: float | None              # Zwischengebiet = gemessen − summe_oben; ein Rest, kein Messwert
    ohne_reihe: tuple = ()          # Nebenflüsse ohne Wert: sie stecken im Rest


def knotenbilanz(netz: Netz, q: dict, knoten: str, tag: dt.date) -> Knotenbilanz:
    """Bilanz eines Knotens an einem Tag. `q` = {stations-id: {datum: wert}}."""
    gemessen = q.get(knoten, {}).get(tag)
    kanten = netz.oben(knoten)
    if not kanten:
        return Knotenbilanz(gemessen, None, None)
    summe, fehlend = 0.0, []
    for k in kanten:
        wert = q.get(k.von, {}).get(tag - k.tage * EIN_TAG)
        if wert is None:
            if not k.zufluss:
                return Knotenbilanz(gemessen, None, None)   # Hauptstrom fehlt: keine Bilanz
            fehlend.append(k.von)
        else:
            summe += wert
    rest = None if gemessen is None else gemessen - summe
    return Knotenbilanz(gemessen, summe, rest, tuple(fehlend))


def kontrollbilanz(q: dict, ziel: str, glieder: list[str], tag: dt.date) -> dict | None:
    """Summe der Glieder gegen den Zielpegel (Aare Brugg + Reuss + Limmat ≈ Aare Stilli)."""
    werte = [q.get(g, {}).get(tag) for g in glieder]
    soll = q.get(ziel, {}).get(tag)
    if soll is None or any(w is None for w in werte):
        return None
    summe = sum(werte)
    return {"summe": summe, "ziel": soll, "abweichung": soll - summe, "abweichung_prozent": 100 * (soll - summe) / soll if soll else None}


def glieder(netz: Netz, q: dict, ziel: str, tag: dt.date) -> dict | None:
    """Zerlegt den Abfluss am Ziel in Quellknoten (gemessen) und Zwischengebiete (Rest), je um die Fliesszeit versetzt.

    Schlüssel: 'Q:<id>' für gemessene Quellknoten, 'R:<id>' für das Zwischengebiet oberhalb von <id>.
    Zusätzlich 'ziel' (Abfluss am Ziel) und 'nicht_zugeordnet' (Ziel minus Summe; entsteht nur durch Fliesszeiten).
    None, wenn ein nötiger Wert fehlt.
    """
    ziel_q = q.get(ziel, {}).get(tag)
    if ziel_q is None:
        return None
    ergebnis: dict = {}
    for knoten, tage in netz.einzugsknoten(ziel).items():
        t = tag - tage * EIN_TAG
        if not netz.oben(knoten):
            wert = q.get(knoten, {}).get(t)
            if wert is None:
                unten = netz.unten(knoten)
                if unten is not None and unten.zufluss:
                    continue                      # steckt im Rest des Unterliegers
                return None
            ergebnis["Q:" + knoten] = wert
        else:
            b = knotenbilanz(netz, q, knoten, t)
            if b.rest is None:
                return None
            ergebnis["R:" + knoten] = b.rest
    summe = sum(ergebnis.values())
    ergebnis["ziel"] = ziel_q
    ergebnis["nicht_zugeordnet"] = ziel_q - summe
    return ergebnis


def anteile(netz: Netz, q: dict, ziel: str, tage: list[dt.date]) -> dict | None:
    """Anteile in % am Abfluss des Ziels über einen Zeitraum: Summe der Glieder durch Summe des Zielabflusses.

    Es zählen nur Tage, an denen alle Glieder vorliegen; 'tage' und 'tage_gueltig' werden mitgegeben.
    """
    summen: dict = {}
    gueltig = 0
    for tag in tage:
        g = glieder(netz, q, ziel, tag)
        if g is None:
            continue
        gueltig += 1
        for k, v in g.items():
            summen[k] = summen.get(k, 0.0) + v
    if not gueltig or not summen.get("ziel"):
        return None
    z = summen["ziel"]
    return {
        "tage": len(tage), "tage_gueltig": gueltig, "ziel_mittel": z / gueltig,
        "mittel": {k: v / gueltig for k, v in summen.items() if k != "ziel"},
        "prozent": {k: 100 * v / z for k, v in summen.items() if k != "ziel"},
    }


# ---------------------------------------------------------------- Kennwerte

def jahrestage(jahr: int) -> list[dt.date]:
    tag, ende = dt.date(jahr, 1, 1), dt.date(jahr, 12, 31)
    return [tag + i * EIN_TAG for i in range((ende - tag).days + 1)]


def mq(reihe: dict, von: int, bis: int, mindestanteil: float = 0.95) -> dict | None:
    """Mittlerer Abfluss über ganze Kalenderjahre. None, wenn weniger als `mindestanteil` der Tage vorliegt."""
    tage = [t for j in range(von, bis + 1) for t in jahrestage(j)]
    werte = [reihe[t] for t in tage if reihe.get(t) is not None]
    if len(werte) < mindestanteil * len(tage):
        return None
    return {"wert": sum(werte) / len(werte), "tage": len(werte), "tage_soll": len(tage)}


def nm7q(reihe: dict, jahr: int) -> dict | None:
    """Kleinstes Mittel über 7 aufeinanderfolgende Tage im Kalenderjahr. Fenster mit Lücken zählen nicht.

    None, wenn im Jahr mehr als 5 % der Tage fehlen.
    """
    tage = jahrestage(jahr)
    werte = [reihe.get(t) for t in tage]
    if sum(w is None for w in werte) > 0.05 * len(tage):
        return None
    bestes = None
    for i in range(len(tage) - 6):
        fenster = werte[i:i + 7]
        if any(w is None for w in fenster):
            continue
        mittel = sum(fenster) / 7
        if bestes is None or mittel < bestes["wert"]:
            bestes = {"wert": mittel, "beginn": tage[i], "ende": tage[i + 6]}
    return bestes


def mnm7q(reihe: dict, von: int, bis: int) -> dict | None:
    """Mittel der jährlichen NM7Q über die Periode, dazu das kleinste NM7Q mit Datum."""
    jahre = {j: nm7q(reihe, j) for j in range(von, bis + 1)}
    gueltig = {j: n for j, n in jahre.items() if n is not None}
    if len(gueltig) < 0.9 * len(jahre):
        return None
    kleinstes = min(gueltig.values(), key=lambda n: n["wert"])
    return {"wert": sum(n["wert"] for n in gueltig.values()) / len(gueltig), "jahre": len(gueltig),
            "kleinstes": kleinstes["wert"], "kleinstes_beginn": kleinstes["beginn"]}


def niedrigwasser_tage(reihe: dict, von: int, bis: int) -> list[dt.date]:
    """Die Tage aller jährlichen NM7Q-Fenster eines Pegels (für zeitgleiche Anteile bei Niedrigwasser)."""
    tage: list[dt.date] = []
    for j in range(von, bis + 1):
        n = nm7q(reihe, j)
        if n is not None:
            tage += [n["beginn"] + i * EIN_TAG for i in range(7)]
    return tage


# ---------------------------------------------------------------- Seen

def speicheraenderung(stand: dict, flaeche_km2: float, tag: dt.date) -> float | None:
    """Speicheränderung eines Sees in m³/s: Fläche × Änderung des Tagesmittels gegenüber dem Vortag.

    Positiv = der See füllt sich (hält Wasser zurück). Gerechnet mit konstanter Seefläche, kein Messwert.
    """
    heute, gestern = stand.get(tag), stand.get(tag - EIN_TAG)
    if heute is None or gestern is None:
        return None
    return flaeche_km2 * 1e6 * (heute - gestern) / 86400


def speicherband(stand: dict, flaeche_km2: float, von: int, bis: int) -> dict | None:
    """Genutztes Band: 1.- und 99.-Perzentil des Tagesmittels in der Periode, als Höhe und Volumen."""
    werte = sorted(w for t, w in stand.items() if von <= t.year <= bis and w is not None)
    if len(werte) < 0.9 * 365 * (bis - von + 1):
        return None
    tief, hoch = werte[int(0.01 * (len(werte) - 1))], werte[int(round(0.99 * (len(werte) - 1)))]
    return {"tief": tief, "hoch": hoch, "band_m": hoch - tief,
            "volumen_mio_m3": flaeche_km2 * (hoch - tief), "mio_m3_je_cm": flaeche_km2 * 0.01}


def rueckhalt(volumen_mio_m3: float, tage: int) -> float:
    """Gleichmässige Abgabe (oder Rückhaltung) eines Volumens über `tage` Tage, in m³/s."""
    return volumen_mio_m3 * 1e6 / (tage * 86400)
