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


class Fahrbarkeit(unittest.TestCase):
    def test_klassen(self):
        f = lambda w: schifffahrt.fahrbarkeit(w, 77, 190, 640)["klasse"]
        self.assertEqual([f(700), f(77), f(60), f(30), f(10)], ["gesperrt", "voll", "e1", "e2", "e3"])

    def test_tiefe_und_fehlbetrag(self):
        z = schifffahrt.fahrbarkeit(67, 77, 190, 640)
        self.assertEqual((z["tiefe"], z["fehl"]), (180, 10))
        self.assertIsNone(schifffahrt.fahrbarkeit(None, 77, 190))

    def test_amtliche_abschnitte(self):
        from rheinbilanz import netz
        a = {i: (von, bis) for i, von, bis in netz.abschnitte()}
        self.assertEqual(a["23700200"], (334.0, 384.0))      # Maxau
        self.assertEqual(a["25100300"], (508.0, 540.0))      # Oestrich
        self.assertEqual(a["25700100"], (540.0, 566.0))      # Kaub

    def test_abschnitte_schliessen_aneinander(self):
        from rheinbilanz import netz
        a = netz.abschnitte()
        self.assertEqual(a[0][1], netz.STAU_BIS)
        self.assertEqual(a[-1][2], netz.FREI_BIS)
        self.assertTrue(all(x[2] == y[1] for x, y in zip(a, a[1:])))
        self.assertTrue(all(von < p.km < bis for p, (_, von, bis) in zip(netz.RICHTPEGEL, a)))


class Auslastung(unittest.TestCase):
    def test_stuetzpunkte_der_zkr(self):
        f = schifffahrt.auslastung
        self.assertEqual([f(44), f(72), f(134), f(250), f(400)], [15.0, 25.0, 50.0, 100.0, 100.0])

    def test_unter_40_cm_keine_schifffahrt(self):
        self.assertEqual(schifffahrt.auslastung(39.9), 0.0)
        self.assertEqual(schifffahrt.auslastung(41), 15.0)

    def test_dazwischen_linear(self):
        self.assertAlmostEqual(schifffahrt.auslastung(103), 37.5)      # Mitte zwischen 72 cm und 134 cm
        self.assertIsNone(schifffahrt.auslastung(None))


class AbflussAusWasserstand(unittest.TestCase):
    KURVE = [(480.0, 10.0), (500.0, 14.0), (600.0, 30.0)]        # 5 m³/s je cm am unteren Ende

    def test_innerhalb_der_kurve(self):
        self.assertEqual(schifffahrt.abfluss_aus_wasserstand(self.KURVE, 14.0), (500.0, False))

    def test_verlaengerung_ist_gekennzeichnet(self):
        q, verlaengert = schifffahrt.abfluss_aus_wasserstand(self.KURVE, 2.0)
        self.assertAlmostEqual(q, 440.0)
        self.assertTrue(verlaengert)

    def test_zu_weit_darunter_oder_darueber_kein_wert(self):
        self.assertIsNone(schifffahrt.abfluss_aus_wasserstand(self.KURVE, -5.0))
        self.assertIsNone(schifffahrt.abfluss_aus_wasserstand(self.KURVE, 99.0))


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


class Heben(unittest.TestCase):
    def test_hebt_die_tiefsten_tage_auf_ein_niveau(self):
        q = [900.0] * 50 + [700.0, 600.0, 600.0, 760.0] + [900.0] * 50
        v = 86400 * 120.0                                # die zwei Tage mit 600 teilen sich 120 m³/s·Tag: L = 660, unter den 700 des dritten
        o = simulation.heben(q, v, 775.0)
        self.assertAlmostEqual(o["tief"], 660.0, delta=0.01)
        self.assertEqual(o["q"][50], 700.0)              # liegt über L*, bleibt
        self.assertAlmostEqual(o["q"][51], o["q"][52], delta=1e-6)
        self.assertEqual(o["q"][53], 760.0)              # liegt über L*, bleibt
        self.assertEqual((o["tage_unter_vorher"], o["tage_unter_nachher"], o["tage_gehoben"]), (4, 4, 2))
        self.assertAlmostEqual(sum(o["abgabe"]) * 86400, v, delta=1.0)   # jede Anhebung zählt: das ganze Volumen wird genutzt

    def test_nie_ueber_den_deckel(self):
        q = [900.0] * 50 + [700.0] * 3 + [900.0] * 50
        o = simulation.heben(q, 500e6, 775.0)
        self.assertAlmostEqual(o["tief"], 775.0)
        self.assertEqual(o["tage_unter_nachher"], 0)
        self.assertTrue(all(abs(x - 775.0) < 1e-9 for x in o["q"][50:53]))
        self.assertAlmostEqual(o["bedarf_alle_m3"], 3 * 75 * 86400.0)

    def test_staut_nur_ueber_dem_deckel(self):
        q = [780.0] * 20 + [760.0] * 20 + [3000.0] * 3 + [760.0] * 20 + [600.0] * 5 + [900.0] * 20
        o = simulation.heben(q, 30e6, 775.0)
        self.assertTrue(all(q[i] > 775.0 for i, r in enumerate(o["rueckhalt"]) if r > 0))
        self.assertGreaterEqual(o["hoch"], 775.0)

    def test_ohne_tage_unter_dem_deckel_passiert_nichts(self):
        o = simulation.heben([900.0] * 40, 10e6, 775.0)
        self.assertEqual(o["tage_gehoben"], 0)
        self.assertEqual(sum(o["rueckhalt"]), 0)


