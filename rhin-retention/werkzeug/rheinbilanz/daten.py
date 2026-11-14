"""Führt die Quellen zu einem Datenbestand zusammen: Abfluss je Station, Wasserstand je See, Status je Wert."""
from __future__ import annotations

import datetime as dt
import re
import subprocess
import sys

from . import cache, quellen, schifffahrt
from .netz import RICHTPEGEL, SEEN, STATIONEN

ERSTES_JAHR = 1970      # die BAFU-Datenplattform führt Tageswerte ab 1970


class Bestand:
    def __init__(self):
        self.q: dict = {}          # {id: {datum: wert}}
        self.status: dict = {}     # {id: {datum: code}}
        self.w: dict = {}          # {see-id: {datum: m ü. M.}}
        self.w_kaub: dict = {}     # {datum: cm am Pegel}
        self.orte: dict = {}       # {id: (breite, länge)}
        self.dgj_hauptwerte: dict = {}
        self.kaub: dict = {}       # Kennwerte, Abflusskurve, Vorhersage, Schätzmodell
        self.wp: dict = {}         # {pegel-id: {datum: cm}} Wasserstand der Richtpegel
        self.richt: dict = {}      # {pegel-id: {glw, tugl, hsw, kurve}}
        self.meldungen: list[str] = []

    def setze(self, sid: str, reihe: dict, ueberschreiben: bool = True) -> None:
        q, s = self.q.setdefault(sid, {}), self.status.setdefault(sid, {})
        for tag, (wert, status) in reihe.items():
            if ueberschreiben or tag not in q:
                q[tag], s[tag] = wert, status


def _dgj_hauptwerte(datei: str) -> dict | None:
    """MQ und MNQ der langen Reihe von der jüngsten Abflussseite des Jahrbuchs (gedruckte Werte, nicht gerechnet)."""
    pdf = cache.pfad("dgj", datei)
    for seite in (1, 2):
        text = subprocess.run(["pdftotext", "-layout", "-f", str(seite), "-l", str(seite), str(pdf), "-"],
                              capture_output=True).stdout.decode("utf-8", "replace")
        if "Abfl" not in text.splitlines()[0]:
            continue
        m = re.search(r"((?:19|20)\d\d)/((?:19|20)\d\d) \(\*\)\s+(\d+) Jahre(.*)", text, re.S)
        if not m:
            return None
        rest = m.group(4)
        mnq = re.search(r"^\s*MNQ\s+m³/s\s+([\d.,]+)", rest, re.M)
        mq = re.search(r"^\s*MQ\s+m³/s\s+([\d.,]+)", rest, re.M)
        if not (mnq and mq):
            return None
        zahl = lambda s: float(s.replace(",", "."))
        return {"periode": f"{m.group(1)}/{m.group(2)}", "jahre": int(m.group(3)), "mq": zahl(mq.group(1)), "mnq": zahl(mnq.group(1))}
    return None


def laden(bis_jahr: int | None = None, melde=lambda s: print(s, file=sys.stderr)) -> Bestand:
    """Holt alle Reihen. Fällt eine Quelle aus, wird das gemeldet und der Teil bleibt leer."""
    heute = dt.date.today()
    bis_jahr = bis_jahr or heute.year
    b = Bestand()

    def versuch(text, funktion):
        try:
            return funktion()
        except (quellen.QuelleNichtErreichbar, ValueError) as fehler:
            b.meldungen.append(f"{text}: {fehler}")
            melde(f"FEHLT  {text}: {fehler}")
            return None

    bafu = [s for s in STATIONEN if s.quelle == "BAFU"]
    meta = versuch("BAFU Stationsliste", lambda: quellen.bafu_stationen([s.id for s in bafu] + [see.pegel for see in SEEN])) or {}
    for s in bafu:
        melde(f"BAFU {s.id} {s.gewaesser}–{s.name}")
        reihe = versuch(f"BAFU {s.id} Q", lambda: quellen.bafu_tageswerte(s.id, "Q", ERSTES_JAHR, bis_jahr, frisch_ab=heute.year - 2))
        if reihe:
            b.setze(s.id, reihe)
        if s.id in meta:
            b.orte[s.id] = (meta[s.id]["latitude"], meta[s.id]["longitude"])
    for see in SEEN:
        melde(f"BAFU {see.pegel} {see.name}")
        reihe = versuch(f"BAFU {see.pegel} W", lambda: quellen.bafu_tageswerte(see.pegel, "W", ERSTES_JAHR, bis_jahr, frisch_ab=heute.year - 2))
        if reihe:
            b.w[see.id] = {t: w for t, (w, _) in reihe.items()}
        if see.pegel in meta:
            b.orte["see:" + see.id] = (meta[see.pegel]["latitude"], meta[see.pegel]["longitude"])

    for s in (s for s in STATIONEN if s.quelle == "WSV"):
        melde(f"WSV {s.id} {s.gewaesser}–{s.name}")
        jahrbuch = versuch(f"DGJ {s.name}", lambda: quellen.dgj_tageswerte(*s.dgj))
        if jahrbuch:
            b.setze(s.id, jahrbuch["Q"])
            b.wp.setdefault(s.id, {}).update({t: w for t, (w, _) in jahrbuch["W"].items()})
            if s.name == "Kaub":
                b.w_kaub.update({t: w for t, (w, _) in jahrbuch["W"].items()})
            werte = versuch(f"DGJ {s.name} Hauptwerte", lambda: _dgj_hauptwerte(s.dgj[1]))
            if werte:
                b.dgj_hauptwerte[s.id] = werte
        aktuell = versuch(f"PEGELONLINE {s.name} Q", lambda: quellen.pegelonline_tagesmittel(s.id, "Q"))
        if aktuell:
            b.setze(s.id, {t: v for t, v in aktuell.items() if t < heute}, ueberschreiben=False)
        if s.name == "Kaub":
            stand = versuch("PEGELONLINE Kaub W", lambda: quellen.pegelonline_tagesmittel(s.id, "W"))
            if stand:
                for t, (w, _) in stand.items():
                    if t < heute:
                        b.w_kaub.setdefault(t, w)
        ort = versuch(f"PEGELONLINE {s.name} Lage", lambda: quellen.pegelonline_station(s.id))
        if ort:
            b.orte[s.id] = (ort["latitude"], ort["longitude"])
    _kaub(b, versuch, heute)
    _richtpegel(b, versuch, heute)
    return b


