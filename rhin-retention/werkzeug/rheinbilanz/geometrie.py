"""Kartengeometrie: Flussläufe zwischen den Messstellen und Seeflächen. Einmalig zu erzeugen (Befehl «karte»).

Rheinachse: GeoRhena (Ebene water:rhin). Übrige Flüsse und Seen: Natural Earth 1:10 Mio. (gemeinfrei).
Die Strecke zwischen zwei Stationen ist der kürzeste Weg im Liniennetz; findet sich keiner, wird eine Gerade
gezogen und als solche gekennzeichnet.
"""
from __future__ import annotations

import heapq
import json
import math

from . import cache, quellen
from .netz import Netz

GEORHENA = ("https://geoportal.georhena.eu/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature"
            "&typeNames=water:rhin&outputFormat=application/json&srsName=EPSG:4326")
NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
RAHMEN = (6.3, 46.3, 10.3, 50.6)     # West, Süd, Ost, Nord


def _km(a, b):
    k = math.cos(math.radians((a[1] + b[1]) / 2))
    return 111.2 * math.hypot((a[0] - b[0]) * k, a[1] - b[1])


def _linien(geojson: dict) -> list:
    aus = []
    for f in geojson["features"]:
        g = f["geometry"]
        if not g:
            continue
        teile = g["coordinates"] if g["type"].startswith("Multi") else [g["coordinates"]]
        for teil in teile:
            aus.append(([(p[0], p[1]) for p in teil], f["properties"]))
    return aus


def _im_rahmen(p):
    return RAHMEN[0] <= p[0] <= RAHMEN[2] and RAHMEN[1] <= p[1] <= RAHMEN[3]


def _vereinfachen(punkte: list, toleranz_km: float) -> list:
    """Douglas-Peucker."""
    if len(punkte) < 3:
        return punkte
    a, b = punkte[0], punkte[-1]
    weit, index = 0.0, 0
    for i in range(1, len(punkte) - 1):
        p = punkte[i]
        k = math.cos(math.radians(p[1]))
        ax, ay, bx, by, px, py = a[0] * k, a[1], b[0] * k, b[1], p[0] * k, p[1]
        l2 = (bx - ax) ** 2 + (by - ay) ** 2
        t = 0 if l2 == 0 else max(0, min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2))
        d = 111.2 * math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay))
        if d > weit:
            weit, index = d, i
    if weit <= toleranz_km:
        return [a, b]
    return _vereinfachen(punkte[: index + 1], toleranz_km)[:-1] + _vereinfachen(punkte[index:], toleranz_km)


def bauen(orte: dict) -> dict:
    """orte = {stations-id: (breite, länge)}. Gibt die Karte als Wörterbuch zurück."""
    lade = lambda name, url: json.loads(cache.holen("karte", name, lambda: quellen._http(url, kopf={"User-Agent": "Mozilla/5.0"})))
    rhein = [l for l, _ in _linien(lade("georhena_rhin.json", GEORHENA))]
    fluesse = []
    for datei in ("ne_10m_rivers_lake_centerlines.geojson", "ne_10m_rivers_europe.geojson"):
        for linie, eig in _linien(lade(datei, NE + datei)):
            if any(_im_rahmen(p) for p in linie):
                fluesse.append(linie)
    seen = []
    for datei in ("ne_10m_lakes.geojson", "ne_10m_lakes_europe.geojson"):
        for f in lade(datei, NE + datei)["features"]:
            g = f["geometry"]
            for vieleck in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]):
                ring = [(p[0], p[1]) for p in vieleck[0]]
                if all(_im_rahmen(p) for p in ring):
                    seen.append({"name": f["properties"].get("name"), "p": [[round(x, 4), round(y, 4)] for x, y in ring]})

    # Liniennetz als Graph; Rheinachse bevorzugt (Gewicht 1), Natural Earth leicht teurer
    knoten, nachbarn = [], {}

    def punkt(p):
        knoten.append(p)
        nachbarn[len(knoten) - 1] = []
        return len(knoten) - 1

    def kante(i, j, faktor=1.0):
        d = _km(knoten[i], knoten[j]) * faktor
        nachbarn[i].append((j, d))
        nachbarn[j].append((i, d))

    enden = []
    for linien, faktor in ((rhein, 1.0), (fluesse, 1.3)):
        for linie in linien:
            ids = [punkt(p) for p in linie]
            for a, b in zip(ids, ids[1:]):
                kante(a, b, faktor)
            enden += [ids[0], ids[-1]]
    for e in enden:      # Linienenden an das nächste fremde Stück hängen (Mündungen, Stückgrenzen)
        naechster = min((i for i in range(len(knoten)) if i != e and all(n != i for n, _ in nachbarn[e])),
                        key=lambda i: _km(knoten[e], knoten[i]))
        if _km(knoten[e], knoten[naechster]) < 4:
            kante(e, naechster, 3.0)

    def einrasten(ort):
        p = (ort[1], ort[0])
        i = min(range(len(knoten)), key=lambda i: _km(p, knoten[i]))
        return i if _km(p, knoten[i]) < 8 else None

    def weg(a, b):
        dist, vor, offen = {a: 0.0}, {}, [(0.0, a)]
        while offen:
            d, i = heapq.heappop(offen)
            if i == b:
                break
            if d > dist.get(i, 1e18):
                continue
            for j, w in nachbarn[i]:
                if d + w < dist.get(j, 1e18):
                    dist[j], vor[j] = d + w, i
                    heapq.heappush(offen, (d + w, j))
        if b not in dist:
            return None
        pfad = [b]
        while pfad[-1] != a:
            pfad.append(vor[pfad[-1]])
        return [knoten[i] for i in reversed(pfad)]

    strecken = {}
    for k in Netz.standard().kanten:
        a, b = orte.get(k.von), orte.get(k.nach)
        if not a or not b:
            continue
        ia, ib = einrasten(a), einrasten(b)
        linie = weg(ia, ib) if ia is not None and ib is not None else None
        gerade = linie is None or sum(_km(p, q) for p, q in zip(linie, linie[1:])) > 3 * _km((a[1], a[0]), (b[1], b[0])) + 20
        if gerade:
            linie = [(a[1], a[0]), (b[1], b[0])]
        else:
            linie = [(a[1], a[0])] + _vereinfachen(linie, 0.4) + [(b[1], b[0])]
        strecken[f"{k.von}>{k.nach}"] = {"gerade": gerade, "p": [[round(x, 4), round(y, 4)] for x, y in linie]}
    hintergrund = [[[round(x, 3), round(y, 3)] for x, y in _vereinfachen(l, 0.5)] for l in rhein + fluesse]
    return {
        "quelle": "Rheinachse: GeoRhena (geoportal.georhena.eu, Ebene water:rhin) · übrige Flüsse und Seen: Natural Earth 1:10 Mio. (gemeinfrei)",
        "rahmen": RAHMEN, "strecken": strecken, "seen": seen, "fluesse": hintergrund,
    }
