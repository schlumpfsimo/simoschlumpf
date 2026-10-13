// Les thèmes qui nourrissent le flux à l'infini : chaque carte tire un thème au hasard,
// puis un résultat au hasard dans ce thème. [requête, étiquette]

export const WIKI_FR = [
  // Europe et politique
  ['Union européenne', 'EUROPE'], ['intégration européenne', 'EUROPE'], ['Parlement européen', 'EUROPE'],
  ['Commission européenne', 'EUROPE'], ['traité de Rome', 'EUROPE'], ['espace Schengen', 'EUROPE'],
  ['euroscepticisme', 'POLITIQUE'], ['souverainisme', 'POLITIQUE'], ['fédéralisme', 'POLITIQUE'],
  ['démocratie directe', 'POLITIQUE'], ['référendum', 'POLITIQUE'], ['initiative populaire', 'POLITIQUE'],
  ['populisme', 'POLITIQUE'], ['nationalisme', 'POLITIQUE'], ['identité nationale', 'POLITIQUE'],
  ['parti politique européen', 'POLITIQUE'], ['élection présidentielle', 'POLITIQUE'], ['coalition gouvernementale', 'POLITIQUE'],
  ['Conseil de l\'Europe', 'EUROPE'], ['Cour européenne des droits de l\'homme', 'EUROPE'], ['élargissement de l\'Union européenne', 'EUROPE'],
  ['relations entre la Suisse et l\'Union européenne', 'SUISSE · EUROPE'], ['accords bilatéraux Suisse', 'SUISSE · EUROPE'],
  ['diplomatie', 'DIPLOMATIE'], ['traité international', 'DIPLOMATIE'], ['géopolitique', 'GÉOPOLITIQUE'],
  ['guerre froide', 'HISTOIRE'], ['rideau de fer', 'HISTOIRE'], ['chute du mur de Berlin', 'HISTOIRE'],
  ['Pères de l\'Europe', 'EUROPE'], ['Jean Monnet', 'EUROPE'], ['Robert Schuman', 'EUROPE'], ['Altiero Spinelli', 'EUROPE'],
  // Frontières et territoires
  ['frontière', 'FRONTIÈRES'], ['tripoint', 'FRONTIÈRES'], ['enclave', 'FRONTIÈRES'], ['exclave', 'FRONTIÈRES'],
  ['coopération transfrontalière', 'FRONTIÈRES'], ['eurorégion', 'FRONTIÈRES'], ['Rhin supérieur', 'RHIN SUPÉRIEUR'],
  ['Alsace', 'RHIN SUPÉRIEUR'], ['Bade-Wurtemberg', 'RHIN SUPÉRIEUR'], ['Bâle', 'RHIN SUPÉRIEUR'], ['Strasbourg', 'RHIN SUPÉRIEUR'],
  ['Mulhouse', 'RHIN SUPÉRIEUR'], ['Fribourg-en-Brisgau', 'RHIN SUPÉRIEUR'], ['Jura', 'SUISSE'], ['frontière linguistique', 'FRONTIÈRES'],
  ['Röstigraben', 'SUISSE'], ['micro-État', 'FRONTIÈRES'], ['territoire disputé', 'FRONTIÈRES'], ['région transfrontalière', 'FRONTIÈRES'],
  ['identité territoriale', 'TERRITOIRES'], ['régionalisme', 'TERRITOIRES'], ['autonomie régionale', 'TERRITOIRES'],
  ['minorité linguistique', 'LANGUES'], ['plurilinguisme', 'LANGUES'], ['Corse', 'TERRITOIRES'], ['Catalogne', 'TERRITOIRES'],
  ['Tyrol du Sud', 'TERRITOIRES'], ['Åland', 'TERRITOIRES'], ['Gibraltar', 'TERRITOIRES'], ['Kaliningrad', 'TERRITOIRES'],
  // Suisse
  ['Conseil fédéral', 'SUISSE'], ['Assemblée fédérale', 'SUISSE'], ['canton suisse', 'SUISSE'], ['histoire de la Suisse', 'SUISSE'],
  ['neutralité suisse', 'SUISSE'], ['Suisse romande', 'SUISSE'], ['Tessin', 'SUISSE'], ['Grisons', 'SUISSE'], ['romanche', 'LANGUES'],
  ['Genève internationale', 'SUISSE'], 
  // Nord et Finlande
  ['Finlande', 'FINLANDE'], ['guerre d\'Hiver', 'FINLANDE'], ['Helsinki', 'FINLANDE'], ['Kalevala', 'FINLANDE'],
  ['sauna', 'FINLANDE'], ['Alvar Aalto', 'DESIGN'], ['Marimekko', 'DESIGN'], ['design scandinave', 'DESIGN'], 
  ['Laponie', 'NORD'], ['Estonie', 'NORD'], ['mer Baltique', 'NORD'], ['Islande', 'NORD'], ['Norvège', 'NORD'], ['Danemark', 'NORD'],
  // Villes
  ['Berlin', 'VILLES'], ['Bruxelles', 'VILLES'], ['Paris', 'VILLES'], ['Vienne (Autriche)', 'VILLES'], 
  ['Prague', 'VILLES'], ['Lisbonne', 'VILLES'], ['Porto', 'VILLES'], ['Trieste', 'VILLES'], ['Marseille', 'VILLES'],
  ['Naples', 'VILLES'], ['Tallinn', 'VILLES'], ['Sarajevo', 'VILLES'], 
  ['urbanisme', 'VILLES'], ['ville nouvelle', 'VILLES'], ['grand ensemble', 'VILLES'], ['cité-jardin', 'VILLES'],
  // Architecture et design
  ['architecture moderne', 'ARCHITECTURE'], ['brutalisme', 'ARCHITECTURE'], ['Bauhaus', 'ARCHITECTURE'], ['Le Corbusier', 'ARCHITECTURE'],
  ['Unité d\'habitation', 'ARCHITECTURE'], ['architecture fonctionnaliste', 'ARCHITECTURE'], ['logement social', 'ARCHITECTURE'],
  ['Mies van der Rohe', 'ARCHITECTURE'], ['architecture soviétique', 'ARCHITECTURE'], ['gare ferroviaire', 'ARCHITECTURE'],
  ['design industriel', 'DESIGN'], ['typographie', 'DESIGN'], ['Helvetica', 'DESIGN'], ['style typographique international', 'DESIGN'],
  ['affiche', 'DESIGN'], ['mobilier', 'DESIGN'], ['design graphique suisse', 'DESIGN'],
  // Photographie et arts
  ['photographie de rue', 'PHOTOGRAPHIE'], ['Henri Cartier-Bresson', 'PHOTOGRAPHIE'], ['Robert Frank', 'PHOTOGRAPHIE'],
  ['Vivian Maier', 'PHOTOGRAPHIE'], ['photographie argentique', 'PHOTOGRAPHIE'], ['Leica', 'PHOTOGRAPHIE'], ['agence Magnum', 'PHOTOGRAPHIE'],
  ['photographie humaniste', 'PHOTOGRAPHIE'], ['Robert Doisneau', 'PHOTOGRAPHIE'], ['impressionnisme', 'ART'], ['expressionnisme', 'ART'],
  ['art concret', 'ART'], ['Paul Klee', 'ART'], ['Ferdinand Hodler', 'ART'], ['Alberto Giacometti', 'ART'], ['Sophie Taeuber-Arp', 'ART'],
  ['dadaïsme', 'ART'], ['art nouveau', 'ART'], ['musée', 'ART'], ['Biennale de Venise', 'ART'], ['Art Basel', 'ART'],
  // Littérature et idées
  ['nouvelle (littérature)', 'LITTÉRATURE'], ['Albert Camus', 'LITTÉRATURE'], ['Stefan Zweig', 'LITTÉRATURE'], ['Charles-Ferdinand Ramuz', 'LITTÉRATURE'],
  ['Marguerite Yourcenar', 'LITTÉRATURE'], ['Annie Ernaux', 'LITTÉRATURE'], ['Gabriel García Márquez', 'LITTÉRATURE'], ['Roberto Bolaño', 'LITTÉRATURE'],
  ['Hannah Arendt', 'IDÉES'], ['Alexis de Tocqueville', 'IDÉES'], ['Montesquieu', 'IDÉES'], ['Denis de Rougemont', 'IDÉES'],
  ['philosophie politique', 'IDÉES'], ['contrat social', 'IDÉES'], ['Lumières', 'IDÉES'], ['flâneur', 'IDÉES'], ['Walter Benjamin', 'IDÉES'],
  // Société
  ['migration', 'SOCIÉTÉ'], ['réfugié', 'SOCIÉTÉ'], ['droit d\'asile', 'SOCIÉTÉ'], ['intégration des migrants', 'SOCIÉTÉ'],
  ['programme Erasmus', 'EUROPE'], ['service public', 'SOCIÉTÉ'],
  // Voyage et transport
  ['train de nuit', 'TRAINS'], ['ligne ferroviaire', 'TRAINS'], ['chemin de fer de montagne', 'TRAINS'], ['tunnel ferroviaire', 'TRAINS'],
  ['ferry', 'VOYAGE'], ['port', 'VOYAGE'], ['route de la soie', 'VOYAGE'], ['col alpin', 'VOYAGE'],
    // Science et nature
  ['dinosaure', 'DINOSAURES'], ['Tyrannosaurus', 'DINOSAURES'], ['ptérosaure', 'DINOSAURES'], ['paléontologie', 'DINOSAURES'],
  ['Jurassique', 'DINOSAURES'], ['Crétacé', 'DINOSAURES'], ['fossile', 'DINOSAURES'],
  ['géothermie', 'ÉNERGIE'], ['géothermie profonde', 'ÉNERGIE'], ['énergie renouvelable', 'ÉNERGIE'], ['centrale hydroélectrique', 'ÉNERGIE'],
  ['transition énergétique', 'ÉNERGIE'], ['réseau électrique européen', 'ÉNERGIE'], ['glacier', 'CLIMAT'], ['changement climatique', 'CLIMAT'],
  ['volcan', 'SCIENCES'], ['tectonique des plaques', 'SCIENCES'], ['astronomie', 'SCIENCES'], ['exploration spatiale', 'SCIENCES'],
  ['physique quantique', 'SCIENCES'], ['CERN', 'SCIENCES'], ['biodiversité', 'NATURE'], ['forêt', 'NATURE'], ['oiseau migrateur', 'NATURE'],
  ['Rhin', 'NATURE'], ['rivière', 'NATURE'], ['lac alpin', 'NATURE'], ['loup', 'NATURE'], ['mathématiques', 'SCIENCES'],
  // Quotidien et culture
    ['cinéma français', 'CINÉMA'], ['Nouvelle Vague', 'CINÉMA'], ['cinéma européen', 'CINÉMA'], ['Jean-Luc Godard', 'CINÉMA'],
  ['chanson française', 'MUSIQUE'], ['jazz', 'MUSIQUE'], ['musique électronique', 'MUSIQUE'],
  ['langue française', 'LANGUES'], ['étymologie', 'LANGUES'], ['expression française', 'LANGUES'], ['jeu de mots', 'LANGUES'],
  ['espagnol', 'LANGUES'], ['Amérique latine', 'MONDE'], 
  // Qualité garantie
  ['incategory:"Article de qualité"', 'ARTICLE DE QUALITÉ'], ['incategory:"Bon article"', 'BON ARTICLE'],
];