class Seegrenze(unittest.TestCase):
    def test_grenze_je_see(self):
        aare = [100.0, 200.0, 80.0, None]          # Tiefstwert 80
        reuss = [50.0, 60.0, 40.0, 40.0]           # Tiefstwert 40
        g = simulation.seegrenze([(0.5, aare), (0.5, reuss)])
        self.assertAlmostEqual(g[0], min(min(20.0, 20.0) / 0.5, min(10.0, 10.0) / 0.5))   # 20
        self.assertAlmostEqual(g[1], min(40.0 / 0.5, 12.0 / 0.5))                          # 24: die Reuss begrenzt
        self.assertEqual(g[2], 0.0)                 # am Tiefstwert wird nicht gestaut
        self.assertEqual(g[3], 0.0)                 # ohne Messwert kein Rückhalt

    def test_rueckhalt_haelt_die_grenze_ein(self):
        q = [900.0] * 60 + [600.0] * 5 + [900.0] * 20
        grenze = [5.0] * len(q)
        o = simulation.heben(q, 50e6, 775.0, grenze=grenze)
        self.assertTrue(all(r <= 5.0 + 1e-9 for r in o["rueckhalt"]))
        frei = simulation.heben(q, 50e6, 775.0)
        self.assertLessEqual(o["tief"], frei["tief"])          # die Grenze kann den Gewinn nur verkleinern

    def test_ohne_zulaessigen_rueckhalt_kein_gewinn(self):
        q = [900.0] * 60 + [600.0] * 5
        o = simulation.heben(q, 50e6, 775.0, grenze=[0.0] * len(q))
        self.assertEqual(sum(o["rueckhalt"]), 0)
        self.assertAlmostEqual(o["tief"], 600.0, delta=0.01)


class Uebertrag(unittest.TestCase):
    def test_anfangsinhalt_hilft_am_fensteranfang(self):
        q = [600.0] * 5 + [900.0] * 60                    # Niedrigwasser gleich am Anfang des Fensters
        leer = simulation.heben(q, 30e6, 775.0)
        voll = simulation.heben(q, 30e6, 775.0, start_m3=30e6)
        self.assertAlmostEqual(leer["tief"], 600.0, delta=0.01)
        self.assertGreater(voll["tief"], 660.0)
        self.assertAlmostEqual(voll["rest_m3"], 0.0, delta=1.0)

    def test_rest_bleibt_fuer_das_naechste_fenster(self):
        q = [900.0] * 40
        o = simulation.heben(q, 30e6, 775.0, start_m3=12e6)
        self.assertAlmostEqual(o["rest_m3"], 12e6)         # nichts gebraucht, nichts gestaut: der Inhalt geht weiter


class Hochwassergrenze(unittest.TestCase):
    def test_speichergrenze(self):
        # 100 km², Anteil 0,5: 10 cm Platz ergeben 0,1 m · 100e6 m² / 0,5 = 20 Mio. m³ Gesamtinhalt
        g = simulation.speichergrenze([(0.5, 100.0, 430.0, [429.9, 430.2, None])])
        self.assertAlmostEqual(g[0], 20e6, delta=1.0)
        self.assertEqual(g[1], 0.0)                         # See über der Grenze: kein Zusatzstau
        self.assertEqual(g[2], float("inf"))                # ohne Seestand keine Grenze

    def test_kein_stau_ohne_platz(self):
        q = [900.0] * 40 + [600.0] * 5
        o = simulation.heben(q, 50e6, 775.0, kapazitaet=[0.0] * len(q))
        self.assertEqual(sum(o["rueckhalt"]), 0)
        self.assertAlmostEqual(o["tief"], 600.0, delta=0.01)

    def test_entlastung_wenn_der_see_steigt(self):
        q = [900.0] * 20 + [900.0] * 20
        kap = [50e6] * 20 + [10e6] * 20                     # ab Tag 20 lässt der Seestand nur noch 10 Mio. m³ zu
        o = simulation.regel(q, 50e6, 775.0, 800.0, kapazitaet=kap, start_m3=30e6)
        self.assertAlmostEqual(o["entlastung"][20], (o["speicher"][19] - 10e6) / 86400)
        self.assertTrue(all(s <= k + 1e-6 for s, k in zip(o["speicher"], kap)))


class Betriebsregel(unittest.TestCase):
    def test_abgabe_ist_begrenzt_und_ohne_voraussicht(self):
        q = [900.0] * 30 + [700.0] * 40 + [500.0] * 5
        v = 30 * 86400 * 50.0                               # voller Speicher: 30 Tage zu 50 m³/s
        o = simulation.regel(q, v, 775.0, 800.0, reichweite_tage=30, start_m3=v)
        self.assertTrue(all(a <= 50.0 + 1e-9 for a in o["abgabe"]))
        self.assertAlmostEqual(o["q"][30], 750.0)            # 700 + 50, nicht bis 775
        self.assertEqual(o["abgabe"][-1], 0.0)               # nach 30 Tagen leer: die trockensten Tage gehen leer aus
        mit = simulation.heben(q, v, 775.0, start_m3=v)
        self.assertGreater(min(x for x in mit["q"][70:]), min(x for x in o["q"][70:]))   # Voraussicht hilft den trockensten Tagen

    def test_stauen_erst_ab_der_schwelle(self):
        q = [790.0] * 10 + [1200.0] * 10
        o = simulation.regel(q, 20e6, 775.0, 1000.0)
        self.assertEqual(sum(o["rueckhalt"][:10]), 0)
        self.assertGreater(sum(o["rueckhalt"][10:]), 0)


if __name__ == "__main__":
    unittest.main()
