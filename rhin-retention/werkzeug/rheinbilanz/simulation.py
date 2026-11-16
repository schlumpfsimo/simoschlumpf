"""Optimaler Rückhalt: Wie stark lässt sich der kleinste Tagesabfluss eines Jahres mit einem Speicher V anheben?

Regel mit zwei Schwellen am Zielpegel (Tageswerte, volle Voraussicht über das Fenster, Anfangsinhalt `start_m3`).
Die Seite rechnet in Speicherjahren vom 1. April bis 31. März und übergibt den Rest ins nächste Speicherjahr:
  Abgabe     a(t) = L − Q(t)                      wenn Q(t) < L
  Rückhalt   r(t) = min(Q(t) − H, p · Q(t))       wenn Q(t) > H, der Speicher nicht voll ist und noch ein Tag mit Q < L folgt
  Speicher   S(t+1) = S(t) + 86 400 · (r(t) − a(t)),   0 ≤ S(t) ≤ V
L* ist das grösste L, für das der Speicher nie leer läuft (Bisektion; mit H = L wird am meisten gesammelt).
H* ist das grösste H, mit dem L* noch hält: gestaut wird dann nur bei den höchsten Abflüssen.
p begrenzt den Rückhalt auf einen Anteil des Abflusses am Ziel. Zusätzlich kann je Tag eine Grenze der Seen gelten
(`seegrenze`): höchstens 20 % des Abflusses unterhalb jedes Sees und nie unter dessen gemessenen Tiefstwert.

Die Seite kennt drei Rechenweisen: `heben` und `optimieren` mit voller Voraussicht (Obergrenze) und `regel` ohne Voraussicht.
Zwei Ziele mit Voraussicht: `heben` hebt die Tage unter dem GlW (tiefste zuerst, höchstens bis zum GlW, gestaut wird nur darüber),
`optimieren` hebt den kleinsten Tagesabfluss ohne Deckel.
"""
from __future__ import annotations

SEK = 86400.0


def _lauf(q: list, volumen: float, tief: float, hoch: float, anteil: float, grenze: list | None = None, start: float = 0.0,
          kapazitaet: list | None = None):
    """Simuliert die Regel. Gibt (machbar, abgabe, rueckhalt, speicher, entlastung) zurück; Lücken (None) bleiben unberührt.

    `kapazitaet` = grösster zulässiger Speicherinhalt je Tag (m³), aus Seestand und Hochwassergrenze. Liegt der Inhalt
    darüber, wird der Überschuss am selben Tag abgegeben (Entlastung).
    """
    n = len(q)
    letzter = max((i for i, x in enumerate(q) if x is not None and x < tief), default=-1)
    s, abgabe, rueckhalt, speicher, entlastung = min(start, volumen), [0.0] * n, [0.0] * n, [0.0] * n, [0.0] * n
    for i, x in enumerate(q):
        if x is not None:
            if x < tief:
                bedarf = (tief - x) * SEK
                if bedarf > s + 1e-6:
                    return False, abgabe, rueckhalt, speicher, entlastung
                s -= bedarf
                abgabe[i] = tief - x
            elif x > hoch and i < letzter and s < volumen:
                r = min(x - hoch, anteil * x, (volumen - s) / SEK)
                if grenze is not None:
                    r = min(r, grenze[i])                  # Grenze der Seen an diesem Tag
                if kapazitaet is not None:
                    r = min(r, (kapazitaet[i] - s) / SEK)  # Platz bis zur Hochwassergrenze
                r = max(0.0, r)
                s += r * SEK
                rueckhalt[i] = r
        if kapazitaet is not None and s > kapazitaet[i]:
            entlastung[i] = (s - kapazitaet[i]) / SEK
            s = kapazitaet[i]
        speicher[i] = s
    return True, abgabe, rueckhalt, speicher, entlastung