export const WIKI_DE = [
  ['Grenze', 'GRENZEN'], ['Dreiländereck', 'GRENZEN'], ['Oberrhein', 'OBERRHEIN'], 
  ['Basel', 'BASEL'], ['Kleinbasel', 'BASEL'], ['Basler Fasnacht', 'BASEL'], ['Rheinhafen Basel', 'BASEL'], ['Kanton Basel-Landschaft', 'BASEL'],
  ['Kanton Jura', 'SCHWEIZ'], ['Schweizer Geschichte', 'SCHWEIZ'],
  ['Volksabstimmung', 'POLITIK'], ['Volksinitiative', 'POLITIK'], ['Bundesrat (Schweiz)', 'POLITIK'], ['Föderalismus', 'POLITIK'],
  ['Europäische Integration', 'EUROPA'], ['Europaskepsis', 'POLITIK'], ['Nationalismus', 'POLITIK'],
  ['Winterkrieg', 'FINNLAND'], ['Fortsetzungskrieg', 'FINNLAND'],
  ['Bauhaus', 'ARCHITEKTUR'], ['Brutalismus', 'ARCHITEKTUR'], ['Neues Bauen', 'ARCHITEKTUR'], ['Werkbund', 'DESIGN'],
  ['Schweizer Typografie', 'DESIGN'], ['Ulmer Hochschule für Gestaltung', 'DESIGN'], ['Max Bill', 'DESIGN'],
  ['Strassenfotografie', 'FOTOGRAFIE'], ['Kleinbildkamera', 'FOTOGRAFIE'], ['René Burri', 'FOTOGRAFIE'],
  ['Berlin', 'STÄDTE'], ['Wien', 'STÄDTE'], ['Kaffeehaus', 'KULTUR'], ['Industriekultur', 'INDUSTRIE'],
  ['Geothermie', 'ENERGIE'], ['Tiefengeothermie', 'ENERGIE'], ['Dinosaurier', 'DINOSAURIER'],
  ['Jura (Gebirge)', 'NATUR'], ['Rhein', 'NATUR'],
  ['incategory:"Wikipedia:Exzellent"', 'EXZELLENT'], ['incategory:"Wikipedia:Lesenswert"', 'LESENSWERT'],
];

