"""Führt die Quellen zu einem Datenbestand zusammen: Abfluss je Station, Wasserstand je See, Status je Wert."""
from __future__ import annotations

import datetime as dt
import re
import subprocess
import sys

from . import cache, quellen, schifffahrt
from .netz import HLNUG_Q, HLNUG_W, RICHTPEGEL, SEEN, STATIONEN

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
        if s.id in HLNUG_Q:                               # schliesst die Lücke zwischen Jahrbuch und den letzten 31 Tagen
            portal = versuch(f"HLNUG {s.name} Q", lambda: quellen.hlnug_tagesmittel(s.id, "Q"))
            if portal:
                b.setze(s.id, {t: v for t, v in portal.items() if t < heute and t.year >= ERSTES_JAHR}, ueberschreiben=False)
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
    _richtpegel(b, versuch, heute)
    _kaub(b, versuch, heute)
    return b


def _wasserstand(b: Bestand, versuch, heute: dt.date, nummer: str, name: str, dgj: tuple | None) -> dict:
    """Wasserstand eines Pegels: Jahrbuch (falls vorhanden) und Rohwerte der letzten 31 Tage."""
    if nummer not in b.wp:
        jahrbuch = versuch(f"DGJ {name} W", lambda: quellen.dgj_tageswerte(*dgj)) if dgj else None
        b.wp[nummer] = {t: w for t, (w, _) in jahrbuch["W"].items()} if jahrbuch else {}
    if nummer in HLNUG_W:
        portal = versuch(f"HLNUG {name} W", lambda: quellen.hlnug_tagesmittel(nummer, "W"))
        if portal:
            for t, (w, _) in portal.items():
                if t < heute:
                    b.wp[nummer].setdefault(t, w)
    roh = versuch(f"PEGELONLINE {name} W", lambda: quellen.pegelonline_tagesmittel(nummer, "W"))
    if roh:
        for t, (w, _) in roh.items():
            if t < heute:
                b.wp[nummer].setdefault(t, w)
    return b.wp[nummer]


def _richtpegel(b: Bestand, versuch, heute: dt.date) -> None:
    """Wasserstand, Kennwerte und Bezugskurve W = f(Q am Bezugspegel) für jeden Bezugspegel der freien Strecke."""
    for p in RICHTPEGEL:
        w = _wasserstand(b, versuch, heute, p.id, p.name, p.dgj)
        kenn = versuch(f"PEGELONLINE {p.name} Kennwerte", lambda: quellen.pegelonline_kennwerte(p.id))
        k = (kenn or {}).get("kennwerte", {})
        eintrag = {"glw": k.get("GlW", {}).get("value"), "glw_ab": k.get("GlW", {}).get("validFrom"),
                   "tugl": k.get("TuGLW", {}).get("value"), "hsw": k.get("HSW", {}).get("value"), "aktuell": (kenn or {}).get("aktuell")}
        reihe = dict(w)
        if p.ersatz:                                   # Ersatzpegel im selben Abschnitt, auf den GlW des Bezugspegels umgerechnet
            nr, name, dgj = p.ersatz
            we = _wasserstand(b, versuch, heute, nr, name, dgj)
            ke = (versuch(f"PEGELONLINE {name} Kennwerte", lambda: quellen.pegelonline_kennwerte(nr)) or {}).get("kennwerte", {})
            glw_e = ke.get("GlW", {}).get("value")
            if glw_e is not None and eintrag["glw"] is not None:
                versatz = eintrag["glw"] - glw_e
                beide = [w[t] - (we[t] + versatz) for t in w if t in we]
                eintrag["ersatz"] = {"id": nr, "name": name, "glw": glw_e, "tage_vergleich": len(beide),
                                     "abweichung": sum(beide) / len(beide) if beide else None,
                                     "abweichung_betrag": sum(abs(x) for x in beide) / len(beide) if beide else None}
                if eintrag["hsw"] is None and ke.get("HSW", {}).get("value") is not None:
                    eintrag["hsw"] = ke["HSW"]["value"] + versatz
                for t, x in we.items():
                    reihe.setdefault(t, x + versatz)
        q = b.q.get(p.bezug, {})
        jahr = max((t.year for t, c in b.status.get(p.bezug, {}).items() if c == 4), default=None)
        paare = [(q[t], reihe[t]) for t in reihe if t in q and jahr and t.year >= jahr and b.status[p.bezug].get(t) in (0, 4, 6)]
        eintrag.update({"kurve": schifffahrt.abflusskurve(paare), "kurve_ab": jahr})
        b.richt[p.id] = eintrag


