"""Ausgabe: JSON für die Karte, Texttabelle und CSV. Jede Ausgabe trägt die Quellenangabe."""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
from pathlib import Path

from . import bilanz, quellen
from .daten import ERSTES_JAHR, Bestand
from .netz import KONTROLLE, REFERENZ, REFERENZ_DE, SEEN, ZIELE, Netz

QUELLEN = [
    {"kurz": "BAFU", "text": "Bundesamt für Umwelt BAFU, Hydrologische Beobachtungen, Datenplattform BAFU (Freie Nutzung. Quellenangabe ist Pflicht.)", "url": "https://data.bafu.admin.ch"},
    {"kurz": "WSV/BfG", "text": "Wasserstrassen- und Schifffahrtsverwaltung des Bundes (WSV), bereitgestellt durch die Bundesanstalt für Gewässerkunde (BfG): Deutsches Gewässerkundliches Jahrbuch und PEGELONLINE (Rohdaten)", "url": "https://www.pegelonline.wsv.de"},
]
QUELLENZEILE = "Quellen: BAFU, Hydrologische Beobachtungen (data.bafu.admin.ch) · WSV, bereitgestellt durch die BfG (DGJ, PEGELONLINE)"


def _rund(x, n=1):
    return None if x is None else round(x, n)


def _laeufe(codes: list) -> list:
    """Status je Tag als Läufe [[erster_index, code], …]; None = kein Wert."""
    laeufe, vorher = [], "–"
    for i, c in enumerate(codes):
        if c != vorher:
            laeufe.append([i, c])
            vorher = c
    return laeufe


def jahresdatei(b: Bestand, jahr: int, alt: dict | None = None) -> dict:
    tage = bilanz.jahrestage(jahr)
    q, s = {}, {}
    for sid, reihe in b.q.items():
        werte = [_rund(reihe.get(t)) for t in tage]
        codes = [b.status[sid].get(t) for t in tage]
        # Rohwerte der WSV sind nur 31 Tage abrufbar: früher gespeicherte Werte bleiben erhalten
        if alt and sid in alt.get("q", {}):
            alte_codes = _entfalten(alt["s"][sid], len(tage))
            for i, w in enumerate(alt["q"][sid][: len(tage)]):
                if werte[i] is None and w is not None:
                    werte[i], codes[i] = w, alte_codes[i]
        if any(w is not None for w in werte):
            q[sid], s[sid] = werte, _laeufe(codes)
    w = {see: [_rund(r.get(t), 3) for t in tage] for see, r in b.w.items() if any(r.get(t) is not None for t in tage)}
    wk = [_rund(b.w_kaub.get(t), 0) for t in tage]
    if alt and alt.get("wk"):
        wk = [neu if neu is not None else a for neu, a in zip(wk, alt["wk"] + [None] * len(tage))]
    datei = {"jahr": jahr, "q": q, "s": s, "w": w}
    if any(x is not None for x in wk):
        datei["wk"] = wk
    return datei


def _entfalten(laeufe: list, n: int) -> list:
    codes = [None] * n
    for (start, code), naechster in zip(laeufe, laeufe[1:] + [[n, None]]):
        for i in range(start, min(naechster[0], n)):
            codes[i] = code
    return codes


def _zeitraum(reihe: dict):
    tage = sorted(reihe)
    return [tage[0].isoformat(), tage[-1].isoformat()] if tage else None


def _anteile(netz: Netz, b: Bestand, ziel: str, periode) -> dict:
    tage = [t for j in range(periode[0], periode[1] + 1) for t in bilanz.jahrestage(j)]
    nw = bilanz.niedrigwasser_tage(b.q.get(ziel, {}), *periode)
    aus = {"periode": list(periode)}
    for name, auswahl in (("mq", tage), ("nm7q", nw)):
        a = bilanz.anteile(netz, b.q, ziel, auswahl)
        if a:
            a = {**a, "ziel_mittel": _rund(a["ziel_mittel"]), "mittel": {k: _rund(v, 2) for k, v in a["mittel"].items()},
                 "prozent": {k: _rund(v, 2) for k, v in a["prozent"].items()}}
        aus[name] = a
    return aus