export const WIKI_EN = [
  ['European integration', 'EUROPE'], ['Euroscepticism', 'POLITICS'], ['territorial identity', 'TERRITORY'],
  ['border', 'BORDERS'], ['tripoint', 'BORDERS'], ['cross-border cooperation', 'BORDERS'],
  ['brutalist architecture', 'ARCHITECTURE'], ['modernist architecture', 'ARCHITECTURE'], ['street photography', 'PHOTOGRAPHY'],
  ['dinosaur', 'DINOSAURS'], ['geothermal energy', 'ENERGY'], ['night train', 'TRAINS'], 
  ['Finnish design', 'DESIGN'], ['Swiss Style (design)', 'DESIGN'], ['direct democracy', 'POLITICS'],
  ['incategory:"Featured articles"', 'FEATURED'],
];

// Requêtes pour les collections d'art (en anglais, la langue de la plupart des API).
export const ART = [
  'landscape', 'city', 'street', 'harbour', 'train', 'railway', 'bridge', 'river', 'mountain', 'Alps', 'sea', 'boat',
  'portrait', 'market', 'café', 'window', 'interior', 'chair', 'table', 'lamp', 'textile', 'pattern', 'poster',
  'typography', 'map', 'atlas', 'architecture', 'building', 'tower', 'factory', 'industry', 'book', 'letter',
  'garden', 'flower', 'tree', 'forest', 'winter', 'snow', 'night', 'moon', 'sun', 'cloud', 'bird', 'horse', 'dog',
  'Paris', 'Basel', 'Strasbourg', 'Berlin', 'Vienna', 'Brussels', 'Helsinki', 'Venice', 'Rome', 'Lisbon',
  'modernism', 'abstract', 'geometric', 'Bauhaus', 'Art Nouveau', 'Japanese print', 'woodcut', 'etching', 'photograph',
  'ceramic', 'glass', 'design', 'furniture', 'clock', 'camera', 'airplane', 'bicycle', 'motorcycle', 'automobile',
  'dinosaur', 'fossil', 'volcano', 'astronomy', 'botanical', 'anatomy', 'music', 'dance', 'theatre', 'reading', 'flag',
];

