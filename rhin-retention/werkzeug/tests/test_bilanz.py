"""Tests der Bilanzlogik mit festen Beispieldaten (kein Netzzugriff)."""
import datetime as dt
import unittest

from rheinbilanz import bilanz
from rheinbilanz.netz import Kante, Netz, Station

T = dt.date(2020, 8, 10)


def tag(n):
    return T + dt.timedelta(days=n)


def netz():
    """A und B (Nebenfluss) fliessen nach C, C nach D mit einem Tag Fliesszeit."""
    s = {x: Station(x, x, "Fluss", "TEST") for x in "ABCD"}
    return Netz(s, [Kante("A", "C"), Kante("B", "C", zufluss=True), Kante("C", "D", tage=1)])


Q = {
    "A": {tag(-1): 100.0, tag(0): 110.0},
    "B": {tag(-1): 40.0, tag(0): 50.0},
    "C": {tag(-1): 150.0, tag(0): 170.0},
    "D": {tag(0): 180.0, tag(1): 200.0},
}


class Knoten(unittest.TestCase):
    def test_rest_ist_differenz(self):
        b = bilanz.knotenbilanz(netz(), Q, "C", tag(0))
        self.assertEqual((b.gemessen, b.summe_oben, b.rest), (170.0, 160.0, 10.0))

    def test_fliesszeit_versetzt_den_oberlieger(self):
        b = bilanz.knotenbilanz(netz(), Q, "D", tag(0))
        self.assertEqual(b.summe_oben, 150.0)       # C vom Vortag
        self.assertEqual(b.rest, 30.0)

    def test_quellknoten_hat_keinen_rest(self):
        b = bilanz.knotenbilanz(netz(), Q, "A", tag(0))
        self.assertEqual((b.gemessen, b.summe_oben, b.rest), (110.0, None, None))

    def test_fehlender_hauptstrom_ergibt_keine_bilanz(self):
        q = {**Q, "A": {}}
        self.assertIsNone(bilanz.knotenbilanz(netz(), q, "C", tag(0)).rest)

    def test_fehlender_nebenfluss_steckt_im_rest_und_wird_genannt(self):
        q = {**Q, "B": {}}
        b = bilanz.knotenbilanz(netz(), q, "C", tag(0))
        self.assertEqual(b.rest, 60.0)
        self.assertEqual(b.ohne_reihe, ("B",))

    def test_fehlender_messwert_wird_nicht_ersetzt(self):
        b = bilanz.knotenbilanz(netz(), Q, "C", tag(5))
        self.assertIsNone(b.gemessen)
        self.assertIsNone(b.rest)


class Glieder(unittest.TestCase):
    def test_zerlegung_geht_auf(self):
        g = bilanz.glieder(netz(), Q, "D", tag(1))
        # D(1)=200; C(0)=170 → Rest D 30; A(0)=110, B(0)=50, Rest C 10
        self.assertEqual(g["Q:A"], 110.0)
        self.assertEqual(g["Q:B"], 50.0)
        self.assertEqual(g["R:C"], 10.0)
        self.assertEqual(g["R:D"], 30.0)
        self.assertAlmostEqual(g["nicht_zugeordnet"], 0.0)

    def test_anteile_summieren_auf_hundert(self):
        a = bilanz.anteile(netz(), Q, "D", [tag(0), tag(1)])
        self.assertEqual(a["tage_gueltig"], 2)
        self.assertAlmostEqual(sum(a["prozent"].values()), 100.0)
        # Summen: A 100+110, Ziel 180+200
        self.assertAlmostEqual(a["prozent"]["Q:A"], 100 * 210 / 380)

    def test_tage_ohne_daten_zaehlen_nicht(self):
        a = bilanz.anteile(netz(), Q, "D", [tag(0), tag(1), tag(2)])
        self.assertEqual((a["tage"], a["tage_gueltig"]), (3, 2))

    def test_ohne_zielwert_keine_anteile(self):
        self.assertIsNone(bilanz.anteile(netz(), Q, "D", [tag(9)]))


