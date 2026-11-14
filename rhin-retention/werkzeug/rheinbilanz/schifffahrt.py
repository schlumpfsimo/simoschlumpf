"""Schifffahrtsgrössen am Pegel Kaub und die Überbrückung fehlender Tage. Reine Funktionen.

Abflusskurve:  W = f(Q), stückweise linear durch Stützpunkte aus Wertepaaren (Wasserstand, Abfluss).
Fahrrinnentiefe:  T = W − GlW + T_GlW   (GlW = gleichwertiger Wasserstand, T_GlW = Fahrrinnentiefe unter GlW)
Schätzung:  Q_Kaub(t) ≈ a + b · Q_Basel(t − 2) + c · T30(t − 2) + d · T120(t − 2)   (T = Thur, siehe unten)
"""
from __future__ import annotations

import datetime as dt
from statistics import median

EIN_TAG = dt.timedelta(days=1)


def abflusskurve(paare: list, schritt_cm: int = 5) -> list:
    """Stützpunkte [(Q, W)] aus Wertepaaren (Q m³/s, W cm): Median des Abflusses je Wasserstandsklasse, Q streng steigend."""
    klassen: dict = {}
    for q, w in paare:
        if q is not None and w is not None:
            klassen.setdefault(int(w // schritt_cm), []).append((q, w))
    punkte = []
    for k in sorted(klassen):
        q = median(p[0] for p in klassen[k])
        w = median(p[1] for p in klassen[k])
        if not punkte or q > punkte[-1][0]:
            punkte.append((round(q, 1), round(w, 1)))
    # Die Kurve reicht bis zum kleinsten und grössten beobachteten Paar, damit Extremtage einen Wert erhalten
    gueltig = [(q, w) for q, w in paare if q is not None and w is not None]
    if punkte and gueltig:
        tief, hoch = min(gueltig), max(gueltig)
        if tief[0] < punkte[0][0] and tief[1] < punkte[0][1]:
            punkte.insert(0, (round(tief[0], 1), round(tief[1], 1)))
        if hoch[0] > punkte[-1][0] and hoch[1] > punkte[-1][1]:
            punkte.append((round(hoch[0], 1), round(hoch[1], 1)))
    return punkte


def _linear(punkte: list, x: float, von: int, nach: int) -> float | None:
    if x is None or len(punkte) < 2 or x < punkte[0][von] or x > punkte[-1][von]:
        return None                                  # ausserhalb der Stützpunkte: kein Wert, keine Extrapolation
    for (a, b) in zip(punkte, punkte[1:]):
        if a[von] <= x <= b[von]:
            if b[von] == a[von]:
                return a[nach]
            return a[nach] + (b[nach] - a[nach]) * (x - a[von]) / (b[von] - a[von])
    return None


def wasserstand(kurve: list, q: float) -> float | None:
    return _linear(kurve, q, 0, 1)


def abfluss(kurve: list, w: float) -> float | None:
    return _linear(kurve, w, 1, 0)


def fahrrinnentiefe(w: float, glw: float, tiefe_unter_glw: float) -> float:
    return w - glw + tiefe_unter_glw



def fahrbarkeit(w: float | None, glw: float, tiefe_unter_glw: float, hsw: float | None = None) -> dict | None:
    """Zustand eines Abschnitts aus dem Wasserstand am Richtpegel.

    tiefe = W − GlW + T_GlW (verfügbare Fahrrinnentiefe), fehl = max(0, GlW − W).
    Klassen: 'gesperrt' ab dem höchsten Schifffahrtswasserstand (HSW), 'voll' ab GlW,
    darunter 'e1' (bis 30 cm unter GlW), 'e2' (bis 60 cm), 'e3' (mehr als 60 cm). Die Stufen 30/60 cm sind eine
    Darstellungswahl, keine amtliche Einteilung.
    """
    if w is None:
        return None
    fehl = max(0.0, glw - w)
    if hsw is not None and w >= hsw:
        klasse = "gesperrt"
    elif fehl == 0:
        klasse = "voll"
    else:
        klasse = "e1" if fehl <= 30 else "e2" if fehl <= 60 else "e3"
    return {"tiefe": fahrrinnentiefe(w, glw, tiefe_unter_glw), "fehl": fehl, "klasse": klasse}


# ---------------------------------------------------------------- Schätzung Kaub aus Basel und Thur
#
#   Q_Kaub(t) ≈ a + b · Q_Basel(t − 2) + c · T30(t − 2) + d · T120(t − 2)
#
# T30, T120 = Mittel der Thur in Andelfingen über 30 bzw. 120 Tage. Die Thur ist nicht reguliert und folgt dem Regen;
# sie steht für die Zuflüsse unterhalb von Basel (Neckar, Main, Schwarzwald, Vogesen), für die 2026 keine Reihe vorliegt.
# Zwei Bereiche mit eigenen Koeffizienten: Basel(t − 2) bis GRENZE m³/s (Niedrigwasser) und darüber.

GRENZE = 800.0
VERSATZ = 2


def _mittel(reihe: dict, tag: dt.date, tage: int):
    werte = [reihe.get(tag - i * EIN_TAG) for i in range(tage)]
    return None if any(v is None for v in werte) else sum(werte) / tage


def merkmale(basel: dict, thur: dict, tag: dt.date):
    t = tag - VERSATZ * EIN_TAG
    x = (1.0, basel.get(t), _mittel(thur, t, 30), _mittel(thur, t, 120))
    return None if any(v is None for v in x) else x


def _loesen(a: list, b: list) -> list:
    """Gauss-Elimination für die Normalgleichungen."""
    n = len(b)
    m = [zeile[:] + [b[i]] for i, zeile in enumerate(a)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(m[r][i]))
        m[i], m[p] = m[p], m[i]
        for r in range(i + 1, n):
            f = m[r][i] / m[i][i]
            for c in range(i, n + 1):
                m[r][c] -= f * m[i][c]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (m[i][n] - sum(m[i][c] * x[c] for c in range(i + 1, n))) / m[i][i]
    return x


def kleinste_quadrate(zeilen: list) -> list:
    """zeilen = [(x-Tupel, y)]; gibt die Koeffizienten zurück."""
    n = len(zeilen[0][0])
    ata = [[sum(x[i] * x[j] for x, _ in zeilen) for j in range(n)] for i in range(n)]
    aty = [sum(x[i] * y for x, y in zeilen) for i in range(n)]
    return _loesen(ata, aty)


def anpassen(basel: dict, thur: dict, kaub: dict, tage: list) -> dict | None:
    """Passt beide Bereiche an die Tage mit Messwert in Kaub an."""
    bereiche = {"niedrig": [], "sonst": []}
    for t in tage:
        y, x = kaub.get(t), merkmale(basel, thur, t)
        if y is not None and x is not None:
            bereiche["niedrig" if x[1] <= GRENZE else "sonst"].append((x, y))
    if any(len(z) < 100 for z in bereiche.values()):
        return None
    modell = {"grenze": GRENZE, "versatz": VERSATZ}
    for name, zeilen in bereiche.items():
        k = kleinste_quadrate(zeilen)
        fehler = [sum(ki * xi for ki, xi in zip(k, x)) - y for x, y in zeilen]
        modell[name] = {"k": k, "tage": len(zeilen), "rmse": (sum(f * f for f in fehler) / len(fehler)) ** 0.5}
    return modell


def schaetzen(modell: dict, basel: dict, thur: dict, tag: dt.date) -> float | None:
    x = merkmale(basel, thur, tag)
    if x is None:
        return None
    k = modell["niedrig" if x[1] <= modell["grenze"] else "sonst"]["k"]
    return sum(ki * xi for ki, xi in zip(k, x))


def guete(modell: dict, basel: dict, thur: dict, kaub: dict, tage: list) -> dict | None:
    """Fehler der Schätzung (Schätzung minus Messwert) an Tagen mit Messwert."""
    f = [s - kaub[t] for t in tage if kaub.get(t) is not None and (s := schaetzen(modell, basel, thur, t)) is not None]
    if not f:
        return None
    return {"tage": len(f), "mittel": sum(f) / len(f), "betrag": sum(abs(x) for x in f) / len(f),
            "rmse": (sum(x * x for x in f) / len(f)) ** 0.5}
