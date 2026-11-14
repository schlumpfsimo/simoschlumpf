"""Lokaler Cache: jede Antwort einer Quelle wird unverändert als Datei abgelegt."""
from __future__ import annotations

import os
import time
from pathlib import Path

ORDNER = Path(os.environ.get("RHEINBILANZ_CACHE", Path(__file__).resolve().parent.parent / "cache"))


def pfad(quelle: str, name: str) -> Path:
    p = ORDNER / quelle / name
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def holen(quelle: str, name: str, laden, max_alter_h: float | None = None) -> bytes:
    """Gibt die Datei aus dem Cache zurück; fehlt sie oder ist sie zu alt, wird `laden()` aufgerufen."""
    p = pfad(quelle, name)
    if p.exists() and (max_alter_h is None or time.time() - p.stat().st_mtime < max_alter_h * 3600):
        return p.read_bytes()
    daten = laden()
    p.write_bytes(daten)
    return daten