// Modernisme classique (domaine public) : les musées en servent les images.
export const ART_MODERN = [
  'Kandinsky', 'Paul Klee', 'Mondrian', 'Malevich', 'Egon Schiele', 'Gustav Klimt', 'Edvard Munch', 'Kirchner', 'Franz Marc',
  'August Macke', 'Robert Delaunay', 'Sonia Delaunay', 'Hilma af Klint', 'Kupka', 'Lissitzky', 'Rodchenko', 'Popova',
  'Bauhaus', 'De Stijl', 'constructivism', 'cubism', 'futurism', 'expressionism', 'Dada', 'Art Deco', 'Vienna Secession',
  'Wiener Werkstätte', 'abstraction', 'geometric abstraction', 'modernist poster', 'modern design', 'avant-garde',
  'Matisse', 'Picasso', 'Braque', 'Juan Gris', 'Modigliani', 'Vallotton', 'Hodler', 'Cuno Amiet', 'Giovanni Giacometti',
  'Seurat', 'Signac', 'Cézanne', 'Van Gogh', 'Gauguin', 'Toulouse-Lautrec', 'Bonnard', 'Vuillard', 'photogram', 'Atget',
];

// Art contemporain : seulement en photos libres (Commons, Openverse) — les œuvres elles-mêmes sont protégées.
export const ART_CONTEMPORARY = [
  'contemporary art', 'art installation', 'contemporary sculpture', 'public art', 'street art', 'mural', 'graffiti',
  'art exhibition', 'gallery exhibition', 'museum of modern art', 'Art Basel', 'documenta', 'Venice Biennale',
  'land art', 'light installation', 'video art', 'kinetic art', 'Tinguely', 'Fondation Beyeler', 'Kunsthalle',
  'Centre Pompidou', 'Tate Modern', 'MAMCS Strasbourg', 'Vitra Campus', 'contemporary architecture', 'sculpture park',
];

export const ART_FI = ['kaupunki', 'arkkitehtuuri', 'rautatieasema', 'raja', 'katukuva', 'satama', 'Helsinki 1960',
  'järvi', 'talvi', 'sauna', 'tehdas', 'juna', 'lentokone', 'design', 'Aalto'];

