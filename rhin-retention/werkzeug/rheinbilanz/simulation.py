"""Optimaler Rückhalt: Wie stark lässt sich der kleinste Tagesabfluss eines Jahres mit einem Speicher V anheben?

Regel mit zwei Schwellen am Zielpegel (Tageswerte, volle Voraussicht über das Jahr, Speicher am 1. Januar leer):
  Abgabe     a(t) = L − Q(t)                      wenn Q(t) < L
  Rückhalt   r(t) = min(Q(t) − H, p · Q(t))       wenn Q(t) > H, der Speicher nicht voll ist und noch ein Tag mit Q < L folgt
  Speicher   S(t+1) = S(t) + 86 400 · (r(t) − a(t)),   0 ≤ S(t) ≤ V
L* ist das grösste L, für das der Speicher nie leer läuft (Bisektion; mit H = L wird am meisten gesammelt).
H* ist das grösste H, mit dem L* noch hält: gestaut wird dann nur bei den höchsten Abflüssen.
p begrenzt den Rückhalt auf einen Anteil des Abflusses am Ziel.
"""
from __future__ import annotations

SEK = 86400.0


def _lauf(q: list, volumen: float, tief: float, hoch: float, anteil: float):
    """Simuliert die Regel. Gibt (machbar, abgabe, rueckhalt, speicher) zurück; Lücken (None) bleiben unberührt."""
    n = len(q)
    letzter = max((i for i, x in enumerate(q) if x is not None and x < tief), default=-1)
    s, abgabe, rueckhalt, speicher = 0.0, [0.0] * n, [0.0] * n, [0.0] * n
    for i, x in enumerate(q):
        if x is not None:
            if x < tief:
                bedarf = (tief - x) * SEK
                if bedarf > s + 1e-6:
                    return False, abgabe, rueckhalt, speicher
                s -= bedarf
                abgabe[i] = tief - x
            elif x > hoch and i < letzter and s < volumen:
                r = min(x - hoch, anteil * x, (volumen - s) / SEK)
                s += r * SEK
                rueckhalt[i] = r
        speicher[i] = s
    return True, abgabe, rueckhalt, speicher


def optimieren(q: list, volumen_m3: float, anteil: float = 0.10) -> dict | None:
    werte = [x for x in q if x is not None]
    if not werte or volumen_m3 <= 0:
        return None
    unten, oben = min(werte), sum(werte) / len(werte)
    for _ in range(50):                       # L*: grösstes machbares L (H = L)
        mitte = (unten + oben) / 2
        if _lauf(q, volumen_m3, mitte, mitte, anteil)[0]:
            unten = mitte
        else:
            oben = mitte
    tief = unten
    a, b = tief, max(werte)
    for _ in range(50):                       # H*: grösstes H, mit dem L* noch hält
        mitte = (a + b) / 2
        if _lauf(q, volumen_m3, tief, mitte, anteil)[0]:
            a = mitte
        else:
            b = mitte
    hoch = a
    _, abgabe, rueckhalt, speicher = _lauf(q, volumen_m3, tief, hoch, anteil)
    neu = [None if x is None else x + abgabe[i] - rueckhalt[i] for i, x in enumerate(q)]
    return {"tief": tief, "hoch": hoch, "abgabe": abgabe, "rueckhalt": rueckhalt, "speicher": speicher, "q": neu,
            "min_vorher": min(werte), "min_nachher": min(x for x in neu if x is not None)}
