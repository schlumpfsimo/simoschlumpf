// Récupère les flux RSS et écrit feed/data/news.json.
// Lancé chaque heure par .github/workflows/feed-news.yml. Aucune dépendance.
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../../feed/data/news.json', import.meta.url);
const PER_SOURCE = 5;
const MAX_AGE_DAYS = 45;
const UA = 'Mozilla/5.0 (compatible; Flaneur/1.0; +https://www.simoschlumpf.ch/feed/)';

const gnews = (q, hl, gl) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split('-')[0]}`;

const SOURCES = [
  // Politique et idées, en français
  { key: 'lgc', label: 'Le Grand Continent', lang: 'fr', url: 'https://legrandcontinent.eu/fr/feed/' },
  { key: 'rfi', label: 'RFI', lang: 'fr', url: 'https://www.rfi.fr/fr/rss' },
  { key: 'letemps', label: 'Le Temps', lang: 'fr', url: 'https://www.letemps.ch/articles.rss' },
  { key: 'lemonde', label: 'Le Monde', lang: 'fr', url: 'https://www.lemonde.fr/international/rss_full.xml' },
  { key: 'lemonde-europe', label: 'Le Monde', lang: 'fr', url: 'https://www.lemonde.fr/europe/rss_full.xml', section: 'Europe' },
  { key: 'diplo', label: 'Le Monde diplomatique', lang: 'fr', url: 'https://www.monde-diplomatique.fr/recents.xml' },
  { key: 'courrier', label: 'Courrier international', lang: 'fr', url: 'https://www.courrierinternational.com/feed/all/rss.xml' },
  { key: 'touteleurope', label: "Toute l'Europe", lang: 'fr', url: 'https://www.touteleurope.eu/feed/', section: 'Europe' },
  { key: 'tec', label: 'The European Correspondent', lang: 'fr', url: 'https://europeancorrespondent.com/fr/feed.xml', section: 'Europe' },
  { key: 'rts', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/?format=rss/news' },
  { key: 'visionscarto', label: 'Visionscarto', lang: 'fr', url: 'https://visionscarto.net/spip.php?page=backend', section: 'Cartes' },
  // Autres langues
  { key: 'politico', label: 'Politico Europe', lang: 'en', url: gnews('site:politico.eu when:2d', 'en-GB', 'BE'), gnews: true, section: 'Brussels' },
  { key: 'srf', label: 'SRF', lang: 'de', url: 'https://www.srf.ch/news/bnf/rss/1890', section: 'Schweiz' },
  { key: 'yle', label: 'Yle', lang: 'fi', url: 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss', section: 'Suomi' },
  { key: 'pdr', label: 'The Public Domain Review', lang: 'en', url: 'https://publicdomainreview.org/rss.xml', section: 'Art' },
  { key: 'aeon', label: 'Aeon', lang: 'en', url: 'https://aeon.co/feed.rss', section: 'Essai' },
  // Villes
  { key: 'basel', label: 'Bâle', lang: 'de', url: gnews('Basel when:1d', 'de', 'CH'), gnews: true, city: 'Bâle' },
  { key: 'strasbourg', label: 'Rue89 Strasbourg', lang: 'fr', url: 'https://www.rue89strasbourg.com/feed', city: 'Strasbourg' },
  { key: 'berlin', label: 'rbb24', lang: 'de', url: 'https://www.rbb24.de/aktuell/index.xml/feed=rss.xml', city: 'Berlin' },
  { key: 'bruxelles', label: 'The Bulletin', lang: 'en', url: 'https://www.thebulletin.be/rss.xml', city: 'Bruxelles' },
  { key: 'paris', label: 'Le Parisien', lang: 'fr', url: 'https://feeds.leparisien.fr/leparisien/rss/paris-75', city: 'Paris' },
  { key: 'vienne', label: 'ORF Wien', lang: 'de', url: 'https://rss.orf.at/wien.xml', city: 'Vienne' },
  { key: 'bz', label: 'bz Basel', lang: 'de', url: gnews('site:bzbasel.ch when:1d', 'de', 'CH'), gnews: true, city: 'Bâle' },
  { key: 'bajour', label: 'Bajour', lang: 'de', url: 'https://bajour.ch/api/rss-feed', city: 'Bâle' },
  { key: 'badische', label: 'Badische Zeitung', lang: 'de', url: gnews('site:badische-zeitung.de when:1d', 'de', 'DE'), gnews: true, city: 'Südbaden' },
  { key: 'dna', label: 'DNA', lang: 'fr', url: gnews('site:dna.fr when:1d', 'fr', 'FR'), gnews: true, city: 'Alsace' },
  // Rhin supérieur et coopération transfrontalière
  { key: 'ork', label: 'Conférence du Rhin supérieur', lang: 'de', url: 'https://www.oberrheinkonferenz.org/de/deutsch-franzoesisch-schweizerische-oberrheinkonferenz.xml', section: 'Oberrhein' },
  { key: 'interreg', label: 'Interreg Rhin supérieur', lang: 'fr', url: 'https://www.interreg-oberrhein.eu/feed/', section: 'Rhin supérieur' },
  { key: 'teb', label: 'Eurodistrict Basel', lang: 'de', url: 'https://www.eurodistrictbasel.eu/de/share/teb-news-de.xml', section: 'Oberrhein' },
  { key: 'eurodistrict-so', label: 'Eurodistrict Strasbourg-Ortenau', lang: 'fr', url: 'https://www.eurodistrict.eu/rss.xml', section: 'Rhin supérieur' },
  { key: 'regbas', label: 'Regio Basiliensis', lang: 'de', url: gnews('"Regio Basiliensis" when:30d', 'de', 'CH'), gnews: true, section: 'Oberrhein' },
  { key: 'eucor', label: 'Eucor', lang: 'de', url: gnews('Eucor "European Campus" when:30d', 'de', 'DE'), gnews: true, section: 'Oberrhein' },
  { key: 'infobest', label: 'INFOBEST', lang: 'de', url: gnews('INFOBEST when:60d', 'de', 'DE'), gnews: true, section: 'Oberrhein' },
  { key: 'mot', label: 'MOT', lang: 'fr', url: 'https://www.espaces-transfrontaliers.org/feed/', section: 'Transfrontalier' },
  { key: 'aebr', label: 'AEBR', lang: 'en', url: 'https://www.aebr.eu/feed', section: 'Border regions' },
  { key: 'bsolutions', label: 'b-solutions', lang: 'en', url: 'https://www.b-solutionsproject.com/blog-feed.xml', section: 'Border regions' },
  { key: 'fz-freiburg', label: 'Frankreich-Zentrum Freiburg', lang: 'de', url: 'https://www.fz.uni-freiburg.de/rss.xml', section: 'Forschung' },
  { key: 'bs', label: 'Kanton Basel-Stadt', lang: 'de', url: 'https://www.bs.ch/rss', city: 'Bâle' },
  { key: 'kdk', label: 'KdK', lang: 'de', url: 'https://kdk.ch/rss', section: 'Kantone' },
  { key: 'baselarea', label: 'Basel Area', lang: 'en', url: 'https://baselarea.swiss/feed', section: 'Innovation' },
  // Suisse–UE
  { key: 'ebs', label: 'Mouvement européen Suisse', lang: 'de', url: 'https://www.europa.ch/feed', section: 'Schweiz–EU' },
  { key: 'sga', label: 'SGA-ASPE', lang: 'de', url: 'https://www.sga-aspe.ch/feed', section: 'Aussenpolitik' },
  { key: 'ase', label: 'La Suisse en Europe', lang: 'fr', url: 'https://suisse-en-europe.ch/feed/', section: 'Suisse–UE' },
  { key: 'avenir', label: 'Avenir Suisse', lang: 'de', url: 'https://www.avenir-suisse.ch/feed', section: 'Schweiz' },
  { key: 'nzz', label: 'NZZ', lang: 'de', url: 'https://www.nzz.ch/recent.rss' },
  { key: 'republik', label: 'Republik', lang: 'de', url: 'https://www.republik.ch/feed.xml' },
  // UE, idées, droit
  { key: 'euobserver', label: 'EUobserver', lang: 'en', url: 'https://euobserver.com/rss', section: 'EU' },
  { key: 'euractiv', label: 'Euractiv', lang: 'en', url: gnews('site:euractiv.com when:2d', 'en-GB', 'BE'), gnews: true, section: 'EU' },
  { key: 'euronews', label: 'Euronews', lang: 'en', url: 'https://www.euronews.com/rss' },
  { key: 'conversation', label: 'The Conversation', lang: 'en', url: 'https://theconversation.com/europe/articles.atom' },
  { key: 'eurotopics', label: 'eurotopics', lang: 'fr', url: 'https://www.eurotopics.net/export/fr/rss.xml', section: 'Revue de presse' },
  { key: 'bruegel', label: 'Bruegel', lang: 'en', url: 'https://www.bruegel.org/rss.xml', section: 'Think tank' },
  { key: 'cer', label: 'CER', lang: 'en', url: 'https://www.cer.eu/rss.xml', section: 'Think tank' },
  { key: 'delors', label: 'Institut Jacques Delors', lang: 'fr', url: 'https://institutdelors.eu/feed/', section: 'Think tank' },
  { key: 'ecfr', label: 'ECFR', lang: 'en', url: gnews('site:ecfr.eu when:30d', 'en-GB', 'GB'), gnews: true, section: 'Think tank' },
  { key: 'schuman', label: 'Fondation Robert Schuman', lang: 'fr', url: gnews('site:robert-schuman.eu when:30d', 'fr', 'FR'), gnews: true, section: 'Think tank' },
  { key: 'verfassungsblog', label: 'Verfassungsblog', lang: 'de', url: 'https://verfassungsblog.de/feed/', section: 'Recht' },
  { key: 'consilium', label: "Conseil de l'UE", lang: 'en', url: 'https://www.consilium.europa.eu/en/rss/pressreleases.ashx', section: 'EU' },
  { key: 'economist', label: 'The Economist', lang: 'en', url: 'https://www.economist.com/europe/rss.xml', section: 'Europe' },
  { key: 'guardian', label: 'The Guardian', lang: 'en', url: 'https://www.theguardian.com/world/europe-news/rss', section: 'Europe' },
  { key: 'tagesschau', label: 'Tagesschau', lang: 'de', url: 'https://www.tagesschau.de/xml/rss2/' },
  // Personnel
  { key: 'yle-en', label: 'Yle News', lang: 'en', url: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS', section: 'Finland' },
  { key: 'monocle', label: 'Monocle', lang: 'en', url: 'https://monocle.com/feed/', section: 'Design' },
  { key: 'dezeen', label: 'Dezeen', lang: 'en', url: 'https://www.dezeen.com/feed/', section: 'Architecture' },
  { key: 'backontrack', label: 'Back on Track', lang: 'en', url: 'https://back-on-track.eu/feed/', section: 'Trains' },
  { key: 'kosmofoto', label: 'Kosmo Foto', lang: 'en', url: 'https://www.kosmofoto.com/feed/', section: 'Photo' },
  // Autorités : Confédération, cantons, Strasbourg
  { key: 'bund-fr', label: 'Confédération', lang: 'fr', url: 'https://www.newsd.admin.ch/newsd/feeds/rss?lang=fr&org-nr=1&offer-nr=', section: 'Conseil fédéral' },
  { key: 'bund-de', label: 'Bund', lang: 'de', url: 'https://www.newsd.admin.ch/newsd/feeds/rss?lang=de&org-nr=1&offer-nr=', section: 'Bundesrat' },
  { key: 'kantone', label: 'Kantone', lang: 'de', url: gnews('site:baselland.ch OR site:ag.ch OR site:so.ch OR site:jura.ch when:14d', 'de', 'CH'), gnews: true, section: 'Kantone' },
  { key: 'strasbourg-eu', label: 'Ville de Strasbourg', lang: 'fr', url: gnews('site:strasbourg.eu when:30d', 'fr', 'FR'), gnews: true, city: 'Strasbourg' },
  // SRF et RTS, toutes rubriques
  { key: 'srf-neu', label: 'SRF', lang: 'de', url: 'https://www.srf.ch/news/bnf/rss/19032223' },
  { key: 'srf-int', label: 'SRF', lang: 'de', url: 'https://www.srf.ch/news/bnf/rss/1922', section: 'International' },
  { key: 'srf-wirtschaft', label: 'SRF', lang: 'de', url: 'https://www.srf.ch/news/bnf/rss/1926', section: 'Wirtschaft' },
  { key: 'rts-suisse', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/suisse/?format=rss/news', section: 'Suisse' },
  { key: 'rts-monde', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/monde/?format=rss/news', section: 'Monde' },
  { key: 'rts-eco', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/economie/?format=rss/news', section: 'Économie' },
  { key: 'rts-sciences', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/sciences-tech/?format=rss/news', section: 'Sciences' },
  { key: 'rts-regions', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/regions/?format=rss/news', section: 'Régions' },
  { key: 'rts-culture', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/info/culture/?format=rss/news', section: 'Culture' },
  { key: 'rts-sport', label: 'RTS', lang: 'fr', url: 'https://www.rts.ch/sport/?format=rss/news', section: 'Sport' },
  // Culture à Bâle et Strasbourg
  { key: 'basel-museen', label: 'Musées de Bâle', lang: 'de', url: gnews('"Kunstmuseum Basel" OR "Fondation Beyeler" OR "Kunsthalle Basel" OR "Museum Tinguely" OR "Vitra Design Museum" OR "HEK Basel" when:14d', 'de', 'CH'), gnews: true, city: 'Bâle · culture', section: 'Exposition' },
  { key: 'basel-kultur', label: 'Culture à Bâle', lang: 'de', url: gnews('Basel Ausstellung OR Vernissage OR Theater OR Konzert when:3d', 'de', 'CH'), gnews: true, city: 'Bâle · culture' },
  { key: 'strasbourg-culture', label: 'Culture à Strasbourg', lang: 'fr', url: gnews('Strasbourg exposition OR musée OR spectacle OR festival when:7d', 'fr', 'FR'), gnews: true, city: 'Strasbourg · culture' },
  { key: 'pokaa', label: 'Pokaa', lang: 'fr', url: 'https://www.pokaa.fr/feed/', city: 'Strasbourg · culture' },
  // Expositions et art contemporain
  { key: 'cad', label: 'Contemporary Art Daily', lang: 'en', url: 'https://www.contemporaryartdaily.com/feed/', section: 'Exposition' },
  { key: 'eflux', label: 'e-flux', lang: 'en', url: gnews('site:e-flux.com announcements when:7d', 'en-US', 'US'), gnews: true, section: 'Exposition' },
  { key: 'artnewspaper', label: 'The Art Newspaper', lang: 'en', url: 'https://www.theartnewspaper.com/rss.xml', section: 'Art' },
  { key: 'hyperallergic', label: 'Hyperallergic', lang: 'en', url: 'https://hyperallergic.com/feed/', section: 'Art' },
  { key: 'artnet', label: 'Artnet News', lang: 'en', url: 'https://news.artnet.com/feed', section: 'Art' },
  { key: 'artforum', label: 'Artforum', lang: 'en', url: 'https://www.artforum.com/feed/', section: 'Art' },
  { key: 'cda', label: 'Connaissance des Arts', lang: 'fr', url: 'https://www.connaissancedesarts.com/feed/', section: 'Exposition' },
  { key: 'beauxarts', label: 'Beaux Arts', lang: 'fr', url: 'https://www.beauxarts.com/feed/', section: 'Exposition' },
  { key: 'monopol', label: 'Monopol', lang: 'de', url: 'https://www.monopol-magazin.de/rss.xml', section: 'Kunst' },
  // Littérature : nouveautés
  { key: 'lemonde-livres', label: 'Le Monde des livres', lang: 'fr', url: 'https://www.lemonde.fr/livres/rss_full.xml', section: 'Livres' },
  { key: 'livreshebdo', label: 'Livres Hebdo', lang: 'fr', url: 'https://www.livreshebdo.fr/rss.xml', section: 'Livres' },
  { key: 'inrocks-livres', label: 'Les Inrocks', lang: 'fr', url: 'https://www.lesinrocks.com/livres/feed/', section: 'Livres' },
  { key: 'lithub', label: 'Literary Hub', lang: 'en', url: 'https://lithub.com/feed/', section: 'Books' },
  { key: 'perlentaucher', label: 'Perlentaucher', lang: 'de', url: gnews('site:perlentaucher.de when:7d', 'de', 'DE'), gnews: true, section: 'Bücher' },
  // Féminisme
  { key: 'glorieuses', label: 'Les Glorieuses', lang: 'fr', url: 'https://www.lesglorieuses.fr/feed/', section: 'Féminisme' },
  { key: 'feminisme', label: 'Féminisme', lang: 'fr', url: gnews('féminisme OR féministe when:3d', 'fr', 'FR'), gnews: true, section: 'Féminisme' },
  { key: 'feminismus', label: 'Feminismus', lang: 'de', url: gnews('Feminismus OR feministisch when:3d', 'de', 'CH'), gnews: true, section: 'Feminismus' },
  // Politique de sécurité et technologie militaire
  { key: 'lemonde-defense', label: 'Le Monde', lang: 'fr', url: 'https://www.lemonde.fr/defense/rss_full.xml', section: 'Défense' },
  { key: 'opex360', label: 'Zone Militaire', lang: 'fr', url: 'https://www.opex360.com/feed/', section: 'Défense' },
  { key: 'iris', label: 'IRIS', lang: 'fr', url: 'https://www.iris-france.org/feed/', section: 'Sécurité' },
  { key: 'warontherocks', label: 'War on the Rocks', lang: 'en', url: 'https://warontherocks.com/feed/', section: 'Security' },
  { key: 'defensenews', label: 'Defense News', lang: 'en', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', section: 'Defence' },
  { key: 'breakingdefense', label: 'Breaking Defense', lang: 'en', url: 'https://breakingdefense.com/feed/', section: 'Defence' },
  { key: 'twz', label: 'The War Zone', lang: 'en', url: 'https://www.twz.com/feed', section: 'Military tech' },
];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—' };

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function text(html) {
  return decode(decode(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function shorten(s, max = 240) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
}

// Premier paragraphe qui ressemble à du vrai texte (sans pub ni « apparu en premier sur »).
function summary(item) {
  const html = decode(tag(item, 'content:encoded') || tag(item, 'description') || tag(item, 'summary') || tag(item, 'content'));
  const paras = [...html.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .filter((m) => !/non-subscribers|post__read-more/.test(m[1] || ''))
    .map((m) => text(m[2]))
    .filter((p) => p.length > 80 && !/apparu en premier sur|Lire aussi/.test(p));
  return shorten(paras[0] || text(html));
}

function image(item) {
  const m =
    item.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i) ||
    item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ||
    decode(item).match(/<img[^>]*src="([^"]+)"/i);
  return m ? decode(m[1]) : '';
}

async function ogImage(url) {
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    const m = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    return m ? decode(m[1]) : '';
  } catch {
    return '';
  }
}

async function fetchSource(src, known) {
  const res = await fetch(src.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${src.key}: HTTP ${res.status}`);
  const xml = await res.text();
  const items = xml.split(/<(?:item|entry)[\s>]/).slice(1, PER_SOURCE + 1);
  const out = [];
  for (const item of items) {
    const url = text(tag(item, 'link')) || decode(item.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] || item.match(/<link[^>]*href="([^"]+)"/)?.[1] || '');
    let title = text(tag(item, 'title'));
    let sourceLabel = src.label;
    // Google News : « Titre - Journal », pas de résumé utile.
    if (src.gnews) {
      const m = title.match(/^(.*) - ([^-]+)$/);
      if (m) [title, sourceLabel] = [m[1], m[2].trim()];
    }
    if (!url || !title) continue;
    // Certains flux mélangent les langues (Visionscarto) : on garde celle de la source.
    const itemLang = text(tag(item, 'dc:language'));
    if (itemLang && !itemLang.startsWith(src.lang)) continue;
    const date = new Date(text(tag(item, 'pubDate')) || text(tag(item, 'published')) || text(tag(item, 'updated')) || text(tag(item, 'dc:date')) || Date.now());
    if (Date.now() - date > MAX_AGE_DAYS * 864e5) continue;
    const categories = [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => text(m[1])).filter(Boolean);
    let img = image(item) || known.get(url)?.image || '';
    if (!img && !src.gnews && !known.has(url)) img = await ogImage(url);
    out.push({
      source: src.key,
      sourceLabel,
      lang: src.lang,
      city: src.city,
      section: src.section,
      title,
      summary: src.gnews ? '' : summary(item),
      url,
      image: img,
      date: isNaN(date) ? new Date().toISOString() : date.toISOString(),
      categories: categories.slice(0, 3),
    });
  }
  return out;
}

