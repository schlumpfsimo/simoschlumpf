"""Schifffahrtsgrössen am Pegel Kaub. Reine Funktionen.

Abflusskurve:  W = f(Q), stückweise linear durch Stützpunkte aus Wertepaaren (Wasserstand, Abfluss).
Fahrrinnentiefe:  T = W − GlW + T_GlW   (GlW = gleichwertiger Wasserstand, T_GlW = Fahrrinnentiefe unter GlW)
Abfluss aus Wasserstand:  Q = f⁻¹(W), mit gekennzeichneter Verlängerung der Kurve unter dem tiefsten Stützpunkt
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


# Nutzbare Ladekapazität eines Schiffs nach Pegelstand Kaub (cm, %).
# Quelle: ZKR, Reflexionspapier «Act now!», Edition 3.0 (2023): «Unterhalb von 134 cm, 72 cm und 44 cm kann sie nur mit
# 50 %, 25 % bzw. 15 % ihrer Kapazität fahren» (Rhenus Logistics); «Bei einem Pegelstand von unter 40 cm bei Kaub kann keine
# Binnenschifffahrt stattfinden». 100 % bei 250 cm nennt das Papier für ein Containerschiff (Contargo).
AUSLASTUNG = [(44.0, 15.0), (72.0, 25.0), (134.0, 50.0), (250.0, 100.0)]
KEINE_SCHIFFFAHRT_UNTER = 40.0


def auslastung(w: float | None) -> float | None:
    """Nutzbare Ladekapazität eines Schiffs in Prozent beim Pegelstand Kaub `w` (cm). Zwischen den Stützpunkten linear (Annahme).

    Unter dem tiefsten Stützpunkt (44 cm) gibt es keine Schätzung (None): 2026 fuhren Schiffe auch unter 40 cm noch,
    mit einem kleinen Teil ihrer Ladung. KEINE_SCHIFFFAHRT_UNTER bleibt als Schwelle für die Zählung der Tage unter 40 cm.
    Ab 250 cm: 100 %.
    """
    if w is None or w < AUSLASTUNG[0][0]:
        return None
    for (w0, a0), (w1, a1) in zip(AUSLASTUNG, AUSLASTUNG[1:]):
        if w <= w1:
            return a0 + (a1 - a0) * (w - w0) / (w1 - w0)
    return 100.0


def abfluss_aus_wasserstand(kurve: list, w: float, verlaengerung_cm: float = 12.0) -> tuple | None:
    """Abfluss aus dem Wasserstand: (Q, verlängert?). So entsteht auch der amtliche Abfluss eines Pegels.

    Innerhalb der Stützpunkte linear dazwischen. Liegt W bis `verlaengerung_cm` unter dem tiefsten Stützpunkt,
    wird die Kurve mit der Steigung der zwei tiefsten Stützpunkte verlängert und der Wert als verlängert gemeldet.
    Weiter darunter und über dem höchsten Stützpunkt gibt es keinen Wert.
    """
    q = abfluss(kurve, w)
    if q is not None:
        return q, False
    if w is None or len(kurve) < 2 or w >= kurve[0][1] or w < kurve[0][1] - verlaengerung_cm:
        return None
    (q0, w0), (q1, w1) = kurve[0], kurve[1]
    return q0 + (q1 - q0) * (w - w0) / (w1 - w0), True
