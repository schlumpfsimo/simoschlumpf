"""Aufruf: python -m rheinbilanz <befehl>   (siehe README)"""
from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

from . import ausgabe, daten
from .netz import STATIONEN

DATEN = Path(__file__).resolve().parent.parent.parent / "daten"


def main() -> None:
    p = argparse.ArgumentParser(prog="rheinbilanz", description="Abflussbilanz des Rheins von den Alpen bis Kaub")
    u = p.add_subparsers(dest="befehl", required=True)
    a = u.add_parser("aktualisieren", help="Daten holen und die JSON-Dateien für die Karte schreiben")
    a.add_argument("--ab", type=int, help="nur Jahresdateien ab diesem Jahr neu schreiben")
    a.add_argument("--ziel", type=Path, default=DATEN)
    t = u.add_parser("tabelle", help="Bilanz für einen Zeitraum als Text oder CSV")
    t.add_argument("--ziel", default="2289", choices=[s.id for s in STATIONEN], help="2289 = Basel, 25700100 = Kaub")
    t.add_argument("--von", type=dt.date.fromisoformat, required=True)
    t.add_argument("--bis", type=dt.date.fromisoformat, required=True)
    t.add_argument("--csv", action="store_true")
    u.add_parser("stationen", help="Stationsliste")
    u.add_parser("karte", help="Kartengeometrie neu erzeugen (GeoRhena, Natural Earth)")
    arg = p.parse_args()

    if arg.befehl == "stationen":
        for s in STATIONEN:
            print(f"{s.id:>9}  {s.quelle:4}  {s.gewaesser}–{s.name}")
        print(ausgabe.QUELLENZEILE)
        return
    if arg.befehl == "karte":
        import json
        from . import geometrie
        orte = {s["id"]: (s["lat"], s["lon"]) for s in json.loads((DATEN / "meta.json").read_text())["stationen"] if s["lat"]}
        (DATEN / "karte.json").write_text(json.dumps(geometrie.bauen(orte), ensure_ascii=False, separators=(",", ":")))
        print(f"Geschrieben: {DATEN / 'karte.json'}")
        return
    bestand = daten.laden()
    if arg.befehl == "aktualisieren":
        ausgabe.schreiben(bestand, arg.ziel, arg.ab)
        print(f"Geschrieben nach {arg.ziel}. " + (f"{len(bestand.meldungen)} Quelle(n) fehlten, siehe oben." if bestand.meldungen else "Alle Quellen erreichbar."))
    else:
        print((ausgabe.als_csv if arg.csv else ausgabe.tabelle)(bestand, arg.ziel, arg.von, arg.bis))


if __name__ == "__main__":
    main()