let previous = { items: [] };
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch {}
const known = new Map(previous.items.map((it) => [it.url, it]));

// Google News n'aime pas les rafales : ces recherches passent une par une, espacées.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Et seulement toutes les trois heures : entre-temps, on garde les titres précédents.
const GNEWS_EVERY_HOURS = 3;
async function gnewsSerial() {
  const out = new Map();
  const due = new Date().getUTCHours() % GNEWS_EVERY_HOURS === 0 || process.env.GNEWS === '1';
  for (const src of SOURCES.filter((x) => x.gnews)) {
    if (!due) {
      out.set(src, { status: 'rejected', reason: new Error(`${src.key}: pas cette heure-ci`) });
      continue;
    }
    out.set(src, await fetchSource(src, known).then((value) => ({ status: 'fulfilled', value }), (reason) => ({ status: 'rejected', reason })));
    await sleep(1500);
  }
  return out;
}
const [direct, viaGoogle] = await Promise.all([
  Promise.allSettled(SOURCES.filter((x) => !x.gnews).map((s) => fetchSource(s, known))),
  gnewsSerial(),
]);
const directIt = direct[Symbol.iterator]();
const results = SOURCES.map((s) => (s.gnews ? viaGoogle.get(s) : directIt.next().value));
const items = [];
results.forEach((r, i) => {
  if (r.status === 'fulfilled') items.push(...r.value);
  else {
    console.warn(r.reason.message);
    // Source en panne : on garde ses anciens articles plutôt que de les perdre.
    items.push(...previous.items.filter((it) => it.source === SOURCES[i].key));
  }
});
items.sort((a, b) => b.date.localeCompare(a.date));

const unchanged = JSON.stringify(items) === JSON.stringify(previous.items);
if (unchanged) {
  console.log('Rien de nouveau.');
} else {
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), items }, null, 1) + '\n');
  console.log(`${items.length} articles écrits.`);
}