def optimieren(q: list, volumen_m3: float, anteil: float = 0.10, grenze: list | None = None,
          start_m3: float = 0.0, kapazitaet: list | None = None) -> dict | None:
    werte = [x for x in q if x is not None]
    if not werte or volumen_m3 <= 0:
        return None
    unten, oben = min(werte), sum(werte) / len(werte)
    for _ in range(50):                       # L*: grösstes machbares L (H = L)
        mitte = (unten + oben) / 2
        if _lauf(q, volumen_m3, mitte, mitte, anteil, grenze, start_m3, kapazitaet)[0]:
            unten = mitte
        else:
            oben = mitte
    tief = unten
    a, b = tief, max(werte)
    for _ in range(50):                       # H*: grösstes H, mit dem L* noch hält
        mitte = (a + b) / 2
        if _lauf(q, volumen_m3, tief, mitte, anteil, grenze, start_m3, kapazitaet)[0]:
            a = mitte
        else:
            b = mitte
    hoch = a
    _, abgabe, rueckhalt, speicher, entlastung = _lauf(q, volumen_m3, tief, hoch, anteil, grenze, start_m3, kapazitaet)
    neu = [None if x is None else x + abgabe[i] + entlastung[i] - rueckhalt[i] for i, x in enumerate(q)]
    return {"tief": tief, "hoch": hoch, "abgabe": abgabe, "rueckhalt": rueckhalt, "speicher": speicher, "entlastung": entlastung, "q": neu, "rest_m3": speicher[-1],
            "min_vorher": min(werte), "min_nachher": min(x for x in neu if x is not None)}


def heben(q: list, volumen_m3: float, deckel: float, anteil: float = 0.10, grenze: list | None = None,
          start_m3: float = 0.0, kapazitaet: list | None = None, stau_ab: float | None = None) -> dict | None:
    """Hebt die Tage unter dem Deckel (für Kaub: der Abfluss beim GlW), die tiefsten zuerst. Jede Anhebung zählt.

    Abgabe     a(t) = L − Q(t)                     wenn Q(t) < L,   mit L ≤ Deckel
    Rückhalt   r(t) = min(Q(t) − H, p · Q(t))      wenn Q(t) > H,   mit H ≥ Deckel
    L* ist das grösste L ≤ Deckel, für das der Speicher nie leer läuft: Alle Tage darunter kommen auf L*.
    Gestaut wird nur über dem Deckel, also nie an einem Tag, der selbst unter dem GlW liegt.
    H* ist das grösste H, mit dem L* noch hält.
    """
    werte = [x for x in q if x is not None]
    if not werte or volumen_m3 <= 0:
        return None
    stau_ab = max(deckel, stau_ab or deckel)        # gestaut wird frühestens ab hier (Abstand zum GlW möglich)
    unten, oben = min(min(werte), deckel), deckel
    if _lauf(q, volumen_m3, deckel, stau_ab, anteil, grenze, start_m3, kapazitaet)[0]:
        unten = deckel
    else:
        for _ in range(50):
            mitte = (unten + oben) / 2
            if _lauf(q, volumen_m3, mitte, stau_ab, anteil, grenze, start_m3, kapazitaet)[0]:
                unten = mitte
            else:
                oben = mitte
    tief = unten
    a, b = stau_ab, max(max(werte), stau_ab)
    for _ in range(50):
        mitte = (a + b) / 2
        if _lauf(q, volumen_m3, tief, mitte, anteil, grenze, start_m3, kapazitaet)[0]:
            a = mitte
        else:
            b = mitte
    _, abgabe, rueckhalt, speicher, entlastung = _lauf(q, volumen_m3, tief, a, anteil, grenze, start_m3, kapazitaet)
    neu = [None if x is None else x + abgabe[i] + entlastung[i] - rueckhalt[i] for i, x in enumerate(q)]
    return {"tief": tief, "hoch": a, "deckel": deckel, "abgabe": abgabe, "rueckhalt": rueckhalt, "speicher": speicher, "entlastung": entlastung, "q": neu, "rest_m3": speicher[-1],
            "tage_unter_vorher": sum(x < deckel for x in werte),
            "tage_unter_nachher": sum(x < deckel - 1e-6 for x in neu if x is not None),
            "tage_gehoben": sum(x > 0 for x in abgabe),
            "bedarf_alle_m3": sum(deckel - x for x in werte if x < deckel) * SEK}