def _richtpegel(b: Bestand, versuch, heute: dt.date) -> None:
    """Wasserstand, Kennwerte und Bezugskurve W = f(Q am Bezugspegel) für jeden Richtpegel der freien Strecke."""
    for p in RICHTPEGEL:
        if p.id not in b.wp:                                       # Pegel ohne Abflussreihe im Netz: nur Wasserstand aus dem Jahrbuch
            jahrbuch = versuch(f"DGJ {p.name} W", lambda: quellen.dgj_tageswerte(*p.dgj))
            b.wp[p.id] = {t: w for t, (w, _) in jahrbuch["W"].items()} if jahrbuch else {}
        roh = versuch(f"PEGELONLINE {p.name} W", lambda: quellen.pegelonline_tagesmittel(p.id, "W"))
        if roh:
            for t, (w, _) in roh.items():
                if t < heute:
                    b.wp[p.id].setdefault(t, w)
        kenn = versuch(f"PEGELONLINE {p.name} Kennwerte", lambda: quellen.pegelonline_kennwerte(p.id))
        k = (kenn or {}).get("kennwerte", {})
        w, q = b.wp[p.id], b.q.get(p.bezug, {})
        jahr = max((t.year for t, c in b.status.get(p.bezug, {}).items() if c == 4), default=None)
        paare = [(q[t], w[t]) for t in w if t in q and jahr and t.year >= jahr and b.status[p.bezug].get(t) != 5]
        b.richt[p.id] = {"glw": k.get("GlW", {}).get("value"), "glw_ab": k.get("GlW", {}).get("validFrom"),
                         "tugl": k.get("TuGLW", {}).get("value"), "hsw": k.get("HSW", {}).get("value"),
                         "aktuell": (kenn or {}).get("aktuell"), "kurve": schifffahrt.abflusskurve(paare), "kurve_ab": jahr}


KAUB, BASEL = "25700100", "2289"


def _kaub(b: Bestand, versuch, heute: dt.date) -> None:
    """Schifffahrtsgrössen für Kaub: Kennwerte, Vorhersage, Abflusskurve und die Überbrückung fehlender Tage."""
    kenn = versuch("PEGELONLINE Kaub Kennwerte", lambda: quellen.pegelonline_kennwerte(KAUB))
    if kenn:
        b.kaub.update(kenn)
    vor = versuch("PEGELONLINE Kaub Vorhersage", lambda: quellen.pegelonline_vorhersage(KAUB))
    if vor:
        b.kaub["vorhersage"] = vor
    q, w, basel = b.q.get(KAUB, {}), b.w_kaub, b.q.get(BASEL, {})
    if not q or not basel:
        return
    # Abflusskurve: Wertepaare des jüngsten Jahrbuchjahres und die Rohwerte danach (aktuelle Kurve der WSV)
    letztes_dgj = max((t.year for t, c in b.status[KAUB].items() if c == 4), default=None)
    paare = [(q[t], w[t]) for t in q if t in w and letztes_dgj and t.year >= letztes_dgj]
    b.kaub["abflusskurve"] = schifffahrt.abflusskurve(paare)
    b.kaub["abflusskurve_quelle"] = f"Tageswertpaare W/Q: DGJ {letztes_dgj} (geprüft) und PEGELONLINE ab {letztes_dgj + 1} (roh)"
    # Schätzmodell: angepasst an die letzten zehn Jahrbuchjahre, geprüft an den Rohwerten des laufenden Jahres
    thur = b.q.get("2044", {})
    tage = sorted(t for t, c in b.status[KAUB].items() if c == 4 and t.year > letztes_dgj - 10)
    modell = schifffahrt.anpassen(basel, thur, q, tage)
    if not modell:
        return
    modell["jahre"] = [letztes_dgj - 9, letztes_dgj]
    roh = sorted(t for t, c in b.status[KAUB].items() if c == 0)
    modell["pruefung_roh"] = schifffahrt.guete(modell, basel, thur, q, roh)
    if modell["pruefung_roh"]:
        modell["pruefung_roh"]["von"], modell["pruefung_roh"]["bis"] = roh[0].isoformat(), roh[-1].isoformat()
    b.kaub["schaetzung"] = modell
    tag = dt.date(letztes_dgj + 1, 1, 1)
    while tag < heute:
        if tag not in q:
            s = schifffahrt.schaetzen(modell, basel, thur, tag)
            if s is not None:
                b.setze(KAUB, {tag: (s, 5)})
        tag += dt.timedelta(days=1)
