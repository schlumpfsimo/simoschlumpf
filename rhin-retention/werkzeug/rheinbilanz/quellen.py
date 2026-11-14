"""Datenbezug. Jede Funktion liefert {datum: (wert, status)}; nichts wird ergänzt oder geschätzt.

Status (Freigabe) je Wert:
  0 roh        BAFU ohne Freigabestatus, PEGELONLINE «Rohdaten»
  1 provisorisch  BAFU releaseState 1
  2 validiert  BAFU releaseState 2
  3 definitiv  BAFU releaseState 3
  4 geprüft    Deutsches Gewässerkundliches Jahrbuch (BfG/WSV)
"""
from __future__ import annotations

import datetime as dt
import json
import re
import subprocess
import urllib.parse
import urllib.request

from . import cache

KENNUNG = "rheinbilanz/1.0 (Python urllib)"
BAFU_API = "https://data.bafu.admin.ch/api"
PEGELONLINE = "https://www.pegelonline.wsv.de/webservices/rest-api/v2"
DGJ = "https://dgj-daten.bafg.de/Rhein"

STATUS = {0: "roh", 1: "provisorisch", 2: "validiert", 3: "definitiv", 4: "geprüft (DGJ)"}

Reihe = dict  # {datetime.date: (float, int)}


class QuelleNichtErreichbar(RuntimeError):
    pass


def _http(url: str, daten: bytes | None = None, kopf: dict | None = None) -> bytes:
    anfrage = urllib.request.Request(url, data=daten, headers={"User-Agent": KENNUNG, **(kopf or {})})
    try:
        with urllib.request.urlopen(anfrage, timeout=120) as antwort:
            return antwort.read()
    except Exception as fehler:  # bewusst breit: jede Störung wird gemeldet, nie überbrückt
        raise QuelleNichtErreichbar(f"{url}: {fehler}") from fehler


# ---------------------------------------------------------------- BAFU

def _bafu_fenster(nr: str, parameter: str, von: int, bis: int, max_alter_h) -> list:
    abfrage = (
        '{ water { observations { data_1day_mean(where:{station:{no:{_eq:"%s"}}, parameterName:{_eq:"%s"}, '
        'timestamp:{_gte:"%d-12-31T00:00:00Z", _lt:"%d-12-31T00:00:00Z"}}) { timestamp value releaseState } } } }'
        % (nr, parameter, von - 1, bis)
    )
    roh = cache.holen(
        "bafu", f"{nr}_{parameter}_{von}_{bis}.json",
        lambda: _http(BAFU_API, json.dumps({"query": abfrage}).encode(), {"Content-Type": "application/json"}),
        max_alter_h,
    )
    antwort = json.loads(roh)
    if "errors" in antwort:
        cache.pfad("bafu", f"{nr}_{parameter}_{von}_{bis}.json").unlink(missing_ok=True)
        raise QuelleNichtErreichbar(f"BAFU {nr} {parameter}: {antwort['errors']}")
    return antwort["data"]["water"]["observations"]["data_1day_mean"]


def bafu_tageswerte(nr: str, parameter: str, von: int, bis: int, frisch_ab: int | None = None) -> Reihe:
    """Tagesmittel einer BAFU-Station (Q in m³/s, W in m ü. M.) für die Jahre von..bis.

    Die API liefert höchstens 10 000 Zeilen je Abfrage, darum Fenster von 20 Jahren.
    Der Zeitstempel ist der Beginn des Tages in UTC (23.00 Uhr des Vortags = 0.00 Uhr MEZ).
    """
    reihe: Reihe = {}
    jahr = von
    while jahr <= bis:
        ende = min(jahr + 19, bis)
        aktuell = frisch_ab is not None and ende >= frisch_ab
        for zeile in _bafu_fenster(nr, parameter, jahr, ende + 1, 6 if aktuell else None):
            if zeile["value"] is None:
                continue
            zeit = dt.datetime.strptime(zeile["timestamp"][:19], "%Y-%m-%dT%H:%M:%S") + dt.timedelta(hours=1)
            status = int(zeile["releaseState"]) if zeile["releaseState"] is not None else 0
            reihe[zeit.date()] = (float(zeile["value"]), status)
        jahr = ende + 1
    return reihe


def bafu_stationen(nummern: list[str]) -> dict:
    liste = ",".join('"%s"' % n for n in nummern)
    abfrage = "{ water { observations { stations(where:{no:{_in:[%s]}}) { no name riverName latitude longitude status } } } }" % liste
    roh = cache.holen("bafu", "stationen.json",
                      lambda: _http(BAFU_API, json.dumps({"query": abfrage}).encode(), {"Content-Type": "application/json"}), 24 * 30)
    return {s["no"]: s for s in json.loads(roh)["data"]["water"]["observations"]["stations"]}


# ---------------------------------------------------------------- PEGELONLINE

def pegelonline_tagesmittel(nummer: str, parameter: str = "Q") -> Reihe:
    """Tagesmittel aus den 15-Minuten-Rohwerten der letzten 31 Tage. Nur vollständige Tage (≥ 90 Werte)."""
    roh = cache.holen("pegelonline", f"{nummer}_{parameter}_{dt.date.today()}.json",
                      lambda: _http(f"{PEGELONLINE}/stations/{nummer}/{parameter}/measurements.json?start=P31D"))
    tage: dict = {}
    for m in json.loads(roh):
        tag = dt.date.fromisoformat(m["timestamp"][:10])
        tage.setdefault(tag, []).append(float(m["value"]))
    return {tag: (sum(w) / len(w), 0) for tag, w in tage.items() if len(w) >= 90}