class Kontrolle(unittest.TestCase):
    def test_abweichung(self):
        q = {"2016": {T: 300.0}, "2018": {T: 120.0}, "2243": {T: 80.0}, "2205": {T: 510.0}}
        k = bilanz.kontrollbilanz(q, "2205", ["2016", "2018", "2243"], T)
        self.assertEqual(k["summe"], 500.0)
        self.assertEqual(k["abweichung"], 10.0)
        self.assertAlmostEqual(k["abweichung_prozent"], 100 * 10 / 510)

    def test_luecke_ergibt_none(self):
        q = {"2016": {T: 300.0}, "2018": {}, "2243": {T: 80.0}, "2205": {T: 510.0}}
        self.assertIsNone(bilanz.kontrollbilanz(q, "2205", ["2016", "2018", "2243"], T))


class Kennwerte(unittest.TestCase):
    def reihe(self, jahr, wert=100.0):
        return {t: wert for t in bilanz.jahrestage(jahr)}

    def test_mq(self):
        r = {**self.reihe(2019, 100.0), **self.reihe(2020, 200.0)}
        m = bilanz.mq(r, 2019, 2020)
        self.assertAlmostEqual(m["wert"], (365 * 100 + 366 * 200) / 731)

    def test_mq_bei_zu_vielen_luecken_none(self):
        r = self.reihe(2019)
        self.assertIsNone(bilanz.mq(r, 2019, 2020))

    def test_nm7q_findet_das_tiefste_fenster(self):
        r = self.reihe(2019)
        for i in range(7):
            r[dt.date(2019, 9, 10) + dt.timedelta(days=i)] = 30.0
        n = bilanz.nm7q(r, 2019)
        self.assertEqual(n["wert"], 30.0)
        self.assertEqual(n["beginn"], dt.date(2019, 9, 10))

    def test_nm7q_ueberspringt_fenster_mit_luecke(self):
        r = self.reihe(2019)
        for i in range(7):
            r[dt.date(2019, 9, 10) + dt.timedelta(days=i)] = 30.0
        del r[dt.date(2019, 9, 13)]
        n = bilanz.nm7q(r, 2019)
        self.assertGreater(n["wert"], 30.0)         # das lückenhafte Fenster zählt nicht, nichts wird aufgefüllt

    def test_niedrigwasser_tage(self):
        r = self.reihe(2019)
        for i in range(7):
            r[dt.date(2019, 2, 1) + dt.timedelta(days=i)] = 10.0
        tage = bilanz.niedrigwasser_tage(r, 2019, 2019)
        self.assertEqual(tage[0], dt.date(2019, 2, 1))
        self.assertEqual(len(tage), 7)


class Seen(unittest.TestCase):
    def test_speicheraenderung(self):
        stand = {tag(0): 429.50, tag(1): 429.51}     # 1 cm auf 100 km² = 1 Mio. m³ pro Tag
        self.assertAlmostEqual(bilanz.speicheraenderung(stand, 100.0, tag(1)), 1e6 / 86400)

    def test_speicheraenderung_ohne_vortag_none(self):
        self.assertIsNone(bilanz.speicheraenderung({tag(1): 429.5}, 100.0, tag(1)))

    def test_rueckhalt(self):
        self.assertAlmostEqual(bilanz.rueckhalt(86.4, 10), 100.0)

    def test_speicherband(self):
        stand = {t: 429.0 + (i % 100) / 100 for i, t in enumerate(bilanz.jahrestage(2019))}
        b = bilanz.speicherband(stand, 50.0, 2019, 2019)
        self.assertAlmostEqual(b["mio_m3_je_cm"], 0.5)
        self.assertAlmostEqual(b["volumen_mio_m3"], 50.0 * b["band_m"])


class Netzpruefung(unittest.TestCase):
    def test_standardnetz_ist_gueltig(self):
        n = Netz.standard()
        n.pruefen()
        self.assertEqual(n.einzugsknoten("25700100")["2289"], 2)   # Basel–Kaub: 2 Tage
        self.assertIn("2473", n.einzugsknoten("2289"))


if __name__ == "__main__":
    unittest.main()
