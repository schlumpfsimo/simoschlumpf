"""Führt die Quellen zu einem Datenbestand zusammen: Abfluss je Station, Wasserstand je See, Status je Wert."""
from __future__ import annotations

import datetime as dt
import re
import subprocess
import sys

from . import cache, quellen
from .netz import SEEN, STATIONEN

ERSTES_JAHR = 1970      # die BAFU-Datenplattform führt Tageswerte ab 1970


class Bestand:
    def __init__(self):
        self.q: dict = {}          # {id: {datum: wert}}
        self.status: dict = {}     # {id: {datum: code}}
        self.w: dict = {}          # {see-id: {datum: m ü. M.}}
        self.w_kaub: dict = {}     # {datum: cm am Pegel}
        self.orte: dict = {}       # {id: (breite, länge)}
        self.dgj_hauptwerte: dict = {}
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
    return b