def seegrenze(seen: list, anteil_see: float = 0.20) -> list:
    """Grösster zulässiger Rückhalt je Tag (m³/s am Ziel), wenn die Seen im Verhältnis ihrer Kapazität stauen.

    seen = [(Anteil am Volumen, [Abfluss an der Messstelle unterhalb je Tag, schon um die Fliesszeit zum Ziel versetzt])].
    Der Anteil ist die Summe der Anteile aller Seen oberhalb dieser Messstelle: Dort kommt ihr Rückhalt zusammen.
    Je See gilt:  r_s(t) ≤ p_s · Q_s(t)   und   Q_s(t) − r_s(t) ≥ min Q_s  (gemessener Tiefstwert der Reihe).
    Mit r_s = Anteil_s · r folgt  r(t) ≤ min über die Seen von  min(p_s · Q_s(t), Q_s(t) − min Q_s) / Anteil_s.
    Fehlt ein Abfluss, ist an diesem Tag kein Rückhalt zulässig.
    """
    n = len(seen[0][1])
    grenze = [float("inf")] * n
    for teil, q in seen:
        if teil <= 0:
            continue
        tief = min((x for x in q if x is not None), default=None)
        for i, x in enumerate(q):
            g = 0.0 if x is None or tief is None else min(anteil_see * x, x - tief) / teil
            grenze[i] = min(grenze[i], max(0.0, g))
    return [0.0 if g == float("inf") else g for g in grenze]


def regel(q: list, volumen_m3: float, deckel: float, stau_ab: float, reichweite_tage: int = 30, anteil: float = 0.10,
          grenze: list | None = None, start_m3: float = 0.0, kapazitaet: list | None = None) -> dict | None:
    """Betriebsregel ohne Voraussicht: Jede Entscheidung kennt nur den heutigen Abfluss und den Speicherinhalt.

    Abgabe     a(t) = min(Deckel − Q(t), V / (D · 86 400), S(t) / 86 400)     wenn Q(t) < Deckel
    Rückhalt   r(t) = min(Q(t) − Q_Stau, p · Q(t), Grenzen der Seen, Platz)   wenn Q(t) > Q_Stau
    D = Reichweite in Tagen: Ein voller Speicher reicht bei grösster Abgabe D Tage. Q_Stau = fester Abfluss, ab dem gestaut wird.
    """
    werte = [x for x in q if x is not None]
    if not werte or volumen_m3 <= 0:
        return None
    n, hoechst = len(q), volumen_m3 / (reichweite_tage * SEK)
    s, abgabe, rueckhalt, speicher, entlastung = min(start_m3, volumen_m3), [0.0] * n, [0.0] * n, [0.0] * n, [0.0] * n
    for i, x in enumerate(q):
        if x is not None:
            if x < deckel:
                a = max(0.0, min(deckel - x, hoechst, s / SEK))
                s -= a * SEK
                abgabe[i] = a
            elif x > stau_ab and s < volumen_m3:
                r = min(x - stau_ab, anteil * x, (volumen_m3 - s) / SEK)
                if grenze is not None:
                    r = min(r, grenze[i])
                if kapazitaet is not None:
                    r = min(r, (kapazitaet[i] - s) / SEK)
                r = max(0.0, r)
                s += r * SEK
                rueckhalt[i] = r
        if kapazitaet is not None and s > kapazitaet[i]:
            entlastung[i] = (s - kapazitaet[i]) / SEK
            s = kapazitaet[i]
        speicher[i] = s
    neu = [None if x is None else x + abgabe[i] + entlastung[i] - rueckhalt[i] for i, x in enumerate(q)]
    return {"tief": deckel, "hoch": stau_ab, "deckel": deckel, "abgabe": abgabe, "rueckhalt": rueckhalt, "speicher": speicher,
            "entlastung": entlastung, "q": neu, "rest_m3": speicher[-1]}


def speichergrenze(seen: list) -> list:
    """Grösster zulässiger Speicherinhalt je Tag (m³) aus Seestand und Hochwassergrenze.

    seen = [(Anteil am Volumen, Fläche km², Hochwassergrenze m ü. M., [Seestand je Tag, m ü. M.])].
    Der See s trägt den Anteil_s des Inhalts; sein Zusatzstau ist  h_s = Anteil_s · S / A_s.  Es muss gelten
    W_s(t) + h_s(t) ≤ Hochwassergrenze_s,  also  S(t) ≤ min über die Seen von  (Grenze_s − W_s(t)) · A_s / Anteil_s.
    Fehlt ein Seestand, gilt an dem Tag für diesen See keine Grenze.
    """
    n = len(seen[0][3])
    grenze = [float("inf")] * n
    for teil, flaeche, hoch, stand in seen:
        if teil <= 0:
            continue
        for i, w in enumerate(stand):
            if w is not None:
                grenze[i] = min(grenze[i], max(0.0, hoch - w) * flaeche * 1e6 / teil)
    return grenze
