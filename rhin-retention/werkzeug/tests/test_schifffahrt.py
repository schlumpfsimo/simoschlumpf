"""Tests für Abflusskurve, Schätzung und Optimierung mit festen Beispieldaten."""
import datetime as dt
import unittest

from rheinbilanz import schifffahrt, simulation

T0 = dt.date(2020, 1, 1)


class Kurve(unittest.TestCase):
    PAARE = [(500 + 5 * w, w) for w in range(20, 120)]          # Q = 500 + 5·W

    def test_stuetzpunkte_steigen(self):
        k = schifffahrt.abflusskurve(self.PAARE)
        self.assertTrue(all(a[0] < b[0] and a[1] < b[1] for a, b in zip(k, k[1:])))

    def test_hin_und_zurueck(self):
        k = schifffahrt.abflusskurve(self.PAARE)
        self.assertAlmostEqual(schifffahrt.wasserstand(k, 800), 60, delta=0.5)
        self.assertAlmostEqual(schifffahrt.abfluss(k, 60), 800, delta=2.5)

    def test_keine_extrapolation(self):
        k = schifffahrt.abflusskurve(self.PAARE)
        self.assertIsNone(schifffahrt.wasserstand(k, 100))
        self.assertIsNone(schifffahrt.wasserstand(k, 9000))

    def test_fahrrinnentiefe(self):
        self.assertEqual(schifffahrt.fahrrinnentiefe(67, 77, 190), 180)


class Schaetzung(unittest.TestCase):
    def daten(self):
        tage = [T0 + dt.timedelta(days=i) for i in range(900)]
        basel = {t: 500 + 600 * ((i * 37) % 11) / 10 + (i % 90) for i, t in enumerate(tage)}
        thur = {t: 10 + 40 * ((i * 13) % 7) / 6 + (i % 50) / 5 for i, t in enumerate(tage)}
        kaub = {}
        for t in tage[130:]:
            x = schifffahrt.merkmale(basel, thur, t)
            kaub[t] = (100 + 1.1 * x[1] + 2 * x[2] + 3 * x[3]) if x[1] <= schifffahrt.GRENZE else (300 + 0.9 * x[1] + 4 * x[2] + 1 * x[3])
        return basel, thur, kaub

    def test_findet_die_koeffizienten_beider_bereiche(self):
        basel, thur, kaub = self.daten()
        m = schifffahrt.anpassen(basel, thur, kaub, sorted(kaub))
        for ist, soll in zip(m["niedrig"]["k"], (100, 1.1, 2, 3)):
            self.assertAlmostEqual(ist, soll, delta=1e-4)
        for ist, soll in zip(m["sonst"]["k"], (300, 0.9, 4, 1)):
            self.assertAlmostEqual(ist, soll, delta=1e-4)
        t = sorted(kaub)[400]
        self.assertAlmostEqual(schifffahrt.schaetzen(m, basel, thur, t), kaub[t], delta=1e-4)
        self.assertLess(schifffahrt.guete(m, basel, thur, kaub, sorted(kaub))["rmse"], 1e-4)

    def test_ohne_vorlauf_kein_wert(self):
        m = {"grenze": 800, "niedrig": {"k": [0, 1, 0, 0]}, "sonst": {"k": [0, 1, 0, 0]}}
        self.assertIsNone(schifffahrt.schaetzen(m, {T0: 500.0}, {T0: 10.0}, T0 + dt.timedelta(days=2)))


class Optimierung(unittest.TestCase):
    def test_hebt_das_minimum_um_volumen_durch_dauer(self):
        q = [1000.0] * 100 + [500.0] * 10 + [1000.0] * 100
        v = 10 * 86400 * 50.0                                    # reicht für 10 Tage zu +50 m³/s
        o = simulation.optimieren(q, v)
        self.assertAlmostEqual(o["tief"], 550.0, delta=0.01)
        self.assertAlmostEqual(o["min_nachher"], 550.0, delta=0.01)

    def test_speicher_bleibt_in_den_grenzen_und_bilanz_geht_auf(self):
        q = [800.0 + 400 * ((i * 7) % 13) / 12 for i in range(200)] + [400.0] * 20 + [900.0] * 100
        v = 30e6
        o = simulation.optimieren(q, v)
        self.assertTrue(all(-1e-3 <= s <= v + 1e-3 for s in o["speicher"]))
        self.assertGreaterEqual(sum(o["rueckhalt"]) + 1e-6, sum(o["abgabe"]))
        self.assertGreater(o["min_nachher"], o["min_vorher"])

    def test_ohne_vorlauf_kein_gewinn(self):
        q = [400.0] * 10 + [900.0] * 100                         # Niedrigwasser am Jahresanfang, Speicher leer
        o = simulation.optimieren(q, 50e6)
        self.assertAlmostEqual(o["min_nachher"], 400.0, delta=0.01)

    def test_rueckhalt_nur_bei_hohem_abfluss(self):
        q = [700.0] * 50 + [2000.0] * 5 + [700.0] * 50 + [500.0] * 5 + [700.0] * 50
        o = simulation.optimieren(q, 20e6)
        self.assertTrue(all(r == 0 for i, r in enumerate(o["rueckhalt"]) if q[i] < 2000))

    def test_luecken_bleiben_luecken(self):
        q = [900.0] * 30 + [None] * 5 + [500.0] * 5
        o = simulation.optimieren(q, 5e6)
        self.assertTrue(all(x is None for x in o["q"][30:35]))


if __name__ == "__main__":
    unittest.main()