def meta(b: Bestand, jahre: list[int]) -> dict:
    netz = Netz.standard()
    netz.pruefen()
    stationen = []
    for s in netz.stationen.values():
        reihe = b.q.get(s.id, {})
        periode = REFERENZ if s.quelle == "BAFU" else REFERENZ_DE
        m, n = bilanz.mq(reihe, *periode), bilanz.mnm7q(reihe, *periode)
        ort = b.orte.get(s.id)
        stationen.append({
            "id": s.id, "name": s.name, "gewaesser": s.gewaesser, "quelle": s.quelle,
            "lat": ort[0] if ort else None, "lon": ort[1] if ort else None,
            "zeitraum": _zeitraum(reihe), "periode": list(periode),
            "mq": _rund(m["wert"]) if m else None,
            "mnm7q": _rund(n["wert"]) if n else None,
            "nm7q_min": _rund(n["kleinstes"]) if n else None,
            "nm7q_min_beginn": n["kleinstes_beginn"].isoformat() if n else None,
            "dgj": b.dgj_hauptwerte.get(s.id),
        })
    seen = []
    for see in SEEN:
        stand = b.w.get(see.id, {})
        band = bilanz.speicherband(stand, see.flaeche_km2, *REFERENZ)
        ort = b.orte.get("see:" + see.id)
        seen.append({
            "id": see.id, "name": see.name, "pegel": see.pegel, "flaeche_km2": see.flaeche_km2, "flaeche_quelle": see.flaeche_quelle,
            "knoten": see.knoten, "reguliert": see.reguliert, "bemerkung": see.bemerkung,
            "lat": ort[0] if ort else None, "lon": ort[1] if ort else None, "zeitraum": _zeitraum(stand),
            "band": {k: _rund(v, 3) for k, v in band.items()} if band else None,
            "grenzen": {"tief": see.grenzen[0], "hoch": see.grenzen[1], "art": see.grenzen_art,
                        "volumen_mio_m3": _rund(see.flaeche_km2 * (see.grenzen[1] - see.grenzen[0]), 1)} if see.grenzen else None,
        })
    kontrolle_tage = [t for j in range(REFERENZ[0], REFERENZ[1] + 1) for t in bilanz.jahrestage(j)]
    abw = [k for k in (bilanz.kontrollbilanz(b.q, KONTROLLE["ziel"], KONTROLLE["glieder"], t) for t in kontrolle_tage) if k]
    return {
        "stand": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"),
        "jahre": jahre,
        "quellen": QUELLEN, "status": quellen.STATUS,
        "stationen": stationen,
        "kanten": [{"von": k.von, "nach": k.nach, "tage": k.tage, "zufluss": k.zufluss} for k in netz.kanten],
        "kontrolle": {**KONTROLLE, "periode": list(REFERENZ),
                      "mittel_abweichung": _rund(sum(k["abweichung"] for k in abw) / len(abw), 2) if abw else None,
                      "mittel_abweichung_prozent": _rund(100 * sum(k["abweichung"] for k in abw) / sum(k["ziel"] for k in abw), 2) if abw else None},
        "seen": seen,
        "ziele": ZIELE,
        "anteile": {"2289": _anteile(netz, b, "2289", REFERENZ), "25700100": _anteile(netz, b, "25700100", REFERENZ_DE)},
        "meldungen": b.meldungen,
    }


def schreiben(b: Bestand, ordner: Path, nur_ab: int | None = None) -> None:
    (ordner / "jahr").mkdir(parents=True, exist_ok=True)
    letztes = max(t.year for reihe in b.q.values() for t in reihe)
    jahre = list(range(ERSTES_JAHR, letztes + 1))
    for jahr in jahre:
        if nur_ab and jahr < nur_ab:
            continue
        ziel = ordner / "jahr" / f"{jahr}.json"
        alt = json.loads(ziel.read_text()) if ziel.exists() else None
        ziel.write_text(json.dumps(jahresdatei(b, jahr, alt), separators=(",", ":")))
    (ordner / "meta.json").write_text(json.dumps(meta(b, jahre), ensure_ascii=False, separators=(",", ":")))


