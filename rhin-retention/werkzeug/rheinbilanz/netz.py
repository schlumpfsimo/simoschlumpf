"""Das Fliessgewässernetz als gerichteter Graph. Knoten = Messstellen, Kanten = Fliessstrecken.

Alles Fachliche, das man anpassen will, steht hier: Stationen, Kanten, Fliesszeiten, Seen.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Station:
    id: str            # Schlüssel im Werkzeug (BAFU-Nummer bzw. Pegelnummer WSV)
    name: str
    gewaesser: str
    quelle: str        # 'BAFU' oder 'WSV'
    dgj: tuple | None = None   # (Ordner, Datei) im Deutschen Gewässerkundlichen Jahrbuch


@dataclass(frozen=True)
class Kante:
    von: str
    nach: str
    tage: int = 0          # Fliesszeit in ganzen Tagen (Annahme, siehe README)
    zufluss: bool = False  # True: Nebenfluss. Fehlt seine Reihe, steckt er im Zwischengebiet (wird ausgewiesen).


@dataclass(frozen=True)
class See:
    id: str
    name: str
    pegel: str             # BAFU-Station für den Wasserstand
    flaeche_km2: float
    flaeche_quelle: str
    knoten: str            # erste Abflussmessstelle unterhalb
    reguliert: bool
    bemerkung: str = ""


STATIONEN = [
    Station("2473", "Diepoldsau, Rietbrücke", "Rhein", "BAFU"),
    Station("2288", "Neuhausen, Flurlingerbrücke", "Rhein", "BAFU"),
    Station("2044", "Andelfingen", "Thur", "BAFU"),
    Station("2143", "Rekingen", "Rhein", "BAFU"),
    Station("2135", "Bern, Schönau", "Aare", "BAFU"),
    Station("2029", "Brügg, Aegerten", "Aare", "BAFU"),
    Station("2016", "Brugg", "Aare", "BAFU"),
    Station("2018", "Mellingen", "Reuss", "BAFU"),
    Station("2243", "Baden, Limmatpromenade", "Limmat", "BAFU"),
    Station("2205", "Untersiggenthal, Stilli", "Aare", "BAFU"),
    Station("2091", "Rheinfelden", "Rhein", "BAFU"),
    Station("2289", "Basel, Rheinhalle", "Rhein", "BAFU"),
    Station("23700200", "Maxau", "Rhein", "WSV", ("Maxau", "23700200_WQ.pdf")),
    Station("23800690", "Rockenau SKA", "Neckar", "WSV", ("Rockenau SKA", "23800690_WQ.pdf")),
    Station("23900200", "Worms", "Rhein", "WSV", ("Worms", "23900200_WQ.pdf")),
    Station("24700404", "Frankfurt Osthafen", "Main", "WSV", ("Frankfurt Osthafen", "24700404_WQ.pdf")),
    Station("25100100", "Mainz", "Rhein", "WSV", ("Mainz", "25100100_WQ.pdf")),
    Station("25700100", "Kaub", "Rhein", "WSV", ("Kaub", "25700100_WQ.pdf")),
]

# Fliesszeiten in Tagen: Annahmen für Tageswerte, nicht gemessen. Basel–Kaub zusammen 2 Tage.
KANTEN = [
    Kante("2473", "2288"),                      # durch den Bodensee: keine Fliesszeit, der See puffert
    Kante("2288", "2143"),
    Kante("2044", "2143", zufluss=True),
    Kante("2135", "2029"),
    Kante("2029", "2016"),
    Kante("2016", "2205"),
    Kante("2018", "2205", zufluss=True),
    Kante("2243", "2205", zufluss=True),
    Kante("2143", "2091"),
    Kante("2205", "2091"),
    Kante("2091", "2289"),
    Kante("2289", "23700200", tage=1),
    Kante("23700200", "23900200", tage=1),
    Kante("23800690", "23900200", tage=1, zufluss=True),
    Kante("23900200", "25100100"),
    Kante("24700404", "25100100", zufluss=True),
    Kante("25100100", "25700100"),
]

# Kontrollbilanz: die drei Äste müssen zusammen den Abfluss in Stilli ergeben.
KONTROLLE = {"ziel": "2205", "glieder": ["2016", "2018", "2243"]}

ZIELE = ["2289", "25700100"]
REFERENZ = (1991, 2020)          # Periode für MQ und NM7Q der BAFU-Stationen
REFERENZ_DE = (2010, 2020)       # nur in diesen Jahren liegen im DGJ für alle deutschen Pegel Tageswerte vor (Neckar: 2010–2020)

_WD = "Wikidata, abgerufen 14.11.2026, nicht amtlich"
SEEN = [
    See("obersee", "Bodensee (Obersee)", "2032", 473.0, _WD, "2288", False, "nicht reguliert"),
    See("untersee", "Bodensee (Untersee)", "2043", 63.0, _WD + "; Bodensee 536 km² minus Obersee 473 km²", "2288", False, "nicht reguliert"),
    See("brienz", "Brienzersee", "2023", 29.8, _WD, "2135", True),
    See("thun", "Thunersee", "2093", 43.8, _WD + "; ungeprüft, andere Angaben nennen rund 48 km²", "2135", True),
    See("murten", "Murtensee", "2004", 22.8, _WD, "2029", True, "Jurarandseen, Wehr Port"),
    See("neuenburg", "Neuenburgersee", "2642", 217.9, _WD, "2029", True, "Jurarandseen, Wehr Port"),
    See("biel", "Bielersee", "2208", 39.3, _WD, "2029", True, "Jurarandseen, Wehr Port"),
    See("vws", "Vierwaldstättersee", "2207", 113.6, _WD, "2018", True),
    See("zuerich", "Zürichsee", "2209", 88.66, _WD, "2243", True),
]


@dataclass
class Netz:
    stationen: dict = field(default_factory=dict)
    kanten: list = field(default_factory=list)

    @classmethod
    def standard(cls) -> "Netz":
        return cls({s.id: s for s in STATIONEN}, list(KANTEN))

    def oben(self, knoten: str) -> list[Kante]:
        return [k for k in self.kanten if k.nach == knoten]

    def unten(self, knoten: str) -> Kante | None:
        return next((k for k in self.kanten if k.von == knoten), None)

    def einzugsknoten(self, ziel: str) -> dict[str, int]:
        """Alle Knoten oberhalb von `ziel` (und `ziel` selbst) mit der Fliesszeit in Tagen bis zum Ziel."""
        ergebnis = {ziel: 0}
        offen = [ziel]
        while offen:
            k = offen.pop()
            for kante in self.oben(k):
                ergebnis[kante.von] = ergebnis[k] + kante.tage
                offen.append(kante.von)
        return ergebnis

    def pruefen(self) -> None:
        for k in self.kanten:
            if k.von not in self.stationen or k.nach not in self.stationen:
                raise ValueError(f"Kante {k.von}→{k.nach}: Station unbekannt")
        for s in self.stationen:
            if len([k for k in self.kanten if k.von == s]) > 1:
                raise ValueError(f"Station {s} hat mehr als einen Unterlieger")