def pegelonline_station(nummer: str) -> dict:
    roh = cache.holen("pegelonline", f"{nummer}_station.json", lambda: _http(f"{PEGELONLINE}/stations/{nummer}.json"), 24 * 30)
    return json.loads(roh)


# ---------------------------------------------------------------- DGJ (PDF)

MONATE = ["Nov", "Dez", "Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]


def _dgj_seite(woerter: list[dict]) -> tuple[str, int, dict] | None:
    """Liest eine Jahrbuchseite: (Art 'Q'|'W', Jahr, {datum: wert}). Spalten über die Monatsköpfe, Zeilen über die Lage."""
    kopf = " ".join(w["t"] for w in sorted((w for w in woerter if w["y"] < min(x["y"] for x in woerter) + 6), key=lambda w: w["x"]))
    art = "Q" if "Abfl" in kopf else "W" if "Wasserst" in kopf else None
    jahre = [int(w["t"]) for w in woerter if re.fullmatch(r"(19|20)\d\d", w["t"]) and w["y"] < min(x["y"] for x in woerter) + 6]
    if art is None or not jahre:
        return None
    jahr = jahre[-1]
    # Monatsköpfe: die erste Zeile mit genau der Folge Nov Dez Jan … Dez
    zeilen: dict = {}
    for w in woerter:
        if w["t"] in MONATE:
            zeilen.setdefault(round(w["y"]), []).append(w)
    kopfzeile = next((sorted(z, key=lambda w: w["x"]) for y, z in sorted(zeilen.items())
                      if [w["t"] for w in sorted(z, key=lambda w: w["x"])] == MONATE), None)
    if kopfzeile is None:
        return None
    rechts = [w["x"] + w["b"] for w in kopfzeile]
    oben = kopfzeile[0]["y"]
    # untere Grenze der Tageswerte: Zeile der Monatsextreme (NQ/NW bzw. das zweite «Tag»)
    marken = sorted(w["y"] for w in woerter if w["t"] in ("Tag", "NQ", "NW") and w["y"] > oben + 5)
    unten = marken[0] if marken else oben + 400
    zahlen = [w for w in woerter if oben + 3 < w["y"] < unten - 3 and re.fullmatch(r"\d+([.,]\d+)?", w["t"])
              and w["x"] + w["b"] > rechts[0] - 40]
    # Zeilen bilden: Werte mit nahezu gleicher Höhe gehören zum selben Tag
    zahlen.sort(key=lambda w: w["y"])
    gruppen: list[list[dict]] = []
    for w in zahlen:
        if gruppen and abs(w["y"] - gruppen[-1][0]["y"]) < 2.5:
            gruppen[-1].append(w)
        else:
            gruppen.append([w])
    gruppen = [g for g in gruppen if len(g) >= 7]
    if len(gruppen) != 31:
        raise ValueError(f"DGJ {art} {jahr}: {len(gruppen)} Tageszeilen statt 31")
    werte: dict = {}
    for tag, gruppe in enumerate(gruppen, start=1):
        for w in gruppe:
            spalte = min(range(14), key=lambda i: abs(rechts[i] - (w["x"] + w["b"])))
            if abs(rechts[spalte] - (w["x"] + w["b"])) > 25:
                continue
            monat = (10 + spalte) % 12 + 1
            j = jahr - 1 if spalte < 2 else jahr
            try:
                werte[dt.date(j, monat, tag)] = float(w["t"].replace(",", "."))
            except ValueError:
                raise ValueError(f"DGJ {art} {jahr}: Wert am {tag}.{monat}. gibt es nicht") from None
    return art, jahr, werte


def dgj_tageswerte(ordner: str, datei: str) -> dict[str, Reihe]:
    """Tageswerte aus dem Jahrbuch-PDF eines Pegels: {'Q': Reihe in m³/s, 'W': Reihe in cm}. Braucht pdftotext (poppler)."""
    pdf = cache.pfad("dgj", datei)
    cache.holen("dgj", datei, lambda: _http(f"{DGJ}/{urllib.parse.quote(ordner)}/{datei}"), 24 * 14)
    try:
        tsv = subprocess.run(["pdftotext", "-tsv", str(pdf), "-"], capture_output=True, check=True).stdout.decode("utf-8", "replace")
    except FileNotFoundError as fehler:
        raise QuelleNichtErreichbar("pdftotext (poppler-utils) fehlt; DGJ-PDF können nicht gelesen werden") from fehler
    seiten: dict = {}
    for zeile in tsv.splitlines()[1:]:
        f = zeile.split("\t")
        if len(f) < 12 or f[0] != "5":
            continue
        seiten.setdefault(int(f[1]), []).append({"x": float(f[6]), "y": float(f[7]), "b": float(f[8]), "t": f[11]})
    ergebnis: dict[str, Reihe] = {"Q": {}, "W": {}}
    for nr in sorted(seiten, reverse=True):          # alte Jahre zuerst, neuere Ausgaben überschreiben
        gelesen = _dgj_seite(seiten[nr])
        if gelesen is None:
            continue
        art, _, werte = gelesen
        for tag, wert in werte.items():
            ergebnis[art][tag] = (wert, 4)
    return ergebnis
