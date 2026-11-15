// Rhein – Abfluss, Pegel Kaub, Herkunft und Rückhalt.
// Daten: daten/meta.json, daten/karte.json, daten/jahr/<Jahr>.json, erzeugt vom Python-Werkzeug (werkzeug/, siehe README).
// Die Rechnung hier folgt denselben Formeln wie werkzeug/rheinbilanz (bilanz.py, simulation.py, schifffahrt.py);
// der Abschnitt «Herleitung» der Seite zeigt sie mit den Zahlen des angezeigten Tages.
// Fehlende Werte bleiben leer. Geschätzte Werte (Kaub, Tage ohne Messwert) sind als solche bezeichnet.
(async () => {
  'use strict';
  const FR = new URLSearchParams(location.search).get('l') === 'fr';
  document.documentElement.lang = FR ? 'fr' : 'de';

  // ------------------------------------------------------------ Texte
  const T = FR ? {
    titel: 'Rhin · Navigabilité et retenue', lead: 'Deux questions : de quoi dépend la navigabilité du Rhin entre Bâle et Kaub ? Et qu’apporterait une retenue dans les lacs, restituée à l’étiage ? La page montre ce qui est mesuré et calcule ce qui serait. Elle sert de base à une discussion.',
    datTitel: 'Jeu de données', datLead: 'Toutes les séries sur lesquelles repose cette page : moyennes journalières par station, avec source, période et état. Les valeurs journalières se consultent par année et se téléchargent en CSV.', dReihe: 'Série', dGroesse: 'Grandeur', dZeit: 'Période', dTage: 'Jours', dStatus: 'État (jours)', dQ: 'Débit', dW: 'Niveau à l’échelle', dSee: 'Niveau du lac', dZeigen: 'Afficher les valeurs journalières :', dCsvJahr: 'CSV de cette année', dCsvAlle: 'CSV de toutes les années', dLaedt: 'chargement', dLegende: '° brut · * débit calculé à partir du niveau · vide : pas de valeur. Débit en m³/s, échelle en cm, lac en m s. m.', dDatum: 'Date',
    lTitel: 'Profil en long Bâle–Kaub : profondeur disponible du chenal, cm', lStau: 'canalisé', lSoll: 'profondeur au GlW', lKm: 'kilomètre du Rhin', bTitel: 'Navigabilité sur l’année', jTitel: 'Comparaison annuelle à Kaub', jJahr: 'Année', jBedarf: 'Besoin jusqu’au GlW mio m³', jRechnet: 'calcul …', jGrafik: 'Profondeur minimale du chenal à Kaub par année, cm', kTitel: 'Bénéfice selon la capacité : profondeur minimale du chenal à Kaub, cm', kX: 'capacité de retenue supplémentaire, mio m³', kHeute: 'choisi', kText: 'La courbe met à l’échelle ensemble les hauteurs choisies de tous les lacs.', kErreicht: 'Le GlW est atteint à partir d’environ', kNie: 'Le GlW n’est pas atteint dans cette plage.',
    mio: 'mio m³', aTage: 'Jours sans navigation (sous 40 cm)', aFlotte: 'Taux de chargement de la flotte', aUnter: 'moyenne des jours sous le GlW', aHinweis: 'selon la CCNR', seeWahl: 'Montrer le remplissage et la vidange pour', seeG: 'Niveau du lac, m s. m.', seeMit: 'avec retenue', seeHoch: 'limite de hautes eaux', seeTief: 'limite de basses eaux', seeMax: 'Surélévation maximale', seeFuell: 'Remplissage', seeLeer: 'Vidange', seeAbstand: 'Plus petite marge jusqu’à la limite de hautes eaux', seeKein: 'Aucune surélévation n’est calculée pour ce lac cette année.',
    frage1: '1 De quoi dépend la navigabilité ?', frage2: '2 Qu’apporterait une retenue ?', fTitel: 'Navigabilité par tronçon', fAbschnitt: 'Tronçon', fPegel: 'Échelle de référence', fW: 'Niveau cm', fGlw: 'GlW cm', fT: 'Profondeur du chenal cm', fSoll: 'au GlW', fZustand: 'État', fStau: 'Bâle–Iffezheim', fStauText: 'Rhin canalisé : les barrages maintiennent le chenal, qui ne dépend pas ici du débit', fStufen: 'barrages',
    kVoll: 'pleine profondeur du chenal', kE1: 'jusqu’à 30 cm sous le GlW', kE2: '30 à 60 cm sous le GlW', kE3: 'plus de 60 cm sous le GlW', kGesperrt: 'au-dessus des plus hautes eaux navigables', kKein: 'pas de valeur', fHinweis: 'Profondeur du chenal = niveau − GlW + profondeur sous le GlW, le même calcul que les « profondeurs disponibles calculées » de la WSV sur ELWIS. Échelles de référence et tronçons selon l’avis de police de la navigation de la GDWS (GlW 2022). Sous le GlW, les bateaux chargent moins.', fErsatz: 'Pas de valeur pour Oestrich : échelle de Bingen dans le même tronçon, ramenée au GlW d’Oestrich.',
    nTitel: 'Bénéfice par tronçon sur l’année', nUnter: 'Jours sous le GlW', nHub: 'Relèvement moyen cm', nTief: 'Profondeur minimale du chenal cm', nTage: 'Jours avec valeur',
    ziel: 'Bilan pour', ansicht: 'Vue', heute: 'Aujourd’hui', extrem: 'Extrêmes', tag: 'Date', mq: 'Moyenne', nw: 'Étiage moyen', jahr: 'Année', datum: 'Date', lage: 'Étiage',
    werte: 'Valeurs', gem: 'Mesuré', simu: 'Simulé', glied: 'Composante', anteil: 'Part', gemessen: 'mesuré', geschaetzt: 'calculé à partir du niveau', rest: 'reste (bassin intermédiaire)', negativ: 'reste négatif',
    zwischen: 'Bassin intermédiaire', kontrolle: 'Contrôle Aar : Stilli − (Brugg + Reuss + Limmat)', inkl: 'y compris', ohneReihe: 'sans série', ohneReihen: 'y compris Neckar et Main, sans séries',
    tage: 'jours avec valeurs complètes', von_: 'sur', periode: 'Période',
    mqText: 'Moyenne de tous les jours', nwText: 'Moyenne des 7 jours les plus secs de chaque année (NM7Q) à cette station',
    keine: 'Pas de bilan : des valeurs manquent pour ce jour.', status: 'État des valeurs', letzter: 'Dernier jour avec valeurs complètes', nm7qVon: 'Plus faible moyenne sur 7 jours de',
    seen: 'Lacs', see: 'Lac', stand: 'Niveau', aenderung: 'Variation', speicher: 'Variation du stock', fuellt: 'Positif : le lac se remplit et retient de l’eau.',
    nr: 'Numéro', abfluss: 'Débit', anteilAn: 'Part à', quelle: 'Source', restK: 'Bassin intermédiaire (reste)', mqK: 'MQ', nm7qMin: 'NM7Q le plus bas',
    regulierung: 'Régulation', grenzen: 'Limites', flaeche: 'Surface', reguliert: 'régulé', unreguliert: 'non régulé', keinWehr: 'Lac non régulé, pas de barrage.',
    kaubQ: 'Débit à Kaub', kaubW: 'Échelle de Kaub', glw: 'Écart au GlW (77 cm)', tiefe: 'Profondeur du chenal', baselQ: 'Débit à Bâle', vorhersage: 'Prévision à 4 jours', jetzt: 'Valeur actuelle', ausKurve: 'd’après la courbe de tarage',
    herkunft: 'Origine de l’eau', gAlpen: 'Rhin alpin et lac de Constance', gHoch: 'Thur et Rhin du lac de Constance à Bâle', gAareOben: 'Aar jusqu’à Brügg (Oberland, lacs du pied du Jura)', gAareMitte: 'Aar de Brügg à Stilli (Emme, Plateau)', gReuss: 'Reuss (lac des Quatre-Cantons)', gLimmat: 'Limmat (lac de Zurich)', gUnten: 'En aval de Bâle (Rhin supérieur, Neckar, Main)',
    aareGesamt: 'Aar à Stilli, total', rheinOben: 'Rhin avant l’Aar (Rekingen)',
    simTitel: 'Retenue pour la navigation', simLead: 'Seule la capacité supplémentaire des lacs se règle. La référence de la restitution est l’étiage équivalent (GlW) à l’échelle de Kaub : chaque relèvement sous le GlW compte. Le calcul relève d’abord les jours les plus bas à un niveau commun L*, au plus jusqu’au GlW, et ne retient que lorsque Kaub est au-dessus du GlW.', verlaufFuer: 'Courbe pour', abgabeTitel: 'Restitution (en haut) et retenue (en bas) aux lacs, m³/s', wirktSpaeter: 'agit à la station du bilan avec un retard en jours de', gAareO: 'Aar : lacs de Thoune et de Brienz', gAareJ: 'Aar : lacs du pied du Jura', seeTitel: 'Restitution et retenue par groupe de lacs', sAnteil: 'Part', sVol: 'Restitué mio m³', sMaxA: 'Restitution max. m³/s', sMaxR: 'Retenue max. m³/s', sOrt: 'Station en aval', sMin: 'Débit minimal à cette station m³/s', seeHinweis: 'Les lacs se partagent restitution et retenue au prorata de leur capacité supplémentaire. Pour chaque lac : retenue d’au plus 20 % du débit à la station en aval et jamais en dessous du débit minimal mesuré de l’année à cette station.', zielAbgabe: 'Mode de calcul', zGlw: 'Avec prévision', zRegel: 'Règle d’exploitation', zMin: 'Relever sans plafond', rStau: 'Retenue dès (Kaub, m³/s)', rTage: 'Autonomie (jours)', entlTitel: 'Délestage dû à la limite de hautes eaux', vergleich: 'Profondeur minimale du chenal à Kaub', mitVor: 'avec prévision', ohneVor: 'règle d’exploitation', spielraum: 'Jusqu’à la limite de hautes eaux', gehoben: 'Jours relevés', imMittel: 'en moyenne', rund: 'environ', bedarf: 'Besoin pour tous les jours', bedarfText: 'Somme des déficits ; sur tous les lacs régulés, cela ferait', nieUnter: 'Kaub ne passe jamais sous le GlW cette année.', ohneKaub: 'Pas de valeurs pour Kaub cette année ; le calcul relève le débit minimal à la station du bilan.',
    alle: 'Tous les lacs régulés (cm)', band: 'Tranche utilisée 1991–2020', jecm: 'Par cm', zusatz: 'Capacité suppl.', vol: 'Volume', grenzenK: 'Limites m s. m. · mio m³', volumen: 'Capacité totale',
    gBodensee: 'Lac de Constance (non régulé, hypothétique)', gAare: 'Aar', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Plus faible débit journalier', nm7qSim: 'NM7Q', pegelMin: 'Niveau le plus bas à Kaub', unterGlw: 'Jours sous le GlW à Kaub', abgabeTage: 'Restitution', rueckTage: 'Retenue', tageW: 'jours', schwellen: 'Seuils', genutzt: 'Volume utilisé',
    ausschnitt: 'Affichage', ganz: 'Année', phase: 'Étiage', diff: 'Écart', inhalt: 'Contenu du réservoir, mio m³', keinGewinn: 'Pas de gain : avant le plus faible débit, aucun débit de l’année de stockage ne permettait de retenir.',
    keinJahr: 'Pas de valeurs journalières pour cette station et cette année.', nurTag: 'Choisissez une capacité supérieure à zéro.', geschHinweis: 'jours, le débit à Kaub est calculé à partir du niveau mesuré, non mesuré.',
    bisMaerz: 'jusqu’au 31.3.', simHinweis: 'Le calcul se fait par années de stockage du 1er avril au 31 mars. Le réservoir commence vide le 1er avril de l’année précédente, un reste passe à l’année de stockage suivante. On retient au plus 10 % du débit à Kaub et au plus 20 % du débit en aval d’un lac. Le débit en aval d’un lac ne passe jamais sous son minimum mesuré de l’année. Les règlements, la protection contre les crues et l’écologie ne sont pas pris en compte par ailleurs.',
    herTitel: 'Méthode de calcul', herLead: 'Chaque nombre de cette page découle des formules ci-dessous, ici avec les valeurs du jour affiché.',
    methode: 'Hypothèses et lacunes', quellen: 'Sources', standT: 'Données du', monate: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    legende: 'Rhin dès Bâle : navigabilité par tronçon (trait plein = pleine profondeur, plus les tirets sont courts, plus on est sous le GlW). Barres en travers : barrages. En amont de Bâle et sur les affluents : largeur du trait = débit. Noir : débit de la station amont. Gris : apport du bassin intermédiaire (reste calculé). Bleu : tronçon modifié par la simulation. Carré : station. Triangle : lac régulé. Cercle : lac non régulé. Fond : swisstopo et OpenStreetMap, en trame de points.', fehlt: 'Les données n’ont pas pu être chargées.',
    meth: ['Temps de parcours : hypothèses en jours entiers (Bâle–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sinon 0 ; Bâle–Kaub 2), non mesurés. Pour la retenue dans le lac de Constance, deux jours de plus (IGKB 2024 : environ quatre jours du lac de Constance à Mannheim).', 'Le niveau 1 est une borne supérieure : il utilise toute la place jusqu’à la limite de hautes eaux. Les règlements, la protection contre les crues et l’écologie en permettent moins.',
      'Stations allemandes : valeurs journalières contrôlées de l’annuaire (2008–2025), puis données brutes des 31 derniers jours. Neckar : 2010–2020. Pour Kaub, Mayence, Worms, Bingen et le Main, les moyennes journalières du portail du HLNUG comblent la lacune depuis l’annuaire. Le débit à Kaub y est calculé à partir du niveau mesuré et désigné comme tel. Pour Maxau, Spire et Mannheim, les valeurs manquent du 1.1.2026 à la mi-octobre 2026.',
      'Si les stations entre Bâle et Kaub manquent, le bilan regroupe tout l’aval de Bâle en un seul reste.',
      'Lacs : surface constante. Surfaces et limites d’après les fiches OFEV « Seeregulierung » (2020). Lac de Constance : 536 km² selon l’IGKB, répartition non officielle.',
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.'],
  } : {
    titel: 'Rhein · Fahrbarkeit und Rückhalt', lead: 'Zwei Fragen: Was bedingt die Fahrbarkeit des Rheins zwischen Basel und Kaub? Und was brächte es, wenn die Seen Wasser zurückhielten und bei Niedrigwasser abgäben? Die Seite zeigt, was gemessen ist, und rechnet nach, was wäre. Sie ist als Grundlage für eine Diskussion gedacht.',
    datTitel: 'Datensatz', datLead: 'Alle Reihen, auf denen diese Seite beruht: Tagesmittel je Messstelle, mit Quelle, Zeitraum und Status. Die Tageswerte lassen sich je Jahr ansehen und als CSV beziehen.', dReihe: 'Reihe', dGroesse: 'Grösse', dZeit: 'Zeitraum', dTage: 'Tage', dStatus: 'Status (Tage)', dQ: 'Abfluss', dW: 'Wasserstand am Pegel', dSee: 'Seestand', dZeigen: 'Tageswerte anzeigen:', dCsvJahr: 'CSV dieses Jahres', dCsvAlle: 'CSV aller Jahre', dLaedt: 'lädt', dLegende: '° roh · * Abfluss aus Wasserstand gerechnet · leer: kein Wert. Abfluss in m³/s, Pegel in cm, Seestand in m ü. M.', dDatum: 'Datum',
    lTitel: 'Längsschnitt Basel–Kaub: verfügbare Fahrrinnentiefe, cm', lStau: 'staugeregelt', lSoll: 'Soll bei GlW', lKm: 'Rheinkilometer', bTitel: 'Fahrbarkeit im Jahr', jTitel: 'Jahresvergleich Kaub', jJahr: 'Jahr', jBedarf: 'Bedarf bis GlW Mio. m³', jRechnet: 'rechnet …', jGrafik: 'Kleinste Fahrrinnentiefe in Kaub je Jahr, cm', kTitel: 'Nutzen nach Staukapazität: kleinste Fahrrinnentiefe in Kaub, cm', kX: 'zusätzliche Staukapazität, Mio. m³', kHeute: 'gewählt', kText: 'Die Kurve skaliert die gewählten Stauhöhen aller Seen gemeinsam.', kErreicht: 'Der GlW wird erreicht ab rund', kNie: 'Der GlW wird in diesem Bereich nicht erreicht.',
    mio: 'Mio. m³', aTage: 'Tage ohne Schifffahrt (unter 40 cm)', aFlotte: 'Auslastung der Flotte', aUnter: 'Mittel der Tage unter GlW', aHinweis: 'nach ZKR', seeWahl: 'Füllung und Entleerung zeigen für', seeG: 'Seestand, m ü. M.', seeMit: 'mit Rückhalt', seeHoch: 'Hochwassergrenze', seeTief: 'Niederwassergrenze', seeMax: 'Grösster Zusatzstau', seeFuell: 'Gefüllt wird', seeLeer: 'Geleert wird', seeAbstand: 'Kleinster Abstand zur Hochwassergrenze', seeKein: 'Für diesen See ist in diesem Jahr kein Zusatzstau gerechnet.',
    frage1: '1 Was bedingt die Fahrbarkeit?', frage2: '2 Was brächte eine Retention?', fTitel: 'Fahrbarkeit nach Abschnitten', fAbschnitt: 'Abschnitt', fPegel: 'Richtpegel', fW: 'Pegel cm', fGlw: 'GlW cm', fT: 'Fahrrinnentiefe cm', fSoll: 'bei GlW', fZustand: 'Zustand', fStau: 'Basel–Iffezheim', fStauText: 'staugeregelt: Die Staustufen halten die Fahrrinne, sie hängt hier nicht vom Abfluss ab', fStufen: 'Staustufen',
    kVoll: 'volle Fahrrinnentiefe', kE1: 'bis 30 cm unter GlW', kE2: '30 bis 60 cm unter GlW', kE3: 'mehr als 60 cm unter GlW', kGesperrt: 'über dem höchsten Schifffahrtswasserstand', kKein: 'kein Wert', fHinweis: 'Fahrrinnentiefe = Pegel − GlW + Tiefe unter GlW, dieselbe Rechnung wie die «rechnerisch verfügbaren Fahrrinnentiefen» der WSV auf ELWIS. Bezugspegel und Abschnitte nach dem schifffahrtspolizeilichen Hinweis der GDWS (GlW 2022). Unterhalb des GlW können die Schiffe weniger laden.', fErsatz: 'Für Oestrich liegt kein Wert vor: Pegel Bingen im selben Abschnitt, auf den GlW von Oestrich umgerechnet.',
    nTitel: 'Nutzen je Abschnitt im Jahr', nUnter: 'Tage unter GlW', nHub: 'Mittlere Anhebung cm', nTief: 'Kleinste Fahrrinnentiefe cm', nTage: 'Tage mit Wert',
    ziel: 'Bilanz für', ansicht: 'Ansicht', heute: 'Heute', extrem: 'Extremwerte', tag: 'Datum', mq: 'Mittelwasser', nw: 'Mittleres Niedrigwasser', jahr: 'Jahr', datum: 'Datum', lage: 'Niedrigwasserlage',
    werte: 'Werte', gem: 'Gemessen', simu: 'Simuliert', glied: 'Bilanzglied', anteil: 'Anteil', gemessen: 'gemessen', geschaetzt: 'aus Wasserstand gerechnet', rest: 'Rest (Zwischengebiet)', negativ: 'negativer Rest',
    zwischen: 'Zwischengebiet', kontrolle: 'Kontrollbilanz Aare: Stilli − (Brugg + Reuss + Limmat)', inkl: 'inkl.', ohneReihe: 'ohne Messreihe', ohneReihen: 'inkl. Neckar und Main, ohne Messreihen',
    tage: 'Tage mit vollständigen Werten', von_: 'von', periode: 'Periode',
    mqText: 'Mittel aller Tage', nwText: 'Mittel der sieben trockensten Tage jedes Jahres (NM7Q) an dieser Messstelle',
    keine: 'Keine Bilanz: Für diesen Tag fehlen Werte.', status: 'Status der Werte', letzter: 'Letzter Tag mit vollständigen Werten', nm7qVon: 'Kleinstes 7-Tage-Mittel von',
    seen: 'Seen', see: 'See', stand: 'Stand', aenderung: 'Änderung', speicher: 'Speicheränderung', fuellt: 'Positiv: Der See füllt sich und hält Wasser zurück.',
    nr: 'Nummer', abfluss: 'Abfluss', anteilAn: 'Anteil an', quelle: 'Quelle', restK: 'Zwischengebiet (Rest)', mqK: 'MQ', nm7qMin: 'Kleinstes NM7Q',
    regulierung: 'Regulierung', grenzen: 'Grenzen', flaeche: 'Fläche', reguliert: 'reguliert', unreguliert: 'nicht reguliert', keinWehr: 'Nicht regulierter See, kein Wehr.',
    kaubQ: 'Abfluss Kaub', kaubW: 'Pegel Kaub', glw: 'Abstand zum GlW (77 cm)', tiefe: 'Fahrrinnentiefe', baselQ: 'Abfluss Basel', vorhersage: 'Vorhersage 4 Tage', jetzt: 'Aktueller Wert', ausKurve: 'aus der Abflusskurve',
    herkunft: 'Herkunft des Wassers', gAlpen: 'Alpenrhein und Bodensee', gHoch: 'Thur und Hochrhein', gAareOben: 'Aare bis Brügg (Oberland, Jurarandseen)', gAareMitte: 'Aare Brügg bis Stilli (Emme, Mittelland)', gReuss: 'Reuss (Vierwaldstättersee)', gLimmat: 'Limmat (Zürichsee)', gUnten: 'Unterhalb Basel (Oberrhein, Neckar, Main)',
    aareGesamt: 'Aare in Stilli, gesamt', rheinOben: 'Rhein vor der Aare (Rekingen)',
    simTitel: 'Rückhalt für die Schifffahrt', simLead: 'Einstellen lässt sich nur die zusätzliche Staukapazität der Seen. Bezugswert der Abgabe ist der gleichwertige Wasserstand (GlW) am Pegel Kaub: Jede Anhebung unter dem GlW zählt. Die Rechnung hebt die tiefsten Tage zuerst auf ein gemeinsames Niveau L*, höchstens bis zum GlW, und staut nur, wenn Kaub über dem GlW liegt.', verlaufFuer: 'Verlauf für', abgabeTitel: 'Abgabe (oben) und Rückhalt (unten) an den Seen, m³/s', wirktSpaeter: 'wirkt am Ziel später um Tage:', gAareO: 'Aare: Thuner- und Brienzersee', gAareJ: 'Aare: Jurarandseen', seeTitel: 'Abgabe und Rückhalt je Seegruppe', sAnteil: 'Anteil', sVol: 'Abgegeben Mio. m³', sMaxA: 'Grösste Abgabe m³/s', sMaxR: 'Grösster Rückhalt m³/s', sOrt: 'Messstelle unterhalb', sMin: 'Kleinster Abfluss dort m³/s', seeHinweis: 'Die Seen teilen sich Abgabe und Rückhalt im Verhältnis ihrer zusätzlichen Kapazität. Je See gilt: Rückhalt höchstens 20 % des Abflusses an der Messstelle unterhalb und nie unter deren gemessenen Jahrestiefstwert.', zielAbgabe: 'Rechenweise', zGlw: 'Mit Voraussicht', zRegel: 'Betriebsregel', zMin: 'Ohne Deckel heben', rStau: 'Stauen ab Kaub m³/s', rTage: 'Reichweite Tage', entlTitel: 'Entlastung wegen Hochwassergrenze', vergleich: 'Kleinste Fahrrinnentiefe Kaub', mitVor: 'mit Voraussicht', ohneVor: 'Betriebsregel', spielraum: 'Bis Hochwassergrenze', gehoben: 'Gehobene Tage', imMittel: 'im Mittel', rund: 'rund', bedarf: 'Bedarf für alle Tage', bedarfText: 'Summe der Fehlbeträge; auf allen regulierten Seen wären das', nieUnter: 'Kaub liegt in diesem Jahr nie unter dem GlW.', ohneKaub: 'Für dieses Jahr gibt es keine Werte für Kaub; gerechnet ist «Kleinsten Abfluss heben» an der Bilanz-Messstelle.',
    alle: 'Alle regulierten Seen (cm)', band: 'Genutztes Band 1991–2020', jecm: 'Je cm', zusatz: 'Zusätzliche Kapazität', vol: 'Volumen', grenzenK: 'Reguliergrenzen m ü. M. · Mio. m³', volumen: 'Kapazität gesamt',
    gBodensee: 'Bodensee (nicht reguliert, hypothetisch)', gAare: 'Aare', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Kleinster Tagesabfluss', nm7qSim: 'NM7Q', pegelMin: 'Tiefster Pegel Kaub', unterGlw: 'Tage unter GlW in Kaub', abgabeTage: 'Abgabe', rueckTage: 'Rückhalt', tageW: 'Tage', schwellen: 'Schwellen', genutzt: 'Genutztes Volumen',
    ausschnitt: 'Ausschnitt', ganz: 'Jahr', phase: 'Niedrigwasser', diff: 'Differenz', inhalt: 'Speicherinhalt, Mio. m³', keinGewinn: 'Kein Gewinn: Vor dem kleinsten Abfluss gab es im Speicherjahr keinen Abfluss, bei dem gestaut werden durfte.',
    keinJahr: 'Für diese Messstelle liegen in diesem Jahr keine Tageswerte vor.', nurTag: 'Wähle eine Kapazität grösser als null.', geschHinweis: 'Tagen ist der Abfluss in Kaub aus dem gemessenen Wasserstand gerechnet, nicht gemessen.',
    bisMaerz: 'bis 31.3.', simHinweis: 'Gerechnet wird in Speicherjahren vom 1. April bis 31. März. Der Speicher beginnt am 1. April des Vorjahres leer, ein Rest geht ins nächste Speicherjahr. Gestaut werden höchstens 10 % des Abflusses in Kaub und höchstens 20 % des Abflusses unterhalb eines Sees. Der Abfluss unterhalb eines Sees fällt nie unter seinen gemessenen Jahrestiefstwert. Reglemente, Hochwasserschutz und Ökologie sind sonst nicht berücksichtigt.',
    herTitel: 'Herleitung', herLead: 'Jede Zahl dieser Seite folgt aus den Formeln unten, hier mit den Werten des angezeigten Tages.',
    methode: 'Annahmen und Lücken', quellen: 'Quellen', standT: 'Datenstand', monate: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    legende: 'Rhein ab Basel: Fahrbarkeit je Abschnitt (durchgezogen = volle Fahrrinnentiefe, je kürzer die Striche, desto weiter unter dem GlW). Balken quer zum Rhein: Staustufen. Oberhalb von Basel und an den Zuflüssen: Strichbreite = Abfluss. Schwarz: Abfluss der Messstelle oberhalb. Grau: Zuwachs aus dem Zwischengebiet (gerechneter Rest). Blau: Strecke, die die Simulation verändert. Quadrat: Messstation. Dreieck: regulierter See. Kreis: nicht regulierter See. Grundkarte: swisstopo und OpenStreetMap, als Punkteraster.', fehlt: 'Die Daten konnten nicht geladen werden.',
    meth: ['Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sonst 0; Basel–Kaub 2), nicht gemessen. Für den Rückhalt im Bodensee zwei Tage mehr (IGKB 2024: Bodensee–Mannheim rund vier Tage).', 'Stufe 1 ist eine Obergrenze: Sie nutzt den ganzen Platz bis zur Hochwassergrenze. Reglemente, Hochwasserschutz und Ökologie lassen weniger zu.',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Jahrbuch (2008–2025), danach Rohdaten der letzten 31 Tage. Neckar: 2010–2020. Für Kaub, Mainz, Worms, Bingen und den Main schliessen die Tagesmittel aus dem Pegelportal des HLNUG die Lücke seit dem Jahrbuch. Der Abfluss in Kaub ist dort aus dem gemessenen Wasserstand gerechnet und so bezeichnet. Für Maxau, Speyer und Mannheim fehlen die Werte vom 1.1.2026 bis Mitte Oktober 2026.',
      'Fehlen die Pegel zwischen Basel und Kaub, fasst die Bilanz alles unterhalb von Basel zu einem Rest zusammen.',
      'Seen: konstante Fläche. Flächen und Grenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020). Bodensee: 536 km² nach IGKB, Aufteilung nicht amtlich.',
      'Es wird nichts interpoliert. Fehlt ein Wert, fehlt das Ergebnis.'],
  };
  Object.assign(T, FR ? {
    lead: 'Le débit du Rhin détermine la charge qu’un bateau peut emporter. Cette page montre, à partir des débits mesurés, de quoi dépend la navigabilité jusqu’à Kaub et ce qu’apporterait une retenue d’eau dans les lacs, restituée à l’étiage. Elle sert de base à une discussion.',
    k1Titel: '1 Le Rhin jusqu’à Kaub', k1Lead: 'Les chiffres de ce chapitre valent pour le jour choisi. Par défaut, c’est le dernier jour avec des valeurs complètes.',
    k2Titel: '2 Les années', k2Lead: 'Le débit à Kaub en moyennes journalières, année après année. Les jours sous le GlW sont hachurés.',
    k3Titel: '3 La retenue dans les lacs', k3Lead: 'Les lacs retiennent de l’eau au début de l’été et la restituent à l’étiage. Ce chapitre fait le calcul avec les débits mesurés de l’année choisie, en trois niveaux.',
    simTitel: '4 Simulateur', simLead: 'Chaque niveau peut être recalculé ici pour chaque année et modifié librement. La référence est le GlW à l’échelle de Kaub.',
    herTitel: '5 Méthode de calcul', datTitel: '6 Jeu de données',
    csv: 'Télécharger le CSV', csvQuelle: 'Sources : OFEV (data.bafu.admin.ch) ; WSV, données mises à disposition par la BfG ; HLNUG. Calculs : simoschlumpf.ch/rhin-retention',
    gTitel: 'Débit à Kaub', g40: 'en dessous, pas de navigation', gBest: 'avec retenue, avec prévision', gRegel: 'avec retenue, règle d’exploitation', gUnter: 'sous le GlW', gHub: 'relèvement', gSchnitt: 'Axe coupé à 2 000 m³/s.',
    fTitel2: 'Débit à Kaub selon l’origine',
    stufe: 'Niveau', st1: 'Niveau 1 : cadre actuel', st2: 'Niveau 2 : nouvelle capacité', st3: 'Niveau 3 : avec le lac de Constance', stFrei: 'Libre',
    stText: { 1: 'Niveau 1 : les lacs régulés retiennent jusqu’à leur limite actuelle de hautes eaux. Le lac de Constance reste inchangé.', 2: 'Niveau 2 : les lacs régulés retiennent en plus au-dessus de leur limite actuelle de hautes eaux. Le lac de Constance reste inchangé.', 3: 'Niveau 3 : comme le niveau 2, avec la même surélévation sur le lac de Constance. Il n’est pas régulé ; une régulation est jugée guère réalisable (CHR 2018, IGKB 2024).', frei: 'Libre : la surélévation se règle par lac. La limite de hautes eaux vaut avec le supplément indiqué.' },
    zusatzU: 'Au-dessus de la limite de hautes eaux (cm)', simJahr: 'Année',
    glwImmer: 'GlW tous les jours', ja: 'atteint', nein: 'non atteint', unnoetig: 'pas nécessaire', eBest: 'avec prévision', eRegel: 'règle d’exploitation', eRest: 'Jours restants sous le GlW', rText: { glw: 'Avec prévision : le calcul connaît d’avance tous les débits de l’année. Il retient autant d’eau qu’il en faudra plus tard et relève le plus les jours les plus bas. Aucune exploitation ne peut faire mieux.', regel: 'Règle d’exploitation : le calcul ne connaît que le débit du jour et le contenu du réservoir. Au-dessus du débit réglé, on retient ; sous le GlW, on restitue jusqu’à ce que le réservoir soit vide.', min: 'Sans plafond : comme avec prévision, mais les jours les plus bas sont relevés aussi au-delà du GlW.' },
    jTitel: 'Capacité nécessaire par année', jText: 'Pour chaque année : ce qui a été mesuré à Kaub, combien d’eau il aurait fallu pour tenir le GlW tous les jours, et ce que donnent les trois niveaux avec la règle d’exploitation (jours sous le GlW · profondeur minimale du chenal).', jReicht: 'Le GlW tous les jours est atteint à partir du', jNie: 'aucun niveau', jGrafik: 'Profondeur minimale du chenal à Kaub par année, cm : mesuré et niveaux 1 à 3',
    kTitel: 'Bénéfice selon la capacité : profondeur minimale du chenal à Kaub, cm', kX: 'capacité de retenue sur les lacs régulés, mio m³ (sans limite de hautes eaux)', kText: 'La courbe relève tous les lacs régulés de la même hauteur, sans limite de hautes eaux et avec prévision parfaite. Les carrés bleus sont les trois niveaux avec leur volume utilisé.',
  } : {
    lead: 'Wie viel Wasser der Rhein führt, bestimmt, wie viel ein Schiff laden kann. Diese Seite zeigt mit gemessenen Abflüssen, wovon die Fahrbarkeit bis Kaub abhängt und was es brächte, Wasser in den Seen zurückzuhalten und bei Niedrigwasser abzugeben. Sie ist als Grundlage für eine Diskussion gedacht.',
    k1Titel: '1 Der Rhein bis Kaub', k1Lead: 'Die Zahlen dieses Kapitels gelten für den gewählten Tag. Voreingestellt ist der letzte Tag mit vollständigen Werten.',
    k2Titel: '2 Die Jahre', k2Lead: 'Der Abfluss in Kaub als Tagesmittel, Jahr für Jahr. Schraffiert sind die Tage unter dem GlW.',
    k3Titel: '3 Rückhalt in den Seen', k3Lead: 'Die Seen halten im Frühsommer Wasser zurück und geben es bei Niedrigwasser ab. Dieses Kapitel rechnet das mit den gemessenen Abflüssen des gewählten Jahres durch, in drei Stufen.',
    simTitel: '4 Simulator', simLead: 'Hier lässt sich jede Stufe für jedes Jahr nachrechnen und frei verändern. Bezugswert ist der GlW am Pegel Kaub.',
    herTitel: '5 Herleitung', datTitel: '6 Datensatz',
    csv: 'CSV herunterladen', csvQuelle: 'Quellen: BAFU (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG; HLNUG. Rechnung: simoschlumpf.ch/rhin-retention',
    gTitel: 'Abfluss in Kaub', g40: 'darunter keine Schifffahrt', gBest: 'mit Rückhalt, mit Voraussicht', gRegel: 'mit Rückhalt, Betriebsregel', gUnter: 'unter dem GlW', gHub: 'Anhebung', gSchnitt: 'Achse bei 2’000 m³/s abgeschnitten.',
    fTitel2: 'Abfluss in Kaub nach Herkunft',
    stufe: 'Stufe', st1: 'Stufe 1: heutiger Rahmen', st2: 'Stufe 2: neue Staukapazität', st3: 'Stufe 3: mit Bodensee', stFrei: 'Frei',
    stText: { 1: 'Stufe 1: Die regulierten Seen stauen bis zu ihrer heutigen Hochwassergrenze. Der Bodensee bleibt unverändert.', 2: 'Stufe 2: Die regulierten Seen stauen zusätzlich über ihre heutige Hochwassergrenze hinaus. Der Bodensee bleibt unverändert.', 3: 'Stufe 3: wie Stufe 2, dazu derselbe Zusatzstau auf dem Bodensee. Er ist nicht reguliert; eine Regulierung gilt als kaum realisierbar (KHR 2018, IGKB 2024).', frei: 'Frei: Der Zusatzstau lässt sich je See einstellen. Die Hochwassergrenze gilt mit dem angegebenen Zuschlag.' },
    zusatzU: 'Über der Hochwassergrenze (cm)', simJahr: 'Jahr',
    glwImmer: 'GlW an allen Tagen', ja: 'erreicht', nein: 'nicht erreicht', unnoetig: 'nicht nötig', eBest: 'mit Voraussicht', eRegel: 'Betriebsregel', eRest: 'Verbleibende Tage unter GlW', rText: { glw: 'Mit Voraussicht: Die Rechnung kennt alle Abflüsse des Jahres im Voraus. Sie staut so viel, wie später gebraucht wird, und hebt die tiefsten Tage am stärksten. Kein Betrieb kann besser sein.', regel: 'Betriebsregel: Die Rechnung kennt nur den heutigen Abfluss und den Speicherinhalt. Über dem eingestellten Abfluss wird gestaut, unter dem GlW wird abgegeben, bis der Speicher leer ist.', min: 'Ohne Deckel: wie mit Voraussicht, die tiefsten Tage werden aber auch über den GlW hinaus gehoben.' },
    jTitel: 'Nötige Speicherkapazität pro Jahr', jText: 'Für jedes Jahr: was in Kaub gemessen wurde, wie viel Wasser für den GlW an allen Tagen gefehlt hat, und was die drei Stufen mit der Betriebsregel ergeben (Tage unter GlW · kleinste Fahrrinnentiefe).', jReicht: 'GlW an allen Tagen erreicht ab', jNie: 'keine Stufe', jGrafik: 'Kleinste Fahrrinnentiefe in Kaub je Jahr, cm: gemessen und Stufen 1 bis 3',
    kTitel: 'Nutzen nach Staukapazität: kleinste Fahrrinnentiefe in Kaub, cm', kX: 'Staukapazität auf den regulierten Seen, Mio. m³ (ohne Hochwassergrenze)', kText: 'Die Kurve hebt alle regulierten Seen um dieselbe Höhe, ohne Hochwassergrenze und mit voller Voraussicht. Die blauen Quadrate sind die drei Stufen mit ihrem genutzten Volumen.',
  });
  const $ = id => document.getElementById(id);
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[e.dataset.t]; });
  document.title = T.titel.replace(' · ', ' – ');
  $('inhalt').innerHTML = [['k1', 'k1Titel'], ['k2', 'k2Titel'], ['k3', 'k3Titel'], ['simulator', 'simTitel'], ['herleitung', 'herTitel'], ['daten', 'datTitel']].map(([id, k]) => `<a href="#${id}">${T[k]}</a>`).join('');
  $('sprache').innerHTML = FR ? '<a href="./" hreflang="de" lang="de">DE</a> · <span aria-current="page">FR</span>'
    : '<span aria-current="page">DE</span> · <a href="?l=fr" hreflang="fr" lang="fr">FR</a>';
  const zahl = (x, n = 0) => x == null || !isFinite(x) ? '–'
    : (x < 0 ? '−' : '') + Math.abs(x).toFixed(n).replace(/\B(?=(\d{3})+(?!\d))/g, FR ? ' ' : '’').replace('.', FR ? ',' : '.');
  const qz = x => zahl(x, x != null && Math.abs(x) < 100 ? 1 : 0);
  const vz = (x, n) => x == null ? '–' : (x > 0 ? '+' : '') + zahl(x, n);
  const datum = iso => { const [j, m, t] = iso.split('-'); return `${+t}.${+m}.${j}`; };

  // ------------------------------------------------------------ Daten und Netz
  let meta, karte;
  try {
    [meta, karte] = await Promise.all(['daten/meta.json', 'daten/karte.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
  } catch (e) { $('bilanz').textContent = T.fehlt; return; }
  const ST = Object.fromEntries(meta.stationen.map(s => [s.id, s]));
  const KAUB = '25700100', BASEL = '2289', K = meta.kaub || {};
  const GLW = K.kennwerte && K.kennwerte.GlW ? K.kennwerte.GlW.value : null, TUG = K.kennwerte && K.kennwerte.TuGLW ? K.kennwerte.TuGLW.value : null;
  // Volles Netz und Kurznetz (alles unterhalb von Basel als ein Rest), falls die Pegel zwischen Basel und Kaub fehlen
  const VOLL = meta.kanten, KURZ = meta.kanten.filter(k => ST[k.nach].quelle === 'BAFU').concat([{ von: BASEL, nach: KAUB, tage: 2, zufluss: false }]);
  let NETZ = VOLL; const EINZUG = new Map();
  const oben = id => NETZ.filter(k => k.nach === id);
  const unten = id => NETZ.find(k => k.von === id);
  const einzug = ziel => {                       // {knoten: Fliesszeit in Tagen bis zum Ziel}
    const s = (NETZ === VOLL ? 'v' : 'k') + ziel; if (EINZUG.has(s)) return EINZUG.get(s);
    const e = { [ziel]: 0 }, offen = [ziel];
    while (offen.length) { const k = offen.pop(); for (const c of oben(k)) { e[c.von] = e[k] + c.tage; offen.push(c.von); } }
    EINZUG.set(s, e); return e;
  };
  const jahre = {}, GELADEN = {};
  const jahr = j => jahre[j] || (jahre[j] = fetch(`daten/jahr/${j}.json`).then(r => r.ok ? r.json() : null).catch(() => null).then(y => { if (y) GELADEN[j] = y; return y; }));
  const nachbarn = j => Promise.all([j - 1, j + 1].filter(x => meta.jahre.includes(x)).map(jahr));     // für den Speicher über den Jahreswechsel
  const tagNr = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5);
  const isoTag = (j, i) => new Date(Date.UTC(j, 0, 1 + i)).toISOString().slice(0, 10);
  const kurz = s => s.name.split(',')[0];
  const LETZTES = meta.jahre[meta.jahre.length - 1];
  // Namen aus den Daten sind deutsch; für die französische Fassung werden Gewässer, Seen, Status und Quellen übersetzt
  const NAMEN = { Rhein: 'Rhin', Aare: 'Aar', Basel: 'Bâle', 'Bodensee (Obersee)': 'Lac de Constance (lac supérieur)', 'Bodensee (Untersee)': 'Lac de Constance (lac inférieur)',
    Brienzersee: 'Lac de Brienz', Thunersee: 'Lac de Thoune', Murtensee: 'Lac de Morat', Neuenburgersee: 'Lac de Neuchâtel', Bielersee: 'Lac de Bienne', 'Vierwaldstättersee': 'Lac des Quatre-Cantons', 'Zürichsee': 'Lac de Zurich' };
  const STATUS_FR = { 0: 'brut', 1: 'provisoire', 2: 'validé', 3: 'définitif', 4: 'contrôlé (annuaire DGJ)', 6: 'moyenne journalière WSV via le HLNUG', 7: 'calculé à partir du niveau (courbe de tarage)', 8: 'calculé à partir du niveau (courbe prolongée)' };
  const QUELLEN_FR = { BAFU: 'Office fédéral de l’environnement OFEV, observations hydrologiques, plateforme de données de l’OFEV (utilisation libre, mention de la source obligatoire)',
    HLNUG: 'Office hessois de l’environnement HLNUG, portail des échelles : moyennes journalières des échelles WSV de Kaub, Mayence, Worms, Bingen et Francfort Osthafen',
    'WSV/BfG': 'Administration fédérale allemande des voies navigables (WSV), données mises à disposition par la BfG : annuaire hydrologique allemand et PEGELONLINE (données brutes)' };
  const nm = s => FR ? (NAMEN[s] || s) : s, GW = s => nm(s.gewaesser), statusName = c => FR ? (STATUS_FR[c] || meta.status[c]) : meta.status[c];
  const DP = FR ? ' : ' : ': ';                  // Doppelpunkt: im Französischen mit Abstand davor
  const GERECHNET = c => c === 7 || c === 8;    // Abfluss nicht gemessen, sondern aus dem Wasserstand gerechnet
  const statusAm = (Y, id, i) => { let c = null; for (const [start, code] of (Y.s[id] || [])) { if (start <= i) c = code; else break; } return c; };

  // ------------------------------------------------------------ Bilanz (wie bilanz.py)
  const wert = (q, id, i) => (i < 0 || !q[id] || q[id][i] == null) ? null : q[id][i];
  function rest(q, id, i) {
    const x = wert(q, id, i); let summe = 0;
    for (const k of oben(id)) {
      const v = wert(q, k.von, i - k.tage);
      if (v == null) { if (!k.zufluss) return null; } else summe += v;
    }
    return x == null ? null : x - summe;
  }
  function glieder(q, ziel, i) {
    const zq = wert(q, ziel, i); if (zq == null) return null;
    const g = {};
    for (const [id, tage] of Object.entries(einzug(ziel))) {
      if (!oben(id).length) {
        const v = wert(q, id, i - tage);
        if (v == null) { const u = unten(id); if (u && u.zufluss) continue; return null; }
        g['Q:' + id] = v;
      } else { const r = rest(q, id, i - tage); if (r == null) return null; g['R:' + id] = r; }
    }
    g.ziel = zq; return g;
  }
  function anteile(q, ziel, i0, i1) {
    const summe = {}; let n = 0;
    for (let i = i0; i <= i1; i++) { const g = glieder(q, ziel, i); if (!g) continue; n++; for (const k in g) summe[k] = (summe[k] || 0) + g[k]; }
    if (!n || !summe.ziel) return null;
    const mittel = {}, prozent = {};
    for (const k in summe) if (k !== 'ziel') { mittel[k] = summe[k] / n; prozent[k] = 100 * summe[k] / summe.ziel; }
    return { tage: i1 - i0 + 1, tage_gueltig: n, ziel_mittel: summe.ziel / n, mittel, prozent };
  }
  function nm7q(a) {
    let b = null;
    for (let i = 0; i + 6 < a.length; i++) {
      let s = 0, ok = true;
      for (let k = 0; k < 7; k++) { if (a[i + k] == null) { ok = false; break; } s += a[i + k]; }
      if (ok && (!b || s / 7 < b.wert)) b = { wert: s / 7, beginn: i };
    }
    return b;
  }
  const abfluss = (a, id) => {                   // Abfluss an einem Knoten = Summe seiner Glieder
    const e = einzug(id); let s = 0, n = 0;
    for (const k in a.mittel) if (k.slice(2) in e) { s += a.mittel[k]; n++; }
    return n ? s : null;
  };

  // ------------------------------------------------------------ Pegel Kaub (wie schifffahrt.py)
  const KURVE = K.abflusskurve || [];           // Stützpunkte [Q, W]
  const linear = (x, von, nach) => {
    if (x == null || KURVE.length < 2 || x < KURVE[0][von] || x > KURVE[KURVE.length - 1][von]) return null;
    let i = 1; while (KURVE[i][von] < x) i++;
    const a = KURVE[i - 1], b = KURVE[i];
    return b[von] === a[von] ? a[nach] : a[nach] + (b[nach] - a[nach]) * (x - a[von]) / (b[von] - a[von]);
  };
  const wAusQ = q => linear(q, 0, 1), qAusW = w => linear(w, 1, 0);
  // Auslastung der Flotte nach Pegelstand Kaub (ZKR, «Act now!», 2023): Stützpunkte, dazwischen linear; unter 40 cm keine Schifffahrt
  const AUSL = meta.auslastung;
  function auslastung(w) {
    if (w == null || !AUSL) return null;
    const p = AUSL.punkte;
    if (w < AUSL.keine_unter) return 0;
    if (w <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (w <= p[i][0]) return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (w - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
    return 100;
  }
  const Q_GLW = GLW != null ? qAusW(GLW) : null;
  const Q_STAU = GLW != null ? qAusW(GLW + 10) : null;     // gestaut wird erst 10 cm über dem GlW, damit kein Tag durch den Rückhalt unter den GlW fällt

  // ------------------------------------------------------------ Optimaler Rückhalt (wie simulation.py)
  const SEK = 86400, P_MAX = 0.10, P_SEE = 0.20;
  let START = 0;                                // Speicherinhalt am Anfang des Fensters (m³)
  let KAPG = null;                              // grösster zulässiger Speicherinhalt je Tag aus Seestand und Hochwassergrenze (m³)
  let GRENZE = null;                            // grösster zulässiger Rückhalt je Tag aus den Grenzen der Seen (m³/s am Ziel)
  function lauf(q, V, tief, hoch) {
    const n = q.length, abgabe = new Float64Array(n), rueck = new Float64Array(n), speicher = new Float64Array(n), entl = new Float64Array(n);
    let letzter = -1; for (let i = 0; i < n; i++) if (q[i] != null && q[i] < tief) letzter = i;
    let s = Math.min(START, V);
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (x < tief) { const bedarf = (tief - x) * SEK; if (bedarf > s + 1e-6) return null; s -= bedarf; abgabe[i] = tief - x; }
        else if (x > hoch && i < letzter && s < V) { const r = Math.max(0, Math.min(x - hoch, P_MAX * x, (V - s) / SEK, GRENZE ? GRENZE[i] : Infinity, KAPG ? (KAPG[i] - s) / SEK : Infinity)); s += r * SEK; rueck[i] = r; }
      }
      if (KAPG && s > KAPG[i]) { entl[i] = (s - KAPG[i]) / SEK; s = KAPG[i]; }     // See über der Hochwassergrenze: Überschuss sofort abgeben
      speicher[i] = s;
    }
    return { abgabe, rueck, speicher, entl };
  }
  // Betriebsregel ohne Voraussicht: kennt nur den heutigen Abfluss und den Speicherinhalt
  function regel(q, V, deckel, stauAb, reichweite) {
    const n = q.length, abgabe = new Float64Array(n), rueck = new Float64Array(n), speicher = new Float64Array(n), entl = new Float64Array(n), hoechst = V / (reichweite * SEK);
    let s = Math.min(START, V);
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (x < deckel) { const a = Math.max(0, Math.min(deckel - x, hoechst, s / SEK)); s -= a * SEK; abgabe[i] = a; }
        else if (x > stauAb && s < V) { const r = Math.max(0, Math.min(x - stauAb, P_MAX * x, (V - s) / SEK, GRENZE ? GRENZE[i] : Infinity, KAPG ? (KAPG[i] - s) / SEK : Infinity)); s += r * SEK; rueck[i] = r; }
      }
      if (KAPG && s > KAPG[i]) { entl[i] = (s - KAPG[i]) / SEK; s = KAPG[i]; }
      speicher[i] = s;
    }
    return { tief: deckel, hoch: stauAb, abgabe, rueck, speicher, entl };
  }
  function optimieren(q, V) {                  // Ziel «kleinsten Abfluss heben»
    const w = q.filter(x => x != null); if (!w.length || V <= 0) return null;
    let a = Math.min(...w), b = w.reduce((s, x) => s + x, 0) / w.length;
    for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (lauf(q, V, m, m)) a = m; else b = m; }
    const tief = a; let c = tief, d = Math.max(...w);
    for (let i = 0; i < 50; i++) { const m = (c + d) / 2; if (lauf(q, V, tief, m)) c = m; else d = m; }
    return { tief, hoch: c, ...lauf(q, V, tief, c) };
  }
  function heben(q, V, deckel, stauAb = deckel) {               // Ziel «bis zum GlW heben»: tiefste Tage zuerst, höchstens bis zum Deckel; gestaut wird nur darüber
    const w = q.filter(x => x != null); if (!w.length || V <= 0) return null;
    let a = Math.min(deckel, ...w), b = deckel;
    if (lauf(q, V, deckel, stauAb)) a = deckel;
    else for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (lauf(q, V, m, stauAb)) a = m; else b = m; }
    const tief = a; let c = stauAb, d = Math.max(stauAb, ...w);
    for (let i = 0; i < 50; i++) { const m = (c + d) / 2; if (lauf(q, V, tief, m)) c = m; else d = m; }
    return { tief, hoch: c, ...lauf(q, V, tief, c), glw: true, deckel, bedarf: w.reduce((s, x) => s + Math.max(0, deckel - x), 0) * SEK };
  }

  // ------------------------------------------------------------ Zustand
  const Z = { ziel: KAUB, ansicht: 'heute', jahr: LETZTES, tag: null, extrem: 0, sim: false, zoom: false, modus: 'glw', verlauf: null, see: null, stufe: '1', zusatz: 50 };
  let UEBER = 0;                                // Zusatzstau über der heutigen Hochwassergrenze (cm): verschiebt die Grenze nach oben
  const BODENSEE = '2288', BODENSEE_TAGE = 2;   // zusätzliche Fliesszeit vom Bodensee bis Basel (Annahme: Bodensee–Mannheim rund 4 Tage nach IGKB 2024)
  const CM = Object.fromEntries(meta.seen.map(s => [s.id, s.reguliert ? 10 : 0]));
  const REGEL = { stauAb: 1000, tage: 30 };   // Betriebsregel: stauen ab diesem Abfluss in Kaub (m³/s); voller Speicher reicht so viele Tage
  const tagAnsicht = () => ['heute', 'extrem', 'tag'].includes(Z.ansicht);
  // Seegruppen: Name, Seen, erste Messstelle unterhalb
  const SEEGRUPPEN = [['gBodensee', ['obersee', 'untersee'], '2288'], ['gAareO', ['brienz', 'thun'], '2135'], ['gAareJ', ['murten', 'neuenburg', 'biel'], '2029'], ['gReussL', ['vws'], '2018'], ['gLimmatL', ['zuerich'], '2243']];
  const SEE = Object.fromEntries(meta.seen.map(s => [s.id, s]));

  // Drei Stufen. 1: regulierte Seen bis zur heutigen Hochwassergrenze (Kapazität = Abstand des tiefsten Seestands im Jahr zur Grenze,
  // die Grenze selbst gilt Tag für Tag). 2: dazu Zusatzstau über der Grenze. 3: dazu derselbe Zusatzstau auf dem Bodensee.
  function stufeCM(Y, stufe, zusatz) {
    const cm = {};
    for (const s of meta.seen) {
      const w = Y.w[s.id] && Y.w[s.id].filter(v => v != null);
      if (s.reguliert) cm[s.id] = (s.grenzen && w && w.length ? Math.max(0, Math.ceil(100 * (s.grenzen.hoch - Math.min(...w)))) : 0) + (stufe >= 2 ? zusatz : 0);
      else cm[s.id] = stufe >= 3 ? zusatz : 0;
    }
    return cm;
  }
  function stufeAnwenden(Y) { if (Z.stufe === 'frei' || !Y) return; Object.assign(CM, stufeCM(Y, +Z.stufe, Z.zusatz)); UEBER = +Z.stufe >= 2 ? Z.zusatz : 0; }
  // Rechnet ein Jahr mit einer Stufe (oder mit festen cm auf den regulierten Seen ohne Hochwassergrenze), ohne den Zustand der Seite zu ändern
  function szenario(Y, stufe, modus = 'glw', cmFrei = null) {
    const altCM = { ...CM }, altU = UEBER, altM = Z.modus, altN = NETZ;
    if (cmFrei != null) { for (const s of meta.seen) CM[s.id] = s.reguliert ? cmFrei : 0; UEBER = Infinity; }
    else { Object.assign(CM, stufe ? stufeCM(Y, stufe, 50) : Object.fromEntries(meta.seen.map(s => [s.id, 0]))); UEBER = stufe >= 2 ? 50 : 0; }
    Z.modus = modus; NETZ = VOLL;
    try { const S = simulieren(Y); return { S, k: kaubJahr(Y, S), v: S.V / 1e6, genutzt: S.O ? Math.max(...S.O.speicher) / 1e6 : 0 }; }
    finally { Object.assign(CM, altCM); UEBER = altU; Z.modus = altM; NETZ = altN; }
  }
  const bedarfGlw = Y => Y.q[KAUB] && Q_GLW != null ? Y.q[KAUB].reduce((s, x) => s + (x == null ? 0 : Math.max(0, Q_GLW - x)), 0) * SEK / 1e6 : null;

  // Die Seen teilen sich Rückhalt und Abgabe im Verhältnis ihrer Kapazität; die Wirkung wandert mit der Fliesszeit talwärts.
  function simulieren(Y) {
    // Ziel «GlW halten» rechnet immer am Pegel Kaub; ohne Kaub-Werte im Jahr gilt «kleinsten Abfluss heben» an der Bilanz-Messstelle
    const glw = Z.modus !== 'min' && Q_GLW != null && Y.q[KAUB] && Y.q[KAUB].some(x => x != null), zid = glw ? KAUB : Z.ziel;
    let V = 0;
    for (const s of meta.seen) V += CM[s.id] * s.flaeche_km2 * 1e4;
    if (!Y.q[zid] || !V) return { q: Y.q, wirkung: {}, V, O: null, zid };
    // Der Speicher läuft über den Jahreswechsel: gerechnet wird in Speicherjahren vom 1. April bis 31. März.
    // Das Kalenderjahr setzt sich aus dem Ende des einen (Januar bis März) und dem Anfang des nächsten zusammen;
    // der Rest des ersten geht als Anfangsinhalt ins zweite. Dazu braucht es das Vorjahr und das Folgejahr.
    const Yv = GELADEN[Y.jahr - 1] || null, Yn = GELADEN[Y.jahr + 1] || null, laenge = y => (y.q[BASEL] || Object.values(y.q)[0]).length;
    const n = laenge(Y), nv = Yv ? laenge(Yv) : 0, nn = Yn ? laenge(Yn) : 0;
    const reihe = id => { const a = new Array(nv + n + nn).fill(null); for (const [y, o] of [[Yv, 0], [Y, nv], [Yn, nv + n]]) if (y && y.q[id]) y.q[id].forEach((x, i) => { a[o + i] = x; }); return a; };
    const qz = reihe(zid), wirkung = {}, alt = NETZ; NETZ = VOLL;
    const zumZiel = { ...einzug(zid) }; if (BODENSEE in zumZiel) zumZiel[BODENSEE] += BODENSEE_TAGE;
    const a1 = Yv ? tagNr(`${Y.jahr - 1}-04-01`) : 0, b1 = nv + tagNr(`${Y.jahr}-04-01`), b2 = Yn ? nv + n + tagNr(`${Y.jahr + 1}-04-01`) : nv + n;
    // Grenze je Messstelle unterhalb eines Sees: höchstens P_SEE des Abflusses dort und nie unter dessen gemessenen Tiefstwert im Speicherjahr.
    // Die Seen stauen im Verhältnis ihrer Kapazität; an der Messstelle kommt der Rückhalt aller Seen oberhalb zusammen.
    const anteil = ids => ids.reduce((s, id) => s + CM[id] * SEE[id].flaeche_km2 * 1e4, 0) / V;
    const gruppen = SEEGRUPPEN.filter(([, ids]) => anteil(ids)).map(([, , knoten]) => ({ qk: reihe(knoten), lag: zumZiel[knoten] || 0,
      teil: SEEGRUPPEN.reduce((s, [, ids2, k2]) => s + (k2 in einzug(knoten) ? anteil(ids2) : 0), 0) }));
    const fenster = (a, b, start) => {
      GRENZE = new Float64Array(b - a).fill(Infinity);
      for (const g of gruppen) {
        let tief = Infinity; for (let i = a; i < b; i++) { const x = g.qk[i - g.lag]; if (x != null && x < tief) tief = x; }
        for (let i = a; i < b; i++) { const x = g.qk[i - g.lag], c = x == null ? 0 : Math.max(0, Math.min(P_SEE * x, x - tief)) / g.teil; if (c < GRENZE[i - a]) GRENZE[i - a] = c; }
      }
      // Hochwassergrenze: Seestand plus Zusatzstau darf die Grenze nicht überschreiten. Der See s trägt seinen Anteil am Inhalt S,
      // sein Zusatzstau ist Anteil_s · S / A_s; daraus folgt S(t) ≤ min über die Seen von (Grenze_s − W_s(t)) · A_s / Anteil_s.
      KAPG = seenMitGrenze.length ? new Float64Array(b - a).fill(Infinity) : null;
      for (const g of seenMitGrenze) for (let i = a; i < b; i++) { const w = g.w[i - lz]; if (w != null) { const c = Math.max(0, g.hoch + UEBER / 100 - w) * g.flaeche * 1e6 / g.teil; if (c < KAPG[i - a]) KAPG[i - a] = c; } }
      START = start;
      const o = Z.modus === 'regel' && glw ? regel(qz.slice(a, b), V, Q_GLW, REGEL.stauAb, REGEL.tage) : glw ? heben(qz.slice(a, b), V, Q_GLW, Q_STAU) : optimieren(qz.slice(a, b), V);
      GRENZE = null; KAPG = null; START = 0; return o;
    };
    const lz = zumZiel[BASEL] || 0;
    const stand = id => { const a = new Array(nv + n + nn).fill(null); for (const [y, o] of [[Yv, 0], [Y, nv], [Yn, nv + n]]) if (y && y.w[id]) y.w[id].forEach((x, i) => { a[o + i] = x; }); return a; };
    const seenMitGrenze = meta.seen.filter(s => CM[s.id] > 0 && s.grenzen).map(s => ({ w: stand(s.id), hoch: s.grenzen.hoch, flaeche: s.flaeche_km2, teil: CM[s.id] * s.flaeche_km2 * 1e4 / V }));
    const istRegel = Z.modus === 'regel' && glw;
    // Mit Voraussicht: zwei Speicherjahre mit Übertrag. Betriebsregel: ein Lauf über Vorjahr, Jahr und Folgejahr, Beginn leer.
    const O1 = istRegel ? fenster(0, nv + n + nn, 0) : fenster(a1, b1, 0), O2 = istRegel ? null : fenster(b1, b2, O1 ? O1.speicher[O1.speicher.length - 1] : 0);
    if (!O1 && !O2) { NETZ = alt; return { q: Y.q, wirkung: {}, V, O: null, zid }; }
    const O = { tief: (O2 || O1).tief, hoch: (O2 || O1).hoch, winter: O1 && O2 ? { tief: O1.tief, hoch: O1.hoch } : null, glw: !!glw, regel: istRegel, deckel: Q_GLW,
      abgabe: new Float64Array(n), rueck: new Float64Array(n), speicher: new Float64Array(n), entl: new Float64Array(n), netto: new Float64Array(n) };
    for (let i = 0; i < n; i++) { const g = nv + i, o = istRegel ? O1 : g < b1 ? O1 : O2, k = istRegel ? g : g < b1 ? g - a1 : g - b1;
      if (o) { O.abgabe[i] = o.abgabe[k]; O.rueck[i] = o.rueck[k]; O.speicher[i] = o.speicher[k]; O.entl[i] = o.entl[k]; O.netto[i] = o.abgabe[k] + o.entl[k] - o.rueck[k]; } }
    if (glw) O.bedarf = Y.q[zid].reduce((s, x) => s + (x == null ? 0 : Math.max(0, Q_GLW - x)), 0) * SEK;
    for (const s of meta.seen) {
      const teil = CM[s.id] * s.flaeche_km2 * 1e4 / V; if (!teil || !(s.knoten in zumZiel)) continue;
      for (let k = s.knoten, lag = 0; k;) {
        const w = wirkung[k] || (wirkung[k] = new Float64Array(n));
        for (let i = 0; i < n; i++) { const j = i - zumZiel[s.knoten] + lag; if (j >= 0 && j < n) w[j] += teil * O.netto[i]; }
        const u = unten(k); if (!u) break; lag += u.tage + (k === BODENSEE ? BODENSEE_TAGE : 0); k = u.nach;
      }
    }
    NETZ = alt;
    const q = {};
    for (const id in Y.q) q[id] = wirkung[id] ? Y.q[id].map((x, i) => x == null ? null : x + wirkung[id][i]) : Y.q[id];
    // Aktion an den Seen (Abgabe positiv, Rückhalt negativ) am Tag, an dem sie geschieht: lz Tage vor der Wirkung am Ziel
    const aktion = new Float64Array(n);
    for (let i = 0; i < n; i++) { const j = i - lz; if (j >= 0) aktion[j] = O.netto[i]; }
    const teile = SEEGRUPPEN.map(([g, ids, knoten]) => ({ g, knoten, teil: ids.reduce((s, id) => s + CM[id] * SEE[id].flaeche_km2 * 1e4, 0) / V }));
    return { q, wirkung, V, O, zid, lz, aktion, teile };
  }

  // ------------------------------------------------------------ Bedienung
  function knoepfe(titel, liste, aktiv, klick) {
    const g = document.createElement('div'); g.className = 'gruppe';
    g.innerHTML = `<span>${h(titel)}</span><div class="knoepfe" role="group" aria-label="${h(titel)}">` +
      liste.map(([w, t]) => `<button type="button" data-w="${w}" aria-pressed="${w === aktiv}">${h(t)}</button>`).join('') + '</div>';
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => klick(b.dataset.w)));
    return g;
  }
  function feld(titel, html) { const g = document.createElement('label'); g.className = 'gruppe'; g.innerHTML = `<span>${h(titel)}</span>${html}`; return g; }
  function wahlZeichnen(Y) {
    const w = $('wahl'); w.textContent = '';
    w.append(knoepfe(T.ziel, meta.ziele.map(z => [z, kurz(ST[z])]), Z.ziel, v => { Z.ziel = v; Z.extrem = 0; if (Z.ansicht === 'heute') Z.tag = null; alles(); }));
    w.append(knoepfe(T.ansicht, [['heute', T.heute], ['extrem', T.extrem], ['tag', T.tag], ['mq', T.mq], ['nw', T.nw]], Z.ansicht, v => {
      if (v === 'tag' && Z.ansicht === 'extrem' && Z.i0 != null) Z.tag = Z.i0;
      Z.ansicht = v; if (v === 'heute') { Z.jahr = LETZTES; Z.tag = null; } alles();
    }));
    if (tagAnsicht()) w.append(knoepfe(T.werte, [['0', T.gem], ['1', T.simu]], Z.sim ? '1' : '0', v => { Z.sim = v === '1'; alles(); }));
    if (Z.ansicht === 'extrem') {
      const f = feld(T.lage, `<select>${meta.extreme[Z.ziel].map((e, i) => `<option value="${i}"${i === Z.extrem ? ' selected' : ''}>${e.jahr} · ${datum(e.beginn).slice(0, -4)}–${datum(e.ende)} · ${zahl(e.wert)} m³/s</option>`).join('')}</select>`);
      f.querySelector('select').addEventListener('change', e => { Z.extrem = +e.target.value; alles(); });
      w.append(f);
    }
    if (Z.ansicht === 'tag' && Y) {
      const n = (Y.q[BASEL] || []).length;
      const j = feld(T.jahr, `<select>${meta.jahre.slice().reverse().map(x => `<option${x === Z.jahr ? ' selected' : ''}>${x}</option>`).join('')}</select>`);
      j.querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; alles(); });
      const d = feld(T.datum, `<input type="date" value="${isoTag(Z.jahr, Z.tag)}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      d.querySelector('input').addEventListener('change', e => { if (e.target.value) { Z.tag = tagNr(e.target.value); alles(); } });
      const r = document.createElement('div'); r.className = 'gruppe regler';
      r.innerHTML = `<input type="range" min="0" max="${n - 1}" value="${Z.tag}" aria-label="${T.datum}">`;
      r.querySelector('input').addEventListener('input', e => { Z.tag = +e.target.value; alles(true); });
      w.append(j, d, r);
    }
  }

  // ------------------------------------------------------------ Rechnen
  async function rechnen() {
    NETZ = VOLL;
    if (!tagAnsicht()) {
      const art = Z.ansicht === 'mq' ? 'mq' : 'nm7q', p = meta.anteile[Z.ziel], je = {};
      for (const z of meta.ziele) je[z] = meta.anteile[z][art];
      const Y = await jahr(Z.jahr); await nachbarn(Z.jahr); stufeAnwenden(Y);
      return { a: p[art], zeige: p[art], je, Y, S: Y ? simulieren(Y) : null, text: `${Z.ansicht === 'mq' ? T.mqText : T.nwText}. ${T.periode} ${p.periode[0]}–${p.periode[1]}.`, datumText: `${p.periode[0]}–${p.periode[1]}` };
    }
    if (Z.ansicht === 'extrem') { const x = meta.extreme[Z.ziel][Z.extrem]; Z.jahr = x.jahr; Z.i0 = tagNr(x.beginn); Z.tag = tagNr(x.ende); }
    const Y = await jahr(Z.jahr); await nachbarn(Z.jahr); stufeAnwenden(Y);
    if (!Y) return { a: null, zeige: null, text: '' };
    const n = (Y.q[BASEL] || Object.values(Y.q)[0]).length;
    const netzWahl = i => { NETZ = VOLL; if (!glieder(Y.q, KAUB, i)) { NETZ = KURZ; if (!glieder(Y.q, KAUB, i)) NETZ = VOLL; } };
    if (Z.ansicht === 'heute' && Z.tag == null) { for (Z.tag = n - 1; Z.tag > 0; Z.tag--) { netzWahl(Z.tag); if (glieder(Y.q, Z.ziel, Z.tag)) break; } }
    if (Z.tag == null || Z.tag >= n) Z.tag = n - 1;
    const i1 = Z.tag, i0 = Z.ansicht === 'extrem' ? Z.i0 : i1;
    netzWahl(i1);
    const S = simulieren(Y), a = anteile(Y.q, Z.ziel, i0, i1), s = S.O ? anteile(S.q, Z.ziel, i0, i1) : null, q = Z.sim && s ? S.q : Y.q, je = {}, wirk = {};
    for (const z of meta.ziele) je[z] = anteile(q, z, i0, i1);
    for (const id in S.wirkung) { let x = 0; for (let i = i0; i <= i1; i++) x += S.wirkung[id][i - (einzug(Z.ziel)[id] || 0)] || 0; wirk[id] = x / (i1 - i0 + 1); }
    const codes = new Set(); for (const id in einzug(Z.ziel)) for (let i = i0; i <= i1; i++) { const c = statusAm(Y, id, i - einzug(Z.ziel)[id]); if (c != null) codes.add(c); }
    const dt = i0 === i1 ? datum(isoTag(Z.jahr, i1)) : `${datum(isoTag(Z.jahr, i0)).slice(0, -4)}–${datum(isoTag(Z.jahr, i1))}`;
    const text = Z.ansicht === 'heute' ? `${T.letzter}${DP}${dt}.` : Z.ansicht === 'extrem' ? `${T.nm7qVon} ${Z.jahr}: ${dt}.` : `${dt}.`;
    return { a, sim: s, zeige: Z.sim && s ? s : a, je, Y, S, i0, i1, wirk, text, datumText: dt, status: [...codes].sort().map(c => statusName(c)).join(', ') };
  }

  // ------------------------------------------------------------ Lage: Kaub und Basel am angezeigten Tag
  function lageZeichnen(R) {
    const el = $('lage');
    if (!tagAnsicht() || !R.Y) { el.hidden = true; return; }
    el.hidden = false;
    const mittel = (q, id) => { let s = 0, n = 0; for (let i = R.i0; i <= R.i1; i++) { const x = wert(q, id, i); if (x != null) { s += x; n++; } } return n ? s / n : null; };
    const sim = Z.sim && R.S && R.S.O, qK = mittel(R.Y.q, KAUB), qKs = sim ? mittel(R.S.q, KAUB) : null, qB = mittel(R.Y.q, BASEL), qBs = sim ? mittel(R.S.q, BASEL) : null;
    const gesch = GERECHNET(statusAm(R.Y, KAUB, R.i1));
    let wM = null; if (R.Y.wk && R.i0 === R.i1) wM = R.Y.wk[R.i1];
    const w = wM != null ? wM : wAusQ(qK), ws = sim ? (wM != null && wAusQ(qK) != null && wAusQ(qKs) != null ? wM + wAusQ(qKs) - wAusQ(qK) : wAusQ(qKs)) : null;
    const k = (titel, gross, zusatz = '', kl = '') => `<div><span>${titel}</span><b class="${kl}">${gross}</b><em>${zusatz}</em></div>`;
    const beide = (x, y, einheit, n = 0) => y != null && x != null ? `${zahl(y, n)} <small>${einheit}</small>` : `${zahl(x, n)} <small>${einheit}</small>`;
    const anders = (x, y) => y != null && x != null && Math.abs(y - x) >= .05;
    const dazu = (x, y, einheit, n, wort = T.gemessen) => anders(x, y) ? `${wort} ${zahl(x, n)} ${einheit} · ${vz(y - x, 1)}` : '';
    const kl = anders(qK, qKs) ? 'sim' : '', klB = anders(qB, qBs) ? 'sim' : '';
    let html = k(`${T.kaubQ}${gesch ? ` (${T.geschaetzt})` : ''}`, beide(qK, qKs, 'm³/s'), dazu(qK, qKs, 'm³/s', 0, gesch ? T.geschaetzt : T.gemessen), kl) +
      k(T.kaubW, beide(w, ws, 'cm'), [dazu(w, ws, 'cm', 0, wM == null ? T.ausKurve : T.gemessen), wM == null && w != null && !anders(w, ws) ? T.ausKurve : ''].filter(Boolean).join(''), kl);
    const wz = ws != null ? ws : w;
    if (GLW != null && wz != null) html += k(T.glw, `${vz(wz - GLW, 0)} <small>cm</small>`, '', kl) + k(T.tiefe, `${zahl(wz - GLW + TUG)} <small>cm</small>`, `= ${zahl(wz)} − ${zahl(GLW)} + ${zahl(TUG)}`, kl);
    if (wz != null && AUSL) html += k(T.aFlotte, `${zahl(auslastung(wz))} <small>%</small>`, wz < AUSL.keine_unter ? T.aTage.split(' (')[0] : T.aHinweis, kl);
    html += k(T.baselQ, beide(qB, qBs, 'm³/s'), dazu(qB, qBs, 'm³/s', 0), klB);
    if (Z.ansicht === 'heute' && K.vorhersage && K.vorhersage.length) {
      const v = K.vorhersage, l = v[v.length - 1], werte = v.map(x => x[1]);
      html += k(T.vorhersage, `${zahl(l[1])} <small>cm</small>`, `${datum(l[0].slice(0, 10))} · ${zahl(Math.min(...werte))}–${zahl(Math.max(...werte))} cm · WSV/BfG`);
      if (K.aktuell) html += k(T.jetzt, `${zahl(K.aktuell.value)} <small>cm</small>`, `${datum(K.aktuell.timestamp.slice(0, 10))}, ${K.aktuell.timestamp.slice(11, 16).replace(':', FR ? ' h ' : '.')}${FR ? '' : ' Uhr'} · ${statusName(0)}`);
    }
    el.innerHTML = html;
  }

  // ------------------------------------------------------------ Fahrbarkeit: Abschnitte je Richtpegel (wie schifffahrt.fahrbarkeit)
  const RP = meta.richtpegel || [], KM = karte.rheinkm || [];
  const kurve = (k, x, von, nach) => {
    if (x == null || !k || k.length < 2 || x > k[k.length - 1][von]) return null;
    if (x < k[0][von]) {                         // unter dem tiefsten Stützpunkt: mit der Steigung der zwei tiefsten verlängern, höchstens 12 cm
      const y = k[0][nach] + (k[1][nach] - k[0][nach]) * (x - k[0][von]) / (k[1][von] - k[0][von]), w = von === 0 ? y : x;
      return w >= k[0][1] - 12 ? y : null;
    }
    let i = 1; while (k[i][von] < x) i++;
    const a = k[i - 1], b = k[i];
    return b[von] === a[von] ? a[nach] : a[nach] + (b[nach] - a[nach]) * (x - a[von]) / (b[von] - a[von]);
  };
  // Wasserstand am Richtpegel: gemessen, sonst aus der Bezugskurve (Abfluss am Bezugspegel); simuliert = gemessen + Kurvendifferenz
  function pegelstand(Y, S, p, i, sim) {
    const q0 = wert(Y.q, p.bezug, i); let mess = Y.wp && Y.wp[p.id] ? Y.wp[p.id][i] : null, ersatz = false;
    if (mess == null && p.ersatz && Y.wp && Y.wp[p.ersatz.id] && Y.wp[p.ersatz.id][i] != null) { mess = Y.wp[p.ersatz.id][i] - p.ersatz.glw + p.glw; ersatz = true; }   // Ersatzpegel im selben Abschnitt, auf den GlW des Bezugspegels umgerechnet
    const basis = mess != null ? mess : kurve(p.kurve, q0, 0, 1);
    if (basis == null) return null;
    if (!sim || !S || !S.wirkung[p.bezug] || !S.wirkung[p.bezug][i]) return { w: basis, ausKurve: mess == null, ersatz };
    const f0 = kurve(p.kurve, q0, 0, 1), f1 = kurve(p.kurve, q0 + S.wirkung[p.bezug][i], 0, 1);
    return f0 == null || f1 == null ? { w: basis, ausKurve: mess == null, ersatz } : { w: basis + f1 - f0, ausKurve: mess == null, ersatz };
  }
  function zustand(w, p) {
    if (w == null || p.glw == null) return null;
    const fehl = Math.max(0, p.glw - w);
    return { tiefe: w - p.glw + p.tugl, fehl, klasse: p.hsw != null && w >= p.hsw ? 'gesperrt' : !fehl ? 'voll' : fehl <= 30 ? 'e1' : fehl <= 60 ? 'e2' : 'e3' };
  }
  const STRICH = { voll: '', e1: '13 5', e2: '6 6', e3: '1.5 6', gesperrt: '', kein: '3 7' };
  const KLASSE = { voll: 'kVoll', e1: 'kE1', e2: 'kE2', e3: 'kE3', gesperrt: 'kGesperrt', kein: 'kKein' };
  const muster = (kl, farbe = '#000') => `<svg width="44" height="10" aria-hidden="true"><line x1="0" x2="44" y1="5" y2="5" stroke="${kl === 'gesperrt' || kl === 'kein' ? '#a8a8a8' : farbe}" stroke-width="${kl === 'kein' ? 2 : 6}" stroke-dasharray="${STRICH[kl]}"/></svg>`;
  function abschnitte(R) {                     // Zustand je Abschnitt am angezeigten Tag, gemessen und simuliert
    if (!tagAnsicht() || !R.Y) return [];
    return RP.map(p => {
      const m = pegelstand(R.Y, R.S, p, R.i1, false), s = R.S && R.S.O ? pegelstand(R.Y, R.S, p, R.i1, true) : null;
      return { p, m, s, zm: m && zustand(m.w, p), zs: s && zustand(s.w, p) };
    });
  }
  function fahrbarZeichnen(R) {
    const el = $('fahrbar'), A = abschnitte(R);
    if (!A.length) { el.innerHTML = ''; return; }
    const sim = Z.sim && R.S && R.S.O;
    el.innerHTML = `<h2>${T.fTitel}, ${datum(isoTag(Z.jahr, R.i1))}</h2><div class="rollen"><table><thead><tr><th>${T.fAbschnitt}</th><th>${T.fPegel}</th><th class="z">${T.fW}</th><th class="z">${T.fGlw}</th><th class="z">${T.fT} (${T.gemessen})</th>${sim ? `<th class="z">${T.simu}</th>` : ''}<th class="z">${T.fSoll}</th><th>${T.fZustand}${sim ? ` (${T.simu.toLowerCase()})` : ''}</th></tr></thead><tbody>` +
      `<tr><td>${T.fStau}, km ${zahl(meta.stau.von)}–${zahl(meta.stau.bis)}</td><td>${meta.staustufen.length - 1} ${T.fStufen}</td><td colspan="${sim ? 6 : 5}">${T.fStauText}</td></tr>` +
      A.map(({ p, m, s, zm, zs }) => { const z = sim && zs ? zs : zm, kl = z ? z.klasse : 'kein';
        return `<tr><td>km ${zahl(p.von, 1)}–${zahl(p.bis, 1)}</td><td>${h(p.name)}</td><td class="z">${m ? zahl(m.w) + (m.ausKurve ? '*' : '') + (m.ersatz ? '†' : '') : '–'}</td><td class="z">${zahl(p.glw)}</td><td class="z">${zm ? zahl(zm.tiefe) : '–'}</td>` +
          (sim ? `<td class="z">${zs ? `${zahl(zs.tiefe)} (${vz(zs.tiefe - zm.tiefe, 0)})` : '–'}</td>` : '') + `<td class="z">${zahl(p.tugl)}</td><td>${muster(kl, sim && zs && Math.abs(zs.tiefe - zm.tiefe) >= .5 ? '#003399' : '#000')}${T[KLASSE[kl]]}</td></tr>`; }).join('') +
      `</tbody></table></div><p class="hinweis">${T.fHinweis}${A.some(x => x.m && x.m.ausKurve) ? ` * ${T.ausKurve}.` : ''}${A.some(x => x.m && x.m.ersatz) ? ` † ${T.fErsatz}` : ''}</p>`;
  }
  const kmLinie = (von, bis) => KM.filter(x => x[0] >= von && x[0] <= bis).map(x => [x[2], x[1]]);
  function fahrbarkeitKarte(R) {
    const stau = kmLinie(meta.stau.von, meta.stau.bis);
    if (stau.length) L.polyline(stau, { color: '#000', weight: 6, lineCap: 'butt' }).addTo(ebene).bindTooltip(`${T.fStau}${DP}${T.fStauText}`, { sticky: true });
    const A = abschnitte(R), sim = Z.sim && R.S && R.S.O;
    for (const p of RP) {
      const a = A.find(x => x.p === p), z = a && (sim && a.zs ? a.zs : a.zm), kl = z ? z.klasse : 'kein', linie = kmLinie(p.von, p.bis); if (linie.length < 2) continue;
      const blau = sim && a && a.zs && a.zm && Math.abs(a.zs.tiefe - a.zm.tiefe) >= .5;
      L.polyline(linie, { color: '#fff', weight: 9, lineCap: 'butt', interactive: false }).addTo(ebene);
      L.polyline(linie, { color: kl === 'gesperrt' || kl === 'kein' ? '#a8a8a8' : blau ? '#003399' : '#000', weight: kl === 'kein' ? 2 : 7, dashArray: STRICH[kl] || null, lineCap: 'butt' }).addTo(ebene)
        .bindTooltip(`${p.name}, km ${zahl(p.von, 1)}–${zahl(p.bis, 1)}: ${z ? `${T.fT} ${zahl(z.tiefe)} (${T.fSoll} ${zahl(p.tugl)}) · ${T[KLASSE[kl]]}` : T.kKein}`, { sticky: true });
      if (!ST[p.id]) { const o = KM.reduce((b, x) => Math.abs(x[0] - p.km) < Math.abs(b[0] - p.km) ? x : b, KM[0]);   // Richtpegel ohne Abflussmessstelle
        L.marker([o[2], o[1]], { icon: L.divIcon({ className: '', html: '<div class="pkt"></div>', iconSize: [11, 11], iconAnchor: [5.5, 5.5] }), title: p.name, alt: p.name, zIndexOffset: 400 }).addTo(ebene)
          .bindPopup(`<h3>Rhein–${h(p.name)}</h3><div class="raster2">${zeile(T.nr, p.id)}${zeile('km', zahl(p.km, 1))}${zeile(T.fW, a && a.m ? zahl(a.m.w) : '–')}${zeile(T.fGlw, zahl(p.glw))}${zeile(T.fT, z ? zahl(z.tiefe) : '–')}${zeile(T.quelle, 'WSV / BfG')}</div>`); }
    }
    for (const s of meta.staustufen) L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: '<div class="stau"></div>', iconSize: [5, 15], iconAnchor: [2.5, 7.5] }), title: s.name, alt: s.name, zIndexOffset: 300 }).addTo(ebene)
      .bindTooltip(`${FR ? 'Barrage' : 'Staustufe'} ${s.name}`);
  }
  // Nutzen je Abschnitt über das Jahr: Tage unter GlW und kleinste Fahrrinnentiefe, gemessen und simuliert
  function nutzenTafel(R) {
    const Y = R.Y, S = R.S, n = (Y.q[BASEL] || []).length;
    const zeilen = RP.map(p => {
      let tage = 0, u0 = 0, u1 = 0, hub = 0, gehoben = 0, t0 = null, t1 = null;
      for (let i = 0; i < n; i++) {
        const m = pegelstand(Y, S, p, i, false); if (!m) continue; const s = pegelstand(Y, S, p, i, true), zm = zustand(m.w, p), zs = zustand(s.w, p);
        tage++; if (zm.fehl > 0) u0++; if (zs.fehl > 0) u1++;
        if (zm.fehl > 0 && s.w - m.w > .05) { hub += s.w - m.w; gehoben++; }
        t0 = t0 == null ? zm.tiefe : Math.min(t0, zm.tiefe); t1 = t1 == null ? zs.tiefe : Math.min(t1, zs.tiefe);
      }
      return `<tr><td>${h(p.name)}, km ${zahl(p.von, 1)}–${zahl(p.bis, 1)}</td><td class="z">${tage}</td><td class="z">${tage ? `${u0} → ${u1}` : '–'}</td><td class="z">${gehoben ? `${vz(hub / gehoben, 0)} (${gehoben} ${T.tageW})` : '–'}</td><td class="z">${tage ? `${zahl(t0)} → ${zahl(t1)}` : '–'}</td><td class="z">${zahl(p.tugl)}</td></tr>`;
    }).join('');
    $('nutzen').innerHTML = `<h2>${T.nTitel} ${Z.jahr}</h2><div class="rollen"><table><thead><tr><th>${T.fAbschnitt}</th><th class="z">${T.nTage}</th><th class="z">${T.nUnter}</th><th class="z">${T.nHub}</th><th class="z">${T.nTief}</th><th class="z">${T.fSoll}</th></tr></thead><tbody>${zeilen}</tbody></table></div>`;
  }

  // ------------------------------------------------------------ Vier Grafiken: Längsschnitt, Jahresband, Kapazitätskurve, Jahresvergleich
  const MUSTERDEFS = `<defs>
    <pattern id="g_e1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#000" stroke-width="1.2"/></pattern>
    <pattern id="g_e2" width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="3.5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="3.5" stroke="#000" stroke-width="2"/></pattern>
    <pattern id="g_ges" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><line x1="0" y1="1" x2="4" y2="1" stroke="#000" stroke-width="1.2"/></pattern>
    <pattern id="g_kein" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><circle cx="2" cy="2" r=".9" fill="#a8a8a8"/></pattern>
    <pattern id="s_e1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#003399" stroke-width="1.2"/></pattern>
    <pattern id="s_e2" width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="3.5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="3.5" stroke="#003399" stroke-width="2"/></pattern>
    <pattern id="g_stau" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" fill="#fff"/><line x1="0" y1="0" x2="0" y2="7" stroke="#a8a8a8" stroke-width="1"/></pattern></defs>`;
  // Die Muster stehen einmal im Dokument, damit sie auch gelten, wenn eine Grafik ausgeblendet ist
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${MUSTERDEFS}</svg>`);
  const FUELL = (kl, sim) => ({ voll: '#fff', e1: sim ? 'url(#s_e1)' : 'url(#g_e1)', e2: sim ? 'url(#s_e2)' : 'url(#g_e2)', e3: sim ? '#003399' : '#000', gesperrt: 'url(#g_ges)', kein: 'url(#g_kein)' }[kl]);
  const klLegende = () => ['voll', 'e1', 'e2', 'e3', 'gesperrt', 'kein'].map(k => `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="${FUELL(k)}" stroke="#000"/></svg>${T[KLASSE[k]]}</span>`).join('');

  // 1 Längsschnitt: Fahrrinnentiefe über dem Rheinkilometer am angezeigten Tag
  function laengsschnitt(R) {
    const svg = $('laengs'), A = abschnitte(R);
    if (!A.length) { $('laengsfig').hidden = true; return; }
    $('laengsfig').hidden = false;
    const B = 1000, H = 346, L = 62, RR = 14, O = 34, U = 78, k0 = 164, k1 = RP[RP.length - 1].bis;
    const werte = A.flatMap(a => [a.zm && a.zm.tiefe, a.zs && a.zs.tiefe, a.p.tugl]).filter(v => v != null), max = Math.max(260, ...werte) + 20;
    const x = km => L + (B - L - RR) * (km - k0) / (k1 - k0), y = v => O + (H - O - U) * (1 - v / max);
    let s = `<text class="fett" x="${L}" y="14">${T.lTitel}, ${datum(isoTag(Z.jahr, R.i1))}</text>`;
    for (let v = 0; v <= max; v += 50) s += (v ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    s += `<rect x="${x(meta.stau.von)}" y="${O}" width="${x(meta.stau.bis) - x(meta.stau.von)}" height="${H - O - U}" fill="url(#g_stau)"/><text class="fett" x="${(x(meta.stau.von) + x(meta.stau.bis)) / 2}" y="${y(max / 2)}" text-anchor="middle">${T.fStau}${DP}${T.lStau}</text>`;
    for (const st of meta.staustufen) { const o = KM.reduce((b, p) => Math.hypot(p[1] - st.lon, p[2] - st.lat) < Math.hypot(b[1] - st.lon, b[2] - st.lat) ? p : b, KM[0]);
      if (st.name !== 'Birsfelden') s += `<rect x="${x(o[0]) - 2}" y="${H - U - 16}" width="4" height="16"><title>${h(st.name)}, km ${zahl(o[0], 1)}</title></rect>`; }
    for (const [nr, { p, zm, zs }] of A.entries()) {
      const a = x(p.von), b = x(p.bis), tief = nr % 2 ? 30 : 0;      // Namen abwechselnd auf zwei Zeilen
      s += `<line class="soll" x1="${a}" x2="${b}" y1="${y(p.tugl)}" y2="${y(p.tugl)}"/><line class="achse" x1="${b}" x2="${b}" y1="${H - U}" y2="${H - U + 5}"/>`;
      if (zm) s += `<line x1="${a}" x2="${b}" y1="${y(zm.tiefe)}" y2="${y(zm.tiefe)}" stroke="#000" stroke-width="4"/><text class="fett" x="${(a + b) / 2}" y="${y(zm.tiefe) + 17}" text-anchor="middle">${zahl(zm.tiefe)}</text>`;
      if (zs && zm && Math.abs(zs.tiefe - zm.tiefe) >= .5) s += `<line x1="${a}" x2="${b}" y1="${y(zs.tiefe)}" y2="${y(zs.tiefe)}" stroke="#003399" stroke-width="4"/><text class="blau" x="${(a + b) / 2}" y="${y(zs.tiefe) - 7}" text-anchor="middle">${zahl(zs.tiefe)}</text>`;
      s += `<text x="${x(p.km)}" y="${H - U + 20 + tief}" text-anchor="middle">${h(p.name)} ${zahl(p.km, 0)}</text>`;
    }
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><text x="${x(170)}" y="${H - U + 20}" text-anchor="middle">${nm('Basel')} 170</text><text x="${x(334) - 6}" y="${H - U + 20}" text-anchor="end">Iffezheim 334</text><text x="${B - RR}" y="${H - 6}" text-anchor="end">${T.lKm}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('laengslegende').innerHTML = `<span><i></i>${T.gemessen}</span>${R.S && R.S.O ? `<span><i class="blau"></i>${T.simu.toLowerCase()}</span>` : ''}<span><i class="strich"></i>${T.lSoll}</span>`;
  }

  // 2 Jahresband: Zustand je Abschnitt und Tag, gemessen und simuliert
  function jahresband(R) {
    const svg = $('band'), Y = R.Y;
    if (!Y || !RP.length) { $('bandfig').hidden = true; return; }
    $('bandfig').hidden = false;
    const n = (Y.q[BASEL] || []).length, S = R.S, sim = S && S.O, B = 1000, L = 96, RR = 14, zh = 17, ab = 3, x = i => L + (B - L - RR) * i / n;
    const teilsGesch = false;      // der Wasserstand in Kaub ist gemessen; nur der Abfluss ist an manchen Tagen gerechnet
    const block = (titel, simuliert, oben) => {
      let s = `<text class="fett" x="${L}" y="${oben - 6}">${titel}</text>`;
      RP.forEach((p, r) => {
        const yy = oben + r * (zh + ab); let start = 0, vor = null;
        s += `<text x="${L - 8}" y="${yy + zh - 5}" text-anchor="end">${h(p.name)}${p.id === KAUB && teilsGesch ? '*' : ''}</text>`;
        for (let i = 0; i <= n; i++) {
          let kl = null;
          if (i < n) { const w = pegelstand(Y, S, p, i, simuliert), z = w && zustand(w.w, p); kl = z ? z.klasse : 'kein'; }
          if (kl !== vor) { if (vor && vor !== 'voll') s += `<rect x="${x(start).toFixed(1)}" y="${yy}" width="${(x(i) - x(start)).toFixed(1)}" height="${zh}" fill="${FUELL(vor, simuliert)}"/>`; start = i; vor = kl; }
        }
        s += `<rect x="${L}" y="${yy}" width="${B - L - RR}" height="${zh}" fill="none" stroke="#000" stroke-width=".8"/>`;
      });
      return s;
    };
    const hoehe = RP.length * (zh + ab), o1 = 24, o2 = o1 + hoehe + 34, H = (sim ? o2 + hoehe : o1 + hoehe) + 30;
    let s = block(`${T.bTitel} ${Z.jahr}, ${T.gemessen}`, false, o1) + (sim ? block(`${T.bTitel} ${Z.jahr}, ${T.simu.toLowerCase()}`, true, o2) : '');
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${H - 30}" y2="${H - 25}"/><text x="${x(i) + 4}" y="${H - 12}">${T.monate[m]}</text>`; }
    if (tagAnsicht() && R.i1 != null) s += `<line x1="${x(R.i1 + .5)}" x2="${x(R.i1 + .5)}" y1="${o1 - 4}" y2="${H - 30}" stroke="#000" stroke-width="1" stroke-dasharray="3 3"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('bandlegende').innerHTML = klLegende() + (teilsGesch ? `<span>* Kaub: ${T.geschaetzt}, ${T.ausKurve}</span>` : '');
  }

  // Kleinste Fahrrinnentiefe und Tage unter GlW in Kaub für ein Jahr, gemessen und simuliert (für Kurve und Jahresvergleich)
  const PK = RP.find(p => p.id === KAUB);
  function kaubJahr(Y, S) {
    const n = (Y.q[BASEL] || []).length; let t0 = null, t1 = null, u0 = 0, u1 = 0, tage = 0, k0 = 0, k1 = 0, a0 = 0, a1 = 0, nu = 0;
    for (let i = 0; i < n; i++) { const m = pegelstand(Y, S, PK, i, false); if (!m) continue; const s = pegelstand(Y, S, PK, i, true), a = zustand(m.w, PK), b = zustand(s.w, PK);
      tage++; if (a.fehl > 0) u0++; if (b.fehl >= 1) u1++; /* simuliert: 1 cm Toleranz für die Abweichung zwischen Messung und Abflusskurve */ t0 = t0 == null ? a.tiefe : Math.min(t0, a.tiefe); t1 = t1 == null ? b.tiefe : Math.min(t1, b.tiefe);
      if (AUSL) { if (m.w < AUSL.keine_unter) k0++; if (s.w < AUSL.keine_unter) k1++; if (a.fehl > 0) { a0 += auslastung(m.w); a1 += auslastung(s.w); nu++; } } }
    return { tage, t0, t1, u0, u1, k0, k1, a0: nu ? a0 / nu : null, a1: nu ? a1 / nu : null };   // k = Tage ohne Schifffahrt, a = mittlere Auslastung an Tagen unter GlW
  }

  // 3 Kapazitätskurve: Nutzen in Kaub, wenn alle gewählten Stauhöhen gemeinsam skaliert werden
  function kapazitaetskurve(R) {
    const svg = $('kapkurve'), Y = R.Y;
    if (!Y || !PK || !Y.q[KAUB]) { svg.innerHTML = ''; $('kaptext').textContent = ''; return; }
    const punkte = [0, 10, 25, 50, 100, 150, 200, 300, 400, 600].map(cm => { const z = cm ? szenario(Y, 0, 'glw', cm) : { k: kaubJahr(Y, OHNE), v: 0 }; return { cm, v: z.v, ...z.k }; }).filter(p => p.t1 != null);
    const stufen = [1, 2, 3].map(st => { const z = szenario(Y, st, 'glw'); return { st, v: z.genutzt, t1: z.k.t1 }; }).filter(p => p.t1 != null);
    if (punkte.length < 2) { svg.innerHTML = ''; $('kaptext').textContent = ''; return; }
    const B = 1000, H = 320, L = 62, RR = 20, O = 34, U = 46, xmax = punkte[punkte.length - 1].v, ymin = Math.floor(Math.min(...punkte.map(p => p.t1)) / 20) * 20 - 20, ymax = Math.max(PK.tugl, ...punkte.map(p => p.t1)) + 20;
    const x = v => L + (B - L - RR) * v / xmax, y = t => O + (H - O - U) * (1 - (t - ymin) / (ymax - ymin));
    let s = `<text class="fett" x="${L}" y="14">${T.kTitel} (${Z.jahr})</text>`;
    for (let t = Math.ceil(ymin / 20) * 20; t <= ymax; t += 20) s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`;
    const xs = [100, 200, 250, 500, 1000].find(q => xmax / q <= 8) || 2000;
    for (let v = 0; v <= xmax; v += xs) s += `<line class="achse" x1="${x(v)}" x2="${x(v)}" y1="${H - U}" y2="${H - U + 5}"/><text x="${x(v)}" y="${H - U + 20}" text-anchor="middle">${zahl(v)}</text>`;
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><text x="${B - RR}" y="${H - 6}" text-anchor="end">${T.kX}</text>` +
      `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(PK.tugl)}" y2="${y(PK.tugl)}"/><text class="fett" x="${B - RR - 4}" y="${y(PK.tugl) - 6}" text-anchor="end">${T.lSoll} ${zahl(PK.tugl)}</text>` +
      `<path d="M${punkte.map(p => `${x(p.v).toFixed(1)},${y(p.t1).toFixed(1)}`).join('L')}" fill="none" stroke="#000" stroke-width="2"/>` +
      punkte.map(p => `<rect x="${x(p.v) - 4}" y="${y(p.t1) - 4}" width="8" height="8" fill="#fff" stroke="#000" stroke-width="2"><title>${zahl(p.v)} ${T.mio}${DP}${zahl(p.t1)} cm</title></rect>`).join('') +
      stufen.map(p => `<rect x="${x(p.v) - 6}" y="${y(p.t1) - 6}" width="12" height="12" fill="#003399"><title>${T['st' + p.st]}${DP}${zahl(p.v)} ${T.mio}, ${zahl(p.t1)} cm</title></rect><text class="blau" x="${x(p.v) + 10}" y="${y(p.t1) + 16 + (p.st - 2) * 0}">${p.st}</text>`).join('');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    const voll = punkte.find(p => p.t1 >= PK.tugl - 1);
    $('kaptext').textContent = `${T.kText} ${voll ? `${T.kErreicht} ${zahl(voll.v)} ${T.mio}.` : T.kNie} ${T.gemessen}${DP}${zahl(punkte[0].t0)} cm.`;
    csvKnopf($('kapfig'), () => `rhein-kapazitaet-${Z.jahr}`, () => ({ titel: `${T.kTitel} (${Z.jahr})`, kopf: ['reihe', 'zusatzstau_cm', 'kapazitaet_oder_genutzt_Mio_m3', 'kleinste_fahrrinnentiefe_cm', 'tage_unter_GlW', 'tage_unter_40cm'],
      zeilen: punkte.map(p => ['kurve', p.cm, p.v, p.t1, p.u1, p.k1]).concat(stufen.map(p => [`stufe_${p.st}`, null, p.v, p.t1, null, null])) }));
  }

  // 4 Jahresvergleich: alle Jahre mit Werten für Kaub, mit den gewählten Kapazitäten
  async function jahresvergleich() {
    const el = $('jahre'), svg = $('jahregrafik');
    if (!PK) return;
    el.innerHTML = `<h2>${T.jTitel}</h2><p class="hinweis">${T.jRechnet}</p>`;
    const zeilen = [];
    for (const j of meta.jahre.filter(j => j >= 2008)) {
      const Y = await jahr(j); await nachbarn(j); if (!Y || !Y.q[KAUB]) continue;
      const k = kaubJahr(Y, OHNE); if (!k.tage) continue;
      const st = [1, 2, 3].map(s => szenario(Y, s, 'regel').k), reicht = !k.u0 ? 0 : (st.findIndex(x => x.u1 === 0) + 1) || null;
      zeilen.push({ j, ...k, bedarf: bedarfGlw(Y), st, reicht });
      await new Promise(r => setTimeout(r, 0));
    }
    el.innerHTML = `<h2>${T.jTitel}</h2><p class="hinweis">${T.jText}</p><div class="rollen"><table><thead><tr><th>${T.jJahr}</th><th class="z">${T.nTage}</th><th class="z">${T.nUnter}</th><th class="z">${T.aTage}</th><th class="z">${T.nTief}</th><th class="z">${T.jBedarf}</th><th class="z">${T.stufe} 1</th><th class="z">${T.stufe} 2</th><th class="z">${T.stufe} 3</th><th>${T.jReicht}</th></tr></thead><tbody>` +
      zeilen.map(z => `<tr><td>${z.j}</td><td class="z">${z.tage}</td><td class="z">${z.u0}</td><td class="z">${z.k0}</td><td class="z">${zahl(z.t0)}</td><td class="z">${z.u0 ? zahl(z.bedarf) : '–'}</td>` +
        z.st.map(x => `<td class="z blau">${z.u0 ? `${x.u1} · ${zahl(x.t1)}` : '–'}</td>`).join('') + `<td>${z.reicht === 0 ? T.unnoetig : z.reicht ? `${T.stufe} ${z.reicht}` : T.jNie}</td></tr>`).join('') + '</tbody></table></div>';
    const B = 1000, H = 300, L = 62, RR = 14, O = 34, U = 36, max = Math.min(420, Math.max(PK.tugl, ...zeilen.map(z => Math.max(z.t0, ...z.st.map(x => x.t1)))) + 20), bw = (B - L - RR) / zeilen.length;
    const y = v => O + (H - O - U) * (1 - Math.min(v, max) / max), FL = ['#000', 'url(#s_e1)', 'url(#s_e2)', '#003399'];
    let s = `<text class="fett" x="${L}" y="14">${T.jGrafik}</text>`;
    for (let v = 0; v <= max; v += 50) s += (v ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    zeilen.forEach((z, i) => { const x0 = L + i * bw, b = Math.min(9, bw * .19);
      [z.t0, ...z.st.map(x => x.t1)].forEach((v, k) => { s += `<rect x="${(x0 + bw / 2 + (k - 2) * (b + 1)).toFixed(1)}" y="${y(v)}" width="${b}" height="${y(0) - y(v)}" fill="${FL[k]}"${k ? ' stroke="#003399" stroke-width="1"' : ''}><title>${z.j} ${k ? `${T.stufe} ${k}` : T.gemessen}${DP}${zahl(v)} cm</title></rect>`; });
      s += `<text x="${x0 + bw / 2}" y="${H - U + 18}" text-anchor="middle">${String(z.j).slice(2)}</text>`; });
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/><line class="soll" x1="${L}" x2="${B - RR}" y1="${y(PK.tugl)}" y2="${y(PK.tugl)}"/><text class="fett" x="${B - RR - 4}" y="${y(PK.tugl) - 6}" text-anchor="end">${T.lSoll} ${zahl(PK.tugl)}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    csvKnopf($('jahrefig'), () => 'rhein-kaub-jahre', () => ({ titel: T.jTitel, kopf: ['jahr', 'tage_mit_wert', 'tage_unter_GlW', 'tage_unter_40cm', 'kleinste_fahrrinnentiefe_cm', 'bedarf_bis_GlW_Mio_m3', ...[1, 2, 3].flatMap(k => [`stufe${k}_tage_unter_GlW`, `stufe${k}_tage_unter_40cm`, `stufe${k}_kleinste_fahrrinnentiefe_cm`]), 'GlW_an_allen_Tagen_ab_stufe'],
      zeilen: zeilen.map(z => [z.j, z.tage, z.u0, z.k0, z.t0, z.bedarf, ...z.st.flatMap(x => [x.u1, x.k1, x.t1]), z.reicht == null ? 'keine' : z.reicht]) }));
  }

  // ------------------------------------------------------------ Karte
  const map = L.map('karte', { zoomSnap: .25, scrollWheelZoom: false, dragging: !L.Browser.mobile });
  map.createPane('osm').style.zIndex = 190; map.getPane('osm').classList.add('grundkarte');
  map.createPane('ch').style.zIndex = 195; map.getPane('ch').classList.add('grundkarte');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { pane: 'osm', maxZoom: 13,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg', { pane: 'ch', maxZoom: 13,
    bounds: [[45.75, 5.9], [47.85, 10.55]], attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a> · BAFU · WSV/BfG · HydroRIVERS' }).addTo(map);
  map.on('click', () => map.scrollWheelZoom.enable());
  const ebene = L.layerGroup().addTo(map);
  const RAHMEN = { [BASEL]: [[46.6, 7.0], [47.8, 9.8]], [KAUB]: [[46.6, 6.9], [50.2, 9.9]] };
  let rahmenFuer = null;
  const MIT_NAME = { '2473': 'r', '2288': 'r', '2135': 'r', '2289': 'l', '23700200': 'l', '23800690': 'r', '23900200': 'l', '24700404': 'r', '25100100': 'l', '25700100': 'l', '2044': 'r', '2029': 'l' };
  function karteZeichnen(R) {
    if (rahmenFuer == null) { map.fitBounds(RAHMEN1[0]); rahmenFuer = Z.ziel; }
    ebene.clearLayers();
    const a = R.zeige, e = einzug(Z.ziel), px = a ? 14 / a.ziel_mittel : 0, ll = p => [p[1], p[0]];
    const fluss = id => a && id in e && id !== Z.ziel ? abfluss(a, id) : null;
    const geaendert = id => Z.sim && R.wirk && R.wirk[id] && Math.abs(R.wirk[id]) > .05;
    // Im Kurznetz stehen die Strecken Basel–Maxau–Worms–Mainz–Kaub für die eine Kante Basel–Kaub
    const strecke = k => NETZ === KURZ && k.von === BASEL ? ['2289>23700200', '23700200>23900200', '23900200>25100100', '25100100>25700100'].flatMap(s => karte.strecken[s].p) : (karte.strecken[`${k.von}>${k.nach}`] || {}).p;
    const kanten = NETZ.filter(k => !(ST[k.nach].quelle === 'WSV' && ST[k.von].gewaesser === 'Rhein')).sort((x, y) => (fluss(y.von) || 0) - (fluss(x.von) || 0));
    fahrbarkeitKarte(R);
    for (const k of kanten) {                    // grauer Rand: Zuwachs aus dem Zwischengebiet bis zur nächsten Messstelle
      const p = strecke(k), q = fluss(k.von), r = a && a.mittel['R:' + k.nach];
      if (p && q > 0 && r > 0 && !k.zufluss) L.polyline(p.map(ll), { color: '#a8a8a8', weight: Math.max(2, (q + r) * px), lineCap: 'butt', interactive: false }).addTo(ebene);
    }
    for (const k of kanten) {
      const p = strecke(k); if (!p) continue;
      const q = fluss(k.von), o = ST[k.von];
      if (q == null || q <= 0) L.polyline(p.map(ll), { color: '#a8a8a8', weight: 1.5, dashArray: '4 5', interactive: false }).addTo(ebene);
      else L.polyline(p.map(ll), { color: geaendert(k.von) ? '#003399' : '#000', weight: Math.max(1.5, q * px), lineCap: 'butt', lineJoin: 'round' }).addTo(ebene)
        .bindTooltip(`${GW(o)} ${FR ? 'dès' : 'ab'} ${kurz(o)}: ${qz(q)} m³/s`, { sticky: true });
    }
    for (const s of meta.seen) {
      if (!s.lat) continue;
      L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: `<div class="wehr${s.reguliert ? '' : ' frei'}"></div>`, iconSize: [16, 14], iconAnchor: [8, 7] }), title: s.name, alt: s.name })
        .addTo(ebene).bindPopup(() => seePopup(s, R));
    }
    for (const s of meta.stationen) {
      if (!s.lat) continue;
      L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: `<div class="pkt${s.id === Z.ziel ? ' ziel' : ''}"></div>`, iconSize: [11, 11], iconAnchor: [5.5, 5.5] }), title: `${GW(s)}–${s.name}`, alt: `${GW(s)}–${s.name}`, zIndexOffset: 500 })
        .addTo(ebene).bindPopup(() => stationPopup(s, R));
      const seite = MIT_NAME[s.id];
      if (seite) L.marker([s.lat, s.lon], { interactive: false, icon: L.divIcon({ className: 'ort', html: `<span style="position:absolute;${seite === 'l' ? 'right' : 'left'}:10px;top:-5px">${h(nm(kurz(s)))}</span>`, iconSize: [0, 0] }) }).addTo(ebene);
    }
    $('kartenlegende').textContent = T.legende;
  }
  const zeile = (k, w) => `<span class="k">${k}</span><span class="w">${w}</span>`;
  function stationPopup(s, R) {
    const a = R.zeige, q = a && s.id in einzug(Z.ziel) ? abfluss(a, s.id) : null, m = R.a && Z.sim && R.sim ? abfluss(R.a, s.id) : null, r = a && a.mittel['R:' + s.id];
    let html = `<h3>${h(GW(s))}–${h(s.name)}</h3><div class="raster2">` + zeile(T.nr, s.id) +
      zeile(T.abfluss, q == null ? '–' : `${qz(q)} m³/s` + (m != null && Math.abs(q - m) > .05 ? ` (${T.gemessen} ${qz(m)})` : ''));
    for (const z of meta.ziele) {
      const b = R.je && R.je[z];
      if (b && s.id in einzug(z)) { const x = abfluss(b, s.id); if (x != null) html += zeile(`${T.anteilAn} ${kurz(ST[z])}`, `${zahl(100 * x / b.ziel_mittel, 1)} %`); }
    }
    if (r != null && oben(s.id).length) html += zeile(T.restK, `${qz(r)} m³/s`);
    if (R.Y && R.i1 != null) { const c = statusAm(R.Y, s.id, R.i1); if (c != null) html += zeile(T.status, h(statusName(c))); }
    return html + zeile(T.quelle, s.quelle === 'BAFU' ? 'BAFU' : 'WSV / BfG') + zeile(T.datum, h(R.datumText)) +
      zeile(`${T.mqK} ${s.periode.join('–')}`, `${zahl(s.mq)} m³/s`) + zeile(T.nm7qMin, s.nm7q_min == null ? '–' : `${qz(s.nm7q_min)} m³/s (${datum(s.nm7q_min_beginn)})`) + '</div>';
  }
  function seePopup(s, R) {
    let html = `<h3>${h(nm(s.name))}</h3><div class="raster2">` + zeile(T.flaeche, `${zahl(s.flaeche_km2, 1)} km²`) + zeile(T.regulierung, s.reguliert ? T.reguliert : T.unreguliert);
    if (s.grenzen) html += zeile(T.grenzen, `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} m`);
    const w = R.Y && R.Y.w[s.id];
    if (w && R.i1 != null && w[R.i1] != null) {
      html += zeile(`${T.stand} ${datum(isoTag(Z.jahr, R.i1))}`, `${zahl(w[R.i1], 2)} m`);
      if (R.i1 > 0 && w[R.i1 - 1] != null) html += zeile(T.speicher, `${vz(s.flaeche_km2 * 1e6 * (w[R.i1] - w[R.i1 - 1]) / 86400, 1)} m³/s`);
    }
    return html + '</div>' + `<p>${s.reguliert ? h(FR ? s.bemerkung.replace('Regulierbehörde', 'Autorité de régulation').replace(/seit/g, 'depuis') : s.bemerkung) : T.keinWehr}</p>`;
  }

  // ------------------------------------------------------------ Herkunft (Gruppen mit Schraffur) und Bilanz
  const GRUPPEN = [['gAlpen', 'm0', ['Q:2473', 'R:2288']], ['gHoch', 'm5', ['Q:2044', 'R:2143', 'R:2091', 'R:2289']], ['gAareOben', 'm1', ['Q:2135', 'R:2029']],
    ['gAareMitte', 'm3', ['R:2016', 'R:2205']], ['gReuss', 'm2', ['Q:2018']], ['gLimmat', 'm4', ['Q:2243']],
    ['gUnten', 'm6', ['R:23700200', 'Q:23800690', 'R:23900200', 'Q:24700404', 'R:25100100', 'R:25700100']]];
  function herkunftZeichnen(R) {
    const a = R.zeige, el = $('herkunft'); if (!a) { el.innerHTML = ''; return; }
    const g = GRUPPEN.map(([n, m, ks]) => ({ n: T[n], m, v: ks.reduce((s, k) => s + (a.mittel[k] || 0), 0), da: ks.some(k => k in a.mittel) })).filter(x => x.da);
    const aare = abfluss(a, '2205'), rhein = abfluss(a, '2143');
    el.innerHTML = `<h2>${T.herkunft}${DP}${h(kurz(ST[Z.ziel]))}, ${h(R.datumText)}</h2>` +
      `<div class="band" role="img" aria-label="${T.herkunft}">${g.map(x => `<i class="${x.m}" style="flex:${Math.max(0, x.v).toFixed(1)} 0 0" title="${h(x.n)}: ${zahl(100 * x.v / a.ziel_mittel, 1)} %"></i>`).join('')}</div>` +
      `<div class="herk">${g.map(x => `<i class="${x.m}"></i><span>${h(x.n)}</span><b>${qz(x.v)} m³/s</b><b>${zahl(100 * x.v / a.ziel_mittel, 1)} %</b>`).join('')}</div>` +
      (aare != null && rhein != null ? `<p class="hinweis">${T.aareGesamt}${DP}<b>${qz(aare)} m³/s (${zahl(100 * aare / a.ziel_mittel, 1)} %)</b>. ${T.rheinOben}${DP}<b>${qz(rhein)} m³/s (${zahl(100 * rhein / a.ziel_mittel, 1)} %)</b>.</p>` : '');
  }
  function gliedName(k, a) {
    const id = k.slice(2), s = ST[id];
    if (k[0] === 'Q') return `${GW(s)}–${kurz(s)}`;
    if (id === meta.kontrolle.ziel) return T.kontrolle;
    if (NETZ === KURZ && id === KAUB) return `${T.zwischen} ${nm('Basel')} → Kaub (${T.ohneReihen})`;
    const fehlt = oben(id).filter(c => c.zufluss && !oben(c.von).length && !('Q:' + c.von in a.mittel)).map(c => GW(ST[c.von]));
    return `${T.zwischen} ${oben(id).filter(c => !fehlt.includes(GW(ST[c.von]))).map(c => kurz(ST[c.von])).join(' + ')} → ${kurz(s)}` +
      (fehlt.length ? ` (${T.inkl} ${fehlt.join(', ')}, ${T.ohneReihe})` : '');
  }
  function bilanzZeichnen(R) {
    const z = ST[Z.ziel], a = R.zeige, el = $('bilanz');
    if (!a) { el.innerHTML = `<h2>${h(GW(z))}–${h(z.name)}</h2><p>${T.keine}</p><p class="hinweis">${h(R.text)}</p>`; return; }
    const reihen = meta.stationen.flatMap(s => ['Q:' + s.id, 'R:' + s.id]).filter(k => k in a.mittel);
    const max = Math.max(...reihen.map(k => Math.abs(a.mittel[k]))), simuliert = Z.sim && tagAnsicht() && R.sim;
    el.innerHTML = `<div class="kopfzeile"><h2>${T.glied}${DP}${h(GW(z))}–${h(z.name)}</h2><button class="textknopf" type="button" id="csv">CSV</button></div>` +
      `<p class="hinweis" style="margin-top:0">${h(R.text)}${tagAnsicht() && R.i0 === R.i1 ? '' : ` ${zahl(a.tage_gueltig)} ${T.von_} ${zahl(a.tage)} ${T.tage}.`}${R.status ? ` ${T.status}${DP}${h(R.status)}.` : ''}</p>` +
      `<div class="rollen"><table><thead><tr><th>${T.glied}</th><th class="z">m³/s</th><th class="z">${T.anteil}</th><th></th></tr></thead><tbody>` +
      reihen.map(k => {
        const v = a.mittel[k], kl = v < 0 ? 'b minus' : k[0] === 'R' ? 'b rest' : 'b';
        return `<tr><td>${h(gliedName(k, a))}</td><td class="z">${qz(v)}</td><td class="z">${zahl(a.prozent[k], 1)} %</td>` +
          `<td class="balken"><span class="${kl}" style="width:${(100 * Math.abs(v) / max).toFixed(1)}%"></span></td></tr>`;
      }).join('') +
      `<tr class="summe"><td>${h(GW(z))}–${h(kurz(z))} (${simuliert ? T.simu.toLowerCase() : GERECHNET(statusAm(R.Y || { s: {} }, Z.ziel, R.i1)) ? T.geschaetzt : T.gemessen})</td><td class="z">${zahl(a.ziel_mittel)}</td><td class="z">${zahl(100, 1)} %</td><td></td></tr></tbody></table></div>` +
      `<p class="zeichen"><span><i class="b"></i>${T.gemessen}</span><span><i class="b rest"></i>${T.rest}</span><span><i class="b minus"></i>${T.negativ}</span></p>`;
    $('csv').addEventListener('click', () => {
      const zeilen = [[`# ${GW(z)}–${z.name}; ${R.datumText}; ${simuliert ? T.simu : T.gem}`], ['# Quellen: BAFU, Hydrologische Beobachtungen (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG (DGJ, PEGELONLINE)'],
        [T.glied, 'm3/s', '%'], ...reihen.map(k => [gliedName(k, a), a.mittel[k].toFixed(1), a.prozent[k].toFixed(2)]), [`${GW(z)}–${z.name}`, a.ziel_mittel.toFixed(1), '100.00']];
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob(['﻿' + zeilen.map(r => r.map(c => /[;"\n]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c).join(';')).join('\n')], { type: 'text/csv' }));
      l.download = `rhein-bilanz-${kurz(z).toLowerCase()}-${R.datumText.replace(/[^0-9]+/g, '-')}.csv`; l.click(); URL.revokeObjectURL(l.href);
    });
  }
  function seenZeichnen(R) {
    const el = $('seen');
    if (!tagAnsicht() || !R.Y) { el.innerHTML = ''; return; }
    const zeilen = meta.seen.map(s => {
      const w = R.Y.w[s.id]; if (!w) return '';
      const a = R.i0 > 0 ? w[R.i0 - 1] : null, b = w[R.i1];
      const ds = a == null || b == null ? null : s.flaeche_km2 * 1e6 * (b - a) / ((R.i1 - R.i0 + 1) * 86400);
      return `<tr><td>${h(nm(s.name))}</td><td class="z">${b == null ? '–' : zahl(b, 2)}</td><td class="z">${ds == null ? '–' : vz((b - a) * 100, 1) + ' cm'}</td><td class="z">${ds == null ? '–' : vz(ds, 1)}</td><td class="z">${s.grenzen && b != null ? zahl((s.grenzen.hoch - b) * 100) + ' cm' : '–'}</td></tr>`;
    }).join('');
    el.innerHTML = `<h2>${T.seen}, ${h(R.datumText)}</h2><div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.stand} m</th><th class="z">${T.aenderung}</th><th class="z">${T.speicher} m³/s</th><th class="z">${T.spielraum}</th></tr></thead><tbody>${zeilen}</tbody></table></div><p class="hinweis">${T.fuellt}</p>`;
  }

  // ------------------------------------------------------------ Optimaler Rückhalt: Kapazitäten, Kennwerte, Verlauf
  const MUSTER = { gBodensee: 'm0', gAareO: 'm1', gAareJ: 'm3', gReussL: 'm2', gLimmatL: 'm5' };
  function simWahl(R) {
    const w = $('simwahl'); w.textContent = '';
    const sj = $('simjahr'); sj.textContent = '';
    const jw = feld(T.simJahr, `<select>${meta.jahre.filter(j => j >= 2008).reverse().map(x => `<option${x === Z.jahr ? ' selected' : ''}>${x}</option>`).join('')}</select>`);
    jw.querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; Z.tag = null; Z.ansicht = Z.jahr === LETZTES ? 'heute' : 'tag'; alles(); });
    sj.append(jw, knoepfe(T.stufe, [['1', T.st1], ['2', T.st2], ['3', T.st3], ['frei', T.stFrei]], Z.stufe, v => { Z.stufe = v; if (v === 'frei') UEBER = 0; alles(); }));
    if (Z.stufe !== '1') { const zu = feld(T.zusatzU, `<input type="number" min="0" max="200" step="5" value="${Z.stufe === 'frei' ? UEBER : Z.zusatz}">`);
      zu.querySelector('input').addEventListener('change', e => { const v = Math.max(0, Math.min(200, +e.target.value || 0)); if (Z.stufe === 'frei') UEBER = v; else Z.zusatz = v; alles(); }); sj.append(zu); }
    $('stufentext').textContent = `${T.stText[Z.stufe]} ${T.rText[Z.modus]}`;
    const alle = feld(T.alle, `<input type="number" min="0" max="100" value="">`);
    alle.querySelector('input').addEventListener('change', e => { const v = Math.max(0, Math.min(100, +e.target.value || 0)); meta.seen.forEach(s => { if (s.reguliert) CM[s.id] = v; }); Z.stufe = 'frei'; alles(); });
    const orte = [...new Set([R && R.S && R.S.zid || Z.ziel, KAUB, BASEL, '2288', '2135', '2029', '2018', '2243', '2205'])];
    const ort = feld(T.verlaufFuer, `<select>${orte.map(id => `<option value="${id}"${id === Z.verlauf ? ' selected' : ''}>${h(GW(ST[id]))}–${h(kurz(ST[id]))}</option>`).join('')}</select>`);
    ort.querySelector('select').addEventListener('change', e => { Z.verlauf = e.target.value; alles(); });
    const regelFelder = [];
    if (Z.modus === 'regel') {
      const s = feld(T.rStau, `<input type="number" min="800" max="3000" step="50" value="${REGEL.stauAb}">`), d = feld(T.rTage, `<input type="number" min="5" max="120" value="${REGEL.tage}">`);
      s.querySelector('input').addEventListener('change', e => { REGEL.stauAb = Math.max(800, Math.min(3000, +e.target.value || 1000)); alles(); });
      d.querySelector('input').addEventListener('change', e => { REGEL.tage = Math.max(5, Math.min(120, +e.target.value || 30)); alles(); });
      regelFelder.push(s, d);
    }
    w.append(knoepfe(T.zielAbgabe, [['glw', T.zGlw], ['regel', T.zRegel], ['min', T.zMin]], Z.modus, v => { Z.modus = v; alles(); }), ...regelFelder, ...(Z.stufe === 'frei' ? [alle] : []), ort, knoepfe(T.ausschnitt, [['0', T.ganz], ['1', T.phase]], Z.zoom ? '1' : '0', v => { Z.zoom = v === '1'; alles(); }));
  }
  function simSeen() {
    $('simseen').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.flaeche} km²</th><th class="z">${T.jecm} Mio. m³</th><th class="z">${T.band}</th><th class="z">${T.grenzenK}</th><th style="width:22%">${T.zusatz}</th><th class="z">cm</th><th class="z">${T.vol} Mio. m³</th></tr></thead><tbody>` +
      SEEGRUPPEN.map(([g, ids]) => `<tr class="gruppenkopf"><td colspan="8">${T[g]}</td></tr>` + ids.map(id => { const s = SEE[id]; return `<tr><td>${h(nm(s.name))}</td><td class="z">${zahl(s.flaeche_km2, 1)}</td><td class="z">${zahl(s.flaeche_km2 / 100, 2)}</td>` +
        `<td class="z">${s.band ? `${zahl(s.band.band_m, 2)} m · ${zahl(s.band.volumen_mio_m3)}` : '–'}</td>` +
        `<td class="z" title="${s.grenzen ? h(s.grenzen.art) : ''}">${s.grenzen ? `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} · ${zahl(s.grenzen.volumen_mio_m3)}` : '–'}</td>` +
        `<td><input type="range" min="0" max="250" step="1" value="${CM[id]}" data-see="${id}" aria-label="${h(s.name)}: ${T.zusatz} cm"></td>` +
        `<td class="z" id="cm-${id}"></td><td class="z" id="vol-${id}"></td></tr>`; }).join('')).join('') +
      `<tr class="summe"><td colspan="7">${T.volumen}</td><td class="z" id="vol-summe"></td></tr></tbody></table></div>`;
    $('simseen').querySelectorAll('input').forEach(i => { i.addEventListener('input', () => { Z.stufe = 'frei'; CM[i.dataset.see] = +i.value; alles(true); }); i.addEventListener('change', () => alles()); });
  }
  const tageUnter = (q, grenze) => grenze == null || !q ? null : q.reduce((n, x) => n + (x != null && x < grenze ? 1 : 0), 0);
  function simZeichnen(R) {
    let v = 0;
    for (const s of meta.seen) { const m = CM[s.id] * s.flaeche_km2 / 100; v += m; $('cm-' + s.id).textContent = CM[s.id]; const r = $('simseen').querySelector(`input[data-see="${s.id}"]`); if (r && +r.value !== CM[s.id]) r.value = CM[s.id]; $('vol-' + s.id).textContent = zahl(m, 1); }
    $('vol-summe').textContent = zahl(v, 1);
    const S = R.S, z = ST[S && S.zid || Z.ziel], q = R.Y && R.Y.q[z.id];
    if (!q || !S || !S.O) { $('simwerte').innerHTML = `<p>${q ? T.nurTag : T.keinJahr}</p>`; $('verlauf').innerHTML = ''; $('speicher').innerHTML = ''; $('abgabe').innerHTML = ''; $('abgabelegende').innerHTML = ''; $('nutzen').innerHTML = ''; $('seetafel').innerHTML = ''; $('seewahl').textContent = ''; $('seegrafik').innerHTML = ''; $('seelegende').innerHTML = ''; $('seetext').textContent = ''; $('simlegende').innerHTML = ''; R.sz = null; return; }
    const O = S.O, qs = S.q[z.id], a = nm7q(q), b = nm7q(qs), min0 = Math.min(...q.filter(x => x != null)), min1 = Math.min(...qs.filter(x => x != null));
    const qK = R.Y.q[KAUB], qKs = S.q[KAUB], tA = O.abgabe.reduce((n, x) => n + (x > 0), 0), tR = O.rueck.reduce((n, x) => n + (x > 0), 0), genutzt = Math.max(...O.speicher) / 1e6;
    const gesch = (R.Y.s[z.id] || []).some(([, c]) => GERECHNET(c)) ? q.reduce((n, x, i) => n + (x != null && GERECHNET(statusAm(R.Y, z.id, i))), 0) : 0;
    const kachel = (titel, gross, zusatz = '') => `<div><span>${titel}</span><b>${gross}</b><em>${zusatz}</em></div>`;
    const entlTage = O.entl.reduce((n, x) => n + (x > 0), 0), entlVol = O.entl.reduce((s, x) => s + x, 0) * SEK / 1e6;
    const kMin0 = qK ? Math.min(...qK.filter(x => x != null)) : null, kMin1 = qKs ? Math.min(...qKs.filter(x => x != null)) : null, w0 = wAusQ(kMin0), w1 = wAusQ(kMin1);
    const u0 = tageUnter(qK, Q_GLW), u1 = tageUnter(qKs, Q_GLW);
    R.sz = { min0, min1, tA, tR, genutzt, u0, u1, w0, w1, kMin0, kMin1 };
    const flaeche = meta.seen.filter(s => s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0);
    const hub = tA ? O.abgabe.reduce((s, x) => s + x, 0) / tA : 0, cmJe = Q_GLW != null ? (wAusQ(Q_GLW) - wAusQ(Q_GLW - 100)) / 100 : null;
    const kjU = PK ? kaubJahr(R.Y, S) : null;
    const kopf = O.glw ? (kjU ? kachel(`${T.glwImmer} ${Z.jahr}`, !kjU.u0 ? T.unnoetig : kjU.u1 === 0 ? T.ja : T.nein, kjU.u0 ? `${T.eRest}${DP}${kjU.u1} ${T.von_} ${kjU.u0}` : '') : '') + kachel(`${T.gehoben} ${Z.jahr}`, `${tA} ${T.tageW}`, tA ? `${T.imMittel} ${vz(hub, 0)} m³/s${cmJe != null ? ` · ${T.rund} ${vz(hub * cmJe, 0)} cm` : ''}` : '') +
      kachel(T.unterGlw, kjU ? `${zahl(kjU.u0)} → ${zahl(kjU.u1)}` : `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) +
      kachel(T.bedarf, `${zahl(O.bedarf / 1e6)} ${T.mio}`, `${T.bedarfText} ${zahl(O.bedarf / 1e4 / flaeche)} cm`) : '';
    $('simwerte').innerHTML = kopf + kachel(`${T.minTag} ${kurz(z)} ${Z.jahr}`, `${zahl(min0)} → ${zahl(min1)} m³/s`, `${vz(min1 - min0, 1)} m³/s · ${vz(100 * (min1 - min0) / min0, 1)} %`) +
      (a && b ? kachel(`${T.nm7qSim} ${kurz(z)}`, `${zahl(a.wert)} → ${zahl(b.wert)} m³/s`, `${vz(b.wert - a.wert, 1)} m³/s`) : '') +
      (w0 != null && w1 != null ? kachel(T.pegelMin, `${zahl(w0)} → ${zahl(w1)} cm`, `${vz(w1 - w0, 0)} cm · ${T.ausKurve}`) : '') +
      (u0 != null && !O.glw ? kachel(T.unterGlw, `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) : '') +
      (O.regel ? kachel(T.schwellen, `GlW ${zahl(O.tief)} · ${zahl(O.hoch)}`, `m³/s: ${FR ? 'restituer sous / retenir dès' : 'abgeben unter / stauen ab'}`) : kachel(T.schwellen, `L* ${zahl(O.tief)} · H* ${zahl(O.hoch)}`, `m³/s${O.winter ? ` · ${T.bisMaerz}${DP}L* ${zahl(O.winter.tief)} · H* ${zahl(O.winter.hoch)}` : ''}`)) +
      kachel(`${T.abgabeTage} · ${T.rueckTage}`, `${tA} · ${tR} ${T.tageW}`, `${T.genutzt}${DP}${zahl(genutzt, 1)} ${T.von_} ${zahl(v, 1)} ${T.mio}`) +
      (PK && AUSL ? (() => { const kj = kaubJahr(R.Y, S); return kachel(T.aTage, `${zahl(kj.k0)} → ${zahl(kj.k1)}`, T.aHinweis) + (kj.a0 != null ? kachel(T.aFlotte, `${zahl(kj.a0)} → ${zahl(kj.a1)} %`, `${T.aUnter} · ${T.aHinweis}`) : ''); })() : '') +
      (entlTage ? kachel(T.entlTitel, `${entlTage} ${T.tageW}`, `${zahl(entlVol, 1)} ${T.mio}`) : '') +
      (O.glw && PK ? (() => { const alt = Z.modus, andere = alt === 'regel' ? 'glw' : 'regel'; Z.modus = andere; const netz = NETZ; NETZ = VOLL; const S2 = simulieren(R.Y); NETZ = netz; Z.modus = alt;
        const a1 = kaubJahr(R.Y, S), a2 = kaubJahr(R.Y, S2), vor = alt === 'regel' ? a2 : a1, ohne = alt === 'regel' ? a1 : a2;
        return kachel(T.vergleich, `${zahl(vor.t0)} → ${zahl(vor.t1)} · ${zahl(ohne.t1)} cm`, `${T.gemessen} → ${T.mitVor} · ${T.ohneVor}`); })() : '') +
      (!O.glw && min1 - min0 < .05 ? `<div><em>${T.keinGewinn}</em></div>` : '') + (O.glw && !u0 ? `<div><em>${T.nieUnter}</em></div>` : '') + (Z.modus === 'glw' && !O.glw ? `<div><em>${T.ohneKaub}</em></div>` : '') + (gesch ? `<div><em>${FR ? 'Sur' : 'An'} ${gesch} ${T.geschHinweis}</em></div>` : '');
    const vs = ST[Z.verlauf && R.Y.q[Z.verlauf] ? Z.verlauf : z.id];
    const [i0, i1] = verlauf(R, R.Y.q[vs.id], S.q[vs.id], O, vs, vs.id === z.id);
    abgabeGrafik(R, i0, i1); nutzenTafel(R); kapazitaetskurve(R); seeTafel(R); seeGrafik(R);
  }
  function verlauf(R, q, qs, O, z, linien) {
    const B = 1000, H = 400, L = 62, RR = 14, OO = 22, U = 40, n = q.length, svg = $('verlauf');
    let i0 = 0, i1 = n - 1;
    if (Z.zoom) { let a = n, b = -1; O.abgabe.forEach((x, i) => { if (x > 0) { a = Math.min(a, i); b = Math.max(b, i); } }); if (b >= 0) { i0 = Math.max(0, a - 20); i1 = Math.min(n - 1, b + 20); } }
    const sicht = [...q.slice(i0, i1 + 1), ...qs.slice(i0, i1 + 1)].filter(v => v != null);
    const max = Math.max(...sicht), min = Z.zoom ? Math.min(...sicht) : 0;
    const schritt = [10, 20, 50, 100, 200, 250, 500, 1000, 2000].find(s => (max - min) / s <= 6) || 5000;
    const u = Math.floor(min / schritt) * schritt, o = Math.max(u + schritt, Math.ceil(max / schritt) * schritt);
    const x = i => L + (B - L - RR) * (i - i0) / Math.max(1, i1 - i0), y = v => OO + (H - OO - U) * (1 - (v - u) / (o - u));
    const linie = (a, nur) => { let d = '', an = false; a.forEach((v, i) => { if (v == null || i < i0 || i > i1 || (nur && !nur(i))) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    const gesch = i => GERECHNET(statusAm(R.Y, z.id, i)), hatGesch = q.some((v, i) => v != null && gesch(i));
    let s = '';
    for (let v = u; v <= o; v += schritt) s += (v > u ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    s += `<text x="${L}" y="${OO - 9}" class="fett">m³/s</text><line class="achse" x1="${L}" x2="${B - RR}" y1="${y(u)}" y2="${y(u)}"/>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); if (i < i0 || i > i1) continue; s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${y(u)}" y2="${y(u) + 5}"/><text x="${x(i) + 4}" y="${y(u) + 18}">${T.monate[m]}</text>`; }
    if (linien) for (const [name, v] of O.regel ? [['GlW', O.tief], [FR ? 'H retenue' : 'H Stau', O.hoch]] : [['L*', O.tief], [O.glw && Math.abs(O.hoch - O.deckel) <= 15 ? 'H* = GlW' : 'H*', O.hoch], ...(O.glw && O.deckel - O.tief > 15 && Math.abs(O.hoch - O.deckel) > 15 ? [['GlW', O.deckel]] : [])]) if (v >= u && v <= o) s += `<line class="schwelle" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text class="fett" x="${B - RR - 4}" y="${name[0] === 'H' ? y(v) - 5 : y(v) + 15}" text-anchor="end">${name} ${zahl(v)}</text>`;
    if (R.i1 != null && tagAnsicht() && R.i1 >= i0 && R.i1 <= i1) s += `<line class="tag" x1="${x(R.i1)}" x2="${x(R.i1)}" y1="${OO}" y2="${y(u)}"/>`;
    s += `<path class="gemessen" d="${linie(q, i => !gesch(i))}"/>` + (hatGesch ? `<path class="geschaetzt" d="${linie(q, gesch)}"/>` : '') + `<path class="simuliert" d="${linie(qs)}"/>` +
      `<line class="lot" id="lot" y1="${OO}" y2="${y(u)}" visibility="hidden"/><rect id="flaeche" x="${L}" y="${OO}" width="${B - L - RR}" height="${H - OO - U}" fill="transparent"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s; svg.setAttribute('aria-label', `${GW(z)}–${z.name} ${Z.jahr}`);
    $('simlegende').innerHTML = `<span><i></i>${h(GW(z))}–${h(kurz(z))} ${Z.jahr}, ${T.gemessen}</span>` + (hatGesch ? `<span><i class="punkte"></i>${T.geschaetzt}</span>` : '') +
      `<span><i class="blau"></i>${T.simu.toLowerCase()}</span>` + (linien ? `<span><i class="strich"></i>L*, H*${O.glw ? ', GlW' : ''}</span>` : '');
    // Speicherinhalt: eigene kleine Grafik mit eigener Achse, schraffierte Fläche
    const sp = $('speicher'), SH = 150, vmax = Math.max(1, ...O.speicher) / 1e6, ys = v => 20 + (SH - 46) * (1 - v / vmax);
    let d = `M${x(i0)},${ys(0)}`; for (let i = i0; i <= i1; i++) d += `L${x(i).toFixed(1)},${ys(O.speicher[i] / 1e6).toFixed(1)}`; d += `L${x(i1)},${ys(0)}Z`;
    sp.setAttribute('viewBox', `0 0 ${B} ${SH}`);
    sp.innerHTML = `<defs><pattern id="schraff" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="1.5"/></pattern></defs>` +
      `<text x="${L}" y="12" class="fett">${T.inhalt}</text><text x="${L - 8}" y="${ys(vmax) + 4}" text-anchor="end">${zahl(vmax, 0)}</text><text x="${L - 8}" y="${ys(0) + 4}" text-anchor="end">0</text>` +
      `<path class="inhalt" d="${d}" fill="url(#schraff)"/><line class="achse" x1="${L}" x2="${B - RR}" y1="${ys(0)}" y2="${ys(0)}"/>`;
    const tip = $('tip'), lot = $('lot');
    const zeige = ev => {
      const r = svg.getBoundingClientRect(), i = Math.max(i0, Math.min(i1, i0 + Math.round(((ev.clientX - r.left) / r.width * B - L) / (B - L - RR) * (i1 - i0))));
      lot.setAttribute('x1', x(i)); lot.setAttribute('x2', x(i)); lot.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${datum(isoTag(Z.jahr, i))}</b><br>${gesch(i) ? T.geschaetzt : T.gemessen}: <b>${zahl(q[i])} m³/s</b>` +
        (q[i] != null ? `<br>${T.simu.toLowerCase()}: <b>${zahl(qs[i])} m³/s</b><br>${T.diff}${DP}<b>${vz(qs[i] - q[i], 1)} m³/s</b><br>${T.inhalt.split(',')[0]}: <b>${zahl(O.speicher[i] / 1e6, 1)} Mio. m³</b>` : '');
      const lx = x(i) / B * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, lx > r.width / 2 ? lx - tip.offsetWidth - 10 : lx + 10)) + 'px';
    };
    $('flaeche').addEventListener('pointermove', zeige); $('flaeche').addEventListener('pointerdown', zeige);
    $('flaeche').addEventListener('pointerleave', () => { tip.hidden = true; lot.setAttribute('visibility', 'hidden'); });
    return [i0, i1];
  }
  // Zweite Grafik: Abgabe und Rückhalt je Tag an den Seen, gestapelt nach Seegruppe (Muster), gleiche Zeitachse wie der Verlauf
  function abgabeGrafik(R, i0, i1) {
    const S = R.S, B = 1000, H = 210, L = 62, RR = 14, svg = $('abgabe'), teile = S.teile.filter(x => x.teil > 0);
    let auf = 0, ab = 0; for (let i = i0; i <= i1; i++) { auf = Math.max(auf, S.aktion[i]); ab = Math.min(ab, S.aktion[i]); }
    if (!auf && !ab) { svg.innerHTML = ''; $('abgabelegende').innerHTML = ''; return; }
    const o = 26, u = H - 12, spanne = (auf - ab) || 1, y = v => o + (u - o) * (auf - v) / spanne, x = i => L + (B - L - RR) * (i - i0) / Math.max(1, i1 - i0), bw = Math.max(1, (B - L - RR) / Math.max(1, i1 - i0));
    const stil = { m0: '#000', m1: 'url(#p1)', m2: 'url(#p2)', m3: 'url(#p3)', m5: 'url(#p5)' };
    let s = `<defs><pattern id="p1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="2"/></pattern>` +
      `<pattern id="p2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="3.2"/></pattern>` +
      `<pattern id="p3" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><line x1="0" y1="1" x2="4" y2="1" stroke="#000" stroke-width="1.5"/></pattern>` +
      `<pattern id="p5" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><circle cx="2" cy="2" r="1.1" fill="#000"/></pattern></defs>`;
    for (const g of teile) {                    // je Gruppe eine Fläche: Treppenlinie zwischen unterer und oberer Stapelgrenze
      const vor = teile.slice(0, teile.indexOf(g)).reduce((a, t) => a + t.teil, 0);
      let d = '';
      for (let i = i0; i <= i1; i++) { const v = S.aktion[i]; if (!v) continue; const y0 = y(v * vor), y1 = y(v * (vor + g.teil)); d += `M${(x(i) - bw / 2).toFixed(1)},${y0.toFixed(1)}h${bw.toFixed(1)}V${y1.toFixed(1)}h${(-bw).toFixed(1)}Z`; }
      s += `<path d="${d}" fill="${stil[MUSTER[g.g]]}"/>`;
    }
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/><text class="fett" x="${L}" y="14">${T.abgabeTitel}${S.lz ? ` (${T.wirktSpaeter} ${S.lz})` : ''}</text>` +
      (auf ? `<text x="${L - 8}" y="${y(auf) + 4}" text-anchor="end">+${zahl(auf)}</text>` : '') + `<text x="${L - 8}" y="${y(0) + 4}" text-anchor="end">0</text>` + (ab ? `<text x="${L - 8}" y="${y(ab) + 4}" text-anchor="end">${zahl(ab)}</text>` : '');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('abgabelegende').innerHTML = teile.map(g => `<span><i class="muster ${MUSTER[g.g]}"></i>${h(T[g.g])}</span>`).join('');
  }
  // Füllung und Entleerung eines Sees: gemessener Seestand und Seestand mit Rückhalt über das Jahr, mit den Grenzen des Sees
  function seeGrafik(R) {
    const S = R.S, Y = R.Y, O = S.O, n = O.speicher.length, seen = meta.seen.filter(s => CM[s.id] > 0 && Y.w[s.id]), w = $('seewahl'); w.textContent = '';
    if (!seen.length) { $('seegrafik').innerHTML = ''; $('seelegende').innerHTML = ''; $('seetext').textContent = ''; return; }
    if (!seen.find(s => s.id === Z.see)) Z.see = seen[0].id;
    const wahl = feld(T.seeWahl, `<select>${seen.map(s => `<option value="${s.id}"${s.id === Z.see ? ' selected' : ''}>${h(nm(s.name))}</option>`).join('')}</select>`);
    wahl.querySelector('select').addEventListener('change', e => { Z.see = e.target.value; seeGrafik(R); }); w.append(wahl);
    const s = seen.find(x => x.id === Z.see), teil = CM[s.id] * s.flaeche_km2 * 1e4 / S.V, mess = Y.w[s.id];
    // Der See trägt seinen Anteil am Speicherinhalt; die Aktion am See liegt lz Tage vor der Wirkung am Ziel
    const lzs = S.lz + (s.knoten === BODENSEE ? BODENSEE_TAGE : 0), zus = mess.map((x, j) => j + lzs < n ? teil * O.speicher[j + lzs] / (s.flaeche_km2 * 1e6) : 0), mit = mess.map((x, j) => x == null ? null : x + zus[j]);
    const B = 1000, H = 300, L = 62, RR = 14, OO = 26, U = 36, alle = [...mess, ...mit].filter(v => v != null).concat(s.grenzen ? [s.grenzen.hoch] : []);
    const lo = Math.min(...alle), hi = Math.max(...alle), sch = [.1, .2, .25, .5, 1].find(q => (hi - lo) / q <= 6) || 2, u = Math.floor(lo / sch) * sch, o = Math.ceil(hi / sch) * sch + 1e-9;
    const x = i => L + (B - L - RR) * i / (mess.length - 1), y = v => OO + (H - OO - U) * (1 - (v - u) / (o - u));
    const linie = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    let g = `<text class="fett" x="${L}" y="14">${h(nm(s.name))} ${Z.jahr}: ${T.seeG}</text>`;
    for (let v = u; v <= o; v += sch) g += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v, 2)}</text>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); g += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${H - U}" y2="${H - U + 5}"/><text x="${x(i) + 4}" y="${H - U + 18}">${T.monate[m]}</text>`; }
    if (s.grenzen) for (const [v, name] of [[s.grenzen.hoch, T.seeHoch], [s.grenzen.tief, T.seeTief]]) if (v != null && v >= u && v <= o) g += `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text class="fett" x="${B - RR - 4}" y="${y(v) - 5}" text-anchor="end">${name} ${zahl(v, 2)}</text>`;
    g += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><path d="${linie(mit)}" fill="none" stroke="#003399" stroke-width="2"/><path d="${linie(mess)}" fill="none" stroke="#000" stroke-width="2"/>`;
    const svg = $('seegrafik'); svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = g;
    $('seelegende').innerHTML = `<span><i></i>${T.gemessen}</span><span><i class="blau"></i>${T.seeMit}</span>${s.grenzen ? `<span><i class="strich"></i>${T.seeHoch}${s.grenzen.tief != null ? ', ' + T.seeTief : ''}</span>` : ''}`;
    const jmax = zus.reduce((b, v, j) => v > zus[b] ? j : b, 0), tage = f => { const a = []; S.aktion.forEach((v, j) => { if (f(v)) a.push(j); }); return a; }, fuell = tage(v => v < 0), leer = tage(v => v > 0);
    const spanne = a => a.length ? `${datum(isoTag(Z.jahr, a[0])).slice(0, -4)} – ${datum(isoTag(Z.jahr, a[a.length - 1]))} (${a.length} ${T.tageW})` : '–';
    const abstand = s.grenzen ? Math.min(...mit.map(v => v == null ? Infinity : s.grenzen.hoch - v)) : null;
    $('seetext').textContent = zus[jmax] > 1e-4 ? `${T.seeMax}${DP}${zahl(zus[jmax] * 100)} cm (${datum(isoTag(Z.jahr, jmax))}). ${T.seeFuell}${DP}${spanne(fuell)}. ${T.seeLeer}${DP}${spanne(leer)}.` + (abstand != null && isFinite(abstand) ? ` ${T.seeAbstand}${DP}${zahl(abstand * 100)} cm.` : '') : T.seeKein;
  }
  function seeTafel(R) {
    const S = R.S, Y = R.Y;
    const zeilen = S.teile.filter(x => x.teil > 0).map(g => {
      let vol = 0, maxA = 0, maxR = 0; for (const v of S.aktion) { if (v > 0) { vol += v * g.teil * SEK; maxA = Math.max(maxA, v * g.teil); } else maxR = Math.max(maxR, -v * g.teil); }
      const q = Y.q[g.knoten], qs = S.q[g.knoten], min = a => a ? Math.min(...a.filter(x => x != null)) : null;
      return `<tr><td><i class="muster ${MUSTER[g.g]}" style="display:inline-block;width:22px;height:12px;margin-right:10px;outline:1px solid #000;outline-offset:-1px;vertical-align:-1px"></i>${h(T[g.g])}</td><td class="z">${zahl(100 * g.teil, 1)} %</td><td class="z">${zahl(vol / 1e6, 1)}</td><td class="z">+${zahl(maxA, 1)}</td><td class="z">−${zahl(maxR, 1)}</td>` +
        `<td>${h(GW(ST[g.knoten]))}–${h(kurz(ST[g.knoten]))}</td><td class="z">${qz(min(q))} → ${qz(min(qs))}</td></tr>`;
    }).join('');
    $('seetafel').innerHTML = `<h2>${T.seeTitel}</h2><div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.sAnteil}</th><th class="z">${T.sVol}</th><th class="z">${T.sMaxA}</th><th class="z">${T.sMaxR}</th><th>${T.sOrt}</th><th class="z">${T.sMin}</th></tr></thead><tbody>${zeilen}</tbody></table></div><p class="hinweis">${T.seeHinweis}</p>`;
  }

  // ------------------------------------------------------------ Herleitung: Formeln mit den Zahlen des angezeigten Tages
  function herleitung(R) {
    const el = $('hertext'), f = s => `<p class="formel">${s}</p>`, r = s => `<p class="rechnung">${s}</p>`, t = (de, fr) => FR ? fr : de;
    let html = '';
    const a = R.a || R.zeige, z = ST[Z.ziel];
    // 1 Zwischengebiet
    html += `<h3>1 ${t('Zwischengebiet', 'Bassin intermédiaire')}</h3><p>${t('Der Rest eines Knotens k ist sein gemessener Abfluss minus die Summe der Messstellen direkt oberhalb, je um die Fliesszeit τ versetzt.', 'Le reste d’un nœud k est son débit mesuré moins la somme des stations situées juste en amont, décalées du temps de parcours τ.')}</p>` +
      f('R<sub>k</sub>(t) = Q<sub>k</sub>(t) − Σ<sub>j</sub> Q<sub>j</sub>(t − τ<sub>jk</sub>)');
    if (a && tagAnsicht() && R.Y && R.i0 === R.i1) {
      const ob = oben(Z.ziel), q = R.Y.q, teile = ob.map(k => ({ k, v: wert(q, k.von, R.i1 - k.tage) })).filter(x => x.v != null), zq = wert(q, Z.ziel, R.i1);
      if (teile.length && zq != null) html += r(`${h(kurz(z))}, ${datum(isoTag(Z.jahr, R.i1))}: R = ${qz(zq)} − (${teile.map(x => `${qz(x.v)} ${h(kurz(ST[x.k.von]))}${x.k.tage ? ` [t − ${x.k.tage}]` : ''}`).join(' + ')}) = <b>${qz(zq - teile.reduce((s, x) => s + x.v, 0))} m³/s</b>`);
    }
    // 2 Anteile
    html += `<h3>2 ${t('Anteile', 'Parts')}</h3><p>${t('Der Abfluss am Ziel ist die Summe aller Quellknoten (gemessen) und aller Reste oberhalb. Der Anteil eines Glieds i ist sein Wert durch den Abfluss am Ziel.', 'Le débit à la station du bilan est la somme de tous les nœuds sources (mesurés) et de tous les restes en amont. La part d’une composante i est sa valeur divisée par ce débit.')}</p>` +
      f(`Q<sub>${t('Ziel', 'bilan')}</sub>(t) = Σ<sub>i</sub> G<sub>i</sub>(t − τ<sub>i</sub>) &nbsp;&nbsp; a<sub>i</sub> = G<sub>i</sub>(t − τ<sub>i</sub>) / Q<sub>${t('Ziel', 'bilan')}</sub>(t)`);
    if (a) { const aare = abfluss(a, '2205'), alp = a.mittel['Q:2473']; if (aare != null) html += r(`${t('Aare in Stilli', 'Aar à Stilli')}: ${qz(aare)} / ${qz(a.ziel_mittel)} = <b>${zahl(100 * aare / a.ziel_mittel, 1)} %</b>` + (alp != null ? ` &nbsp;·&nbsp; ${t('Alpenrhein in Diepoldsau', 'Rhin alpin à Diepoldsau')}: ${qz(alp)} / ${qz(a.ziel_mittel)} = <b>${zahl(100 * alp / a.ziel_mittel, 1)} %</b>` : '')); }
    // 3 Kontrollbilanz
    if (a) { const kk = a.mittel['R:2205'], g = ['2016', '2018', '2243'].map(id => abfluss(a, id)), st = abfluss(a, '2205');
      if (kk != null && g.every(x => x != null)) html += `<h3>3 ${t('Kontrollbilanz Aare', 'Contrôle Aar')}</h3>` + f('Δ = Q<sub>Stilli</sub> − (Q<sub>Brugg</sub> + Q<sub>Mellingen</sub> + Q<sub>Baden</sub>)') + r(`Δ = ${qz(st)} − (${g.map(qz).join(' + ')}) = <b>${qz(kk)} m³/s</b> (${zahl(100 * kk / st, 1)} %)`); }
    // 4 Speicher
    const seen = meta.seen.filter(s => CM[s.id] > 0), V = seen.reduce((s, x) => s + CM[x.id] * x.flaeche_km2 / 100, 0);
    html += `<h3>4 ${t('Staukapazität', 'Capacité de retenue')}</h3><p>${t('Fläche mal zusätzliche Stauhöhe. 1 km² mal 1 cm sind 0,01 Mio. m³.', 'Surface fois hauteur supplémentaire. 1 km² fois 1 cm font 0,01 mio m³.')}</p>` + f('V = Σ<sub>s</sub> A<sub>s</sub> · Δh<sub>s</sub>') +
      (seen.length ? r(`V = ${seen.map(s => `${zahl(s.flaeche_km2, 1)} km² · ${CM[s.id]} cm`).join(' + ')} = <b>${zahl(V, 1)} ${T.mio}</b>`) : '');
    // 5 Rückhalt
    const O = R.S && R.S.O, glw = O ? O.glw : Z.modus === 'glw';
    html += `<h3>5 ${t('Rückhalt und Abgabe', 'Retenue et restitution')}</h3>` + (glw
      ? `<p>${t('Mit Voraussicht heisst: Die Rechnung kennt alle Tageswerte des Speicherjahrs im Voraus. Bezugswert ist der Abfluss beim GlW in Kaub, Q<sub>GlW</sub>. Jede Anhebung darunter zählt. Unter L wird abgegeben, mit L höchstens Q<sub>GlW</sub>: Alle Tage unter L kommen auf L, die tiefsten gewinnen am meisten. Gestaut wird nur über H, und H liegt mindestens 10 cm über dem GlW, also nie an einem Tag am oder unter dem GlW; höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt.', 'Avec prévision signifie que le calcul connaît d’avance toutes les valeurs journalières de l’année de stockage. La référence est le débit au GlW à Kaub, Q<sub>GlW</sub>. Chaque relèvement en dessous compte. Sous L on restitue, avec L au plus égal à Q<sub>GlW</sub> : tous les jours sous L montent à L, les plus bas gagnent le plus. On ne retient qu’au-dessus de H, avec H au moins égal à Q<sub>GlW</sub>, donc jamais un jour sous le GlW ; au plus 10 % du débit et seulement tant qu’un jour sous L suit encore.')}</p>` +
        f(`${t('Abgabe', 'Restitution')} a(t) = L − Q(t), ${t('wenn', 'si')} Q(t) &lt; L, &nbsp; L ≤ Q<sub>GlW</sub><br>${t('Rückhalt', 'Retenue')} r(t) = min(Q(t) − H, 0,10 · Q(t)), ${t('wenn', 'si')} Q(t) &gt; H, &nbsp; H ≥ Q<sub>GlW</sub><br>S(t + 1) = S(t) + 86 400 · (r(t) − a(t)), &nbsp; 0 ≤ S(t) ≤ V, &nbsp; S(1.4.) = ${t('Rest des Vorjahrs', 'reste de l’année précédente')}<br>${t('Bedarf für alle Tage', 'Besoin pour tous les jours')} = 86 400 · Σ max(0, Q<sub>GlW</sub> − Q(t))`) +
        `<p>${t('L* ist das grösste L bis Q<sub>GlW</sub>, bei dem der Speicher nie leer läuft. H* ist das grösste H, mit dem L* noch hält. Beide werden durch Halbieren des Intervalls gesucht.', 'L* est le plus grand L jusqu’à Q<sub>GlW</sub> pour lequel le réservoir ne se vide jamais. H* est le plus grand H qui tient encore L*. Tous deux sont cherchés par dichotomie.')}</p>`
      : `<p>${t('Zwei Schwellen am Ziel steuern den Speicher. Unter L wird abgegeben, über H wird gestaut, höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt.', 'Deux seuils à la station du bilan commandent le réservoir. Sous L on restitue, au-dessus de H on retient, au plus 10 % du débit et seulement tant qu’un jour sous L suit encore.')}</p>` +
        f(`${t('Abgabe', 'Restitution')} a(t) = L − Q(t), ${t('wenn', 'si')} Q(t) &lt; L<br>${t('Rückhalt', 'Retenue')} r(t) = min(Q(t) − H, 0,10 · Q(t)), ${t('wenn', 'si')} Q(t) &gt; H<br>S(t + 1) = S(t) + 86 400 · (r(t) − a(t)), &nbsp; 0 ≤ S(t) ≤ V, &nbsp; S(1.4.) = ${t('Rest des Vorjahrs', 'reste de l’année précédente')}`) +
        `<p>${t('L* ist das grösste L, bei dem der Speicher nie leer läuft. H* ist das grösste H, mit dem L* noch hält. Beide werden durch Halbieren des Intervalls gesucht.', 'L* est le plus grand L pour lequel le réservoir ne se vide jamais. H* est le plus grand H qui tient encore L*. Tous deux sont cherchés par dichotomie.')}</p>`);
    if (O && R.sz) html += r(`${h(kurz(ST[R.S.zid]))} ${Z.jahr}: ${glw ? `Q<sub>GlW</sub> = ${zahl(O.deckel)} m³/s, ` : ''}L* = <b>${zahl(O.tief, 1)} m³/s</b>, H* = <b>${zahl(O.hoch, 1)} m³/s</b>. ${t('Abgabe an', 'Restitution sur')} ${R.sz.tA} ${T.tageW}, ${t('Rückhalt an', 'retenue sur')} ${R.sz.tR} ${T.tageW}. ${t('Kleinster Tagesabfluss', 'Plus faible débit journalier')}: ${zahl(R.sz.min0, 1)} → <b>${zahl(R.sz.min1, 1)} m³/s</b>.` +
      (glw ? ` ${t('Bedarf für alle Tage', 'Besoin pour tous les jours')}: <b>${zahl(O.bedarf / 1e6)} ${T.mio}</b>, ${t('vorhanden', 'disponible')}: ${zahl(V, 1)} ${T.mio}.` : ''));
    html += `<p>${t('Die Seen teilen sich Abgabe und Rückhalt im Verhältnis ihrer zusätzlichen Kapazität; die Aktion am See liegt um die Fliesszeit τ vor der Wirkung am Ziel.', 'Les lacs se partagent restitution et retenue au prorata de leur capacité supplémentaire ; l’action au lac précède l’effet à la station du bilan du temps de parcours τ.')}</p>` +
      f(`a<sub>s</sub>(t) = (V<sub>s</sub> / V) · a(t + τ) &nbsp;&nbsp; r<sub>s</sub>(t) = (V<sub>s</sub> / V) · r(t + τ)`) +
      `<p>${t('Grenze je Messstelle unterhalb eines Sees: Der Rückhalt aller Seen oberhalb zusammen beträgt höchstens 20 % des Abflusses Q<sub>s</sub> dort, und der Abfluss fällt nie unter seinen gemessenen Jahrestiefstwert. Die engste Messstelle bestimmt den Rückhalt aller.', 'Limite par station en aval d’un lac : la retenue de tous les lacs en amont fait au plus 20 % du débit Q<sub>s</sub> à cet endroit, et ce débit ne passe jamais sous son minimum mesuré de l’année. La station la plus contrainte détermine la retenue de tous.')}</p>` +
      f(`Σ<sub>oberhalb s</sub> r(t) ≤ min(0,20 · Q<sub>s</sub>(t), Q<sub>s</sub>(t) − min Q<sub>s</sub>) &nbsp;&nbsp;⇒&nbsp;&nbsp; r(t + τ) ≤ min<sub>s</sub> [ min(0,20 · Q<sub>s</sub>(t), Q<sub>s</sub>(t) − min Q<sub>s</sub>) · V / V<sub>oberhalb s</sub> ]`);
    html += `<p>${t('Woher das Wasser zum Füllen kommt: Die Rechnung nimmt es aus dem Abfluss, der an dem Tag tatsächlich unterhalb des Sees gemessen wurde. Wird gestaut, fliesst dort entsprechend weniger; wird abgegeben, entsprechend mehr. Zuflüsse in die Seen gehen nicht eigens ein, sie stecken im gemessenen Abfluss unterhalb. Die Wirkung erreicht Basel am selben Tag und Kaub zwei Tage später (Annahme), ohne Abflachung der Welle. Für den Bodensee gelten zwei Tage mehr: Die IGKB nennt rund vier Tage vom Bodensee bis Mannheim (2024).', 'D’où vient l’eau du remplissage : le calcul la prélève sur le débit réellement mesuré ce jour-là en aval du lac. Quand on retient, il y coule d’autant moins ; quand on restitue, d’autant plus. Les apports aux lacs n’entrent pas séparément, ils sont contenus dans le débit mesuré en aval. L’effet atteint Bâle le jour même et Kaub deux jours plus tard (hypothèse), sans atténuation de l’onde. Pour le lac de Constance, deux jours de plus : l’IGKB indique environ quatre jours du lac de Constance à Mannheim (2024).')}</p>` +
      f(`Q<sub>s</sub><sup>sim</sup>(t) = Q<sub>s</sub>(t) − r<sub>s</sub>(t) + a<sub>s</sub>(t) &nbsp;&nbsp; Q<sub>Kaub</sub><sup>sim</sup>(t + 2) = Q<sub>Kaub</sub>(t + 2) + Σ<sub>s</sub> (a<sub>s</sub>(t) − r<sub>s</sub>(t))`);
    html += `<p>${t('Hochwassergrenze: Der Seestand W<sub>s</sub> plus der Zusatzstau darf die Hochwassergrenze G<sub>s</sub> des Sees nicht überschreiten. Der See s trägt den Anteil V<sub>s</sub> / V des Inhalts S. Liegt der Inhalt über der Grenze, wird der Überschuss am selben Tag abgegeben (Entlastung). Für den Bodensee ist keine Grenze hinterlegt. In den Stufen 2 und 3 liegt die Grenze um den gewählten Zusatz höher.', 'Limite de hautes eaux : le niveau W<sub>s</sub> plus la surélévation ne doit pas dépasser la limite G<sub>s</sub> du lac. Le lac s porte la part V<sub>s</sub> / V du contenu S. Si le contenu dépasse la limite, l’excédent est restitué le jour même (délestage). Aucune limite n’est enregistrée pour le lac de Constance. Aux niveaux 2 et 3, la limite est relevée du supplément choisi.')}</p>` +
      f(`W<sub>s</sub>(t) + (V<sub>s</sub> / V) · S(t) / A<sub>s</sub> ≤ G<sub>s</sub> &nbsp;&nbsp;⇒&nbsp;&nbsp; S(t) ≤ min<sub>s</sub> [ (G<sub>s</sub> − W<sub>s</sub>(t)) · A<sub>s</sub> · V / V<sub>s</sub> ]`) +
      `<p>${t('Betriebsregel ohne Voraussicht: Jede Entscheidung kennt nur den Abfluss des Tages und den Speicherinhalt. Unter dem GlW wird aufgefüllt, höchstens mit der Menge, bei der ein voller Speicher D Tage reicht. Gestaut wird ab einem festen Abfluss Q<sub>Stau</sub>. Die Regel läuft durchgehend über Vorjahr, Jahr und Folgejahr.', 'Règle d’exploitation sans prévision : chaque décision ne connaît que le débit du jour et le contenu du réservoir. Sous le GlW on complète, au plus avec le débit pour lequel un réservoir plein dure D jours. On retient dès un débit fixe Q<sub>ret</sub>. La règle court en continu sur l’année précédente, l’année et la suivante.')}</p>` +
      f(`a(t) = min(Q<sub>GlW</sub> − Q(t), V / (D · 86 400), S(t) / 86 400), ${t('wenn', 'si')} Q(t) &lt; Q<sub>GlW</sub><br>r(t) = min(Q(t) − Q<sub>${t('Stau', 'ret')}</sub>, 0,10 · Q(t), ${t('Grenzen der Seen', 'limites des lacs')}), ${t('wenn', 'si')} Q(t) &gt; Q<sub>${t('Stau', 'ret')}</sub> &nbsp;&nbsp; (D = ${REGEL.tage}, Q<sub>${t('Stau', 'ret')}</sub> = ${zahl(REGEL.stauAb)} m³/s)`);
    // 6 Pegel Kaub
    if (KURVE.length) {
      html += `<h3>6 ${t('Pegel Kaub und Fahrrinnentiefe', 'Échelle de Kaub et profondeur du chenal')}</h3><p>${t('Der Wasserstand folgt aus dem Abfluss über die Abflusskurve: linear zwischen den zwei benachbarten Stützpunkten. Ausserhalb der Stützpunkte gibt es keinen Wert.', 'Le niveau découle du débit par la courbe de tarage : interpolation linéaire entre les deux points voisins. Hors de ces points, pas de valeur.')} ${h(K.abflusskurve_quelle || '')}. ${KURVE.length} ${t('Stützpunkte von', 'points de')} ${zahl(KURVE[0][0])} ${t('bis', 'à')} ${zahl(KURVE[KURVE.length - 1][0])} m³/s.</p>` +
        f(`W(Q) = W<sub>1</sub> + (W<sub>2</sub> − W<sub>1</sub>) · (Q − Q<sub>1</sub>) / (Q<sub>2</sub> − Q<sub>1</sub>) &nbsp;&nbsp; T = W − GlW + T<sub>GlW</sub>`);
      const qk = R.Y && tagAnsicht() ? wert(R.Y.q, KAUB, R.i1) : null;
      if (qk != null && wAusQ(qk) != null) { let i = 1; while (KURVE[i][0] < qk) i++; const p = KURVE[i - 1], p2 = KURVE[i], w = wAusQ(qk);
        html += r(`Q = ${qz(qk)} m³/s: W = ${zahl(p[1], 1)} + (${zahl(p2[1], 1)} − ${zahl(p[1], 1)}) · (${qz(qk)} − ${qz(p[0])}) / (${qz(p2[0])} − ${qz(p[0])}) = <b>${zahl(w, 0)} cm</b> &nbsp;·&nbsp; T = ${zahl(w)} − ${zahl(GLW)} + ${zahl(TUG)} = <b>${zahl(w - GLW + TUG)} cm</b>`); }
      html += r(`GlW = ${zahl(GLW)} cm ${t('entspricht', 'correspond à')} <b>${zahl(Q_GLW)} m³/s</b>. ${t('In diesem Bereich ändert 1 m³/s den Pegel um', 'Dans cette plage, 1 m³/s modifie le niveau de')} ${zahl((wAusQ(Q_GLW + 50) - wAusQ(Q_GLW - 50)) / 100, 2)} cm.`);
    }
    // 7 Abfluss in Kaub aus dem Wasserstand
    const aw = K.abfluss_aus_w;
    if (aw) html += `<h3>7 ${t('Abfluss in Kaub an Tagen ohne Abflusswert', 'Débit à Kaub les jours sans valeur de débit')}</h3><p>${t('Das Jahrbuch der BfG endet am 31.12.2025, PEGELONLINE reicht 31 Tage zurück. Dazwischen liegt für Kaub nur der gemessene Wasserstand vor (Tagesmittel der WSV über das Pegelportal des HLNUG). Der Abfluss dieser Tage ist aus dem Wasserstand über die Abflusskurve gerechnet. So entsteht auch der amtliche Abfluss. Liegt der Wasserstand unter dem tiefsten Stützpunkt der Kurve, wird sie mit der Steigung der zwei tiefsten Stützpunkte um höchstens 12 cm verlängert; diese Tage sind eigens bezeichnet.', 'L’annuaire de la BfG s’arrête au 31.12.2025, PEGELONLINE remonte à 31 jours. Entre les deux, Kaub ne dispose que du niveau mesuré (moyennes journalières de la WSV via le portail du HLNUG). Le débit de ces jours est calculé à partir du niveau par la courbe de tarage. C’est ainsi qu’est établi le débit officiel. Si le niveau est sous le point le plus bas de la courbe, celle-ci est prolongée avec la pente des deux points les plus bas, de 12 cm au plus ; ces jours sont signalés.')}</p>` +
      f(`Q = Q<sub>1</sub> + (Q<sub>2</sub> − Q<sub>1</sub>) · (W − W<sub>1</sub>) / (W<sub>2</sub> − W<sub>1</sub>)`) +
      r(`${t('Seit', 'Depuis le')} ${datum(aw.ab)}: <b>${zahl(aw.tage)}</b> ${T.tageW} ${t('aus dem Wasserstand gerechnet, davon', 'calculés à partir du niveau, dont')} <b>${zahl(aw.davon_verlaengert)}</b> ${t('mit verlängerter Kurve', 'avec courbe prolongée')}. ${t('Tiefster Stützpunkt', 'Point le plus bas')}: ${zahl(aw.tiefster_stuetzpunkt[1], 0)} cm = ${zahl(aw.tiefster_stuetzpunkt[0])} m³/s.`) +
      `<p>${t('Der Wasserstand und damit die Fahrrinnentiefe sind an diesen Tagen gemessen. Gerechnet ist nur der Abfluss.', 'Le niveau, et donc la profondeur du chenal, sont mesurés ces jours-là. Seul le débit est calculé.')}</p>`;
    // 8 Fahrbarkeit je Abschnitt
    if (RP.length) html += `<h3>8 ${t('Fahrbarkeit je Abschnitt', 'Navigabilité par tronçon')}</h3><p>${t('Von Basel bis Iffezheim ist der Rhein staugeregelt; dort setzt die Seite keine Abhängigkeit vom Abfluss an. Unterhalb gilt je Abschnitt der Richtpegel mit seinem GlW und seiner Fahrrinnentiefe unter GlW (PEGELONLINE). Der simulierte Wasserstand ist der gemessene plus die Differenz auf der Bezugskurve des Pegels; Q ist der Abfluss am Bezugspegel, ΔQ die Wirkung der Simulation dort.', 'De Bâle à Iffezheim, le Rhin est régulé par barrages ; la page n’y suppose aucune dépendance au débit. En aval, chaque tronçon suit son échelle de référence, avec son GlW et sa profondeur sous le GlW (PEGELONLINE). Le niveau simulé est le niveau mesuré plus l’écart sur la courbe de l’échelle ; Q est le débit à la station de référence, ΔQ l’effet de la simulation à cet endroit.')}</p>` +
      f(`T = W − GlW + T<sub>GlW</sub> &nbsp;&nbsp; W<sub>sim</sub> = W + f(Q + ΔQ) − f(Q)`) +
      r(RP.map(p => `${h(p.name)}: GlW ${zahl(p.glw)} cm, T<sub>GlW</sub> ${zahl(p.tugl)} cm, ${t('Bezug', 'référence')} ${h(kurz(ST[p.bezug]))}, ${p.kurve.length} ${t('Stützpunkte', 'points')}`).join('<br>')) +
      `<p>${t(`Bezugskurven aus Tageswertpaaren des jüngsten Jahrbuchjahres und den Rohwerten danach. Mannheim und Oestrich haben keine eigene Abflussreihe; ihre Kurve bezieht sich auf Maxau bzw. Mainz und streut stärker. Bezugspegel und Abschnitte: ${h(meta.abschnitte_quelle || '')}. Für km 508–540 ist Oestrich der Bezugspegel; er fehlt im Jahrbuch, darum dient an Tagen ohne Wert der Pegel Bingen im selben Abschnitt, auf den GlW von Oestrich umgerechnet${RP.some(p => p.ersatz && p.ersatz.abweichung != null) ? ` (mittlere Abweichung an ${RP.find(p => p.ersatz).ersatz.tage_vergleich} gemeinsamen Tagen: ${zahl(RP.find(p => p.ersatz).ersatz.abweichung_betrag, 1)} cm)` : ''}. Im Abschnitt Kaub gilt die Fahrrinnentiefe von 190 cm bis St. Goar (km 557), danach 210 cm. Geprüft: Für Maxau und Kaub ergibt die Formel am 10. bis 14.11.2026 dieselben Werte wie die Grafik der WSV auf ELWIS. Die Stufen 30 und 60 cm unter GlW sind eine Darstellungswahl. Lage der Staustufen nach Wikidata.`, `Courbes tirées des couples journaliers de la dernière année de l’annuaire et des données brutes ensuite. Mannheim et Oestrich n’ont pas de série de débit propre ; leur courbe se rapporte à Maxau et à Mayence et disperse davantage. Échelles de référence et tronçons : ${h(meta.abschnitte_quelle || '')}. Pour les km 508–540, l’échelle de référence est Oestrich ; elle manque dans l’annuaire, donc les jours sans valeur on utilise l’échelle de Bingen dans le même tronçon, ramenée au GlW d’Oestrich. Dans le tronçon de Kaub, la profondeur de 190 cm vaut jusqu’à St. Goar (km 557), puis 210 cm. Vérifié : pour Maxau et Kaub, la formule donne du 10 au 14.11.2026 les mêmes valeurs que le graphique de la WSV sur ELWIS. Les paliers de 30 et 60 cm sous le GlW sont un choix de représentation. Position des barrages selon Wikidata.`)}</p>`;
    // 9 Auslastung der Flotte
    if (AUSL) html += `<h3>9 ${t('Auslastung der Flotte', 'Taux de chargement de la flotte')}</h3><p>${t('Bei Niedrigwasser wird nicht gesperrt; die Schiffe laden weniger. Die ZKR nennt für eine durchschnittliche Trockengüter- und Tankerflotte: unter 134 cm am Pegel Kaub 50 %, unter 72 cm 25 %, unter 44 cm 15 % der Kapazität; unter 40 cm kann keine Binnenschifffahrt stattfinden. 100 % bei 250 cm nennt sie für ein Containerschiff. Zwischen diesen Stützpunkten rechnet die Seite linear; das ist eine Annahme.', 'En basses eaux, la navigation n’est pas fermée ; les bateaux chargent moins. La CCNR indique pour une flotte moyenne de vraquiers et de citernes : sous 134 cm à l’échelle de Kaub 50 %, sous 72 cm 25 %, sous 44 cm 15 % de la capacité ; sous 40 cm, aucune navigation intérieure n’est possible. Elle indique 100 % à 250 cm pour un porte-conteneurs. Entre ces points, la page interpole linéairement ; c’est une hypothèse.')}</p>` +
      r(AUSL.punkte.map(p => `${zahl(p[0])} cm: ${zahl(p[1])} %`).join(' &nbsp;·&nbsp; ') + ` &nbsp;·&nbsp; &lt; ${zahl(AUSL.keine_unter)} cm: 0 %`) + `<p>${h(AUSL.quelle)}</p>`;
    el.innerHTML = html;
  }

  // ------------------------------------------------------------ Datensatz: Übersicht, Tageswerte des Jahres, CSV
  const REIHEN = meta.reihen || [];
  const spalten = () => REIHEN.map(r => ({ r, lese: (Y, i) => r.art === 'Q' ? (Y.q[r.id] ? Y.q[r.id][i] : null) : r.art === 'W' ? (Y.wp && Y.wp[r.id] ? Y.wp[r.id][i] : null) : (Y.w[r.id] ? Y.w[r.id][i] : null) }));
  function csvZeilen(Y, kopf) {
    const sp = spalten(), n = (Y.q[BASEL] || Object.values(Y.q)[0]).length, zeilen = [];
    if (kopf) zeilen.push(['datum', ...sp.flatMap(({ r }) => r.art === 'Q' ? [`Q_${r.id}`, `status_${r.id}`] : [`${r.art === 'W' ? 'W' : 'See'}_${r.id}`])].join(';'));
    for (let i = 0; i < n; i++) { if (!sp.some(({ lese }) => lese(Y, i) != null)) continue;      // Tage ohne jeden Wert (Zukunft) entfallen
      zeilen.push([isoTag(Y.jahr, i), ...sp.flatMap(({ r, lese }) => { const v = lese(Y, i); return r.art === 'Q' ? [v == null ? '' : v, v == null ? '' : statusAm(Y, r.id, i)] : [v == null ? '' : v]; })].join(';')); }
    return zeilen;
  }
  function speichern(name, zeilen) {
    const kopf = ['# Rhein: Tagesmittel. Q in m3/s, W in cm am Pegel, See in m ue. M. Status: ' + Object.entries(meta.status).map(([k, v]) => `${k} = ${v}`).join(', '),
      '# Quellen: BAFU, Hydrologische Beobachtungen (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG (DGJ, PEGELONLINE)',
      '# Reihen: ' + REIHEN.map(r => `${r.id} = ${r.name}`).join(', ')];
    const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(['\ufeff' + kopf.concat(zeilen).join('\n')], { type: 'text/csv' })); l.download = name; l.click(); URL.revokeObjectURL(l.href);
  }
  function tabelleJahr(Y) {
    const sp = spalten(), n = (Y.q[BASEL] || Object.values(Y.q)[0]).length;
    let html = `<table><thead><tr><th>${T.dDatum}</th>${sp.map(({ r }) => `<th title="${h(r.name)}">${h(r.name.replace('Rhein–', '').split(',')[0])}<br>${r.art === 'Q' ? 'm³/s' : r.art === 'W' ? 'cm' : 'm'}</th>`).join('')}</tr></thead><tbody>`;
    for (let i = 0; i < n; i++) if (sp.some(({ lese }) => lese(Y, i) != null)) html += `<tr><td>${datum(isoTag(Y.jahr, i))}</td>${sp.map(({ r, lese }) => { const v = lese(Y, i); if (v == null) return '<td></td>'; const c = r.art === 'Q' ? statusAm(Y, r.id, i) : null; return `<td>${r.art === 'See' ? v.toFixed(2) : r.art === 'W' ? v : v.toFixed(v < 100 ? 1 : 0)}${c === 0 ? '°' : GERECHNET(c) ? '*' : ''}</td>`; }).join('')}</tr>`;
    return html + '</tbody></table>';
  }
  $('datuebersicht').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.dReihe}</th><th>${T.nr}</th><th>${T.dGroesse}</th><th>${T.quelle}</th><th>${T.dZeit}</th><th class="z">${T.dTage}</th><th>${T.dStatus}</th></tr></thead><tbody>` +
    REIHEN.map(r => `<tr><td>${h(r.name)}</td><td>${h(r.art === 'See' ? '' : r.id)}</td><td>${r.art === 'Q' ? T.dQ : r.art === 'W' ? T.dW : T.dSee}, ${r.einheit}</td><td>${r.quelle === 'WSV' ? 'WSV / BfG' : r.quelle}</td><td>${datum(r.zeitraum[0])} – ${datum(r.zeitraum[1])}</td><td class="z">${zahl(r.tage)}</td>` +
      `<td>${r.status ? Object.entries(r.status).map(([k, v]) => `${statusName(k)} ${zahl(v)}`).join(' · ') : (r.quelle === 'WSV' ? 'DGJ, PEGELONLINE' : 'BAFU')}</td></tr>`).join('') + '</tbody></table></div>';
  let datJahr = null;
  function datenZeichnen(R) {
    if (!R.Y || datJahr === R.Y.jahr) return;
    datJahr = R.Y.jahr; const Y = R.Y, w = $('datwahl'); w.textContent = '';
    w.append(knoepfe('\u00a0', [['j', `${T.dCsvJahr} (${Y.jahr})`], ['a', T.dCsvAlle]], '', async v => {
      if (v === 'j') return speichern(`rhein-tageswerte-${Y.jahr}.csv`, csvZeilen(Y, true));
      const knopf = w.querySelector('button[data-w="a"]'), alt = knopf.textContent; let zeilen = [];
      for (const j of meta.jahre) { knopf.textContent = `${T.dLaedt} ${j}`; const y = await jahr(j); if (y) zeilen = zeilen.concat(csvZeilen(y, !zeilen.length)); }
      knopf.textContent = alt; speichern(`rhein-tageswerte-${meta.jahre[0]}-${meta.jahre[meta.jahre.length - 1]}.csv`, zeilen);
    }));
    const d = $('dattage'); d.querySelector('summary').textContent = `${T.dZeigen} ${Y.jahr}`;
    const fuellen = () => { if (d.open) $('dattabelle').innerHTML = tabelleJahr(Y) + `<p class="hinweis" style="padding:0 10px 10px">${T.dLegende}</p>`; else $('dattabelle').innerHTML = ''; };
    d.ontoggle = fuellen; fuellen();
  }

  // ------------------------------------------------------------ Fuss
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(FR ? (QUELLEN_FR[q.kurz] || q.text) : q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Lacs : OFEV, fiches « Seeregulierung » (2020)' : 'Seen: BAFU, Faktenblätter «Seeregulierung» (2020)'} – <a href="https://www.bafu.admin.ch/de/wichtige-seeregulierungen">bafu.admin.ch/de/wichtige-seeregulierungen</a>; IGKB</li>` +
    `<li>${FR ? 'Taux de chargement : CCNR, document de réflexion « Act now! » sur les basses eaux, éd. 3.0 (2023)' : 'Auslastung: ZKR, Reflexionspapier «Act now!» zum Niedrigwasser, Ed. 3.0 (2023)'} – <a href="https://www.ccr-zkr.org">ccr-zkr.org</a></li>` +
    `<li>${FR ? 'Lac de Constance : IGKB, « Die Regulierung des Bodensees », rapport des experts, 70e session (2024) ; CHR, rapport I-26 (2018)' : 'Bodensee: IGKB, «Die Regulierung des Bodensees», Bericht der Sachverständigen, 70. Kommissionstagung (2024); KHR, Bericht I-26 (2018)'} – <a href="https://www.igkb.org/fileadmin/user_upload/Downloads/Publikationen/Protokoll_Kommissionstagungen/KT_2024/Anlage_TOP_10_KT_2024_Regulierung_des_Bodensees.pdf">igkb.org</a></li>` +
    `<li>${FR ? 'Constitution du canton de Thurgovie du 16 mars 1987, § 76, al. 3 (RB 101)' : 'Verfassung des Kantons Thurgau vom 16. März 1987, § 76 Abs. 3 (RB 101)'} – <a href="https://www.rechtsbuch.tg.ch/app/de/texts_of_law/101">rechtsbuch.tg.ch</a></li>` +
    `<li>${FR ? 'Fond de carte' : 'Grundkarte'}: © swisstopo; © OpenStreetMap (ODbL). ${h(karte.quelle)}</li></ul>`;
  $('stand').textContent = `${T.standT}${DP}${datum(meta.stand.slice(0, 10))}` + (meta.meldungen.length ? ` · ${meta.meldungen.join(' · ')}` : '');

  // ------------------------------------------------------------ Erzählung: Schritte neben einer stehenden Grafik
  const SCHMAL = () => innerWidth < 760;
  const LL = (de, fr) => FR ? fr : de;
  function scrolly(id, n, aktiv) {
    const el = $(id), ks = []; let jetzt = -1;
    for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'schritt'; d.innerHTML = '<div class="karton"></div>'; el.append(d); ks.push(d); }
    const setze = i => { if (i === jetzt || i < 0) return; jetzt = i; ks.forEach((k, j) => k.classList.toggle('aktiv', j === i)); aktiv(i); };
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) setze(ks.indexOf(e.target)); }, { rootMargin: '-45% 0px -45% 0px' });
    ks.forEach(k => io.observe(k)); ks[0].classList.add('aktiv');
    return { fuelle: (i, html) => { ks[i].firstChild.innerHTML = html; }, jetzt: () => Math.max(0, jetzt) };
  }
  // CSV zu jeder Grafik: fn liefert { titel, kopf, zeilen }
  function herunter(name, kopf, zeilen) {
    const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(['﻿' + kopf.concat(zeilen).join('\n')], { type: 'text/csv' })); l.download = name; l.click(); URL.revokeObjectURL(l.href);
  }
  function csvKnopf(el, name, fn) {
    let b = el.querySelector(':scope > .herunter');
    if (!b) { b = document.createElement('p'); b.className = 'herunter'; b.innerHTML = `<button type="button" class="textknopf">${T.csv}</button>`; el.append(b); }
    b.firstChild.onclick = () => { const d = fn(); if (!d) return;
      herunter(`${name()}.csv`, [`# ${T.titel.replace(' · ', ' – ')}: ${d.titel}`, `# ${T.csvQuelle}`],
        [d.kopf.join(';'), ...d.zeilen.map(z => z.map(v => v == null ? '' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : v).join(';'))]); };
  }
  const OHNE = { wirkung: {}, O: null };       // Jahr ohne Rückhalt
  const Q40 = AUSL ? kurve(KURVE, AUSL.keine_unter, 1, 0) : null;

  // Abfluss in Kaub über ein Jahr: gemessen, wahlweise mit Rückhalt und Speicherinhalt
  function jahrGrafik(svg, Y, o = {}) {
    const q = Y.q[KAUB]; if (!q || Q_GLW == null) { svg.innerHTML = ''; return; }
    const n = q.length, B = Math.max(420, Math.min(1000, Math.round(svg.parentNode.clientWidth) || 800)), schmal = B < 600, HS = o.speicher ? (schmal ? 84 : 130) : 0, HQ = schmal ? 270 : 440, H = HQ + HS, L = schmal ? 46 : 62, RR = schmal ? 40 : 58, O = 44, U = 30, ymax = 2000;
    const x = i => L + (B - L - RR) * i / n, y = v => O + (HQ - O - U) * (1 - Math.min(v, ymax) / ymax);
    const pfad = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null) { an = false; return; } d += (an ? 'L' : 'M') + x(i + .5).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    let s = `<text class="fett" x="${L}" y="14">${o.titel}</text><text x="${L - 6}" y="${O - 10}" text-anchor="end">m³/s</text><text x="${B - RR + 6}" y="${O - 10}">cm</text>`;
    for (let v = 0; v <= ymax; v += 500) { const w = v ? wAusQ(v) : null;
      s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>` + (w != null ? `<text x="${B - RR + 6}" y="${y(v) + 4}">${zahl(w)}</text>` : ''); }
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Y.jahr}-${String(m + 1).padStart(2, '0')}-01`);
      s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${HQ - U}" y2="${HQ - U + 5}"/>` + (!schmal || m % 2 === 0 ? `<text x="${x(i) + 3}" y="${HQ - U + 18}">${T.monate[m]}</text>` : ''); }
    q.forEach((v, i) => { if (v == null) return; const b = (x(i + 1) - x(i) + .3).toFixed(1), qs = o.sim && o.sim[i] != null ? o.sim[i] : v;
      if (qs > v + .5 && v < Q_GLW) s += `<rect x="${x(i).toFixed(1)}" y="${y(qs).toFixed(1)}" width="${b}" height="${(y(v) - y(qs)).toFixed(1)}" fill="url(#s_e1)"/>`;
      if (qs < Q_GLW) s += `<rect x="${x(i).toFixed(1)}" y="${y(Q_GLW).toFixed(1)}" width="${b}" height="${(y(qs) - y(Q_GLW)).toFixed(1)}" fill="url(#g_e2)"/>`; });
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${HQ - U}" y2="${HQ - U}"/>` +
      `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(Q_GLW)}" y2="${y(Q_GLW)}"/><text class="fett halo" x="${B - RR - 4}" y="${y(Q_GLW) - 6}" text-anchor="end">GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s</text>` +
      (Q40 != null ? `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(Q40)}" y2="${y(Q40)}"/><text class="halo" x="${L + 6}" y="${y(Q40) + 15}">${zahl(AUSL.keine_unter)} cm = ${zahl(Q40)} m³/s${DP}${T.g40}</text>` : '') +
      (o.sim2 ? `<path d="${pfad(o.sim2)}" fill="none" stroke="#003399" stroke-width="1.5" stroke-dasharray="5 4"/>` : '') +
      (o.sim ? `<path d="${pfad(o.sim)}" fill="none" stroke="#003399" stroke-width="2.5"/>` : '') + `<path d="${pfad(q)}" fill="none" stroke="#000" stroke-width="2"/>`;
    if (o.speicher) {
      const y0 = HQ + 34, y1 = H - 8, max = Math.max(1, ...o.speicher) / 1e6, ys = v => y1 - (y1 - y0) * v / max; let d = `M${x(.5).toFixed(1)},${y1}`;
      o.speicher.forEach((v, i) => { d += `L${x(i + .5).toFixed(1)},${ys(v / 1e6).toFixed(1)}`; }); d += `L${x(n - .5).toFixed(1)},${y1}Z`;
      s += `<text class="fett" x="${L}" y="${HQ + 22}">${T.inhalt}</text><path d="${d}" fill="url(#s_e2)" stroke="#003399" stroke-width="1.5"/><line class="achse" x1="${L}" x2="${B - RR}" y1="${y1}" y2="${y1}"/>` +
        `<text x="${L - 6}" y="${y0 + 4}" text-anchor="end">${zahl(max)}</text><text x="${L - 6}" y="${y1 + 4}" text-anchor="end">0</text>`;
    }
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
  }
  const jahrLegende = (sim, sim2) => `<span><i></i>${T.gemessen}</span>` + (sim ? `<span><i class="blau"></i>${T.gBest}</span>` : '') + (sim2 ? `<span><i class="blau strich"></i>${T.gRegel}</span>` : '') +
    `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#g_e2)" stroke="#000"/></svg>${T.gUnter}</span>` + (sim ? `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#s_e1)" stroke="#003399"/></svg>${T.gHub}</span>` : '') + `<span>${T.gSchnitt}</span>`;
  function jahrCsv(Y, sz) {
    const q = Y.q[KAUB], kopf = ['datum', 'Q_Kaub_m3s', 'status', 'W_Kaub_cm'], zeilen = [];
    if (sz) kopf.push('Q_mit_Rueckhalt_Voraussicht_m3s', 'Speicher_Mio_m3', 'Q_mit_Rueckhalt_Betriebsregel_m3s');
    q.forEach((v, i) => { if (v == null) return; const z = [isoTag(Y.jahr, i), v, statusAm(Y, KAUB, i), Y.wk ? Y.wk[i] : null];
      if (sz) z.push(sz.v.S.q[KAUB][i], sz.v.S.O ? sz.v.S.O.speicher[i] / 1e6 : null, sz.r.S.q[KAUB][i]); zeilen.push(z); });
    return { kopf, zeilen };
  }
  // Tiefster Pegel des Jahres in Kaub mit Datum
  function tiefsterTag(Y) { let b = null; const n = (Y.q[BASEL] || []).length; for (let i = 0; i < n; i++) { const m = pegelstand(Y, OHNE, PK, i, false); if (m && (!b || m.w < b.w)) b = { w: m.w, i }; } return b; }
  const gruppenWerte = a => GRUPPEN.map(([nme, m, ks]) => ({ n: T[nme], m, v: ks.reduce((s, k) => s + (a.mittel[k] || 0), 0), da: ks.some(k => k in a.mittel) }));

  // ---- Kapitel 1: Karte mit Schritten
  const RAHMEN1 = [[[49.55, 7.1], [50.45, 8.7]], [[49.55, 7.1], [50.45, 8.7]], [[48.7, 7.4], [50.3, 9.1]], [[47.4, 6.9], [49.0, 8.7]], [[46.3, 6.6], [47.9, 9.9]], [[46.6, 6.9], [50.2, 9.9]]];
  const sc1 = scrolly('st1', 6, i => { map.invalidateSize(); map.flyToBounds(RAHMEN1[i], { duration: .8 }); });
  function kapitel1(R) {
    const tagOk = tagAnsicht() && R.Y && PK, tag = R.datumText || '', m = tagOk ? pegelstand(R.Y, OHNE, PK, R.i1, false) : null, zk = m && zustand(m.w, PK);
    const aK = R.je && R.je[KAUB], qK = aK ? aK.ziel_mittel : null, A = abschnitte(R).filter(x => x.zm), unter = A.filter(x => x.zm.fehl > 0), tief = A.slice().sort((a, b) => (a.zm.tiefe - a.p.tugl) - (b.zm.tiefe - b.p.tugl))[0];
    const tOben = Math.max(...RP.map(p => p.tugl)), reg = meta.seen.filter(s => s.reguliert), fr = reg.reduce((s, x) => s + x.flaeche_km2, 0), fb = meta.seen.filter(s => !s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0);
    const qB = aK ? abfluss(aK, BASEL) : null, stufen = meta.staustufen.length - 1;
    sc1.fuelle(0, LL(`<h3>Der Pegel Kaub</h3><p>Von Iffezheim bis Mainz sichert die Wasserstrassenverwaltung beim Bezugswasserstand ${zahl(tOben)} cm Fahrrinnentiefe, in den Abschnitten Oestrich und Kaub ${zahl(PK.tugl)} cm. Kaub ist die flachste Stelle der Strecke. Die Reedereien richten die Ladung nach diesem Pegel (ZKR, 2023).</p>`,
      `<h3>L’échelle de Kaub</h3><p>D’Iffezheim à Mayence, l’administration des voies navigables garantit ${zahl(tOben)} cm de profondeur de chenal au niveau de référence, et ${zahl(PK.tugl)} cm dans les tronçons d’Oestrich et de Kaub. Kaub est le point le moins profond du parcours. Les armateurs règlent le chargement sur cette échelle (CCNR, 2023).</p>`) +
      (m ? `<p>${h(tag)}${DP}${LL('Pegel Kaub', 'échelle de Kaub')} <b>${zahl(m.w)} cm</b>${qK != null ? `, ${LL('Abfluss', 'débit')} <b>${zahl(qK)} m³/s</b>` : ''}.</p>` : ''));
    sc1.fuelle(1, LL(`<h3>Der Bezugswert GlW</h3><p>Der gleichwertige Wasserstand (GlW) ist der Niedrigwasser-Bezugswert der Schifffahrt. Er wird im langjährigen Mittel an 20 eisfreien Tagen im Jahr unterschritten. In Kaub liegt er bei ${zahl(GLW)} cm, das entspricht ${zahl(Q_GLW)} m³/s.</p><p class="formel">Fahrrinnentiefe = Pegel − GlW + ${zahl(TUG)} cm</p>`,
      `<h3>Le GlW, niveau de référence</h3><p>L’étiage équivalent (GlW) est le niveau de référence de la navigation en basses eaux. En moyenne pluriannuelle, il n’est pas atteint 20 jours sans glace par an. À Kaub, il se situe à ${zahl(GLW)} cm, soit ${zahl(Q_GLW)} m³/s.</p><p class="formel">Profondeur du chenal = niveau − GlW + ${zahl(TUG)} cm</p>`) +
      (zk ? `<p>${h(tag)}${DP}${zahl(m.w)} − ${zahl(GLW)} + ${zahl(TUG)} = <b>${zahl(zk.tiefe)} cm</b>. ${LL('Auslastung der Flotte bei diesem Stand', 'Taux de chargement de la flotte à ce niveau')}${DP}<b>${zahl(auslastung(m.w))} %</b>${m.w < AUSL.keine_unter ? LL(', unter 40 cm ist keine Schifffahrt möglich', ', sous 40 cm la navigation n’est plus possible') : ''} (${LL('ZKR', 'CCNR')}, 2023).</p>` : ''));
    sc1.fuelle(2, LL(`<h3>Sieben Abschnitte bis Kaub</h3><p>Von Iffezheim bis Kaub fliesst der Rhein frei. Die Strecke ist in ${RP.length} Abschnitte geteilt, jeder hat einen Richtpegel mit eigenem GlW. Auf der Karte heisst eine durchgezogene Linie volle Fahrrinnentiefe. Je kürzer die Striche, desto weiter liegt der Pegel unter dem GlW.</p>`,
      `<h3>Sept tronçons jusqu’à Kaub</h3><p>D’Iffezheim à Kaub, le Rhin coule librement. Le parcours est divisé en ${RP.length} tronçons, chacun avec une échelle de référence et son propre GlW. Sur la carte, un trait plein signifie pleine profondeur du chenal. Plus les tirets sont courts, plus le niveau est sous le GlW.</p>`) +
      (A.length ? `<p>${h(tag)}${DP}${LL(`${unter.length} von ${A.length} Abschnitten mit Wert liegen unter dem GlW.`, `${unter.length} tronçons sur ${A.length} avec valeur sont sous le GlW.`)} ${tief ? LL(`Am weitesten darunter: ${h(tief.p.name)} mit <b>${zahl(tief.zm.tiefe)} cm</b> statt ${zahl(tief.p.tugl)} cm.`, `Le plus bas : ${h(tief.p.name)} avec <b>${zahl(tief.zm.tiefe)} cm</b> au lieu de ${zahl(tief.p.tugl)} cm.`) : ''}</p>` : ''));
    sc1.fuelle(3, LL(`<h3>Basel bis Iffezheim ist gestaut</h3><p>Zwischen Basel und Iffezheim (Rheinkilometer ${zahl(meta.stau.von)} bis ${zahl(meta.stau.bis)}) halten ${stufen} Staustufen den Wasserstand. Die Fahrrinnentiefe hängt dort nicht vom Abfluss ab. Darum misst diese Seite die Fahrbarkeit in Kaub und nicht in Basel.</p>`,
      `<h3>De Bâle à Iffezheim, le Rhin est canalisé</h3><p>Entre Bâle et Iffezheim (kilomètres ${zahl(meta.stau.von)} à ${zahl(meta.stau.bis)} du Rhin), ${stufen} barrages maintiennent le niveau. La profondeur du chenal n’y dépend pas du débit. C’est pourquoi cette page mesure la navigabilité à Kaub et non à Bâle.</p>`) +
      (qB != null && qK ? `<p>${LL(`${h(tag)}: <b>${zahl(qB)} m³/s</b> aus Basel, ${zahl(100 * qB / qK)} % des Abflusses in Kaub.`, `${h(tag)} : <b>${zahl(qB)} m³/s</b> de Bâle, soit ${zahl(100 * qB / qK)} % du débit à Kaub.`)}</p>` : ''));
    sc1.fuelle(4, LL(`<h3>Seen und Zuflüsse</h3><p>Oberhalb von Basel zeigt die Strichbreite den Abfluss. Dreiecke sind regulierte Seen: Ein Wehr am Ausfluss bestimmt, wie viel Wasser weiterfliesst. Der Kreis ist der Bodensee, er hat kein Wehr.</p><p>Die ${reg.length} regulierten Seen haben zusammen <b>${zahl(fr)} km²</b>, der Bodensee <b>${zahl(fb)} km²</b>.</p>`,
      `<h3>Lacs et affluents</h3><p>En amont de Bâle, la largeur du trait indique le débit. Les triangles sont des lacs régulés : un barrage à l’exutoire détermine combien d’eau s’écoule. Le cercle est le lac de Constance, qui n’a pas de barrage.</p><p>Les ${reg.length} lacs régulés totalisent <b>${zahl(fr)} km²</b>, le lac de Constance <b>${zahl(fb)} km²</b>.</p>`));
    const g = aK ? gruppenWerte(aK).filter(x => x.da) : [];
    sc1.fuelle(5, LL(`<h3>Herkunft des Wassers in Kaub</h3>`, `<h3>Origine de l’eau à Kaub</h3>`) + (aK ? `<p>${h(tag)}${DP}<b>${zahl(qK)} m³/s</b> ${LL('in Kaub, geteilt nach Herkunft. Jeder Teil ist gemessen oder als Rest zwischen zwei Messstellen gerechnet.', 'à Kaub, répartis selon l’origine. Chaque part est mesurée ou calculée comme reste entre deux stations.')}</p>` +
      `<div class="band">${g.map(x => `<i class="${x.m}" style="flex:${Math.max(0, x.v).toFixed(1)} 0 0"></i>`).join('')}</div><div class="herk">${g.map(x => `<i class="${x.m}"></i><span>${h(x.n)}</span><b>${qz(x.v)}</b><b>${zahl(100 * x.v / qK)} %</b>`).join('')}</div>` : `<p>${T.keine}</p>`));
  }

  // ---- Kapitel 2: die Jahre
  const K2 = [2019, 2018, 2022, LETZTES].filter((j, i, a) => meta.jahre.includes(j) && a.indexOf(j) === i), D2 = {};
  let jetzt2 = null;
  const sc2 = scrolly('st2', K2.length + 1, i => zeige2(i));
  function zeige2(i) {
    const fig = $('jahrfig'), svg = $('jahrkaub'), j = K2[Math.min(i, K2.length - 1)], d = D2[j]; if (!d) return; jetzt2 = i;
    if (i < K2.length) { jahrGrafik(svg, d.Y, { titel: `${T.gTitel} ${j}` }); $('jahrlegende').innerHTML = jahrLegende(false, false);
      csvKnopf(fig, () => `rhein-kaub-${j}`, () => ({ titel: `${T.gTitel} ${j}`, ...jahrCsv(d.Y, null) })); }
    else { fehltGrafik(svg, d); $('jahrlegende').innerHTML = `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#g_e1)" stroke="#000"/></svg>${T.nw} ${d.ref.periode}</span><span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="#000"/></svg>${j}${DP}${d.von}–${d.bis}</span>`;
      csvKnopf(fig, () => `rhein-kaub-herkunft-${j}`, () => ({ titel: T.fTitel2, kopf: ['herkunft', `mittleres_niedrigwasser_m3s`, `tiefste_7_tage_${j}_m3s`], zeilen: d.gr.map(x => [x.n, x.ref, x.v]) })); }
  }
  function fehltGrafik(svg, d) {
    const B = Math.max(420, Math.min(1000, Math.round(svg.parentNode.clientWidth) || 800)), schmal = B < 600, L = 10, RR = schmal ? 70 : 90, O = 34, zh = 56, H = O + d.gr.length * zh + 10, max = Math.max(...d.gr.flatMap(x => [x.v, x.ref])), x = v => (B - L - RR) * Math.max(0, v) / max;
    let s = `<text class="fett" x="${L}" y="14">${T.fTitel2}, m³/s</text>`;
    d.gr.forEach((g, i) => { const y0 = O + i * zh;
      s += `<text x="${L}" y="${y0 + 12}">${h(g.n)}</text><rect x="${L}" y="${y0 + 18}" width="${x(g.ref).toFixed(1)}" height="12" fill="url(#g_e1)" stroke="#000"/><text x="${L + x(g.ref) + 6}" y="${y0 + 28}">${qz(g.ref)}</text>` +
        `<rect x="${L}" y="${y0 + 32}" width="${x(g.v).toFixed(1)}" height="12" fill="#000"/><text class="fett" x="${L + x(g.v) + 6}" y="${y0 + 43}">${qz(g.v)}</text>`; });
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
  }
  async function kapitel2() {
    for (const j of K2) {
      const Y = await jahr(j); if (!Y || !Y.q[KAUB] || !PK) continue;
      const k = kaubJahr(Y, OHNE), t = tiefsterTag(Y), bed = bedarfGlw(Y), ger = Y.q[KAUB].reduce((n, x, i) => n + (x != null && GERECHNET(statusAm(Y, KAUB, i))), 0);
      D2[j] = { Y, k, t, bed, ger };
      const letzter = j === LETZTES ? (() => { let i = Y.q[KAUB].length - 1; while (i > 0 && Y.q[KAUB][i] == null) i--; return datum(isoTag(j, i)); })() : null;
      const kopf = k.u0 ? LL(`<h3>${j}: ${k.u0} Tage unter dem GlW</h3>`, `<h3>${j} : ${k.u0} jours sous le GlW</h3>`) : LL(`<h3>${j}: kein Tag unter dem GlW</h3>`, `<h3>${j} : aucun jour sous le GlW</h3>`);
      const text = k.u0 ? LL(`<p>An <b>${k.u0} Tagen</b> lag der Pegel Kaub unter dem GlW${k.k0 ? `, an <b>${k.k0} Tagen</b> unter ${zahl(AUSL.keine_unter)} cm. Unter diesem Stand ist keine Schifffahrt möglich (ZKR, 2023)` : ''}. Tiefster Stand: <b>${zahl(t.w)} cm</b> am ${datum(isoTag(j, t.i))}, Fahrrinnentiefe ${zahl(k.t0)} cm statt ${zahl(PK.tugl)} cm.</p><p>Um den GlW an allen Tagen zu halten, fehlten <b>${zahl(bed)} Mio. m³</b>. Das ist die schraffierte Fläche unter der GlW-Linie.</p>`,
        `<p>L’échelle de Kaub est restée <b>${k.u0} jours</b> sous le GlW${k.k0 ? `, dont <b>${k.k0} jours</b> sous ${zahl(AUSL.keine_unter)} cm. Sous ce niveau, la navigation n’est plus possible (CCNR, 2023)` : ''}. Niveau le plus bas : <b>${zahl(t.w)} cm</b> le ${datum(isoTag(j, t.i))}, profondeur du chenal ${zahl(k.t0)} cm au lieu de ${zahl(PK.tugl)} cm.</p><p>Pour tenir le GlW tous les jours, il manquait <b>${zahl(bed)} mio m³</b>. C’est la surface hachurée sous la ligne du GlW.</p>`)
        : LL(`<p>Die schwarze Linie ist der Abfluss in Kaub, links in m³/s, rechts als Pegel in cm. Die gestrichelte Linie ist der GlW. ${j} blieb der Pegel an allen Tagen darüber. Tiefster Stand: <b>${zahl(t.w)} cm</b> am ${datum(isoTag(j, t.i))}, Fahrrinnentiefe ${zahl(k.t0)} cm.</p>`,
          `<p>La ligne noire est le débit à Kaub, à gauche en m³/s, à droite en niveau à l’échelle, en cm. La ligne en tirets est le GlW. En ${j}, le niveau est resté au-dessus tous les jours. Niveau le plus bas : <b>${zahl(t.w)} cm</b> le ${datum(isoTag(j, t.i))}, profondeur du chenal ${zahl(k.t0)} cm.</p>`);
      const zusatz = (letzter ? LL(`<p class="hinweis">Werte bis ${letzter}.`, `<p class="hinweis">Valeurs jusqu’au ${letzter}.`) : '') + (ger ? `${letzter ? ' ' : '<p class="hinweis">'}${LL(`An ${ger} Tagen ist der Abfluss aus dem gemessenen Wasserstand gerechnet.`, `Sur ${ger} jours, le débit est calculé à partir du niveau mesuré.`)}` : '') + (letzter || ger ? '</p>' : '');
      sc2.fuelle(K2.indexOf(j), kopf + text + zusatz);
    }
    // Letzter Schritt: woher das Wasser im tiefsten Abschnitt des letzten Jahres fehlte, gegen das mittlere Niedrigwasser
    const j = K2[K2.length - 1], d = D2[j], ref = meta.anteile[KAUB];
    if (d) {
      const b = nm7q(d.Y.q[KAUB]), alt = NETZ; let a = null;
      if (b) { NETZ = VOLL; a = anteile(d.Y.q, KAUB, b.beginn, b.beginn + 6); if (!a) { NETZ = KURZ; a = anteile(d.Y.q, KAUB, b.beginn, b.beginn + 6); } NETZ = alt; }
      if (a && ref && ref.nm7q) {
        const g0 = gruppenWerte(ref.nm7q), g1 = gruppenWerte(a);
        d.gr = g0.map((x, i) => ({ n: x.n, ref: x.v, v: g1[i].v })); d.ref = { periode: `${ref.periode[0]}–${ref.periode[1]}` }; d.von = datum(isoTag(j, b.beginn)).slice(0, -4); d.bis = datum(isoTag(j, b.beginn + 6));
        const fehl = d.gr.slice().sort((p, q) => (p.v - p.ref) - (q.v - q.ref))[0];
        sc2.fuelle(K2.length, LL(`<h3>${j}: wo das Wasser fehlte</h3><p>In den sieben trockensten Tagen (${d.von}–${d.bis}) flossen in Kaub <b>${zahl(a.ziel_mittel)} m³/s</b>. Das mittlere Niedrigwasser der Jahre ${d.ref.periode} liegt bei ${zahl(ref.nm7q.ziel_mittel)} m³/s. Die Grafik teilt beide Werte nach Herkunft.</p><p>Am meisten fehlte: ${h(fehl.n)}, <b>${vz(fehl.v - fehl.ref, 0)} m³/s</b>. Warum es fehlte, lässt sich aus den Abflüssen nicht ablesen.</p>`,
          `<h3>${j} : où l’eau a manqué</h3><p>Pendant les sept jours les plus secs (${d.von}–${d.bis}), le débit à Kaub était de <b>${zahl(a.ziel_mittel)} m³/s</b>. L’étiage moyen des années ${d.ref.periode} est de ${zahl(ref.nm7q.ziel_mittel)} m³/s. Le graphique répartit les deux valeurs selon l’origine.</p><p>Le plus grand manque : ${h(fehl.n)}, <b>${vz(fehl.v - fehl.ref, 0)} m³/s</b>. Les débits ne permettent pas de dire pourquoi elle a manqué.</p>`));
      }
    }
    zeige2(sc2.jetzt());
  }

  // ---- Kapitel 3: Rückhalt in drei Stufen
  const K3 = [2011, 2015, 2018, 2022, LETZTES].filter((j, i, a) => meta.jahre.includes(j) && a.indexOf(j) === i), D3 = {};
  let jahr3 = K3[K3.length - 1];
  const sc3 = scrolly('st3', 6, i => zeige3(i));
  function zeige3(i) {
    const d = D3[jahr3]; if (!d) return;
    const st = [0, 1, 1, 2, 3, 3][i], z = st ? d.st[st] : null;
    jahrGrafik($('szen'), d.Y, { titel: `${T.gTitel} ${jahr3}${st ? ` · ${T['st' + st]}` : ''}`, sim: z ? z.v.S.q[KAUB] : null, sim2: z ? z.r.S.q[KAUB] : null, speicher: z && z.v.S.O ? z.v.S.O.speicher : null });
    $('szenlegende').innerHTML = jahrLegende(!!z, !!z);
    csvKnopf($('szenfig'), () => `rhein-kaub-${jahr3}-stufe-${st}`, () => ({ titel: `${T.gTitel} ${jahr3}${st ? ` · ${T['st' + st]}` : ''}`, ...jahrCsv(d.Y, z) }));
  }
  const ergebnis = (d, z) => `<div class="rollen"><table class="erg"><thead><tr><th></th><th class="z">${T.gemessen}</th><th class="z">${T.eBest}</th><th class="z">${T.eRegel}</th></tr></thead><tbody>` +
    [[T.nUnter, d.k.u0, z.v.k.u1, z.r.k.u1], [T.aTage, d.k.k0, z.v.k.k1, z.r.k.k1], [T.nTief, d.k.t0, z.v.k.t1, z.r.k.t1], [`${T.aFlotte} %`, d.k.a0, z.v.k.a1, z.r.k.a1], [`${T.genutzt} ${T.mio}`, null, z.v.genutzt, z.r.genutzt]]
      .map(r => `<tr><td>${r[0]}</td>${r.slice(1).map((v, i) => `<td class="z${i ? ' blau' : ''}">${zahl(v)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';
  async function kapitel3() {
    const j = jahr3; let d = D3[j];
    if (!d) { const Y = await jahr(j); await nachbarn(j); if (!Y || !Y.q[KAUB] || !PK) return;
      d = D3[j] = { Y, k: kaubJahr(Y, OHNE), bed: bedarfGlw(Y), st: {} };
      for (const st of [1, 2, 3]) d.st[st] = { v: szenario(Y, st, 'glw'), r: szenario(Y, st, 'regel') }; }
    if (j !== jahr3) return;
    const w = $('k3wahl'); w.textContent = ''; w.append(knoepfe(T.jahr, K3.map(x => [String(x), String(x)]), String(j), v => { jahr3 = +v; kapitel3(); }));
    const reg = meta.seen.filter(s => s.reguliert), fr = reg.reduce((s, x) => s + x.flaeche_km2, 0), fb = meta.seen.filter(s => !s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0), cm1 = fr / 100;
    const q30 = 100e6 / (30 * SEK), hub = q => wAusQ(Q_GLW) - wAusQ(Q_GLW - q), frei = stufeCM(d.Y, 1, 0), v1 = reg.reduce((s, x) => s + frei[x.id] * x.flaeche_km2 / 100, 0);
    sc3.fuelle(0, LL(`<h3>Was ein Zentimeter ist</h3><p>Die regulierten Seen haben zusammen ${zahl(fr)} km². Ein Zentimeter mehr Seestand sind <b>${zahl(cm1, 1)} Mio. m³</b>. 100 Mio. m³, über 30 Tage abgegeben, sind ${zahl(q30, 1)} m³/s. Das hebt den Pegel Kaub beim GlW um rund ${zahl(hub(q30))} cm.</p><p>${j} fehlten für den GlW an allen Tagen <b>${zahl(d.bed)} Mio. m³</b>. Das wären ${zahl(d.bed / cm1)} cm auf allen regulierten Seen.</p>`,
      `<h3>Ce que vaut un centimètre</h3><p>Les lacs régulés totalisent ${zahl(fr)} km². Un centimètre de niveau en plus représente <b>${zahl(cm1, 1)} mio m³</b>. 100 mio m³ restitués en 30 jours font ${zahl(q30, 1)} m³/s. Cela relève l’échelle de Kaub d’environ ${zahl(hub(q30))} cm au GlW.</p><p>En ${j}, il manquait <b>${zahl(d.bed)} mio m³</b> pour tenir le GlW tous les jours. Cela ferait ${zahl(d.bed / cm1)} cm sur tous les lacs régulés.</p>`));
    sc3.fuelle(1, LL(`<h3>Zwei Rechenweisen</h3><p class="marke">Mit Voraussicht</p><p>Die Rechnung kennt alle Abflüsse des Jahres im Voraus, als wüsste man im Frühling schon, wie trocken der Herbst wird. Sie staut so viel, wie später gebraucht wird, und verteilt das Wasser auf alle tiefen Tage. Die tiefsten Tage werden am stärksten gehoben. Kein Betrieb kann besser sein, denn niemand kennt den Herbst im Voraus.</p><p class="marke">Betriebsregel</p><p>Die Rechnung kennt nur den heutigen Abfluss und den Speicherinhalt. Führt der Rhein in Kaub mehr als ${zahl(REGEL.stauAb)} m³/s, wird gestaut. Fällt Kaub unter den GlW, wird bis zum GlW aufgefüllt, höchstens mit der Menge, bei der ein voller Speicher ${REGEL.tage} Tage reicht. Ist der Speicher leer, gilt wieder der gemessene Abfluss.</p><p>In der Grafik ist die Rechnung mit Voraussicht blau durchgezogen, die Betriebsregel blau gestrichelt. Mit Voraussicht steigt der tiefste Stand. Mit der Betriebsregel sinkt die Zahl der Tage unter dem GlW, solange der Speicher reicht.</p>`,
      `<h3>Deux modes de calcul</h3><p class="marke">Avec prévision</p><p>Le calcul connaît d’avance tous les débits de l’année, comme si l’on savait au printemps à quel point l’automne sera sec. Il retient autant d’eau qu’il en faudra plus tard et la répartit sur tous les jours bas. Les jours les plus bas sont les plus relevés. Aucune exploitation ne peut faire mieux, car personne ne connaît l’automne d’avance.</p><p class="marke">Règle d’exploitation</p><p>Le calcul ne connaît que le débit du jour et le contenu du réservoir. Si le Rhin dépasse ${zahl(REGEL.stauAb)} m³/s à Kaub, on retient. Si Kaub passe sous le GlW, on complète jusqu’au GlW, au plus avec la quantité qui permet à un réservoir plein de tenir ${REGEL.tage} jours. Quand le réservoir est vide, le débit mesuré s’applique de nouveau.</p><p>Dans le graphique, le calcul avec prévision est en trait bleu plein, la règle d’exploitation en tirets bleus. Avec prévision, le niveau le plus bas monte. Avec la règle d’exploitation, le nombre de jours sous le GlW diminue tant que le réservoir suffit.</p>`));
    sc3.fuelle(2, LL(`<h3>Stufe 1: im heutigen Rahmen</h3><p>Die regulierten Seen stauen nur bis zu ihrer heutigen Hochwassergrenze. ${j} war dort Platz für höchstens ${zahl(v1)} Mio. m³. Gefüllt wird aus dem gemessenen Abfluss unterhalb des Sees, mit höchstens 20 % davon, und nur wenn Kaub mindestens 10 cm über dem GlW liegt. Reglemente, Hochwasserschutz und Ökologie lassen weniger zu als diese Rechnung.</p>`,
      `<h3>Niveau 1 : dans le cadre actuel</h3><p>Les lacs régulés ne retiennent que jusqu’à leur limite actuelle de hautes eaux. En ${j}, il y avait de la place pour ${zahl(v1)} mio m³ au plus. Le remplissage se fait à partir du débit mesuré en aval du lac, avec 20 % au plus de ce débit, et seulement si Kaub est au moins 10 cm au-dessus du GlW. Les règlements, la protection contre les crues et l’écologie en permettent moins que ce calcul.</p>`) + ergebnis(d, d.st[1]));
    sc3.fuelle(3, LL(`<h3>Stufe 2: neue Staukapazität</h3><p>Dieselben Seen, aber mit 50 cm über der heutigen Hochwassergrenze. Die Wehre gibt es schon. Nötig wären neue Reglemente und Schutzbauten an den Ufern.</p>`,
      `<h3>Niveau 2 : nouvelle capacité de retenue</h3><p>Les mêmes lacs, mais avec 50 cm au-dessus de la limite actuelle de hautes eaux. Les barrages existent déjà. Il faudrait de nouveaux règlements et des ouvrages de protection sur les rives.</p>`) + ergebnis(d, d.st[2]));
    sc3.fuelle(4, LL(`<h3>Stufe 3: mit dem Bodensee</h3><p>Dazu 50 cm auf dem Bodensee, mit ${zahl(fb)} km² die grösste Fläche. Der Bodensee ist nicht reguliert. Der Kanton Thurgau ist seit einer Volksabstimmung von 1973 durch seine Verfassung verpflichtet, sich gegen Eingriffe in die natürlichen Verhältnisse von See und Rhein zu wenden (§ 76 Abs. 3 KV). Baden-Württemberg hat 1995 die Nutzung als Rückhaltebecken abgelehnt. KHR (2018) und IGKB (2024) halten eine Regulierung für kaum realisierbar.</p>`,
      `<h3>Niveau 3 : avec le lac de Constance</h3><p>En plus, 50 cm sur le lac de Constance, la plus grande surface avec ${zahl(fb)} km². Le lac de Constance n’est pas régulé. Depuis une votation populaire de 1973, la constitution du canton de Thurgovie oblige le canton à s’opposer aux atteintes aux conditions naturelles du lac et du Rhin (§ 76, al. 3). Le Bade-Wurtemberg a refusé en 1995 de l’utiliser comme bassin de rétention. La CHR (2018) et l’IGKB (2024) jugent une régulation guère réalisable.</p>`) + ergebnis(d, d.st[3]) +
      LL(`<p class="hinweis">Zum Vergleich: Das Regulierreglement von 1973 rechnete mit 90 m³/s Zuschuss von Oktober bis Dezember, 15 cm mehr Fahrwassertiefe und 8 % mehr Ladung (IGKB, 2024). Die Abflusskurve dieser Seite ergibt für 90 m³/s beim GlW ${zahl(hub(90))} cm.</p>`,
        `<p class="hinweis">À titre de comparaison : le règlement de régulation de 1973 prévoyait un apport de 90 m³/s d’octobre à décembre, 15 cm de profondeur en plus et 8 % de chargement en plus (IGKB, 2024). La courbe de tarage de cette page donne ${zahl(hub(90))} cm pour 90 m³/s au GlW.</p>`));
    const urteil = [1, 2, 3].map(st => { const z = d.st[st], ok = z.r.k.u1 === 0 || z.v.k.u1 === 0;
      return `<tr><td>${T['st' + st]}</td><td>${!d.k.u0 ? T.unnoetig : ok ? T.ja : T.nein}</td><td class="z blau">${zahl(z.v.k.u1)}</td><td class="z blau">${zahl(z.r.k.u1)}</td></tr>`; }).join('');
    sc3.fuelle(5, LL(`<h3>GlW an allen Tagen</h3><p>${j} hätte es dafür <b>${zahl(d.bed)} Mio. m³</b> gebraucht. Die Tabelle zeigt, wie viele Tage unter dem GlW je Stufe bleiben.</p>`, `<h3>Le GlW tous les jours</h3><p>En ${j}, il aurait fallu <b>${zahl(d.bed)} mio m³</b>. Le tableau indique combien de jours restent sous le GlW à chaque niveau.</p>`) +
      `<div class="rollen"><table class="erg"><thead><tr><th>${T.stufe}</th><th>${T.glwImmer}</th><th class="z">${T.eBest}</th><th class="z">${T.eRegel}</th></tr></thead><tbody>${urteil}</tbody></table></div>` +
      LL(`<p>Der Speicher füllt sich nicht ganz, wenn im Frühsommer wenig Wasser kommt. Gestaut wird nur, wenn Kaub über dem GlW liegt, und nie mehr als 10 % des Abflusses in Kaub. Der Simulator unten rechnet jede Stufe für jedes Jahr.</p>`,
        `<p>Le réservoir ne se remplit pas entièrement quand il arrive peu d’eau au début de l’été. On ne retient que si Kaub est au-dessus du GlW, et jamais plus de 10 % du débit à Kaub. Le simulateur ci-dessous calcule chaque niveau pour chaque année.</p>`));
    zeige3(sc3.jetzt());
  }
  let breite = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - breite) < 40) return; breite = innerWidth; map.invalidateSize(); if (jetzt2 != null) zeige2(jetzt2); zeige3(sc3.jetzt()); });

  function csvBestehend(R) {
    const Y = R.Y, S = R.S, tag = Y && R.i1 != null ? isoTag(Z.jahr, R.i1) : '';
    if ($('herkunft').innerHTML && R.zeige) csvKnopf($('herkunft'), () => `rhein-herkunft-${kurz(ST[Z.ziel]).toLowerCase()}`, () => ({ titel: `${T.herkunft}, ${R.datumText}`, kopf: ['herkunft', 'm3s', 'prozent'], zeilen: gruppenWerte(R.zeige).filter(x => x.da).map(x => [x.n, x.v, 100 * x.v / R.zeige.ziel_mittel]) }));
    csvKnopf($('laengsfig'), () => `rhein-laengsschnitt-${tag}`, () => ({ titel: `${T.lTitel}, ${tag}`, kopf: ['km_von', 'km_bis', 'richtpegel', 'pegel_cm', 'GlW_cm', 'fahrrinnentiefe_cm', 'fahrrinnentiefe_simuliert_cm', 'soll_bei_GlW_cm'],
      zeilen: abschnitte(R).map(({ p, m, zm, zs }) => [p.von, p.bis, p.name, m ? m.w : null, p.glw, zm ? zm.tiefe : null, zs ? zs.tiefe : null, p.tugl]) }));
    if (!Y) return;
    const n = (Y.q[BASEL] || []).length, tage = fn => { const z = []; for (let i = 0; i < n; i++) { const r = fn(i); if (r) z.push([isoTag(Y.jahr, i), ...r]); } return z; };
    csvKnopf($('bandfig'), () => `rhein-fahrbarkeit-${Y.jahr}`, () => ({ titel: `${T.bTitel} ${Y.jahr}`, kopf: ['datum', ...RP.flatMap(p => [`tiefe_${p.name}_cm`, `tiefe_${p.name}_simuliert_cm`])],
      zeilen: tage(i => { const r = RP.flatMap(p => { const m = pegelstand(Y, S, p, i, false), s = S && S.O ? pegelstand(Y, S, p, i, true) : null; return [m ? zustand(m.w, p).tiefe : null, s ? zustand(s.w, p).tiefe : null]; }); return r.some(v => v != null) ? r : null; }) }));
    if (!S || !S.O) return;
    const O = S.O, id = S.zid;
    csvKnopf($('verlauffig'), () => `rhein-rueckhalt-${Y.jahr}`, () => ({ titel: `${T.simTitel} ${Y.jahr}, ${T.stText[Z.stufe]}`, kopf: ['datum', `Q_${id}_m3s`, `Q_${id}_mit_Rueckhalt_m3s`, 'abgabe_m3s', 'rueckhalt_m3s', 'entlastung_m3s', 'speicher_Mio_m3'],
      zeilen: tage(i => Y.q[id][i] == null ? null : [Y.q[id][i], S.q[id][i], O.abgabe[i], O.rueck[i], O.entl[i], O.speicher[i] / 1e6]) }));
    const seen = meta.seen.filter(s => CM[s.id] > 0 && Y.w[s.id]);
    csvKnopf($('seefig'), () => `rhein-seen-${Y.jahr}`, () => ({ titel: `${T.seeG} ${Y.jahr}`, kopf: ['datum', ...seen.flatMap(s => [`${s.id}_gemessen_m`, `${s.id}_zusatzstau_cm`])],
      zeilen: tage(i => seen.flatMap(s => { const lz = S.lz + (s.knoten === BODENSEE ? BODENSEE_TAGE : 0), teil = CM[s.id] * s.flaeche_km2 * 1e4 / S.V; return [Y.w[s.id][i], i + lz < n ? 100 * teil * O.speicher[i + lz] / (s.flaeche_km2 * 1e6) : 0]; })) }));
  }
  // ------------------------------------------------------------ Ablauf
  let lauf_ = 0;
  async function alles(nurWerte) {
    const nr = ++lauf_, R = await rechnen();
    if (nr !== lauf_) return;
    if (!nurWerte) { wahlZeichnen(R.Y); simWahl(R); }
    else { const d = $('wahl').querySelector('input[type=date]'); if (d && Z.tag != null) d.value = isoTag(Z.jahr, Z.tag); }
    datenZeichnen(R); lageZeichnen(R); fahrbarZeichnen(R); laengsschnitt(R); jahresband(R); karteZeichnen(R); herkunftZeichnen(R); bilanzZeichnen(R); seenZeichnen(R); simZeichnen(R); herleitung(R); kapitel1(R); csvBestehend(R);
  }
  window.rhin = { szenario, jahr, nachbarn, bedarfGlw };     // für Prüfungen in der Konsole
  simSeen(); alles(); kapitel2(); kapitel3(); jahresvergleich();
})();