// Recherche récente (OpenAlex) : les deux dernières années, du plus récent au plus ancien.
export const PAPERS = [
  ['Euroscepticism', 'EUROSCEPTICISME'], ['nationalism Europe', 'NATIONALISME'], ['territorial identity', 'IDENTITÉ TERRITORIALE'],
  ['national identity referendum', 'IDENTITÉ'], ['direct democracy referendum', 'DÉMOCRATIE DIRECTE'], ['Swiss politics', 'SUISSE'],
  ['Switzerland European Union relations', 'SUISSE · UE'], ['European integration', 'INTÉGRATION EUROPÉENNE'],
  ['differentiated integration', 'INTÉGRATION EUROPÉENNE'], ['cross-border cooperation', 'TRANSFRONTALIER'],
  ['border regions Europe', 'TRANSFRONTALIER'], ['Upper Rhine', 'RHIN SUPÉRIEUR'], ['multilevel governance', 'GOUVERNANCE'],
  ['populism', 'POPULISME'], ['radical right parties', 'DROITE RADICALE'], ['regionalism', 'RÉGIONALISME'], ['federalism', 'FÉDÉRALISME'],
  ['European Parliament elections', 'ÉLECTIONS'], ['public opinion European Union', 'OPINION PUBLIQUE'], ['political communication campaigns', 'CAMPAGNES'],
  ['migration policy Europe', 'MIGRATION'], ['refugee integration', 'MIGRATION'], ['multilingualism', 'PLURILINGUISME'],
  ['Finland politics', 'FINLANDE'], ['Nordic cooperation', 'NORD'], 
  ['geothermal energy', 'GÉOTHERMIE'], ['deep geothermal', 'GÉOTHERMIE'], ['induced seismicity geothermal', 'GÉOTHERMIE'],
  ['energy transition Europe', 'ÉNERGIE'], ['dinosaur', 'DINOSAURES'], ['pterosaur', 'DINOSAURES'], ['dinosaur fossil discovery', 'DINOSAURES'],
  ['urban planning housing', 'URBANISME'], ['modernist architecture heritage', 'ARCHITECTURE'], ['street photography', 'PHOTOGRAPHIE'],
  ['glacier retreat Alps', 'CLIMAT'], ['climate policy', 'CLIMAT'], ['night trains rail Europe', 'TRAINS'], ['diplomacy', 'DIPLOMATIE'],
  ['paleontology', 'PALÉONTOLOGIE'], ['volcano eruption', 'VOLCANS'], ['exoplanet', 'ASTRONOMIE'], ['language learning', 'LANGUES'],
];

// Wikidata : des lieux réels avec une image (classe ou style architectural).
export const PLACES = [
  ['wdt:P31 wd:Q316655', 'TRIPOINT'], ['wdt:P31 wd:Q171441', 'ENCLAVE'], ['wdt:P31 wd:Q933394', 'EXCLAVE'],
  ['wdt:P31 wd:Q55599109', 'POSTE-FRONTIÈRE'], ['wdt:P149 wd:Q994776', 'BRUTALISME'], ['wdt:P149 wd:Q245188', 'MOUVEMENT MODERNE'],
  ['wdt:P149 wd:Q124354', 'BAUHAUS'], ['wdt:P31 wd:Q39715', 'PHARE'], ];

// Wikiquote : des voix européennes, politiques et littéraires.
export const QUOTES = [
  'Robert Schuman', 'Jean Monnet', 'Simone Veil', 'Jacques Delors', 'Victor Hugo', 'Albert Camus', 'Montesquieu',
  'Alexis de Tocqueville', 'Voltaire', 'Jean-Jacques Rousseau', 'Germaine de Staël', 'Simone de Beauvoir', 'Marguerite Yourcenar',
  'Paul Valéry', 'Charles de Gaulle', 'Winston Churchill', 'Václav Havel', 'Hannah Arendt', 'Stefan Zweig', 'Le Corbusier',
  'Antoine de Saint-Exupéry', 'Michel de Montaigne', 'Blaise Pascal', 'Denis Diderot', 'Marcel Proust', 'Gustave Flaubert',
  'Honoré de Balzac', 'Émile Zola', 'George Sand', 'Jean Jaurès', 'Pierre Mendès France', 'François Mitterrand', 'Nelson Mandela',
  'Mahatma Gandhi', 'Albert Einstein', 'Marie Curie', 'Friedrich Dürrenmatt', 'Max Frisch', 'Charles-Ferdinand Ramuz',
];