# ---------------------------------------------------------------- Tabelle

def _name(netz: Netz, schluessel: str) -> str:
    if schluessel == "nicht_zugeordnet":
        return "Nicht zugeordnet (Fliesszeit)"
    art, sid = schluessel.split(":")
    s = netz.stationen[sid]
    if art == "Q":
        return f"{s.gewaesser}–{s.name} (gemessen)"
    oben = " + ".join(netz.stationen[k.von].name.split(",")[0] for k in netz.oben(sid))
    return f"Zwischengebiet {oben} → {s.name.split(',')[0]} (Rest)"


def bilanzzeilen(b: Bestand, ziel: str, von: dt.date, bis: dt.date) -> tuple[list, dict | None]:
    netz = Netz.standard()
    tage = [von + dt.timedelta(days=i) for i in range((bis - von).days + 1)]
    a = bilanz.anteile(netz, b.q, ziel, tage)
    if a is None:
        return [], None
    zeilen = [[_name(netz, k), round(a["mittel"][k], 1), round(a["prozent"][k], 1)]
              for k in sorted(a["mittel"], key=lambda k: -a["mittel"][k])]
    return zeilen, a


def tabelle(b: Bestand, ziel: str, von: dt.date, bis: dt.date) -> str:
    netz = Netz.standard()
    z = netz.stationen[ziel]
    zeilen, a = bilanzzeilen(b, ziel, von, bis)
    kopf = f"Abflussbilanz {z.gewaesser}–{z.name}, {von:%-d.%-m.%Y} bis {bis:%-d.%-m.%Y}"
    if a is None:
        return f"{kopf}\nKeine Bilanz: Für diesen Zeitraum fehlen Werte.\n{QUELLENZEILE}"
    aus = [kopf, f"Tage mit vollständigen Werten: {a['tage_gueltig']} von {a['tage']}", ""]
    aus.append(f"{'Bilanzglied':58} {'m³/s':>9} {'%':>7}")
    for name, wert, prozent in zeilen:
        aus.append(f"{name:58} {wert:9.1f} {prozent:7.1f}")
    aus.append(f"{z.gewaesser + '–' + z.name + ' (gemessen)':58} {a['ziel_mittel']:9.1f} {100:7.1f}")
    k = [x for x in (bilanz.kontrollbilanz(b.q, KONTROLLE["ziel"], KONTROLLE["glieder"], von + dt.timedelta(days=i))
                     for i in range((bis - von).days + 1)) if x]
    if k:
        mittel = sum(x["abweichung"] for x in k) / len(k)
        aus += ["", f"Kontrollbilanz Aare: Stilli minus (Brugg + Mellingen + Baden) = {mittel:+.1f} m³/s "
                    f"({100 * sum(x['abweichung'] for x in k) / sum(x['ziel'] for x in k):+.2f} %)"]
    codes = sorted({b.status[s].get(von + dt.timedelta(days=i)) for s in netz.einzugsknoten(ziel) if s in b.status
                    for i in range((bis - von).days + 1)} - {None})
    aus += ["", "Freigabestatus der verwendeten Werte: " + ", ".join(quellen.STATUS[c] for c in codes),
            "Zwischengebiete sind Reste (Differenzen), keine Messwerte. Fliesszeiten sind Annahmen.", QUELLENZEILE]
    return "\n".join(aus)


def als_csv(b: Bestand, ziel: str, von: dt.date, bis: dt.date) -> str:
    zeilen, a = bilanzzeilen(b, ziel, von, bis)
    puffer = io.StringIO()
    w = csv.writer(puffer, delimiter=";")
    w.writerow(["# " + QUELLENZEILE])
    w.writerow(["Bilanzglied", "Mittel m3/s", "Anteil %"])
    w.writerows(zeilen)
    return puffer.getvalue()
