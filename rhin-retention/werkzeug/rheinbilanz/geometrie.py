"""Kartengeometrie: Flussläufe zwischen den Messstellen aus HydroRIVERS (Befehl «karte»).

HydroRIVERS v1.0 (Lehner & Grill 2013, hydrosheds.org) kennt für jeden Abschnitt den Unterlieger (NEXT_DOWN).
Die Strecke zwischen zwei Messstellen ist darum eindeutig: vom Abschnitt der oberen Station dem Unterlieger
folgen, bis der Abschnitt der unteren Station erreicht ist. Braucht das Paket pyshp und die entpackte
Shape-Datei (rund 260 MB, nicht im Repository): Pfad über RHEINBILANZ_HYDRORIVERS.
"""
from __future__ import annotations

import math
import os

from .netz import Netz

RAHMEN = (6.3, 46.3, 10.3, 50.6)     # West, Süd, Ost, Nord
QUELLE = "Flussläufe: HydroRIVERS v1.0 (Lehner & Grill 2013), hydrosheds.org"


def _km(a, b):
    k = math.cos(math.radians((a[1] + b[1]) / 2))
    return 111.2 * math.hypot((a[0] - b[0]) * k, a[1] - b[1])


def bauen(orte: dict, mq: dict, pfad: str | None = None) -> dict:
    """orte = {id: (breite, länge)}, mq = {id: m³/s} zum Einrasten auf den richtigen Flussarm."""
    import shapefile  # pyshp

    pfad = pfad or os.environ.get("RHEINBILANZ_HYDRORIVERS")
    if not pfad:
        raise SystemExit("RHEINBILANZ_HYDRORIVERS zeigt nicht auf HydroRIVERS_v10_eu.shp")
    leser = shapefile.Reader(pfad)
    namen = [f[0] for f in leser.fields[1:]]
    i_id, i_ab, i_q = namen.index("HYRIV_ID"), namen.index("NEXT_DOWN"), namen.index("DIS_AV_CMS")
    abschnitte = {}
    for sr in leser.iterShapeRecords(bbox=list(RAHMEN)):
        r = sr.record
        if r[i_q] >= 2:
            abschnitte[r[i_id]] = (r[i_ab], r[i_q], [(round(x, 5), round(y, 5)) for x, y in sr.shape.points])

    def einrasten(sid):
        p = (orte[sid][1], orte[sid][0])
        beste = None
        for hid, (_, q, punkte) in abschnitte.items():
            if not 0.4 * mq[sid] <= q <= 2.5 * mq[sid]:
                continue
            d, i = min((_km(p, x), i) for i, x in enumerate(punkte))
            if d < 5 and (beste is None or d < beste[0]):
                beste = (d, hid, i)
        return beste

    rast = {sid: einrasten(sid) for sid in orte if sid in mq}
    strecken = {}
    for k in Netz.standard().kanten:
        a, b = rast.get(k.von), rast.get(k.nach)
        linie = None
        if a and b:
            hid, punkte = a[1], list(abschnitte[a[1]][2][a[2]:])
            for _ in range(5000):
                if hid == b[1]:
                    break
                hid = abschnitte.get(hid, (0,))[0]
                if hid not in abschnitte:
                    punkte = None
                    break
                punkte += abschnitte[hid][2] if hid != b[1] else abschnitte[hid][2][: b[2] + 1]
            if a[1] == b[1]:
                punkte = abschnitte[a[1]][2][a[2]: b[2] + 1]
            linie = punkte
        gerade = not linie or len(linie) < 2
        if gerade:
            linie = [(orte[k.von][1], orte[k.von][0]), (orte[k.nach][1], orte[k.nach][0])]
        duenn = [linie[0]]                      # Punkte dichter als 150 m weglassen
        for p in linie[1:-1]:
            if _km(duenn[-1], p) > 0.15:
                duenn.append(p)
        duenn.append(linie[-1])
        strecken[f"{k.von}>{k.nach}"] = {"gerade": gerade, "p": [[round(x, 4), round(y, 4)] for x, y in duenn]}
    return {"quelle": QUELLE + " · Rheinkilometer: GeoRhena nach WSV", "rahmen": RAHMEN, "strecken": strecken, "rheinkm": rheinkilometer()}


GEORHENA_KM = ("https://geoportal.georhena.eu/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature"
               "&typeNames=transportation:rhin_points_kilometriques&outputFormat=application/json&srsName=EPSG:4326")


def rheinkilometer(von: float = 164.0, bis: float = 570.0) -> list:
    """Punkte der Rheinkilometrierung alle 500 m: [[km, länge, breite], …] (GeoRhena, Quelle WSV). Für die Abschnitte der Karte."""
    import json

    from . import cache, quellen
    roh = cache.holen("karte", "georhena_rheinkm.json", lambda: quellen._http(GEORHENA_KM, kopf={"User-Agent": "Mozilla/5.0"}))
    punkte = {}
    for f in json.loads(roh)["features"]:
        e = f["properties"]
        if e["river"] == "Rhin / Rhein" and e["pk"] is not None:
            km = float(e["pk"])
            if von <= km <= bis and abs(km * 2 - round(km * 2)) < 1e-6:
                punkte[km] = f["geometry"]["coordinates"]
    return [[km, round(p[0], 4), round(p[1], 4)] for km, p in sorted(punkte.items())]
