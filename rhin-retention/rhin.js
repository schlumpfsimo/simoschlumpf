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
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.'],
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
    meth: ['Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sonst 0; Basel–Kaub 2), nicht gemessen. Geprüft per Kreuzkorrelation der Tageswerte: Basel–Maxau 0.8, Maxau–Worms 0.8, Basel–Kaub 2.2 Tage.', 'Stufe 1 ist eine Obergrenze: Sie nutzt den ganzen Platz bis zur Hochwassergrenze. Reglemente, Hochwasserschutz und Ökologie lassen weniger zu.',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Jahrbuch (2008–2025), danach Rohdaten der letzten 31 Tage. Neckar: 2010–2020. Für Kaub, Mainz, Worms, Bingen und den Main schliessen die Tagesmittel aus dem Pegelportal des HLNUG die Lücke seit dem Jahrbuch. Der Abfluss in Kaub ist dort aus dem gemessenen Wasserstand gerechnet und so bezeichnet. Für Maxau, Speyer und Mannheim fehlen die Werte vom 1.1.2026 bis Mitte Oktober 2026.',
      'Fehlen die Pegel zwischen Basel und Kaub, fasst die Bilanz alles unterhalb von Basel zu einem Rest zusammen.',
      'Seen: konstante Fläche. Flächen und Grenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020). Für Neuenburger- und Murtensee gilt als Grenze der Beginn der Gefahrenstufe 4 des BAFU. Bodensee: 536 km², davon Obersee 473 und Untersee 63 km² (IGKB).', 'Kaub 2026: Für die Tage um und unter 0 cm liefert das Pegelportal keinen Wert. Diese Tage sind aus dem Pegel Bingen abgeleitet (mittlerer Abstand der beiden Pegel bei Niedrigwasser) und so bezeichnet.', 'Die Tage unter dem GlW sind für alle Jahre mit dem heutigen GlW von 77 cm gezählt. Bis 2022 galt 78 cm.', 'Der Schutz vor einem Absinken unter den GlW gilt für Kaub. An einzelnen Tagen kann der Rückhalt andere Pegel unter ihren GlW drücken.',
      'Es wird nichts interpoliert. Fehlt ein Wert, fehlt das Ergebnis.'],
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
  const $ = id => document.getElementById(id);
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[e.dataset.t]; });
  document.title = T.titel.replace(' · ', ' – ');
  if (FR) document.querySelector('meta[name=description]').content = 'De quoi dépend la navigabilité du Rhin jusqu’à Kaub et ce qu’apporterait une retenue dans les lacs : débits mesurés, échelle de Kaub, origine de l’eau et simulation.';
  const INHALT = [['teil1', [['k1', 'k1Titel'], ['k2', 'k2Titel']]], ['teil2', [['k3', 'k3Titel'], ['simulator', 'simTitel']]], ['anhang', [['herleitung', 'herTitel'], ['daten', 'datTitel'], ['fehlt', 'fehlTitel']]]];
  $('inhalt').innerHTML = INHALT.map(([id, l]) => `<div><a class="teillink" href="#${id}">${T[id]}${T[id + 'T'] ? ` · ${T[id + 'T']}` : ''}</a>${l.map(([i, k]) => `<a href="#${i}">${T[k]}</a>`).join('')}</div>`).join('');
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
  const SEK = 86400, P_MAX = 0.10, P_SEE = 0.20; let RESERVE = 0.20, OFFEN = false, VORRAT = false;   // OFFEN: Schranken 10 % / 20 % aufgehoben (Stufe «Unbegrenzt»)   // RESERVE: Abstand zur Hochwassergrenze beim Füllen (m)
  let MONAT = null;                             // Monat (1–12) je Tag des Rechenfensters, für die Betriebsregel
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
    let letzter = -1; for (let i = 0; i < n; i++) if (q[i] != null && q[i] < tief) letzter = i;
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (x < tief) { const bedarf = (tief - x) * SEK; if (bedarf > B.inhalt() + 1e-6) return null; B.leeren(bedarf); abgabe[i] = tief - x; }
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

  // ------------------------------------------------------------ Zustand
  const Z = { ziel: KAUB, ansicht: 'heute', jahr: LETZTES, tag: null, extrem: 0, sim: false, zoom: false, modus: 'regel', verlauf: null, see: null, stufe: '1b', zusatz: 50, bodensee: false };
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
  function szenario(Y, stufe, modus = 'glw', cmFrei = null) {
    const altCM = { ...CM }, altU = UEBER, altM = Z.modus, altN = NETZ, altZ = ZIEL, altR = MIT_RESERVE, altRegel = { ...REGEL }, altRes = RESERVE, altO = OFFEN;
    OFFEN = false;
    Object.assign(REGEL, REGEL_STD); RESERVE = 0.20;     // Kapitel 2 und 3 rechnen immer mit den Standardwerten, unabhängig vom Simulator
    if (cmFrei != null) { for (const s of meta.seen) CM[s.id] = s.reguliert ? cmFrei : 0; UEBER = Infinity; ZIEL = { ...HW }; }
    else if (!stufe) { for (const s of meta.seen) CM[s.id] = 0; UEBER = 0; }
    else { Object.assign(CM, stufeCM(Y, String(stufe), 50)); UEBER = stufeNr(stufe) >= 2 ? 50 : 0; ZIEL = stufeZiel(String(stufe)); MIT_RESERVE = String(stufe) !== '1a'; }
    Z.modus = modus; NETZ = VOLL;
    try { const S = simulieren(Y); return { S, k: kaubJahr(Y, S), v: S.V / 1e6, genutzt: S.O ? Math.max(...S.O.speicher) / 1e6 : 0, ueber: S.O ? S.O.ueber.reduce((a, b) => a + b, 0) : 0 }; }
    finally { Object.assign(CM, altCM); UEBER = altU; Z.modus = altM; NETZ = altN; ZIEL = altZ; MIT_RESERVE = altR; Object.assign(REGEL, altRegel); RESERVE = altRes; OFFEN = altO; }
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
      const o = Z.modus === 'regel' && glw ? regel(qz.slice(a, b), V, Q_GLW, REGEL.stauAb, REGEL.tage) : glw ? heben(qz.slice(a, b), V, Q_GLW, Q_STAU) : optimieren(qz.slice(a, b), V);
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
    const O = { tief: (O2 || O1).tief, hoch: (O2 || O1).hoch, winter: O1 && O2 ? { tief: O1.tief, hoch: O1.hoch } : null, glw: !!glw, regel: istRegel, deckel: Q_GLW,
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
      if (AUSL) { if (m.w < AUSL.keine_unter) k0++; if (s.w < AUSL.keine_unter) k1++; if (a.fehl > 0) { a0 += auslastung(m.w); a1 += auslastung(s.w); nu++; } } }
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
      const sz = STUFEN.map(s => szenario(Y, s, 'regel')), st = sz.map(z => ({ ...z.k, hw: z.ueber })), ri = st.findIndex(x => x.u1 === 0), reicht = !k.u0 ? 0 : ri >= 0 ? STUFEN[ri] : null;
      zeilen.push({ j, ...k, bedarf: bedarfGlw(Y), st, reicht });
      await new Promise(r => setTimeout(r, 0));
    }
    setTimeout(() => { typoFr($('k3')); stapeln($('k3')); }, 0);
    el.innerHTML = `<h2>${T.jTitel}</h2><p class="hinweis">${T.jText}</p><div class="rollen"><table><thead><tr><th>${T.jJahr}</th><th class="z">${T.nTage}</th><th class="z">${T.nUnter}</th><th class="z">${T.aTage}</th><th class="z">${T.nTief}</th><th class="z">${T.jBedarf}</th>${STUFEN.map(s => `<th class="z">${T.stufe} ${s}</th>`).join('')}<th>${T.jReicht}</th></tr></thead><tbody>` +
      zeilen.map(z => `<tr><td>${z.j}</td><td class="z">${z.tage}</td><td class="z">${z.u0}</td><td class="z">${z.k0}</td><td class="z">${zahl(z.t0)}</td><td class="z">${z.u0 ? zahl(z.bedarf) : '–'}</td>` +
        z.st.map(x => `<td class="z blau">${z.u0 ? `${x.u1} · ${zahl(x.t1)}${x.hw ? ` <span class="hw">${x.hw}</span>` : ''}` : '–'}</td>`).join('') + `<td>${z.reicht === 0 ? T.unnoetig : z.reicht ? `${T.stufe} ${z.reicht}` : T.jNie}</td></tr>`).join('') + '</tbody></table></div>';
    const B = BREITE(), H = 300, L = 62, RR = 14, O = 34, U = 36, max = Math.min(420, Math.max(PK.tugl, ...zeilen.map(z => Math.max(z.t0, ...z.st.map(x => x.t1)))) + 20), bw = (B - L - RR) / zeilen.length;
    const y = v => O + (H - O - U) * (1 - Math.min(v, max) / max), FL = ['#000', '#fff', 'url(#s_e1)', 'url(#s_e1)', 'url(#s_e2)', '#003399'];
    let s = `<text class="fett" x="${L}" y="14">${T.jGrafik}</text>`;
    for (let v = 0; v <= max; v += 50) s += (v ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    zeilen.forEach((z, i) => { const x0 = L + i * bw, b = Math.min(6, bw * .13);
      [z.t0, ...z.st.map(x => x.t1)].forEach((v, k) => { s += `<rect x="${(x0 + bw / 2 + (k - 3) * (b + 1)).toFixed(1)}" y="${y(v)}" width="${b}" height="${y(0) - y(v)}" fill="${FL[k]}"${k ? ' stroke="#003399" stroke-width="1"' : ''}><title>${z.j} ${k ? `${T.stufe} ${STUFEN[k - 1]}` : T.gemessen}${DP}${zahl(v)} cm</title></rect>`; });
      s += `<text x="${x0 + bw / 2}" y="${H - U + 18}" text-anchor="middle">${String(z.j).slice(2)}</text>`; });
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/><line class="soll" x1="${L}" x2="${B - RR}" y1="${y(PK.tugl)}" y2="${y(PK.tugl)}"/><text class="fett" x="${B - RR - 4}" y="${y(PK.tugl) - 6}" text-anchor="end">${T.lSoll} ${zahl(PK.tugl)}</text>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    csvKnopf($('jahrefig'), () => 'rhein-kaub-jahre', () => ({ titel: T.jTitel, kopf: ['jahr', 'tage_mit_wert', 'tage_unter_GlW', 'tage_unter_40cm', 'kleinste_fahrrinnentiefe_cm', 'bedarf_bis_GlW_Mio_m3', ...STUFEN.flatMap(k => [`stufe${k}_tage_unter_GlW`, `stufe${k}_tage_unter_40cm`, `stufe${k}_kleinste_fahrrinnentiefe_cm`, `stufe${k}_tage_see_ueber_hochwassergrenze`]), 'GlW_an_allen_Tagen_ab_stufe'],
      zeilen: zeilen.map(z => [z.j, z.tage, z.u0, z.k0, z.t0, z.bedarf, ...z.st.flatMap(x => [x.u1, x.k1, x.t1, x.hw]), z.reicht == null ? 'keine' : z.reicht]) }));
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
    $('simkopf').innerHTML = jahrSel(meta.jahre.slice().reverse(), Z.jahr, T.skJahr);
    $('simkopf').querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; Z.tag = null; Z.ansicht = Z.jahr === LETZTES ? 'heute' : 'tag'; alles(); });
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
  function suche(Y, modus, bodensee = false, ohne = false) {
    const altCM = { ...CM }, alt = [UEBER, ZIEL, MIT_RESERVE, NETZ, OFFEN, Z.modus, UNB.mio, UNB.bodensee];
    UNB.bodensee = bodensee; OFFEN = ohne; Z.modus = modus; NETZ = VOLL;
    const pruef = mio => { UNB.mio = mio; unbAnwenden(); const S = simulieren(Y); return { ...kaubJahr(Y, S), hw: S.O ? S.O.ueber.reduce((x, y) => x + y, 0) : 0 }; };
    try {
      const k0 = kaubJahr(Y, OHNE), bed = bedarfGlw(Y), fl = unbSeen().reduce((a, s) => a + s.flaeche_km2, 0);
      if (!k0.u0) return { noetig: false, k0, bed, fl };
      let lo = 0, hi = Math.max(100, bed), kh = pruef(hi);
      while (kh.u1 > 0 && hi < MAXMIO) { lo = hi; hi = Math.min(MAXMIO, hi * 2); kh = pruef(hi); }
      if (kh.u1 > 0) return { noetig: true, erreicht: false, hi, kh, k0, bed, fl };
      for (let i = 0; i < 24 && hi - lo > Math.max(1, hi * .005); i++) { const m = (lo + hi) / 2, km = pruef(m); if (km.u1 === 0) { hi = m; kh = km; } else lo = m; }
      return { noetig: true, erreicht: true, hi, kh, k0, bed, fl };
    } finally { Object.assign(CM, altCM); [UEBER, ZIEL, MIT_RESERVE, NETZ, OFFEN, Z.modus, UNB.mio, UNB.bodensee] = alt; }
  }
  // Am Anfang des Simulators: nötige Kapazität des gewählten Jahres neben dem Platz jeder Stufe
  let bedarfNr = 0;
  function bedarfZeichnen(R) {
    const el = $('bedarf'), Y = R.Y;
    if (!Y || !Y.q[KAUB] || !PK) { el.innerHTML = ''; el.dataset.schl = ''; return; }
    const schl = JSON.stringify([Y.jahr, REGEL, RESERVE]); if (el.dataset.schl === schl) return;
    el.dataset.schl = schl; el.innerHTML = `<h2>${T.bdTitel} ${Y.jahr}</h2><p class="hinweis">${T.jRechnet}</p>`;
    const nr = ++bedarfNr;
    setTimeout(() => {
      if (nr !== bedarfNr) return;
      const v = suche(Y, 'glw'); if (nr !== bedarfNr) return;
      if (!v.noetig) { el.innerHTML = `<h2>${T.bdTitel} ${Y.jahr}</h2><p>${T.nieUnter}</p>`; return; }
      const r = suche(Y, 'regel'), vo = v.erreicht ? null : suche(Y, 'glw', false, true), fl = v.fl, cm = x => zahl(x / fl * 100);
      BEDARF[Y.jahr] = { v, r };
      const stufen = STUFEN.map(s => { const c = stufeCM(Y, s, 50); return { s, mio: meta.seen.reduce((a, x) => a + c[x.id] * x.flaeche_km2 / 100, 0) }; });
      const wert = e => e.erreicht ? `<b>${zahl(e.hi)} ${T.mio}</b> = ${cm(e.hi)} cm${e.kh.hw ? ` · <span class="hw">${T.hwT}${DP}${e.kh.hw} ${e.kh.hw === 1 ? (FR ? 'jour' : 'Tag') : T.tageW}</span>` : ''}` : `<b>${T.bdNicht}</b> ${FR ? `(${e.kh.u1} jours restent sous le GlW avec ${zahl(MAXMIO)} mio m³)` : `(mit ${zahl(MAXMIO)} Mio. m³ bleiben ${e.kh.u1} Tage unter dem GlW)`}`;
      let html = `<h2>${T.bdTitel} ${Y.jahr}</h2><p class="lead">${FR ? `En ${Y.jahr}, Kaub est resté ${v.k0.u0} jours sous le GlW. Pour l’éviter, les lacs régulés (${zahl(fl)} km²) auraient dû stocker :` : `${Y.jahr} lag Kaub an ${v.k0.u0} Tagen unter dem GlW. Damit das nicht passiert, hätten die regulierten Seen (${zahl(fl)} km²) so viel speichern müssen:`}</p>` +
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
      typoFr(el); if (Z.jahr === Y.jahr) reglerZeichnen({ Y });
    }, 30);
  }
  function noetigZeichnen(R) {
    const el = $('noetig');
    if (Z.stufe !== 'unb' || !R.Y || !R.Y.q[KAUB] || !PK) { el.hidden = true; el.innerHTML = ''; el.dataset.schl = ''; return; }
    const Y = R.Y, schl = JSON.stringify([Y.jahr, Z.modus, UNB.bodensee, UNB.ohne, REGEL, RESERVE]);
    el.hidden = false; if (el.dataset.schl === schl) return;
    el.dataset.schl = schl; el.innerHTML = `<b>${T.uTitel}</b> ${T.jRechnet}`;
    const nr = ++noetigNr;
    setTimeout(() => {
      if (nr !== noetigNr) return;
      const e = suche(Y, Z.modus, UNB.bodensee, UNB.ohne), fl = e.fl, bed = e.bed, k0 = e.k0;
      const seenT = UNB.bodensee ? T.uMitB : T.uReg, weise = Z.modus === 'regel' ? T.eRegel : T.eBest;
      if (!e.noetig) { el.innerHTML = `<b>${T.uTitel}</b> ${T.nieUnter}`; return; }
      let hi = e.hi, kh = e.kh;
      if (kh.u1 > 0) {
        el.innerHTML = `<b>${T.uTitel}</b> ` + LL(`Auch mit ${zahl(hi)} Mio. m³ bleiben ${Y.jahr} ${kh.u1} von ${k0.u0} Tagen unter dem GlW (${weise}). Mehr Platz nützt nicht, es fehlt das Wasser zum Füllen. Gestaut wird nur${Z.modus === 'regel' ? ` von ${T.monate[REGEL.von - 1]} bis ${T.monate[REGEL.bis - 1]} und nur über ${zahl(REGEL.stauAb)} m³/s in Kaub` : ', wenn Kaub mindestens 10 cm über dem GlW liegt'}${UNB.ohne ? '' : ', höchstens 10 % des Abflusses in Kaub und 20 % des Abflusses unterhalb der Seen'}.${Z.modus === 'regel' ? ' Mehr bringen längere Staumonate oder eine tiefere Schwelle.' : ''}${UNB.ohne ? '' : ' Mit «Schranken aufgehoben» rechnen.'}`,
          `Même avec ${zahl(hi)} mio m³, ${kh.u1} jours sur ${k0.u0} restent sous le GlW en ${Y.jahr} (${weise}). Plus de place n’aide pas, il manque l’eau pour le remplissage. On ne retient ${Z.modus === 'regel' ? `que de ${T.monate[REGEL.von - 1]} à ${T.monate[REGEL.bis - 1]} et qu’au-dessus de ${zahl(REGEL.stauAb)} m³/s à Kaub` : 'que si Kaub est au moins 10 cm au-dessus du GlW'}${UNB.ohne ? '' : ', au plus 10 % du débit à Kaub et 20 % du débit en aval des lacs'}.${Z.modus === 'regel' ? ' Des mois de retenue plus longs ou un seuil plus bas apportent davantage.' : ''}${UNB.ohne ? '' : ' Calculer avec les limites « levées ».'}`);
        typoFr(el); return;
      }
      el.innerHTML = `<b>${T.uTitel}</b> ` + LL(`Für den GlW an allen Tagen ${Y.jahr} hätte es <b>${zahl(hi)} Mio. m³</b> gebraucht (${weise}). Das sind ${zahl(hi / fl * 100)} cm auf ${zahl(fl)} km² (${seenT}). Summe der Fehlbeträge: ${zahl(bed)} Mio. m³. ${kh.hw ? `Mit dieser Kapazität stünde ein See an <b>${kh.hw} ${kh.hw === 1 ? 'Tag' : 'Tagen'}</b> über seiner Hochwassergrenze.` : 'Kein See stünde über seiner Hochwassergrenze.'}`,
        `Pour tenir le GlW tous les jours en ${Y.jahr}, il aurait fallu <b>${zahl(hi)} mio m³</b> (${weise}). Cela fait ${zahl(hi / fl * 100)} cm sur ${zahl(fl)} km² (${seenT}). Somme des déficits : ${zahl(bed)} mio m³. ${kh.hw ? `Avec cette capacité, un lac serait <b>${kh.hw} ${kh.hw === 1 ? 'jour' : 'jours'}</b> au-dessus de sa limite de hautes eaux.` : 'Aucun lac ne serait au-dessus de sa limite de hautes eaux.'}`) +
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
      (PK && AUSL ? (() => { const kj = kaubJahr(R.Y, S); return kachel(T.aTage, `${zahl(kj.k0)} → ${zahl(kj.k1)}`, T.aHinweis) + (kj.a0 != null ? kachel(T.aFlotte, `${zahl(kj.a0)} → ${zahl(kj.a1)} %`, `${T.aUnter} · ${T.aHinweis}`) : ''); })() : '') +
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
      ? `<p>${t('Mit Voraussicht heisst: Die Rechnung kennt alle Tageswerte des Speicherjahrs im Voraus. Bezugswert ist der Abfluss beim GlW in Kaub, Q<sub>GlW</sub>. Jede Anhebung darunter zählt. Unter L wird abgegeben, mit L höchstens Q<sub>GlW</sub>: Alle Tage unter L kommen auf L, die tiefsten gewinnen am meisten. Gestaut wird nur über H, und H liegt mindestens 10 cm über dem GlW, also nie an einem Tag am oder unter dem GlW; höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt.', 'Avec prévision signifie que le calcul connaît d’avance toutes les valeurs journalières de l’année de stockage. La référence est le débit au GlW à Kaub, Q<sub>GlW</sub>. Chaque relèvement en dessous compte. Sous L on restitue, avec L au plus égal à Q<sub>GlW</sub> : tous les jours sous L montent à L, les plus bas gagnent le plus. On ne retient qu’au-dessus de H, avec H situé au moins 10 cm au-dessus du GlW, donc jamais un jour au GlW ou en dessous ; au plus 10 % du débit et seulement tant qu’un jour sous L suit encore.')}</p>` +
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
    html += `<p>${t('Woher das Wasser zum Füllen kommt: Die Rechnung nimmt es aus dem Abfluss, der an dem Tag tatsächlich unterhalb des Sees gemessen wurde. Wird gestaut, fliesst dort entsprechend weniger; wird abgegeben, entsprechend mehr. Zuflüsse in die Seen gehen nicht eigens ein, sie stecken im gemessenen Abfluss unterhalb. Die Wirkung erreicht Basel am selben Tag und Kaub zwei Tage später (Annahme), ohne Abflachung der Welle. Das gilt auch für den Bodensee: Nach den Messreihen erscheint eine Änderung in Neuhausen am selben Tag in Basel.', 'D’où vient l’eau du remplissage : le calcul la prélève sur le débit réellement mesuré ce jour-là en aval du lac. Quand on retient, il y coule d’autant moins ; quand on restitue, d’autant plus. Les apports aux lacs n’entrent pas séparément, ils sont contenus dans le débit mesuré en aval. L’effet atteint Bâle le jour même et Kaub deux jours plus tard (hypothèse), sans atténuation de l’onde. Cela vaut aussi pour le lac de Constance : d’après les séries mesurées, une variation à Neuhausen apparaît le même jour à Bâle.')}</p>` +
      f(`Q<sub>s</sub><sup>sim</sup>(t) = Q<sub>s</sub>(t) − r<sub>s</sub>(t) + a<sub>s</sub>(t) &nbsp;&nbsp; Q<sub>Kaub</sub><sup>sim</sup>(t + 2) = Q<sub>Kaub</sub>(t + 2) + Σ<sub>s</sub> (a<sub>s</sub>(t) − r<sub>s</sub>(t))`);
    html += `<p>${t('Hochwassergrenze: Der Seestand W<sub>s</sub> plus der Zusatzstau darf die Hochwassergrenze G<sub>s</sub> des Sees nicht überschreiten. Der See s trägt den Anteil V<sub>s</sub> / V des Inhalts S. Liegt der Inhalt über der Grenze, wird der Überschuss am selben Tag abgegeben (Entlastung). Für den Bodensee ist keine Grenze hinterlegt. In den Stufen 2 und 3 liegt die Grenze um den gewählten Zusatz höher.', 'Limite de hautes eaux : le niveau W<sub>s</sub> plus la surélévation ne doit pas dépasser la limite G<sub>s</sub> du lac. Le lac s porte la part V<sub>s</sub> / V du contenu S. Si le contenu dépasse la limite, l’excédent est restitué le jour même (délestage). Aucune limite n’est enregistrée pour le lac de Constance. Aux paliers 2 et 3, la limite est relevée du supplément choisi.')}</p>` +
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
    if (aw) html += `<h3>7 ${t('Abfluss in Kaub an Tagen ohne Abflusswert', 'Débit à Kaub les jours sans valeur de débit')}</h3><p>${t('Das Jahrbuch der BfG endet am 31.12.2025, PEGELONLINE reicht 31 Tage zurück. Dazwischen liegt für Kaub nur der gemessene Wasserstand vor (Tagesmittel der WSV über das Pegelportal des HLNUG). Der Abfluss dieser Tage ist aus dem Wasserstand über die Abflusskurve gerechnet. So entsteht auch der amtliche Abfluss. Liegt der Wasserstand unter dem tiefsten Stützpunkt der Kurve, wird sie mit der Steigung der zwei tiefsten Stützpunkte um höchstens 12 cm verlängert; diese Tage sind eigens bezeichnet. Für Tage, an denen das Pegelportal keinen Wasserstand für Kaub liefert (Pegel um und unter 0 cm), ist der Wasserstand aus dem Pegel Bingen abgeleitet und die Kurve um höchstens 20 cm verlängert.', 'L’annuaire de la BfG s’arrête au 31.12.2025, PEGELONLINE remonte à 31 jours. Entre les deux, Kaub ne dispose que du niveau mesuré (moyennes journalières de la WSV via le portail du HLNUG). Le débit de ces jours est calculé à partir du niveau par la courbe de tarage. C’est ainsi qu’est établi le débit officiel. Si le niveau est sous le point le plus bas de la courbe, celle-ci est prolongée avec la pente des deux points les plus bas, de 12 cm au plus ; ces jours sont signalés.')}</p>` +
      f(`Q = Q<sub>1</sub> + (Q<sub>2</sub> − Q<sub>1</sub>) · (W − W<sub>1</sub>) / (W<sub>2</sub> − W<sub>1</sub>)`) +
      r(`${t('Seit', 'Depuis le')} ${datum(aw.ab)}: <b>${zahl(aw.tage)}</b> ${T.tageW} ${t('aus dem Wasserstand gerechnet, davon', 'calculés à partir du niveau, dont')} <b>${zahl(aw.davon_verlaengert)}</b> ${t('mit verlängerter Kurve', 'avec courbe prolongée')}. ${t('Tiefster Stützpunkt', 'Point le plus bas')}: ${zahl(aw.tiefster_stuetzpunkt[1], 0)} cm = ${zahl(aw.tiefster_stuetzpunkt[0])} m³/s.`) +
      `<p>${t('Der Wasserstand und damit die Fahrrinnentiefe sind an diesen Tagen gemessen, ausser an den aus Bingen abgeleiteten Tagen. Gerechnet ist sonst nur der Abfluss.', 'Le niveau, et donc la profondeur du chenal, sont mesurés ces jours-là. Seul le débit est calculé.')}</p>`;
    // 8 Fahrbarkeit je Abschnitt
    if (RP.length) html += `<h3>8 ${t('Fahrbarkeit je Abschnitt', 'Navigabilité par tronçon')}</h3><p>${t('Von Basel bis Iffezheim ist der Rhein staugeregelt; dort setzt die Seite keine Abhängigkeit vom Abfluss an. Unterhalb gilt je Abschnitt der Richtpegel mit seinem GlW und seiner Fahrrinnentiefe unter GlW (PEGELONLINE). Der simulierte Wasserstand ist der gemessene plus die Differenz auf der Bezugskurve des Pegels; Q ist der Abfluss am Bezugspegel, ΔQ die Wirkung der Simulation dort.', 'De Bâle à Iffezheim, le Rhin est régulé par barrages ; la page n’y suppose aucune dépendance au débit. En aval, chaque tronçon suit son échelle de référence, avec son GlW et sa profondeur sous le GlW (PEGELONLINE). Le niveau simulé est le niveau mesuré plus l’écart sur la courbe de l’échelle ; Q est le débit à la station de référence, ΔQ l’effet de la simulation à cet endroit.')}</p>` +
      f(`T = W − GlW + T<sub>GlW</sub> &nbsp;&nbsp; W<sub>sim</sub> = W + f(Q + ΔQ) − f(Q)`) +
      r(RP.map(p => `${h(p.name)}: GlW ${zahl(p.glw)} cm, T<sub>GlW</sub> ${zahl(p.tugl)} cm, ${t('Bezug', 'référence')} ${h(kurz(ST[p.bezug]))}, ${p.kurve.length} ${t('Stützpunkte', 'points')}`).join('<br>')) +
      `<p>${t(`Bezugskurven aus Tageswertpaaren des jüngsten Jahrbuchjahres und den Rohwerten danach. Mannheim und Oestrich haben keine eigene Abflussreihe; ihre Kurve bezieht sich auf Maxau bzw. Mainz und streut stärker. Bezugspegel und Abschnitte: ${h(meta.abschnitte_quelle || '')}. Für km 508–540 ist Oestrich der Bezugspegel; er fehlt im Jahrbuch, darum dient an Tagen ohne Wert der Pegel Bingen im selben Abschnitt, auf den GlW von Oestrich umgerechnet${RP.some(p => p.ersatz && p.ersatz.abweichung != null) ? ` (mittlere Abweichung an ${RP.find(p => p.ersatz).ersatz.tage_vergleich} gemeinsamen Tagen: ${zahl(RP.find(p => p.ersatz).ersatz.abweichung_betrag, 1)} cm)` : ''}. Im Abschnitt Kaub gilt die Fahrrinnentiefe von 190 cm bis St. Goar (km 557), danach 210 cm. Geprüft: Für Maxau und Kaub ergibt die Formel am 10. bis 14.11.2026 dieselben Werte wie die Grafik der WSV auf ELWIS. Die Stufen 30 und 60 cm unter GlW sind eine Darstellungswahl. Lage der Staustufen nach Wikidata.`, `Courbes tirées des couples journaliers de la dernière année de l’annuaire et des données brutes ensuite. Mannheim et Oestrich n’ont pas de série de débit propre ; leur courbe se rapporte à Maxau et à Mayence et disperse davantage. Échelles de référence et tronçons : ${h(meta.abschnitte_quelle || '')}. Pour les km 508–540, l’échelle de référence est Oestrich ; elle manque dans l’annuaire, donc les jours sans valeur on utilise l’échelle de Bingen dans le même tronçon, ramenée au GlW d’Oestrich. Dans le tronçon de Kaub, la profondeur de 190 cm vaut jusqu’à St. Goar (km 557), puis 210 cm. Vérifié : pour Maxau et Kaub, la formule donne du 10 au 14.11.2026 les mêmes valeurs que le graphique de la WSV sur ELWIS. Les paliers de 30 et 60 cm sous le GlW sont un choix de représentation. Position des barrages selon Wikidata.`)}</p>`;
    // 9 Auslastung der Flotte
    if (AUSL) html += `<h3>9 ${t('Nutzbare Ladekapazität eines Schiffs', 'Capacité de chargement utilisable d’un bateau')}</h3><p>${t('Bei Niedrigwasser wird nicht gesperrt; die Schiffe laden weniger. Die Kennzahl gibt an, welchen Teil seiner Ladekapazität ein Schiff bei diesem Pegel nutzen kann. Sie sagt nicht, wie viele Schiffe fahren. Die ZKR gibt Angaben von Rhenus Logistics für ein Schiff einer Trockengüter- und Tankerflotte mit durchschnittlicher Kapazität wieder: unter 134 cm am Pegel Kaub 50 %, unter 72 cm 25 %, unter 44 cm 15 % der Kapazität; unter 40 cm findet praktisch keine Binnenschifffahrt statt, einzelne Schiffe fahren bis 35 cm. Die 100 % bei 250 cm stammen von Contargo und gelten für ein Containerschiff mit 208 TEU. Die Werte betreffen also zwei verschiedene Schiffstypen. Zwischen den Stützpunkten rechnet die Seite linear; das ist eine Annahme.', 'En basses eaux, la navigation n’est pas fermée ; les bateaux chargent moins. L’indicateur donne la part de sa capacité de chargement qu’un bateau peut utiliser à ce niveau. Il ne dit pas combien de bateaux naviguent. La CCNR reprend des données de Rhenus Logistics pour un bateau d’une flotte de vraquiers et de citernes de capacité moyenne : sous 134 cm à l’échelle de Kaub 50 %, sous 72 cm 25 %, sous 44 cm 15 % de la capacité ; sous 40 cm, la navigation n’a pratiquement plus lieu, quelques bateaux naviguent jusqu’à 35 cm. Les 100 % à 250 cm viennent de Contargo et valent pour un porte-conteneurs de 208 EVP. Les valeurs concernent donc deux types de bateaux. Entre ces points, la page interpole linéairement ; c’est une hypothèse.')}</p>` +
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
  const FEHLEND = FR ? [
    ['Kaub et Worms 2026 : moyennes journalières contrôlées du niveau et du débit, y compris les jours sous 0 cm', 'Remplace les jours de Kaub déduits de l’échelle de Bingen et comble les jours manquants à Worms.', 'WSV, BfG'],
    ['Règlements de régulation des lacs avec les lignes de régulation (niveau de consigne par jour de l’année) : lacs du pied du Jura, lacs de Thoune et de Brienz, lac des Quatre-Cantons, lac de Zurich', 'Remplace l’hypothèse du palier 1a et montre ce qui est admis aujourd’hui.', 'Cantons de Berne, de Lucerne et de Zurich, OFEV'],
    ['Limite officielle de hautes eaux des lacs de Neuchâtel et de Morat', 'Remplace le début du degré de danger 4 aux paliers 1c, 2 et 3.', 'Cantons de Berne, de Neuchâtel, de Vaud et de Fribourg'],
    ['Capacité d’évacuation des barrages et débits minimaux (Port, Thoune, Interlaken, Lucerne, Zurich)', 'Remplace la limite forfaitaire de 20 % pour la retenue et le délestage.', 'Cantons, exploitants des barrages'],
    ['Maxau, Spire, Mannheim et Oestrich : moyennes journalières 2026 ; Neckar à Rockenau dès 2021', 'Ferme le bilan entre Bâle et Kaub et précise l’origine de l’eau en aval de Bâle.', 'WSV, BfG, LUBW'],
    ['Tables de tarage officielles de Spire et de Mannheim', 'Les courbes de la page s’écartent de 17 et 39 cm en basses eaux ; le relèvement simulé n’y est pas fiable.', 'WSV'],
    ['Chargement par centimètre d’enfoncement pour des bateaux types (tonnes ou EVP)', 'Remplace la courbe linéaire entre les quatre valeurs de la CCNR.', 'CCNR, armateurs, Ports rhénans suisses'],
    ['Règlement de régulation du lac de Constance de 1973, texte complet', 'Permet la comparaison directe avec le palier 3.', 'CHR, OFEV'],
    ['Niveaux des lacs : état de validation des valeurs journalières', 'Les niveaux des lacs n’ont pas d’état ; ceux de 2026 sont bruts.', 'OFEV'],
    ['Résultat officiel de la votation thurgovienne du 26 août 1973', 'Seule la date est attestée.', 'Archives d’État de Thurgovie'],
  ] : [
    ['Kaub und Worms 2026: geprüfte Tagesmittel von Wasserstand und Abfluss, auch für die Tage unter 0 cm', 'Ersetzt die aus dem Pegel Bingen abgeleiteten Tage in Kaub und schliesst die fehlenden Tage in Worms.', 'WSV, BfG'],
    ['Regulierreglemente der Seen mit den Regulierlinien (Soll-Seestand je Kalendertag): Jurarandseen, Thuner- und Brienzersee, Vierwaldstättersee, Zürichsee', 'Ersetzt die Annahme der Stufe 1a und zeigt, was heute zulässig ist.', 'Kantone Bern, Luzern und Zürich, BAFU'],
    ['Amtliche Hochwassergrenze für Neuenburger- und Murtensee', 'Ersetzt den Beginn der Gefahrenstufe 4 in den Stufen 1c, 2 und 3.', 'Kantone Bern, Neuenburg, Waadt und Freiburg'],
    ['Abflusskapazität der Wehre und Mindestabflüsse (Port, Thun, Interlaken, Luzern, Zürich)', 'Ersetzt die pauschale Grenze von 20 % für Rückhalt und Entlastung.', 'Kantone, Betreiber der Wehre'],
    ['Maxau, Speyer, Mannheim und Oestrich: Tagesmittel 2026; Neckar in Rockenau ab 2021', 'Schliesst die Bilanz zwischen Basel und Kaub und klärt die Herkunft des Wassers unterhalb von Basel.', 'WSV, BfG, LUBW'],
    ['Amtliche Abflusstafeln für Speyer und Mannheim', 'Die Kurven der Seite liegen bei Niedrigwasser 17 und 39 cm daneben; die simulierte Hebung ist dort nicht belastbar.', 'WSV'],
    ['Ladung je Zentimeter Abladetiefe für typische Schiffe (Tonnen oder TEU)', 'Ersetzt die lineare Kurve zwischen den vier Werten der ZKR.', 'ZKR, Reedereien, Schweizerische Rheinhäfen'],
    ['Regulierreglement für den Bodensee von 1973 im Wortlaut', 'Erlaubt den direkten Vergleich mit Stufe 3.', 'KHR, BAFU'],
    ['Seestände: Freigabestatus der Tageswerte', 'Die Seestände tragen keinen Status; die Werte von 2026 sind roh.', 'BAFU'],
    ['Amtliches Ergebnis der Thurgauer Abstimmung vom 26. August 1973', 'Belegt ist nur das Datum.', 'Staatsarchiv Thurgau'],
  ];
  $('fehlend').innerHTML = `<table><thead><tr><th></th><th>${T.fWas}</th><th>${T.fWozu}</th><th>${T.fWer}</th></tr></thead><tbody>${FEHLEND.map((z, i) => `<tr><td>${i + 1}</td>${z.map(x => `<td>${h(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(FR ? (QUELLEN_FR[q.kurz] || q.text) : q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Lacs : OFEV, fiches « Seeregulierung » (2020)' : 'Seen: BAFU, Faktenblätter «Seeregulierung» (2020)'} – <a href="https://www.bafu.admin.ch/de/wichtige-seeregulierungen">bafu.admin.ch/de/wichtige-seeregulierungen</a>; IGKB</li>` +
    `<li>${FR ? 'Taux de chargement : CCNR, document de réflexion « Act now! » sur les basses eaux, éd. 3.0 (2023)' : 'Nutzbare Ladekapazität: ZKR, Reflexionspapier «Act now!» zum Niedrigwasser, Ed. 3.0 (2023)'} – <a href="https://www.ccr-zkr.org/files/documents/infovoienavigable/Act_now_3_0_${FR ? 'fr' : 'de'}.pdf">ccr-zkr.org</a></li>` +
    `<li>${FR ? 'Lac de Constance : IGKB, « Die Regulierung des Bodensees », rapport des experts, 70e session (2024) ; CHR, rapport I-26 (2018)' : 'Bodensee: IGKB, «Die Regulierung des Bodensees», Bericht der Sachverständigen, 70. Kommissionstagung (2024); KHR, Bericht I-26 (2018)'} – <a href="https://www.igkb.org/fileadmin/user_upload/Downloads/Publikationen/Protokoll_Kommissionstagungen/KT_2024/Anlage_TOP_10_KT_2024_Regulierung_des_Bodensees.pdf">igkb.org</a> · <a href="https://www.chr-khr.org/sites/default/files/chrpublications/chr_i-26.pdf">chr-khr.org</a></li>` +
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

  // ---- Kapitel 1: Karte mit Schritten
  const RAHMEN1 = [[[49.55, 7.1], [50.45, 8.7]], [[49.55, 7.1], [50.45, 8.7]], [[48.7, 7.4], [50.3, 9.1]], [[47.4, 6.9], [49.0, 8.7]], [[46.3, 6.6], [47.9, 9.9]], [[46.6, 6.9], [50.2, 9.9]]];
  const NETZSCHRITT = 5;                        // Schritt mit allen Messstellen statt der Karte
  const sc1 = scrolly('st1', 7, i => { const netz = i === NETZSCHRITT; $('netzfig').hidden = !netz; document.querySelector('#sc1 .karte').hidden = netz;
    if (!netz) { map.invalidateSize(); map.flyToBounds(RAHMEN1[i > NETZSCHRITT ? i - 1 : i], { duration: .8 }); } });
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
      s += `<path d="M${x(a.l)},${y(a.k)} V${a.l === b.l ? y(b.k) : y(b.k) - zh / 2} H${x(b.l)} V${y(b.k)}" fill="none" stroke="${k.zufluss || a.l !== b.l ? '#000' : '#000'}" stroke-width="${a.l === b.l ? 3 : 1.5}"/>`; }
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
  function kapitel1(R) {
    const nz = netzZeichnen(R);
    if (nz) { const w = nz.werte, f = id => w[id] && w[id].q != null ? zahl(w[id].q) : '–', r = id => w[id] && w[id].r != null ? vz(w[id].r, 0) : '–';
      const ktr = w['2205'] && w['2016'] && w['2018'] && w['2243'] && [w['2205'], w['2016'], w['2018'], w['2243']].every(x => x.q != null) ? w['2205'].q - w['2016'].q - w['2018'].q - w['2243'].q : null;
      sc1.fuelle(5, LL(`<h3>Gemessen an ${BAUM.length} Messstellen</h3><p>Jede Zahl rechts ist ein gemessenes Tagesmittel in m³/s: BAFU für die Schweiz, Wasserstrassenverwaltung (WSV) für Deutschland. Die Linien zeigen, welche Messstelle in welche fliesst.</p><p>Was eine Messstelle mehr führt als die Messstellen direkt oberhalb, kommt aus dem Zwischengebiet (graue Zahl). Basel: ${f('2289')} − Rheinfelden ${f('2091')} = <b>${r('2289')} m³/s</b> aus Birs, Ergolz und Wiese. Kaub: ${f('25700100')} − Mainz ${f('25100100')} = <b>${r('25700100')} m³/s</b>, vor allem aus der Nahe.</p>${ktr != null ? `<p>Probe: Die Aare in Untersiggenthal (${f('2205')}) sollte gleich viel führen wie Brugg, Reuss und Limmat zusammen. Die Abweichung beträgt ${vz(ktr, 0)} m³/s.</p>` : ''}<p class="hinweis">Das Wasser braucht von Basel bis Kaub rund zwei Tage. Darum zählt für Kaub der Abfluss in Basel und oberhalb zwei Tage früher, in Maxau und am Neckar einen Tag früher. ° Rohwert · * aus dem Wasserstand gerechnet.</p>`,
        `<h3>Mesuré à ${BAUM.length} stations</h3><p>Chaque nombre à droite est une moyenne journalière mesurée en m³/s : OFEV pour la Suisse, administration allemande des voies navigables (WSV) pour l’Allemagne. Les lignes montrent quelle station se déverse dans laquelle.</p><p>Ce qu’une station porte de plus que les stations situées juste en amont vient du bassin intermédiaire (nombre gris). Bâle : ${f('2289')} − Rheinfelden ${f('2091')} = <b>${r('2289')} m³/s</b> de la Birse, de l’Ergolz et de la Wiese. Kaub : ${f('25700100')} − Mayence ${f('25100100')} = <b>${r('25700100')} m³/s</b>, surtout de la Nahe.</p>${ktr != null ? `<p>Contrôle : l’Aar à Untersiggenthal (${f('2205')}) devrait porter autant que Brugg, la Reuss et la Limmat ensemble. L’écart est de ${vz(ktr, 0)} m³/s.</p>` : ''}<p class="hinweis">L’eau met environ deux jours de Bâle à Kaub. Pour Kaub, le débit de Bâle et de l’amont compte donc deux jours plus tôt, celui de Maxau et du Neckar un jour plus tôt. ° valeur brute · * calculé à partir du niveau.</p>`)); }
    const tagOk = tagAnsicht() && R.Y && PK, tag = tagOk ? datum(isoTag(Z.jahr, R.i1)) : (R.datumText || ''), m = tagOk ? pegelstand(R.Y, OHNE, PK, R.i1, false) : null, zk = m && zustand(m.w, PK);
    const aK = tagOk ? (() => { const alt = NETZ; let a = anteile(R.Y.q, KAUB, R.i1, R.i1); if (!a) { NETZ = NETZ === VOLL ? KURZ : VOLL; a = anteile(R.Y.q, KAUB, R.i1, R.i1); NETZ = alt; } return a; })() : (R.je && R.je[KAUB]), qK = aK ? aK.ziel_mittel : null, A = abschnitte(R).filter(x => x.zm), unter = A.filter(x => x.zm.fehl > 0), tief = A.slice().sort((a, b) => (a.zm.tiefe - a.p.tugl) - (b.zm.tiefe - b.p.tugl))[0];
    const tOben = Math.max(...RP.map(p => p.tugl)), reg = meta.seen.filter(s => s.reguliert), fr = reg.reduce((s, x) => s + x.flaeche_km2, 0), fb = meta.seen.filter(s => !s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0);
    const qB = aK ? abfluss(aK, BASEL) : null, stufen = meta.staustufen.length - 1;
    sc1.fuelle(0, LL(`<h3>Der Pegel Kaub</h3><p>Unterhalb von Iffezheim hält die deutsche Wasserstrassenverwaltung beim GlW eine Fahrrinnentiefe von ${zahl(tOben)} cm vor, zwischen Budenheim bei Mainz und St. Goar ${zahl(PK.tugl)} cm. Das ist ein Sollwert, keine Garantie. Diese Strecke ist die flachste, der Pegel Kaub liegt darin. Die ZKR gibt die Auslastung der Schiffe nach dem Pegel Kaub an (ZKR, 2023).</p>`,
      `<h3>L’échelle de Kaub</h3><p>En aval d’Iffezheim, l’administration allemande des voies navigables maintient au GlW une profondeur de chenal de ${zahl(tOben)} cm, et de ${zahl(PK.tugl)} cm entre Budenheim, près de Mayence, et St. Goar. C’est une valeur de consigne, pas une garantie. Ce tronçon est le moins profond, et l’échelle de Kaub s’y trouve. La CCNR exprime le taux de chargement des bateaux en fonction de l’échelle de Kaub (CCNR, 2023).</p>`) +
      (m ? `<p>${h(tag)}${DP}${LL('Pegel Kaub', 'échelle de Kaub')} <b>${zahl(m.w)} cm</b>${qK != null ? `, ${LL('Abfluss', 'débit')} <b>${zahl(qK)} m³/s</b>` : ''}.</p>` : ''));
    sc1.fuelle(1, LL(`<h3>Der Bezugswert GlW</h3><p>Der gleichwertige Wasserstand (GlW) ist der Niedrigwasser-Bezugswert der Schifffahrt. Er wird im langjährigen Mittel an 20 eisfreien Tagen im Jahr unterschritten. In Kaub liegt er bei ${zahl(GLW)} cm, das entspricht ${zahl(Q_GLW)} m³/s.</p><p class="formel">Fahrrinnentiefe = Pegel − GlW + ${zahl(TUG)} cm</p>`,
      `<h3>Le GlW, niveau de référence</h3><p>L’étiage équivalent (GlW) est le niveau de référence de la navigation en basses eaux. En moyenne pluriannuelle, le niveau descend en dessous pendant 20 jours sans glace par an. À Kaub, il se situe à ${zahl(GLW)} cm, soit ${zahl(Q_GLW)} m³/s.</p><p class="formel">Profondeur du chenal = niveau − GlW + ${zahl(TUG)} cm</p>`) +
      (zk ? `<p>${h(tag)}${DP}${zahl(m.w)} − ${zahl(GLW)} + ${zahl(TUG)} = <b>${zahl(zk.tiefe)} cm</b>. ${LL('Nutzbare Ladekapazität eines Schiffs bei diesem Stand, zwischen den Werten der ZKR linear geschätzt', 'Capacité de chargement utilisable d’un bateau à ce niveau, estimée linéairement entre les valeurs de la CCNR')}${DP}<b>${zahl(auslastung(m.w))} %</b>${m.w < AUSL.keine_unter ? LL(', unter 40 cm findet praktisch keine Schifffahrt mehr statt', ', sous 40 cm la navigation n’a pratiquement plus lieu') : ''} (${LL('ZKR', 'CCNR')}, 2023).</p>` : ''));
    sc1.fuelle(2, LL(`<h3>Sieben Abschnitte bis Kaub</h3><p>Von Iffezheim bis Kaub fliesst der Rhein frei. Die Strecke ist in ${RP.length} Abschnitte geteilt, jeder hat einen Richtpegel mit eigenem GlW. Auf der Karte heisst eine durchgezogene Linie volle Fahrrinnentiefe. Je kürzer die Striche, desto weiter liegt der Pegel unter dem GlW.</p>`,
      `<h3>Sept tronçons jusqu’à Kaub</h3><p>D’Iffezheim à Kaub, le Rhin coule librement. Le parcours est divisé en ${RP.length} tronçons, chacun avec une échelle de référence et son propre GlW. Sur la carte, un trait plein signifie pleine profondeur du chenal. Plus les tirets sont courts, plus le niveau est sous le GlW.</p>`) +
      (A.length ? `<p>${h(tag)}${DP}${LL(`${unter.length} von ${A.length} Abschnitten mit Wert liegen unter dem GlW.`, `${unter.length} tronçons sur ${A.length} avec valeur sont sous le GlW.`)} ${tief && unter.length ? LL(`Am weitesten darunter: ${h(tief.p.name)} mit <b>${zahl(tief.zm.tiefe)} cm</b> statt ${zahl(tief.p.tugl)} cm.`, `Le plus bas : ${h(tief.p.name)} avec <b>${zahl(tief.zm.tiefe)} cm</b> au lieu de ${zahl(tief.p.tugl)} cm.`) : ''}</p>` : ''));
    sc1.fuelle(3, LL(`<h3>Basel bis Iffezheim ist gestaut</h3><p>Zwischen Basel und Iffezheim (Rheinkilometer ${zahl(meta.stau.von)} bis ${zahl(meta.stau.bis)}) halten ${stufen} Staustufen den Wasserstand. Die Fahrrinnentiefe hängt dort nicht vom Abfluss ab. Darum misst diese Seite die Fahrbarkeit in Kaub und nicht in Basel.</p>`,
      `<h3>De Bâle à Iffezheim, le Rhin est canalisé</h3><p>Entre Bâle et Iffezheim (kilomètres ${zahl(meta.stau.von)} à ${zahl(meta.stau.bis)} du Rhin), ${stufen} barrages maintiennent le niveau. La profondeur du chenal n’y dépend pas du débit. C’est pourquoi cette page mesure la navigabilité à Kaub et non à Bâle.</p>`) +
      (qB != null && qK ? `<p>${LL(`${h(tag)}: <b>${zahl(qB)} m³/s</b> aus Basel, ${zahl(100 * qB / qK)} % des Abflusses in Kaub.`, `${h(tag)} : <b>${zahl(qB)} m³/s</b> de Bâle, soit ${zahl(100 * qB / qK)} % du débit à Kaub.`)}</p>` : ''));
    sc1.fuelle(4, LL(`<h3>Seen und Zuflüsse</h3><p>Oberhalb von Basel zeigt die Strichbreite den Abfluss. Dreiecke sind regulierte Seen: Ein Wehr unterhalb des Sees bestimmt, wie viel Wasser weiterfliesst. Der Kreis ist der Bodensee, er hat kein Wehr.</p><p>Die ${reg.length} regulierten Seen haben zusammen <b>${zahl(fr)} km²</b>, der Bodensee <b>${zahl(fb)} km²</b>.</p>`,
      `<h3>Lacs et affluents</h3><p>En amont de Bâle, la largeur du trait indique le débit. Les triangles sont des lacs régulés : un barrage en aval du lac détermine combien d’eau s’écoule. Le cercle est le lac de Constance, qui n’a pas de barrage.</p><p>Les ${reg.length} lacs régulés totalisent <b>${zahl(fr)} km²</b>, le lac de Constance <b>${zahl(fb)} km²</b>.</p>`));
    const g = aK ? gruppenWerte(aK).filter(x => x.da) : [];
    sc1.fuelle(6, LL(`<h3>Herkunft des Wassers in Kaub</h3>`, `<h3>Origine de l’eau à Kaub</h3>`) + (aK ? `<p>${h(tag)}${DP}<b>${zahl(qK)} m³/s</b> ${LL('in Kaub, geteilt nach Herkunft. Jeder Teil ist gemessen oder als Rest zwischen zwei Messstellen gerechnet.', 'à Kaub, répartis selon l’origine. Chaque part est mesurée ou calculée comme reste entre deux stations.')}</p>` +
      `<div class="band">${g.map(x => `<i class="${x.m}" style="flex:${Math.max(0, x.v).toFixed(1)} 0 0"></i>`).join('')}</div><div class="herk">${g.map(x => `<i class="${x.m}"></i><span>${h(x.n)}</span><b>${qz(x.v)}</b><b>${zahl(100 * x.v / qK)} %</b>`).join('')}</div>` : `<p>${T.keine}</p>`));
  }

  // ---- Kapitel 2: die Jahre
  const K2 = [2019, 2018, 2022, LETZTES].filter((j, i, a) => meta.jahre.includes(j) && a.indexOf(j) === i), D2 = {};
  let jetzt2 = null;
  const sc2 = scrolly('st2', K2.length + 2, i => zeige2(i));     // Schritt 0: alle Jahre übereinander
  let ALLE = null;                              // { jahre: [[Jahr, Abfluss Kaub je Tag]], zaehl }
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
      $('jahrlegende').innerHTML = `<span><i style="border-color:#a8a8a8"></i>${T.aaAndere}</span><span><i></i>2018</span><span><i class="blau"></i>${LETZTES}</span><span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#g_e1)" stroke="#000"/></svg>${T.gUnter} 2018</span><span><svg width="24" height="12" aria-hidden="true"><rect width="24" height="12" fill="url(#s_e1)" stroke="#003399"/></svg>${T.gUnter} ${LETZTES}</span><span>${T.gSchnitt}</span>`;
      csvKnopf(fig, () => 'rhein-kaub-alle-jahre', () => ({ titel: `${T.aaTitel} ${ALLE.jahre[0][0]}–${LETZTES}`, kopf: ['tag_im_jahr', ...ALLE.jahre.map(a => `Q_Kaub_${a[0]}_m3s`)], zeilen: Array.from({ length: 366 }, (_, k) => [k + 1, ...ALLE.jahre.map(a => a[1][k] == null ? null : a[1][k])]) }));
      return; }
    i -= 1;
    const j = K2[Math.min(i, K2.length - 1)], d = D2[j]; if (!d) return; jetzt2 = i + 1;
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
    const liste = [];
    for (const j of meta.jahre) { const Y = await jahr(j); if (!Y || !Y.q[KAUB] || Y.q[KAUB].filter(v => v != null).length < 300 && j !== LETZTES) continue; liste.push([j, Y.q[KAUB], kaubJahr(Y, OHNE)]); }
    ALLE = { jahre: liste.map(([j, q]) => [j, q]) };
    const mit = liste.filter(a => a[2].u0 > 0), viel = liste.slice().sort((a, b) => b[2].u0 - a[2].u0).slice(0, 3);
    sc2.fuelle(0, LL(`<h3>Alle Jahre übereinander</h3><p>Jede graue Linie ist ein Jahr seit ${liste[0][0]}: der Abfluss in Kaub Tag für Tag, links in m³/s, rechts als Pegel in cm. Schwarz ist 2018, blau ${LETZTES}. Unter der gestrichelten Linie liegt Kaub unter dem GlW.</p><p>In <b>${mit.length} von ${liste.length} Jahren</b> lag Kaub an mindestens einem Tag unter dem GlW. Am meisten Tage: ${viel.map(a => `${a[0]} (${a[2].u0})`).join(', ')}. Die Schritte darunter zeigen einzelne Jahre.</p>`,
      `<h3>Toutes les années superposées</h3><p>Chaque ligne grise est une année depuis ${liste[0][0]} : le débit à Kaub jour après jour, à gauche en m³/s, à droite en niveau à l’échelle, en cm. En noir 2018, en bleu ${LETZTES}. Sous la ligne en tirets, Kaub est sous le GlW.</p><p>Pendant <b>${mit.length} années sur ${liste.length}</b>, Kaub est passé au moins un jour sous le GlW. Le plus de jours : ${viel.map(a => `${a[0]} (${a[2].u0})`).join(', ')}. Les étapes suivantes montrent des années choisies.</p>`));
    for (const j of K2) {
      const Y = await jahr(j); if (!Y || !Y.q[KAUB] || !PK) continue;
      const k = kaubJahr(Y, OHNE), t = tiefsterTag(Y), bed = bedarfGlw(Y), ger = Y.q[KAUB].reduce((n, x, i) => n + (x != null && GERECHNET(statusAm(Y, KAUB, i))), 0);
      D2[j] = { Y, k, t, bed, ger };
      const letzter = j === LETZTES ? (() => { let i = Y.q[KAUB].length - 1; while (i > 0 && Y.q[KAUB][i] == null) i--; return datum(isoTag(j, i)); })() : null;
      const kopf = k.u0 ? LL(`<h3>${j}: ${k.u0} Tage unter dem GlW</h3>`, `<h3>${j} : ${k.u0} jours sous le GlW</h3>`) : LL(`<h3>${j}: kein Tag unter dem GlW</h3>`, `<h3>${j} : aucun jour sous le GlW</h3>`);
      const text = k.u0 ? LL(`<p>An <b>${k.u0} Tagen</b> lag der Pegel Kaub unter dem GlW${k.k0 ? `, an <b>${k.k0} Tagen</b> unter ${zahl(AUSL.keine_unter)} cm. Unter diesem Stand findet laut ZKR praktisch keine Schifffahrt mehr statt, einzelne Schiffe fahren bis 35 cm (ZKR, 2023)` : ''}. Tiefster Stand: <b>${zahl(t.w)} cm</b> am ${datum(isoTag(j, t.i))}, Fahrrinnentiefe ${zahl(k.t0)} cm statt ${zahl(PK.tugl)} cm.</p><p>Um den GlW an allen Tagen zu halten, fehlten <b>${zahl(bed)} Mio. m³</b>. Das ist die schraffierte Fläche unter der GlW-Linie.</p>`,
        `<p>Le niveau à l’échelle de Kaub est resté <b>${k.u0} jours</b> sous le GlW${k.k0 ? `, dont <b>${k.k0} jours</b> sous ${zahl(AUSL.keine_unter)} cm. Sous ce niveau, selon la CCNR, la navigation n’a pratiquement plus lieu ; quelques bateaux naviguent jusqu’à 35 cm (CCNR, 2023)` : ''}. Niveau le plus bas : <b>${zahl(t.w)} cm</b> le ${datum(isoTag(j, t.i))}, profondeur du chenal ${zahl(k.t0)} cm au lieu de ${zahl(PK.tugl)} cm.</p><p>Pour tenir le GlW tous les jours, il manquait <b>${zahl(bed)} mio m³</b>. C’est la surface hachurée sous la ligne du GlW.</p>`)
        : LL(`<p>Die schwarze Linie ist der Abfluss in Kaub, links in m³/s, rechts als Pegel in cm. Die gestrichelte Linie ist der GlW. ${j} blieb der Pegel an allen Tagen darüber. Tiefster Stand: <b>${zahl(t.w)} cm</b> am ${datum(isoTag(j, t.i))}, Fahrrinnentiefe ${zahl(k.t0)} cm.</p>`,
          `<p>La ligne noire est le débit à Kaub, à gauche en m³/s, à droite en niveau à l’échelle, en cm. La ligne en tirets est le GlW. En ${j}, le niveau est resté au-dessus tous les jours. Niveau le plus bas : <b>${zahl(t.w)} cm</b> le ${datum(isoTag(j, t.i))}, profondeur du chenal ${zahl(k.t0)} cm.</p>`);
      const abg = (Y.s[KAUB] || []).length ? Y.q[KAUB].reduce((n, x, i) => n + (x != null && statusAm(Y, KAUB, i) === 9), 0) : 0;
      const zusatz = (letzter ? LL(`<p class="hinweis">Werte bis ${letzter}.`, `<p class="hinweis">Valeurs jusqu’au ${letzter}.`) : '') + (ger ? `${letzter ? ' ' : '<p class="hinweis">'}${LL(`An ${ger} Tagen ist der Abfluss aus dem Wasserstand gerechnet.${abg ? ` An ${abg} davon fehlt der Wert für Kaub, weil der Pegel um oder unter 0 cm lag. Diese Tage sind aus dem Pegel Bingen abgeleitet.` : ''}`, `Sur ${ger} jours, le débit est calculé à partir du niveau.${abg ? ` Pour ${abg} d’entre eux, la valeur de Kaub manque, car le niveau était proche de 0 cm ou en dessous. Ces jours sont déduits de l’échelle de Bingen.` : ''}`)}` : '') + (letzter || ger ? '</p>' : '');
      sc2.fuelle(K2.indexOf(j) + 1, kopf + text + zusatz);
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
        sc2.fuelle(K2.length + 1, LL(`<h3>${j}: wo das Wasser fehlte</h3><p>In den sieben trockensten Tagen (${d.von}–${d.bis}) flossen in Kaub <b>${zahl(a.ziel_mittel)} m³/s</b>. Das mittlere Niedrigwasser der Jahre ${d.ref.periode} liegt bei ${zahl(ref.nm7q.ziel_mittel)} m³/s. Die Grafik teilt beide Werte nach Herkunft.</p><p>Am meisten fehlte: ${h(fehl.n)}, <b>${vz(fehl.v - fehl.ref, 0)} m³/s</b>. Warum es fehlte, lässt sich aus den Abflüssen nicht ablesen.</p>`,
          `<h3>${j} : où l’eau a manqué</h3><p>Pendant les sept jours les plus secs (${d.von}–${d.bis}), le débit à Kaub était de <b>${zahl(a.ziel_mittel)} m³/s</b>. L’étiage moyen des années ${d.ref.periode} est de ${zahl(ref.nm7q.ziel_mittel)} m³/s. Le graphique répartit les deux valeurs selon l’origine.</p><p>Le plus grand manque : ${h(fehl.n[0].toLowerCase() + fehl.n.slice(1))}, <b>${vz(fehl.v - fehl.ref, 0)} m³/s</b>. Les débits ne permettent pas de dire pourquoi elle a manqué.</p>`));
      }
    }
    zeige2(sc2.jetzt()); typoFr($('k2'));
  }

  // ---- Kapitel 3: Rückhalt in drei Stufen
  const K3 = [2011, 2015, 2018, 2022, LETZTES].filter((j, i, a) => meta.jahre.includes(j) && a.indexOf(j) === i), D3 = {};
  let jahr3 = K3[K3.length - 1];
  const sc3 = scrolly('st3', 8, i => zeige3(i));
  function zeige3(i) {
    const d = D3[jahr3]; if (!d) return;
    const KETTE = 2; $('kettefig').hidden = i !== KETTE; $('szenfig').hidden = i === KETTE; if (i === KETTE) { ketteZeichnen(d); return; }
    const st = [0, '1b', '1b', '1b', '1b', '2', '3', '3'][i], z = st ? d.st[st] : null, beide = i >= 3;   // Schritt 1 führt die gerechnete Linie ein, Schritt 2 die Betriebsregel
    jahrGrafik($('szen'), d.Y, { titel: `${T.gTitel} ${jahr3}${st ? ` · ${T['st' + st]}` : ''}`, sim: z ? z.v.S.q[KAUB] : null, sim2: z && beide ? z.r.S.q[KAUB] : null, speicher: z && z.v.S.O ? z.v.S.O.speicher : null, hw: z && beide && z.r.S.O ? z.r.S.O.ueber : null });
    $('szenlegende').innerHTML = jahrLegende(!!z, !!z && beide, !!z && beide);
    csvKnopf($('szenfig'), () => `rhein-kaub-${jahr3}-stufe-${st}`, () => ({ titel: `${T.gTitel} ${jahr3}${st ? ` · ${T['st' + st]}` : ''}`, ...jahrCsv(d.Y, z) }));
  }
  const ergebnis = (d, z) => `<div class="rollen"><table class="erg"><thead><tr><th></th><th class="z">${T.gemessen}</th><th class="z">${T.eBest}</th><th class="z">${T.eRegel}</th></tr></thead><tbody>` +
    [[T.nUnter, d.k.u0, z.v.k.u1, z.r.k.u1], [T.aTage, d.k.k0, z.v.k.k1, z.r.k.k1], [T.nTief, d.k.t0, z.v.k.t1, z.r.k.t1], [`${T.aFlotte} %`, d.k.a0, z.v.k.a1, z.r.k.a1], [`${T.genutzt} ${T.mio}`, null, z.v.genutzt, z.r.genutzt], [T.ueberT, null, z.v.ueber, z.r.ueber]]
      .map((r, nr) => `<tr${nr === 5 && (r[2] || r[3]) ? ' class="hw"' : ''}><td>${r[0]}</td>${r.slice(1).map((v, i) => `<td class="z${i && nr !== 5 ? ' blau' : ''}">${zahl(v)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';
  // Rechenweg an einem Tag: von den Seen über die Messstellen bis zum Pegel Kaub (Stufe 1b, mit Voraussicht)
  function ketteDaten(d) {
    const z = d.st['1b'].v, S = z.S, O = S.O, Y = d.Y, q = Y.q[KAUB]; if (!O) return null;
    let k = -1; q.forEach((v, i) => { if (v != null && i > 0 && O.netto[i] > .5 && (k < 0 || v < q[k])) k = i; });
    if (k < 0) return null;
    const alt = NETZ; NETZ = VOLL; const E = { ...einzug(KAUB) }; NETZ = alt;
    const seen = O.seeId.map((id, s) => ({ id, a: (O.see[s][k - 1] - O.see[s][k]) / SEK })).filter(x => x.a > .05).sort((a, b) => b.a - a.a);
    const stellen = SEEGRUPPEN.map(([, ids, kn]) => kn).filter(kn => seen.some(x => SEE[x.id].knoten === kn || SEE[x.id].knoten in einzug(kn)) && kn in E)
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
  async function kapitel3() {
    const j = jahr3; let d = D3[j];
    if (!d) { const Y = await jahr(j); await nachbarn(j); if (!Y || !Y.q[KAUB] || !PK) return;
      d = D3[j] = { Y, k: kaubJahr(Y, OHNE), bed: bedarfGlw(Y), st: {} };
      for (const st of STUFEN) d.st[st] = { v: szenario(Y, st, 'glw'), r: szenario(Y, st, 'regel') }; }
    if (j !== jahr3) return;
    const kk = $('k3kopf'); kk.innerHTML = `<label class="jahrzahl"><span>${T.jkRechnet}</span><select class="jahrwahl" aria-label="${h(T.jkRechnet)}">${meta.jahre.filter(x => x >= 2008).reverse().map(x => `<option${x === j ? ' selected' : ''}>${x}</option>`).join('')}</select></label>`;
    kk.querySelector('select').addEventListener('change', e => { jahr3 = +e.target.value; kapitel3(); });
    const f3 = (i, html) => sc3.fuelle(i, `<p class="jahrmarke">${T.jahr} ${j}</p>` + html);
    const reg = meta.seen.filter(s => s.reguliert), fr = reg.reduce((s, x) => s + x.flaeche_km2, 0), fb = meta.seen.filter(s => !s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0), cm1 = fr / 100;
    const q30 = 100e6 / (30 * SEK), hub = q => wAusQ(Q_GLW) - wAusQ(Q_GLW - q), frei = stufeCM(d.Y, '1b', 0), v1 = reg.reduce((s, x) => s + frei[x.id] * x.flaeche_km2 / 100, 0);
    f3(0, LL(`<h3>Was ein Zentimeter ist</h3><p>Die regulierten Seen haben zusammen ${zahl(fr)} km². Ein Zentimeter mehr Seestand sind <b>${zahl(cm1, 1)} Mio. m³</b>. 100 Mio. m³, über 30 Tage abgegeben, sind ${zahl(q30, 1)} m³/s. Das hebt den Pegel Kaub beim GlW um rund ${zahl(hub(q30))} cm.</p><p>${j} fehlten für den GlW an allen Tagen <b>${zahl(d.bed)} Mio. m³</b>. Das wären ${zahl(d.bed / cm1)} cm auf allen regulierten Seen.</p>`,
      `<h3>Ce que vaut un centimètre</h3><p>Les lacs régulés totalisent ${zahl(fr)} km². Un centimètre de niveau en plus représente <b>${zahl(cm1, 1)} mio m³</b>. 100 mio m³ restitués en 30 jours font ${zahl(q30, 1)} m³/s. Cela relève le niveau à Kaub d’environ ${zahl(hub(q30))} cm au voisinage du GlW.</p><p>En ${j}, il manquait <b>${zahl(d.bed)} mio m³</b> pour tenir le GlW tous les jours. Cela ferait ${zahl(d.bed / cm1)} cm sur tous les lacs régulés.</p>`));
    const b1 = d.st['1b'].v, qm = Math.min(...d.Y.q[KAUB].filter(x => x != null)), qs = Math.min(...b1.S.q[KAUB].filter(x => x != null));
    const K = ketteDaten(d);
    if (K) f3(2, LL(`<h3>Rechenweg an einem Tag</h3><p>Die Grafik rechnet den tiefsten Tag ${j} mit Rückhalt durch, von den Seen bis zum Pegel Kaub. Ausgangspunkt sind gemessene Werte: Seestände und Abflüsse des BAFU, Abfluss und Pegel Kaub der WSV.</p><p>Die Seen geben zusammen <b>${vz(K.seen.reduce((a, x) => a + x.a, 0), 0)} m³/s</b> ab. Um so viel steigt der gemessene Abfluss unterhalb der Seen. Zwei Tage später kommt das Wasser in Kaub an: ${zahl(K.kaub.m)} → <b>${zahl(K.kaub.s)} m³/s</b>.</p><p>Den Pegel liefert die Abflusskurve von Kaub, gebildet aus den Wertepaaren Wasserstand und Abfluss des Jahrbuchs. Sie gibt für ${zahl(K.kaub.m)} m³/s ${zahl(kurve(KURVE, K.kaub.m, 0, 1))} cm und für ${zahl(K.kaub.s)} m³/s ${zahl(kurve(KURVE, K.kaub.s, 0, 1))} cm. Der gemessene Pegel ${zahl(K.pm.w)} cm steigt um diese Differenz auf <b>${zahl(K.ps.w)} cm</b>. Die Fahrrinnentiefe steigt von ${zahl(K.tm.tiefe)} auf <b>${zahl(K.ts.tiefe)} cm</b>.</p>`,
      `<h3>Le calcul d’une journée</h3><p>Le graphique calcule le jour le plus bas de ${j} avec retenue, des lacs jusqu’à l’échelle de Kaub. Le point de départ sont des valeurs mesurées : niveaux des lacs et débits de l’OFEV, débit et niveau de Kaub de la WSV.</p><p>Les lacs restituent ensemble <b>${vz(K.seen.reduce((a, x) => a + x.a, 0), 0)} m³/s</b>. Le débit mesuré en aval des lacs augmente d’autant. Deux jours plus tard, l’eau arrive à Kaub : ${zahl(K.kaub.m)} → <b>${zahl(K.kaub.s)} m³/s</b>.</p><p>Le niveau découle de la courbe de tarage de Kaub, établie à partir des couples niveau et débit de l’annuaire. Elle donne ${zahl(kurve(KURVE, K.kaub.m, 0, 1))} cm pour ${zahl(K.kaub.m)} m³/s et ${zahl(kurve(KURVE, K.kaub.s, 0, 1))} cm pour ${zahl(K.kaub.s)} m³/s. Le niveau mesuré de ${zahl(K.pm.w)} cm augmente de cette différence pour atteindre <b>${zahl(K.ps.w)} cm</b>. La profondeur du chenal passe de ${zahl(K.tm.tiefe)} à <b>${zahl(K.ts.tiefe)} cm</b>.</p>`));
    else f3(2, LL(`<h3>Rechenweg an einem Tag</h3><p>${j} gibt es keinen Tag, an dem die Seen Wasser abgeben.</p>`, `<h3>Le calcul d’une journée</h3><p>En ${j}, il n’y a aucun jour où les lacs restituent de l’eau.</p>`));
    f3(1, LL(`<h3>Wie der Rückhalt wirkt</h3><p>Ab hier zeigt die Grafik eine zweite, gerechnete Linie. Die Seen halten Wasser zurück, solange Kaub über dem GlW liegt, und geben es ab, wenn Kaub darunter fällt. Zurückgehalten wird aus dem Abfluss, der unterhalb der Seen gemessen wurde. Die Wirkung erreicht Kaub zwei Tage später.</p><p>Die blaue Linie ist der Abfluss in Kaub mit diesem Rückhalt, die blau schraffierte Fläche die Anhebung. Unten steht, wie viel Wasser in den Seen gespeichert ist. Als Beispiel dient Stufe 1b: Die regulierten Seen stauen bis 20 cm unter ihre Hochwassergrenze. Die Stufen folgen weiter unten.</p><p>${j}${DP}Gespeichert werden höchstens <b>${zahl(b1.genutzt)} Mio. m³</b>. Der kleinste Tagesabfluss in Kaub steigt von ${zahl(qm)} auf <b>${zahl(qs)} m³/s</b>, die kleinste Fahrrinnentiefe von ${zahl(d.k.t0)} auf <b>${zahl(b1.k.t1)} cm</b>.</p>`,
      `<h3>Comment agit la retenue</h3><p>Dès ici, le graphique montre une deuxième ligne, calculée. Les lacs retiennent de l’eau tant que Kaub est au-dessus du GlW et la restituent quand Kaub passe en dessous. La retenue est prélevée sur le débit mesuré en aval des lacs. L’effet atteint Kaub deux jours plus tard.</p><p>La ligne bleue est le débit à Kaub avec cette retenue, la surface hachurée en bleu le relèvement. En bas figure le volume stocké dans les lacs. L’exemple est le palier 1b : les lacs régulés retiennent jusqu’à 20 cm sous leur limite de hautes eaux. Les paliers suivent plus bas.</p><p>${j}${DP}le volume stocké atteint au plus <b>${zahl(b1.genutzt)} mio m³</b>. Le plus faible débit journalier à Kaub passe de ${zahl(qm)} à <b>${zahl(qs)} m³/s</b>, la profondeur minimale du chenal de ${zahl(d.k.t0)} à <b>${zahl(b1.k.t1)} cm</b>.</p>`));
    f3(3, LL(`<h3>Zwei Rechenweisen</h3><p class="marke">Mit Voraussicht</p><p>Die Rechnung kennt alle Abflüsse des Jahres im Voraus. Im Betrieb kennt sie niemand. Sie staut so viel, wie später gebraucht wird, und verteilt das Wasser auf alle tiefen Tage. Die tiefsten Tage werden am stärksten gehoben. Höher lässt sich der tiefste Tag mit diesem Speicher nicht heben. Die Zahl der Tage unter dem GlW sinkt dabei kaum, weil das Wasser auf viele Tage verteilt wird.</p><p class="marke">Betriebsregel</p><p>Die Rechnung kennt nur den heutigen Abfluss und den Speicherinhalt. Von ${T.monate[REGEL.von - 1]} bis ${T.monate[REGEL.bis - 1]} wird gestaut, wenn der Rhein in Kaub mehr als ${zahl(REGEL.stauAb)} m³/s führt. Ab 1. November wird der Rest abgegeben, damit die Seen im Winter Platz für Hochwasser haben. Fällt Kaub unter den GlW, wird bis zum GlW aufgefüllt, höchstens mit der Menge, bei der ein voller Speicher ${REGEL.tage} Tage reicht. Ist der Speicher leer, gilt wieder der gemessene Abfluss.</p><p>Die blaue Linie bisher war die Rechnung mit Voraussicht. Neu kommt die Betriebsregel blau gestrichelt dazu, und schwarze Balken oben markieren Tage, an denen ein See über seiner Hochwassergrenze stünde. Mit Voraussicht steigt der tiefste Stand. Mit der Betriebsregel sinkt die Zahl der Tage unter dem GlW, solange der Speicher reicht.</p>`,
      `<h3>Deux modes de calcul</h3><p class="marke">Avec prévision</p><p>Le calcul connaît d’avance tous les débits de l’année. En exploitation, personne ne les connaît. Il retient autant d’eau qu’il en faudra plus tard et la répartit sur tous les jours bas. Les jours les plus bas sont les plus relevés. Ce réservoir ne permet pas de relever davantage le jour le plus bas. Le nombre de jours sous le GlW ne diminue guère, car l’eau est répartie sur de nombreux jours.</p><p class="marke">Règle d’exploitation</p><p>Le calcul ne connaît que le débit du jour et le contenu du réservoir. De ${T.monate[REGEL.von - 1]} à ${T.monate[REGEL.bis - 1]}, on retient quand le Rhin dépasse ${zahl(REGEL.stauAb)} m³/s à Kaub. Dès le 1er novembre, le reste est restitué pour que les lacs gardent de la place pour les crues en hiver. Si Kaub passe sous le GlW, on complète jusqu’au GlW, au plus avec la quantité qui permet à un réservoir plein de tenir ${REGEL.tage} jours. Quand le réservoir est vide, le débit mesuré s’applique de nouveau.</p><p>La ligne bleue montrée jusqu’ici était le calcul avec prévision. La règle d’exploitation s’y ajoute en tirets bleus, et des barres noires en haut marquent les jours où un lac serait au-dessus de sa limite de hautes eaux. Avec prévision, le niveau le plus bas monte. Avec la règle d’exploitation, le nombre de jours sous le GlW diminue tant que le réservoir suffit.</p>`));
    const teil = STUFEN.slice(0, 3).map(st => { const z = d.st[st];
      return `<tr><td>${st}</td><td class="z">${zahl(z.r.genutzt)}</td><td class="z blau">${zahl(z.v.k.u1)}</td><td class="z blau">${zahl(z.r.k.u1)}</td><td class="z${z.r.ueber ? ' hw' : ''}">${zahl(z.r.ueber)}</td></tr>`; }).join('');
    f3(4, LL(`<h3>Stufe 1: ohne neue Grenzen</h3><p>Die regulierten Seen stauen höher als heute, aber nicht über ihre Hochwassergrenze. Drei Teilstufen:</p><p class="marke">1a im genutzten Band</p><p>Bis zum Stand, den der See 1991–2020 an 1 % der Tage erreicht hat.</p><p class="marke">1b bis zur Hochwassergrenze</p><p>Bis 20 cm unter die amtliche Hochwassergrenze. Neuenburger- und Murtensee haben keine und bleiben im Band.</p><p class="marke">1c Jurarandseen bis Gefahrenstufe 4</p><p>Dazu Neuenburger- und Murtensee bis 20 cm unter den Beginn der Gefahrenstufe 4.</p>`,
      `<h3>Palier 1 : sans nouvelles limites</h3><p>Les lacs régulés retiennent plus haut qu’aujourd’hui, mais pas au-dessus de leur limite de hautes eaux. Trois sous-paliers :</p><p class="marke">1a dans la tranche utilisée</p><p>Jusqu’au niveau que le lac a atteint 1 % des jours de 1991 à 2020.</p><p class="marke">1b jusqu’à la limite de hautes eaux</p><p>Jusqu’à 20 cm sous la limite officielle de hautes eaux. Les lacs de Neuchâtel et de Morat n’en ont pas et restent dans la tranche.</p><p class="marke">1c lacs du pied du Jura jusqu’au degré de danger 4</p><p>En plus, les lacs de Neuchâtel et de Morat jusqu’à 20 cm sous le début du degré de danger 4.</p>`) +
      `<div class="rollen"><table class="erg"><thead><tr><th>${T.stufe}</th><th class="z">${T.genutzt} ${T.mio}</th><th class="z">${T.nUnter}, ${T.eBest}</th><th class="z">${T.eRegel}</th><th class="z">${T.hwT}</th></tr></thead><tbody><tr><td>${T.gemessen}</td><td class="z">–</td><td class="z">${zahl(d.k.u0)}</td><td class="z">${zahl(d.k.u0)}</td><td class="z">–</td></tr>${teil}</tbody></table></div>` +
      LL(`<p class="hinweis">Spalte «Hochwasserschutz»: Tage, an denen ein See wegen des Rückhalts über seiner Hochwassergrenze stünde (Betriebsregel). Die Grafik zeigt Stufe 1b.</p>`, `<p class="hinweis">Colonne « Protection contre les crues » : jours où un lac serait au-dessus de sa limite de hautes eaux à cause de la retenue (règle d’exploitation). Le graphique montre le palier 1b.</p>`));
    f3(5, LL(`<h3>Stufe 2: über der Hochwassergrenze</h3><p>Dieselben Seen, aber mit 50 cm über der heutigen Hochwassergrenze. Die Wehre gibt es schon. Nötig wären neue Reglemente und Schutzbauten an den Ufern. Jeder Tag über der heutigen Grenze ist in der Grafik oben schwarz markiert.</p>`,
      `<h3>Palier 2 : au-dessus de la limite de hautes eaux</h3><p>Les mêmes lacs, mais avec 50 cm au-dessus de la limite actuelle de hautes eaux. Les barrages existent déjà. Il faudrait de nouveaux règlements et des ouvrages de protection sur les rives. Chaque jour au-dessus de la limite actuelle est marqué en noir en haut du graphique.</p>`) + ergebnis(d, d.st['2']));
    f3(6, LL(`<h3>Stufe 3: mit dem Bodensee</h3><p>Dazu 50 cm auf dem Bodensee, mit ${zahl(fb)} km² die grösste Fläche. Der Bodensee ist nicht reguliert. Seit einer Volksabstimmung vom 26. August 1973 verpflichtet die Thurgauer Verfassung Kanton und Gemeinden, sich gegen Massnahmen zu wenden, welche die natürlichen Verhältnisse der See- und Flusslandschaft an Bodensee, Untersee und Rhein beeinträchtigen (heute § 76 Abs. 3 KV). Baden-Württemberg hat 1995 die Nutzung als Rückhaltebecken abgelehnt. Die KHR (2018) hält eine Regulierung unter den heutigen politischen und rechtlichen Bedingungen für kaum realisierbar. Die IGKB (2024) bewertet sie ökologisch sehr kritisch.</p>`,
      `<h3>Palier 3 : avec le lac de Constance</h3><p>En plus, 50 cm sur le lac de Constance, la plus grande surface avec ${zahl(fb)} km². Le lac de Constance n’est pas régulé. Depuis une votation populaire du 26 août 1973, la constitution thurgovienne oblige le canton et les communes à s’opposer aux mesures qui portent atteinte aux conditions naturelles du paysage lacustre et fluvial du lac de Constance, de l’Untersee et du Rhin (aujourd’hui § 76, al. 3). Le Bade-Wurtemberg a refusé en 1995 de l’utiliser comme bassin de rétention. La CHR (2018) juge une régulation difficilement réalisable dans les conditions politiques et juridiques actuelles. L’IGKB (2024) la juge très critique sur le plan écologique.</p>`) + ergebnis(d, d.st['3']) +
      LL(`<p class="hinweis">Zum Vergleich: Das Regulierreglement von 1973 rechnete mit 90 m³/s Zuschuss von Oktober bis Dezember, 15 cm mehr Fahrwassertiefe und 8 % mehr Ladung (IGKB, 2024). Die Abflusskurve dieser Seite ergibt für 90 m³/s beim GlW ${zahl(hub(90))} cm.</p>`,
        `<p class="hinweis">À titre de comparaison : le règlement de régulation de 1973 prévoyait un apport de 90 m³/s d’octobre à décembre, 15 cm de profondeur en plus et 8 % de chargement en plus (IGKB, 2024). La courbe de tarage de cette page donne ${zahl(hub(90))} cm pour 90 m³/s au GlW.</p>`));
    const urteil = STUFEN.map(st => { const z = d.st[st], ok = z.r.k.u1 === 0 || z.v.k.u1 === 0;
      return `<tr><td>${T['st' + st]}</td><td>${!d.k.u0 ? T.unnoetig : ok ? T.ja : T.nein}</td><td class="z blau">${zahl(z.v.k.u1)}</td><td class="z blau">${zahl(z.r.k.u1)}</td><td class="z${z.r.ueber ? ' hw' : ''}">${zahl(z.r.ueber)}</td></tr>`; }).join('');
    f3(7, LL(`<h3>GlW an allen Tagen</h3><p>${j} hätte es dafür <b>${zahl(d.bed)} Mio. m³</b> gebraucht. Die Tabelle zeigt, wie viele Tage unter dem GlW je Stufe bleiben.</p>`, `<h3>Le GlW tous les jours</h3><p>En ${j}, il aurait fallu <b>${zahl(d.bed)} mio m³</b>. Le tableau indique combien de jours restent sous le GlW à chaque palier.</p>`) +
      `<div class="rollen"><table class="erg"><thead><tr><th>${T.stufe}</th><th>${T.glwImmer}</th><th class="z">${T.eBest}</th><th class="z">${T.eRegel}</th><th class="z">${T.hwT}</th></tr></thead><tbody>${urteil}</tbody></table></div>` +
      LL(`<p>Der Speicher füllt sich nicht ganz, wenn im Frühsommer wenig Wasser kommt. Gestaut wird nur, wenn Kaub über dem GlW liegt, und nie mehr als 10 % des Abflusses in Kaub. Die Liste darunter zeigt das für alle Jahre seit 2008. Der Rückhalterechner rechnet jede Stufe für jedes Jahr.</p>`,
        `<p>Le réservoir ne se remplit pas entièrement quand il arrive peu d’eau au début de l’été. On ne retient que si Kaub est au-dessus du GlW, et jamais plus de 10 % du débit à Kaub. La liste ci-dessous le montre pour toutes les années depuis 2008. Le calculateur de rétention calcule chaque palier pour chaque année.</p>`));
    zeige3(sc3.jetzt()); typoFr($('k3')); stapeln($('k3'));
  }
  let breite = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - breite) < 40) return; breite = innerWidth; map.invalidateSize(); alles(true); if (jetzt2 != null) zeige2(jetzt2); zeige3(sc3.jetzt()); });

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
    const b = BEDARF[Y.jahr];
    if (b) [[b.r, T.rkNoetigR, '#003399', '4 3'], [b.v, T.rkNoetigV, '#003399', '']].forEach(([e, name, f, da], n) => { if (!e || !e.noetig) return;
      const xx = e.erreicht ? xv(e.hi) : null, yy = 66 + 0 * n;
      if (xx != null) s += `<line x1="${xx}" x2="${xx}" y1="2" y2="22" stroke="${f}" stroke-width="2" ${da ? `stroke-dasharray="${da}"` : ''}/><text class="blau" x="${Math.min(B - P, Math.max(P, xx))}" y="${n ? 66 : 66}" text-anchor="${xx > B * .7 ? 'end' : xx < B * .3 ? 'start' : 'middle'}">${n ? '' : ''}</text>`; });
    const nb = b ? [[b.r, T.rkNoetigR], [b.v, T.rkNoetigV]].filter(([e]) => e && e.noetig).map(([e, name]) => `${name}${DP}${e.erreicht ? `${zahl(e.hi)}${xv(e.hi) == null ? ' →' : ''}` : T.rkNicht}`).join(' · ') : '';
    svg.setAttribute('viewBox', `0 0 ${B} ${H - 18}`); svg.innerHTML = s;
    let nt = el.querySelector('.rknoetig'); if (!nt) { nt = document.createElement('p'); nt.className = 'rknoetig'; el.querySelector('.rkleiste').append(nt); }
    nt.textContent = nb ? `${nb} ${T.mio}` : '';
    const stx = $('stufentext'); if (k < 0 && !stx.textContent.startsWith(T.rkEigenAktiv)) stx.textContent = `${T.rkEigenAktiv} ${stx.textContent}`;
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
    z.innerHTML = kach(`${T.nUnter} ${Y.jahr}`, k0.u0, kr && kr.u1, kv && kv.u1) + kach(T.aTage, k0.k0, kr && kr.k1, kv && kv.k1) + kach(T.nTief, k0.t0, kr && kr.t1, kv && kv.t1, ' cm') +
      (k0.a0 != null ? kach(`${T.aFlotte}, ${T.aUnter}`, k0.a0, kr && kr.a1, kv && kv.a1, ' %') : '') + (V ? '' : `<p class="hinweis">${T.rkLeer}</p>`);
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
  async function alles(nurWerte) {
    const nr = ++lauf_, R = await rechnen();
    if (nr !== lauf_) return;
    if (!nurWerte) { wahlZeichnen(R.Y); simWahl(R); }
    else { const d = $('wahl').querySelector('input[type=date]'); if (d && Z.tag != null) d.value = isoTag(Z.jahr, Z.tag); }
    datenZeichnen(R); lageZeichnen(R); fahrbarZeichnen(R); laengsschnitt(R); jahresband(R); karteZeichnen(R); herkunftZeichnen(R); bilanzZeichnen(R); seenZeichnen(R); simZeichnen(R); herleitung(R); kapitel1(R); reglerZeichnen(R); ergebnisZeichnen(R); csvBestehend(R); typoFr(document.body); stapeln();
  }
  window.rhin = { szenario, jahr, nachbarn, bedarfGlw };     // für Prüfungen in der Konsole
  simSeen(); alles(); kapitel2(); kapitel3(); jahresvergleich();
})();
