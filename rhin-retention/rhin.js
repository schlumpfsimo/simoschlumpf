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
    mio: 'mio m³', aTage: 'Jours sous 40 cm (pratiquement pas de navigation)', aFlotte: 'Capacité de chargement utilisable d’un bateau', aUnter: 'moyenne des jours sous le GlW', aHinweis: 'estimation d’après la CCNR', seeWahl: 'Montrer le remplissage et la vidange pour', seeG: 'Niveau du lac, m s. m.', seeMit: 'avec retenue', seeHoch: 'limite de hautes eaux', seeTief: 'limite de basses eaux', seeMax: 'Surélévation maximale', seeFuell: 'Remplissage', seeLeer: 'Vidange', seeAbstand: 'Plus petite marge jusqu’à la limite de hautes eaux', seeKein: 'Aucune surélévation n’est calculée pour ce lac cette année.',
    fTitel: 'Navigabilité par tronçon', fAbschnitt: 'Tronçon', fPegel: 'Échelle de référence', fW: 'Niveau cm', fGlw: 'GlW cm', fT: 'Profondeur du chenal cm', fSoll: 'au GlW', fZustand: 'État', fStau: 'Bâle–Iffezheim', fStauText: 'Rhin canalisé : les barrages maintiennent le chenal, qui ne dépend pas ici du débit', fStufen: 'barrages',
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
    simTitel: 'Retenue pour la navigation', simLead: 'Seule la capacité supplémentaire des lacs se règle. La référence de la restitution est l’étiage équivalent (GlW) à l’échelle de Kaub : chaque relèvement sous le GlW compte. Le calcul relève d’abord les jours les plus bas à un niveau commun L*, au plus jusqu’au GlW, et ne retient que lorsque Kaub est au-dessus du GlW.', verlaufFuer: 'Courbe pour', abgabeTitel: 'Restitution (en haut) et retenue (en bas) aux lacs, m³/s', wirktSpaeter: 'effet à Kaub retardé, jours :', gAareO: 'Aar : lacs de Thoune et de Brienz', gAareJ: 'Aar : lacs du pied du Jura', seeTitel: 'Restitution et retenue par groupe de lacs', sAnteil: 'Part', sVol: 'Restitué mio m³', sMaxA: 'Restitution max. m³/s', sMaxR: 'Retenue max. m³/s', sOrt: 'Station en aval', sMin: 'Débit minimal à cette station m³/s', seeHinweis: 'Les lacs se partagent restitution et retenue au prorata de leur capacité supplémentaire. Pour chaque lac : retenue d’au plus 20 % du débit à la station en aval et jamais en dessous du débit minimal mesuré de l’année à cette station.', zielAbgabe: 'Mode de calcul', zGlw: 'Avec prévision', zRegel: 'Règle d’exploitation', zMin: 'Relever sans plafond', rStau: 'Retenue dès (Kaub, m³/s)', rTage: 'Autonomie (jours)', entlTitel: 'Délestage dû à la limite de hautes eaux', vergleich: 'Profondeur minimale du chenal à Kaub', mitVor: 'avec prévision', ohneVor: 'règle d’exploitation', spielraum: 'Jusqu’à la limite de hautes eaux', gehoben: 'Jours relevés', imMittel: 'en moyenne', rund: 'environ', bedarf: 'Besoin pour tous les jours', bedarfText: 'Somme des déficits ; sur tous les lacs régulés, cela ferait', nieUnter: 'Kaub ne passe jamais sous le GlW cette année.', ohneKaub: 'Pas de valeurs pour Kaub cette année ; le calcul relève le débit minimal à la station du bilan.',
    alle: 'Tous les lacs régulés (cm)', band: 'Tranche utilisée 1991–2020', jecm: 'Par cm', zusatz: 'Capacité suppl.', vol: 'Volume', grenzenK: 'Limites m s. m. · mio m³', volumen: 'Capacité totale',
    gBodensee: 'Lac de Constance (non régulé, hypothétique)', gAare: 'Aar', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Plus faible débit journalier', nm7qSim: 'NM7Q', pegelMin: 'Niveau le plus bas à Kaub', unterGlw: 'Jours sous le GlW à Kaub', abgabeTage: 'Restitution', rueckTage: 'Retenue', tageW: 'jours', schwellen: 'Seuils', genutzt: 'Volume utilisé',
    ausschnitt: 'Affichage', ganz: 'Année', phase: 'Étiage', diff: 'Écart', inhalt: 'Contenu du réservoir, mio m³', keinGewinn: 'Pas de gain : avant le plus faible débit, aucun débit de l’année de stockage ne permettait de retenir.',
    keinJahr: 'Pas de valeurs journalières pour cette station et cette année.', nurTag: 'Choisissez une capacité supérieure à zéro.', geschHinweis: 'jours, le débit à Kaub est calculé à partir du niveau mesuré, non mesuré.',
    bisMaerz: 'jusqu’au 31.3.', simHinweis: 'Le calcul se fait par années de stockage du 1er avril au 31 mars. Le réservoir commence vide le 1er avril de l’année précédente. De janvier à mars, la retenue continue dès que Kaub est au moins 10 cm au-dessus du GlW. Cette eau de l’hiver passe à l’année de stockage suivante. Chaque lac a son propre contenu. On retient au plus 10 % du débit à Kaub et au plus 20 % du débit en aval d’un lac. Le remplissage s’arrête 20 cm sous la limite de hautes eaux. Si un lac dépasse la limite, il restitue l’excédent, au plus 20 % du débit en aval. Si cela ne suffit pas, le jour compte comme jour au-dessus de la limite. Les règlements et l’écologie ne sont pas pris en compte.',
    herTitel: 'Méthode de calcul', herLead: 'Chaque nombre de cette page découle des formules ci-dessous, ici avec les valeurs du jour affiché.',
    methode: 'Hypothèses et lacunes', quellen: 'Sources', standT: 'État des données', monate: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    legende: 'Rhin dès Bâle : navigabilité par tronçon (trait plein = pleine profondeur, plus les tirets sont courts, plus on est sous le GlW). Barres en travers : barrages. En amont de Bâle et sur les affluents : largeur du trait = débit. Noir : débit de la station amont. Gris : apport du bassin intermédiaire (reste calculé). Carré : station. Triangle : lac régulé. Cercle : lac non régulé. Fond : swisstopo et OpenStreetMap, en trame de points.', fehlt: 'Les données n’ont pas pu être chargées.',
    meth: ['Temps de parcours : hypothèses en jours entiers (Bâle–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sinon 0 ; Bâle–Kaub 2), non mesurés. Vérifié par corrélation croisée des valeurs journalières : Bâle–Maxau 0,8, Maxau–Worms 0,8, Bâle–Kaub 2,2 jours.', 'Le palier 1 est une borne supérieure : il utilise toute la place jusqu’à la limite de hautes eaux. Les règlements, la protection contre les crues et l’écologie en permettent moins.',
      'Stations allemandes : valeurs journalières contrôlées de l’annuaire (2008–2025), puis données brutes des 31 derniers jours. Neckar : 2010–2020. Pour Kaub, Mayence, Worms, Bingen et le Main, les moyennes journalières du portail du HLNUG comblent la lacune depuis l’annuaire. Le débit à Kaub y est calculé à partir du niveau mesuré et désigné comme tel. Pour Maxau, Spire et Mannheim, les valeurs manquent du 1.1.2026 à la mi-octobre 2026.',
      'Si les stations entre Bâle et Kaub manquent, le bilan regroupe tout l’aval de Bâle en un seul reste.',
      'Lacs : surface constante. Surfaces et limites d’après les fiches OFEV « Seeregulierung » (2020). Pour les lacs de Neuchâtel et de Morat, la limite retenue est le début du degré de danger 4 de l’OFEV. Lac de Constance : 536 km², dont 473 pour le lac supérieur et 63 pour le lac inférieur (IGKB).', 'Kaub 2026 : pour les jours autour de 0 cm et en dessous, le portail ne fournit pas de valeur. Ces jours sont déduits de l’échelle de Bingen (écart moyen entre les deux échelles en basses eaux) et désignés comme tels.', 'Les jours sous le GlW sont comptés pour toutes les années avec le GlW actuel de 77 cm. Jusqu’en 2022, il était de 78 cm.', 'La protection contre un passage sous le GlW vaut pour Kaub. Certains jours, la retenue peut faire passer d’autres échelles sous leur GlW.',
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.',
      'Objectifs C et D : le choix des jours relevés est une approximation (d’abord les jours avec le plus petit écart au GlW).',
      'Avec retenue, un jour ne compte comme jour sous le GlW ou sous 40 cm que si le niveau est au moins 1 cm en dessous. Cette tolérance couvre l’écart entre le niveau mesuré et la courbe de tarage : un jour relevé au GlW ne doit pas compter comme jour en dessous à cause de cet écart.'],   // FR provisorisch
  } : {
    titel: 'Rhein · Fahrbarkeit und Rückhalt', lead: 'Zwei Fragen: Was bedingt die Fahrbarkeit des Rheins zwischen Basel und Kaub? Und was brächte es, wenn die Seen Wasser zurückhielten und bei Niedrigwasser abgäben? Die Seite zeigt, was gemessen ist, und rechnet nach, was wäre. Sie ist als Grundlage für eine Diskussion gedacht.',
    datTitel: 'Datensatz', datLead: 'Alle Reihen, auf denen diese Seite beruht: Tagesmittel je Messstelle, mit Quelle, Zeitraum und Status. Die Tageswerte lassen sich je Jahr ansehen und als CSV beziehen.', dReihe: 'Reihe', dGroesse: 'Grösse', dZeit: 'Zeitraum', dTage: 'Tage', dStatus: 'Status (Tage)', dQ: 'Abfluss', dW: 'Wasserstand am Pegel', dSee: 'Seestand', dZeigen: 'Tageswerte anzeigen:', dCsvJahr: 'CSV dieses Jahres', dCsvAlle: 'CSV aller Jahre', dLaedt: 'lädt', dLegende: '° roh · * Abfluss aus Wasserstand gerechnet · leer: kein Wert. Abfluss in m³/s, Pegel in cm, Seestand in m ü. M.', dDatum: 'Datum',
    lTitel: 'Längsschnitt Basel–Kaub: verfügbare Fahrrinnentiefe, cm', lStau: 'staugeregelt', lSoll: 'Soll bei GlW', lKm: 'Rheinkilometer', bTitel: 'Fahrbarkeit im Jahr', jTitel: 'Jahresvergleich Kaub', jJahr: 'Jahr', jBedarf: 'Bedarf bis GlW Mio. m³', jRechnet: 'rechnet …', jGrafik: 'Kleinste Fahrrinnentiefe in Kaub je Jahr, cm', kTitel: 'Nutzen nach Staukapazität: kleinste Fahrrinnentiefe in Kaub, cm', kX: 'zusätzliche Staukapazität, Mio. m³', kHeute: 'gewählt', kText: 'Die Kurve skaliert die gewählten Stauhöhen aller Seen gemeinsam.', kErreicht: 'Der GlW wird erreicht ab rund', kNie: 'Der GlW wird in diesem Bereich nicht erreicht.',
    mio: 'Mio. m³', aTage: 'Tage unter 40 cm (praktisch keine Schifffahrt)', aFlotte: 'Nutzbare Ladekapazität eines Schiffs', aUnter: 'Mittel der Tage unter GlW', aHinweis: 'Schätzung nach ZKR', seeWahl: 'Füllung und Entleerung zeigen für', seeG: 'Seestand, m ü. M.', seeMit: 'mit Rückhalt', seeHoch: 'Hochwassergrenze', seeTief: 'Niederwassergrenze', seeMax: 'Grösster Zusatzstau', seeFuell: 'Gefüllt wird', seeLeer: 'Geleert wird', seeAbstand: 'Kleinster Abstand zur Hochwassergrenze', seeKein: 'Für diesen See ist in diesem Jahr kein Zusatzstau gerechnet.',
    fTitel: 'Fahrbarkeit nach Abschnitten', fAbschnitt: 'Abschnitt', fPegel: 'Richtpegel', fW: 'Pegel cm', fGlw: 'GlW cm', fT: 'Fahrrinnentiefe cm', fSoll: 'bei GlW', fZustand: 'Zustand', fStau: 'Basel–Iffezheim', fStauText: 'staugeregelt: Die Staustufen halten die Fahrrinne, sie hängt hier nicht vom Abfluss ab', fStufen: 'Staustufen',
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
    simTitel: 'Rückhalt für die Schifffahrt', simLead: 'Einstellen lässt sich nur die zusätzliche Staukapazität der Seen. Bezugswert der Abgabe ist der gleichwertige Wasserstand (GlW) am Pegel Kaub: Jede Anhebung unter dem GlW zählt. Die Rechnung hebt die tiefsten Tage zuerst auf ein gemeinsames Niveau L*, höchstens bis zum GlW, und staut nur, wenn Kaub über dem GlW liegt.', verlaufFuer: 'Verlauf für', abgabeTitel: 'Abgabe (oben) und Rückhalt (unten) an den Seen, m³/s', wirktSpaeter: 'Wirkung in Kaub später, Tage:', gAareO: 'Aare: Thuner- und Brienzersee', gAareJ: 'Aare: Jurarandseen', seeTitel: 'Abgabe und Rückhalt je Seegruppe', sAnteil: 'Anteil', sVol: 'Abgegeben Mio. m³', sMaxA: 'Grösste Abgabe m³/s', sMaxR: 'Grösster Rückhalt m³/s', sOrt: 'Messstelle unterhalb', sMin: 'Kleinster Abfluss dort m³/s', seeHinweis: 'Die Seen teilen sich Abgabe und Rückhalt im Verhältnis ihrer zusätzlichen Kapazität. Je See gilt: Rückhalt höchstens 20 % des Abflusses an der Messstelle unterhalb und nie unter deren gemessenen Jahrestiefstwert.', zielAbgabe: 'Rechenweise', zGlw: 'Mit Voraussicht', zRegel: 'Betriebsregel', zMin: 'Ohne Deckel heben', rStau: 'Stauen ab Kaub m³/s', rTage: 'Reichweite Tage', entlTitel: 'Entlastung wegen Hochwassergrenze', vergleich: 'Kleinste Fahrrinnentiefe Kaub', mitVor: 'mit Voraussicht', ohneVor: 'Betriebsregel', spielraum: 'Bis Hochwassergrenze', gehoben: 'Gehobene Tage', imMittel: 'im Mittel', rund: 'rund', bedarf: 'Bedarf für alle Tage', bedarfText: 'Summe der Fehlbeträge; auf allen regulierten Seen wären das', nieUnter: 'Kaub liegt in diesem Jahr nie unter dem GlW.', ohneKaub: 'Für dieses Jahr gibt es keine Werte für Kaub; gerechnet ist «Kleinsten Abfluss heben» an der Bilanz-Messstelle.',
    alle: 'Alle regulierten Seen (cm)', band: 'Genutztes Band 1991–2020', jecm: 'Je cm', zusatz: 'Zusätzliche Kapazität', vol: 'Volumen', grenzenK: 'Reguliergrenzen m ü. M. · Mio. m³', volumen: 'Kapazität gesamt',
    gBodensee: 'Bodensee (nicht reguliert, hypothetisch)', gAare: 'Aare', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Kleinster Tagesabfluss', nm7qSim: 'NM7Q', pegelMin: 'Tiefster Pegel Kaub', unterGlw: 'Tage unter GlW in Kaub', abgabeTage: 'Abgabe', rueckTage: 'Rückhalt', tageW: 'Tage', schwellen: 'Schwellen', genutzt: 'Genutztes Volumen',
    ausschnitt: 'Ausschnitt', ganz: 'Jahr', phase: 'Niedrigwasser', diff: 'Differenz', inhalt: 'Speicherinhalt, Mio. m³', keinGewinn: 'Kein Gewinn: Vor dem kleinsten Abfluss gab es im Speicherjahr keinen Abfluss, bei dem gestaut werden durfte.',
    keinJahr: 'Für diese Messstelle liegen in diesem Jahr keine Tageswerte vor.', nurTag: 'Wähle eine Kapazität grösser als null.', geschHinweis: 'Tagen ist der Abfluss in Kaub aus dem gemessenen Wasserstand gerechnet, nicht gemessen.',
    bisMaerz: 'bis 31.3.', simHinweis: 'Gerechnet wird in Speicherjahren vom 1. April bis 31. März. Der Speicher beginnt am 1. April des Vorjahres leer. Von Januar bis März wird zusätzlich gestaut, sobald Kaub mindestens 10 cm über dem GlW liegt. Dieses Wasser aus dem Winter geht ins nächste Speicherjahr. Jeder See führt seinen eigenen Inhalt. Gestaut werden höchstens 10 % des Abflusses in Kaub und höchstens 20 % des Abflusses unterhalb eines Sees. Gefüllt wird bis 20 cm unter die Hochwassergrenze. Steigt ein See über die Grenze, gibt er den Überschuss ab, höchstens 20 % des Abflusses unterhalb. Reicht das nicht, zählt der Tag als Tag über der Grenze. Reglemente und Ökologie sind nicht berücksichtigt.',
    herTitel: 'Herleitung', herLead: 'Jede Zahl dieser Seite folgt aus den Formeln unten, hier mit den Werten des angezeigten Tages.',
    methode: 'Annahmen und Lücken', quellen: 'Quellen', standT: 'Datenstand', monate: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    legende: 'Rhein ab Basel: Fahrbarkeit je Abschnitt (durchgezogen = volle Fahrrinnentiefe, je kürzer die Striche, desto weiter unter dem GlW). Balken quer zum Rhein: Staustufen. Oberhalb von Basel und an den Zuflüssen: Strichbreite = Abfluss. Schwarz: Abfluss der Messstelle oberhalb. Grau: Zuwachs aus dem Zwischengebiet (gerechneter Rest). Quadrat: Messstation. Dreieck: regulierter See. Kreis: nicht regulierter See. Grundkarte: swisstopo und OpenStreetMap, als Punkteraster.', fehlt: 'Die Daten konnten nicht geladen werden.',
    meth: ['Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sonst 0; Basel–Kaub 2), nicht gemessen. Geprüft per Kreuzkorrelation der Tageswerte: Basel–Maxau 0,8, Maxau–Worms 0,8, Basel–Kaub 2,2 Tage.', 'Stufe 1 ist eine Obergrenze: Sie nutzt den ganzen Platz bis zur Hochwassergrenze. Reglemente, Hochwasserschutz und Ökologie lassen weniger zu.',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Jahrbuch (2008–2025), danach Rohdaten der letzten 31 Tage. Neckar: 2010–2020. Für Kaub, Mainz, Worms, Bingen und den Main schliessen die Tagesmittel aus dem Pegelportal des HLNUG die Lücke seit dem Jahrbuch. Der Abfluss in Kaub ist dort aus dem gemessenen Wasserstand gerechnet und so bezeichnet. Für Maxau, Speyer und Mannheim fehlen die Werte vom 1.1.2026 bis Mitte Oktober 2026.',
      'Fehlen die Pegel zwischen Basel und Kaub, fasst die Bilanz alles unterhalb von Basel zu einem Rest zusammen.',
      'Seen: konstante Fläche. Flächen und Grenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020). Für Neuenburger- und Murtensee gilt als Grenze der Beginn der Gefahrenstufe 4 des BAFU. Bodensee: 536 km², davon Obersee 473 und Untersee 63 km² (IGKB).', 'Kaub 2026: Für die Tage um und unter 0 cm liefert das Pegelportal keinen Wert. Diese Tage sind aus dem Pegel Bingen abgeleitet (mittlerer Abstand der beiden Pegel bei Niedrigwasser) und so bezeichnet.', 'Die Tage unter dem GlW sind für alle Jahre mit dem heutigen GlW von 77 cm gezählt. Bis 2022 galt 78 cm.', 'Der Schutz vor einem Absinken unter den GlW gilt für Kaub. An einzelnen Tagen kann der Rückhalt andere Pegel unter ihren GlW drücken.',
      'Es wird nichts interpoliert. Fehlt ein Wert, fehlt das Ergebnis.',
      'Ziel C und D: Die Auswahl der gehobenen Tage ist eine Näherung (zuerst die Tage mit der kleinsten Lücke zum GlW).',
      'Mit Rückhalt zählt ein Tag erst als Tag unter dem GlW oder unter 40 cm, wenn der Pegel mindestens 1 cm darunter liegt. Die Toleranz deckt die Abweichung zwischen gemessenem Pegel und Abflusskurve: Ein auf den GlW gehobener Tag soll nicht wegen dieser Abweichung als Tag darunter zählen.'],
  };
  Object.assign(T, FR ? {
    lead: 'Le débit du Rhin détermine la charge qu’un bateau peut emporter. La partie 1 montre, à partir des débits mesurés, de quoi dépend la navigabilité jusqu’à Kaub. La partie 2 calcule ce qu’apporterait une retenue d’eau dans les lacs, restituée à l’étiage. La page sert de base à une discussion.',
    teil1: 'Partie 1', teil1T: 'Débit et navigabilité jusqu’à Kaub', teil1L: 'Combien d’eau arrive à Kaub, d’où elle vient et à quelle profondeur les bateaux peuvent naviguer. Uniquement des valeurs mesurées.', teil2: 'Partie 2', teil2T: 'La retenue dans les lacs', teil2L: 'Ce qu’apporterait une retenue d’eau dans les lacs, restituée à l’étiage. Calculé avec les débits mesurés d’une année.', anhang: 'Annexe', anhangT: '', anhangL: 'Méthode de calcul, jeu de données et données manquantes.', bilTitel: 'Bilan du jour affiché', bilLead: 'Origine de l’eau à Kaub, chaque composante du bilan et les lacs au jour choisi dans la partie 1.',
    k1Titel: '1 Le Rhin jusqu’à Kaub', k1Lead: 'Les chiffres de ce chapitre valent pour le jour choisi. Par défaut, c’est le dernier jour avec des valeurs complètes. Le GlW est le niveau de référence de la navigation en basses eaux, 77 cm à Kaub.',
    k2Titel: '2 Les années', k2Lead: 'Le débit à Kaub en moyennes journalières, année après année. Les jours sous le GlW sont hachurés.',
    k3Titel: '3 Comment agit la retenue', k3Lead: 'Les lacs retiennent de l’eau au début de l’été et la restituent à l’étiage. Ce chapitre fait le calcul avec les débits mesurés de l’année choisie, en trois paliers.',
    simTitel: '4 Calculateur de rétention', simLead: 'Pour l’année choisie : le stockage qu’il faudrait, ce qu’apporte une retenue donnée à Kaub et ce qu’elle signifie pour les lacs. Les détails s’ouvrent là où ils servent.',
    herTitel: '5 Méthode de calcul', datTitel: '6 Jeu de données', fehlTitel: 'Données manquantes', fehlLead: 'Ces données manquent encore à la page. La liste est classée selon l’effet sur le résultat.', fWas: 'Ce qui manque', fWozu: 'Ce que cela change', fWer: 'Source possible',
    csv: 'Télécharger le CSV', csvQuelle: 'Sources : OFEV (data.bafu.admin.ch) ; WSV, données mises à disposition par la BfG ; HLNUG. Calculs : simoschlumpf.ch/rhin-retention',
    gTitel: 'Débit à Kaub', g40: 'en dessous, pratiquement pas de navigation', gBest: 'avec retenue, avec prévision', gRegel: 'avec retenue, règle d’exploitation', gUnter: 'sous le GlW', gHub: 'relèvement', gSchnitt: 'Axe coupé à 2 000 m³/s.',
    fTitel2: 'Débit à Kaub selon l’origine',
    stufe: 'Palier', rk1: '1 Stockage nécessaire', rk2: '2 Choisir la retenue', rk3: '3 Effet à Kaub', rk4: '4 Conséquences pour les lacs', rk1m: 'Méthode de calcul', rk2a: 'Régler lac par lac ou librement en mio m³', rk2b: 'Règles de retenue et de restitution', rk3m: 'Autres indicateurs et graphiques', rk4m: 'Groupes de lacs et lacs en détail', rkOhne: 'sans', rkBod: 'Inclure le lac de Constance (non régulé)', rkSkala: 'Stockage en mio m³', rkNoetigR: 'nécessaire, règle d’exploitation', rkNoetigV: 'nécessaire, avec prévision', rkNicht: 'pas atteignable', rkReal: 'Règle d’exploitation', rkBest: 'avec prévision', rkMax: 'au plus', rkHwT: 'jours au-dessus de la limite de hautes eaux', stBod: 'En plus, le lac de Constance retient le même supplément. Il n’est pas régulé ; la CHR (2018) juge une régulation politiquement difficile à réaliser.', rkHwSatz: 'Un lac serait au-dessus de sa limite actuelle de hautes eaux à cause de la retenue', rkEigen: 'Réglage propre', rkEigenAktiv: 'Réglage propre actif. Le curseur choisit de nouveau un palier.', rkLeer: 'Sans retenue : les chiffres montrent seulement les valeurs mesurées.', rkSpeicher: 'Contenu du réservoir (règle d’exploitation), mio m³', rkDetail: 'Mode de calcul des graphiques détaillés', rkSeeText: 'Niveau mesuré (noir) et avec retenue selon la règle d’exploitation (bleu), en tirets la limite de hautes eaux.', st1a: 'Palier 1a : dans la tranche utilisée', st1b: 'Palier 1b : jusqu’à la limite de hautes eaux', st1c: 'Palier 1c : lacs du pied du Jura jusqu’au degré de danger 4', st2: 'Palier 2 : au-dessus de la limite de hautes eaux', st3: 'Palier 3 : avec le lac de Constance', stFrei: 'Libre', nzTitel: 'Débit à toutes les stations pour Kaub le', nzGem: 'm³/s', nzRest: 'Bassin intermédiaire', nzLeg: 'En noir : moyenne journalière mesurée. En gris : apport du bassin intermédiaire entre deux stations. ° valeur brute · * calculé à partir du niveau.', kSeen: 'Restitution des lacs', kSumme: 'ensemble', kMit: 'avec retenue', kKurve: 'd’après la courbe de tarage', kTitelK: 'Calcul pour Kaub le', aaTitel: 'Débit à Kaub, toutes les années', aaAndere: 'autres années', bdTitel: 'Capacité de stockage nécessaire', bdFehl: 'Déficit jusqu’au GlW', bdVor: 'Nécessaire avec prévision', bdRegel: 'Nécessaire avec la règle d’exploitation', bdNicht: 'pas atteignable', bdOhne: 'Nécessaire avec prévision, sans limites (barrages fermés)', bdGrafik: 'Capacité de stockage nécessaire et place par palier, mio m³', bdHinweis: 'Le déficit est la somme des manques de tous les jours sous le GlW. La capacité nécessaire est la plus petite avec laquelle le calcul tient le GlW tous les jours ; avec prévision, elle est souvent plus petite, car les lacs se remplissent à nouveau entre deux étiages. La place par palier est le plus grand contenu possible, les paliers 2 et 3 avec 50 cm au-dessus de la limite de hautes eaux.', jkRechnet: 'Calculé avec les débits mesurés de', jkAnderes: 'Autre année', skJahr: 'Calculé pour l’année', skText: 'Tous les chiffres et graphiques du simulateur valent pour cette seule année, avec ses débits mesurés. L’année se change juste en dessous.', stUnb: 'Illimité', uMio: 'Capacité de retenue totale, mio m³', uSeen: 'Lacs', uReg: 'lacs régulés', uMitB: 'lacs régulés et lac de Constance', uSchr: 'Limites 10 % / 20 %', uBleiben: 'appliquées', uAuf: 'levées', uTitel: 'Capacité de retenue nécessaire', uUebernehmen: 'Reprendre', uOhneText: 'Sans limites, les lacs peuvent retenir tout leur débit, le barrage serait fermé. C’est la limite physique, pas une valeur admissible.',
    hwT: 'Protection contre les crues', hwLeg: 'jour avec un lac au-dessus de la limite de hautes eaux', hwKein: 'Aucun lac au-dessus de la limite de hautes eaux.', hwSatz: 'jours, un lac serait au-dessus de sa limite actuelle de hautes eaux à cause de la retenue', rVon: 'Retenir du mois', rBis: 'au mois', rWinter: 'Vidange d’hiver dès le 1.11.', rRes: 'Réserve sous la limite cm', an: 'oui', aus: 'non',
    stText: { '0': 'Sans retenue.', '1a': 'Palier 1a : les lacs régulés retiennent jusqu’au bord supérieur de la tranche qu’ils ont utilisée de 1991 à 2020 (99e centile du niveau). Ils ont atteint ce niveau 1 % des jours jusqu’ici.', '1b': 'Palier 1b : les lacs dotés d’une limite officielle de hautes eaux retiennent jusqu’à 20 cm en dessous. Les lacs de Neuchâtel et de Morat n’ont pas de limite officielle et restent dans la tranche utilisée.', '1c': 'Palier 1c : comme 1b, et les lacs de Neuchâtel et de Morat retiennent jusqu’à 20 cm sous le début du degré de danger 4 de l’OFEV.', 2: 'Palier 2 : les lacs régulés retiennent au-dessus de leur limite actuelle de hautes eaux. Chaque jour au-dessus est marqué comme jour de crue.', 3: 'Palier 3 : comme le palier 2, avec la même surélévation sur le lac de Constance. Il n’est pas régulé ; la CHR (2018) juge une régulation politiquement difficile à réaliser.', frei: 'Libre : la surélévation se règle par lac, sans plafond. La limite de hautes eaux s’applique avec le supplément indiqué.', unb: 'Illimité : la capacité de retenue se règle sans plafond et sans limite de hautes eaux. Elle est répartie sur les lacs choisis selon leur surface. La page calcule la capacité qu’il aurait fallu pour tenir le GlW tous les jours. Cela montre l’ordre de grandeur, pas ce qui serait admissible.' },
    zusatzU: 'Au-dessus de la limite de hautes eaux (cm)', simJahr: 'Année',
    glwImmer: 'GlW tous les jours', ja: 'atteint', nein: 'non atteint', unnoetig: 'pas nécessaire', eBest: 'avec prévision', eRegel: 'règle d’exploitation', eRest: 'Jours restants sous le GlW', ueberT: 'Jours avec un lac au-dessus de la limite', rText: { glw: 'Avec prévision : le calcul connaît d’avance tous les débits de l’année. Il retient autant d’eau qu’il en faudra plus tard et relève surtout les jours les plus bas. Ce réservoir ne permet pas de relever davantage le jour le plus bas.', regel: 'Règle d’exploitation : le calcul ne connaît que le débit du jour et le contenu du réservoir. Pendant les mois de retenue, on retient au-dessus du débit réglé ; sous le GlW, on restitue jusqu’à ce que le réservoir soit vide. Dès le 1er novembre, le reste est restitué.', min: 'Sans plafond : comme avec prévision, mais les jours les plus bas sont relevés aussi au-delà du GlW.' },
    jTitel: 'Capacité nécessaire par année', jText: 'Pour chaque année : ce qui a été mesuré à Kaub, combien d’eau il aurait fallu pour tenir le GlW tous les jours, et ce que donnent les paliers avec la règle d’exploitation (jours sous le GlW · profondeur minimale du chenal en cm). Un nombre encadré à la suite indique les jours où un lac serait au-dessus de sa limite de hautes eaux.', jReicht: 'Le GlW tous les jours est atteint à partir du', jNie: 'aucun palier', jGrafik: 'Profondeur minimale du chenal à Kaub par année, cm : mesuré (noir) et paliers 1a, 1b, 1c, 2, 3',
    kTitel: 'Bénéfice selon la capacité : profondeur minimale du chenal à Kaub, cm', kX: 'capacité de retenue sur les lacs régulés, mio m³ (sans limite de hautes eaux)', kText: 'La courbe relève tous les lacs régulés de la même hauteur, sans limite de hautes eaux et avec prévision parfaite. Les carrés bleus sont les paliers avec leur volume utilisé.',
  } : {
    lead: 'Wie viel Wasser der Rhein führt, bestimmt, wie viel ein Schiff laden kann. Teil 1 zeigt mit gemessenen Abflüssen, wovon die Fahrbarkeit bis Kaub abhängt. Teil 2 rechnet nach, was es brächte, Wasser in den Seen zurückzuhalten und bei Niedrigwasser abzugeben. Die Seite ist als Grundlage für eine Diskussion gedacht.',
    teil1: 'Teil 1', teil1T: 'Abfluss und Fahrbarkeit bis Kaub', teil1L: 'Wie viel Wasser in Kaub ankommt, woher es kommt und wie tief die Schiffe damit fahren können. Nur gemessene Werte.', teil2: 'Teil 2', teil2T: 'Rückhalt in den Seen', teil2L: 'Was es brächte, Wasser in den Seen zurückzuhalten und bei Niedrigwasser abzugeben. Gerechnet mit den gemessenen Abflüssen eines Jahres.', anhang: 'Anhang', anhangT: '', anhangL: 'Herleitung der Zahlen, Datensatz und fehlende Daten.', bilTitel: 'Bilanz des angezeigten Tages', bilLead: 'Herkunft des Wassers in Kaub, jedes Bilanzglied einzeln, und die Seen am Tag, der in Teil 1 gewählt ist.',
    k1Titel: '1 Der Rhein bis Kaub', k1Lead: 'Die Zahlen dieses Kapitels gelten für den gewählten Tag. Voreingestellt ist der letzte Tag mit vollständigen Werten. GlW ist der Bezugswasserstand der Schifffahrt bei Niedrigwasser, in Kaub 77 cm.',
    k2Titel: '2 Die Jahre', k2Lead: 'Der Abfluss in Kaub als Tagesmittel, Jahr für Jahr. Schraffiert sind die Tage unter dem GlW.',
    k3Titel: '3 So wirkt der Rückhalt', k3Lead: 'Die Seen halten im Frühsommer Wasser zurück und geben es bei Niedrigwasser ab. Dieses Kapitel rechnet das mit den gemessenen Abflüssen des gewählten Jahres durch, in drei Stufen.',
    simTitel: '4 Rückhalterechner', simLead: 'Für das gewählte Jahr: wie viel Speicher es bräuchte, was eine bestimmte Menge Rückhalt in Kaub bringt und was sie für die Seen heisst. Die Details lassen sich jeweils dort aufklappen, wo sie hingehören.',
    herTitel: '5 Herleitung', datTitel: '6 Datensatz', fehlTitel: 'Fehlende Daten', fehlLead: 'Diese Angaben fehlen der Seite noch. Die Liste ist nach der Wirkung auf das Ergebnis geordnet.', fWas: 'Was fehlt', fWozu: 'Was es ändert', fWer: 'Mögliche Quelle',
    csv: 'CSV herunterladen', csvQuelle: 'Quellen: BAFU (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG; HLNUG. Rechnung: simoschlumpf.ch/rhin-retention',
    gTitel: 'Abfluss in Kaub', g40: 'darunter praktisch keine Schifffahrt', gBest: 'mit Rückhalt, mit Voraussicht', gRegel: 'mit Rückhalt, Betriebsregel', gUnter: 'unter dem GlW', gHub: 'Anhebung', gSchnitt: 'Achse bei 2’000 m³/s abgeschnitten.',
    fTitel2: 'Abfluss in Kaub nach Herkunft',
    stufe: 'Stufe', rk1: '1 Nötiger Speicher', rk2: '2 Rückhalt wählen', rk3: '3 Wirkung in Kaub', rk4: '4 Folgen für die Seen', rk1m: 'Wie gerechnet wird', rk2a: 'Je See einstellen oder frei in Mio. m³', rk2b: 'Regeln für Stauen und Abgeben', rk3m: 'Weitere Kennzahlen und Grafiken', rk4m: 'Seegruppen und einzelne Seen im Detail', rkOhne: 'ohne', rkBod: 'Bodensee mitrechnen (nicht reguliert)', rkSkala: 'Speicher in Mio. m³', rkNoetigR: 'nötig, Betriebsregel', rkNoetigV: 'nötig, mit Voraussicht', rkNicht: 'nicht erreichbar', rkReal: 'Betriebsregel', rkBest: 'mit Voraussicht', rkMax: 'höchstens', rkHwT: 'Tage über der Hochwassergrenze', stBod: 'Dazu staut der Bodensee um denselben Zusatz. Er ist nicht reguliert; die KHR (2018) hält eine Regulierung für politisch kaum realisierbar.', rkHwSatz: 'Ein See stünde wegen des Rückhalts über seiner heutigen Hochwassergrenze', rkEigen: 'Eigene Einstellung', rkEigenAktiv: 'Eigene Einstellung aktiv. Der Regler wählt wieder eine Stufe.', rkLeer: 'Ohne Rückhalt: Die Zahlen zeigen nur, was gemessen wurde.', rkSpeicher: 'Speicherinhalt (Betriebsregel), Mio. m³', rkDetail: 'Rechenweise der Detailgrafiken', rkSeeText: 'Seestand gemessen (schwarz) und mit Rückhalt nach Betriebsregel (blau), gestrichelt die Hochwassergrenze.', st1a: 'Stufe 1a: im genutzten Band', st1b: 'Stufe 1b: bis zur Hochwassergrenze', st1c: 'Stufe 1c: Jurarandseen bis Gefahrenstufe 4', st2: 'Stufe 2: über der Hochwassergrenze', st3: 'Stufe 3: mit Bodensee', stFrei: 'Frei', nzTitel: 'Abfluss an allen Messstellen für Kaub am', nzGem: 'm³/s', nzRest: 'Zwischengebiet', nzLeg: 'Schwarz: gemessenes Tagesmittel. Grau: Zuwachs aus dem Zwischengebiet zwischen zwei Messstellen. ° Rohwert · * aus dem Wasserstand gerechnet.', kSeen: 'Abgabe der Seen', kSumme: 'zusammen', kMit: 'mit Rückhalt', kKurve: 'aus der Abflusskurve', kTitelK: 'Rechenweg für Kaub am', aaTitel: 'Abfluss in Kaub, alle Jahre', aaAndere: 'übrige Jahre', bdTitel: 'Nötige Speicherkapazität', bdFehl: 'Fehlmenge bis zum GlW', bdVor: 'Nötig mit Voraussicht', bdRegel: 'Nötig mit Betriebsregel', bdNicht: 'nicht erreichbar', bdOhne: 'Nötig mit Voraussicht, ohne Schranken (Wehre ganz zu)', bdGrafik: 'Nötige Speicherkapazität und Platz je Stufe, Mio. m³', bdHinweis: 'Die Fehlmenge ist die Summe der Fehlbeträge an allen Tagen unter dem GlW. Die nötige Kapazität ist die kleinste, mit der die Rechnung den GlW an allen Tagen hält; sie ist mit Voraussicht meist kleiner, weil sich Seen zwischen zwei Niedrigwassern wieder füllen. Der Platz je Stufe ist der grösste mögliche Inhalt, die Stufen 2 und 3 mit 50 cm über der Hochwassergrenze.', jkRechnet: 'Gerechnet mit den gemessenen Abflüssen von', jkAnderes: 'Anderes Jahr', skJahr: 'Gerechnet für das Jahr', skText: 'Alle Zahlen und Grafiken des Simulators gelten für dieses eine Jahr, mit seinen gemessenen Abflüssen. Das Jahr lässt sich gleich darunter wechseln.', stUnb: 'Unbegrenzt', uMio: 'Staukapazität gesamt, Mio. m³', uSeen: 'Seen', uReg: 'regulierte Seen', uMitB: 'regulierte Seen und Bodensee', uSchr: 'Schranken 10 % / 20 %', uBleiben: 'gelten', uAuf: 'aufgehoben', uTitel: 'Nötige Staukapazität', uUebernehmen: 'Übernehmen', uOhneText: 'Ohne Schranken dürfen die Seen ihren ganzen Abfluss zurückhalten, das Wehr wäre zu. Das ist die physikalische Obergrenze, nicht zulässig.',
    hwT: 'Hochwasserschutz', hwLeg: 'Tag mit einem See über der Hochwassergrenze', hwKein: 'Kein See über der Hochwassergrenze.', hwSatz: 'Tage stünde ein See wegen des Rückhalts über seiner heutigen Hochwassergrenze', rVon: 'Stauen von Monat', rBis: 'bis Monat', rWinter: 'Winterleerung ab 1.11.', rRes: 'Reserve zur Grenze cm', an: 'ein', aus: 'aus',
    stText: { '0': 'Ohne Rückhalt.', '1a': 'Stufe 1a: Die regulierten Seen stauen bis zum oberen Rand des Bandes, das sie 1991–2020 genutzt haben (99. Perzentil des Seestands). So hoch standen sie bisher an 1 % der Tage.', '1b': 'Stufe 1b: Die Seen mit amtlicher Hochwassergrenze stauen bis 20 cm darunter. Neuenburger- und Murtensee haben keine amtliche Grenze und bleiben im genutzten Band.', '1c': 'Stufe 1c: wie 1b, dazu stauen Neuenburger- und Murtensee bis 20 cm unter den Beginn der Gefahrenstufe 4 des BAFU.', 2: 'Stufe 2: Die regulierten Seen stauen über ihre heutige Hochwassergrenze hinaus. Jeder Tag darüber ist als Hochwassertag markiert.', 3: 'Stufe 3: wie Stufe 2, dazu derselbe Zusatzstau auf dem Bodensee. Er ist nicht reguliert; die KHR (2018) hält eine Regulierung für politisch kaum realisierbar.', frei: 'Frei: Der Zusatzstau lässt sich je See einstellen, ohne Obergrenze. Die Hochwassergrenze gilt mit dem angegebenen Zuschlag.', unb: 'Unbegrenzt: Die Staukapazität lässt sich beliebig hoch einstellen, ohne Hochwassergrenze. Sie wird im Verhältnis der Fläche auf die gewählten Seen verteilt. Die Seite rechnet aus, wie viel Kapazität es für den GlW an allen Tagen gebraucht hätte. Das zeigt die Grössenordnung, nicht was zulässig wäre.' },
    zusatzU: 'Über der Hochwassergrenze (cm)', simJahr: 'Jahr',
    glwImmer: 'GlW an allen Tagen', ja: 'erreicht', nein: 'nicht erreicht', unnoetig: 'nicht nötig', eBest: 'mit Voraussicht', eRegel: 'Betriebsregel', eRest: 'Verbleibende Tage unter GlW', ueberT: 'Tage mit einem See über der Grenze', rText: { glw: 'Mit Voraussicht: Die Rechnung kennt alle Abflüsse des Jahres im Voraus. Sie staut so viel, wie später gebraucht wird, und hebt die tiefsten Tage am stärksten. Höher lässt sich der tiefste Tag mit diesem Speicher nicht heben.', regel: 'Betriebsregel: Die Rechnung kennt nur den heutigen Abfluss und den Speicherinhalt. In den Staumonaten wird über dem eingestellten Abfluss gestaut, unter dem GlW wird abgegeben, bis der Speicher leer ist. Ab 1. November wird der Rest abgegeben.', min: 'Ohne Deckel: wie mit Voraussicht, die tiefsten Tage werden aber auch über den GlW hinaus gehoben.' },
    jTitel: 'Nötige Speicherkapazität pro Jahr', jText: 'Für jedes Jahr: was in Kaub gemessen wurde, wie viel Wasser für den GlW an allen Tagen gefehlt hat, und was die Stufen mit der Betriebsregel ergeben (Tage unter GlW · kleinste Fahrrinnentiefe in cm). Eine umrandete Zahl dahinter nennt die Tage, an denen ein See über seiner Hochwassergrenze stünde.', jReicht: 'GlW an allen Tagen erreicht ab', jNie: 'keine Stufe', jGrafik: 'Kleinste Fahrrinnentiefe in Kaub je Jahr, cm: gemessen (schwarz) und Stufen 1a, 1b, 1c, 2, 3',
    kTitel: 'Nutzen nach Staukapazität: kleinste Fahrrinnentiefe in Kaub, cm', kX: 'Staukapazität auf den regulierten Seen, Mio. m³ (ohne Hochwassergrenze)', kText: 'Die Kurve hebt alle regulierten Seen um dieselbe Höhe, ohne Hochwassergrenze und mit voller Voraussicht. Die blauen Quadrate sind die Stufen mit ihrem genutzten Volumen.',
  });
  // Neue Gliederung vom 17.11.2026: Titel und Leads. FR provisorisch
  Object.assign(T, FR ? {
    teil1T: 'Que porte le Rhin, et qu’est-ce que cela signifie pour les bateaux ?', teil1L: 'Cette partie ne montre que des valeurs mesurées. Elle répond à trois questions : comment mesure-t-on si un bateau peut charger pleinement ? Combien de fois cela n’a-t-il pas été possible ces dernières années ? Et d’où vient l’eau quand elle se fait rare ?',
    teil2T: 'La Suisse pourrait-elle aider ?',
    k1Titel: '1 Là où ça devient étroit', k2Titel: '2 Combien de fois l’eau a-t-elle manqué ?', k3Titel: '3 D’où vient l’eau en basses eaux ?',
    k3Lead: 'La quantité d’eau qui arrive à Kaub dépend de ce qui afflue des Alpes, du Plateau et d’Allemagne. Ce chapitre compare les sept jours les plus secs d’une année avec une semaine d’étiage habituelle.',
    k4Titel: '4 Combien d’eau manque-t-il ?', k5Titel: '5 Jusqu’où les lacs pourraient-ils monter ?', k6Titel: '6 Qu’est-ce que cela aurait apporté ?',
    k6Lead: 'Ce chapitre calcule la retenue avec les débits mesurés de l’année choisie. On choisit d’abord l’objectif.',
    k7Titel: '7 Ce que montre le calcul', k7Lead: 'Le tableau résume les années avec des jours sous le GlW, pour les objectifs A à C, les paliers 1b et 3 et les deux modes de calcul.',
    simTitel: '8 Calculateur de rétention', simLead: 'Pour l’année et l’objectif choisis : le stockage qu’il faudrait, ce qu’apporte une quantité donnée de retenue à Kaub et ce qu’elle signifie pour les lacs. Les détails s’ouvrent là où ils se rapportent. Le calcul se fait par années de stockage du 1er avril au 31 mars, pour que remplissage et vidange tombent dans la même année.',
    herTitel: 'Méthode de calcul', begTitel: 'Notions', datTitel: 'Jeu de données', anhangL: 'Méthode de calcul, notions, jeu de données et données manquantes.', v2Titel: 'Ce qu’un bateau peut charger',
    glied: 'Part du débit', kontrolle: 'Contrôle Aar : Stilli − (Brugg + Reuss + Limmat)', entlTitel: 'Restitution d’urgence due à la limite de hautes eaux',
    seeHinweis: 'Chaque lac a son propre contenu. Le remplissage se fait au prorata de la place libre, la vidange au prorata du contenu. Pour chaque lac : retenue d’au plus 20 % du débit à la station en aval et jamais en dessous du débit minimal mesuré de l’année à cette station.',
    bilLead: 'Origine de l’eau à Kaub, chaque part du débit et les lacs au jour choisi au chapitre 1.',
  } : {
    teil1T: 'Was fliesst im Rhein, und was heisst das für die Schiffe?', teil1L: 'Dieser Teil zeigt nur gemessene Werte. Er beantwortet drei Fragen: Wie misst man, ob ein Schiff voll laden kann? Wie oft war das in den letzten Jahren nicht möglich? Und woher kommt das Wasser, wenn es knapp wird?',
    teil2T: 'Könnte die Schweiz nachhelfen?',
    k1Titel: '1 Wo es eng wird', k2Titel: '2 Wie oft war es zu wenig?', k3Titel: '3 Woher kommt das Wasser bei Niedrigwasser?',
    k3Lead: 'Wie viel Wasser in Kaub ankommt, hängt davon ab, was aus den Alpen, aus dem Mittelland und aus Deutschland zufliesst. Dieses Kapitel vergleicht die trockensten sieben Tage eines Jahres mit einer üblichen Niedrigwasserwoche.',
    k4Titel: '4 Wie viel Wasser fehlt?', k5Titel: '5 Wie hoch dürften die Seen steigen?', k6Titel: '6 Was hätte es gebracht?',
    k6Lead: 'Dieses Kapitel rechnet den Rückhalt mit den gemessenen Abflüssen des gewählten Jahres durch. Zuerst wird das Ziel gewählt.',
    k7Titel: '7 Was die Rechnung zeigt', k7Lead: 'Die Tabelle fasst die Jahre mit Tagen unter dem GlW zusammen, für die Ziele A bis C, die Stufen 1b und 3 und beide Rechenweisen.',
    simTitel: '8 Rückhalterechner', simLead: 'Für das gewählte Jahr und Ziel: wie viel Speicher es bräuchte, was eine bestimmte Menge Rückhalt in Kaub bringt und was sie für die Seen heisst. Die Details lassen sich jeweils dort aufklappen, wo sie hingehören. Gerechnet wird in Speicherjahren vom 1. April bis 31. März, damit Füllen und Leeren im selben Jahr liegen.',
    herTitel: 'Herleitung', begTitel: 'Begriffe', datTitel: 'Datensatz', anhangL: 'Herleitung der Zahlen, Begriffe, Datensatz und fehlende Daten.', v2Titel: 'Was ein Schiff laden kann',
    glied: 'Teil des Abflusses', kontrolle: 'Probe Aare: Stilli − (Brugg + Reuss + Limmat)', entlTitel: 'Notabgabe wegen Hochwassergrenze',
    seeHinweis: 'Jeder See führt seinen eigenen Inhalt. Gefüllt wird im Verhältnis des freien Platzes, geleert im Verhältnis des Inhalts. Je See gilt: Rückhalt höchstens 20 % des Abflusses an der Messstelle unterhalb und nie unter deren gemessenen Jahrestiefstwert.',
    bilLead: 'Herkunft des Wassers in Kaub, jeder Teil des Abflusses einzeln, und die Seen am Tag, der in Kapitel 1 gewählt ist.',
  });
  const $ = id => document.getElementById(id);
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[e.dataset.t]; });
  document.title = T.titel.replace(' · ', ' – ');
  if (FR) document.querySelector('meta[name=description]').content = 'De quoi dépend la navigabilité du Rhin jusqu’à Kaub et ce qu’apporterait une retenue dans les lacs : débits mesurés, échelle de Kaub, origine de l’eau et simulation.';
  const INHALT = [['teil1', [['k1', 'k1Titel'], ['k2', 'k2Titel'], ['k3', 'k3Titel']]], ['teil2', [['k4', 'k4Titel'], ['k5', 'k5Titel'], ['k6', 'k6Titel'], ['k7', 'k7Titel'], ['simulator', 'simTitel']]],
    ['anhang', [['herleitung', 'herTitel'], ['begriffe', 'begTitel'], ['bilanztag', 'bilTitel'], ['daten', 'datTitel'], ['fehlt', 'fehlTitel'], ['methode', 'methode'], ['quellenT', 'quellen']]]];
  $('inhalt').innerHTML = INHALT.map(([id, l]) => `<div><a class="teillink" href="#${id}">${T[id]}${T[id + 'T'] ? ` · ${T[id + 'T']}` : ''}</a>${l.map(([i, k]) => `<a href="#${i}">${T[k]}</a>`).join('')}</div>`).join('');
  $('sprache').innerHTML = FR ? '<a href="./" hreflang="de" lang="de">DE</a> · <span aria-current="page">FR</span>'
    : '<span aria-current="page">DE</span> · <a href="?l=fr" hreflang="fr" lang="fr">FR</a>';
  const zahl = (x, n = 0) => x == null || !isFinite(x) ? '–'
    : (x < 0 ? '−' : '') + Math.abs(x).toFixed(n).replace(/\B(?=(\d{3})+(?!\d))/g, FR ? ' ' : "'").replace('.', ',');   // Schweizer Schreibweise: 2'324,5; FR 2 324,5
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
  const STATUS_FR = { 0: 'brut', 1: 'provisoire', 2: 'validé', 3: 'définitif', 4: 'contrôlé (annuaire DGJ)', 6: 'moyenne journalière WSV via le HLNUG', 7: 'calculé à partir du niveau (courbe de tarage)', 8: 'calculé à partir du niveau (courbe prolongée)', 9: 'déduit de l’échelle de Bingen (pas de valeur pour Kaub)' };
  const QUELLEN_FR = { BAFU: 'Office fédéral de l’environnement OFEV, observations hydrologiques, plateforme de données de l’OFEV (utilisation libre, mention de la source obligatoire)',
    HLNUG: 'Office hessois de l’environnement HLNUG, portail des échelles : moyennes journalières des échelles WSV de Kaub, Mayence, Worms, Bingen et Francfort Osthafen',
    'WSV/BfG': 'Administration fédérale allemande des voies navigables (WSV), données mises à disposition par la BfG : annuaire hydrologique allemand et PEGELONLINE (données brutes)' };
  const nm = s => FR ? (NAMEN[s] || s) : s, GW = s => nm(s.gewaesser), statusName = c => FR ? (STATUS_FR[c] || meta.status[c]) : meta.status[c];
  // Breite der Grafiken in Pixeln der Seite: Schrift bleibt auf dem Handy lesbar, ohne seitliches Scrollen
  const BREITE = () => Math.max(360, Math.min(1000, Math.round(($('simulator') || document.body).clientWidth) || 1000));
  const DP = FR ? '\u00a0: ' : ': ';                  // Doppelpunkt: im Französischen mit Abstand davor
  const GERECHNET = c => c === 7 || c === 8 || c === 9;    // Abfluss nicht gemessen, sondern aus dem Wasserstand gerechnet
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
  // Nutzbare Ladekapazität eines Schiffs nach Pegelstand Kaub (ZKR, «Act now!», 2023): Stützpunkte, dazwischen linear; unter 44 cm keine Schätzung
  const AUSL = meta.auslastung;
  function auslastung(w) {
    if (w == null || !AUSL) return null;
    const p = AUSL.punkte;
    if (w < p[0][0]) return null;
    for (let i = 1; i < p.length; i++) if (w <= p[i][0]) return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (w - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
    return 100;
  }
  const Q_GLW = GLW != null ? qAusW(GLW) : null;
  const Q_STAU = GLW != null ? qAusW(GLW + 10) : null;     // gestaut wird erst 10 cm über dem GlW, damit kein Tag durch den Rückhalt unter den GlW fällt
  const Q_40 = qAusW(40), Q_50 = qAusW(50);                // Ziel B: Deckel 40 cm, gestaut ab 50 cm

  // ------------------------------------------------------------ Optimaler Rückhalt (wie simulation.py)
  const SEK = 86400, P_MAX = 0.10, P_SEE = 0.20; let RESERVE = 0.20, OFFEN = false, VORRAT = false;   // OFFEN: Schranken 10 % / 20 % aufgehoben (Stufe «Unbegrenzt»)   // RESERVE: Abstand zur Hochwassergrenze beim Füllen (m)
  let MONAT = null;                             // Monat (1–12) je Tag des Rechenfensters, für die Betriebsregel
  let ZIELTAGE = null;                          // Ziel C und D: nur diese Tage werden gehoben (Uint8Array je Tag des Fensters); null = alle Tage unter dem Deckel
  let SEEN = [];                                // Seen im Rechenfenster: { cap, kap, rate, start } in m³ bzw. m³/s
  let STAT = [];                                // Messstellen unterhalb der Seen: { lim: grösster Rückhalt je Tag (m³/s), seen: Indizes der Seen oberhalb }
  // Jeder See führt seinen eigenen Inhalt. Gefüllt wird im Verhältnis des freien Platzes, geleert im Verhältnis des Inhalts.
  // Steigt ein See über seine Grenze, gibt er den Überschuss ab, höchstens mit rate (20 % des Abflusses unterhalb);
  // reicht das nicht, steht der See an diesem Tag über der Grenze (ueber).
  function becken(n) {
    const L = SEEN, ss = L.map(l => Math.min(l.start || 0, l.cap)), see = L.map(() => new Float64Array(n)), ueber = new Uint8Array(n);
    const grenze = (l, i) => l.voll ? Math.min(l.cap, l.voll[i]) : l.cap;
    return { see, ueber, ss,
      inhalt: () => { let a = 0; for (const x of ss) a += x; return a; },
      frei: i => { let a = 0; L.forEach((l, k) => { a += Math.max(0, grenze(l, i) - ss[k]); }); return a; },
      // Füllen: im Verhältnis des freien Platzes; der Rückhalt aller Seen oberhalb einer Messstelle bleibt unter deren Grenze.
      // Was ein See wegen seiner Messstelle nicht aufnehmen kann, geht an die übrigen Seen. Gibt das tatsächlich gestaute Volumen zurück.
      fuellen: (vol, i) => {
        const room = L.map((l, k) => Math.max(0, grenze(l, i) - ss[k])), add = L.map(() => 0), slack = STAT.map(s => s.lim[i] * SEK);
        for (let it = 0; it < 5; it++) {
          let rest = vol; for (const x of add) rest -= x; if (rest < 1) break;
          const frei = L.map((l, k) => room[k] - add[k] > 1 && l.st.every(g => slack[g] > 1) ? room[k] - add[k] : 0);
          let sum = 0; for (const x of frei) sum += x; if (sum <= 0) break;
          const inc = frei.map(x => Math.min(x, rest * x / sum));
          STAT.forEach((s, g) => { let a = 0; for (const k of s.seen) a += inc[k]; if (a > 0 && a > slack[g]) { const f = Math.max(0, slack[g]) / a; for (const k of s.seen) inc[k] *= f; } });
          STAT.forEach((s, g) => { for (const k of s.seen) slack[g] -= inc[k]; });
          inc.forEach((x, k) => { add[k] += x; });
        }
        let gesamt = 0; add.forEach((x, k) => { ss[k] += x; gesamt += x; }); return gesamt;
      },
      leeren: vol => { let sum = 0; for (const x of ss) sum += x; if (sum > 0) ss.forEach((x, k) => { ss[k] = Math.max(0, x - vol * x / sum); }); },
      entlasten: i => { let e = 0; L.forEach((l, k) => { if (!l.kap) return; const o = ss[k] - l.kap[i]; if (o > 1) { const a = Math.min(o, l.rate[i] * SEK); ss[k] -= a; e += a; if (o - a > 1) ueber[i] = 1; } }); return e / SEK; },
      merke: i => { ss.forEach((x, k) => { see[k][i] = x; }); } };
  }
  function lauf(q, V, tief, hoch) {
    const n = q.length, abgabe = new Float64Array(n), rueck = new Float64Array(n), speicher = new Float64Array(n), entl = new Float64Array(n), B = becken(n);
    const heb = i => q[i] != null && q[i] < tief && (!ZIELTAGE || ZIELTAGE[i]);
    let letzter = -1; for (let i = 0; i < n; i++) if (heb(i)) letzter = i;
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (heb(i)) { const bedarf = (tief - x) * SEK; if (bedarf > B.inhalt() + 1e-6) return null; B.leeren(bedarf); abgabe[i] = tief - x; }
        // VORRAT: von Januar bis März, nach dem letzten Tag unter L*, für das nächste Speicherjahr stauen (Wasser aus dem Winter)
        else if ((x > hoch && i < letzter) || (VORRAT && i > letzter && MONAT && MONAT[i] <= 3 && x > Q_STAU)) { const r = Math.max(0, Math.min(x - (i < letzter ? hoch : Q_STAU), (OFFEN ? x : P_MAX * x), B.frei(i) / SEK)); if (r > 0) rueck[i] = B.fuellen(r * SEK, i) / SEK; }
      }
      entl[i] = B.entlasten(i); speicher[i] = B.inhalt(); B.merke(i);
    }
    return { abgabe, rueck, speicher, entl, see: B.see, ueber: B.ueber, ende: B.ss.slice() };
  }
  // Betriebsregel ohne Voraussicht: kennt nur den heutigen Abfluss und den Speicherinhalt
  const stauzeit = i => !MONAT || (REGEL.von <= REGEL.bis ? MONAT[i] >= REGEL.von && MONAT[i] <= REGEL.bis : MONAT[i] >= REGEL.von || MONAT[i] <= REGEL.bis);
  const winter = i => REGEL.winter && MONAT && (MONAT[i] >= 11 || MONAT[i] <= 2);
  function regel(q, V, deckel, stauAb, reichweite) {
    const n = q.length, abgabe = new Float64Array(n), rueck = new Float64Array(n), speicher = new Float64Array(n), entl = new Float64Array(n), hoechst = V / (reichweite * SEK), B = becken(n);
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (x < deckel) { const a = Math.max(0, Math.min(deckel - x, hoechst, B.inhalt() / SEK)); if (a > 0) { B.leeren(a * SEK); abgabe[i] = a; } }
        else if (x > stauAb && stauzeit(i)) { const r = Math.max(0, Math.min(x - stauAb, (OFFEN ? x : P_MAX * x), B.frei(i) / SEK)); if (r > 0) rueck[i] = B.fuellen(r * SEK, i) / SEK; }
        else if (winter(i) && B.inhalt() > 1) { const a = Math.min(B.inhalt(), V / REGEL.leeren) / SEK; B.leeren(a * SEK); entl[i] += a; }     // Winterleerung: gleichmässig, auch über dem GlW
      }
      entl[i] += B.entlasten(i); speicher[i] = B.inhalt(); B.merke(i);
    }
    return { tief: deckel, hoch: stauAb, abgabe, rueck, speicher, entl, see: B.see, ueber: B.ueber, ende: B.ss.slice() };
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
  // Ziel C und D (Näherung, Greedy): Die Tage unter dem Deckel werden nach ihrer Lücke zum Deckel aufsteigend geprüft.
  // Ein Tag kommt zur Menge der gehobenen Tage, wenn ein Lauf möglich ist, der genau diese Tage auf den Deckel hebt
  // (Abgabe nur an diesen Tagen, Stauen über stauAb und vor dem letzten gehobenen Tag, alle Schranken von becken); sonst nicht.
  function hebenTage(q, V, deckel, stauAb) {
    const w = q.filter(x => x != null); if (!w.length || V <= 0) return null;
    const kand = []; q.forEach((x, i) => { if (x != null && x < deckel) kand.push(i); });
    kand.sort((a, b) => q[b] - q[a] || a - b);
    const menge = new Uint8Array(q.length); let o = null;
    try {
      ZIELTAGE = menge; o = lauf(q, V, deckel, stauAb);
      for (const i of kand) { menge[i] = 1; const r = lauf(q, V, deckel, stauAb); if (r) o = r; else menge[i] = 0; }
    } finally { ZIELTAGE = null; }
    let gehoben = 0; for (const x of menge) gehoben += x;
    return { tief: deckel, hoch: stauAb, ...o, glw: true, deckel, gehoben, bedarf: w.reduce((s, x) => s + Math.max(0, deckel - x), 0) * SEK };
  }

  // ------------------------------------------------------------ Zustand
  const Z = { zielwahl: 'A', ziel: KAUB, ansicht: 'heute', jahr: LETZTES, tag: null, extrem: 0, sim: false, zoom: false, modus: 'regel', verlauf: null, see: null, stufe: '1b', zusatz: 50, bodensee: false, simjahr: null };
  const STARTJAHR = meta.jahre.includes(2022) ? 2022 : LETZTES;   // Teil 2 beginnt mit 2022: Niedrigwasserjahr, in dem Rückhalt viel bewirkt; 2026 ist ein Extremjahr
  Z.simjahr = STARTJAHR;
  let UEBER = 0;                                // Zusatzstau über der heutigen Hochwassergrenze (cm): verschiebt die Grenze nach oben
  const BODENSEE = '2288', BODENSEE_TAGE = 0;   // keine zusätzliche Fliesszeit: Eine Änderung in Neuhausen erscheint nach den Messreihen am selben Tag in Basel
  const CM = Object.fromEntries(meta.seen.map(s => [s.id, s.reguliert ? 10 : 0]));
  const REGEL_STD = { stauAb: 1000, tage: 30, von: 4, bis: 9, winter: true, leeren: 30 }, REGEL = { ...REGEL_STD };   // dazu: Staumonate von–bis, Winterleerung ab 1. November in so vielen Tagen   // Betriebsregel: stauen ab diesem Abfluss in Kaub (m³/s); voller Speicher reicht so viele Tage
  const tagAnsicht = () => ['heute', 'extrem', 'tag'].includes(Z.ansicht);
  // Seegruppen: Name, Seen, erste Messstelle unterhalb
  const SEEGRUPPEN = [['gBodensee', ['obersee', 'untersee'], '2288'], ['gAareO', ['brienz', 'thun'], '2135'], ['gAareJ', ['murten', 'neuenburg', 'biel'], '2029'], ['gReussL', ['vws'], '2018'], ['gLimmatL', ['zuerich'], '2243']];
  const SEE = Object.fromEntries(meta.seen.map(s => [s.id, s]));

  // Drei Stufen. 1: regulierte Seen bis zur heutigen Hochwassergrenze (Kapazität = Abstand des tiefsten Seestands im Jahr zur Grenze,
  // die Grenze selbst gilt Tag für Tag). 2: dazu Zusatzstau über der Grenze. 3: dazu derselbe Zusatzstau auf dem Bodensee.
  // Stufen. 1a: bis zum oberen Rand des 1991–2020 genutzten Bandes (99. Perzentil des Seestands). 1b: bis zur amtlichen
  // Hochwassergrenze (Neuenburger- und Murtensee ohne amtliche Grenze bleiben beim Band). 1c: dazu Neuenburger- und Murtensee
  // bis zum Beginn der Gefahrenstufe 4. 2: dazu Zusatzstau über der Grenze. 3: dazu derselbe Zusatzstau auf dem Bodensee.
  const STUFEN = ['1a', '1b', '1c', '2', '3'], stufeNr = s => parseInt(s, 10) || 0;
  const HW = Object.fromEntries(meta.seen.map(s => [s.id, s.grenzen ? s.grenzen.hoch : null]));        // heutige Hochwassergrenze
  let ZIEL = { ...HW }, MIT_RESERVE = true;       // Füllgrenze je See in der gewählten Stufe; Reserve nur gegenüber einer Hochwassergrenze
  function stufeZiel(stufe) {
    const z = {};
    for (const s of meta.seen) z[s.id] = !s.grenzen ? null : stufe === '1a' ? (s.band ? s.band.hoch : null) : stufe === '1b' && s.grenzen.tief == null ? (s.band ? s.band.hoch : null) : s.grenzen.hoch;
    return z;
  }
  function stufeCM(Y, stufe, zusatz) {
    const cm = {}, ziel = stufeZiel(stufe), nr = stufeNr(stufe);
    for (const s of meta.seen) {
      const w = Y.w[s.id] && Y.w[s.id].filter(v => v != null);
      if (s.reguliert) cm[s.id] = (ziel[s.id] != null && w && w.length ? Math.max(0, Math.ceil(100 * (ziel[s.id] - Math.min(...w)))) : 0) + (nr >= 2 ? zusatz : 0);
      else cm[s.id] = nr >= 3 ? zusatz : 0;
    }
    return cm;
  }
  // Stufe «Unbegrenzt»: Kapazität frei in Mio. m³, im Verhältnis der Fläche auf die gewählten Seen verteilt, ohne Hochwassergrenze
  const UNB = { mio: 1000, bodensee: false, ohne: false };
  const unbSeen = () => meta.seen.filter(s => s.reguliert || UNB.bodensee);
  function unbAnwenden() {
    const seen = unbSeen(), fl = seen.reduce((a, s) => a + s.flaeche_km2, 0);
    for (const s of meta.seen) CM[s.id] = seen.includes(s) ? UNB.mio / fl * 100 : 0;
    UEBER = Infinity; ZIEL = { ...HW }; MIT_RESERVE = false;
  }
  function stufeAnwenden(Y) {
    OFFEN = Z.stufe === 'unb' && UNB.ohne;
    if (Z.stufe === 'unb') { unbAnwenden(); return; }
    if (Z.stufe === '0') { for (const s of meta.seen) CM[s.id] = 0; UEBER = 0; ZIEL = { ...HW }; MIT_RESERVE = true; return; }
    if (Z.stufe === 'frei' || !Y) { ZIEL = { ...HW }; MIT_RESERVE = true; return; }
    Object.assign(CM, stufeCM(Y, Z.stufe, Z.zusatz)); UEBER = stufeNr(Z.stufe) >= 2 ? Z.zusatz : 0; ZIEL = stufeZiel(Z.stufe); MIT_RESERVE = Z.stufe !== '1a';
    if (Z.bodensee) for (const s of meta.seen) if (!s.reguliert) CM[s.id] = Z.zusatz;
  }
  // Rechnet ein Jahr mit einer Stufe (oder mit festen cm auf den regulierten Seen ohne Hochwassergrenze), ohne den Zustand der Seite zu ändern
  // Zwischenspeicher: Die Betriebsregel ist für A, C und D dieselbe; mit Voraussicht rechnen C und D gleich
  const SZ = new Map(), rechenart = (modus, ziel) => modus === 'regel' ? (ziel === 'B' ? 'rB' : 'r') : ziel === 'D' ? 'C' : ziel;
  function szenario(Y, stufe, modus = 'glw', cmFrei = null, ziel = Z.zielwahl) {
    const schl = [Y.jahr, stufe, modus, cmFrei, rechenart(modus, ziel)].join('|');
    if (!SZ.has(schl)) SZ.set(schl, szenarioRechnen(Y, stufe, modus, cmFrei, ziel));
    return SZ.get(schl);
  }
  function szenarioRechnen(Y, stufe, modus, cmFrei, ziel) {
    const altZW = Z.zielwahl; Z.zielwahl = ziel;
    const altCM = { ...CM }, altU = UEBER, altM = Z.modus, altN = NETZ, altZ = ZIEL, altR = MIT_RESERVE, altRegel = { ...REGEL }, altRes = RESERVE, altO = OFFEN;
    OFFEN = false;
    Object.assign(REGEL, REGEL_STD); RESERVE = 0.20;     // Kapitel 2 und 3 rechnen immer mit den Standardwerten, unabhängig vom Simulator
    if (cmFrei != null) { for (const s of meta.seen) CM[s.id] = s.reguliert ? cmFrei : 0; UEBER = Infinity; ZIEL = { ...HW }; }
    else if (!stufe) { for (const s of meta.seen) CM[s.id] = 0; UEBER = 0; }
    else { Object.assign(CM, stufeCM(Y, String(stufe), 50)); UEBER = stufeNr(stufe) >= 2 ? 50 : 0; ZIEL = stufeZiel(String(stufe)); MIT_RESERVE = String(stufe) !== '1a'; }
    Z.modus = modus; NETZ = VOLL;
    try { const S = simulieren(Y); return { S, k: kaubJahr(Y, S), v: S.V / 1e6, genutzt: S.O ? Math.max(...S.O.speicher) / 1e6 : 0, ueber: S.O ? S.O.ueber.reduce((a, b) => a + b, 0) : 0 }; }
    finally { Object.assign(CM, altCM); UEBER = altU; Z.modus = altM; NETZ = altN; ZIEL = altZ; MIT_RESERVE = altR; Object.assign(REGEL, altRegel); RESERVE = altRes; OFFEN = altO; Z.zielwahl = altZW; }
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
    const fenster = (a, b, start, vorrat = false) => {
      VORRAT = vorrat;
      // Grenze je Messstelle unterhalb eines Sees: Rückhalt aller Seen oberhalb zusammen höchstens P_SEE des Abflusses dort
      // und nie unter dessen gemessenen Tiefstwert im Fenster. Ohne Schranken: höchstens der ganze Abfluss (Wehr zu).
      STAT = gruppen.map(g => {
        let tief = Infinity; for (let i = a; i < b; i++) { const x = g.qk[i - g.lag]; if (x != null && x < tief) tief = x; }
        const lim = new Float64Array(b - a);
        for (let i = a; i < b; i++) { const x = g.qk[i - g.lag]; lim[i - a] = x == null ? 0 : Math.max(0, OFFEN ? x : Math.min(P_SEE * x, x - tief)); }
        return { lim, seen: g.seen };
      });
      // Hochwassergrenze je See: Seestand plus Zusatzstau bleibt unter der Grenze (plus Zuschlag UEBER). Zulässiger Inhalt des Sees s
      // am Tag t: (Grenze_s − W_s(t)) · A_s. Die Aktion am See liegt um die Fliesszeit vor der Wirkung am Ziel.
      SEEN = seenSim.map((g, k) => {
        const kap = g.hoch == null ? null : new Float64Array(b - a).fill(Infinity), voll = kap && new Float64Array(b - a).fill(Infinity), rate = new Float64Array(b - a).fill(Infinity);
        for (let i = a; i < b; i++) { const w = g.w[i - g.lag], x = g.qk[i - g.lag];
          if (kap && w != null) { kap[i - a] = Math.max(0, g.hoch + UEBER / 100 - w) * g.flaeche * 1e6; voll[i - a] = Math.max(0, g.hoch + UEBER / 100 - (MIT_RESERVE ? RESERVE : 0) - w) * g.flaeche * 1e6; }
          if (x != null) rate[i - a] = P_SEE * x; }
        return { cap: g.cap, kap, voll, rate, start: start ? start[k] : 0, st: gruppen.map((x, gi) => x.seen.includes(k) ? gi : -1).filter(gi => gi >= 0) };
      });
      MONAT = monat.slice(a, b);
      // Ziel A: tiefsten Stand heben; B: keine Tage unter 40 cm (Deckel 40 cm, gestaut ab 50 cm); C und D: wenige Tage unter dem GlW (Näherung)
      const ZW = Z.zielwahl, B40 = ZW === 'B' && Q_40 != null, qf = qz.slice(a, b);
      const o = Z.modus === 'regel' && glw ? regel(qf, V, B40 ? Q_40 : Q_GLW, REGEL.stauAb, REGEL.tage) : glw ? (B40 ? heben(qf, V, Q_40, Q_50) : ZW === 'C' || ZW === 'D' ? hebenTage(qf, V, Q_GLW, Q_STAU) : heben(qf, V, Q_GLW, Q_STAU)) : optimieren(qf, V);
      STAT = []; SEEN = []; VORRAT = false; return o;
    };
    const lz = zumZiel[BASEL] || 0, monat = [];
    for (const [y, len] of [[Y.jahr - 1, nv], [Y.jahr, n], [Y.jahr + 1, nn]]) for (let i = 0; i < len; i++) monat.push(new Date(Date.UTC(y, 0, 1 + i)).getUTCMonth() + 1);
    const stand = id => { const a = new Array(nv + n + nn).fill(null); for (const [y, o] of [[Yv, 0], [Y, nv], [Yn, nv + n]]) if (y && y.w[id]) y.w[id].forEach((x, i) => { a[o + i] = x; }); return a; };
    const seenSim = meta.seen.filter(s => CM[s.id] > 0 && s.knoten in zumZiel).map(s => ({ id: s.id, cap: CM[s.id] * s.flaeche_km2 * 1e4, w: stand(s.id), hoch: ZIEL[s.id], hw: HW[s.id], flaeche: s.flaeche_km2, qk: reihe(s.knoten), lag: zumZiel[s.knoten] || 0, knoten: s.knoten }));
    const gruppen = SEEGRUPPEN.map(([, , knoten]) => ({ qk: reihe(knoten), lag: zumZiel[knoten] || 0, seen: seenSim.map((s, k) => s.knoten in einzug(knoten) ? k : -1).filter(k => k >= 0) })).filter(g => g.seen.length);
    const istRegel = Z.modus === 'regel' && glw;
    // Mit Voraussicht: zwei Speicherjahre mit Übertrag. Betriebsregel: ein Lauf über Vorjahr, Jahr und Folgejahr, Beginn leer.
    const O1 = istRegel ? fenster(0, nv + n + nn, null) : fenster(a1, b1, null, true), O2 = istRegel ? null : fenster(b1, b2, O1 ? O1.ende : null);
    if (!O1 && !O2) { NETZ = alt; return { q: Y.q, wirkung: {}, V, O: null, zid }; }
    const O = { tief: (O2 || O1).tief, hoch: (O2 || O1).hoch, winter: O1 && O2 ? { tief: O1.tief, hoch: O1.hoch } : null, glw: !!glw, regel: istRegel, deckel: (O2 || O1).deckel || (O2 || O1).tief, ziel: Z.zielwahl, gehoben: O1 && O2 && O2.gehoben != null ? (O1.gehoben || 0) + O2.gehoben : null,
      abgabe: new Float64Array(n), rueck: new Float64Array(n), speicher: new Float64Array(n), entl: new Float64Array(n), netto: new Float64Array(n), ueber: new Uint8Array(n), see: seenSim.map(() => new Float64Array(n)), seeId: seenSim.map(g => g.id) };
    for (let i = 0; i < n; i++) { const g = nv + i, o = istRegel ? O1 : g < b1 ? O1 : O2, k = istRegel ? g : g < b1 ? g - a1 : g - b1;
      if (o) { O.abgabe[i] = o.abgabe[k]; O.rueck[i] = o.rueck[k]; O.speicher[i] = o.speicher[k]; O.entl[i] = o.entl[k]; O.netto[i] = o.abgabe[k] + o.entl[k] - o.rueck[k]; O.ueber[i] = o.ueber[k]; o.see.forEach((a, s) => { O.see[s][i] = a[k]; }); } }
    // Hochwasser: Tag, an dem ein See mit Zusatzstau über seiner heutigen Hochwassergrenze steht (unabhängig von der Stufe)
    O.ueber.fill(0); O.hwSee = seenSim.map(() => 0);
    seenSim.forEach((g, k) => { if (g.hw == null) return; for (let i = 0; i < n; i++) { const w = g.w[nv + i - g.lag], z = O.see[k][i] / (g.flaeche * 1e6); if (w != null && z > .005 && w + z > g.hw + .005) { O.ueber[i] = 1; O.hwSee[k]++; } } });
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
    Z.ziel = KAUB;                               // die Seite erzählt immer an Kaub
    w.append(knoepfe(T.ansicht, [['heute', T.heute], ['extrem', T.extrem], ['tag', T.tag], ['mq', T.mq], ['nw', T.nw]], Z.ansicht, v => {
      if (v === 'tag' && Z.ansicht === 'extrem' && Z.i0 != null) Z.tag = Z.i0;
      Z.ansicht = v; if (v === 'heute') { Z.jahr = LETZTES; Z.tag = null; } alles();
    }));
    Z.sim = false;                               // Kapitel 1 zeigt nur Gemessenes; gerechnet wird erst ab Kapitel 3
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
      return w >= k[0][1] - 20 ? y : null;
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
    // Staustufen als Balken quer zum Rhein: Richtung des Flusses aus den zwei nächsten Kilometerpunkten
    const quer = s => { if (KM.length < 2) return 80; let k = 0; KM.forEach((p, i) => { if ((p[2] - s.lat) ** 2 + (p[1] - s.lon) ** 2 < (KM[k][2] - s.lat) ** 2 + (KM[k][1] - s.lon) ** 2) k = i; });
      const a = KM[Math.max(0, k - 1)], b = KM[Math.min(KM.length - 1, k + 1)], dx = (b[1] - a[1]) * Math.cos(s.lat * Math.PI / 180), dy = b[2] - a[2];
      return Math.round(Math.atan2(-dy, dx) * 180 / Math.PI); };
    for (const s of meta.staustufen) L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: `<div class="stau" style="transform:rotate(${quer(s)}deg)"></div>`, iconSize: [5, 15], iconAnchor: [2.5, 7.5] }), title: s.name, alt: s.name, zIndexOffset: 300 }).addTo(ebene)
      .bindTooltip(`${FR ? 'Barrage' : 'Staustufe'} ${s.name}`);
  }
  // Nutzen je Abschnitt über das Jahr: Tage unter GlW und kleinste Fahrrinnentiefe, gemessen und simuliert
  function nutzenTafel(R) {
    const Y = R.Y, S = R.S, n = (Y.q[BASEL] || []).length;
    const zeilen = RP.map(p => {
      let tage = 0, u0 = 0, u1 = 0, hub = 0, gehoben = 0, t0 = null, t1 = null;
      for (let i = 0; i < n; i++) {
        const m = pegelstand(Y, S, p, i, false); if (!m) continue; const s = pegelstand(Y, S, p, i, true), zm = zustand(m.w, p), zs = zustand(s.w, p);
        tage++; if (zm.fehl > 0) u0++; if (zs.fehl >= 1) u1++;
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
    const B = BREITE(), H = 346, L = 62, RR = 14, O = 34, U = 78, k0 = 164, k1 = RP[RP.length - 1].bis;
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
      if (Z.sim && zs && zm && Math.abs(zs.tiefe - zm.tiefe) >= .5) s += `<line x1="${a}" x2="${b}" y1="${y(zs.tiefe)}" y2="${y(zs.tiefe)}" stroke="#003399" stroke-width="4"/><text class="blau" x="${(a + b) / 2}" y="${y(zs.tiefe) - 7}" text-anchor="middle">${zahl(zs.tiefe)}</text>`;
      s += `<text x="${x(p.km)}" y="${H - U + 20 + tief}" text-anchor="middle">${h(p.name)} ${zahl(p.km, 0)}</text>`;
    }
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><text x="${x(170)}" y="${H - U + 20}" text-anchor="middle">${nm('Basel')} 170</text><text x="${x(334) - 6}" y="${H - U + 20}" text-anchor="end">Iffezheim 334</text><text x="${B - RR}" y="${H - 6}" text-anchor="end">${T.lKm}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('laengslegende').innerHTML = `<span><i></i>${T.gemessen}</span>${Z.sim && R.S && R.S.O ? `<span><i class="blau"></i>${T.simu.toLowerCase()}</span>` : ''}<span><i class="strich"></i>${T.lSoll}</span>`;
  }

  // 2 Jahresband: Zustand je Abschnitt und Tag, gemessen und simuliert
  function jahresband(R) {
    const svg = $('band'), Y = R.Y;
    if (!Y || !RP.length) { $('bandfig').hidden = true; return; }
    $('bandfig').hidden = false;
    const n = (Y.q[BASEL] || []).length, S = R.S, sim = S && S.O, B = BREITE(), L = 96, RR = 14, zh = 17, ab = 3, x = i => L + (B - L - RR) * i / n;
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
      if (AUSL) { if (m.w < AUSL.keine_unter) k0++; if (s.w <= AUSL.keine_unter - 1) k1++; } }   /* simuliert: 1 cm Toleranz wie beim GlW (Abweichung zwischen gemessenem Pegel und Abflusskurve) */
    return { tage, t0, t1, u0, u1, k0, k1, a0: nu ? a0 / nu : null, a1: nu ? a1 / nu : null };   // k = Tage ohne Schifffahrt, a = mittlere Auslastung an Tagen unter GlW
  }

  // 3 Kapazitätskurve: Nutzen in Kaub, wenn alle gewählten Stauhöhen gemeinsam skaliert werden
  function kapazitaetskurve(R) {
    const svg = $('kapkurve'), Y = R.Y;
    if (!Y || !PK || !Y.q[KAUB]) { svg.innerHTML = ''; $('kaptext').textContent = ''; return; }
    const punkte = [0, 10, 25, 50, 100, 150, 200, 300, 400, 600].map(cm => { const z = cm ? szenario(Y, 0, 'glw', cm) : { k: kaubJahr(Y, OHNE), v: 0 }; return { cm, v: z.v, ...z.k }; }).filter(p => p.t1 != null);
    const stufen = STUFEN.map(st => { const z = szenario(Y, st, 'glw'); return { st, v: z.genutzt, t1: z.k.t1 }; }).filter(p => p.t1 != null);
    if (punkte.length < 2) { svg.innerHTML = ''; $('kaptext').textContent = ''; return; }
    const B = BREITE(), H = 320, L = 62, RR = 20, O = 34, U = 46, xmax = punkte[punkte.length - 1].v, ymin = Math.floor(Math.min(...punkte.map(p => p.t1)) / 20) * 20 - 20, ymax = Math.max(PK.tugl, ...punkte.map(p => p.t1)) + 20;
    const x = v => L + (B - L - RR) * v / xmax, y = t => O + (H - O - U) * (1 - (t - ymin) / (ymax - ymin));
    let s = `<text class="fett" x="${L}" y="14">${T.kTitel} (${Z.jahr})</text>`;
    for (let t = Math.ceil(ymin / 20) * 20; t <= ymax; t += 20) s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`;
    const xs = [100, 200, 250, 500, 1000].find(q => xmax / q <= 8) || 2000;
    for (let v = 0; v <= xmax; v += xs) s += `<line class="achse" x1="${x(v)}" x2="${x(v)}" y1="${H - U}" y2="${H - U + 5}"/><text x="${x(v)}" y="${H - U + 20}" text-anchor="middle">${zahl(v)}</text>`;
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><text x="${B - RR}" y="${H - 6}" text-anchor="end">${T.kX}</text>` +
      `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(PK.tugl)}" y2="${y(PK.tugl)}"/><text class="fett" x="${B - RR - 4}" y="${y(PK.tugl) - 6}" text-anchor="end">${T.lSoll} ${zahl(PK.tugl)}</text>` +
      `<path d="M${punkte.map(p => `${x(p.v).toFixed(1)},${y(p.t1).toFixed(1)}`).join('L')}" fill="none" stroke="#000" stroke-width="2"/>` +
      punkte.map(p => `<rect x="${x(p.v) - 4}" y="${y(p.t1) - 4}" width="8" height="8" fill="#fff" stroke="#000" stroke-width="2"><title>${zahl(p.v)} ${T.mio}${DP}${zahl(p.t1)} cm</title></rect>`).join('') +
      stufen.map(p => `<rect x="${x(p.v) - 6}" y="${y(p.t1) - 6}" width="12" height="12" fill="#003399"><title>${T['st' + p.st]}${DP}${zahl(p.v)} ${T.mio}, ${zahl(p.t1)} cm</title></rect><text class="blau" x="${x(p.v) + 10}" y="${y(p.t1) + 16}">${p.st}</text>`).join('');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    const voll = punkte.find(p => p.t1 >= PK.tugl - 1);
    $('kaptext').textContent = `${T.kText} ${!punkte[0].u0 ? T.nieUnter : voll ? `${T.kErreicht} ${zahl(voll.v)} ${T.mio}.` : T.kNie} ${T.gem}${DP}${zahl(punkte[0].t0)} cm.`;
    const kj = Y.jahr; csvKnopf($('kapfig'), () => `rhein-kapazitaet-${kj}`, () => ({ titel: `${T.kTitel} (${kj})`, kopf: ['reihe', 'zusatzstau_cm', 'kapazitaet_oder_genutzt_Mio_m3', 'kleinste_fahrrinnentiefe_cm', 'tage_unter_GlW', 'tage_unter_40cm'],
      zeilen: punkte.map(p => ['kurve', p.cm, p.v, p.t1, p.u1, p.k1]).concat(stufen.map(p => [`stufe_${p.st}`, null, p.v, p.t1, null, null])) }));
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
  map.on('popupopen', e => typoFr(e.popup.getElement()));
  const ebene = L.layerGroup().addTo(map);
  const RAHMEN = { [BASEL]: [[46.6, 7.0], [47.8, 9.8]], [KAUB]: [[46.6, 6.9], [50.2, 9.9]] };
  let rahmenFuer = null;
  const MIT_NAME = { '2473': 'r', '2288': 'r', '2135': 'r', '2289': 'l', '23700200': 'l', '23800690': 'r', '23900200': 'l', '24700404': 'r', '25100100': 'l', '25700100': 'l', '2044': 'r', '2029': 'l' };
  function karteZeichnen(R) {
    if (rahmenFuer == null) { map.fitBounds(RAHMEN1[2]); rahmenFuer = Z.ziel; }
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
    return html + '</div>' + `<p>${s.reguliert ? h(FR ? (BEM_FR[s.id] || s.bemerkung) : s.bemerkung) : T.keinWehr}</p>`;
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
    const jahrSel = (liste, aktiv, label) => `<label class="jahrzahl"><span>${label}</span><select class="jahrwahl" aria-label="${h(label)}">${liste.map(x => `<option${x === aktiv ? ' selected' : ''}>${x}</option>`).join('')}</select></label>`;
    $('simkopf').innerHTML = jahrSel(meta.jahre.slice().reverse(), Z.simjahr, T.skJahr);
    $('simhinweis').textContent = startHinweis(); zielKnoepfe($('simziel'));
    $('simkopf').querySelector('select').addEventListener('change', e => { Z.simjahr = +e.target.value; alles(); });
    sj.append(knoepfe(T.rkEigen, [['frei', T.stFrei], ['unb', T.stUnb]], Z.stufe, v => { Z.stufe = v; if (v === 'frei') UEBER = 0; alles(); }));
    $('rkmethode').innerHTML = `<p>${T.rText.regel}</p><p>${T.rText.glw}</p><p>${T.uOhneText}</p>`;
    if (Z.stufe === 'unb') {
      const m = feld(T.uMio, `<input type="number" min="0" step="50" value="${Math.round(UNB.mio)}">`);
      m.querySelector('input').addEventListener('change', e => { UNB.mio = Math.max(0, +e.target.value || 0); alles(); });
      const se = feld(T.uSeen, `<select><option value="0"${UNB.bodensee ? '' : ' selected'}>${T.uReg}</option><option value="1"${UNB.bodensee ? ' selected' : ''}>${T.uMitB}</option></select>`);
      se.querySelector('select').addEventListener('change', e => { UNB.bodensee = e.target.value === '1'; alles(); });
      const sc = feld(T.uSchr, `<select><option value="0"${UNB.ohne ? '' : ' selected'}>${T.uBleiben}</option><option value="1"${UNB.ohne ? ' selected' : ''}>${T.uAuf}</option></select>`);
      sc.querySelector('select').addEventListener('change', e => { UNB.ohne = e.target.value === '1'; alles(); });
      sj.append(m, se, sc);
    }
    if (Z.stufe === 'frei') { const zu = feld(T.zusatzU, `<input type="number" min="0" step="5" value="${Z.stufe === 'frei' ? UEBER : Z.zusatz}">`);
      zu.querySelector('input').addEventListener('change', e => { const v = Math.max(0, +e.target.value || 0); if (Z.stufe === 'frei') UEBER = v; else Z.zusatz = v; alles(); }); sj.append(zu); }
    $('stufentext').textContent = `${T.stText[Z.stufe]}${Z.stufe === 'unb' && UNB.ohne ? ' ' + T.uOhneText : ''}${Z.bodensee && !['frei', 'unb'].includes(Z.stufe) ? ' ' + T.stBod : ''}`;
    if (['frei', 'unb'].includes(Z.stufe)) $('rkjesee').open = true;
    const res = feld(T.rRes, `<input type="number" min="0" max="100" step="5" value="${Math.round(RESERVE * 100)}">`);
    res.querySelector('input').addEventListener('change', e => { RESERVE = Math.max(0, Math.min(100, +e.target.value || 0)) / 100; alles(); });
    const alle = feld(T.alle, `<input type="number" min="0" value="">`);
    alle.querySelector('input').addEventListener('change', e => { const v = Math.max(0, +e.target.value || 0); meta.seen.forEach(s => { if (s.reguliert) CM[s.id] = v; }); Z.stufe = 'frei'; alles(); });
    const orte = [...new Set([R && R.S && R.S.zid || Z.ziel, KAUB, BASEL, '2288', '2135', '2029', '2018', '2243', '2205'])];
    const ort = feld(T.verlaufFuer, `<select>${orte.map(id => `<option value="${id}"${id === Z.verlauf ? ' selected' : ''}>${h(GW(ST[id]))}–${h(kurz(ST[id]))}</option>`).join('')}</select>`);
    ort.querySelector('select').addEventListener('change', e => { Z.verlauf = e.target.value; alles(); });
    const regelFelder = [];
    {
      const s = feld(T.rStau, `<input type="number" min="800" max="3000" step="50" value="${REGEL.stauAb}">`), d = feld(T.rTage, `<input type="number" min="5" max="120" value="${REGEL.tage}">`);
      s.querySelector('input').addEventListener('change', e => { REGEL.stauAb = Math.max(800, Math.min(3000, +e.target.value || 1000)); alles(); });
      d.querySelector('input').addEventListener('change', e => { REGEL.tage = Math.max(5, Math.min(120, +e.target.value || 30)); alles(); });
      const mon = v => `<select>${T.monate.map((m, k) => `<option value="${k + 1}"${k + 1 === v ? ' selected' : ''}>${m}</option>`).join('')}</select>`;
      const von = feld(T.rVon, mon(REGEL.von)), bis = feld(T.rBis, mon(REGEL.bis)), wi = feld(T.rWinter, `<select><option value="1"${REGEL.winter ? ' selected' : ''}>${T.an}</option><option value="0"${REGEL.winter ? '' : ' selected'}>${T.aus}</option></select>`);
      von.querySelector('select').addEventListener('change', e => { REGEL.von = +e.target.value; alles(); });
      bis.querySelector('select').addEventListener('change', e => { REGEL.bis = +e.target.value; alles(); });
      wi.querySelector('select').addEventListener('change', e => { REGEL.winter = e.target.value === '1'; alles(); });
      regelFelder.push(s, d, von, bis, wi);
    }
    w.append(...regelFelder, res);
    if (Z.stufe === 'frei') sj.append(alle);
    const sd = $('simdetail'); sd.textContent = '';
    sd.append(knoepfe(T.rkDetail, [['regel', T.zRegel], ['glw', T.zGlw], ['min', T.zMin]], Z.modus, v => { Z.modus = v; alles(); }), ort, knoepfe(T.ausschnitt, [['0', T.ganz], ['1', T.phase]], Z.zoom ? '1' : '0', v => { Z.zoom = v === '1'; alles(); }));
  }
  // Nötige Staukapazität für den GlW an allen Tagen: gleiche Seen, gleiche Regeln, Kapazität durch Halbieren gesucht
  let noetigNr = 0; const MAXMIO = 10000;
  // Kleinste Kapazität (Mio. m³), mit der Kaub im Jahr Y an keinem Tag unter dem GlW liegt: gleiche Seen, gleiche Regeln, durch Halbieren gesucht
  // Kriterium je Ziel: A und C kein Tag unter dem GlW, B kein Tag unter 40 cm, D höchstens 20 Tage unter dem GlW
  const ZIELERREICHT = { A: k => k.u1 === 0, B: k => k.k1 === 0, C: k => k.u1 === 0, D: k => k.u1 <= 20 };
  const ZIELNOETIG = { A: k => k.u0 > 0, B: k => k.k0 > 0, C: k => k.u0 > 0, D: k => k.u0 > 20 };
  function suche(Y, modus, bodensee = false, ohne = false, ziel = Z.zielwahl) {
    const altCM = { ...CM }, alt = [UEBER, ZIEL, MIT_RESERVE, NETZ, OFFEN, Z.modus, UNB.mio, UNB.bodensee, Z.zielwahl], ok = ZIELERREICHT[ziel];
    UNB.bodensee = bodensee; OFFEN = ohne; Z.modus = modus; NETZ = VOLL; Z.zielwahl = ziel;
    const pruef = mio => { UNB.mio = mio; unbAnwenden(); const S = simulieren(Y); return { ...kaubJahr(Y, S), hw: S.O ? S.O.ueber.reduce((x, y) => x + y, 0) : 0 }; };
    try {
      const k0 = kaubJahr(Y, OHNE), bed = bedarfGlw(Y), fl = unbSeen().reduce((a, s) => a + s.flaeche_km2, 0);
      if (!ZIELNOETIG[ziel](k0)) return { noetig: false, k0, bed, fl, ziel };
      let lo = 0, hi = Math.max(100, bed), kh = pruef(hi);
      while (!ok(kh) && hi < MAXMIO) { lo = hi; hi = Math.min(MAXMIO, hi * 2); kh = pruef(hi); }
      if (!ok(kh)) return { noetig: true, erreicht: false, hi, kh, k0, bed, fl, ziel };
      for (let i = 0; i < 24 && hi - lo > Math.max(1, hi * .005); i++) { const m = (lo + hi) / 2, km = pruef(m); if (ok(km)) { hi = m; kh = km; } else lo = m; }
      return { noetig: true, erreicht: true, hi, kh, k0, bed, fl, ziel };
    } finally { Object.assign(CM, altCM); [UEBER, ZIEL, MIT_RESERVE, NETZ, OFFEN, Z.modus, UNB.mio, UNB.bodensee, Z.zielwahl] = alt; }
  }
  // Am Anfang des Simulators: nötige Kapazität des gewählten Jahres neben dem Platz jeder Stufe
  let bedarfNr = 0;
  function bedarfZeichnen(R) {
    const el = $('bedarf'), Y = R.Y;
    if (!Y || !Y.q[KAUB] || !PK) { el.innerHTML = ''; el.dataset.schl = ''; return; }
    const schl = JSON.stringify([Y.jahr, REGEL, RESERVE, Z.zielwahl]); if (el.dataset.schl === schl) return;
    el.dataset.schl = schl; el.innerHTML = `<h2>${T.bdTitel} ${Y.jahr}</h2><p class="hinweis">${T.jRechnet}</p>`;
    const nr = ++bedarfNr;
    setTimeout(() => {
      if (nr !== bedarfNr) return;
      const v = suche(Y, 'glw'); if (nr !== bedarfNr) return;
      if (!v.noetig) { el.innerHTML = `<h2>${T.bdTitel} ${Y.jahr}</h2><p>${nichtNoetig()}</p>`; return; }
      const r = suche(Y, 'regel'), vo = v.erreicht ? null : suche(Y, 'glw', false, true), fl = v.fl, cm = x => zahl(x / fl * 100);
      BEDARF[Y.jahr + Z.zielwahl] = { v, r };
      const stufen = STUFEN.map(s => { const c = stufeCM(Y, s, 50); return { s, mio: meta.seen.reduce((a, x) => a + c[x.id] * x.flaeche_km2 / 100, 0) }; });
      const wert = e => e.erreicht ? `<b>${zahl(e.hi)} ${T.mio}</b> = ${cm(e.hi)} cm${e.kh.hw ? ` · <span class="hw">${T.hwT}${DP}${e.kh.hw} ${e.kh.hw === 1 ? (FR ? 'jour' : 'Tag') : T.tageW}</span>` : ''}` : `<b>${T.bdNicht}</b> (${LL(`mit ${zahl(MAXMIO)} Mio. m³ bleiben`, `avec ${zahl(MAXMIO)} mio m³ restent`)} ${zielRest(e.kh, e.k0)})`;   // FR provisorisch
      let html = `<h2>${T.bdTitel} ${Y.jahr}</h2><p class="lead">${zielLead(Y.jahr, v.k0, fl)}</p>` +
        `<div class="rollen"><table class="erg"><tbody><tr><td>${T.bdFehl}</td><td><b>${zahl(v.bed)} ${T.mio}</b> = ${cm(v.bed)} cm</td></tr><tr><td>${T.bdVor}</td><td>${wert(v)}</td></tr><tr><td>${T.bdRegel}</td><td>${wert(r)}</td></tr>${vo ? `<tr><td>${T.bdOhne}</td><td>${wert(vo)}</td></tr>` : ''}</tbody></table></div>`;
      // Balken: nötig gegen Platz je Stufe
      const reihen = [[T.bdFehl, v.bed, 'fehl'], [T.bdVor, v.erreicht ? v.hi : null, 'vor'], [T.bdRegel, r.erreicht ? r.hi : null, 'regel'], ...(vo ? [[T.bdOhne, vo.erreicht ? vo.hi : null, 'vor']] : []), ...stufen.map(x => [`${T.stufe} ${x.s}`, x.mio, 'stufe'])];
      const breit = Math.max(340, Math.min(1000, el.clientWidth || 800)), max = Math.max(...reihen.map(x => x[1] || 0)) * 1.08, B = breit, L = breit < 600 ? 150 : 230, Rr = breit < 600 ? 56 : 90, zh = 30, O = 30, H = O + reihen.length * zh + 30, x = m => L + (B - L - Rr) * m / max;
      const ziel = v.erreicht ? v.hi : vo && vo.erreicht ? vo.hi : null;
      let s = `<text class="fett" x="0" y="14">${T.bdGrafik}</text>`;
      reihen.forEach(([name, m, art], i) => { const y0 = O + i * zh;
        s += `<text x="${L - 10}" y="${y0 + 15}" text-anchor="end">${h(name)}</text>`;
        if (m == null) { s += `<text x="${L}" y="${y0 + 15}">${T.bdNicht}</text>`; return; }
        const f = art === 'fehl' ? 'url(#g_e1)' : art === 'vor' ? '#003399' : art === 'regel' ? 'url(#s_e2)' : '#fff', st = art === 'stufe' ? '#000' : art === 'fehl' ? '#000' : '#003399';
        s += `<rect x="${L}" y="${y0 + 3}" width="${Math.max(1, x(m) - L).toFixed(1)}" height="16" fill="${f}" stroke="${st}" stroke-width="1.5"/><text x="${x(m) + 6}" y="${y0 + 15}">${zahl(m)}</text>`; });
      if (ziel != null) s += `<line x1="${x(ziel)}" x2="${x(ziel)}" y1="${O - 6}" y2="${H - 26}" stroke="#003399" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      s += `<line class="achse" x1="${L}" x2="${L}" y1="${O - 6}" y2="${H - 26}"/><text x="${B - Rr}" y="${H - 6}" text-anchor="end">${T.mio}</text>`;
      html += `<figure class="grafik" id="bedarffig"><svg viewBox="0 0 ${B} ${H}" role="img">${s}</svg><p class="hinweis">${T.bdHinweis}</p></figure>`;
      el.innerHTML = html;
      csvKnopf($('bedarffig'), () => `rhein-noetige-kapazitaet-${Y.jahr}`, () => ({ titel: `${T.bdTitel} ${Y.jahr}`, kopf: ['reihe', 'Mio_m3', 'cm_auf_regulierten_Seen'], zeilen: reihen.map(([n, m]) => [n, m, m == null ? null : m / fl * 100]) }));
      typoFr(el); if (Z.simjahr === Y.jahr) reglerZeichnen({ Y });
    }, 30);
  }
  // Texte je Ziel für den nötigen Speicher. FR provisorisch
  function nichtNoetig() { const z = Z.zielwahl; return z === 'B' ? LL('Kaub liegt in diesem Jahr an keinem Tag unter 40 cm.', 'Kaub ne passe aucun jour sous 40 cm cette année.') : z === 'D' ? LL('Kaub liegt in diesem Jahr an höchstens 20 Tagen unter dem GlW.', 'Kaub passe au plus 20 jours sous le GlW cette année.') : T.nieUnter; }
  function zielRest(kh, k0) { const z = Z.zielwahl; return z === 'B' ? LL(`${kh.k1} von ${k0.k0} Tagen unter 40 cm`, `${kh.k1} jours sur ${k0.k0} sous 40 cm`) : z === 'D' ? LL(`${kh.u1} Tage unter dem GlW, mehr als 20`, `${kh.u1} jours sous le GlW, plus de 20`) : LL(`${kh.u1} von ${k0.u0} Tagen unter dem GlW`, `${kh.u1} jours sur ${k0.u0} sous le GlW`); }
  function zielLead(j, k0, fl) { const z = Z.zielwahl, f = zahl(fl);
    return z === 'B' ? LL(`${j} lag Kaub an ${k0.k0} Tagen unter 40 cm. Damit das nicht passiert, hätten die regulierten Seen (${f} km²) so viel speichern müssen:`, `En ${j}, Kaub est resté ${k0.k0} jours sous 40 cm. Pour l’éviter, les lacs régulés (${f} km²) auraient dû stocker :`)
      : z === 'D' ? LL(`${j} lag Kaub an ${k0.u0} Tagen unter dem GlW. Damit es höchstens 20 Tage sind, hätten die regulierten Seen (${f} km²) so viel speichern müssen:`, `En ${j}, Kaub est resté ${k0.u0} jours sous le GlW. Pour qu’il y en ait au plus 20, les lacs régulés (${f} km²) auraient dû stocker :`)
        : LL(`${j} lag Kaub an ${k0.u0} Tagen unter dem GlW. Damit das nicht passiert, hätten die regulierten Seen (${f} km²) so viel speichern müssen:`, `En ${j}, Kaub est resté ${k0.u0} jours sous le GlW. Pour l’éviter, les lacs régulés (${f} km²) auraient dû stocker :`); }
  function noetigZeichnen(R) {
    const el = $('noetig');
    if (Z.stufe !== 'unb' || !R.Y || !R.Y.q[KAUB] || !PK) { el.hidden = true; el.innerHTML = ''; el.dataset.schl = ''; return; }
    const Y = R.Y, schl = JSON.stringify([Y.jahr, Z.modus, UNB.bodensee, UNB.ohne, REGEL, RESERVE, Z.zielwahl]);
    el.hidden = false; if (el.dataset.schl === schl) return;
    el.dataset.schl = schl; el.innerHTML = `<b>${T.uTitel}</b> ${T.jRechnet}`;
    const nr = ++noetigNr;
    setTimeout(() => {
      if (nr !== noetigNr) return;
      const e = suche(Y, Z.modus, UNB.bodensee, UNB.ohne), fl = e.fl, bed = e.bed, k0 = e.k0;
      const seenT = UNB.bodensee ? T.uMitB : T.uReg, weise = Z.modus === 'regel' ? T.eRegel : T.eBest;
      if (!e.noetig) { el.innerHTML = `<b>${T.uTitel}</b> ${nichtNoetig()}`; return; }
      let hi = e.hi, kh = e.kh;
      if (!e.erreicht) {
        // FR provisorisch (Ziel)
        el.innerHTML = `<b>${T.uTitel}</b> ` + LL(`Auch mit ${zahl(hi)} Mio. m³ bleiben ${Y.jahr} ${zielRest(kh, k0)} (${weise}). Mehr Platz nützt nicht, es fehlt das Wasser zum Füllen. Gestaut wird nur${Z.modus === 'regel' ? ` von ${T.monate[REGEL.von - 1]} bis ${T.monate[REGEL.bis - 1]} und nur über ${zahl(REGEL.stauAb)} m³/s in Kaub` : ', wenn Kaub mindestens 10 cm über dem GlW liegt'}${UNB.ohne ? '' : ', höchstens 10 % des Abflusses in Kaub und 20 % des Abflusses unterhalb der Seen'}.${Z.modus === 'regel' ? ' Mehr bringen längere Staumonate oder eine tiefere Schwelle.' : ''}${UNB.ohne ? '' : ' Mit «Schranken aufgehoben» rechnen.'}`,
          `Même avec ${zahl(hi)} mio m³, il reste en ${Y.jahr} ${zielRest(kh, k0)} (${weise}). Plus de place n’aide pas, il manque l’eau pour le remplissage. On ne retient ${Z.modus === 'regel' ? `que de ${T.monate[REGEL.von - 1]} à ${T.monate[REGEL.bis - 1]} et qu’au-dessus de ${zahl(REGEL.stauAb)} m³/s à Kaub` : 'que si Kaub est au moins 10 cm au-dessus du GlW'}${UNB.ohne ? '' : ', au plus 10 % du débit à Kaub et 20 % du débit en aval des lacs'}.${Z.modus === 'regel' ? ' Des mois de retenue plus longs ou un seuil plus bas apportent davantage.' : ''}${UNB.ohne ? '' : ' Calculer avec les limites « levées ».'}`);
        typoFr(el); return;
      }
      el.innerHTML = `<b>${T.uTitel}</b> ` + LL(`Für das Ziel «${ZIELNAME[Z.zielwahl]}» ${Y.jahr} hätte es <b>${zahl(hi)} Mio. m³</b> gebraucht (${weise}). Das sind ${zahl(hi / fl * 100)} cm auf ${zahl(fl)} km² (${seenT}). Summe der Fehlbeträge: ${zahl(bed)} Mio. m³. ${kh.hw ? `Mit dieser Kapazität stünde ein See an <b>${kh.hw} ${kh.hw === 1 ? 'Tag' : 'Tagen'}</b> über seiner Hochwassergrenze.` : 'Kein See stünde über seiner Hochwassergrenze.'}`,
        `Pour l’objectif « ${ZIELNAME[Z.zielwahl]} » en ${Y.jahr}, il aurait fallu <b>${zahl(hi)} mio m³</b> (${weise}). Cela fait ${zahl(hi / fl * 100)} cm sur ${zahl(fl)} km² (${seenT}). Somme des déficits : ${zahl(bed)} mio m³. ${kh.hw ? `Avec cette capacité, un lac serait <b>${kh.hw} ${kh.hw === 1 ? 'jour' : 'jours'}</b> au-dessus de sa limite de hautes eaux.` : 'Aucun lac ne serait au-dessus de sa limite de hautes eaux.'}`) +
        ` <button type="button" class="textknopf">${T.uUebernehmen}</button>`;
      el.querySelector('button').addEventListener('click', () => { UNB.mio = Math.ceil(hi); alles(); });
      typoFr(el);
    }, 30);
  }
  function simSeen() {
    $('simseen').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.flaeche} km²</th><th class="z">${T.jecm} Mio. m³</th><th class="z">${T.band}</th><th class="z">${T.grenzenK}</th><th style="width:22%">${T.zusatz}</th><th class="z">cm</th><th class="z">${T.vol} Mio. m³</th></tr></thead><tbody>` +
      SEEGRUPPEN.map(([g, ids]) => `<tr class="gruppenkopf"><td colspan="8">${T[g]}</td></tr>` + ids.map(id => { const s = SEE[id]; return `<tr><td>${h(nm(s.name))}</td><td class="z">${zahl(s.flaeche_km2, 1)}</td><td class="z">${zahl(s.flaeche_km2 / 100, 2)}</td>` +
        `<td class="z">${s.band ? `${zahl(s.band.band_m, 2)} m · ${zahl(s.band.volumen_mio_m3)}` : '–'}</td>` +
        `<td class="z" title="${s.grenzen ? h(FR ? ART_FR(s.grenzen.art) : s.grenzen.art) : ''}">${s.grenzen ? `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} · ${zahl(s.grenzen.volumen_mio_m3)}` : '–'}</td>` +
        `<td><input type="range" min="0" max="250" step="1" value="${CM[id]}" data-see="${id}" aria-label="${h(nm(s.name))}${DP}${T.zusatz} cm"></td>` +
        `<td class="z" id="cm-${id}"></td><td class="z" id="vol-${id}"></td></tr>`; }).join('')).join('') +
      `<tr class="summe"><td colspan="7">${T.volumen}</td><td class="z" id="vol-summe"></td></tr></tbody></table></div>`;
    $('simseen').querySelectorAll('input').forEach(i => { i.addEventListener('input', () => { Z.stufe = 'frei'; CM[i.dataset.see] = +i.value; alles(true); }); i.addEventListener('change', () => alles()); });
  }
  const tageUnter = (q, grenze) => grenze == null || !q ? null : q.reduce((n, x) => n + (x != null && x < grenze ? 1 : 0), 0);
  function simZeichnen(R) {
    let v = 0;
    for (const s of meta.seen) { const m = CM[s.id] * s.flaeche_km2 / 100; v += m; $('cm-' + s.id).textContent = zahl(CM[s.id]); const r = $('simseen').querySelector(`input[data-see="${s.id}"]`); if (r && CM[s.id] > +r.max) r.max = Math.ceil(CM[s.id]); if (r && +r.value !== CM[s.id]) r.value = CM[s.id]; $('vol-' + s.id).textContent = zahl(m, 1); }
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
      kachel(`${T.unterGlw} ${Z.jahr}`, kjU ? `${zahl(kjU.u0)} → ${zahl(kjU.u1)}` : `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) +
      kachel(T.bedarf, `${zahl(O.bedarf / 1e6)} ${T.mio}`, `${T.bedarfText} ${zahl(O.bedarf / 1e4 / flaeche)} cm`) : '';
    const hwTage = O.ueber.reduce((a, b) => a + b, 0), hwSeen = O.seeId.filter((id, k) => O.hwSee[k]).map((id, k2) => nm(SEE[id].name));
    $('hochwasser').className = hwTage ? 'warnung' : 'warnung ok';
    $('hochwasser').innerHTML = `<b>${T.hwT}</b> ` + (hwTage ? `${FR ? 'Sur' : 'An'} <b>${hwTage}</b> ${T.hwSatz}${DP}${O.seeId.map((id, k) => O.hwSee[k] ? `${h(nm(SEE[id].name))} ${O.hwSee[k]}` : '').filter(Boolean).join(', ')}.` : T.hwKein);
    noetigZeichnen(R); bedarfZeichnen(R);
    $('simwerte').innerHTML = kopf + kachel(`${T.minTag} ${kurz(z)} ${Z.jahr}`, `${zahl(min0)} → ${zahl(min1)} m³/s`, `${vz(min1 - min0, 1)} m³/s · ${vz(100 * (min1 - min0) / min0, 1)} %`) +
      (a && b ? kachel(`${T.nm7qSim} ${kurz(z)}`, `${zahl(a.wert)} → ${zahl(b.wert)} m³/s`, `${vz(b.wert - a.wert, 1)} m³/s`) : '') +
      (w0 != null && w1 != null ? kachel(T.pegelMin, `${zahl(w0)} → ${zahl(w1)} cm`, `${vz(w1 - w0, 0)} cm · ${T.ausKurve}`) : '') +
      (u0 != null && !O.glw ? kachel(T.unterGlw, `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) : '') +
      (O.regel ? kachel(T.schwellen, `GlW ${zahl(O.tief)} · ${zahl(O.hoch)}`, `m³/s: ${FR ? 'restituer sous / retenir dès' : 'abgeben unter / stauen ab'}`) : kachel(T.schwellen, `L* ${zahl(O.tief)} · H* ${zahl(O.hoch)}`, `m³/s${O.winter ? ` · ${T.bisMaerz}${DP}L* ${zahl(O.winter.tief)} · H* ${zahl(O.winter.hoch)}` : ''}`)) +
      kachel(`${T.abgabeTage} · ${T.rueckTage}`, `${tA} · ${tR} ${T.tageW}`, `${T.genutzt}${DP}${zahl(genutzt, 1)} ${T.von_} ${zahl(v, 1)} ${T.mio}`) +
      (PK && AUSL ? (() => { const kj = kaubJahr(R.Y, S); return kachel(T.aTage, `${zahl(kj.k0)} → ${zahl(kj.k1)}`, ''); })() : '') +
      (entlVol > .05 ? kachel(T.entlTitel, `${entlTage} ${T.tageW}`, `${zahl(entlVol, 1)} ${T.mio}`) : '') + 
      (O.glw && PK ? (() => { const alt = Z.modus, andere = alt === 'regel' ? 'glw' : 'regel'; Z.modus = andere; const netz = NETZ; NETZ = VOLL; const S2 = simulieren(R.Y); NETZ = netz; Z.modus = alt;
        const a1 = kaubJahr(R.Y, S), a2 = kaubJahr(R.Y, S2), vor = alt === 'regel' ? a2 : a1, ohne = alt === 'regel' ? a1 : a2;
        return kachel(T.vergleich, `${zahl(vor.t0)} → ${zahl(vor.t1)} · ${zahl(ohne.t1)} cm`, `${T.gemessen} → ${T.mitVor} · ${T.ohneVor}`); })() : '') +
      (!O.glw && min1 - min0 < .05 ? `<div><em>${T.keinGewinn}</em></div>` : '') + (O.glw && !u0 ? `<div><em>${T.nieUnter}</em></div>` : '') + (Z.modus === 'glw' && !O.glw ? `<div><em>${T.ohneKaub}</em></div>` : '') + (gesch ? `<div><em>${FR ? 'Sur' : 'An'} ${gesch} ${T.geschHinweis}</em></div>` : '');
    const vs = ST[Z.verlauf && R.Y.q[Z.verlauf] ? Z.verlauf : z.id];
    const [i0, i1] = verlauf(R, R.Y.q[vs.id], S.q[vs.id], O, vs, vs.id === z.id);
    abgabeGrafik(R, i0, i1); nutzenTafel(R); kapazitaetskurve(R); seeTafel(R); seeGrafik(R);
  }
  function verlauf(R, q, qs, O, z, linien) {
    const B = BREITE(), H = 400, L = 62, RR = 14, OO = 22, U = 40, n = q.length, svg = $('verlauf');
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
    const S = R.S, B = BREITE(), H = 210, L = 62, RR = 14, svg = $('abgabe'), teile = S.teile.filter(x => x.teil > 0);
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
    const lzs = S.lz + (s.knoten === BODENSEE ? BODENSEE_TAGE : 0), si = O.seeId.indexOf(s.id), zus = mess.map((x, j) => si >= 0 && j + lzs < n ? O.see[si][j + lzs] / (s.flaeche_km2 * 1e6) : 0), mit = mess.map((x, j) => x == null ? null : x + zus[j]);
    const B = BREITE(), H = 300, L = 62, RR = 14, OO = 26, U = 36, alle = [...mess, ...mit].filter(v => v != null).concat(s.grenzen ? [s.grenzen.hoch] : []);
    const lo = Math.min(...alle), hi = Math.max(...alle), sch = [.1, .2, .25, .5, 1].find(q => (hi - lo) / q <= 6) || 2, u = Math.floor(lo / sch) * sch, o = Math.ceil(hi / sch) * sch + 1e-9;
    const x = i => L + (B - L - RR) * i / (mess.length - 1), y = v => OO + (H - OO - U) * (1 - (v - u) / (o - u));
    const linie = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    let g = `<text class="fett" x="${L}" y="14">${h(nm(s.name))} ${Z.jahr}: ${T.seeG}</text>`;
    for (let v = u; v <= o; v += sch) g += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v, 2)}</text>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); g += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${H - U}" y2="${H - U + 5}"/><text x="${x(i) + 4}" y="${H - U + 18}">${T.monate[m]}</text>`; }
    if (s.grenzen) for (const [v, name] of [[s.grenzen.hoch, T.seeHoch], [s.grenzen.tief, T.seeTief]]) if (v != null && v >= u && v <= o) g += `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text class="fett" x="${B - RR - 4}" y="${y(v) - 5}" text-anchor="end">${name} ${zahl(v, 2)}</text>`;
    if (s.grenzen) mit.forEach((v, i) => { if (v != null && zus[i] > .005 && v > s.grenzen.hoch) g += `<rect x="${x(i).toFixed(1)}" y="${y(Math.min(v, o)).toFixed(1)}" width="${(x(1) - x(0) + .3).toFixed(1)}" height="${(y(s.grenzen.hoch) - y(Math.min(v, o))).toFixed(1)}" fill="#000"/>`; });
    g += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><path d="${linie(mit)}" fill="none" stroke="#003399" stroke-width="2"/><path d="${linie(mess)}" fill="none" stroke="#000" stroke-width="2"/>`;
    const svg = $('seegrafik'); svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = g;
    $('seelegende').innerHTML = `<span><i></i>${T.gemessen}</span><span><i class="blau"></i>${T.seeMit}</span>${s.grenzen ? `<span><i class="strich"></i>${T.seeHoch}${s.grenzen.tief != null ? ', ' + T.seeTief : ''}</span><span><i class="fenster"></i>${T.hwLeg}</span>` : ''}`;
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
    // 3 Probe an der Aare
    if (a) { const kk = a.mittel['R:2205'], g = ['2016', '2018', '2243'].map(id => abfluss(a, id)), st = abfluss(a, '2205');
      if (kk != null && g.every(x => x != null)) html += `<h3>3 ${t('Probe Aare', 'Contrôle Aar')}</h3>` + f('Δ = Q<sub>Stilli</sub> − (Q<sub>Brugg</sub> + Q<sub>Mellingen</sub> + Q<sub>Baden</sub>)') + r(`Δ = ${qz(st)} − (${g.map(qz).join(' + ')}) = <b>${qz(kk)} m³/s</b> (${zahl(100 * kk / st, 1)} %)`); }
    // 5 Rückhalt: Formeln je Rechenweise, dann je eine Zahlenzeile für «mit Voraussicht» und «Betriebsregel» (Korrektur 17.11.2026). FR provisorisch
    const zl = Z.zielwahl, d40 = zl === 'B', zw = R.zw, qK0 = R.Y2 && R.Y2.q[KAUB] ? Math.min(...R.Y2.q[KAUB].filter(x => x != null)) : null, minS = S => S && S.q[KAUB] ? Math.min(...S.q[KAUB].filter(x => x != null)) : null;
    const seen = meta.seen.filter(s => CM[s.id] > 0), V = seen.reduce((s, x) => s + CM[x.id] * x.flaeche_km2 / 100, 0);
    html += `<h3>4 ${t('Kapazität', 'Capacité de retenue')}</h3><p>${t('Fläche mal Zusatzstau. 1 km² mal 1 cm sind 0,01 Mio. m³.', 'Surface fois surélévation. 1 km² fois 1 cm font 0,01 mio m³.')}</p>` + f('V = Σ<sub>s</sub> A<sub>s</sub> · Δh<sub>s</sub>') +
      (seen.length ? r(`V = ${seen.map(s => `${zahl(s.flaeche_km2, 1)} km² · ${zahl(CM[s.id])} cm`).join(' + ')} = <b>${zahl(V, 1)} ${T.mio}</b>`) : '');
    html += `<h3>5 ${t('Rückhalt und Abgabe', 'Retenue et restitution')}</h3>` +
      `<p>${t(`Mit Voraussicht heisst: Die Rechnung kennt alle Tageswerte des Speicherjahrs im Voraus und rechnet so, wie es für das gewählte Ziel am besten wäre. Ziel A, tiefsten Stand heben: Unter L wird abgegeben, mit L höchstens Q<sub>GlW</sub>. Alle Tage unter L kommen auf L, die tiefsten gewinnen am meisten. Gestaut wird nur über H, und H liegt mindestens 10 cm über dem GlW; höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt. Ziel B, keine Tage unter 40 cm: gleich, aber mit dem Abfluss bei 40 cm (Q<sub>40</sub> = ${zahl(Q_40)} m³/s) als Deckel und gestaut ab 50 cm (${zahl(Q_50)} m³/s).`,
        `Avec prévision signifie que le calcul connaît d’avance toutes les valeurs journalières de l’année de stockage et calcule comme ce serait le mieux pour l’objectif choisi. Objectif A, relever le niveau le plus bas : sous L on restitue, avec L au plus égal à Q<sub>GlW</sub>. Tous les jours sous L montent à L, les plus bas gagnent le plus. On ne retient qu’au-dessus de H, situé au moins 10 cm au-dessus du GlW ; au plus 10 % du débit et seulement tant qu’un jour sous L suit encore. Objectif B, aucun jour sous 40 cm : de même, avec le débit à 40 cm (Q<sub>40</sub> = ${zahl(Q_40)} m³/s) comme plafond et une retenue dès 50 cm (${zahl(Q_50)} m³/s).`)}</p>` +
      f(`${t('Abgabe', 'Restitution')} a(t) = L − Q(t), ${t('wenn', 'si')} Q(t) &lt; L, &nbsp; L ≤ Q<sub>GlW</sub><br>${t('Rückhalt', 'Retenue')} r(t) = min(Q(t) − H, 0,10 · Q(t)), ${t('wenn', 'si')} Q(t) &gt; H, &nbsp; H ≥ Q<sub>GlW</sub><br>S(t + 1) = S(t) + 86 400 · (r(t) − a(t)), &nbsp; 0 ≤ S(t) ≤ V, &nbsp; S(1.4.) = ${t('Rest des Vorjahrs', 'reste de l’année précédente')}<br>${t('Fehlmenge', 'Manque')} = 86 400 · Σ max(0, Q<sub>GlW</sub> − Q(t))`) +
      `<p>${t('L* ist das grösste L bis zum Deckel, bei dem der Speicher nie leer läuft. H* ist das grösste H, mit dem L* noch hält. Beide werden durch Halbieren des Intervalls gesucht.', 'L* est le plus grand L jusqu’au plafond pour lequel le réservoir ne se vide jamais. H* est le plus grand H qui tient encore L*. Tous deux sont cherchés par dichotomie.')}</p>` +
      `<p>${t('Ziel C und D, wenige Tage unter dem GlW (Näherung, Greedy): Die Tage unter dem GlW werden nach ihrer Lücke zum GlW aufsteigend geprüft, die kleinste zuerst. Ein Tag kommt zu den gehobenen Tagen, wenn ein Lauf möglich ist, der genau diese Tage auf den GlW hebt; sonst bleibt er draussen. Abgegeben wird nur an den gehobenen Tagen, gestaut wird über Q<sub>Stau</sub> (10 cm über dem GlW) und vor dem letzten gehobenen Tag, mit allen Grenzen der Seen. Das Ergebnis ist die grösste so gefundene Menge. Es ist eine Näherung; eine andere Auswahl der Tage könnte mehr Tage heben.', 'Objectifs C et D, peu de jours sous le GlW (approximation, méthode gloutonne) : les jours sous le GlW sont examinés par écart croissant au GlW, le plus petit d’abord. Un jour rejoint les jours relevés si un calcul est possible qui relève exactement ces jours au GlW ; sinon il reste dehors. On ne restitue que les jours relevés, on retient au-dessus de Q<sub>ret</sub> (10 cm au-dessus du GlW) et avant le dernier jour relevé, avec toutes les limites des lacs. Le résultat est le plus grand ensemble ainsi trouvé. C’est une approximation ; un autre choix de jours pourrait en relever davantage.')}</p>` +
      `<p>${t(`Betriebsregel ohne Voraussicht: Jede Entscheidung kennt nur den Abfluss des Tages und den Inhalt der Seen. Unter dem GlW (Ziel B: unter 40 cm) wird abgegeben, höchstens mit der Menge, bei der ein voller Speicher D Tage reicht. Gestaut wird von ${MONATE[REGEL.von - 1]} bis ${MONATE[REGEL.bis - 1]} ab einem festen Abfluss Q<sub>Stau</sub>. Ab 1. November wird der Rest gleichmässig abgegeben. Die Regel läuft durchgehend über Vorjahr, Jahr und Folgejahr.`, `Règle d’exploitation sans prévision : chaque décision ne connaît que le débit du jour et le contenu des lacs. Sous le GlW (objectif B : sous 40 cm), on restitue, au plus le débit pour lequel un réservoir plein dure D jours. On retient d’${MONATE[REGEL.von - 1]} à ${MONATE[REGEL.bis - 1]} dès un débit fixe Q<sub>ret</sub>. Dès le 1er novembre, le reste est restitué régulièrement. La règle court en continu sur l’année précédente, l’année et la suivante.`)}</p>` +
      f(`a(t) = min(Q<sub>${d40 ? '40' : 'GlW'}</sub> − Q(t), V / (D · 86 400), S(t) / 86 400), ${t('wenn', 'si')} Q(t) &lt; Q<sub>${d40 ? '40' : 'GlW'}</sub><br>r(t) = min(Q(t) − Q<sub>${t('Stau', 'ret')}</sub>, 0,10 · Q(t), ${t('Grenzen der Seen', 'limites des lacs')}), ${t('wenn', 'si')} Q(t) &gt; Q<sub>${t('Stau', 'ret')}</sub> &nbsp;&nbsp; (D = ${REGEL.tage}, Q<sub>${t('Stau', 'ret')}</sub> = ${zahl(REGEL.stauAb)} m³/s)`);
    if (zw && zw.v && zw.v.O && zw.r && zw.r.O) { const Ov = zw.v.O, Or = zw.r.O, sj = R.simJahr || Z.jahr;
      html += r(`<b>${t('Mit Voraussicht', 'Avec prévision')}</b>, ${sj}, ${t('Ziel', 'objectif')} ${zl}: ` + (zl === 'C' || zl === 'D' ? `${t('gehoben', 'jours relevés')} ${zahl(Ov.gehoben)} ${T.tageW}, H = ${zahl(Ov.hoch, 1)} m³/s` : `L* = <b>${zahl(Ov.tief, 1)} m³/s</b>, H* = <b>${zahl(Ov.hoch, 1)} m³/s</b>`) + `, ${t('kleinster Tagesabfluss', 'plus faible débit journalier')} ${zahl(qK0, 1)} → <b>${zahl(minS(zw.v), 1)} m³/s</b>.<br>` +
        `<b>${t('Betriebsregel', 'Règle d’exploitation')}</b>, ${sj}: ${t('abgeben unter', 'restituer sous')} ${zahl(Or.tief, 1)} m³/s (${d40 ? '40 cm' : 'GlW'}), ${t('stauen ab', 'retenir dès')} ${zahl(Or.hoch, 1)} m³/s, ${t('kleinster Tagesabfluss', 'plus faible débit journalier')} ${zahl(qK0, 1)} → <b>${zahl(minS(zw.r), 1)} m³/s</b>.<br>` +
        `${t('Fehlmenge für alle Tage', 'Manque pour tous les jours')}: <b>${zahl(Ov.bedarf / 1e6)} ${T.mio}</b>, ${t('Kapazität', 'capacité')}: ${zahl(V, 1)} ${T.mio}.`); }
    html += `<p>${t('Jeder See führt seinen eigenen Inhalt. Gefüllt wird im Verhältnis des freien Platzes, geleert im Verhältnis des Inhalts. Die Aktion am See liegt um die Fliesszeit τ vor der Wirkung am Ziel.', 'Chaque lac a son propre contenu. Le remplissage se fait au prorata de la place libre, la vidange au prorata du contenu. L’action au lac précède l’effet à la station du bilan du temps de parcours τ.')}</p>` +
      f(`r<sub>s</sub>(t) = r(t + τ) · F<sub>s</sub>(t) / Σ<sub>k</sub> F<sub>k</sub>(t), &nbsp; F<sub>s</sub> = ${t('freier Platz im See s', 'place libre dans le lac s')} &nbsp;&nbsp; a<sub>s</sub>(t) = a(t + τ) · S<sub>s</sub>(t) / Σ<sub>k</sub> S<sub>k</sub>(t)`) +
      `<p>${t('Grenze je Messstelle unterhalb eines Sees: Der Rückhalt aller Seen oberhalb zusammen beträgt höchstens 20 % des Abflusses dort, und der Abfluss fällt nie unter seinen gemessenen Jahrestiefstwert. Was ein See wegen der Grenze an seiner Messstelle nicht aufnehmen kann, nehmen die übrigen Seen auf.', 'Limite par station en aval d’un lac : la retenue de tous les lacs en amont fait au plus 20 % du débit à cet endroit, et ce débit ne passe jamais sous son minimum mesuré de l’année. Ce qu’un lac ne peut pas absorber à cause de la limite de sa station, les autres lacs l’absorbent.')}</p>` +
      f(`Σ<sub>s ${t('oberhalb von', 'en amont de')} m</sub> r<sub>s</sub>(t) ≤ min(0,20 · Q<sub>m</sub>(t), Q<sub>m</sub>(t) − min Q<sub>m</sub>)<br>${t('Wird eine Grenze erreicht, werden die Seen oberhalb von m gekürzt; der Rest geht in bis zu fünf Durchgängen an die Seen mit freiem Platz, deren Messstellen noch offen sind.', 'Si une limite est atteinte, les lacs en amont de m sont réduits ; le reste va, en cinq passes au plus, aux lacs ayant de la place dont les stations ne sont pas saturées.')}`);
    html += `<p>${t('Woher das Wasser zum Füllen kommt: Die Rechnung nimmt es aus dem Abfluss, der an dem Tag tatsächlich unterhalb des Sees gemessen wurde. Wird gestaut, fliesst dort entsprechend weniger; wird abgegeben, entsprechend mehr. Zuflüsse in die Seen gehen nicht eigens ein, sie stecken im gemessenen Abfluss unterhalb. Die Wirkung erreicht Basel am selben Tag und Kaub zwei Tage später (Annahme), ohne Abflachung der Welle. Das gilt auch für den Bodensee: Nach den Messreihen erscheint eine Änderung in Neuhausen am selben Tag in Basel.', 'D’où vient l’eau du remplissage : le calcul la prélève sur le débit réellement mesuré ce jour-là en aval du lac. Quand on retient, il y coule d’autant moins ; quand on restitue, d’autant plus. Les apports aux lacs n’entrent pas séparément, ils sont contenus dans le débit mesuré en aval. L’effet atteint Bâle le jour même et Kaub deux jours plus tard (hypothèse), sans atténuation de l’onde. Cela vaut aussi pour le lac de Constance : d’après les séries mesurées, une variation à Neuhausen apparaît le même jour à Bâle.')}</p>` +
      f(`Q<sub>s</sub><sup>sim</sup>(t) = Q<sub>s</sub>(t) − r<sub>s</sub>(t) + a<sub>s</sub>(t) &nbsp;&nbsp; Q<sub>Kaub</sub><sup>sim</sup>(t + 2) = Q<sub>Kaub</sub>(t + 2) + Σ<sub>s</sub> (a<sub>s</sub>(t) − r<sub>s</sub>(t))`);
    html += `<p>${t('Hochwassergrenze: Der Seestand W<sub>s</sub> plus der Zusatzstau darf die Hochwassergrenze G<sub>s</sub> des Sees nicht überschreiten. Gefüllt wird bis 20 cm darunter. Steigt ein See über seine Grenze, gibt er den Überschuss ab, höchstens 20 % des Abflusses an der Messstelle unterhalb. Reicht das nicht, zählt der Tag als Tag über der Grenze. Diese Abgabe heisst auf der Seite Notabgabe (im Code «Entlastung»). Für den Bodensee ist keine Grenze hinterlegt. In den Stufen 2 und 3 liegt die Grenze um den gewählten Zusatz höher.', 'Limite de hautes eaux : le niveau W<sub>s</sub> plus la surélévation ne doit pas dépasser la limite G<sub>s</sub> du lac. Le remplissage s’arrête 20 cm en dessous. Si un lac dépasse sa limite, il restitue l’excédent, au plus 20 % du débit à la station en aval. Si cela ne suffit pas, le jour compte comme jour au-dessus de la limite. Cette restitution s’appelle sur la page restitution d’urgence (dans le code « Entlastung »). Aucune limite n’est enregistrée pour le lac de Constance. Aux paliers 2 et 3, la limite est relevée du supplément choisi.')}</p>` +
      f(`W<sub>s</sub>(t) + S<sub>s</sub>(t) / A<sub>s</sub> ≤ G<sub>s</sub> &nbsp;&nbsp; ${t('Notabgabe', 'restitution d’urgence')} e<sub>s</sub>(t) = min(S<sub>s</sub>(t) − (G<sub>s</sub> − W<sub>s</sub>(t)) · A<sub>s</sub>, 0,20 · Q<sub>m</sub>(t) · 86 400)`);
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
    if (aw) html += `<h3>7 ${t('Abfluss in Kaub an Tagen ohne Abflusswert', 'Débit à Kaub les jours sans valeur de débit')}</h3><p>${t('Das Jahrbuch der BfG endet am 31.12.2025, PEGELONLINE reicht 31 Tage zurück. Dazwischen liegt für Kaub nur der gemessene Wasserstand vor (Tagesmittel der WSV über das Pegelportal des HLNUG). Der Abfluss dieser Tage ist aus dem Wasserstand über die Abflusskurve gerechnet. So entsteht auch der amtliche Abfluss. Liegt der Wasserstand unter dem tiefsten Stützpunkt der Kurve, wird sie mit der Steigung der zwei tiefsten Stützpunkte um höchstens 12 cm verlängert; diese Tage sind eigens bezeichnet. Für Tage, an denen das Pegelportal keinen Wasserstand für Kaub liefert (Pegel um und unter 0 cm), ist der Wasserstand aus dem Pegel Bingen abgeleitet und die Kurve um höchstens 20 cm verlängert.', 'L’annuaire de la BfG s’arrête au 31.12.2025, PEGELONLINE remonte à 31 jours. Entre les deux, Kaub ne dispose que du niveau mesuré (moyennes journalières de la WSV via le portail du HLNUG). Le débit de ces jours est calculé à partir du niveau par la courbe de tarage. C’est ainsi qu’est établi le débit officiel. Si le niveau est sous le point le plus bas de la courbe, celle-ci est prolongée avec la pente des deux points les plus bas, de 12 cm au plus ; ces jours sont signalés.')}</p>` +
      f(`Q = Q<sub>1</sub> + (Q<sub>2</sub> − Q<sub>1</sub>) · (W − W<sub>1</sub>) / (W<sub>2</sub> − W<sub>1</sub>)`) +
      // Zählung aus den Statuscodes, dieselbe wie in Kapitel 2. FR provisorisch
      (GELADEN[LETZTES] ? (() => { const z = zaehlung(GELADEN[LETZTES]); return r(`${LETZTES}: <b>${zahl(z.alle)}</b> ${T.tageW} ${t('aus dem Wasserstand gerechnet, davon', 'calculés à partir du niveau, dont')} <b>${zahl(z.n7)}</b> ${t('mit der Abflusskurve', 'avec la courbe de tarage')}, <b>${zahl(z.n8)}</b> ${t('mit verlängerter Kurve', 'avec courbe prolongée')}, <b>${zahl(z.n9)}</b> ${t('aus dem Pegel Bingen abgeleitet', 'déduits de l’échelle de Bingen')}. ${t('Tiefster Stützpunkt', 'Point le plus bas')}: ${zahl(aw.tiefster_stuetzpunkt[1], 0)} cm = ${zahl(aw.tiefster_stuetzpunkt[0])} m³/s.`); })() : '') +
      `<p>${t('Der Wasserstand und damit die Fahrrinnentiefe sind an diesen Tagen gemessen, ausser an den aus Bingen abgeleiteten Tagen. Gerechnet ist sonst nur der Abfluss.', 'Le niveau, et donc la profondeur du chenal, sont mesurés ces jours-là. Seul le débit est calculé.')}</p>`;
    // 8 Fahrbarkeit je Abschnitt
    if (RP.length) html += `<h3>8 ${t('Fahrbarkeit je Abschnitt', 'Navigabilité par tronçon')}</h3><p>${t('Von Basel bis Iffezheim ist der Rhein staugeregelt; dort setzt die Seite keine Abhängigkeit vom Abfluss an. Unterhalb gilt je Abschnitt der Richtpegel mit seinem GlW und seiner Fahrrinnentiefe unter GlW (PEGELONLINE). Der simulierte Wasserstand ist der gemessene plus die Differenz auf der Bezugskurve des Pegels; Q ist der Abfluss am Bezugspegel, ΔQ die Wirkung der Simulation dort.', 'De Bâle à Iffezheim, le Rhin est régulé par barrages ; la page n’y suppose aucune dépendance au débit. En aval, chaque tronçon suit son échelle de référence, avec son GlW et sa profondeur sous le GlW (PEGELONLINE). Le niveau simulé est le niveau mesuré plus l’écart sur la courbe de l’échelle ; Q est le débit à la station de référence, ΔQ l’effet de la simulation à cet endroit.')}</p>` +
      f(`T = W − GlW + T<sub>GlW</sub> &nbsp;&nbsp; W<sub>sim</sub> = W + f(Q + ΔQ) − f(Q)`) +
      r(RP.map(p => `${h(p.name)}: GlW ${zahl(p.glw)} cm, T<sub>GlW</sub> ${zahl(p.tugl)} cm, ${t('Bezug', 'référence')} ${h(kurz(ST[p.bezug]))}, ${p.kurve.length} ${t('Stützpunkte', 'points')}`).join('<br>')) +
      `<p>${t(`Bezugskurven aus Tageswertpaaren des jüngsten Jahrbuchjahres und den Rohwerten danach. Mannheim und Oestrich haben keine eigene Abflussreihe; ihre Kurve bezieht sich auf Maxau bzw. Mainz und streut stärker. Bezugspegel und Abschnitte: ${h(meta.abschnitte_quelle || '')}. Für km 508–540 ist Oestrich der Bezugspegel; er fehlt im Jahrbuch, darum dient an Tagen ohne Wert der Pegel Bingen im selben Abschnitt, auf den GlW von Oestrich umgerechnet${RP.some(p => p.ersatz && p.ersatz.abweichung != null) ? ` (mittlere Abweichung an ${RP.find(p => p.ersatz).ersatz.tage_vergleich} gemeinsamen Tagen: ${zahl(RP.find(p => p.ersatz).ersatz.abweichung_betrag, 1)} cm)` : ''}. Im Abschnitt Kaub gilt die Fahrrinnentiefe von 190 cm bis St. Goar (km 557), danach 210 cm. Geprüft: Für Maxau und Kaub ergibt die Formel am 10. bis 14.11.2026 dieselben Werte wie die Grafik der WSV auf ELWIS. Die Stufen 30 und 60 cm unter GlW sind eine Darstellungswahl. Lage der Staustufen nach Wikidata.`, `Courbes tirées des couples journaliers de la dernière année de l’annuaire et des données brutes ensuite. Mannheim et Oestrich n’ont pas de série de débit propre ; leur courbe se rapporte à Maxau et à Mayence et disperse davantage. Échelles de référence et tronçons : ${h(meta.abschnitte_quelle || '')}. Pour les km 508–540, l’échelle de référence est Oestrich ; elle manque dans l’annuaire, donc les jours sans valeur on utilise l’échelle de Bingen dans le même tronçon, ramenée au GlW d’Oestrich. Dans le tronçon de Kaub, la profondeur de 190 cm vaut jusqu’à St. Goar (km 557), puis 210 cm. Vérifié : pour Maxau et Kaub, la formule donne du 10 au 14.11.2026 les mêmes valeurs que le graphique de la WSV sur ELWIS. Les paliers de 30 et 60 cm sous le GlW sont un choix de représentation. Position des barrages selon Wikidata.`)}</p>`;
    // 9 Ladung nach Pegel: ZKR-Werte, dazwischen Schätzung, unter 44 cm keine Schätzung, beobachtete Werte 2026. FR provisorisch
    if (AUSL) html += `<h3>9 ${t('Nutzbare Ladekapazität eines Schiffs', 'Capacité de chargement utilisable d’un bateau')}</h3><p>${t('Die ZKR gibt Angaben von Rhenus Logistics für ein Schiff einer Trockengüter- und Tankerflotte mit durchschnittlicher Kapazität wieder: unter 134 cm am Pegel Kaub 50 %, unter 72 cm 25 %, unter 44 cm 15 % der Kapazität. Die 100 % bei 250 cm stammen von Contargo und gelten für ein Containerschiff mit 208 TEU. Die Werte betreffen also zwei Schiffstypen. Zwischen den Stützpunkten rechnet die Grafik «Was ein Schiff laden kann» linear; das ist eine Schätzung. Unter 44 cm schätzt die Seite nichts. Unter 40 cm findet laut ZKR praktisch keine Binnenschifffahrt mehr statt; 2026 fuhren Schiffe trotzdem, mit wenig Ladung. Diese Beobachtungen stehen als eigene Marken in der Grafik: am 1.10.2026 bei −6 cm 14 statt 3 Schiffe für dieselbe Ladung, also rund 21 % je Schiff (Transport Online, 2026b); Mitte August 10 bis 20 % (Transport Online, 2026a), eingetragen über den Pegel vom 10. bis 20.8.2026.', 'La CCNR reprend des données de Rhenus Logistics pour un bateau d’une flotte de vraquiers et de citernes de capacité moyenne : sous 134 cm à l’échelle de Kaub 50 %, sous 72 cm 25 %, sous 44 cm 15 % de la capacité. Les 100 % à 250 cm viennent de Contargo et valent pour un porte-conteneurs de 208 EVP. Les valeurs concernent donc deux types de bateaux. Entre ces points, le graphique « Ce qu’un bateau peut charger » interpole linéairement ; c’est une estimation. Sous 44 cm, la page n’estime rien. Sous 40 cm, selon la CCNR, la navigation n’a pratiquement plus lieu ; en 2026, des bateaux ont pourtant navigué, avec peu de chargement. Ces observations figurent comme marques propres dans le graphique : le 1.10.2026 à −6 cm, 14 bateaux au lieu de 3 pour le même chargement, soit environ 21 % par bateau (Transport Online, 2026b) ; mi-août 10 à 20 % (Transport Online, 2026a), reportés sur le niveau du 10 au 20.8.2026.')}</p>` +
      r(AUSL.punkte.map(p => `${zahl(p[0])} cm: ${zahl(p[1])} %`).join(' &nbsp;·&nbsp; ') + ` &nbsp;·&nbsp; &lt; ${zahl(AUSL.punkte[0][0])} cm: ${t('keine Schätzung', 'pas d’estimation')}`) + `<p>${h(AUSL.quelle)}</p>`;
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
  const FEHLEND = FR ? [
    ['Kaub et Worms 2026 : moyennes journalières contrôlées du niveau et du débit, y compris les jours sous 0 cm', 'Remplace les jours de Kaub déduits de l’échelle de Bingen et comble les jours manquants à Worms.', 'WSV, BfG'],
    ['Règlements de régulation des lacs avec les lignes de régulation (niveau de consigne par jour de l’année) : lacs du pied du Jura, lacs de Thoune et de Brienz, lac des Quatre-Cantons, lac de Zurich', 'Remplace l’hypothèse du palier 1a et montre ce qui est admis aujourd’hui.', 'Cantons de Berne, de Lucerne et de Zurich, OFEV'],
    ['Limite officielle de hautes eaux des lacs de Neuchâtel et de Morat', 'Remplace le début du degré de danger 4 aux paliers 1c, 2 et 3.', 'Cantons de Berne, de Neuchâtel, de Vaud et de Fribourg'],
    ['Capacité d’évacuation des barrages et débits minimaux (Port, Thoune, Interlaken, Lucerne, Zurich)', 'Remplace la limite forfaitaire de 20 % pour la retenue et la restitution d’urgence.', 'Cantons, exploitants des barrages'],
    ['Maxau, Spire, Mannheim et Oestrich : moyennes journalières 2026 ; Neckar à Rockenau dès 2021', 'Ferme le bilan entre Bâle et Kaub et précise l’origine de l’eau en aval de Bâle.', 'WSV, BfG, LUBW'],
    ['Tables de tarage officielles de Spire et de Mannheim', 'Les courbes de la page s’écartent de 17 et 39 cm en basses eaux ; le relèvement simulé n’y est pas fiable.', 'WSV'],
    ['Chargement par centimètre d’enfoncement pour des bateaux types (tonnes ou EVP)', 'Remplace l’estimation entre les valeurs de la CCNR et les observations isolées de 2026.', 'CCNR, armateurs, Ports rhénans suisses'],
    ['Facteurs de chargement attestés sous 40 cm à l’échelle de Kaub', 'Permet une indication sous 44 cm, où la page n’estime rien aujourd’hui.', 'CCNR, armateurs, Ports rhénans suisses'],   // FR provisorisch
    ['Règlement de régulation du lac de Constance de 1973, texte complet', 'Permet la comparaison directe avec le palier 3.', 'CHR, OFEV'],
    ['Niveaux des lacs : état de validation des valeurs journalières', 'Les niveaux des lacs n’ont pas d’état ; ceux de 2026 sont bruts.', 'OFEV'],
    ['Résultat officiel de la votation thurgovienne du 26 août 1973', 'Seule la date est attestée.', 'Archives d’État de Thurgovie'],
  ] : [
    ['Kaub und Worms 2026: geprüfte Tagesmittel von Wasserstand und Abfluss, auch für die Tage unter 0 cm', 'Ersetzt die aus dem Pegel Bingen abgeleiteten Tage in Kaub und schliesst die fehlenden Tage in Worms.', 'WSV, BfG'],
    ['Regulierreglemente der Seen mit den Regulierlinien (Soll-Seestand je Kalendertag): Jurarandseen, Thuner- und Brienzersee, Vierwaldstättersee, Zürichsee', 'Ersetzt die Annahme der Stufe 1a und zeigt, was heute zulässig ist.', 'Kantone Bern, Luzern und Zürich, BAFU'],
    ['Amtliche Hochwassergrenze für Neuenburger- und Murtensee', 'Ersetzt den Beginn der Gefahrenstufe 4 in den Stufen 1c, 2 und 3.', 'Kantone Bern, Neuenburg, Waadt und Freiburg'],
    ['Abflusskapazität der Wehre und Mindestabflüsse (Port, Thun, Interlaken, Luzern, Zürich)', 'Ersetzt die pauschale Grenze von 20 % für Rückhalt und Notabgabe.', 'Kantone, Betreiber der Wehre'],
    ['Maxau, Speyer, Mannheim und Oestrich: Tagesmittel 2026; Neckar in Rockenau ab 2021', 'Schliesst die Bilanz zwischen Basel und Kaub und klärt die Herkunft des Wassers unterhalb von Basel.', 'WSV, BfG, LUBW'],
    ['Amtliche Abflusstafeln für Speyer und Mannheim', 'Die Kurven der Seite liegen bei Niedrigwasser 17 und 39 cm daneben; die simulierte Hebung ist dort nicht belastbar.', 'WSV'],
    ['Ladung je Zentimeter Abladetiefe für typische Schiffe (Tonnen oder TEU)', 'Ersetzt die Schätzung zwischen den ZKR-Werten und die Einzelbeobachtungen 2026.', 'ZKR, Reedereien, Schweizerische Rheinhäfen'],
    ['Belegte Ladefaktoren unter 40 cm am Pegel Kaub', 'Erlaubt eine Aussage unter 44 cm, wo die Seite heute nichts schätzt.', 'ZKR, Reedereien, Schweizerische Rheinhäfen'],
    ['Regulierreglement für den Bodensee von 1973 im Wortlaut', 'Erlaubt den direkten Vergleich mit Stufe 3.', 'KHR, BAFU'],
    ['Seestände: Freigabestatus der Tageswerte', 'Die Seestände tragen keinen Status; die Werte von 2026 sind roh.', 'BAFU'],
    ['Amtliches Ergebnis der Thurgauer Abstimmung vom 26. August 1973', 'Belegt ist nur das Datum.', 'Staatsarchiv Thurgau'],
  ];
  $('fehlend').innerHTML = `<table><thead><tr><th></th><th>${T.fWas}</th><th>${T.fWozu}</th><th>${T.fWer}</th></tr></thead><tbody>${FEHLEND.map((z, i) => `<tr><td>${i + 1}</td>${z.map(x => `<td>${h(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  // Begriffe, alphabetisch. Dieselben Erklärungen stehen beim ersten Auftreten im Text. FR provisorisch
  const BEGRIFFE = FR ? [
    ['Débit', 'quantité d’eau qui passe par seconde en un point, en mètres cubes par seconde (m³/s) ; 1 m³ fait 1 000 litres.'],
    ['Courbe de tarage', 'relation entre niveau et débit à une échelle ; elle permet de convertir l’un en l’autre.'],
    ['Restitution', 'laisser s’écouler en plus de l’eau stockée ; le niveau du lac baisse.'],
    ['Enfoncement', 'profondeur à laquelle un bateau chargé s’enfonce dans l’eau.'],
    ['Règle d’exploitation', 'calcul qui, comme une exploitation réelle, ne connaît que le jour même et le contenu des lacs.'],
    ['Chenal', 'bande draguée et balisée du fleuve où naviguent les bateaux.'],
    ['Profondeur du chenal', 'profondeur du chenal un jour donné ; elle détermine l’enfoncement admis d’un bateau et donc son chargement.'],
    ['Manque', 'eau qui a manqué jusqu’au GlW tous les jours sous le GlW, en mio m³.'],
    ['Degré de danger 4', 'quatrième des cinq degrés de danger de crue de la Confédération.'],
    ['Tranche utilisée', 'plage dans laquelle un lac s’est trouvé de 1991 à 2020 pendant 98 % des jours (1er au 99e centile).'],
    ['GlW, étiage équivalent', 'niveau de référence de la navigation en basses eaux ; en moyenne pluriannuelle, il n’est pas atteint pendant environ 20 jours sans glace par an ; au GlW, la WSV garantit une profondeur de chenal donnée comme valeur de consigne.'],
    ['Limite de hautes eaux', 'niveau du lac à partir duquel les rives sont inondées et des dommages sont à prévoir.'],
    ['Capacité', 'place disponible pour la retenue dans les lacs, en mio m³. Contenu : ce qui est stocké à un moment donné.'],
    ['mio m³', 'un million de mètres cubes, un cube de 100 m d’arête.'],
    ['Avec prévision', 'calcul qui connaît toute l’année à l’avance et calcule comme ce serait le mieux pour l’objectif choisi.'],
    ['Étiage moyen', 'débit des sept jours les plus secs d’une année, en moyenne sur de nombreuses années (abréviation MNQ ou NM7Q).'],
    ['Échelle, niveau', 'hauteur du plan d’eau à une règle graduée fixe ; le zéro est fixé et ne dit rien de la profondeur.'],
    ['Règlement de régulation', 'règle officielle fixant quel niveau vaut à quelle saison et combien d’eau est restituée.'],
    ['Lac régulé', 'lac avec un barrage à l’exutoire qui règle selon un règlement combien d’eau s’écoule.'],
    ['Kilomètre du Rhin', 'kilométrage officiel du Rhin ; le km 170 se trouve à Bâle, le km 546 à Kaub.'],
    ['Échelle de référence', 'échelle qui détermine la profondeur du chenal d’un tronçon.'],
    ['Retenue (rétention)', 'retenir de l’eau dans le lac en laissant passer moins au barrage ; le niveau du lac monte.'],
    ['Année de stockage', 'année de calcul du 1er avril au 31 mars.'],
    ['Barrage de navigation', 'ouvrage avec centrale et écluse qui maintient le niveau en amont.'],
    ['Moyenne journalière', 'moyenne d’une journée ; la page ne calcule qu’avec des valeurs journalières.'],
    ['Bassin intermédiaire', 'eau qui s’ajoute entre deux stations et n’est pas mesurée à part ; la page la calcule comme différence.'],
    ['Abréviations', 'OFEV (BAFU) Office fédéral de l’environnement ; BfG Bundesanstalt für Gewässerkunde (D) ; OFAE (BWL) Office fédéral pour l’approvisionnement économique du pays ; GDWS Generaldirektion Wasserstraßen und Schifffahrt (D) ; HLNUG Office hessois de l’environnement et de la géologie ; IGKB Commission internationale pour la protection des eaux du lac de Constance ; CHR (KHR) Commission internationale de l’hydrologie du bassin du Rhin ; WSV Administration fédérale allemande des voies navigables ; CCNR (ZKR) Commission centrale pour la navigation du Rhin.'],
  ] : [
    ['Abfluss', 'Wassermenge, die pro Sekunde an einer Stelle vorbeifliesst, in Kubikmetern pro Sekunde (m³/s); 1 m³ sind 1\'000 Liter.'],
    ['Abflusskurve', 'Beziehung zwischen Wasserstand und Abfluss an einem Pegel; mit ihr rechnet man das eine ins andere um.'],
    ['Abgabe', 'gespeichertes Wasser zusätzlich abfliessen lassen; der Seespiegel sinkt.'],
    ['Abladetiefe', 'wie tief ein beladenes Schiff ins Wasser eintaucht.'],
    ['Betriebsregel', 'Rechnung, die wie ein echter Betrieb nur den heutigen Tag und den Inhalt der Seen kennt.'],
    ['Fahrrinne', 'der ausgebaggerte und markierte Streifen im Fluss, in dem die Schiffe fahren.'],
    ['Fahrrinnentiefe', 'wie tief die Fahrrinne am Tag ist; daraus folgt, wie tief ein Schiff eintauchen und wie viel es laden darf.'],
    ['Fehlmenge', 'Wasser, das an allen Tagen unter dem GlW bis zum GlW gefehlt hat, in Mio. m³.'],
    ['Gefahrenstufe 4', 'vierte von fünf Hochwasser-Gefahrenstufen des Bundes.'],
    ['Genutztes Band', 'Bereich, in dem ein See 1991–2020 an 98 % der Tage lag (1. bis 99. Perzentil).'],
    ['GlW, gleichwertiger Wasserstand', 'Bezugswasserstand der Schifffahrt für Niedrigwasser; im langjährigen Mittel an rund 20 eisfreien Tagen im Jahr unterschritten; beim GlW hält die WSV eine bestimmte Fahrrinnentiefe als Sollwert vor.'],
    ['Hochwassergrenze', 'Seestand, ab dem Ufer überflutet und Schäden zu erwarten sind.'],
    ['Kapazität', 'wie viel Platz für Rückhalt es in den Seen gibt, in Mio. m³. Inhalt: wie viel gerade gespeichert ist.'],
    ['Mio. m³', 'eine Million Kubikmeter, ein Würfel von 100 m Kantenlänge.'],
    ['Mit Voraussicht', 'Rechnung, die das ganze Jahr im Voraus kennt und so rechnet, wie es für das gewählte Ziel am besten wäre.'],
    ['Mittleres Niedrigwasser', 'Abfluss der trockensten sieben Tage eines Jahres, gemittelt über viele Jahre (Fachkürzel MNQ bzw. NM7Q).'],
    ['Pegel, Wasserstand', 'Höhe des Wasserspiegels an einer festen Messlatte; der Nullpunkt ist festgelegt und sagt nichts über die Wassertiefe.'],
    ['Regulierreglement', 'amtliche Regel, welcher Seestand zu welcher Jahreszeit gilt und wie viel abgegeben wird.'],
    ['Regulierter See', 'See mit Wehr am Ausfluss, das nach einem Reglement steuert, wie viel Wasser abfliesst.'],
    ['Rheinkilometer', 'amtliche Kilometrierung des Rheins; km 170 liegt in Basel, km 546 bei Kaub.'],
    ['Richtpegel', 'Pegel, der für einen Flussabschnitt die Fahrrinnentiefe bestimmt.'],
    ['Rückhalt (Retention)', 'Wasser im See zurückhalten, indem das Wehr weniger durchlässt; der Seespiegel steigt.'],
    ['Speicherjahr', 'Rechenjahr vom 1. April bis 31. März.'],
    ['Staustufe', 'Wehr mit Kraftwerk und Schleuse, das den Wasserstand oberhalb hält.'],
    ['Tagesmittel', 'Mittelwert eines Tages; die Seite rechnet nur mit Tageswerten.'],
    ['Zwischengebiet', 'Wasser, das zwischen zwei Messstellen dazukommt und nicht eigens gemessen wird; die Seite rechnet es als Differenz.'],
    ['Abkürzungen', 'BAFU Bundesamt für Umwelt; BfG Bundesanstalt für Gewässerkunde (D); BWL Bundesamt für wirtschaftliche Landesversorgung; GDWS Generaldirektion Wasserstrassen und Schifffahrt (D); HLNUG Hessisches Landesamt für Naturschutz, Umwelt und Geologie; IGKB Internationale Gewässerschutzkommission für den Bodensee; KHR Internationale Kommission für die Hydrologie des Rheingebietes; WSV Wasserstrassen- und Schifffahrtsverwaltung des Bundes (D); ZKR Zentralkommission für die Rheinschifffahrt.'],
  ];
  $('begriffliste').innerHTML = BEGRIFFE.map(([b, e]) => `<dt>${h(b)}</dt><dd>${h(e)}</dd>`).join('');
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(FR ? (QUELLEN_FR[q.kurz] || q.text) : q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Lacs : OFEV, fiches « Seeregulierung » (2020)' : 'Seen: BAFU, Faktenblätter «Seeregulierung» (2020)'} – <a href="https://www.bafu.admin.ch/de/wichtige-seeregulierungen">bafu.admin.ch/de/wichtige-seeregulierungen</a>; IGKB</li>` +
    `<li>${FR ? 'Taux de chargement : CCNR, document de réflexion « Act now! » sur les basses eaux, éd. 3.0 (2023)' : 'Nutzbare Ladekapazität: ZKR, Reflexionspapier «Act now!» zum Niedrigwasser, Ed. 3.0 (2023)'} – <a href="https://www.ccr-zkr.org/files/documents/infovoienavigable/Act_now_3_0_${FR ? 'fr' : 'de'}.pdf">ccr-zkr.org</a></li>` +
    `<li>${FR ? 'Lac de Constance : IGKB, « Die Regulierung des Bodensees », rapport des experts, 70e session (2024) ; CHR, rapport I-26 (2018)' : 'Bodensee: IGKB, «Die Regulierung des Bodensees», Bericht der Sachverständigen, 70. Kommissionstagung (2024); KHR, Bericht I-26 (2018)'} – <a href="https://www.igkb.org/fileadmin/user_upload/Downloads/Publikationen/Protokoll_Kommissionstagungen/KT_2024/Anlage_TOP_10_KT_2024_Regulierung_des_Bodensees.pdf">igkb.org</a> · <a href="https://www.chr-khr.org/sites/default/files/chrpublications/chr_i-26.pdf">chr-khr.org</a></li>` +
    // Ergänzt am 17.11.2026 (Arbeitspaket 7). FR provisorisch
    `<li>${FR ? 'Ports rhénans suisses (2025) : rapport annuel 2024 (10 % de toutes les importations suisses)' : 'Schweizerische Rheinhäfen (2025): Jahresbericht 2024 (10 % aller Schweizer Importe)'} – <a href="https://baselland.talus.ch/de/dokumente/geschaeft/33cb64a006d44d9898474690739fbab6-332">baselland.talus.ch</a></li>` +
    `<li>${FR ? 'AWP (10.8.2026) : « Rhein wegen tiefem Pegelstand fast nicht mehr durchgängig befahrbar », cash.ch (OFAE : environ 8 % des importations ; 2025 environ 22 % des importations d’huiles minérales ; bateau avec un cinquième de la quantité)' : 'AWP (10.8.2026): «Rhein wegen tiefem Pegelstand fast nicht mehr durchgängig befahrbar», cash.ch (BWL: rund 8 % der Importe; 2025 rund 22 % der Mineralöleinfuhren; Schiff mit einem Fünftel der Menge)'} – <a href="https://www.cash.ch/news/rhein-wegen-tiefem-pegelstand-fast-nicht-mehr-durchgangig-befahrbar-959922">cash.ch</a></li>` +
    `<li>${FR ? 'Ports rhénans suisses (7.2.2019) : communiqué sur le transbordement 2018 (−18,9 % en raison des basses eaux)' : 'Schweizerische Rheinhäfen (7.2.2019): Medienmitteilung Güterumschlag 2018 (−18,9 % wegen Niedrigwasser)'} – <a href="https://port-of-switzerland.ch/wp-content/uploads/2019/02/190207-MM-SRH-SVS-Jahresumschlagszahlen-2018.pdf">port-of-switzerland.ch</a></li>` +
    `<li>Transport Online (2026a): «Rhein-Niedrigwasser: Lkw ersetzen fehlende Binnenschiffskapazität» – <a href="https://transport-online.de/news/rhein-niedrigwasser-lkw-ersetzen-fehlende-binnenschiffskapazitaet-192243.html">transport-online.de</a></li>` +
    `<li>Transport Online (2026b): «Rhein auf Rekordtief: Binnenschifffahrt verteilt Ladung auf mehr Schiffe» – <a href="https://transport-online.de/news/rhein-auf-rekordtief-binnenschifffahrt-verteilt-ladung-auf-mehr-schiffe-193878.html">transport-online.de</a></li>` +
    `<li>${FR ? 'Constitution du canton de Thurgovie du 16 mars 1987, § 76, al. 3 (RB 101)' : 'Verfassung des Kantons Thurgau vom 16. März 1987, § 76 Abs. 3 (RB 101)'} – <a href="https://www.rechtsbuch.tg.ch/app/de/texts_of_law/101">rechtsbuch.tg.ch</a></li>` +
    `<li>${FR ? 'Fond de carte' : 'Grundkarte'}: © swisstopo; © OpenStreetMap (ODbL). ${h(karte.quelle)}</li></ul>`;
  $('stand').textContent = `${T.standT}${DP}${datum(meta.stand.slice(0, 10))}` + (meta.meldungen.length ? ` · ${meta.meldungen.join(' · ')}` : '');

  // ------------------------------------------------------------ Erzählung: Schritte neben einer stehenden Grafik
  const SCHMAL = () => innerWidth < 760;
  const LL = (de, fr) => FR ? fr : de;
  // Erzählung. Desktop: Die Grafik steht, die Schritte laufen daneben vorbei.
  // Handy: Jeder Schritt ist eine feste Kachel aus Grafik und Text; die eine Grafik wandert in die Kachel, die gerade im Bild ist.
  const MOBIL = () => innerWidth < 980, SCROLLYS = [];
  function scrolly(id, n, aktiv) {
    const el = $(id), ks = [], buehne = el.parentNode.querySelector('.buehne'); let jetzt = -1;
    for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'schritt'; d.innerHTML = '<div class="platz"></div><div class="karton"></div>'; el.append(d); ks.push(d); }
    // Die Kachel, die die Grafik abgibt, behält deren Höhe, damit nichts darüber verrutscht
    const platziere = i => {
      if (!MOBIL()) { if (buehne.parentNode !== el.parentNode) el.parentNode.insertBefore(buehne, el); ks.forEach(k => { k.firstChild.style.height = ''; }); return; }
      const ziel = ks[Math.max(0, i)].firstChild, alt = buehne.parentNode;
      if (alt === ziel) return;
      if (alt && alt.classList.contains('platz')) alt.style.height = `${buehne.offsetHeight}px`;
      ziel.style.height = ''; ziel.append(buehne);
    };
    const setze = i => { if (i === jetzt || i < 0) return; jetzt = i; ks.forEach((k, j) => k.classList.toggle('aktiv', j === i)); platziere(i); aktiv(i); };
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) setze(ks.indexOf(e.target)); }, { rootMargin: '-45% 0px -45% 0px' });
    ks.forEach(k => io.observe(k)); ks[0].classList.add('aktiv'); platziere(0);
    const s = { fuelle: (i, html) => { ks[i].lastChild.innerHTML = html; }, jetzt: () => Math.max(0, jetzt), neu: () => platziere(Math.max(0, jetzt)) };
    SCROLLYS.push(s); return s;
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
    if (o.hw) { let da = false; o.hw.forEach((v, i) => { if (v) { da = true; s += `<rect x="${x(i).toFixed(1)}" y="${O - 2}" width="${(x(i + 1) - x(i) + .3).toFixed(1)}" height="7" fill="#000"/>`; } }); if (da) s += `<text class="fett halo" x="${B - RR - 4}" y="${O + 18}" text-anchor="end">${T.hwT}${DP}${o.hw.reduce((a, b) => a + b, 0)} ${T.tageW}</text>`; }
    if (o.speicher) {
      const y0 = HQ + 34, y1 = H - 8, max = Math.max(1, ...o.speicher) / 1e6, ys = v => y1 - (y1 - y0) * v / max; let d = `M${x(.5).toFixed(1)},${y1}`;
      o.speicher.forEach((v, i) => { d += `L${x(i + .5).toFixed(1)},${ys(v / 1e6).toFixed(1)}`; }); d += `L${x(n - .5).toFixed(1)},${y1}Z`;
      s += `<text class="fett" x="${L}" y="${HQ + 22}">${o.speicherTitel || T.inhalt}</text><path d="${d}" fill="url(#s_e2)" stroke="#003399" stroke-width="1.5"/><line class="achse" x1="${L}" x2="${B - RR}" y1="${y1}" y2="${y1}"/>` +
        `<text x="${L - 6}" y="${y0 + 4}" text-anchor="end">${zahl(max)}</text><text x="${L - 6}" y="${y1 + 4}" text-anchor="end">0</text>`;
    }
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
  }
  const jahrLegende = (sim, sim2, hw) => `<span><i></i>${T.gemessen}</span>` + (sim ? `<span><i class="blau"></i>${T.gBest}</span>` : '') + (sim2 ? `<span><i class="blau strich"></i>${T.gRegel}</span>` : '') +
    `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#g_e2)" stroke="#000"/></svg>${T.gUnter}</span>` + (sim ? `<span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#s_e1)" stroke="#003399"/></svg>${T.gHub}</span>` : '') + (hw ? `<span><svg width="24" height="12" aria-hidden="true"><rect y="3" width="24" height="7" fill="#000"/></svg>${T.hwLeg} (${T.eRegel})</span>` : '') + `<span>${T.gSchnitt}</span>`;
  function jahrCsv(Y, sz) {
    const q = Y.q[KAUB], kopf = ['datum', 'Q_Kaub_m3s', 'status', 'W_Kaub_cm'], zeilen = [];
    if (sz) kopf.push('Q_mit_Rueckhalt_Voraussicht_m3s', 'Speicher_Mio_m3', 'Q_mit_Rueckhalt_Betriebsregel_m3s', 'see_ueber_hochwassergrenze_Betriebsregel');
    q.forEach((v, i) => { if (v == null) return; const z = [isoTag(Y.jahr, i), v, statusAm(Y, KAUB, i), Y.wk ? Y.wk[i] : null];
      if (sz) z.push(sz.v.S.q[KAUB][i], sz.v.S.O ? sz.v.S.O.speicher[i] / 1e6 : null, sz.r.S.q[KAUB][i], sz.r.S.O ? sz.r.S.O.ueber[i] : 0); zeilen.push(z); });
    return { kopf, zeilen };
  }
  // Tiefster Pegel des Jahres in Kaub mit Datum
  function tiefsterTag(Y) { let b = null; const n = (Y.q[BASEL] || []).length; for (let i = 0; i < n; i++) { const m = pegelstand(Y, OHNE, PK, i, false); if (m && (!b || m.w < b.w)) b = { w: m.w, i }; } return b; }
  const gruppenWerte = a => GRUPPEN.map(([nme, m, ks]) => ({ n: T[nme], m, v: ks.reduce((s, k) => s + (a.mittel[k] || 0), 0), da: ks.some(k => k in a.mittel) }));

  // ------------------------------------------------------------ Erzählung: gemeinsame Teile
  const MONATE = FR ? ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    : ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const datumLang = iso => { const [j, m, t] = iso.split('-'); return FR ? `${+t === 1 ? '1er' : +t} ${MONATE[+m - 1]} ${j}` : `${+t}. ${MONATE[+m - 1]} ${j}`; };
  const breiteVon = el => Math.max(330, Math.min(1000, Math.round(el.clientWidth) || 800));
  const kasten = (fill, stroke = '#000') => `<svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="${fill}" stroke="${stroke}"/></svg>`;
  const ZIELE = ['A', 'B', 'C', 'D'];
  // FR provisorisch
  const ZIELNAME = { A: LL('Tiefsten Stand heben', 'Relever le niveau le plus bas'), B: LL('Keine Tage unter 40 cm', 'Aucun jour sous 40 cm'), C: LL('Wenige Tage unter dem GlW', 'Peu de jours sous le GlW'), D: LL('Höchstens 20 Tage unter dem GlW', 'Au plus 20 jours sous le GlW') };
  // Ergebniszahl je Ziel: A kleinste Fahrrinnentiefe, B Tage unter 40 cm, C und D Tage unter dem GlW. FR provisorisch
  const MASS = {
    A: { gem: k => k.t0, sim: k => k.t1, e: ' cm', name: LL('Kleinste Fahrrinnentiefe', 'Profondeur minimale du chenal'), kurz: 't_min_cm' },
    B: { gem: k => k.k0, sim: k => k.k1, e: '', name: LL('Tage unter 40 cm', 'Jours sous 40 cm'), kurz: 'tage_unter_40cm' },
    C: { gem: k => k.u0, sim: k => k.u1, e: '', name: LL('Tage unter dem GlW', 'Jours sous le GlW'), kurz: 'tage_unter_GlW' },
    D: { gem: k => k.u0, sim: k => k.u1, e: '', name: LL('Tage unter dem GlW', 'Jours sous le GlW'), kurz: 'tage_unter_GlW' } };
  const zielWert = (ziel, k, gemessen = false) => { const v = gemessen ? MASS[ziel].gem(k) : MASS[ziel].sim(k);
    return ziel === 'D' && !gemessen ? `${zahl(v)} · ${v <= 20 ? T.ja : T.nein}` : `${zahl(v)}${MASS[ziel].e}`; };
  function zielKnoepfe(el) {
    el.textContent = '';
    el.append(knoepfe(LL('Ziel', 'Objectif'), ZIELE.map(z => [z, ZIELNAME[z]]), Z.zielwahl, v => { if (v === Z.zielwahl) return; Z.zielwahl = v; zielNeu(); }));
  }
  function zielNeu() { document.querySelectorAll('.zielwahl').forEach(zielKnoepfe); alles(); kapitel6(); jahresvergleich(); }
  function jahrKopf(el, aktiv, label, fn, liste = meta.jahre.filter(x => x >= 2008).slice().reverse()) {
    el.innerHTML = `<label class="jahrzahl"><span>${h(label)}</span><select class="jahrwahl" aria-label="${h(label)}">${liste.map(x => `<option${x === aktiv ? ' selected' : ''}>${x}</option>`).join('')}</select></label>`;
    el.querySelector('select').addEventListener('change', e => fn(+e.target.value));
  }
  const regSeen = () => meta.seen.filter(s => s.reguliert);
  const flReg = () => regSeen().reduce((a, s) => a + s.flaeche_km2, 0), flBod = () => meta.seen.filter(s => !s.reguliert).reduce((a, s) => a + s.flaeche_km2, 0);
  const stufenVol = Y => Object.fromEntries(STUFEN.map(s => [s, volMio(stufeCM(Y, s, 50))]));
  const hubKaub = q => wAusQ(Q_GLW) - wAusQ(Q_GLW - q);      // Anhebung des Pegels Kaub beim GlW durch q m³/s

  // ---- Kapitel 1: Wo es eng wird
  const BUEHNE1 = ['v1', 'v1', 'karte', 'karte', 'karte', 'netz', 'karte'];
  const RAHMEN1 = { 2: [[47.4, 6.9], [50.3, 9.1]], 3: [[48.7, 7.4], [50.3, 9.1]], 4: [[46.3, 6.6], [47.9, 9.9]], 6: [[46.6, 6.9], [50.2, 9.9]] };
  let R1 = null, TAG0 = null, schritt1 = 0;
  const sc1 = scrolly('st1', 7, i => { schritt1 = i; const b = BUEHNE1[i]; $('v1fig').hidden = b !== 'v1'; $('netzfig').hidden = b !== 'netz'; document.querySelector('#sc1 .karte').hidden = b !== 'karte';
    if (b === 'karte') { map.invalidateSize(); map.flyToBounds(RAHMEN1[i], { duration: .8 }); }
    if (b === 'v1') v1Zeichnen(i === 1); });
  // Alle Messstellen als Baum, von oben nach unten flussabwärts: gemessenes Tagesmittel und Zwischengebiet (Rest)
  const BAUM = [['2473', 0], ['2288', 0], ['2044', 1], ['2143', 0], ['2135', 1], ['2029', 1], ['2016', 1], ['2018', 2], ['2243', 2], ['2205', 1], ['2091', 0], ['2289', 0], ['23700200', 0], ['23800690', 1], ['23900200', 0], ['24700404', 1], ['25100100', 0], ['25700100', 0]];
  function netzZeichnen(R) {
    const svg = $('netz'); if (!R.Y || R.i1 == null) { svg.innerHTML = ''; return null; }
    const Y = R.Y, i = R.i1, alt = NETZ; NETZ = VOLL; const E = { ...einzug(KAUB) }; let g = glieder(Y.q, KAUB, i); NETZ = alt;
    const B = Math.max(330, Math.min(760, Math.round(document.querySelector('#sc1 .buehne').clientWidth) || 700)), zh = B < 500 ? 26 : 29, O = 40, H = O + BAUM.length * zh + 8, XQ = B - (B < 500 ? 78 : 120), XR = B - 4, ein = B < 500 ? 16 : 22;
    const y = k => O + k * zh + zh / 2, x = l => 8 + l * ein, zeilen = {};
    BAUM.forEach(([id, l], k) => { zeilen[id] = { k, l }; });
    let s = `<text class="fett" x="0" y="13">${T.nzTitel} ${datum(isoTag(Z.jahr, i))}</text><text x="${XQ}" y="32" text-anchor="end" class="nb">${T.nzGem}</text><text x="${XR}" y="32" text-anchor="end" class="nb">${T.nzRest}</text>`;
    // Verbindungen: vom Zufluss senkrecht hinunter zur Zeile der Messstelle unterhalb, dann waagrecht hinüber
    for (const k of meta.kanten) { const a = zeilen[k.von], b = zeilen[k.nach]; if (!a || !b) continue;
      s += `<path d="M${x(a.l)},${y(a.k)} V${a.l === b.l ? y(b.k) : y(b.k) - zh / 2} H${x(b.l)} V${y(b.k)}" fill="none" stroke="#000" stroke-width="${a.l === b.l ? 3 : 1.5}"/>`; }
    const werte = {};
    BAUM.forEach(([id, l], k) => { const st = ST[id], tag = i - (E[id] || 0), q = wert(Y.q, id, tag), c = statusAm(Y, id, tag), r = g && g['R:' + id];
      werte[id] = { q, r, tag };
      s += `<rect x="${x(l) - 5}" y="${y(k) - 5}" width="10" height="10" fill="${id === KAUB ? '#000' : '#fff'}" stroke="#000" stroke-width="2"/>` +
        `<text x="${x(l) + 10}" y="${y(k) + 4}"><tspan class="fett">${h(nm(kurz(st)))}</tspan> <tspan class="nb">${h(GW(st))}${E[id] ? ` · ${datum(isoTag(Z.jahr, tag)).slice(0, -4)}` : ''}</tspan></text>` +
        `<text class="fett" x="${XQ}" y="${y(k) + 4}" text-anchor="end">${q == null ? '–' : zahl(q)}${c === 0 ? '°' : GERECHNET(c) ? '*' : ''}</text>` +
        (r != null ? `<text x="${XR}" y="${y(k) + 4}" text-anchor="end" fill="#666">${vz(r, 0)}</text>` : ''); });
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('netzlegende').innerHTML = `<span>${T.nzLeg}</span>`;
    return { werte, g, E };
  }
  // V1: schematischer Querschnitt bei Kaub. Pegellatte mit Nullpunkt, GlW, Pegel am gewählten Tag und am tiefsten Tag des laufenden Jahres;
  // Fahrrinne mit Sollmass (TUG unter dem GlW). Die Sohle der Fahrrinne liegt auf der Pegelskala bei GlW − TUG.
  function v1Daten() {
    const R = R1; if (!R || !PK || GLW == null) return null;
    const m = tagAnsicht() && R.Y ? pegelstand(R.Y, OHNE, PK, R.i1, false) : null, YL = GELADEN[LETZTES], t = YL ? tiefsterTag(YL) : null;
    return { m, t, YL, tag: m ? datum(isoTag(Z.jahr, R.i1)) : null, tagT: t ? datum(isoTag(LETZTES, t.i)) : null, sohle: GLW - TUG, bing: t && statusAm(YL, KAUB, t.i) === 9 };
  }
  function v1Zeichnen(hervor) {
    const svg = $('v1'), D = v1Daten(); if (!D) { svg.innerHTML = ''; return; }
    const { m, t, sohle } = D, B = breiteVon(svg.parentNode), schmal = B < 560, H = schmal ? 400 : 460, O = 34, U = 46;
    const top = Math.max(GLW + 150, (m ? m.w : 0) + 60), bot = sohle - 30, y = v => O + (H - O - U) * (top - v) / (top - bot);
    const xl = schmal ? 40 : 62, p0 = xl + (schmal ? 40 : 70), p1 = B - 6, fa = p0 + (p1 - p0) * .34, fb = p0 + (p1 - p0) * .78, bett = sohle + 55, ufer = top - 20;
    // Gelände: links und rechts Böschung, Flussbett, Fahrrinne als Rinne in der Mitte (schematisch)
    const la = p0 + (fa - p0) * .45, rb = fb + (p1 - fb) * .55;
    const xbei = (w, links) => links ? p0 + (la - p0) * (ufer - w) / (ufer - bett) : p1 - (p1 - rb) * (ufer - w) / (ufer - bett);
    let s = `<text class="fett" x="0" y="14">${LL('Querschnitt bei Kaub: Pegel und Fahrrinnentiefe', 'Coupe à Kaub : niveau et profondeur du chenal')}</text>`;   // FR provisorisch
    s += `<path d="M${p0},${y(ufer)} L${la},${y(bett)} L${fa - 10},${y(bett)} L${fa},${y(sohle)} L${fb},${y(sohle)} L${fb + 10},${y(bett)} L${rb},${y(bett)} L${p1},${y(ufer)} L${p1},${H - U + 8} L${p0},${H - U + 8}Z" fill="url(#g_stau)" stroke="#000" stroke-width="1.5"/>`;
    // Pegellatte mit Skala
    s += `<rect x="${xl - 6}" y="${y(top - 10)}" width="12" height="${y(bot + 10) - y(top - 10)}" fill="#fff" stroke="#000" stroke-width="1.5"/>`;
    for (let v = Math.ceil((bot + 10) / 50) * 50; v <= top - 10; v += 50) s += `<line x1="${xl - 6}" x2="${xl + 6}" y1="${y(v)}" y2="${y(v)}" stroke="#000" stroke-width="${v ? 1 : 3}"/><text x="${xl - 10}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    s += `<text class="nb" x="${xl - 10}" y="${y(top - 10) - 6}" text-anchor="end">cm</text><text class="fett" x="${xl + 10}" y="${y(0) + 4}">${LL('Nullpunkt', 'zéro')}</text>`;   // FR provisorisch
    // GlW und Sollmass der Fahrrinne
    s += `<line x1="${xl - 6}" x2="${p1}" y1="${y(GLW)}" y2="${y(GLW)}" stroke="#000" stroke-width="${hervor ? 2.5 : 1}" stroke-dasharray="6 4"/><text class="${hervor ? 'fett ' : ''}halo" x="${xl + 10}" y="${y(GLW) - 6}">GlW ${zahl(GLW)} cm</text>`;
    s += `<line x1="${fa}" x2="${fb}" y1="${y(sohle)}" y2="${y(sohle)}" stroke="#000" stroke-width="3"/><text class="halo" x="${(fa + fb) / 2}" y="${y(sohle) + 16}" text-anchor="middle">${LL('Sohle der Fahrrinne', 'fond du chenal')}</text>`;   // FR provisorisch
    // Sollmass: Sohle der Fahrrinne liegt TUG unter dem GlW
    s += `<text class="${hervor ? 'fett ' : ''}halo" x="${(fa + fb) / 2}" y="${y(sohle) + 32}" text-anchor="middle">${LL(`${zahl(TUG)} cm unter dem GlW`, `${zahl(TUG)} cm sous le GlW`)}</text>`;   // FR provisorisch
    // Wasserspiegel und Tiefe an den beiden Tagen
    const tag = (w, farbe, x, text) => { if (w == null) return '';
      const xa = xbei(w, true), xb = xbei(w, false), ym = y((w + sohle) / 2);
      return `<line x1="${xa}" x2="${xb}" y1="${y(w)}" y2="${y(w)}" stroke="${farbe}" stroke-width="2.5"/><line x1="${xl - 9}" x2="${xl + 9}" y1="${y(w)}" y2="${y(w)}" stroke="${farbe}" stroke-width="3"/>` +
        `<line x1="${x}" x2="${x}" y1="${y(w) + 3}" y2="${y(sohle) - 3}" stroke="${farbe}" stroke-width="1.5"/><path d="M${x - 4},${y(sohle) - 9} L${x},${y(sohle) - 2} L${x + 4},${y(sohle) - 9}" fill="none" stroke="${farbe}" stroke-width="1.5"/>` +
        `<text class="halo" fill="${farbe}" transform="translate(${x + 14},${ym}) rotate(-90)" text-anchor="middle">${zahl(w - sohle)} cm</text>` +
        `<text class="fett halo" fill="${farbe}" x="${xa + 4}" y="${y(w) - 6}">${text}</text>`; };
    if (t) s += tag(t.w, '#003399', fa + (fb - fa) * .24, `${zahl(t.w)} cm${D.bing ? '*' : ''}`);
    if (m) s += tag(m.w, '#000', fa + (fb - fa) * .07, `${zahl(m.w)} cm`);
    // Schiff am Wasserspiegel des gewählten Tages, Höhen im Massstab der Pegelskala (schematisch): Abladetiefe bis 30 cm über der Sohle, Freibord 30 cm, Steuerhaus 50 cm
    if (m) { const sx = fa + (fb - fa) * .42, sw = (fb - fa) * .55, sy = y(m.w), tief = y(Math.min(m.w - 20, sohle + 30)), dk = y(m.w + 30), hh = y(m.w + 80);
      s += `<path d="M${sx},${dk} L${sx + sw},${dk} L${sx + sw},${tief} L${sx + 12},${tief} Q${sx},${tief} ${sx},${tief - 12}Z" fill="#fff" stroke="#000" stroke-width="2"/>` +
        `<rect x="${sx + sw - Math.min(30, sw * .22)}" y="${hh}" width="${Math.min(30, sw * .22) - 4}" height="${dk - hh}" fill="#fff" stroke="#000" stroke-width="2"/><line x1="${sx}" x2="${sx + sw}" y1="${sy}" y2="${sy}" stroke="#000" stroke-width="2.5"/>` +
        `<text class="nb halo" x="${sx + sw / 2}" y="${(sy + tief) / 2 + 4}" text-anchor="middle">${LL('Schiff', 'bateau')}</text>`; }
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    // FR provisorisch
    $('v1legende').innerHTML = (m ? `<span><i></i>${LL(`Pegel am gewählten Tag, ${D.tag}: ${zahl(m.w)} cm, Fahrrinne ${zahl(m.w - sohle)} cm tief`, `niveau le jour choisi, ${D.tag} : ${zahl(m.w)} cm, chenal de ${zahl(m.w - sohle)} cm`)}</span>` : '') + (t ? `<span><i class="blau"></i>${LL(`tiefster Pegel ${LETZTES}, ${D.tagT}: ${zahl(t.w)} cm, Fahrrinne ${zahl(t.w - sohle)} cm tief`, `niveau le plus bas ${LETZTES}, ${D.tagT} : ${zahl(t.w)} cm, chenal de ${zahl(t.w - sohle)} cm`)}${D.bing ? LL(' (* aus dem Pegel Bingen abgeleitet)', ' (* déduit de l’échelle de Bingen)') : ''}</span>` : '') +
      `<span><i class="strich"></i>GlW</span><span>${LL('Schematisch, nicht massstäblich in der Breite. Die Höhen sind Zentimeter am Pegel. Schiff schematisch, Abladetiefe angenommen bis 30 cm über der Sohle.', 'Schématique, pas à l’échelle en largeur. Les hauteurs sont des centimètres à l’échelle. Bateau schématique, enfoncement supposé jusqu’à 30 cm au-dessus du fond.')}</span>`;
    csvKnopf($('v1fig'), () => 'rhein-kaub-querschnitt', () => ({ titel: LL('Querschnitt bei Kaub: Pegel und Fahrrinnentiefe', 'Coupe à Kaub : niveau et profondeur du chenal'), kopf: ['element', 'datum', 'hoehe_am_pegel_cm', 'fahrrinnentiefe_cm'],
      zeilen: [['Pegelnullpunkt', '', 0, null], ['GlW', '', GLW, TUG], ['Sohle der Fahrrinne (GlW minus Tiefe beim GlW)', '', sohle, 0],
        ...(m ? [['Pegel am gewaehlten Tag', isoTag(Z.jahr, R1.i1), m.w, m.w - sohle]] : []), ...(t ? [[`tiefster Pegel ${LETZTES}${D.bing ? ' (aus Pegel Bingen abgeleitet)' : ''}`, isoTag(LETZTES, t.i), t.w, t.w - sohle]] : [])] }));
  }
  function kapitel1(R) {
    R1 = R;
    const tagOk = tagAnsicht() && R.Y && PK, iso = tagOk ? isoTag(Z.jahr, R.i1) : null, tag = tagOk ? datum(iso) : (R.datumText || ''), m = tagOk ? pegelstand(R.Y, OHNE, PK, R.i1, false) : null, zk = m && zustand(m.w, PK);
    if (Z.ansicht === 'heute' && iso && !TAG0) TAG0 = iso;
    // FR provisorisch
    $('k1lead').textContent = LL(`Die Zahlen dieses Kapitels gelten für den gewählten Tag. Voreingestellt ist der letzte Tag mit vollständigen Werten, der ${TAG0 ? datum(TAG0) : '–'}.`, `Les chiffres de ce chapitre valent pour le jour choisi. Par défaut, c’est le dernier jour avec des valeurs complètes, le ${TAG0 ? datum(TAG0) : '–'}.`);
    const nz = netzZeichnen(R);
    const aK = tagOk ? (() => { const alt = NETZ; let a = anteile(R.Y.q, KAUB, R.i1, R.i1); if (!a) { NETZ = NETZ === VOLL ? KURZ : VOLL; a = anteile(R.Y.q, KAUB, R.i1, R.i1); NETZ = alt; } return a; })() : (R.je && R.je[KAUB]), qK = aK ? aK.ziel_mittel : null;
    const A = abschnitte(R).filter(x => x.zm), unter = A.filter(x => x.zm.fehl > 0), tief = A.slice().sort((a, b) => (a.zm.tiefe - a.p.tugl) - (b.zm.tiefe - b.p.tugl))[0];
    const tOben = Math.max(...RP.map(p => p.tugl)), reg = regSeen(), fr = flReg(), fb = flBod(), qB = aK ? abfluss(aK, BASEL) : null, stufen = meta.staustufen.length - 1;
    const D = v1Daten(), t = D && D.t, tz = t && zustand(t.w, PK);
    // Schritt 1: Ein Pegel misst nicht die Tiefe. Werte des tiefsten Tages im laufenden Jahr aus den Daten. FR provisorisch
    sc1.fuelle(0, LL(`<h3>Ein Pegel misst nicht die Tiefe</h3><p>Ein Pegel ist eine Messlatte am Ufer. Er zeigt, wie hoch das Wasser steht, gemessen von einem festgelegten Nullpunkt. Über die Wassertiefe sagt er direkt nichts.${t ? ` Am ${datumLang(isoTag(LETZTES, t.i))} stand der Pegel Kaub bei ${zahl(t.w)} cm${D.bing ? ' (an diesem Tag aus dem Pegel Bingen abgeleitet)' : ''}. Die Fahrrinne, der ausgebaggerte und markierte Streifen, in dem die Schiffe fahren, war an diesem Tag trotzdem ${zahl(tz.tiefe)} cm tief. Vorgesehen sind ${zahl(TUG)} cm.` : ''}</p>`,
      `<h3>Une échelle ne mesure pas la profondeur</h3><p>Une échelle limnimétrique est une règle graduée sur la rive. Elle indique la hauteur de l’eau, mesurée depuis un zéro fixé. Elle ne dit rien directement de la profondeur.${t ? ` Le ${datumLang(isoTag(LETZTES, t.i))}, l’échelle de Kaub indiquait ${zahl(t.w)} cm${D.bing ? ' (ce jour-là déduit de l’échelle de Bingen)' : ''}. Le chenal, la bande draguée et balisée où naviguent les bateaux, avait pourtant ce jour-là ${zahl(tz.tiefe)} cm de profondeur. La valeur prévue est de ${zahl(TUG)} cm.` : ''}</p>`) +
      (zk ? `<p>${h(tag)}${DP}${LL('Pegel Kaub', 'échelle de Kaub')} <b>${zahl(m.w)} cm</b>, ${LL('Fahrrinne', 'chenal')} <b>${zahl(zk.tiefe)} cm</b> ${LL('tief', 'de profondeur')}.</p>` : ''));
    // Schritt 2: Der Massstab: der GlW. FR provisorisch
    sc1.fuelle(1, LL(`<h3>Der Massstab: der GlW</h3><p>Damit die Schiffe planen können, hält die deutsche Wasserstrassenverwaltung (WSV) in der Fahrrinne eine Mindesttiefe vor. Sie gilt bis zu einem bestimmten Wasserstand, dem gleichwertigen Wasserstand oder kurz GlW. In Kaub liegt er bei ${zahl(GLW)} cm, das entspricht einem Abfluss von ${zahl(Q_GLW)} m³/s. Abfluss heisst die Wassermenge, die pro Sekunde vorbeifliesst. Beim GlW ist die Fahrrinne ${zahl(TUG)} cm tief. Liegt der Pegel tiefer, ist es auch die Fahrrinne, Zentimeter für Zentimeter. Der GlW ist so festgelegt, dass er im langjährigen Mittel an etwa 20 eisfreien Tagen im Jahr unterschritten wird. Diese Seite zählt die Tage unter dem GlW als Mass für Niedrigwasser.</p><p class="formel">Fahrrinnentiefe = Pegel − GlW + ${zahl(TUG)} cm</p>`,
      `<h3>La référence : le GlW</h3><p>Pour que les bateaux puissent planifier, l’administration allemande des voies navigables (WSV) garantit une profondeur minimale dans le chenal. Elle vaut jusqu’à un certain niveau, l’étiage équivalent, en abrégé GlW. À Kaub, il se situe à ${zahl(GLW)} cm, ce qui correspond à un débit de ${zahl(Q_GLW)} m³/s. Le débit est la quantité d’eau qui passe par seconde. Au GlW, le chenal a ${zahl(TUG)} cm de profondeur. Si le niveau est plus bas, le chenal l’est aussi, centimètre par centimètre. Le GlW est fixé de sorte qu’il ne soit pas atteint, en moyenne pluriannuelle, pendant environ 20 jours sans glace par an. Cette page compte les jours sous le GlW comme mesure des basses eaux.</p><p class="formel">Profondeur du chenal = niveau − GlW + ${zahl(TUG)} cm</p>`) +
      (zk ? `<p>${h(tag)}${DP}${zahl(m.w)} − ${zahl(GLW)} + ${zahl(TUG)} = <b>${zahl(zk.tiefe)} cm</b>.</p>` : ''));
    // Schritt 3: Warum Kaub? FR provisorisch
    const alt = NETZ; NETZ = VOLL; const lagB = einzug(KAUB)[BASEL] || 0; NETZ = alt;
    sc1.fuelle(2, LL(`<h3>Warum Kaub?</h3><p>Von Basel bis Iffezheim bei Karlsruhe (Rheinkilometer ${zahl(meta.stau.von)} bis ${zahl(meta.stau.bis)}, nach der amtlichen Kilometrierung des Rheins) halten ${stufen} Staustufen den Wasserstand. Eine Staustufe ist ein Wehr mit Kraftwerk und Schleuse. Dort hängt die Fahrrinne nicht vom Abfluss ab. Unterhalb von Iffezheim fliesst der Rhein frei, und der Wasserstand folgt dem Abfluss. Die flachste Strecke liegt zwischen Budenheim bei Mainz und St. Goar. Dort ist die Fahrrinne beim GlW ${zahl(PK.tugl)} cm tief statt ${zahl(tOben)} cm, und dort steht der Pegel Kaub. Die Zentralkommission für die Rheinschifffahrt (ZKR) gibt die Auslastung der Schiffe nach dem Pegel Kaub an (ZKR, 2023).</p>`,
      `<h3>Pourquoi Kaub ?</h3><p>De Bâle à Iffezheim près de Karlsruhe (kilomètres ${zahl(meta.stau.von)} à ${zahl(meta.stau.bis)} du Rhin, selon le kilométrage officiel), ${stufen} barrages maintiennent le niveau. Un barrage de navigation est un ouvrage avec centrale et écluse. Là, le chenal ne dépend pas du débit. En aval d’Iffezheim, le Rhin coule librement et le niveau suit le débit. Le tronçon le moins profond se situe entre Budenheim près de Mayence et St. Goar. Le chenal y a ${zahl(PK.tugl)} cm de profondeur au GlW au lieu de ${zahl(tOben)} cm, et c’est là que se trouve l’échelle de Kaub. La Commission centrale pour la navigation du Rhin (CCNR) exprime le taux de chargement des bateaux selon l’échelle de Kaub (CCNR, 2023).</p>`) +
      (qB != null && qK ? `<p>${LL(`${h(datum(isoTag(Z.jahr, R.i1 - lagB)))}: <b>${zahl(qB)} m³/s</b> kamen in Basel vorbei, ${zahl(100 * qB / qK)} % des Abflusses in Kaub zwei Tage später.`, `${h(datum(isoTag(Z.jahr, R.i1 - lagB)))} : <b>${zahl(qB)} m³/s</b> sont passés à Bâle, soit ${zahl(100 * qB / qK)} % du débit à Kaub deux jours plus tard.`)}</p>` : ''));
    // Schritt 4: Sieben Abschnitte. «Alle n Abschnitte», wenn alle einen Wert haben, sonst «k von n Abschnitten mit Wert». FR provisorisch
    const n = RP.length, alleWert = A.length === n;
    const satzA = !A.length ? '' : !unter.length ? LL('Alle Abschnitte haben die volle Fahrrinnentiefe.', 'Tous les tronçons ont la pleine profondeur du chenal.')
      : (alleWert ? (unter.length === n ? LL(`Alle ${n} Abschnitte liegen unter dem GlW.`, `Les ${n} tronçons sont tous sous le GlW.`) : LL(`${unter.length} von ${n} Abschnitten liegen unter dem GlW.`, `${unter.length} tronçons sur ${n} sont sous le GlW.`))
        : LL(`${unter.length} von ${A.length} Abschnitten mit Wert liegen unter dem GlW.`, `${unter.length} tronçons sur ${A.length} avec valeur sont sous le GlW.`)) +
        ` ${LL(`Am weitesten darunter: ${h(tief.p.name)} mit <b>${zahl(tief.zm.tiefe)} cm</b> statt ${zahl(tief.p.tugl)} cm.`, `Le plus bas : ${h(tief.p.name)} avec <b>${zahl(tief.zm.tiefe)} cm</b> au lieu de ${zahl(tief.p.tugl)} cm.`)}`;
    sc1.fuelle(3, LL(`<h3>Sieben Abschnitte bis Kaub</h3><p>Von Iffezheim bis Kaub ist der Rhein in ${n} Abschnitte geteilt. Jeder hat einen eigenen Richtpegel mit eigenem GlW. Der Richtpegel ist der Pegel, der für seinen Abschnitt die Fahrrinnentiefe bestimmt. Auf der Karte heisst eine durchgezogene Linie volle Fahrrinnentiefe. Je kürzer die Striche, desto weiter liegt der Pegel unter dem GlW.</p>`,
      `<h3>Sept tronçons jusqu’à Kaub</h3><p>D’Iffezheim à Kaub, le Rhin est divisé en ${n} tronçons. Chacun a sa propre échelle de référence avec son propre GlW. L’échelle de référence est celle qui détermine la profondeur du chenal de son tronçon. Sur la carte, un trait plein signifie pleine profondeur du chenal. Plus les tirets sont courts, plus le niveau est sous le GlW.</p>`) + (satzA ? `<p>${h(tag)}${DP}${satzA}</p>` : ''));
    // Schritt 5: Seen und Zuflüsse. FR provisorisch
    sc1.fuelle(4, LL(`<h3>Seen und Zuflüsse</h3><p>Oberhalb von Basel zeigt die Strichbreite den Abfluss. Dreiecke sind regulierte Seen: Ein Wehr am Ausfluss bestimmt nach einem Reglement, wie viel Wasser weiterfliesst. Der Kreis ist der Bodensee. Er hat kein Wehr.</p><p>Die ${reg.length} regulierten Seen haben zusammen <b>${zahl(fr)} km²</b>, der Bodensee <b>${zahl(fb)} km²</b>.</p>`,
      `<h3>Lacs et affluents</h3><p>En amont de Bâle, la largeur du trait indique le débit. Les triangles sont des lacs régulés : un barrage à l’exutoire détermine selon un règlement combien d’eau s’écoule. Le cercle est le lac de Constance. Il n’a pas de barrage.</p><p>Les ${reg.length} lacs régulés totalisent <b>${zahl(fr)} km²</b>, le lac de Constance <b>${zahl(fb)} km²</b>.</p>`));
    // Schritt 6: Gemessen an 18 Messstellen; Rechenbeispiele zum Aufklappen. FR provisorisch
    if (nz) { const w = nz.werte, f = id => w[id] && w[id].q != null ? zahl(w[id].q) : '–', r = id => w[id] && w[id].r != null ? vz(w[id].r, 0) : '–';
      const ktr = ['2205', '2016', '2018', '2243'].every(id => w[id] && w[id].q != null) ? w['2205'].q - w['2016'].q - w['2018'].q - w['2243'].q : null;
      sc1.fuelle(5, LL(`<h3>Gemessen an ${BAUM.length} Messstellen</h3><p>Jede Zahl rechts ist ein gemessenes Tagesmittel in m³/s, in der Schweiz vom Bundesamt für Umwelt (BAFU), in Deutschland von der WSV. Die Linien zeigen, welche Messstelle in welche fliesst. Zwischen zwei Messstellen kommen kleinere Flüsse dazu. Die Seite rechnet sie als Differenz und nennt diesen Teil Zwischengebiet (graue Zahl).</p>` +
        `<details class="mehr"><summary>Rechenbeispiel</summary><p>Basel: ${f('2289')} − Rheinfelden ${f('2091')} = <b>${r('2289')} m³/s</b> aus Birs, Ergolz und Wiese. Kaub: ${f('25700100')} − Mainz ${f('25100100')} = <b>${r('25700100')} m³/s</b>, vor allem aus der Nahe.</p>${ktr != null ? `<p>Probe: Die Aare in Untersiggenthal (${f('2205')}) sollte gleich viel führen wie Brugg, Reuss und Limmat zusammen. Die Abweichung beträgt ${vz(ktr, 0)} m³/s.</p>` : ''}<p>Das Wasser braucht von Basel bis Kaub rund zwei Tage. Darum zählt für Kaub der Abfluss in Basel und oberhalb zwei Tage früher, in Maxau und am Neckar einen Tag früher.</p></details><p class="hinweis">° Rohwert · * aus dem Wasserstand gerechnet.</p>`,
        `<h3>Mesuré à ${BAUM.length} stations</h3><p>Chaque nombre à droite est une moyenne journalière mesurée en m³/s, en Suisse par l’Office fédéral de l’environnement (OFEV), en Allemagne par la WSV. Les lignes montrent quelle station se déverse dans laquelle. Entre deux stations, de plus petites rivières s’ajoutent. La page les calcule comme différence et appelle cette part bassin intermédiaire (nombre gris).</p>` +
        `<details class="mehr"><summary>Exemple de calcul</summary><p>Bâle : ${f('2289')} − Rheinfelden ${f('2091')} = <b>${r('2289')} m³/s</b> de la Birse, de l’Ergolz et de la Wiese. Kaub : ${f('25700100')} − Mayence ${f('25100100')} = <b>${r('25700100')} m³/s</b>, surtout de la Nahe.</p>${ktr != null ? `<p>Contrôle : l’Aar à Untersiggenthal (${f('2205')}) devrait porter autant que Brugg, la Reuss et la Limmat ensemble. L’écart est de ${vz(ktr, 0)} m³/s.</p>` : ''}<p>L’eau met environ deux jours de Bâle à Kaub. Pour Kaub, le débit de Bâle et de l’amont compte donc deux jours plus tôt, celui de Maxau et du Neckar un jour plus tôt.</p></details><p class="hinweis">° valeur brute · * calculé à partir du niveau.</p>`)); }
    // Schritt 7: Woher das Wasser in Kaub kommt. FR provisorisch
    const g = aK ? gruppenWerte(aK).filter(x => x.da) : [];
    sc1.fuelle(6, LL(`<h3>Woher das Wasser in Kaub kommt</h3>`, `<h3>D’où vient l’eau à Kaub</h3>`) + (aK ? `<p>${h(tag)}${DP}<b>${zahl(qK)} m³/s</b> ${LL('in Kaub, geteilt nach Herkunft. Jeder Teil ist gemessen oder als Zwischengebiet gerechnet.', 'à Kaub, répartis selon l’origine. Chaque part est mesurée ou calculée comme bassin intermédiaire.')}</p>` +
      `<div class="band">${g.map(x => `<i class="${x.m}" style="flex:${Math.max(0, x.v).toFixed(1)} 0 0"></i>`).join('')}</div><div class="herk">${g.map(x => `<i class="${x.m}"></i><span>${h(x.n)}</span><b>${qz(x.v)}</b><b>${zahl(100 * x.v / qK)} %</b>`).join('')}</div>` : `<p>${T.keine}</p>`));
    if (BUEHNE1[schritt1] === 'v1') v1Zeichnen(schritt1 === 1);
    v2Zeichnen(R);
  }
  // V2: Was ein Schiff laden kann. ZKR-Werte als Punkte, dazwischen gestrichelt (Schätzung); 2026 beobachtet als blaue Marken
  const BEOB = { tag: '2026-10-01', anteil: 100 * 3 / 14, band: ['2026-08-10', '2026-08-20'], von: 10, bis: 20 };
  function v2Zeichnen(R) {
    const svg = $('v2'); if (!AUSL || !PK) { svg.innerHTML = ''; return; }
    const Y26 = GELADEN[2026], wk = (Y, iso) => Y && Y.wk ? Y.wk[tagNr(iso)] : null;
    const wO = wk(Y26, BEOB.tag), band = Y26 && Y26.wk ? Y26.wk.slice(tagNr(BEOB.band[0]), tagNr(BEOB.band[1]) + 1).filter(v => v != null) : [];
    const m = tagAnsicht() && R.Y ? pegelstand(R.Y, OHNE, PK, R.i1, false) : null;
    const B = breiteVon(svg.parentNode), schmal = B < 560, H = schmal ? 300 : 360, L = schmal ? 40 : 52, RR = 14, O = 34, U = 40, x0 = -40, x1 = 280;
    const x = w => L + (B - L - RR) * (Math.max(x0, Math.min(x1, w)) - x0) / (x1 - x0), y = p => O + (H - O - U) * (1 - p / 100);
    let s = `<text class="fett" x="0" y="14">${LL('Nutzbare Ladung eines Schiffs nach Pegel Kaub, %', 'Chargement utilisable d’un bateau selon l’échelle de Kaub, %')}</text>`;   // FR provisorisch
    for (let p = 0; p <= 100; p += 25) s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(p)}" y2="${y(p)}"/><text x="${L - 6}" y="${y(p) + 4}" text-anchor="end">${zahl(p)}</text>`;
    for (let w = -40; w <= x1; w += 40) s += `<line class="achse" x1="${x(w)}" x2="${x(w)}" y1="${y(0)}" y2="${y(0) + 5}"/><text x="${x(w)}" y="${y(0) + 18}" text-anchor="middle">${zahl(w)}</text>`;
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/><text x="${B - RR}" y="${H - 4}" text-anchor="end">${LL('Pegel Kaub, cm', 'échelle de Kaub, cm')}</text>`;
    const p = AUSL.punkte;
    s += `<line x1="${x(AUSL.keine_unter)}" x2="${x(AUSL.keine_unter)}" y1="${O}" y2="${y(0)}" stroke="#a8a8a8" stroke-dasharray="3 3"/><text class="nb" x="${x(AUSL.keine_unter) + 4}" y="${O + 10}">${zahl(AUSL.keine_unter)} cm</text>`;
    s += `<path d="M${p.map(q => `${x(q[0]).toFixed(1)},${y(q[1]).toFixed(1)}`).join('L')}" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="5 4"/>` +
      p.map(q => `<circle cx="${x(q[0])}" cy="${y(q[1])}" r="5" fill="#000"><title>ZKR: ${zahl(q[0])} cm, ${zahl(q[1])} %</title></circle><text class="halo" x="${x(q[0]) + 8}" y="${y(q[1]) + 4}">${zahl(q[0])} cm · ${zahl(q[1])} %</text>`).join('');
    if (band.length) { const a = Math.min(...band), b = Math.max(...band);
      s += `<rect x="${x(a) - 3}" y="${y(BEOB.bis)}" width="${x(b) - x(a) + 6}" height="${y(BEOB.von) - y(BEOB.bis)}" fill="url(#s_e1)" stroke="#003399" stroke-width="1.5"/><text class="blau halo" x="${x(a) - 3}" y="${y(BEOB.von) + 16}">${LL('Mitte August 2026: 10 bis 20 %', 'mi-août 2026 : 10 à 20 %')}</text>`; }   // FR provisorisch
    if (wO != null) s += `<rect x="${x(wO) - 5}" y="${y(BEOB.anteil) - 5}" width="10" height="10" fill="#003399"/><text class="blau halo" x="${x(wO) + 9}" y="${y(BEOB.anteil) - 6}">${LL('1.10.2026: 14 statt 3 Schiffe', '1.10.2026 : 14 bateaux au lieu de 3')}</text>`;   // FR provisorisch
    if (m) s += `<line x1="${x(m.w)}" x2="${x(m.w)}" y1="${O - 6}" y2="${y(0)}" stroke="#000" stroke-width="1.5"/><text class="fett halo" x="${x(m.w) + (x(m.w) > B * .7 ? -4 : 4)}" y="${O - 10}" text-anchor="${x(m.w) > B * .7 ? 'end' : 'start'}">${datum(isoTag(Z.jahr, R.i1))}: ${zahl(m.w)} cm</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    // FR provisorisch
    $('v2legende').innerHTML = `<span><svg width="14" height="12" aria-hidden="true"><circle cx="7" cy="6" r="5" fill="#000"/></svg>ZKR (2023)</span><span><i class="strich"></i>${LL('Schätzung zwischen den Werten', 'estimation entre les valeurs')}</span><span><svg width="14" height="12" aria-hidden="true"><rect x="2" y="1" width="10" height="10" fill="#003399"/></svg>${LL('2026 beobachtet (Transport Online, 2026a, 2026b)', 'observé en 2026 (Transport Online, 2026a, 2026b)')}</span>${m ? `<span><i></i>${LL('gewählter Tag', 'jour choisi')}</span>` : ''}`;
    csvKnopf($('v2fig'), () => 'rhein-ladung-nach-pegel', () => ({ titel: LL('Nutzbare Ladung eines Schiffs nach Pegel Kaub', 'Chargement utilisable selon l’échelle de Kaub'), kopf: ['reihe', 'datum', 'pegel_kaub_cm_von', 'pegel_kaub_cm_bis', 'ladung_prozent_von', 'ladung_prozent_bis', 'quelle'],
      zeilen: [...p.map(q => ['ZKR', '', q[0], q[0], q[1], q[1], 'ZKR 2023']), ...(wO != null ? [['beobachtet: 14 statt 3 Schiffe', BEOB.tag, wO, wO, BEOB.anteil, BEOB.anteil, 'Transport Online 2026b']] : []),
        ...(band.length ? [['beobachtet: 10 bis 20 % der Ladung', `${BEOB.band[0]} bis ${BEOB.band[1]}`, Math.min(...band), Math.max(...band), BEOB.von, BEOB.bis, 'Transport Online 2026a']] : []), ...(m ? [['gewaehlter Tag', isoTag(Z.jahr, R.i1), m.w, m.w, null, null, 'WSV']] : [])] }));
  }

  // ---- Kapitel 2: Wie oft war es zu wenig?
  const K2 = [2019, 2018, 2022, LETZTES].filter((j, i, a) => meta.jahre.includes(j) && a.indexOf(j) === i), D2 = {};
  let jetzt2 = null;
  const sc2 = scrolly('st2', K2.length + 1, i => zeige2(i));     // Schritt 0: alle Jahre übereinander
  let ALLE = null;                              // { jahre: [[Jahr, Abfluss Kaub je Tag]], liste: [[Jahr, q, kaubJahr]] }
  function alleGrafik(svg) {
    const B = Math.max(420, Math.min(1000, Math.round(svg.parentNode.clientWidth) || 800)), schmal = B < 600, H = schmal ? 300 : 440, L = schmal ? 46 : 62, RR = schmal ? 40 : 58, O = 44, U = 30, ymax = 2000;
    const x = i => L + (B - L - RR) * i / 366, y = v => O + (H - O - U) * (1 - Math.min(v, ymax) / ymax);
    const pfad = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null) { an = false; return; } d += (an ? 'L' : 'M') + x(i + .5).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    const erst = ALLE.jahre[0][0];
    let s = `<text class="fett" x="${L}" y="14">${T.aaTitel} ${erst}–${LETZTES}</text><text x="${L - 6}" y="${O - 10}" text-anchor="end">m³/s</text><text x="${B - RR + 6}" y="${O - 10}">cm</text>`;
    for (let v = 0; v <= ymax; v += 500) { const w = v ? wAusQ(v) : null; s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>` + (w != null ? `<text x="${B - RR + 6}" y="${y(v) + 4}">${zahl(w)}</text>` : ''); }
    for (let m = 0; m < 12; m++) { const i = tagNr(`2001-${String(m + 1).padStart(2, '0')}-01`); s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${H - U}" y2="${H - U + 5}"/>` + (!schmal || m % 2 === 0 ? `<text x="${x(i) + 3}" y="${H - U + 18}">${T.monate[m]}</text>` : ''); }
    // Tage unter dem GlW schraffiert: schwarz 2018, blau das laufende Jahr
    const schraffur = (q, f) => q.forEach((v, i) => { if (v != null && v < Q_GLW) s += `<rect x="${x(i).toFixed(1)}" y="${y(Q_GLW).toFixed(1)}" width="${(x(i + 1) - x(i) + .3).toFixed(1)}" height="${(y(v) - y(Q_GLW)).toFixed(1)}" fill="${f}"/>`; });
    { const a18 = ALLE.jahre.find(a => a[0] === 2018), aL = ALLE.jahre.find(a => a[0] === LETZTES); if (a18) schraffur(a18[1], 'url(#g_e1)'); if (aL) schraffur(aL[1], 'url(#s_e1)'); }
    for (const [j, q] of ALLE.jahre) if (j !== LETZTES && j !== 2018) s += `<path d="${pfad(q)}" fill="none" stroke="#a8a8a8" stroke-width="1"><title>${j}</title></path>`;
    const q18 = ALLE.jahre.find(a => a[0] === 2018), qL = ALLE.jahre.find(a => a[0] === LETZTES);
    if (q18) s += `<path d="${pfad(q18[1])}" fill="none" stroke="#000" stroke-width="2"/>`;
    if (qL) s += `<path d="${pfad(qL[1])}" fill="none" stroke="#003399" stroke-width="2.5"/>`;
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}"/><line class="soll" x1="${L}" x2="${B - RR}" y1="${y(Q_GLW)}" y2="${y(Q_GLW)}"/><text class="fett halo" x="${B - RR - 4}" y="${y(Q_GLW) - 6}" text-anchor="end">GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s</text>` +
      (Q40 != null ? `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(Q40)}" y2="${y(Q40)}"/><text class="halo" x="${L + 6}" y="${y(Q40) + 15}">${zahl(AUSL.keine_unter)} cm = ${zahl(Q40)} m³/s</text>` : '');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
  }
  function zeige2(i) {
    const fig = $('jahrfig'), svg = $('jahrkaub');
    if (i === 0) { if (!ALLE) return; jetzt2 = 0; alleGrafik(svg);
      $('jahrlegende').innerHTML = `<span><i style="border-color:#a8a8a8"></i>${T.aaAndere}</span><span><i></i>2018</span><span><i class="blau"></i>${LETZTES}</span><span>${kasten('url(#g_e1)')}${T.gUnter} 2018</span><span>${kasten('url(#s_e1)', '#003399')}${T.gUnter} ${LETZTES}</span><span>${T.gSchnitt}</span>`;
      csvKnopf(fig, () => 'rhein-kaub-alle-jahre', () => ({ titel: `${T.aaTitel} ${ALLE.jahre[0][0]}–${LETZTES}`, kopf: ['tag_im_jahr', ...ALLE.jahre.map(a => `Q_Kaub_${a[0]}_m3s`)], zeilen: Array.from({ length: 366 }, (_, k) => [k + 1, ...ALLE.jahre.map(a => a[1][k] == null ? null : a[1][k])]) }));
      return; }
    const j = K2[Math.min(i - 1, K2.length - 1)], d = D2[j]; if (!d) return; jetzt2 = i;
    jahrGrafik(svg, d.Y, { titel: `${T.gTitel} ${j}` }); $('jahrlegende').innerHTML = jahrLegende(false, false);
    csvKnopf(fig, () => `rhein-kaub-${j}`, () => ({ titel: `${T.gTitel} ${j}`, ...jahrCsv(d.Y, null) }));
  }
  // V4: Tage unter dem GlW je Jahr, darin dunkler die Tage unter 40 cm; laufendes Jahr blau
  function v4Zeichnen(liste) {
    const svg = $('v4'), B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 260 : 300, L = schmal ? 30 : 40, RR = 8, O = 40, U = 30, n = liste.length;
    const max = Math.max(20, ...liste.map(a => a[2].u0)), st = max > 100 ? 50 : 20, top = Math.ceil(max / st) * st, bw = (B - L - RR) / n;
    const y = v => O + (H - O - U) * (1 - v / top), lt = (() => { const q = liste[n - 1][1]; let i = q.length - 1; while (i > 0 && q[i] == null) i--; return datum(isoTag(liste[n - 1][0], i)); })();
    let s = `<text class="fett" x="0" y="14">${LL('Tage unter dem GlW in Kaub je Jahr, darin Tage unter 40 cm', 'Jours sous le GlW à Kaub par année, dont jours sous 40 cm')}</text>`;   // FR provisorisch
    for (let v = 0; v <= top; v += st) s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    liste.forEach(([j, , k], i) => { const x0 = L + i * bw + bw * .15, w = bw * .7, lj = j === LETZTES;
      s += `<rect x="${x0.toFixed(1)}" y="${y(k.u0)}" width="${w.toFixed(1)}" height="${y(0) - y(k.u0)}" fill="${lj ? '#99aad9' : '#a8a8a8'}"><title>${j}: ${k.u0}</title></rect>` +
        (k.k0 ? `<rect x="${x0.toFixed(1)}" y="${y(k.k0)}" width="${w.toFixed(1)}" height="${y(0) - y(k.k0)}" fill="${lj ? '#003399' : '#000'}"><title>${j}: ${k.k0}</title></rect>` : '') +
        (k.u0 ? `<text x="${x0 + w / 2}" y="${y(k.u0) - 4}" text-anchor="middle"${lj ? ' class="blau"' : ''}>${k.u0}</text>` : '') +
        `<text x="${x0 + w / 2}" y="${H - U + 16}" text-anchor="middle">${schmal ? String(j).slice(2) : j}</text>`;
      if (lj) s += `<text class="blau" x="${Math.min(B - RR, x0 + w)}" y="${O - 22}" text-anchor="end">${LL(`bis ${lt}`, `jusqu’au ${lt}`)}</text>`; });   // FR provisorisch
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    // FR provisorisch
    $('v4legende').innerHTML = `<span>${kasten('#a8a8a8', '#a8a8a8')}${LL('Tage unter dem GlW', 'jours sous le GlW')}</span><span>${kasten('#000')}${LL('davon unter 40 cm', 'dont sous 40 cm')}</span><span>${kasten('#99aad9', '#003399')}${LETZTES}</span>`;
    csvKnopf($('v4fig'), () => 'rhein-kaub-tage-je-jahr', () => ({ titel: LL('Tage unter dem GlW in Kaub je Jahr', 'Jours sous le GlW à Kaub par année'), kopf: ['jahr', 'tage_mit_wert', 'tage_unter_GlW', 'tage_unter_40cm', 'bis'], zeilen: liste.map(([j, , k], i) => [j, k.tage, k.u0, k.k0, i === n - 1 ? lt : '']) }));
  }
  function monateUnter(Y) {               // erster und letzter Monat mit einem Tag unter dem GlW
    let a = null, b = null; const n = (Y.q[BASEL] || []).length;
    for (let i = 0; i < n; i++) { const m = pegelstand(Y, OHNE, PK, i, false); if (m && m.w < GLW) { if (a == null) a = i; b = i; } }
    return a == null ? null : [MONATE[new Date(Date.UTC(Y.jahr, 0, 1 + a)).getUTCMonth()], MONATE[new Date(Date.UTC(Y.jahr, 0, 1 + b)).getUTCMonth()]];
  }
  // Zählung aus den Statuscodes: 7 aus dem Wasserstand, 8 mit verlängerter Kurve, 9 aus dem Pegel Bingen abgeleitet
  function zaehlung(Y) {
    const q = Y.q[KAUB] || [], c = { 7: 0, 8: 0, 9: 0 };
    q.forEach((x, i) => { if (x == null) return; const s = statusAm(Y, KAUB, i); if (s in c) c[s]++; });
    return { alle: c[7] + c[8] + c[9], n7: c[7], n8: c[8], n9: c[9] };
  }
  async function kapitel2() {
    const liste = [];
    for (const j of meta.jahre) { const Y = await jahr(j); if (!Y || !Y.q[KAUB] || Y.q[KAUB].filter(v => v != null).length < 300 && j !== LETZTES) continue; liste.push([j, Y.q[KAUB], kaubJahr(Y, OHNE)]); }
    ALLE = { jahre: liste.map(([j, q]) => [j, q]), liste };
    const mit = liste.filter(a => a[2].u0 > 0), viel = liste.slice().sort((a, b) => b[2].u0 - a[2].u0).slice(0, 3), erst = liste[0][0], kl = liste.find(a => a[0] === LETZTES), rekord = kl && viel[0][0] === LETZTES;
    // Kopf. FR provisorisch
    $('kopflead').innerHTML = LL(`Über die Rheinhäfen in Basel kommen 8 bis 10 % aller Schweizer Importe, beim Mineralöl waren es 2025 rund 22 % (Schweizerische Rheinhäfen, 2025; AWP, 2026). Führt der Rhein wenig Wasser, können die Schiffe nur einen Teil ihrer Ladung mitnehmen. ${kl ? `${LETZTES} lag der Pegel Kaub an ${kl[2].u0} Tagen unter dem Bezugswert der Schifffahrt${rekord ? `, so oft wie in keinem Jahr seit ${erst}` : ''}. ` : ''}Diese Seite zeigt mit Messwerten, wovon die Schifffahrt abhängt und woher das Wasser kommt. Danach rechnet sie nach, was es brächte, im Frühsommer Wasser in den Schweizer Seen zurückzuhalten und bei Niedrigwasser abzugeben. Sie ist als Grundlage für eine Diskussion gedacht und gibt keine Empfehlung.`,
      `Les ports rhénans de Bâle reçoivent 8 à 10 % de toutes les importations suisses, et en 2025 environ 22 % pour les huiles minérales (Ports rhénans suisses, 2025 ; AWP, 2026). Quand le Rhin porte peu d’eau, les bateaux ne peuvent emporter qu’une partie de leur chargement. ${kl ? `En ${LETZTES}, l’échelle de Kaub est restée ${kl[2].u0} jours sous le niveau de référence de la navigation${rekord ? `, plus souvent qu’en toute autre année depuis ${erst}` : ''}. ` : ''}Cette page montre, à partir de valeurs mesurées, de quoi dépend la navigation et d’où vient l’eau. Elle calcule ensuite ce qu’apporterait le fait de retenir de l’eau dans les lacs suisses au début de l’été et de la restituer en basses eaux. Elle sert de base à une discussion et ne formule aucune recommandation.`);
    // FR provisorisch
    $('k2lead').textContent = LL(`Seit ${erst} lag Kaub in ${mit.length} von ${liste.length} Jahren an mindestens einem Tag unter dem GlW. Am meisten Tage: ${viel.map(a => `${a[0]} (${a[2].u0})`).join(', ')}. Die Balken zeigen jedes Jahr, die Schritte darunter einzelne Jahre.`,
      `Depuis ${erst}, Kaub est passé sous le GlW au moins un jour pendant ${mit.length} années sur ${liste.length}. Le plus de jours : ${viel.map(a => `${a[0]} (${a[2].u0})`).join(', ')}. Les barres montrent chaque année, les étapes en dessous des années choisies.`);
    v4Zeichnen(liste);
    // FR provisorisch
    sc2.fuelle(0, LL(`<h3>Alle Jahre übereinander</h3><p>Jede graue Linie ist ein Jahr seit ${erst}: der Abfluss in Kaub Tag für Tag, links in m³/s, rechts als Pegel in cm. Schwarz ist 2018, blau ${LETZTES}. Unter der gestrichelten Linie liegt Kaub unter dem GlW.</p>`,
      `<h3>Toutes les années superposées</h3><p>Chaque ligne grise est une année depuis ${erst} : le débit à Kaub jour après jour, à gauche en m³/s, à droite en niveau à l’échelle, en cm. En noir 2018, en bleu ${LETZTES}. Sous la ligne en tirets, Kaub est sous le GlW.</p>`));
    for (const j of K2) {
      const Y = await jahr(j); if (!Y || !Y.q[KAUB] || !PK) continue;
      const k = kaubJahr(Y, OHNE), t = tiefsterTag(Y), bed = bedarfGlw(Y), mo = monateUnter(Y), dt = datum(isoTag(j, t.i));
      D2[j] = { Y, k, t, bed };
      let html;
      // FR provisorisch
      if (!k.u0) html = LL(`<h3>${j}: kein Tag unter dem GlW</h3><p>${j} blieb der Pegel Kaub an allen Tagen über dem GlW. Am tiefsten stand er am ${dt} mit <b>${zahl(t.w)} cm</b>. Die Fahrrinne war dann ${zahl(k.t0)} cm tief.</p>`,
        `<h3>${j} : aucun jour sous le GlW</h3><p>En ${j}, l’échelle de Kaub est restée tous les jours au-dessus du GlW. Le niveau le plus bas était de <b>${zahl(t.w)} cm</b> le ${dt}. Le chenal avait alors ${zahl(k.t0)} cm de profondeur.</p>`);
      else html = LL(`<h3>${j}: ${k.u0} Tage unter dem GlW</h3><p>Zwischen ${mo[0]} und ${mo[1]} lag Kaub an <b>${k.u0} Tagen</b> unter dem GlW, ${k.k0 ? `an <b>${k.k0}</b> davon unter ${zahl(AUSL.keine_unter)} cm. Unter ${zahl(AUSL.keine_unter)} cm findet laut ZKR praktisch keine Binnenschifffahrt mehr statt; einzelne Schiffe fahren bis 35 cm (ZKR, 2023)` : `an keinem davon unter ${zahl(AUSL.keine_unter)} cm`}. Am tiefsten stand der Pegel am ${dt} mit <b>${zahl(t.w)} cm</b>. Die Fahrrinne war dann ${zahl(k.t0)} statt ${zahl(TUG)} cm tief.</p><p>Um Kaub an allen diesen Tagen auf dem GlW zu halten, hätten <b>${zahl(bed)} Mio. m³</b> Wasser gefehlt. Das ist die schraffierte Fläche.</p>`,
        `<h3>${j} : ${k.u0} jours sous le GlW</h3><p>Entre ${mo[0]} et ${mo[1]}, Kaub est resté <b>${k.u0} jours</b> sous le GlW, ${k.k0 ? `dont <b>${k.k0}</b> sous ${zahl(AUSL.keine_unter)} cm. Sous ${zahl(AUSL.keine_unter)} cm, selon la CCNR, la navigation n’a pratiquement plus lieu ; quelques bateaux naviguent jusqu’à 35 cm (CCNR, 2023)` : `aucun sous ${zahl(AUSL.keine_unter)} cm`}. Le niveau le plus bas était de <b>${zahl(t.w)} cm</b> le ${dt}. Le chenal avait alors ${zahl(k.t0)} cm de profondeur au lieu de ${zahl(TUG)} cm.</p><p>Pour maintenir Kaub au GlW tous ces jours, il aurait manqué <b>${zahl(bed)} mio m³</b> d’eau. C’est la surface hachurée.</p>`);
      if (j === LETZTES) { let i = Y.q[KAUB].length - 1; while (i > 0 && Y.q[KAUB][i] == null) i--; const z = zaehlung(Y);
        // FR provisorisch
        html += LL(`<p class="hinweis">Werte bis ${datum(isoTag(j, i))}. An ${z.alle} Tagen ist der Abfluss aus dem Wasserstand gerechnet: an ${z.n7} mit der Abflusskurve, an ${z.n8} mit verlängerter Kurve, an ${z.n9} aus dem Pegel Bingen abgeleitet. An diesen ${z.n9} Tagen lieferte das Pegelportal keinen Wert für Kaub, weil der Pegel um oder unter 0 cm lag. ${j} fuhren Schiffe auch unter 40 cm noch, mit einem kleinen Teil ihrer Ladung (Kapitel 1, «Was ein Schiff laden kann»).</p>`,
          `<p class="hinweis">Valeurs jusqu’au ${datum(isoTag(j, i))}. Sur ${z.alle} jours, le débit est calculé à partir du niveau : ${z.n7} avec la courbe de tarage, ${z.n8} avec une courbe prolongée, ${z.n9} déduits de l’échelle de Bingen. Ces ${z.n9} jours-là, le portail des échelles n’a fourni aucune valeur pour Kaub, car le niveau était proche de 0 cm ou en dessous. En ${j}, des bateaux ont encore navigué sous 40 cm, avec une petite partie de leur chargement (chapitre 1, « Ce qu’un bateau peut charger »).</p>`); }
      sc2.fuelle(K2.indexOf(j) + 1, html);
    }
    zeige2(sc2.jetzt()); typoFr($('k2')); typoFr($('kopflead'));
  }

  // ---- Kapitel 3: Woher kommt das Wasser bei Niedrigwasser?
  let jahrK3 = LETZTES;
  const SEENGEBIET = ['gAareOben', 'gReuss', 'gLimmat'], BLAU6 = ['#001a4d', '#003399', '#3359ad', '#6680c2', '#99a8d6', '#ccd4eb'];
  async function kapitel3() {
    const j = jahrK3, Y = await jahr(j); if (j !== jahrK3) return;
    jahrKopf($('k3kopf'), j, LL('Jahr', 'Année'), v => { jahrK3 = v; kapitel3(); });
    const ref = meta.anteile[KAUB], b = Y && Y.q[KAUB] ? nm7q(Y.q[KAUB]) : null; let a = null;
    if (b) { const alt = NETZ; NETZ = VOLL; a = anteile(Y.q, KAUB, b.beginn, b.beginn + 6); if (!a) { NETZ = KURZ; a = anteile(Y.q, KAUB, b.beginn, b.beginn + 6); } NETZ = alt; }
    if (!a || !ref || !ref.nm7q) { $('k3text').innerHTML = `<p>${T.keine}</p>`; $('v5').innerHTML = ''; $('v6').innerHTML = ''; return; }
    const g0 = gruppenWerte(ref.nm7q), g1 = gruppenWerte(a), gr = GRUPPEN.map(([key], i) => ({ key, n: g0[i].n, ref: g0[i].v, v: g1[i].v, d: g1[i].v - g0[i].v, ch: key !== 'gUnten', see: SEENGEBIET.includes(key) }));
    const qT = a.ziel_mittel, qM = ref.nm7q.ziel_mittel, ch = x => gr.filter(g => g.ch).reduce((s, g) => s + g[x], 0), qCh = ch('v'), qChM = ch('ref');
    const von = datum(isoTag(j, b.beginn)), bis = datum(isoTag(j, b.beginn + 6)), fall = gr.slice().sort((p, q) => p.d - q.d), dSeen = gr.filter(g => g.see).reduce((s, g) => s + g.d, 0);
    const K3 = { j, gr, qT, qM, qCh, qChM, von, bis, periode: `${ref.periode[0]}–${ref.periode[1]}` };
    // FR provisorisch
    $('k3text').innerHTML = LL(`<p>In den sieben trockensten Tagen ${j}, vom ${von} bis ${bis}, flossen in Kaub im Mittel <b>${zahl(qT)} m³/s</b>. In einer üblichen Niedrigwasserwoche sind es ${zahl(qM)} m³/s. Das ist das mittlere Niedrigwasser: der Abfluss der trockensten Woche eines Jahres, gemittelt über die Jahre ${ref.periode[0]} bis ${ref.periode[1]}.</p><p>Aus der Schweiz kamen in diesen Tagen <b>${zahl(qCh)} m³/s</b>, das sind ${zahl(100 * qCh / qT)} %. In einer üblichen Niedrigwasserwoche sind es ${zahl(100 * qChM / qM)} %.</p><p>Gegenüber der üblichen Woche fehlten <b>${zahl(Math.round(qM) - Math.round(qT))} m³/s</b>. Am stärksten ging der Abfluss in zwei Teilen zurück: «${h(fall[0].n)}» um ${zahl(-fall[0].d)} m³/s und «${h(fall[1].n)}» um ${zahl(-fall[1].d)} m³/s. Aus den Gebieten der regulierten Schweizer Seen (Aare bis Brügg, Reuss, Limmat) fehlten zusammen ${zahl(-dSeen)} m³/s.</p><p>Die Referenzperioden unterscheiden sich: Schweizer Messstellen 1991–2020, deutsche 2010–2020, weil die deutschen Tageswerte erst ab 2008 vorliegen. Warum es fehlte, lässt sich aus den Abflüssen nicht ablesen.</p>`,
      `<p>Pendant les sept jours les plus secs de ${j}, du ${von} au ${bis}, le débit moyen à Kaub était de <b>${zahl(qT)} m³/s</b>. Une semaine d’étiage habituelle en compte ${zahl(qM)} m³/s. C’est l’étiage moyen : le débit de la semaine la plus sèche d’une année, en moyenne des années ${ref.periode[0]} à ${ref.periode[1]}.</p><p>De la Suisse sont venus ces jours-là <b>${zahl(qCh)} m³/s</b>, soit ${zahl(100 * qCh / qT)} %. Dans une semaine d’étiage habituelle, la part est de ${zahl(100 * qChM / qM)} %.</p><p>Par rapport à la semaine habituelle, il manquait <b>${zahl(Math.round(qM) - Math.round(qT))} m³/s</b>. Le débit a le plus reculé dans deux parts : « ${h(fall[0].n)} » de ${zahl(-fall[0].d)} m³/s et « ${h(fall[1].n)} » de ${zahl(-fall[1].d)} m³/s. Des bassins des lacs suisses régulés (Aar jusqu’à Brügg, Reuss, Limmat) manquaient ensemble ${zahl(-dSeen)} m³/s.</p><p>Les périodes de référence diffèrent : stations suisses 1991–2020, allemandes 2010–2020, car les valeurs journalières allemandes ne sont disponibles que depuis 2008. Les débits ne permettent pas de dire pourquoi l’eau a manqué.</p>`);
    v5Zeichnen(K3); v6Zeichnen(K3); typoFr($('k3'));
  }
  // V5: zwei gestapelte Säulen gleicher Höhe (100 %), daneben klein in m³/s
  function v5Zeichnen(K) {
    const svg = $('v5'), B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 340 : 380, O = 54, U = 44, sw = schmal ? 70 : 110, kw = schmal ? 22 : 34;
    const farbe = g => g.ch ? BLAU6[GRUPPEN.findIndex(x => x[0] === g.key)] : '#000';
    const xs = [schmal ? 30 : 60, schmal ? 30 + sw + 40 : 60 + sw + 80], xk = xs[1] + sw + (schmal ? 36 : 70), hc = H - O - U, max = Math.max(K.qM, K.qT);
    const saeule = (x, w, werte, summe, skala) => { let y0 = O + hc, s = ''; werte.forEach(g => { const hh = Math.max(0, g.v) / summe * skala; y0 -= hh; s += `<rect x="${x}" y="${y0.toFixed(1)}" width="${w}" height="${hh.toFixed(1)}" fill="${farbe(g)}" stroke="#fff" stroke-width=".8"><title>${h(g.n)}: ${zahl(g.v)} m³/s</title></rect>`; }); return s; };
    const spalte = (wahl) => K.gr.map(g => ({ ...g, v: wahl === 'ref' ? g.ref : g.v }));
    const pos = arr => arr.reduce((s, g) => s + Math.max(0, g.v), 0);
    const a = spalte('ref'), b = spalte('v');
    let s = `<text class="fett" x="0" y="14">${LL('Herkunft des Abflusses in Kaub, Anteil in %', 'Origine du débit à Kaub, part en %')}</text>`;   // FR provisorisch
    [[a, K.qM, K.qChM, LL(`übliche Woche (${K.periode})`, `semaine habituelle (${K.periode})`)], [b, K.qT, K.qCh, `${K.von.slice(0, -5)}–${K.bis}`]].forEach(([arr, q, qc, titel], i) => {   // FR provisorisch
      s += saeule(xs[i], sw, arr, pos(arr), hc) + `<text class="fett" x="${xs[i] + sw / 2}" y="${O - 22}" text-anchor="middle">${zahl(q)} m³/s</text><text class="${i ? 'blau' : ''}" x="${xs[i] + sw / 2}" y="${O - 8}" text-anchor="middle">${LL('Schweiz', 'Suisse')} ${zahl(100 * qc / q)} %</text>` +
        `<text x="${xs[i] + sw / 2}" y="${H - U + 18}" text-anchor="middle">${h(titel)}</text>`; });
    s += `<text x="${xs[1] + sw / 2}" y="${H - U + 34}" text-anchor="middle">${LL(`trockenste 7 Tage ${K.j}`, `7 jours les plus secs ${K.j}`)}</text>`;
    // klein in m³/s, gleicher Massstab für beide
    s += saeule(xk, kw, a, max, hc) + saeule(xk + kw + 8, kw, b, max, hc) + `<text class="nb" x="${xk + kw + 4}" y="${H - U + 18}" text-anchor="middle">m³/s</text>` +
      `<text class="nb" x="${xk + kw / 2}" y="${O + hc - hc * K.qM / max - 4}" text-anchor="middle">${zahl(K.qM)}</text><text class="nb" x="${xk + kw * 1.5 + 8}" y="${O + hc - hc * K.qT / max - 4}" text-anchor="middle">${zahl(K.qT)}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('v5legende').innerHTML = K.gr.map(g => `<span>${kasten(farbe(g), farbe(g))}${h(g.n)}</span>`).join('');
    csvKnopf($('v5fig'), () => `rhein-kaub-herkunft-niedrigwasser-${K.j}`, () => ({ titel: LL(`Herkunft des Abflusses in Kaub: übliche Niedrigwasserwoche und trockenste 7 Tage ${K.j}`, `Origine du débit à Kaub ${K.j}`), kopf: ['herkunft', 'schweiz', 'uebliche_woche_m3s', 'uebliche_woche_prozent', `trockenste_7_tage_${K.j}_m3s`, `trockenste_7_tage_${K.j}_prozent`],
      zeilen: K.gr.map(g => [g.n, g.ch ? 'ja' : 'nein', g.ref, 100 * g.ref / K.qM, g.v, 100 * g.v / K.qT]).concat([['Kaub gesamt', '', K.qM, 100, K.qT, 100], ['Schweiz (oberhalb Basel)', 'ja', K.qChM, 100 * K.qChM / K.qM, K.qCh, 100 * K.qCh / K.qT]]) }));
  }
  // V6: Wasserfall von der üblichen Woche zu den trockensten 7 Tagen, je Herkunftsteil ein Schritt, nach Grösse sortiert
  function v6Zeichnen(K) {
    const svg = $('v6'), B = breiteVon(svg.parentNode), schmal = B < 600, zh = schmal ? 40 : 34, Lb = schmal ? 0 : 290, O = 30, schritte = K.gr.slice().sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
    const reihen = [{ n: LL('Übliche Niedrigwasserwoche', 'Semaine d’étiage habituelle'), a: 0, b: K.qM, art: 'summe' }];   // FR provisorisch
    let lauf = K.qM; for (const g of schritte) { reihen.push({ n: g.n, a: lauf, b: lauf + g.d, art: g.see ? 'see' : 'rest', d: g.d }); lauf += g.d; }
    reihen.push({ n: LL(`Trockenste 7 Tage ${K.j}`, `7 jours les plus secs ${K.j}`), a: 0, b: K.qT, art: 'summe' });
    const H = O + reihen.length * zh + 26, x0 = Lb + 4, RR = 60, max = Math.max(K.qM, ...reihen.map(r => Math.max(r.a, r.b))), x = v => x0 + (B - x0 - RR) * v / max;
    let s = `<text class="fett" x="0" y="14">${LL('Wo die Lücke entstand, m³/s', 'Où le manque est apparu, m³/s')}</text>`;   // FR provisorisch
    reihen.forEach((r, i) => { const y0 = O + i * zh, lo = Math.min(r.a, r.b), hi = Math.max(r.a, r.b), yb = schmal ? y0 + 16 : y0 + 4, bh = schmal ? 16 : 20;
      const f = r.art === 'summe' ? '#fff' : r.art === 'see' ? '#003399' : '#000';
      s += `<text x="${schmal ? 0 : Lb - 8}" y="${schmal ? y0 + 12 : y0 + 19}" text-anchor="${schmal ? 'start' : 'end'}"${r.art === 'summe' ? ' class="fett"' : ''}>${h(r.n)}</text>` +
        `<rect x="${x(lo).toFixed(1)}" y="${yb}" width="${Math.max(1.5, x(hi) - x(lo)).toFixed(1)}" height="${bh}" fill="${f}" stroke="${r.art === 'see' ? '#003399' : '#000'}" stroke-width="1.5"/>` +
        `<text class="${r.art === 'see' ? 'blau' : r.art === 'summe' ? 'fett' : ''}" x="${x(hi) + 6}" y="${yb + bh - 4}">${r.art === 'summe' ? zahl(r.b) : vz(r.d, 0)}</text>`;
      if (i < reihen.length - 1 && r.art !== 'summe' || i === 0) s += `<line x1="${x(r.b)}" x2="${x(r.b)}" y1="${yb + bh}" y2="${yb + zh}" stroke="#a8a8a8" stroke-dasharray="2 2"/>`; });
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    // FR provisorisch
    $('v6legende').innerHTML = `<span>${kasten('#003399', '#003399')}${LL('Gebiete der regulierten Seen (Aare bis Brügg, Reuss, Limmat)', 'bassins des lacs régulés (Aar jusqu’à Brügg, Reuss, Limmat)')}</span><span>${kasten('#000')}${LL('übrige Teile', 'autres parts')}</span>`;
    csvKnopf($('v6fig'), () => `rhein-kaub-luecke-${K.j}`, () => ({ titel: LL(`Wo die Lücke entstand ${K.j}`, `Où le manque est apparu ${K.j}`), kopf: ['schritt', 'von_m3s', 'bis_m3s', 'aenderung_m3s', 'gebiet_regulierter_seen'], zeilen: reihen.map(r => [r.n, r.a, r.b, r.d == null ? null : r.d, r.art === 'see' ? 'ja' : r.art === 'rest' ? 'nein' : '']) }));
  }

  // ---- Teil 2: ein gemeinsames Jahr für Kapitel 4 bis 6
  let jahr3 = STARTJAHR; const D3 = {};
  // FR provisorisch
  $('teil2lead').innerHTML = LL(`<p>Wenn Kaub in der Trockenheit so stark an der Schweiz hängt, liegt eine Frage nahe: Könnten die Schweizer Seen Wasser für solche Zeiten aufsparen?</p><p>Sieben grosse Schweizer Seen haben am Ausfluss ein Wehr. Damit wird schon heute gesteuert, wie viel Wasser abfliesst, vor allem zum Schutz vor Hochwasser. Würde man im Frühsommer weniger abfliessen lassen, stiege der Seespiegel. Dieses Wasser liesse sich bei Niedrigwasser zusätzlich abgeben. Das nennt diese Seite Rückhalt.</p><p>Ein See schafft kein Wasser. Er kann es nur von einer nassen in eine trockene Zeit verschieben. Ob das reicht, hängt an zwei Fragen: Gibt es im Frühsommer genug Wasser, das man zurückhalten kann? Und gibt es in den Seen genug Platz, ohne die Ufer zu gefährden? Teil 2 rechnet das mit den gemessenen Abflüssen jedes Jahres durch. Die Rechnung berücksichtigt weder die heutigen Reglemente noch die Ökologie.</p>`,
    `<p>Si Kaub dépend autant de la Suisse pendant la sécheresse, une question se pose : les lacs suisses pourraient-ils mettre de l’eau de côté pour de telles périodes ?</p><p>Sept grands lacs suisses ont un barrage à leur exutoire. Il règle déjà aujourd’hui la quantité d’eau qui s’écoule, surtout pour la protection contre les crues. Si l’on laissait moins s’écouler au début de l’été, le niveau du lac monterait. Cette eau pourrait être restituée en plus en basses eaux. Cette page appelle cela la retenue.</p><p>Un lac ne crée pas d’eau. Il ne peut que la déplacer d’une période humide vers une période sèche. Que cela suffise dépend de deux questions : y a-t-il assez d’eau au début de l’été pour en retenir ? Et y a-t-il assez de place dans les lacs sans mettre les rives en danger ? La partie 2 fait le calcul avec les débits mesurés de chaque année. Le calcul ne tient compte ni des règlements actuels ni de l’écologie.</p>`);
  async function teil2() {
    const j = jahr3; let d = D3[j];
    if (!d) { const Y = await jahr(j); await nachbarn(j); if (!Y || !Y.q[KAUB] || !PK) return; d = D3[j] = { Y, k: kaubJahr(Y, OHNE), bed: bedarfGlw(Y) }; }
    if (j !== jahr3) return;
    for (const id of ['k4kopf', 'k6kopf']) jahrKopf($(id), j, T.jkRechnet, v => { jahr3 = v; teil2(); });
    $('k6hinweis').textContent = startHinweis();
    kapitel4(d); kapitel5(d); kapitel6();
    typoFr($('k4')); typoFr($('k5'));
  }
  // ---- Kapitel 4: Wie viel Wasser fehlt?
  function vorratJahr(Y) {                      // Was von April bis September über dem Stauabfluss höchstens zurückzuhalten war, ohne Grenzen an den Seen
    const q = Y.q[KAUB], r = q.map(() => 0); let v = 0;
    q.forEach((x, i) => { const m = new Date(Date.UTC(Y.jahr, 0, 1 + i)).getUTCMonth() + 1; if (x == null || m < REGEL_STD.von || m > REGEL_STD.bis || x <= REGEL_STD.stauAb) return; r[i] = Math.min(x - REGEL_STD.stauAb, P_MAX * x); v += r[i]; });
    return { mio: v * SEK / 1e6, r };
  }
  function kapitel4(d) {
    const { Y, bed } = d, j = Y.jahr, reg = regSeen(), fr = flReg(), jeCm = fr / 100, bandListe = reg.filter(s => s.band).map(s => ({ n: nm(s.name), cm: s.band.band_m * 100 })).sort((a, b) => a.cm - b.cm);
    const q100 = 100e6 / (30 * SEK), vr = vorratJahr(Y), tageGlw = bed * 1e6 / (Q_GLW * SEK), lo = bandListe[0], hi = bandListe[bandListe.length - 1];
    // FR provisorisch
    $('k4text').innerHTML = (bed > 0 ? LL(`<p>${j} fehlten in Kaub <b>${zahl(bed)} Mio. m³</b>, um an allen Tagen den GlW zu halten. Eine Million Kubikmeter (Mio. m³) ist ein Würfel von 100 m Kantenlänge. ${zahl(bed)} Mio. m³ sind so viel, wie der Rhein in Kaub beim GlW in ${zahl(tageGlw)} Tagen führt.</p><p>Auf die ${reg.length} regulierten Seen verteilt wären das <b>${zahl(bed / jeCm)} cm</b> mehr Wasser. Heute schwanken diese Seen im Laufe eines Jahres um ${zahl(lo.cm)} cm (${h(lo.n)}) bis ${zahl(hi.cm)} cm (${h(hi.n)}).</p>`,
      `<p>En ${j}, il manquait <b>${zahl(bed)} mio m³</b> à Kaub pour tenir le GlW tous les jours. Un million de mètres cubes (mio m³) est un cube de 100 m d’arête. ${zahl(bed)} mio m³ représentent ce que le Rhin porte à Kaub au GlW en ${zahl(tageGlw)} jours.</p><p>Réparti sur les ${reg.length} lacs régulés, cela ferait <b>${zahl(bed / jeCm)} cm</b> d’eau en plus. Aujourd’hui, ces lacs varient au cours d’une année de ${zahl(lo.cm)} cm (${h(lo.n)}) à ${zahl(hi.cm)} cm (${h(hi.n)}).</p>`)
      : LL(`<p>${j} lag Kaub an keinem Tag unter dem GlW. Es fehlte kein Wasser.</p>`, `<p>En ${j}, Kaub n’est passé sous le GlW aucun jour. Il ne manquait pas d’eau.</p>`)) +
      LL(`<p>Ein Zentimeter mehr auf allen regulierten Seen sind ${zahl(jeCm, 1)} Mio. m³. 100 Mio. m³, über 30 Tage abgegeben, sind ${zahl(q100, 1)} m³/s. Das hebt den Pegel Kaub beim GlW um rund ${zahl(hubKaub(q100))} cm.</p><p>Zurückhalten kann man nur, wenn der Rhein viel führt. Die Rechnung staut deshalb nur, solange Kaub mehr als ${zahl(REGEL_STD.stauAb)} m³/s führt, und höchstens 10 % davon. ${j} kamen so von April bis September höchstens <b>${zahl(vr.mio)} Mio. m³</b> zusammen, ohne die Grenzen an den einzelnen Seen.${bed > 0 ? ` Das ist ${zahl(100 * vr.mio / bed)} % dessen, was fehlte.` : ''}</p>`,
        `<p>Un centimètre de plus sur tous les lacs régulés représente ${zahl(jeCm, 1)} mio m³. 100 mio m³ restitués en 30 jours font ${zahl(q100, 1)} m³/s. Cela relève l’échelle de Kaub d’environ ${zahl(hubKaub(q100))} cm au voisinage du GlW.</p><p>On ne peut retenir que lorsque le Rhin porte beaucoup d’eau. Le calcul ne retient donc que tant que Kaub dépasse ${zahl(REGEL_STD.stauAb)} m³/s, et au plus 10 % de ce débit. En ${j}, cela donnait d’avril à septembre au plus <b>${zahl(vr.mio)} mio m³</b>, sans les limites des différents lacs.${bed > 0 ? ` C’est ${zahl(100 * vr.mio / bed)} % de ce qui manquait.` : ''}</p>`);
    v8Zeichnen(d, bandListe); v7Zeichnen(d, vr);
  }
  // V7: Abfluss Kaub; blau, was über dem Stauabfluss höchstens zurückzuhalten war; schraffiert, was unter dem GlW fehlte; rechts beide Volumen
  function v7Zeichnen(d, vr) {
    const svg = $('v7'), Y = d.Y, q = Y.q[KAUB], n = q.length, B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 280 : 380, L = schmal ? 44 : 56, RB = schmal ? 92 : 150, O = 34, U = 30, ymax = Math.max(2000, ...q.filter(v => v != null)) > 2500 ? 3000 : 2000;
    const xe = B - RB - 10, x = i => L + (xe - L) * i / n, y = v => O + (H - O - U) * (1 - Math.min(v, ymax) / ymax);
    let s = `<text class="fett" x="0" y="14">${LL(`Abfluss in Kaub ${Y.jahr}: was zurückzuhalten war und was fehlte`, `Débit à Kaub ${Y.jahr} : ce qu’on pouvait retenir et ce qui manquait`)}</text>`;   // FR provisorisch
    for (let v = 0; v <= ymax; v += 500) s += `<line class="gitter" x1="${L}" x2="${xe}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Y.jahr}-${String(m + 1).padStart(2, '0')}-01`); s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${H - U}" y2="${H - U + 5}"/>` + (!schmal || m % 2 === 0 ? `<text x="${x(i) + 3}" y="${H - U + 18}">${T.monate[m]}</text>` : ''); }
    q.forEach((v, i) => { if (v == null) return; const b = (x(i + 1) - x(i) + .3).toFixed(1);
      if (vr.r[i] > 0) s += `<rect x="${x(i).toFixed(1)}" y="${y(v).toFixed(1)}" width="${b}" height="${(y(v - vr.r[i]) - y(v)).toFixed(1)}" fill="#003399"/>`;
      if (v < Q_GLW) s += `<rect x="${x(i).toFixed(1)}" y="${y(Q_GLW).toFixed(1)}" width="${b}" height="${(y(v) - y(Q_GLW)).toFixed(1)}" fill="url(#g_e2)"/>`; });
    let pf = '', an = false; q.forEach((v, i) => { if (v == null) { an = false; return; } pf += (an ? 'L' : 'M') + x(i + .5).toFixed(1) + ',' + y(v).toFixed(1); an = true; });
    s += `<path d="${pf}" fill="none" stroke="#000" stroke-width="1.5"/><line class="soll" x1="${L}" x2="${xe}" y1="${y(Q_GLW)}" y2="${y(Q_GLW)}"/><line class="soll" x1="${L}" x2="${xe}" y1="${y(REGEL_STD.stauAb)}" y2="${y(REGEL_STD.stauAb)}"/>` +
      `<text class="halo" x="${xe - 4}" y="${y(REGEL_STD.stauAb) - 5}" text-anchor="end">${zahl(REGEL_STD.stauAb)} m³/s</text><text class="halo" x="${xe - 4}" y="${y(Q_GLW) + 15}" text-anchor="end">GlW</text><line class="achse" x1="${L}" x2="${xe}" y1="${H - U}" y2="${H - U}"/>`;
    // zwei Balken im selben Massstab
    const vm = Math.max(vr.mio, d.bed, 1), bx = xe + (schmal ? 16 : 30), bw = schmal ? 28 : 40, yb = v => O + (H - O - U) * (1 - v / vm);
    s += `<rect x="${bx}" y="${yb(vr.mio)}" width="${bw}" height="${yb(0) - yb(vr.mio)}" fill="#003399"/><text class="blau" x="${bx + bw / 2}" y="${yb(vr.mio) - 5}" text-anchor="middle">${zahl(vr.mio)}</text>` +
      `<rect x="${bx + bw + 8}" y="${yb(d.bed)}" width="${bw}" height="${yb(0) - yb(d.bed)}" fill="url(#g_e2)" stroke="#000"/><text x="${bx + bw * 1.5 + 8}" y="${yb(d.bed) - 5}" text-anchor="middle">${zahl(d.bed)}</text>` +
      `<text class="nb" x="${bx + bw + 4}" y="${H - U + 18}" text-anchor="middle">Mio. m³</text><line class="achse" x1="${bx - 4}" x2="${bx + 2 * bw + 12}" y1="${H - U}" y2="${H - U}"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    // FR provisorisch
    $('v7legende').innerHTML = `<span><i></i>${LL('Abfluss in Kaub, gemessen', 'débit mesuré à Kaub')}</span><span>${kasten('#003399', '#003399')}${LL(`hätte man zurückhalten können (über ${zahl(REGEL_STD.stauAb)} m³/s, April bis September, höchstens 10 %)`, `aurait pu être retenu (au-dessus de ${zahl(REGEL_STD.stauAb)} m³/s, avril à septembre, au plus 10 %)`)}</span><span>${kasten('url(#g_e2)')}${LL('fehlte bis zum GlW', 'manquait jusqu’au GlW')}</span>`;
    csvKnopf($('v7fig'), () => `rhein-kaub-vorrat-und-fehlmenge-${Y.jahr}`, () => ({ titel: LL(`Abfluss in Kaub ${Y.jahr}: zurückzuhalten und Fehlmenge`, `Débit à Kaub ${Y.jahr}`), kopf: ['datum', 'Q_Kaub_m3s', 'zurueckzuhalten_m3s', 'fehlt_bis_GlW_m3s'],
      zeilen: q.map((v, i) => v == null ? null : [isoTag(Y.jahr, i), v, vr.r[i], Math.max(0, Q_GLW - v)]).filter(Boolean).concat([['summe_Mio_m3', null, vr.mio, d.bed]]) }));
  }
  // V8: a) Seestand-Skala in cm, b) Würfel
  function v8Zeichnen(d, bandListe) {
    const Y = d.Y, fr = flReg(), sv = stufenVol(Y), cmB = d.bed / (fr / 100), marken = ['1a', '1b', '1c', '2'].map(s => ({ s, cm: sv[s] / (fr / 100) }));
    { const svg = $('v8a'), B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 320 : 380, L = schmal ? 40 : 50, RR = schmal ? 8 : 170, O = 30, U = 50, n = bandListe.length;
      const top = Math.ceil(Math.max(cmB, ...marken.map(m => m.cm), ...bandListe.map(b => b.cm)) * 1.08 / 50) * 50, y = v => O + (H - O - U) * (1 - v / top), bw = (B - L - RR) / n;
      let s = `<text class="fett" x="0" y="14">${LL('Zentimeter über dem heutigen Seestand', 'Centimètres au-dessus du niveau actuel')}</text>`;   // FR provisorisch
      for (let v = 0; v <= top; v += top > 400 ? 100 : 50) s += `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
      bandListe.forEach((b, i) => { const x0 = L + i * bw + bw * .3;
        s += `<rect x="${x0.toFixed(1)}" y="${y(b.cm)}" width="${(bw * .4).toFixed(1)}" height="${y(0) - y(b.cm)}" fill="#a8a8a8"><title>${h(b.n)}: ${zahl(b.cm)} cm</title></rect>` +
          `<text class="nb" transform="translate(${x0 + bw * .2},${H - U + 10}) rotate(35)">${h(b.n.replace(/see$/, '').replace(/^Lac (de |des )?/, ''))}</text>`; });
      const lx = schmal ? L + 4 : B - RR + 6, ly = v => schmal ? y(v) - 5 : y(v) + 4;   // schmal: Beschriftung über der Linie
      marken.forEach(m => { s += `<line x1="${L}" x2="${B - RR}" y1="${y(m.cm)}" y2="${y(m.cm)}" stroke="#000" stroke-width="1.5"/><text class="halo" x="${lx}" y="${ly(m.cm)}">${T.stufe} ${m.s}: ${zahl(m.cm)} cm</text>`; });
      if (cmB > 0) s += `<line x1="${L}" x2="${B - RR}" y1="${y(cmB)}" y2="${y(cmB)}" stroke="#003399" stroke-width="3"/><text class="blau fett halo" x="${lx}" y="${ly(cmB)}">${LL('Fehlmenge', 'manque')} ${Y.jahr}: ${zahl(cmB)} cm</text>`;   // FR provisorisch
      s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/>`;
      svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s; }
    { const svg = $('v8b'), B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 250 : 300, O = 30, U = 62;
      const wuerfel = [{ n: LL(`Fehlmenge ${Y.jahr}`, `manque ${Y.jahr}`), v: d.bed, f: '#003399' }, { n: `${T.stufe} 1b`, v: sv['1b'], f: '#fff' }, { n: `${T.stufe} 3`, v: sv['3'], f: 'url(#g_e1)' }].filter(w => w.v > 0)   // FR provisorisch
        .map(w => ({ ...w, k: Math.cbrt(w.v * 1e6) }));
      const minW = Math.min(schmal ? 112 : 170, (B - 20) / Math.max(1, wuerfel.length)), platz = p => wuerfel.reduce((a, w) => a + Math.max(w.k * p * 1.4 + 12, minW), 0);
      let px = (H - O - U) / Math.max(...wuerfel.map(w => w.k * 1.35), 1); while (px > 1e-4 && platz(px) > B - 16) px *= .95;
      let s = `<text class="fett" x="0" y="14">${LL('Als Würfel, im selben Massstab', 'En cubes, à la même échelle')}</text>`, x0 = 10;   // FR provisorisch
      for (const w of wuerfel) { const a = w.k * px, o = a * .35, yb = H - U;
        s += `<path d="M${x0},${yb} h${a} v${-a} h${-a}Z" fill="${w.f}" stroke="#000" stroke-width="1.5"/><path d="M${x0},${yb - a} l${o},${-o} h${a} l${-o},${o}Z" fill="${w.f === '#003399' ? '#3359ad' : '#fff'}" stroke="#000" stroke-width="1.5"/><path d="M${x0 + a},${yb} l${o},${-o} v${-a} l${-o},${o}Z" fill="${w.f === '#003399' ? '#001a4d' : '#e6e6e6'}" stroke="#000" stroke-width="1.5"/>` +
          `<text class="fett" x="${x0}" y="${yb + 16}">${h(w.n)}</text><text x="${x0}" y="${yb + 32}">${zahl(w.v)} Mio. m³</text><text x="${x0}" y="${yb + 48}">${LL('Kante', 'arête')} ${zahl(w.k / 1000, 2)} km</text>`;
        x0 += Math.max(w.k * px * 1.4 + 12, minW); }
      s += `<line x1="${B - 10 - 1000 * px}" x2="${B - 10}" y1="${O + 4}" y2="${O + 4}" stroke="#000" stroke-width="3"/><text x="${B - 10}" y="${O + 20}" text-anchor="end">1 km</text>`;
      svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s; }
    // FR provisorisch
    $('v8legende').innerHTML = `<span>${kasten('#a8a8a8', '#a8a8a8')}${LL('Jahresschwankung je See (genutztes Band 1991–2020)', 'variation annuelle par lac (tranche utilisée 1991–2020)')}</span><span><i></i>${LL('Stufen: Kapazität geteilt durch die Fläche aller regulierten Seen', 'paliers : capacité divisée par la surface de tous les lacs régulés')}</span><span><i class="blau"></i>${LL('Fehlmenge in cm', 'manque en cm')}</span>`;
    csvKnopf($('v8fig'), () => `rhein-luecke-im-see-${Y.jahr}`, () => ({ titel: LL(`Die Lücke im See ${Y.jahr}`, `Le manque dans le lac ${Y.jahr}`), kopf: ['reihe', 'cm_auf_regulierten_Seen', 'Mio_m3', 'wuerfelkante_km'],
      zeilen: [...bandListe.map(b => [`band ${b.n}`, b.cm, null, null]), ...STUFEN.map(s => [`stufe ${s}`, s === '3' ? null : sv[s] / (fr / 100), sv[s], Math.cbrt(sv[s] * 1e6) / 1000]), ['fehlmenge', cmB, d.bed, Math.cbrt(d.bed * 1e6) / 1000]] }));
  }
  // ---- Kapitel 5: Wie hoch dürften die Seen steigen?
  function kapitel5(d) {
    const Y = d.Y, j = Y.jahr, sv = stufenVol(Y), fb = flBod(), z = 50, ab = STUFEN.find(s => sv[s] >= d.bed);
    // FR provisorisch
    $('k5text').innerHTML = LL(`<p>Wie viel Platz es gibt, hängt davon ab, welche Grenze man gelten lässt. Jeder regulierte See hat eine Hochwassergrenze: den Seestand, ab dem Ufer überflutet werden und Schäden zu erwarten sind. Die Seite rechnet in Stufen, von dem, was heute schon vorkommt, bis zu Eingriffen, die neue Regeln bräuchten.</p>` +
      `<p><b>Stufe 1a, im genutzten Band:</b> so hoch, wie der See 1991–2020 an den höchsten 1 % der Tage stand. Platz ${j}: ${zahl(sv['1a'])} Mio. m³.</p><p><b>Stufe 1b, bis zur Hochwassergrenze:</b> bis 20 cm darunter. Neuenburger- und Murtensee haben keine amtliche Grenze und bleiben im Band. ${zahl(sv['1b'])} Mio. m³.</p>` +
      `<p><b>Stufe 1c, Jurarandseen bis Gefahrenstufe 4:</b> dazu Neuenburger- und Murtensee bis 20 cm unter den Beginn der Gefahrenstufe 4, der vierten von fünf Hochwasser-Gefahrenstufen des Bundes. ${zahl(sv['1c'])} Mio. m³.</p><p><b>Stufe 2, über der Hochwassergrenze:</b> ${z} cm über die heutige Grenze. Die Wehre gibt es schon. Nötig wären neue Reglemente und Schutzbauten an den Ufern. ${zahl(sv['2'])} Mio. m³.</p>` +
      `<p><b>Stufe 3, mit dem Bodensee:</b> dazu ${z} cm auf dem Bodensee, mit ${zahl(fb)} km² die grösste Fläche. Der Bodensee ist nicht reguliert. Seit einer Volksabstimmung vom 26. August 1973 verpflichtet die Thurgauer Verfassung Kanton und Gemeinden, sich gegen Massnahmen zu wenden, welche die natürlichen Verhältnisse der See- und Flusslandschaft an Bodensee, Untersee und Rhein beeinträchtigen (heute § 76 Abs. 3 KV). Baden-Württemberg hat 1995 die Nutzung als Rückhaltebecken abgelehnt. Die Internationale Kommission für die Hydrologie des Rheingebietes (KHR, 2018) hält eine Regulierung unter den heutigen politischen und rechtlichen Bedingungen für kaum realisierbar. Die Internationale Gewässerschutzkommission für den Bodensee (IGKB, 2024) bewertet sie ökologisch sehr kritisch. ${zahl(sv['3'])} Mio. m³.</p>` +
      (d.bed > 0 ? `<p>${sv['3'] < d.bed ? `Auch Stufe 3 bietet weniger Platz, als ${j} gefehlt hat.` : `Ab Stufe ${ab} wäre Platz für die ganze Fehlmenge ${j}.`}</p>` : ''),
      `<p>La place disponible dépend de la limite que l’on admet. Chaque lac régulé a une limite de hautes eaux : le niveau à partir duquel les rives sont inondées et des dommages sont à prévoir. La page calcule par paliers, de ce qui se produit déjà aujourd’hui jusqu’à des interventions qui demanderaient de nouvelles règles.</p>` +
      `<p><b>Palier 1a, dans la tranche utilisée :</b> aussi haut que le lac l’a été de 1991 à 2020 pendant les 1 % de jours les plus hauts. Place en ${j} : ${zahl(sv['1a'])} mio m³.</p><p><b>Palier 1b, jusqu’à la limite de hautes eaux :</b> jusqu’à 20 cm en dessous. Les lacs de Neuchâtel et de Morat n’ont pas de limite officielle et restent dans la tranche. ${zahl(sv['1b'])} mio m³.</p>` +
      `<p><b>Palier 1c, lacs du pied du Jura jusqu’au degré de danger 4 :</b> en plus, les lacs de Neuchâtel et de Morat jusqu’à 20 cm sous le début du degré de danger 4, le quatrième des cinq degrés de danger de crue de la Confédération. ${zahl(sv['1c'])} mio m³.</p><p><b>Palier 2, au-dessus de la limite de hautes eaux :</b> ${z} cm au-dessus de la limite actuelle. Les barrages existent déjà. Il faudrait de nouveaux règlements et des ouvrages de protection sur les rives. ${zahl(sv['2'])} mio m³.</p>` +
      `<p><b>Palier 3, avec le lac de Constance :</b> en plus, ${z} cm sur le lac de Constance, la plus grande surface avec ${zahl(fb)} km². Le lac de Constance n’est pas régulé. Depuis une votation populaire du 26 août 1973, la constitution thurgovienne oblige le canton et les communes à s’opposer aux mesures qui portent atteinte aux conditions naturelles du paysage lacustre et fluvial du lac de Constance, de l’Untersee et du Rhin (aujourd’hui § 76, al. 3). Le Bade-Wurtemberg a refusé en 1995 de l’utiliser comme bassin de rétention. La Commission internationale de l’hydrologie du bassin du Rhin (CHR, 2018) juge une régulation difficilement réalisable dans les conditions politiques et juridiques actuelles. La Commission internationale pour la protection des eaux du lac de Constance (IGKB, 2024) la juge très critique du point de vue écologique. ${zahl(sv['3'])} mio m³.</p>` +
      (d.bed > 0 ? `<p>${sv['3'] < d.bed ? `Même le palier 3 offre moins de place qu’il n’en a manqué en ${j}.` : `À partir du palier ${ab}, il y aurait de la place pour tout le manque de ${j}.`}</p>` : ''));
    v9Zeichnen(d, sv);
  }
  // V9: Querschnitt durch ein Seeufer mit Häusern (schematisch), Stufen als waagrechte Linien
  function v9Zeichnen(d, sv) {
    const svg = $('v9'), B = breiteVon(svg.parentNode), schmal = B < 600, H = schmal ? 380 : 400, O = 30, xs = schmal ? 0.42 : 0.5, j = d.Y.jahr;
    // Höhen schematisch (nicht massstäblich): Band unten, 1a am oberen Rand des Bandes, 1b 20 cm unter der Hochwassergrenze, Stufe 2 darüber
    const hy = { bandU: H - 70, a: H - 150, b: H - 195, hw: H - 220, s2: H - 290 }, ux = v => B * xs + (v - (H - 60)) * -1.6;   // Ufer steigt nach rechts
    let s = `<text class="fett" x="0" y="14">${LL('Stufen am Seeufer (schematisch)', 'Paliers sur la rive (schématique)')}</text>`;   // FR provisorisch
    const xu = y => B * xs + (H - 60 - y) * (schmal ? 0.9 : 1.3);
    s += `<path d="M0,${H - 60} L${B * xs},${H - 60} L${xu(hy.s2 - 30)},${hy.s2 - 30} L${B},${hy.s2 - 30} L${B},${H} L0,${H}Z" fill="url(#g_stau)" stroke="#000" stroke-width="1.5"/>`;
    s += `<rect x="0" y="${hy.a}" width="${xu(hy.a)}" height="${hy.bandU - hy.a}" fill="#e6e6e6"/>`;
    // Häuser am Ufer, Erdgeschoss knapp über der Hochwassergrenze
    for (let k = 0; k < 3; k++) { const hx = xu(hy.hw) + 24 + k * (schmal ? 30 : 44); if (hx > B - 30) break; const hb = xu(hy.hw) < hx ? Math.min(hy.hw - 6, hy.s2 - 30 + (hx < xu(hy.s2 - 30) ? (hx - xu(hy.s2 - 30)) / (schmal ? 0.9 : 1.3) * -1 : 0)) : hy.hw;
      const yb = Math.min(hy.hw - 4, hy.s2 - 30 + Math.max(0, (xu(hy.s2 - 30) - hx) / (schmal ? 0.9 : 1.3)));
      s += `<path d="M${hx},${yb} v-22 l11,-11 l11,11 v22Z" fill="#fff" stroke="#000" stroke-width="1.5"/>`; }
    const linie = (y, text, sub, art) => `<line x1="0" x2="${art === 'hw' ? B : xu(y) + (art === 's2' ? 60 : 0)}" y1="${y}" y2="${y}" stroke="${art === 'hw' ? '#000' : '#003399'}" stroke-width="${art === 'hw' ? 2 : 1.5}"${art === 'hw' ? ' stroke-dasharray="6 4"' : ''}/>` +
      `<text class="fett halo" x="6" y="${y - 6}">${text}</text>${sub ? `<text class="halo" x="6" y="${y + 14}">${sub}</text>` : ''}`;
    // FR provisorisch
    s += `<text class="halo" x="6" y="${hy.bandU - 8}">${LL('heutiger Bereich (genutztes Band)', 'plage actuelle (tranche utilisée)')}</text>` +
      linie(hy.a, `1a: ${zahl(sv['1a'])} Mio. m³`, LL('heute schon vorgekommen', 'déjà observé aujourd’hui'), 'a') +
      linie(hy.b, `1b: ${zahl(sv['1b'])} Mio. m³ (1c: ${zahl(sv['1c'])})`, LL('bis knapp unter die Hochwassergrenze', 'jusque juste sous la limite de hautes eaux'), 'b') +
      linie(hy.hw, LL('Hochwassergrenze', 'limite de hautes eaux'), '', 'hw') +
      linie(hy.s2, `2: ${zahl(sv['2'])} Mio. m³ (+50 cm)`, LL('neue Reglemente und Schutzbauten', 'nouveaux règlements et ouvrages de protection'), 's2');
    const kb = schmal ? B - 6 : B * .42, kx = B - kb - 4;
    s += `<rect x="${kx}" y="${O - 6}" width="${kb}" height="${schmal ? 46 : 40}" fill="#fff" stroke="#000" stroke-width="1.5"/><text class="fett" x="${kx + 8}" y="${O + 10}">${LL(`Stufe 3: ${zahl(sv['3'])} Mio. m³`, `Palier 3 : ${zahl(sv['3'])} mio m³`)}</text><text x="${kx + 8}" y="${O + 26}">${LL('Bodensee, nicht reguliert, Verfassung TG § 76 Abs. 3', 'lac de Constance, non régulé, constitution TG § 76, al. 3')}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('v9legende').innerHTML = `<span>${LL(`Platz ${j} je Stufe auf allen regulierten Seen. Höhen schematisch, nicht massstäblich.`, `Place en ${j} par palier sur tous les lacs régulés. Hauteurs schématiques, pas à l’échelle.`)}</span>`;   // FR provisorisch
    csvKnopf($('v9fig'), () => `rhein-stufen-${j}`, () => ({ titel: LL(`Stufen ${j}`, `Paliers ${j}`), kopf: ['stufe', 'kapazitaet_Mio_m3', 'beschreibung'],
      zeilen: [['1a', sv['1a'], 'genutztes Band 1991-2020, heute schon vorgekommen'], ['1b', sv['1b'], 'bis 20 cm unter die Hochwassergrenze'], ['1c', sv['1c'], 'dazu Neuenburger- und Murtensee bis 20 cm unter Gefahrenstufe 4'], ['2', sv['2'], '50 cm ueber die Hochwassergrenze, neue Reglemente und Schutzbauten'], ['3', sv['3'], 'dazu 50 cm auf dem Bodensee, nicht reguliert, Verfassung TG § 76 Abs. 3']] }));
  }

  // ---- Kapitel 6: Was hätte es gebracht?
  const sc3 = scrolly('st3', 7, i => zeige3(i));
  const SCHRITT6 = ['1b', '1b', '1b', '1b', '2', '3', '3'], KETTE = 1;
  const z6 = (Y, st, modus) => szenario(Y, st, modus, null, Z.zielwahl);
  function zeige3(i) {
    const d = D3[jahr3]; if (!d) return;
    $('kettefig').hidden = i !== KETTE; $('szenfig').hidden = i === KETTE; if (i === KETTE) { ketteZeichnen(d); return; }
    const st = SCHRITT6[i], v = z6(d.Y, st, 'glw'), r = z6(d.Y, st, 'regel'), beide = i >= 2;
    jahrGrafik($('szen'), d.Y, { titel: `${T.gTitel} ${jahr3} · ${T['st' + st]}`, sim: v.S.q[KAUB], sim2: beide ? r.S.q[KAUB] : null, speicher: v.S.O ? v.S.O.speicher : null, hw: beide && r.S.O ? r.S.O.ueber : null });
    $('szenlegende').innerHTML = jahrLegende(true, beide, beide);
    csvKnopf($('szenfig'), () => `rhein-kaub-${jahr3}-stufe-${st}-ziel-${Z.zielwahl}`, () => ({ titel: `${T.gTitel} ${jahr3} · ${T['st' + st]} · ${ZIELNAME[Z.zielwahl]}`, ...jahrCsv(d.Y, { v, r }) }));
  }
  // Tabelle je Stufe: gemessen, mit Voraussicht, Betriebsregel, Tage mit einem See über der Hochwassergrenze (Betriebsregel · mit Voraussicht)
  function zielTafel(d, stufen) {
    const zl = Z.zielwahl, M = MASS[zl];
    return `<div class="rollen"><table class="erg"><thead><tr><th>${T.stufe}</th><th class="z">${T.gemessen}</th><th class="z">${T.eBest}</th><th class="z">${T.eRegel}</th><th class="z">${LL('Tage mit See über Hochwassergrenze', 'Jours avec un lac au-dessus de la limite')}</th></tr></thead><tbody>` +   // FR provisorisch
      stufen.map(st => { const v = z6(d.Y, st, 'glw'), r = z6(d.Y, st, 'regel'), hw = r.ueber || v.ueber;
        return `<tr><td>${st}</td><td class="z">${zielWert(zl, d.k, true)}</td><td class="z blau">${zielWert(zl, v.k)}</td><td class="z blau">${zielWert(zl, r.k)}</td><td class="z${hw ? ' hw' : ''}">${zahl(r.ueber)} · ${zahl(v.ueber)}</td></tr>`; }).join('') +
      `</tbody></table></div><p class="hinweis">${M.name}${zl === 'D' ? LL(' und ob das Ziel von höchstens 20 Tagen erreicht ist', ' et si l’objectif d’au plus 20 jours est atteint') : ''}. ${LL('Letzte Spalte: Betriebsregel · mit Voraussicht.', 'Dernière colonne : règle d’exploitation · avec prévision.')}</p>`;   // FR provisorisch
  }
  // Rechenweg an einem Tag: von den Seen über die Messstellen bis zum Pegel Kaub (Stufe 1b, mit Voraussicht, gewähltes Ziel)
  function ketteDaten(d) {
    const z = z6(d.Y, '1b', 'glw'), S = z.S, O = S.O, Y = d.Y, q = Y.q[KAUB]; if (!O) return null;
    let k = -1; q.forEach((v, i) => { if (v != null && i > 0 && O.netto[i] > .5 && (k < 0 || v < q[k])) k = i; });
    if (k < 0) return null;
    const alt = NETZ; NETZ = VOLL; const E = { ...einzug(KAUB) }; NETZ = alt;
    const seen = O.seeId.map((id, s) => ({ id, a: (O.see[s][k - 1] - O.see[s][k]) / SEK })).filter(x => x.a > .05).sort((a, b) => b.a - a.a);
    const stellen = SEEGRUPPEN.map(([, , kn]) => kn).filter(kn => seen.some(x => SEE[x.id].knoten === kn || SEE[x.id].knoten in einzug(kn)) && kn in E)
      .map(kn => { const j = k - E[kn]; return { id: kn, j, m: wert(Y.q, kn, j), s: wert(S.q, kn, j) }; }).filter(x => x.m != null);
    const jb = k - (E[BASEL] || 0), pm = pegelstand(Y, S, PK, k, false), ps = pegelstand(Y, S, PK, k, true);
    return { k, seen, stellen, basel: { j: jb, m: wert(Y.q, BASEL, jb), s: wert(S.q, BASEL, jb) }, kaub: { m: q[k], s: S.q[KAUB][k] }, pm, ps, tm: pm && zustand(pm.w, PK), ts: ps && zustand(ps.w, PK), lakeTag: k - (E['2029'] || 0) };
  }
  function ketteZeichnen(d) {
    const svg = $('kette'), K = ketteDaten(d); if (!K) { svg.innerHTML = ''; return; }
    const B = Math.max(330, Math.min(760, Math.round(document.querySelector('#sc3 .buehne').clientWidth) || 700)), bh = 58, gap = 22, viele = B < 520 ? 2 : 4, j = d.Y.jahr, dt = i => datum(isoTag(j, i));
    const boxen = [
      [`${T.kSeen}, ${dt(K.lakeTag)}`, K.seen.slice(0, viele).map(x => `${nm(SEE[x.id].name)} ${vz(x.a, 0)}`).join(' · ') + (K.seen.length > viele ? ' …' : ''), `${T.kSumme} ${vz(K.seen.reduce((a, x) => a + x.a, 0), 0)} m³/s`],
      ...K.stellen.map(x => [`${GW(ST[x.id])}–${nm(kurz(ST[x.id]))}, ${dt(x.j)}`, `${T.gemessen} ${zahl(x.m)} m³/s`, `${T.kMit} ${zahl(x.s)} m³/s`]),
      [`Rhein–${nm('Basel')}, ${dt(K.basel.j)}`, `${T.gemessen} ${zahl(K.basel.m)} m³/s`, `${T.kMit} ${zahl(K.basel.s)} m³/s`],
      [`${T.kaubQ}, ${dt(K.k)}`, `${T.gemessen} ${zahl(K.kaub.m)} m³/s`, `${T.kMit} ${zahl(K.kaub.s)} m³/s`],
      [`${T.kaubW} (${T.kKurve})`, `${T.gemessen} ${zahl(K.pm.w)} cm`, `${T.kMit} ${zahl(K.ps.w)} cm`],
      [`${T.tiefe} = ${T.kaubW} − ${zahl(GLW)} + ${zahl(TUG)}`, `${T.gemessen} ${zahl(K.tm.tiefe)} cm`, `${T.kMit} ${zahl(K.ts.tiefe)} cm`]];
    const H = 26 + boxen.length * (bh + gap);
    let s = `<text class="fett" x="0" y="14">${T.kTitelK} ${dt(K.k)}</text>`;
    boxen.forEach(([t1, t2, t3], n) => { const y0 = 26 + n * (bh + gap), letzte = n >= boxen.length - 3;
      s += `<rect x="1" y="${y0}" width="${B - 2}" height="${bh}" fill="#fff" stroke="#000" stroke-width="${letzte ? 2 : 1.5}"/>` +
        `<text class="fett" x="12" y="${y0 + 18}">${h(t1)}</text><text x="12" y="${y0 + 36}">${h(t2)}</text><text class="blau" x="12" y="${y0 + 52}">${h(t3)}</text>`;
      if (n < boxen.length - 1) s += `<line x1="${B / 2}" x2="${B / 2}" y1="${y0 + bh + 2}" y2="${y0 + bh + gap - 4}" stroke="#003399" stroke-width="2"/><path d="M${B / 2 - 5},${y0 + bh + gap - 9} L${B / 2},${y0 + bh + gap - 2} L${B / 2 + 5},${y0 + bh + gap - 9}" fill="none" stroke="#003399" stroke-width="2"/>`; });
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
  }
  // Satz zu den beiden Rechenweisen, nur aus den Zahlen (Stufe 1b, gewähltes Ziel). FR provisorisch
  function satzRechenweisen(d) {
    const zl = Z.zielwahl, v = z6(d.Y, '1b', 'glw'), r = z6(d.Y, '1b', 'regel'), k = d.k, j = d.Y.jahr, t = tiefsterTag(d.Y), leer = r.S.O && t ? r.S.O.speicher[t.i] < 1e5 : false, s = [];
    if (!k.u0) return LL(`${j} lag Kaub an keinem Tag unter dem GlW.`, `En ${j}, Kaub n’est passé sous le GlW aucun jour.`);
    if (zl === 'A') {
      if (v.k.t1 > k.t0 + .5) s.push(LL(`In Stufe 1b steigt mit Voraussicht die kleinste Fahrrinnentiefe von ${zahl(k.t0)} auf ${zahl(v.k.t1)} cm${v.k.u1 === k.u0 ? `, die Zahl der Tage unter dem GlW bleibt aber bei ${k.u0}, weil das Wasser auf alle tiefen Tage verteilt wird` : ''}.`,
        `Au palier 1b, avec prévision, la profondeur minimale passe de ${zahl(k.t0)} à ${zahl(v.k.t1)} cm${v.k.u1 === k.u0 ? `, mais le nombre de jours sous le GlW reste de ${k.u0}, car l’eau est répartie sur tous les jours bas` : ''}.`));
      if (r.k.u1 < k.u0) s.push(LL(`Die Betriebsregel senkt die Zahl der Tage unter dem GlW auf ${r.k.u1}${leer ? `; am tiefsten Tag ist der Speicher leer, die kleinste Fahrrinnentiefe bleibt bei ${zahl(r.k.t1)} cm` : `, die kleinste Fahrrinnentiefe liegt bei ${zahl(r.k.t1)} cm`}.`,
        `La règle d’exploitation réduit le nombre de jours sous le GlW à ${r.k.u1}${leer ? ` ; le jour le plus bas, le réservoir est vide et la profondeur minimale reste de ${zahl(r.k.t1)} cm` : `, la profondeur minimale est de ${zahl(r.k.t1)} cm`}.`));
    } else if (zl === 'B') {
      s.push(LL(`In Stufe 1b bleiben mit Voraussicht ${v.k.k1}, mit der Betriebsregel ${r.k.k1} von ${k.k0} Tagen unter 40 cm.`, `Au palier 1b, il reste avec prévision ${v.k.k1}, avec la règle d’exploitation ${r.k.k1} des ${k.k0} jours sous 40 cm.`));
      if (k.k0 && v.k.k1 > r.k.k1) s.push(LL('Mit Voraussicht hebt die Rechnung alle Tage unter 40 cm auf einen gemeinsamen Stand. Reicht der Speicher nicht bis 40 cm, bleiben alle diese Tage darunter.', 'Avec prévision, le calcul relève tous les jours sous 40 cm à un niveau commun. Si le réservoir ne suffit pas pour atteindre 40 cm, tous ces jours restent en dessous.'));
    } else {
      s.push(LL(`In Stufe 1b bleiben mit Voraussicht ${v.k.u1}, mit der Betriebsregel ${r.k.u1} von ${k.u0} Tagen unter dem GlW.`, `Au palier 1b, il reste avec prévision ${v.k.u1}, avec la règle d’exploitation ${r.k.u1} des ${k.u0} jours sous le GlW.`));
      if (zl === 'D') s.push(LL(`Höchstens 20 Tage: mit Voraussicht ${v.k.u1 <= 20 ? 'erreicht' : 'nicht erreicht'}, mit der Betriebsregel ${r.k.u1 <= 20 ? 'erreicht' : 'nicht erreicht'}.`, `Au plus 20 jours : avec prévision ${v.k.u1 <= 20 ? 'atteint' : 'non atteint'}, avec la règle d’exploitation ${r.k.u1 <= 20 ? 'atteint' : 'non atteint'}.`));
    }
    return s.join(' ');
  }
  function kapitel6() {
    const j = jahr3, d = D3[j]; if (!d) return;
    zielKnoepfe($('k6ziel'));
    const f3 = (i, html) => sc3.fuelle(i, `<p class="jahrmarke">${T.jahr} ${j} · ${h(ZIELNAME[Z.zielwahl])}</p>` + html);
    const zl = Z.zielwahl, b1 = z6(d.Y, '1b', 'glw'), qm = Math.min(...d.Y.q[KAUB].filter(x => x != null)), qs = Math.min(...b1.S.q[KAUB].filter(x => x != null));
    // FR provisorisch
    const wirkung = zl === 'A' ? LL(`Der kleinste Tagesabfluss in Kaub steigt von ${zahl(qm)} auf <b>${zahl(qs)} m³/s</b>, die kleinste Fahrrinnentiefe von ${zahl(d.k.t0)} auf <b>${zahl(b1.k.t1)} cm</b>.`, `Le plus faible débit journalier à Kaub passe de ${zahl(qm)} à <b>${zahl(qs)} m³/s</b>, la profondeur minimale du chenal de ${zahl(d.k.t0)} à <b>${zahl(b1.k.t1)} cm</b>.`)
      : zl === 'B' ? LL(`Die Tage unter 40 cm gehen von ${d.k.k0} auf <b>${b1.k.k1}</b> zurück.`, `Les jours sous 40 cm passent de ${d.k.k0} à <b>${b1.k.k1}</b>.`)
        : LL(`Die Tage unter dem GlW gehen von ${d.k.u0} auf <b>${b1.k.u1}</b> zurück.`, `Les jours sous le GlW passent de ${d.k.u0} à <b>${b1.k.u1}</b>.`);
    f3(0, LL(`<h3>Wie der Rückhalt wirkt</h3><p>Ab hier zeigt die Grafik eine zweite, gerechnete Linie. Die Seen halten Wasser zurück, solange Kaub genug führt, und geben es ab, wenn Kaub zu tief fällt. Zurückgehalten wird aus dem Abfluss, der unterhalb der Seen gemessen wurde. Die Wirkung erreicht Basel am selben Tag und Kaub zwei Tage später; die Rechnung verschiebt das Wasser ohne Abflachung der Welle.</p><p>Die blaue Linie ist der Abfluss in Kaub mit Rückhalt in Stufe 1b, die blau schraffierte Fläche die Anhebung. Unten steht, wie viel Wasser in den Seen gespeichert ist.</p><p>${j}${DP}Gespeichert werden höchstens <b>${zahl(b1.genutzt)} Mio. m³</b>. ${wirkung}</p>`,
      `<h3>Comment agit la retenue</h3><p>Dès ici, le graphique montre une deuxième ligne, calculée. Les lacs retiennent de l’eau tant que Kaub en porte assez et la restituent quand Kaub descend trop bas. La retenue est prélevée sur le débit mesuré en aval des lacs. L’effet atteint Bâle le jour même et Kaub deux jours plus tard ; le calcul déplace l’eau sans atténuation de l’onde.</p><p>La ligne bleue est le débit à Kaub avec retenue au palier 1b, la surface hachurée en bleu le relèvement. En bas figure le volume stocké dans les lacs.</p><p>${j}${DP}le volume stocké atteint au plus <b>${zahl(b1.genutzt)} mio m³</b>. ${wirkung}</p>`));
    const K = ketteDaten(d);
    // FR provisorisch (Rechenweise ergänzt)
    if (K) f3(1, LL(`<h3>Rechenweg an einem Tag</h3><p>Die Grafik rechnet den tiefsten Tag ${j} mit Rückhalt durch, von den Seen bis zum Pegel Kaub, mit Voraussicht in Stufe 1b. Ausgangspunkt sind gemessene Werte: Seestände und Abflüsse des BAFU, Abfluss und Pegel Kaub der WSV.</p><p>Die Seen geben zusammen <b>${vz(K.seen.reduce((a, x) => a + x.a, 0), 0)} m³/s</b> ab. Um so viel steigt der gemessene Abfluss unterhalb der Seen. Zwei Tage später kommt das Wasser in Kaub an: ${zahl(K.kaub.m)} → <b>${zahl(K.kaub.s)} m³/s</b>.</p><p>Den Pegel liefert die Abflusskurve von Kaub, die Beziehung zwischen Wasserstand und Abfluss aus den Wertepaaren des Jahrbuchs. Sie gibt für ${zahl(K.kaub.m)} m³/s ${zahl(kurve(KURVE, K.kaub.m, 0, 1))} cm und für ${zahl(K.kaub.s)} m³/s ${zahl(kurve(KURVE, K.kaub.s, 0, 1))} cm. Der gemessene Pegel ${zahl(K.pm.w)} cm steigt um diese Differenz auf <b>${zahl(K.ps.w)} cm</b>. Die Fahrrinnentiefe steigt von ${zahl(K.tm.tiefe)} auf <b>${zahl(K.ts.tiefe)} cm</b>.</p>`,
      `<h3>Le calcul d’une journée</h3><p>Le graphique calcule le jour le plus bas de ${j} avec retenue, des lacs jusqu’à l’échelle de Kaub, avec prévision au palier 1b. Le point de départ sont des valeurs mesurées : niveaux des lacs et débits de l’OFEV, débit et niveau de Kaub de la WSV.</p><p>Les lacs restituent ensemble <b>${vz(K.seen.reduce((a, x) => a + x.a, 0), 0)} m³/s</b>. Le débit mesuré en aval des lacs augmente d’autant. Deux jours plus tard, l’eau arrive à Kaub : ${zahl(K.kaub.m)} → <b>${zahl(K.kaub.s)} m³/s</b>.</p><p>Le niveau découle de la courbe de tarage de Kaub, la relation entre niveau et débit tirée des couples de l’annuaire. Elle donne ${zahl(kurve(KURVE, K.kaub.m, 0, 1))} cm pour ${zahl(K.kaub.m)} m³/s et ${zahl(kurve(KURVE, K.kaub.s, 0, 1))} cm pour ${zahl(K.kaub.s)} m³/s. Le niveau mesuré de ${zahl(K.pm.w)} cm augmente de cette différence pour atteindre <b>${zahl(K.ps.w)} cm</b>. La profondeur du chenal passe de ${zahl(K.tm.tiefe)} à <b>${zahl(K.ts.tiefe)} cm</b>.</p>`));
    else f3(1, LL(`<h3>Rechenweg an einem Tag</h3><p>${j} gibt es keinen Tag, an dem die Seen Wasser abgeben.</p>`, `<h3>Le calcul d’une journée</h3><p>En ${j}, il n’y a aucun jour où les lacs restituent de l’eau.</p>`));
    const schwelle = zl === 'B' ? LL('40 cm', '40 cm') : LL('den GlW', 'le GlW');
    // FR provisorisch
    f3(2, LL(`<h3>Zwei Rechenweisen</h3><p>Niemand weiss im Frühling, wie trocken der Herbst wird. Die Seite rechnet deshalb zweimal.</p><p><b>Mit Voraussicht</b> kennt die Rechnung das ganze Jahr im Voraus und rechnet so, wie es für das gewählte Ziel am besten wäre. Im Betrieb kennt das niemand.</p><p><b>Betriebsregel:</b> Die Rechnung kennt nur den heutigen Abfluss und den Inhalt der Seen. Von ${MONATE[REGEL_STD.von - 1]} bis ${MONATE[REGEL_STD.bis - 1]} wird gestaut, wenn Kaub mehr als ${zahl(REGEL_STD.stauAb)} m³/s führt. Fällt Kaub unter ${schwelle}, wird abgegeben, höchstens so viel, dass ein voller Speicher ${REGEL_STD.tage} Tage reicht. Ab 1. November wird der Rest abgegeben, damit die Seen im Winter Platz für Hochwasser haben.</p><p>${satzRechenweisen(d)}</p><p>Schwarze Balken oben markieren Tage, an denen ein See über seiner Hochwassergrenze stünde.</p>`,
      `<h3>Deux modes de calcul</h3><p>Personne ne sait au printemps à quel point l’automne sera sec. La page calcule donc deux fois.</p><p><b>Avec prévision</b>, le calcul connaît toute l’année à l’avance et calcule comme ce serait le mieux pour l’objectif choisi. En exploitation, personne ne le sait.</p><p><b>Règle d’exploitation :</b> le calcul ne connaît que le débit du jour et le contenu des lacs. D’${MONATE[REGEL_STD.von - 1]} à ${MONATE[REGEL_STD.bis - 1]}, on retient quand Kaub dépasse ${zahl(REGEL_STD.stauAb)} m³/s. Si Kaub passe sous ${schwelle}, on restitue, au plus autant qu’un réservoir plein dure ${REGEL_STD.tage} jours. Dès le 1er novembre, le reste est restitué pour que les lacs gardent de la place pour les crues en hiver.</p><p>${satzRechenweisen(d)}</p><p>Des barres noires en haut marquent les jours où un lac serait au-dessus de sa limite de hautes eaux.</p>`));
    // FR provisorisch
    f3(3, LL(`<h3>Stufe 1: ohne neue Grenzen</h3><p>Stufe 1a im genutzten Band, 1b bis 20 cm unter die Hochwassergrenze, 1c dazu Neuenburger- und Murtensee bis 20 cm unter die Gefahrenstufe 4 (Kapitel 5). Die Grafik zeigt Stufe 1b.</p>`, `<h3>Palier 1 : sans nouvelles limites</h3><p>Palier 1a dans la tranche utilisée, 1b jusqu’à 20 cm sous la limite de hautes eaux, 1c en plus les lacs de Neuchâtel et de Morat jusqu’à 20 cm sous le degré de danger 4 (chapitre 5). Le graphique montre le palier 1b.</p>`) + zielTafel(d, ['1a', '1b', '1c']));
    f3(4, LL(`<h3>Stufe 2: über der Hochwassergrenze</h3><p>Stufe 2: 50 cm über die heutige Hochwassergrenze, mit neuen Reglementen und Schutzbauten (Kapitel 5). Die Grafik zeigt diese Stufe.</p>`, `<h3>Palier 2 : au-dessus de la limite de hautes eaux</h3><p>Palier 2 : 50 cm au-dessus de la limite actuelle, avec de nouveaux règlements et des ouvrages de protection (chapitre 5). Le graphique montre ce palier.</p>`) + zielTafel(d, ['2']));
    f3(5, LL(`<h3>Stufe 3: mit dem Bodensee</h3><p>Stufe 3: dazu 50 cm auf dem Bodensee (Kapitel 5). Die Grafik zeigt diese Stufe.</p>`, `<h3>Palier 3 : avec le lac de Constance</h3><p>Palier 3 : en plus, 50 cm sur le lac de Constance (chapitre 5). Le graphique montre ce palier.</p>`) + zielTafel(d, ['3']) +
      LL(`<p class="hinweis">Zum Vergleich: Das Regulierreglement für den Bodensee von 1973 rechnete mit 90 m³/s Zuschuss von Oktober bis Dezember, 15 cm mehr Fahrwassertiefe und 8 % mehr Ladung (IGKB, 2024). Die Abflusskurve dieser Seite ergibt für 90 m³/s beim GlW ${zahl(hubKaub(90))} cm.</p>`,
        `<p class="hinweis">À titre de comparaison : le règlement de régulation du lac de Constance de 1973 prévoyait un apport de 90 m³/s d’octobre à décembre, 15 cm de profondeur en plus et 8 % de chargement en plus (IGKB, 2024). La courbe de tarage de cette page donne ${zahl(hubKaub(90))} cm pour 90 m³/s au GlW.</p>`));
    f3(6, LL(`<h3>Das Ziel je Stufe</h3><p>Die Tabelle zeigt für ${j} und das gewählte Ziel, was jede Stufe erreicht, mit beiden Rechenweisen und den Tagen, an denen ein See über seiner Hochwassergrenze stünde.</p>`, `<h3>L’objectif par palier</h3><p>Le tableau montre pour ${j} et l’objectif choisi ce que chaque palier atteint, avec les deux modes de calcul et les jours où un lac serait au-dessus de sa limite de hautes eaux.</p>`) + zielTafel(d, STUFEN));   // FR provisorisch
    zeige3(sc3.jetzt()); typoFr($('k6')); stapeln($('k6'));
  }
  // Jahresliste für das gewählte Ziel, V10 und Jahresgrafik. Rechnet im Hintergrund, Jahr für Jahr.
  let jvNr = 0, JV = null, v10modus = 'regel';
  async function jahresvergleich() {
    const el = $('jahre'), nr = ++jvNr, zl = Z.zielwahl, M = MASS[zl];
    if (!PK) return;
    if (!el.innerHTML) el.innerHTML = `<h2>${T.jTitel}</h2><p class="hinweis">${T.jRechnet}</p>`;
    const zeilen = [];
    for (const j of meta.jahre.filter(j => j >= 2008)) {
      const Y = await jahr(j); await nachbarn(j); if (nr !== jvNr) return; if (!Y || !Y.q[KAUB]) continue;
      const k = kaubJahr(Y, OHNE); if (!k.tage) continue;
      const st = STUFEN.map(s => k.u0 ? { r: szenario(Y, s, 'regel', null, zl), v: szenario(Y, s, 'glw', null, zl) } : null);
      const ri = st.findIndex(x => x && ZIELERREICHT[zl](x.r.k)), reicht = !ZIELNOETIG[zl](k) ? 0 : ri >= 0 ? STUFEN[ri] : null;
      zeilen.push({ j, Y, k, bedarf: bedarfGlw(Y), st, reicht });
      await new Promise(r => setTimeout(r, 0)); if (nr !== jvNr) return;
    }
    JV = { zl, zeilen };
    // FR provisorisch
    el.innerHTML = `<h2>${T.jTitel}</h2><p class="hinweis">${LL(`Ziel «${ZIELNAME[zl]}». Für jedes Jahr: was in Kaub gemessen wurde, wie viel Wasser bis zum GlW an allen Tagen gefehlt hat (Fehlmenge), und was die Stufen ergeben (${M.name}: Betriebsregel · mit Voraussicht). Eine umrandete Zahl dahinter nennt die Tage, an denen ein See mit der Betriebsregel über seiner Hochwassergrenze stünde.`, `Objectif « ${ZIELNAME[zl]} ». Pour chaque année : ce qui a été mesuré à Kaub, combien d’eau il manquait pour tenir le GlW tous les jours, et ce que donnent les paliers (${M.name} : règle d’exploitation · avec prévision). Un nombre encadré indique les jours où un lac serait au-dessus de sa limite de hautes eaux avec la règle d’exploitation.`)}</p>` +
      `<div class="rollen"><table><thead><tr><th>${T.jJahr}</th><th class="z">${T.nUnter}</th><th class="z">${T.aTage}</th><th class="z">${T.nTief}</th><th class="z">${LL('Fehlmenge Mio. m³', 'Manque mio m³')}</th>${STUFEN.map(s => `<th class="z">${T.stufe} ${s}</th>`).join('')}<th>${LL('Ziel erreicht ab (Betriebsregel)', 'Objectif atteint dès (règle)')}</th></tr></thead><tbody>` +
      zeilen.map(z => `<tr><td>${z.j}</td><td class="z">${z.k.u0}</td><td class="z">${z.k.k0}</td><td class="z">${zahl(z.k.t0)}</td><td class="z">${z.k.u0 ? zahl(z.bedarf) : '–'}</td>` +
        z.st.map(x => `<td class="z blau">${x ? `${zahl(M.sim(x.r.k))} · ${zahl(M.sim(x.v.k))}${x.r.ueber ? ` <span class="hw">${x.r.ueber}</span>` : ''}` : '–'}</td>`).join('') + `<td>${z.reicht === 0 ? T.unnoetig : z.reicht ? `${T.stufe} ${z.reicht}` : T.jNie}</td></tr>`).join('') + '</tbody></table></div>';
    csvKnopfLang(el, () => 'rhein-kaub-jahre-alle-ziele', jahreCsv);
    jahreGrafik(zeilen, zl); v10Zeichnen(); typoFr(el); stapeln(el);
  }
  // CSV der Jahresliste mit Spalten je Ziel: rechnet die fehlenden Ziele, bevor es herunterlädt
  async function jahreCsv(fortschritt) {
    const kopf = ['jahr', 'tage_mit_wert', 'tage_unter_GlW', 'tage_unter_40cm', 'kleinste_fahrrinnentiefe_cm', 'fehlmenge_Mio_m3'];
    for (const zl of ZIELE) for (const s of STUFEN) kopf.push(`${zl}_stufe${s}_betriebsregel_${MASS[zl].kurz}`, `${zl}_stufe${s}_voraussicht_${MASS[zl].kurz}`, `${zl}_stufe${s}_see_ueber_hw_betriebsregel`, `${zl}_stufe${s}_see_ueber_hw_voraussicht`);
    for (const zl of ZIELE) kopf.push(`${zl}_erreicht_ab_stufe_betriebsregel`);
    const zeilen = [];
    for (const j of meta.jahre.filter(j => j >= 2008)) {
      const Y = await jahr(j); await nachbarn(j); if (!Y || !Y.q[KAUB]) continue; const k = kaubJahr(Y, OHNE); if (!k.tage) continue;
      fortschritt(j); const z = [j, k.tage, k.u0, k.k0, k.t0, bedarfGlw(Y)], ab = [];
      for (const zl of ZIELE) { let a = !ZIELNOETIG[zl](k) ? 'nicht noetig' : 'keine';
        for (const s of STUFEN) { if (!k.u0) { z.push(MASS[zl].gem(k), MASS[zl].gem(k), 0, 0); continue; }
          const r = szenario(Y, s, 'regel', null, zl), v = szenario(Y, s, 'glw', null, zl); z.push(MASS[zl].sim(r.k), MASS[zl].sim(v.k), r.ueber, v.ueber); if (a === 'keine' && ZIELERREICHT[zl](r.k)) a = s; }
        ab.push(a); }
      zeilen.push(z.concat(ab)); await new Promise(r => setTimeout(r, 0));
    }
    return { titel: LL('Jahresliste Kaub, alle Ziele', 'Liste annuelle Kaub, tous les objectifs'), kopf, zeilen };
  }
  function csvKnopfLang(el, name, fn) {
    let b = el.querySelector(':scope > .herunter');
    if (!b) { b = document.createElement('p'); b.className = 'herunter'; b.innerHTML = `<button type="button" class="textknopf">${T.csv}</button>`; el.append(b); }
    const k = b.firstChild; k.onclick = async () => { if (k.disabled) return; k.disabled = true;
      try { const d = await fn(j => { k.textContent = `${T.jRechnet} ${j}`; });
        herunter(`${name()}.csv`, [`# ${T.titel.replace(' · ', ' – ')}: ${d.titel}`, `# ${T.csvQuelle}`], [d.kopf.join(';'), ...d.zeilen.map(z => z.map(v => v == null ? '' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : v).join(';'))]); }
      finally { k.disabled = false; k.textContent = T.csv; } };
  }
  // Jahresgrafik: Ergebniszahl des gewählten Ziels je Jahr, gemessen (schwarz) und Stufen 1a bis 3 (Betriebsregel)
  function jahreGrafik(zeilen, zl) {
    const svg = $('jahregrafik'), M = MASS[zl], B = BREITE(), H = 300, L = 62, RR = 14, O = 34, U = 36, bw = (B - L - RR) / zeilen.length;
    const wert = (z, k) => k ? (z.st[k - 1] ? M.sim(z.st[k - 1].r.k) : M.gem(z.k)) : M.gem(z.k);
    const alle = zeilen.flatMap(z => [0, 1, 2, 3, 4, 5].map(k => wert(z, k))), max = zl === 'A' ? Math.min(420, Math.max(PK.tugl, ...alle) + 20) : Math.max(25, ...alle) * 1.08;
    const y = v => O + (H - O - U) * (1 - Math.min(v, max) / max), FL = ['#000', '#fff', 'url(#s_e1)', 'url(#s_e1)', 'url(#s_e2)', '#003399'], st = zl === 'A' ? 50 : max > 100 ? 50 : 20;
    let s = `<text class="fett" x="${L}" y="14">${M.name} ${LL('in Kaub je Jahr: gemessen (schwarz) und Stufen 1a, 1b, 1c, 2, 3 mit der Betriebsregel', 'à Kaub par année : mesuré (noir) et paliers 1a, 1b, 1c, 2, 3 avec la règle d’exploitation')}</text>`;   // FR provisorisch
    for (let v = 0; v <= max; v += st) s += (v ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    zeilen.forEach((z, i) => { const x0 = L + i * bw, b = Math.min(6, bw * .13);
      [0, 1, 2, 3, 4, 5].forEach(k => { const v = wert(z, k); s += `<rect x="${(x0 + bw / 2 + (k - 3) * (b + 1)).toFixed(1)}" y="${y(v)}" width="${b}" height="${y(0) - y(v)}" fill="${FL[k]}"${k ? ' stroke="#003399" stroke-width="1"' : ''}><title>${z.j} ${k ? `${T.stufe} ${STUFEN[k - 1]}` : T.gemessen}${DP}${zahl(v)}</title></rect>`; });
      s += `<text x="${x0 + bw / 2}" y="${H - U + 18}" text-anchor="middle">${String(z.j).slice(2)}</text>`; });
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/>` + (zl === 'A' ? `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(PK.tugl)}" y2="${y(PK.tugl)}"/><text class="fett" x="${B - RR - 4}" y="${y(PK.tugl) - 6}" text-anchor="end">${T.lSoll} ${zahl(PK.tugl)}</text>` : zl === 'D' ? `<line class="soll" x1="${L}" x2="${B - RR}" y1="${y(20)}" y2="${y(20)}"/><text class="fett" x="${B - RR - 4}" y="${y(20) - 6}" text-anchor="end">20 ${T.tageW}</text>` : '');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    csvKnopf($('jahrefig'), () => `rhein-kaub-jahre-ziel-${zl}`, () => ({ titel: `${M.name}, ${ZIELNAME[zl]}`, kopf: ['jahr', `gemessen_${M.kurz}`, ...STUFEN.map(k => `stufe${k}_betriebsregel_${M.kurz}`)], zeilen: zeilen.map(z => [z.j, ...[0, 1, 2, 3, 4, 5].map(k => wert(z, k))]) }));
  }
  // V10: Hantel je Jahr mit Tagen unter dem GlW: gemessen, Stufe 1b, Stufe 3; rechts die Tage mit einem See über der Hochwassergrenze
  function v10Zeichnen() {
    if (!JV) return;
    const svg = $('v10'), zl = JV.zl, M = MASS[zl], zeilen = JV.zeilen.filter(z => z.k.u0 > 0), mo = v10modus, B = breiteVon(svg.parentNode), schmal = B < 600, zh = 26, O = 46, L = 44, RH = schmal ? 70 : 110, H = O + zeilen.length * zh + 30;
    const wahl = $('v10wahl'); wahl.textContent = ''; wahl.append(knoepfe(LL('Rechenweise', 'Mode de calcul'), [['regel', T.eRegel], ['glw', T.eBest]], mo, v => { v10modus = v; v10Zeichnen(); }));   // FR provisorisch
    const wert = (z, i) => i === 0 ? M.gem(z.k) : M.sim(z.st[i === 1 ? 1 : 4][mo === 'regel' ? 'r' : 'v'].k), hw = (z, i) => z.st[i][mo === 'regel' ? 'r' : 'v'].ueber;
    const alle = zeilen.flatMap(z => [0, 1, 2].map(i => wert(z, i))), max = zl === 'A' ? Math.max(PK.tugl, ...alle) + 10 : Math.max(20, ...alle) * 1.05, min = zl === 'A' ? Math.min(0, ...alle) : 0, xe = B - RH;
    const x = v => L + (xe - L - 10) * (v - min) / (max - min);
    let s = `<text class="fett" x="0" y="14">${M.name}${LL(': gemessen, Stufe 1b und Stufe 3', ' : mesuré, palier 1b et palier 3')} (${mo === 'regel' ? T.eRegel : T.eBest})</text>`;   // FR provisorisch
    const st = zl === 'A' ? 50 : max > 100 ? 25 : 10;
    for (let v = Math.ceil(min / st) * st; v <= max; v += st) s += `<line class="gitter" x1="${x(v)}" x2="${x(v)}" y1="${O - 8}" y2="${H - 24}"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle">${zahl(v)}</text>`;
    if (zl === 'A') s += `<line class="soll" x1="${x(PK.tugl)}" x2="${x(PK.tugl)}" y1="${O - 14}" y2="${H - 24}"/><text class="nb" x="${x(PK.tugl)}" y="${O - 18}" text-anchor="middle">${zahl(PK.tugl)} cm</text>`;
    if (zl === 'D') s += `<line class="soll" x1="${x(20)}" x2="${x(20)}" y1="${O - 14}" y2="${H - 24}"/><text class="nb" x="${x(20)}" y="${O - 18}" text-anchor="middle">20</text>`;
    s += `<text class="nb" x="${xe + RH / 2}" y="${O - 18}" text-anchor="middle">${LL('See über HW-Grenze', 'lac > limite')}</text><text class="nb" x="${xe + RH / 2}" y="${O - 6}" text-anchor="middle">1b · 3</text>`;   // FR provisorisch
    zeilen.forEach((z, k) => { const yy = O + k * zh + zh / 2, w = [0, 1, 2].map(i => wert(z, i));
      s += `<text x="${L - 8}" y="${yy + 4}" text-anchor="end">${z.j}</text><line x1="${x(Math.min(...w))}" x2="${x(Math.max(...w))}" y1="${yy}" y2="${yy}" stroke="#a8a8a8" stroke-width="3"/>` +
        `<circle cx="${x(w[0])}" cy="${yy}" r="5" fill="#000"><title>${z.j} ${T.gemessen}: ${zahl(w[0])}</title></circle><circle cx="${x(w[1])}" cy="${yy}" r="5" fill="#fff" stroke="#003399" stroke-width="2"><title>${z.j} 1b: ${zahl(w[1])}</title></circle><circle cx="${x(w[2])}" cy="${yy}" r="5" fill="#003399"><title>${z.j} 3: ${zahl(w[2])}</title></circle>` +
        `<text x="${xe + RH / 2}" y="${yy + 4}" text-anchor="middle"${hw(z, 1) || hw(z, 4) ? ' class="fett"' : ''}>${zahl(hw(z, 1))} · ${zahl(hw(z, 4))}</text>`; });
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('v10legende').innerHTML = `<span><svg width="14" height="12" aria-hidden="true"><circle cx="7" cy="6" r="5" fill="#000"/></svg>${T.gemessen}</span><span><svg width="14" height="12" aria-hidden="true"><circle cx="7" cy="6" r="4.5" fill="#fff" stroke="#003399" stroke-width="2"/></svg>${T.stufe} 1b</span><span><svg width="14" height="12" aria-hidden="true"><circle cx="7" cy="6" r="5" fill="#003399"/></svg>${T.stufe} 3</span><span>${h(ZIELNAME[zl])}</span>`;
    csvKnopf($('v10fig'), () => `rhein-wirkung-je-jahr-ziel-${zl}-${mo}`, () => ({ titel: `${M.name}, ${ZIELNAME[zl]}, ${mo === 'regel' ? 'Betriebsregel' : 'mit Voraussicht'}`, kopf: ['jahr', `gemessen_${M.kurz}`, `stufe1b_${M.kurz}`, `stufe3_${M.kurz}`, 'stufe1b_tage_see_ueber_hw', 'stufe3_tage_see_ueber_hw'],
      zeilen: zeilen.map(z => [z.j, wert(z, 0), wert(z, 1), wert(z, 2), hw(z, 1), hw(z, 4)]) }));
  }

  // ---- Kapitel 7: Was die Rechnung zeigt (ohne Wertung)
  let k7Nr = 0;
  async function kapitel7() {
    const el = $('k7inhalt'), nr = ++k7Nr; el.innerHTML = `<p class="hinweis">${T.jRechnet}</p>`;
    const zeilen = [];
    for (const j of meta.jahre.filter(j => j >= 2008)) {
      const Y = await jahr(j); await nachbarn(j); if (nr !== k7Nr) return; if (!Y || !Y.q[KAUB]) continue;
      const k = kaubJahr(Y, OHNE); if (!k.u0) continue;
      const e = {}; for (const zl of ['A', 'B', 'C']) for (const s of ['1b', '3']) e[zl + s] = { r: szenario(Y, s, 'regel', null, zl), v: szenario(Y, s, 'glw', null, zl) };
      zeilen.push({ j, k, e }); await new Promise(r => setTimeout(r, 0)); if (nr !== k7Nr) return;
    }
    if (!zeilen.length) { el.innerHTML = ''; return; }
    const zelle = (zl, z, s) => `${zahl(MASS[zl].sim(z.e[zl + s].r.k))} · ${zahl(MASS[zl].sim(z.e[zl + s].v.k))}`;
    // FR provisorisch
    let html = `<div class="rollen"><table><thead><tr><th rowspan="2">${T.jJahr}</th><th colspan="3">A: ${h(MASS.A.name)}, cm</th><th colspan="3">B: ${h(MASS.B.name)}</th><th colspan="3">C: ${h(MASS.C.name)}</th><th colspan="2">${LL('See über HW-Grenze', 'Lac au-dessus de la limite')}</th></tr>` +
      `<tr><th class="z">${T.gemessen}</th><th class="z">1b</th><th class="z">3</th><th class="z">${T.gemessen}</th><th class="z">1b</th><th class="z">3</th><th class="z">${T.gemessen}</th><th class="z">1b</th><th class="z">3</th><th class="z">1b</th><th class="z">3</th></tr></thead><tbody>` +
      zeilen.map(z => `<tr><td>${z.j}</td><td class="z">${zahl(z.k.t0)}</td><td class="z blau">${zelle('A', z, '1b')}</td><td class="z blau">${zelle('A', z, '3')}</td><td class="z">${z.k.k0}</td><td class="z blau">${zelle('B', z, '1b')}</td><td class="z blau">${zelle('B', z, '3')}</td><td class="z">${z.k.u0}</td><td class="z blau">${zelle('C', z, '1b')}</td><td class="z blau">${zelle('C', z, '3')}</td><td class="z">${z.e.C1b.r.ueber} · ${z.e.C1b.v.ueber}</td><td class="z">${z.e.C3.r.ueber} · ${z.e.C3.v.ueber}</td></tr>`).join('') +
      `</tbody></table></div><p class="hinweis">${LL('Jede Zelle: Betriebsregel · mit Voraussicht. Stufe 1b bis 20 cm unter die Hochwassergrenze, Stufe 3 mit 50 cm über der Grenze und 50 cm auf dem Bodensee.', 'Chaque cellule : règle d’exploitation · avec prévision. Palier 1b jusqu’à 20 cm sous la limite de hautes eaux, palier 3 avec 50 cm au-dessus de la limite et 50 cm sur le lac de Constance.')}</p>`;
    const zx = zeilen.slice().sort((a, b) => b.k.u0 - a.k.u0)[0], zy = zeilen.slice().sort((a, b) => a.k.t0 - b.k.t0)[0], zz = zeilen.slice().sort((a, b) => b.e.C3.r.ueber - a.e.C3.r.ueber)[0], s = [];
    s.push(LL(`In ${zx.j} wären mit Stufe 1b und Betriebsregel von ${zx.k.u0} Tagen unter dem GlW noch ${zx.e.C1b.r.k.u1} geblieben.`, `En ${zx.j}, avec le palier 1b et la règle d’exploitation, il serait resté ${zx.e.C1b.r.k.u1} des ${zx.k.u0} jours sous le GlW.`));
    if (zy.e.A1b.v.k.t1 > zy.k.t0 + .5) s.push(LL(`Mit Voraussicht und Stufe 1b wäre der tiefste Stand ${zy.j} von ${zahl(zy.k.t0)} auf ${zahl(zy.e.A1b.v.k.t1)} cm Fahrrinnentiefe gestiegen.`, `Avec prévision et le palier 1b, le niveau le plus bas de ${zy.j} serait passé de ${zahl(zy.k.t0)} à ${zahl(zy.e.A1b.v.k.t1)} cm de profondeur du chenal.`));
    if (zz.e.C3.r.ueber > 0) s.push(LL(`Mit Stufe 3 und Betriebsregel hätte ${zz.j} an ${zz.e.C3.r.ueber} Tagen mindestens ein See über seiner heutigen Hochwassergrenze gestanden.`, `Avec le palier 3 et la règle d’exploitation, au moins un lac aurait été au-dessus de sa limite actuelle de hautes eaux pendant ${zz.e.C3.r.ueber} jours en ${zz.j}.`));
    s.push(LL('Die Rechnung berücksichtigt weder Reglemente noch Ökologie. Sie zeigt, was die Wassermengen zulassen.', 'Le calcul ne tient compte ni des règlements ni de l’écologie. Il montre ce que les quantités d’eau permettent.'));
    html += `<div class="k7saetze">${s.map(x => `<p>${x}</p>`).join('')}</div>`;
    el.innerHTML = html;
    csvKnopf(el, () => 'rhein-was-die-rechnung-zeigt', () => ({ titel: LL('Was die Rechnung zeigt', 'Ce que montre le calcul'), kopf: ['jahr', 'A_gemessen_t_min_cm', 'A_1b_regel', 'A_1b_voraussicht', 'A_3_regel', 'A_3_voraussicht', 'B_gemessen_tage_unter_40cm', 'B_1b_regel', 'B_1b_voraussicht', 'B_3_regel', 'B_3_voraussicht', 'C_gemessen_tage_unter_GlW', 'C_1b_regel', 'C_1b_voraussicht', 'C_3_regel', 'C_3_voraussicht', 'hw_1b_regel', 'hw_1b_voraussicht', 'hw_3_regel', 'hw_3_voraussicht'],
      zeilen: zeilen.map(z => [z.j, z.k.t0, ...['1b', '3'].flatMap(s => [z.e['A' + s].r.k.t1, z.e['A' + s].v.k.t1]), z.k.k0, ...['1b', '3'].flatMap(s => [z.e['B' + s].r.k.k1, z.e['B' + s].v.k.k1]), z.k.u0, ...['1b', '3'].flatMap(s => [z.e['C' + s].r.k.u1, z.e['C' + s].v.k.u1]), z.e.C1b.r.ueber, z.e.C1b.v.ueber, z.e.C3.r.ueber, z.e.C3.v.ueber]) }));
    typoFr(el); stapeln(el);
  }
  let breite = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - breite) < 40) return; breite = innerWidth; SCROLLYS.forEach(s => s.neu()); map.invalidateSize(); alles(true); if (jetzt2 != null) zeige2(jetzt2); zeige3(sc3.jetzt()); if (ALLE) v4Zeichnen(ALLE.liste); kapitel3(); teil2(); v10Zeichnen(); });

  function csvBestehend(R, R2) {
    const tag = R.Y && R.i1 != null ? isoTag(Z.jahr, R.i1) : '', Y = R2.Y, S = R2.S;
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
      zeilen: tage(i => seen.flatMap(s => { const lz = S.lz, si = O.seeId.indexOf(s.id); return [Y.w[s.id][i], si >= 0 && i + lz < n ? 100 * O.see[si][i + lz] / (s.flaeche_km2 * 1e6) : 0]; })) }));
  }
  // Französische Typografie: geschütztes Leerzeichen vor : ; ? ! % und in « », auch wo der Doppelpunkt ohne Abstand gesetzt ist
  const FRW = [[/Rhein–/g, 'Rhin–'], [/Aare–/g, 'Aar–'], [/\bMainz\b/g, 'Mayence'], [/\bSpeyer\b/g, 'Spire'], [/\bBern\b/g, 'Berne'], [/\bBasel\b/g, 'Bâle'], [/Frankfurt Osthafen/g, 'Francfort Osthafen'], [/Rheinhalle/g, 'Rheinhalle'],
    [/Bodensee \(Obersee\)/g, 'Lac de Constance (lac supérieur)'], [/Bodensee \(Untersee\)/g, 'Lac de Constance (lac inférieur)'], [/Brienzersee/g, 'Lac de Brienz'], [/Thunersee/g, 'Lac de Thoune'], [/Murtensee/g, 'Lac de Morat'], [/Neuenburgersee/g, 'Lac de Neuchâtel'], [/Bielersee/g, 'Lac de Bienne'], [/Vierwaldstättersee/g, 'Lac des Quatre-Cantons'], [/Zürichsee/g, 'Lac de Zurich'],
    [/\bBAFU\b/g, 'OFEV'], [/\bZKR\b/g, 'CCNR'], [/\bKHR\b/g, 'CHR'], [/Tageswertpaare W\/Q/g, 'Couples journaliers W/Q'], [/\(geprüft\)/g, '(contrôlé)'], [/ und PEGELONLINE ab /g, ' et PEGELONLINE dès '], [/\(roh\)/g, '(brut)'],
    [/Reflexionspapier «Act now!» zum Thema Niedrigwasser, Edition 3\.0 vom 27\.10\.2023, Abschnitt 2\.1 \(Angaben von Rhenus Logistics und Contargo\)/g, 'document de réflexion « Act now! » sur les basses eaux, édition 3.0 du 27.10.2023, section 2.1 (données de Rhenus Logistics et de Contargo)'],
    [/, mesuré$/g, ', mesurée'], [/, simulé$/g, ', simulée'], [/1er /g, '1ᵉʳ '], [/(\d)e (centile|session)/g, '$1ᵉ $2'], [/Flussläufe/g, 'Cours d’eau'], [/Rheinkilometer: GeoRhena nach WSV/g, 'kilomètres du Rhin : GeoRhena d’après la WSV'], [/oberhalb s/g, 'en amont de s']];
  const BEM_FR = { brienz: 'Grande et Petite écluse d’État à Unterseen/Interlaken (depuis 1854/1855) ; autorité de régulation : Office des eaux et des déchets (OED) du canton de Berne', thun: 'Écluses de Mühle (depuis 1724) et de Scherzlig (depuis 1726) à Thoune ; autorité de régulation : Office des eaux et des déchets (OED) du canton de Berne',
    murten: 'Lacs du pied du Jura : barrage de régulation de Port (depuis 1939) ; autorité de régulation : Office des eaux et des déchets (OED) du canton de Berne', vws: 'Barrage de la Reuss à Lucerne (depuis 1861, assainissement complet 2008–2011)', zuerich: 'Barrage de régulation du Letten à Zurich (depuis 1951) ; autorité de régulation : Direction des travaux publics du canton de Zurich, AWEL' };
  BEM_FR.neuenburg = BEM_FR.biel = BEM_FR.murten;
  const ART_FR = a => a.startsWith('Niederwassergrenze') ? 'limite de basses eaux / limite de hautes eaux' : a.startsWith('nur Hochwassergrenze') ? 'limite de hautes eaux seulement : début du degré de danger 4 de l’OFEV (hydrodaten.admin.ch)' : a.startsWith('minimal') ? 'niveau minimal à respecter / limite de dommages à Stansstad' : a;
  function typoFr(wurzel) {
    if (!FR) return;
    const w = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
    for (let k = w.nextNode(); k; k = w.nextNode()) {
      if (k.parentNode.closest('script, style, a')) continue;
      const a = k.nodeValue, b = FRW.reduce((x, [re, neu]) => x.replace(re, neu), a).replace(/ ([:;?!%»])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/([^\s\u00a0]):(\s)/g, '$1\u00a0:$2').replace(/Mio\. m³/g, 'mio m³').replace(/m ü\. M\./g, 'm s. m.');
      if (a !== b) k.nodeValue = b;
    }
  }
  // Tabellen mit mehr als drei Spalten: Spaltenkopf in jede Zelle schreiben, damit sie auf dem Handy untereinander stehen können
  function stapeln(wurzel = document) {
    for (const tab of wurzel.querySelectorAll('main table')) { if (tab.closest('#dattabelle')) continue;
      const kopf = tab.querySelector('thead tr:last-child'); if (!kopf) continue;
      const th = [...kopf.children]; if (th.length <= 3) continue;
      tab.classList.add('stapel');
      for (const tr of tab.querySelectorAll('tbody tr')) { const td = [...tr.children]; if (td.length !== th.length) continue; td.forEach((c, k) => { if (k && th[k].textContent.trim()) c.dataset.l = th[k].textContent.trim(); }); }
    }
  }
  // ------------------------------------------------------------ Rückhalterechner: Regler, Ergebnis, Seen
  const LEITER = ['0', '1a', '1b', '1c', '2'], BEDARF = {};
  const mitBod = cm => { if (Z.bodensee) for (const s of meta.seen) if (!s.reguliert) cm[s.id] = Z.zusatz; return cm; };
  const volMio = cm => meta.seen.reduce((a, s) => a + (cm[s.id] || 0) * s.flaeche_km2 / 100, 0);
  function reglerZeichnen(R) {
    const el = $('rkregler'), Y = R.Y; if (!Y) { el.innerHTML = ''; return; }
    const vols = LEITER.map(st => st === '0' ? 0 : volMio(mitBod(stufeCM(Y, st, Z.zusatz)))), k = LEITER.indexOf(Z.stufe);
    if (!el.querySelector('input[type=range]')) {
      el.innerHTML = `<div class="rkleiste"><input type="range" min="0" max="${LEITER.length - 1}" step="1" aria-label="${h(T.rk2)}"><svg id="rkskala" role="img"></svg></div><div class="rkneben"><label class="rkbod"><input type="checkbox"> ${T.rkBod}</label><span id="rkzusatz"></span></div>`;
      el.querySelector('input[type=range]').addEventListener('input', e => { Z.stufe = LEITER[+e.target.value]; alles(true); });
      el.querySelector('input[type=range]').addEventListener('change', () => alles());
      el.querySelector('input[type=checkbox]').addEventListener('change', e => { Z.bodensee = e.target.checked; alles(); });
    }
    const rg = el.querySelector('input[type=range]'); rg.value = Math.max(0, k); rg.classList.toggle('aus', k < 0);
    el.querySelector('input[type=checkbox]').checked = Z.bodensee;
    const zs = $('rkzusatz'); if ((Z.stufe === '2' || Z.bodensee) && !zs.querySelector('input')) {
      zs.innerHTML = `<label class="gruppe"><span>${T.zusatzU}</span><input type="number" min="0" step="10" value="${Z.zusatz}"></label>`;
      zs.querySelector('input').addEventListener('change', e => { Z.zusatz = Math.max(0, +e.target.value || 0); alles(); });
    } else if (!(Z.stufe === '2' || Z.bodensee)) zs.innerHTML = '';
    // Skala: Stufen gleichmässig verteilt, darunter das Volumen; der nötige Speicher als Marke dazwischen
    const svg = $('rkskala'), B = Math.max(300, Math.min(1000, Math.round(el.clientWidth) || 800)), P = 11, H = 74, x = i => P + (B - 2 * P) * i / (LEITER.length - 1);
    const xv = v => { if (v <= vols[0]) return x(0); for (let i = 1; i < vols.length; i++) if (v <= vols[i]) return x(i - 1) + (x(i) - x(i - 1)) * (v - vols[i - 1]) / ((vols[i] - vols[i - 1]) || 1); return null; };
    let s = `<line x1="${x(0)}" x2="${x(LEITER.length - 1)}" y1="12" y2="12" stroke="#000" stroke-width="1"/>`;
    LEITER.forEach((st, i) => { const an = i === k;
      s += `<line x1="${x(i)}" x2="${x(i)}" y1="6" y2="18" stroke="#000" stroke-width="${an ? 3 : 1.5}"/><text class="${an ? 'blau' : 'fett'}" x="${x(i)}" y="34" text-anchor="${i ? i === LEITER.length - 1 ? 'end' : 'middle' : 'start'}">${st === '0' ? T.rkOhne : `${T.stufe} ${st}`}</text>` +
        `<text x="${x(i)}" y="50" text-anchor="${i ? i === LEITER.length - 1 ? 'end' : 'middle' : 'start'}">${zahl(vols[i])}</text>`; });
    const b = BEDARF[Y.jahr + Z.zielwahl];
    if (b) [[b.r, T.rkNoetigR, '#003399', '4 3'], [b.v, T.rkNoetigV, '#003399', '']].forEach(([e, name, f, da], n) => { if (!e || !e.noetig) return;
      const xx = e.erreicht ? xv(e.hi) : null, yy = 66 + 0 * n;
      if (xx != null) s += `<line x1="${xx}" x2="${xx}" y1="2" y2="22" stroke="${f}" stroke-width="2" ${da ? `stroke-dasharray="${da}"` : ''}/><text class="blau" x="${Math.min(B - P, Math.max(P, xx))}" y="${n ? 66 : 66}" text-anchor="${xx > B * .7 ? 'end' : xx < B * .3 ? 'start' : 'middle'}">${n ? '' : ''}</text>`; });
    const nb = b ? [[b.r, T.rkNoetigR], [b.v, T.rkNoetigV]].filter(([e]) => e && e.noetig).map(([e, name]) => `${name}${DP}${e.erreicht ? `${zahl(e.hi)}${xv(e.hi) == null ? ' →' : ''}` : T.rkNicht}`).join(' · ') : '';
    svg.setAttribute('viewBox', `0 0 ${B} ${H - 18}`); svg.innerHTML = s;
    let nt = el.querySelector('.rknoetig'); if (!nt) { nt = document.createElement('p'); nt.className = 'rknoetig'; el.querySelector('.rkleiste').append(nt); }
    nt.textContent = nb ? `${nb} ${T.mio}` : '';
    const stx = $('stufentext'); if (k < 0 && !stx.textContent.startsWith(T.rkEigenAktiv)) stx.textContent = `${T.rkEigenAktiv} ${stx.textContent}`;
  }
  // Warum 2022 voreingestellt ist, mit den Zahlen von 2022 und dem laufenden Jahr
  function startHinweis() {
    const a = GELADEN[STARTJAHR], b = GELADEN[LETZTES]; if (!a || !b || !PK || STARTJAHR === LETZTES) return '';
    const ka = kaubJahr(a, OHNE), kb = kaubJahr(b, OHNE);
    return LL(`Voreingestellt ist ${STARTJAHR}, ein Niedrigwasserjahr mit ${ka.u0} Tagen unter dem GlW. Daran lässt sich zeigen, was Rückhalt bewirkt. ${LETZTES} ist ein Extremjahr mit ${kb.u0} Tagen unter dem GlW und ${kb.k0} Tagen unter 40 cm; dort hält auch ein sehr grosser Speicher den GlW nicht an allen Tagen, weil das Wasser zum Füllen fehlt. Andere Jahre lassen sich in der Jahreszahl wählen.`,
      `L’année ${STARTJAHR} est préréglée : une année d’étiage avec ${ka.u0} jours sous le GlW. Elle permet de montrer ce qu’apporte la retenue. ${LETZTES} est une année extrême avec ${kb.u0} jours sous le GlW et ${kb.k0} jours sous 40 cm ; même un très grand réservoir n’y tient pas le GlW tous les jours, faute d’eau pour le remplir. D’autres années se choisissent dans le chiffre de l’année.`);
  }
  function zweiRechnungen(Y) {
    const altM = Z.modus, altN = NETZ; NETZ = VOLL;
    try { Z.modus = 'regel'; const r = simulieren(Y); Z.modus = 'glw'; const v = simulieren(Y); return { r, v }; } finally { Z.modus = altM; NETZ = altN; }
  }
  function ergebnisZeichnen(R) {
    const Y = R.Y, z = $('rkzahlen'); if (!Y || !Y.q[KAUB] || !PK) { z.innerHTML = ''; return; }
    const k0 = kaubJahr(Y, OHNE), V = meta.seen.reduce((a, s) => a + CM[s.id], 0) > 0, zw = V ? zweiRechnungen(Y) : null, r = zw && zw.r.O ? zw.r : null, v = zw && zw.v.O ? zw.v : null;
    const kr = r ? kaubJahr(Y, r) : null, kv = v ? kaubJahr(Y, v) : null;
    const kach = (titel, a, b, c, e = '') => `<div><span>${titel}</span><b>${zahl(a)}${e}${b != null ? ` → <i>${zahl(b)}${e}</i>` : ''}</b><em>${b != null ? `${T.gemessen} → ${T.rkReal}${c != null ? ` · ${T.rkBest}${DP}${zahl(c)}${e}` : ''}` : T.gemessen}</em></div>`;
    // Die Zahl des gewählten Ziels steht zuerst
    const kacheln = { C: kach(`${T.nUnter} ${Y.jahr}`, k0.u0, kr && kr.u1, kv && kv.u1), B: kach(T.aTage, k0.k0, kr && kr.k1, kv && kv.k1), A: kach(T.nTief, k0.t0, kr && kr.t1, kv && kv.t1, ' cm') };
    const zl = Z.zielwahl === 'D' ? 'C' : Z.zielwahl;
    z.innerHTML = kacheln[zl] + ['C', 'B', 'A'].filter(x => x !== zl).map(x => kacheln[x]).join('') +
      (Z.zielwahl === 'D' && kr ? `<div><span>${LL('Höchstens 20 Tage unter dem GlW', 'Au plus 20 jours sous le GlW')}</span><b>${kr.u1 <= 20 ? T.ja : T.nein}</b><em>${T.rkReal}${kv ? ` · ${T.rkBest}${DP}${kv.u1 <= 20 ? T.ja : T.nein}` : ''}</em></div>` : '') + (V ? '' : `<p class="hinweis">${T.rkLeer}</p>`);   // FR provisorisch
    // Hochwasserschutz: beide Rechenweisen
    const hw = S => S && S.O ? S.O.ueber.reduce((a, b) => a + b, 0) : 0, hr = hw(r), hv = hw(v);
    $('hochwasser').className = hr || hv ? 'warnung' : 'warnung ok';
    const liste = r ? r.O.seeId.map((id, k) => r.O.hwSee[k] ? `${h(nm(SEE[id].name))} ${r.O.hwSee[k]}` : '').filter(Boolean).join(', ') : '';
    $('hochwasser').innerHTML = !V ? '' : `<b>${T.hwT}</b> ` + (hr || hv ? `${T.rkHwSatz}${DP}${FR ? T.rkReal.toLowerCase() : T.rkReal} <b>${hr} ${T.tageW}</b>${liste ? ` (${liste})` : ''}, ${T.rkBest} <b>${hv} ${T.tageW}</b>.` : T.hwKein);
    if (!V) $('hochwasser').className = 'warnung leer';
    // Hauptgrafik wie in Kapitel 3
    jahrGrafik($('rkgrafik'), Y, { titel: `${T.gTitel} ${Y.jahr}`, sim: v ? v.q[KAUB] : null, sim2: r ? r.q[KAUB] : null, speicher: r ? r.O.speicher : null, speicherTitel: T.rkSpeicher, hw: r ? r.O.ueber : null });
    $('rklegende').innerHTML = jahrLegende(!!v, !!r, !!r);
    csvKnopf($('rkfig'), () => `rhein-rueckhalterechner-${Y.jahr}`, () => ({ titel: `${T.simTitel} ${Y.jahr}`, ...jahrCsv(Y, r && v ? { v: { S: v, genutzt: 0 }, r: { S: r } } : null) }));
    seenKlein(Y, r);
  }
  // Je See eine kleine Grafik: Seestand gemessen, mit Rückhalt (Betriebsregel), Hochwassergrenze
  function seenKlein(Y, r) {
    const el = $('rkseen'); if (!r) { el.innerHTML = ''; return; }
    const O = r.O, n = O.speicher.length;
    el.innerHTML = `<p class="hinweis rkseetext">${T.rkSeeText}</p>` + O.seeId.map((id, k) => {
      const s = SEE[id], mess = Y.w[id]; if (!mess) return '';
      const zus = mess.map((x, j) => j + r.lz < n ? O.see[k][j + r.lz] / (s.flaeche_km2 * 1e6) : 0), mit = mess.map((x, j) => x == null ? null : x + zus[j]);
      const hw = s.grenzen ? s.grenzen.hoch : null, alle = [...mess, ...mit].filter(x => x != null).concat(hw != null ? [hw] : []);
      const lo = Math.min(...alle), hi = Math.max(...alle), B = 300, H = 120, L = 6, RR = 6, OO = 8, U = 16, x = j => L + (B - L - RR) * j / (mess.length - 1), y = v => OO + (H - OO - U) * (1 - (v - lo) / ((hi - lo) || 1));
      const linie = a => { let d = '', an = false; a.forEach((v, j) => { if (v == null) { an = false; return; } d += (an ? 'L' : 'M') + x(j).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
      let g = '';
      if (hw != null) { mit.forEach((v, j) => { if (v != null && zus[j] > .005 && v > hw) g += `<rect x="${x(j).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(x(1) - x(0) + .4).toFixed(1)}" height="${(y(hw) - y(v)).toFixed(1)}" fill="#000"/>`; });
        g += `<line x1="${L}" x2="${B - RR}" y1="${y(hw)}" y2="${y(hw)}" stroke="#000" stroke-dasharray="4 3"/>`; }
      g += `<path d="${linie(mit)}" fill="none" stroke="#003399" stroke-width="2"/><path d="${linie(mess)}" fill="none" stroke="#000" stroke-width="1.5"/><line x1="${L}" x2="${B - RR}" y1="${H - U}" y2="${H - U}" stroke="#000"/>`;
      [0, 3, 6, 9].forEach(m => { const j = tagNr(`${Y.jahr}-${String(m + 1).padStart(2, '0')}-01`); g += `<text x="${x(j) + 2}" y="${H - 3}" class="nb">${T.monate[m]}</text>`; });
      const max = Math.max(...zus) * 100, tage = O.hwSee[k] || 0;
      return `<figure class="rksee"><figcaption><b>${h(nm(s.name))}</b> <span>${T.rkMax} +${zahl(max)} cm</span>${hw != null ? ` <span class="${tage ? 'hw' : ''}">${tage} ${T.rkHwT}</span>` : ''}</figcaption><svg viewBox="0 0 ${B} ${H}" role="img">${g}</svg></figure>`;
    }).join('');
  }
  // ------------------------------------------------------------ Ablauf
  let lauf_ = 0;
  function simRechnen(Y) {
    if (!Y) return { Y: null, S: null };
    const alt = NETZ; NETZ = VOLL; stufeAnwenden(Y); const S = simulieren(Y); NETZ = alt;
    return { Y, S, i0: null, i1: null };
  }
  async function alles(nurWerte) {
    const nr = ++lauf_, R = await rechnen();
    if (nr !== lauf_) return;
    await jahr(LETZTES); if (meta.jahre.includes(2026)) await jahr(2026);      // für V1 (tiefster Tag) und V2 (Beobachtungen 2026)
    const Y2 = await jahr(Z.simjahr); await nachbarn(Z.simjahr);
    if (nr !== lauf_) return;
    if (!nurWerte) wahlZeichnen(R.Y);
    else { const d = $('wahl').querySelector('input[type=date]'); if (d && Z.tag != null) d.value = isoTag(Z.jahr, Z.tag); }
    datenZeichnen(R); lageZeichnen(R); fahrbarZeichnen(R); laengsschnitt(R); karteZeichnen(R); herkunftZeichnen(R); bilanzZeichnen(R); seenZeichnen(R); kapitel1(R);
    // Teil 2 rechnet mit seinem eigenen Jahr; Z.jahr gilt dafür nur während dieses Blocks
    const altJ = Z.jahr; let R2;
    Z.jahr = Z.simjahr;
    let zw = null;
    try { R2 = simRechnen(Y2); if (!nurWerte) simWahl(R2); jahresband(R2); simZeichnen(R2); reglerZeichnen(R2); ergebnisZeichnen(R2); zw = Y2 ? zweiRechnungen(Y2) : null; }
    finally { Z.jahr = altJ; }
    herleitung({ ...R, S: R2.S, sz: R2.sz, simJahr: Z.simjahr, zw, Y2 }); csvBestehend(R, R2); typoFr(document.body); stapeln();
  }

  window.rhin = { szenario, jahr, nachbarn, bedarfGlw };     // für Prüfungen in der Konsole
  // V2: Text mit belegten Werten (ZKR, 2023; Transport Online, 2026a, 2026b; AWP, 2026). FR provisorisch
  $('v2text').innerHTML = LL(`<p>Bei Niedrigwasser wird der Rhein nicht gesperrt. Die Schiffe laden weniger. Die ZKR gibt Angaben von zwei Unternehmen wieder: Ein Schiff einer Trockengüter- und Tankerflotte kann unter 134 cm am Pegel Kaub die Hälfte seiner Ladung nutzen, unter 72 cm einen Viertel, unter 44 cm 15 %. Volle Ladung gilt für ein Containerschiff ab 250 cm (ZKR, 2023). Die Werte betreffen also zwei Schiffstypen.</p><p>Unter 40 cm findet laut ZKR praktisch keine Binnenschifffahrt mehr statt. 2026 fuhren Schiffe trotzdem weiter, mit wenig Ladung: Als der Pegel am 1. Oktober 2026 bei −6 cm stand, brauchte eine Reederei für 4'600 t von Rotterdam nach Nürnberg 14 Schiffe statt 3 (Transport Online, 2026b). Mitte August nahmen fahrende Schiffe teils nur 10 bis 20 % ihrer normalen Ladung auf (Transport Online, 2026a). Am 10. August 2026 brachte ein Schiff mit Mineralöl nur einen Fünftel der üblichen Menge nach Basel (AWP, 2026).</p>`,
    `<p>En basses eaux, le Rhin n’est pas fermé. Les bateaux chargent moins. La CCNR reprend les données de deux entreprises : un bateau d’une flotte de vraquiers et de citernes peut utiliser la moitié de son chargement sous 134 cm à l’échelle de Kaub, un quart sous 72 cm, 15 % sous 44 cm. Le plein chargement vaut pour un porte-conteneurs à partir de 250 cm (CCNR, 2023). Les valeurs concernent donc deux types de bateaux.</p><p>Sous 40 cm, selon la CCNR, la navigation n’a pratiquement plus lieu. En 2026, des bateaux ont pourtant continué de naviguer, avec peu de chargement : quand l’échelle indiquait −6 cm le 1er octobre 2026, un armateur a eu besoin de 14 bateaux au lieu de 3 pour 4 600 t de Rotterdam à Nuremberg (Transport Online, 2026b). À la mi-août, des bateaux en service ne prenaient parfois que 10 à 20 % de leur chargement habituel (Transport Online, 2026a). Le 10 août 2026, un bateau a apporté à Bâle seulement un cinquième de la quantité habituelle d’huiles minérales (AWP, 2026).</p>`);
  simSeen(); alles(); kapitel2(); kapitel3();
  teil2().then(() => jahresvergleich()).then(() => kapitel7());
})();