KAUB, BASEL, BINGEN = "25700100", "2289", "25300200"


def _kaub(b: Bestand, versuch, heute: dt.date) -> None:
    """Schifffahrtsgrössen für Kaub: Kennwerte, Vorhersage, Abflusskurve und der Abfluss an Tagen, an denen nur der Wasserstand vorliegt."""
    kenn = versuch("PEGELONLINE Kaub Kennwerte", lambda: quellen.pegelonline_kennwerte(KAUB))
    if kenn:
        b.kaub.update(kenn)
    vor = versuch("PEGELONLINE Kaub Vorhersage", lambda: quellen.pegelonline_vorhersage(KAUB))
    if vor:
        b.kaub["vorhersage"] = vor
    b.w_kaub = dict(b.wp.get(KAUB, {}))                # Wasserstand: Jahrbuch, HLNUG, PEGELONLINE (in dieser Reihenfolge)
    q, w = b.q.get(KAUB, {}), b.w_kaub
    if not q:
        return
    # Tage ohne Wasserstand Kaub, aber mit Wert am Pegel Bingen (18 km oberhalb): Das HLNUG liefert für Kaub keine Tagesmittel
    # um und unter 0 cm, also gerade die tiefsten Tage. Kaub = Bingen + mittlerer Abstand beider Pegel an den
    # Niedrigwassertagen desselben Jahres (Kaub unter 60 cm). Diese Tage sind eigens bezeichnet (Status 9).
    bingen, ersatz_tage = b.wp.get(BINGEN, {}), []
    for jahr in sorted({t.year for t in bingen}):
        paare = [w[t] - bingen[t] for t in w if t.year == jahr and t in bingen and w[t] < 60]
        fehlend = [t for t in bingen if t.year == jahr and t not in w and t <= heute]
        if len(paare) < 20 or not fehlend:
            continue
        versatz = sum(paare) / len(paare)
        streuung = (sum((x - versatz) ** 2 for x in paare) / len(paare)) ** 0.5
        for t in fehlend:
            if bingen[t] + versatz < 60:                 # nur im Niedrigwasser, wo der Abstand bestimmt ist
                w[t] = round(bingen[t] + versatz, 1)
                b.wp.setdefault(KAUB, {})[t] = w[t]
                ersatz_tage.append(t)
        if any(t.year == jahr for t in ersatz_tage):
            b.kaub.setdefault("ersatz", []).append({"jahr": jahr, "pegel": "Bingen", "versatz_cm": round(versatz, 1), "streuung_cm": round(streuung, 1),
                                                    "paare": len(paare), "tage": [t.isoformat() for t in sorted(ersatz_tage) if t.year == jahr]})
    ersatz_tage = set(ersatz_tage)
    # Abflusskurve: Wertepaare des jüngsten Jahrbuchjahres und die Rohwerte danach (aktuelle Kurve der WSV)
    letztes_dgj = max((t.year for t, c in b.status[KAUB].items() if c == 4), default=None)
    paare = [(q[t], w[t]) for t in q if t in w and letztes_dgj and t.year >= letztes_dgj and b.status[KAUB][t] in (0, 4)]
    kurve = schifffahrt.abflusskurve(paare)
    b.kaub["abflusskurve"] = kurve
    b.kaub["abflusskurve_quelle"] = f"Tageswertpaare W/Q: DGJ {letztes_dgj} (geprüft) und PEGELONLINE ab {letztes_dgj + 1} (roh)"
    # Tage nach dem Jahrbuch mit Wasserstand, aber ohne Abfluss: Abfluss aus dem Wasserstand über die Kurve
    aus_w, verlaengert, ohne = 0, 0, 0
    for tag in sorted(t for t in w if letztes_dgj and t.year > letztes_dgj and t not in q):
        wert = schifffahrt.abfluss_aus_wasserstand(kurve, w[tag], 20.0 if tag in ersatz_tage else 12.0)
        if wert is None:
            ohne += 1
            continue
        b.setze(KAUB, {tag: (wert[0], 9 if tag in ersatz_tage else 8 if wert[1] else 7)})
        aus_w += 1
        verlaengert += wert[1]
    b.kaub["abfluss_aus_w"] = {"ab": f"{letztes_dgj + 1}-01-01", "tage": aus_w, "davon_verlaengert": verlaengert, "ohne_wert": ohne,
                               "tiefster_stuetzpunkt": kurve[0] if kurve else None}
