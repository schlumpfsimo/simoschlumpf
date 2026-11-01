// Stellt für die Dépêche das Menü «Lesen» zusammen: 25 Schlagzeilen nach Rubriken, mit dem ganzen Artikeltext.
// Liest feed/data/news.json, holt die Artikelseiten, zieht den Text mit Readability heraus (wie der Lesemodus
// von Firefox) und schreibt bon/depeche/lesen.json. Lancé stündlich von .github/workflows/bon-lesen.yml.
// Der Browser kann die Artikel nicht selbst holen (die Zeitungen sperren das), GitHub schon.
// Lokal: npm i --no-save jsdom @mozilla/readability && node .github/scripts/bon-lesen.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';

const FEED = new URL('../../feed/data/news.json', import.meta.url);
const OUT = new URL('../../bon/depeche/lesen.json', import.meta.url);
// Ehrlich als Programm anfragen, wie der Flâneur-Feed. Wer das sperrt, wird übersprungen.
const UA = 'Mozilla/5.0 (compatible; BonDepeche/1.0; +https://www.simoschlumpf.ch/bon/)';
const VOLL = 900;          // weniger Zeichen: wohl Bezahlschranke, dann zählt der Artikel nur als Anriss
const MAX_TEXT = 12000;    // etwa 70 cm Bon; länger wird am Absatz gekürzt
const STUNDE = 36e5;

// Rubriken aus den Interessen im Flâneur (feed/). n = Anzahl Schlagzeilen, zusammen 25.
// alter = wie alt eine Meldung höchstens sein darf, in Stunden.
const RUBRIKEN = [
  { name: 'Schweiz', n: 5, alter: 30, quellen: ['srf', 'srf-neu', 'nzz', 'republik', 'letemps', 'rts-suisse', 'bund-de', 'srf-wirtschaft', 'avenir'] },
  { name: 'Basel und Oberrhein', n: 5, alter: 96, quellen: ['bs', 'bajour', 'bz', 'teb', 'regbas', 'ork', 'interreg', 'infobest', 'eucor', 'eurodistrict-so', 'badische', 'dna', 'strasbourg', 'kantone'] },
  { name: 'Europa', n: 5, alter: 48, quellen: ['lgc', 'lemonde-europe', 'touteleurope', 'tec', 'euobserver', 'politico', 'euractiv', 'guardian', 'economist', 'eurotopics', 'ebs', 'ase', 'sga', 'verfassungsblog', 'delors', 'cer', 'bruegel', 'ecfr', 'schuman'] },
  { name: 'Welt', n: 4, alter: 30, quellen: ['srf-int', 'tagesschau', 'lemonde', 'rfi', 'rts-monde', 'courrier', 'euronews', 'yle-en', 'aljazeera', 'conversation'] },
  { name: 'Sicherheit', n: 2, alter: 72, quellen: ['lemonde-defense', 'opex360', 'iris', 'warontherocks', 'defensenews', 'breakingdefense', 'twz'] },
  { name: 'Kultur und Bücher', n: 4, alter: 96, quellen: ['basel-museen', 'basel-kultur', 'dezeen', 'monopol', 'artnewspaper', 'cda', 'beauxarts', 'hyperallergic', 'lemonde-livres', 'lithub', 'monocle', 'kosmofoto', 'rts-culture'] },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const leer = s => (s || '').replace(/\s+/g, ' ').trim();

// Google News liefert nur eine verschlüsselte Adresse: die echte gibt es über die Schnittstelle der Seite
async function googleAufloesen(url) {
  const id = new URL(url).pathname.split('/').pop();
  const h = await (await fetch(`https://news.google.com/articles/${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })).text();
  const sg = h.match(/data-n-a-sg="([^"]+)"/)?.[1], ts = h.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!sg || !ts) throw new Error('Google News: keine Signatur');
  const innen = JSON.stringify(['garturlreq', [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, +ts, sg]);
  const r = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA },
    body: 'f.req=' + encodeURIComponent(JSON.stringify([[['Fbv4je', innen, null, 'generic']]])),
  });
  const m = (await r.text()).match(/garturlres\\",\\"(https?:[^"\\]+)/);
  if (!m) throw new Error('Google News: keine Adresse');
  return m[1];
}

const gesperrt = new Set();   // Seiten, die Programme abweisen: in diesem Lauf nicht weiter anfragen
async function seite(url) {
  const host = new URL(url).host;
  if (gesperrt.has(host)) throw new Error('gesperrt');
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'de-CH,de;q=0.9,fr;q=0.8,en;q=0.7' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (r.status === 401 || r.status === 403 || r.status === 429) gesperrt.add(host);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const roh = Buffer.from(await r.arrayBuffer());
  let cs = (r.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1];
  if (!cs) cs = roh.subarray(0, 4000).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  let html;
  try { html = new TextDecoder(cs || 'utf-8').decode(roh); } catch { html = roh.toString('utf8'); }
  return { html, url: r.url || url };
}

// Readability gibt HTML zurück; daraus werden Absätze: p = Text, h = Zwischentitel, li = Aufzählung, z = Zitat
const WEG = /^(Mehr zum Thema|Lesen Sie (auch|mehr)|Lire aussi|À lire aussi|Read more|Related|Weitere Artikel|Abonnieren|Jetzt abonnieren|Newsletter|Werbung|Anzeige|Share|Teilen|Copyright|©|Anfang (der )?Bildergalerie|Ende der Bildergalerie|Bildergalerie überspringen|Zurück zum Anfang|Bild \d+ von \d+|list \d+ of \d+|Breadcrumb|Recommended Stories|Artikel verlinken|Akzeptieren|Mehr Informationen)/i;
// Ab hier kommt Bezahlschranke oder Einwilligung: Rest abschneiden
const SCHRANKE = /Bereits Abonnent|exklusiv im Abo|Mit BZ-Digital|Wir benötigen Ihre Zustimmung|Jetzt weiterlesen|Weiterlesen mit|Abo abschliessen|Already a subscriber|Subscribe to (continue|read)|Pour lire la suite|Réservé aux abonnés|Il vous reste \d+ ?%|Cet article est réservé|Vous souhaitez lire la suite/i;
const vergleich = t => leer(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '');
function absaetze(html, titel) {
  const doc = new JSDOM(html).window.document;
  doc.querySelectorAll('figure, figcaption, picture, img, script, style, noscript, aside, nav, button, form, iframe, video, audio, svg, table').forEach(e => e.remove());
  const out = [], tv = vergleich(titel);
  let schranke = false;
  for (const e of doc.querySelectorAll('h2, h3, h4, p, li, blockquote')) {
    if (e.parentElement?.closest('li, blockquote')) continue;   // nicht doppelt
    const t = leer(e.textContent);
    if (SCHRANKE.test(t)) { schranke = true; break; }
    if (t.length < 2 || WEG.test(t)) continue;
    if (/^\w{2}, \d{1,2}\. \w+\.? \d{4}/.test(t) && t.length < 60) continue;   // Datumszeile
    const a = /^H/.test(e.tagName) ? 'h' : e.tagName === 'LI' ? 'li' : e.tagName === 'BLOCKQUOTE' ? 'z' : 'p';
    if (a === 'h' && tv && vergleich(t).includes(tv.slice(0, 40))) continue;                       // der Titel nochmals
    if (out.length === 0 && vergleich(t) === tv) continue;
    if (out.length === 0 && a === 'p' && t.length < 40 && !/[.?!:»"]$/.test(t)) continue;   // Spitzmarke
    if (out.some(x => x.t === t)) continue;
    out.push({ a: a === 'h' && t.length > 140 ? 'p' : a, t });
  }
  // Hervorgehobene Zitate stehen meist auch im Text: dann weglassen
  const kern = t => vergleich(t).slice(0, 40);
  const rest = out.filter(x => !(x.a === 'z' && out.some(y => y !== x && y.a !== 'z' && vergleich(y.t).includes(kern(x.t)))));
  while (rest.length && rest[rest.length - 1].a === 'h') rest.pop();
  return { teile: rest, schranke };
}

const virtuell = new VirtualConsole();   // CSS-Fehler der Zeitungsseiten nicht ins Log
async function artikel(x) {
  let url = x.url;
  if (/^https:\/\/news\.google\.com\//.test(url)) url = await googleAufloesen(url);
  const s = await seite(url);
  const dom = new JSDOM(s.html, { url: s.url, virtualConsole: virtuell });
  const r = new Readability(dom.window.document, { charThreshold: 300 }).parse();
  if (!r?.content) throw new Error('kein Text gefunden');
  let { teile, schranke } = absaetze(r.content, titelTeile(x.title).titel);
  const laenge = teile.reduce((n, p) => n + p.t.length, 0);
  let gekuerzt = false;
  if (laenge > MAX_TEXT) {
    let n = 0; const kurz = [];
    for (const p of teile) { if (n + p.t.length > MAX_TEXT && kurz.length) break; kurz.push(p); n += p.t.length; }
    while (kurz.length && kurz[kurz.length - 1].a === 'h') kurz.pop();
    teile = kurz; gekuerzt = true;
  }
  const autor = leer(r.byline).replace(/^(von|par|by)\s+/i, '');
  return { url: s.url, autor: /\d{2}[.:]\d{2}/.test(autor) || autor.length > 80 ? '' : autor, absaetze: teile, zeichen: Math.min(laenge, MAX_TEXT), voll: laenge >= VOLL && !(schranke && laenge < 2500), gekuerzt };
}

// Titel aufbereiten wie die Dépêche: «Ressort – Titel» wird zu Spitzmarke und Titel
function titelTeile(t) {
  let titel = leer(t).replace(/ - [^–]{3,40}$/, ''), kicker = '';
  const m = titel.match(/^(.{3,45}?) [–-] (.{12,})$/);
  if (m && !/[.?!]$/.test(m[1])) { kicker = m[1]; titel = m[2]; }
  return { titel, kicker };
}

const feed = JSON.parse(await readFile(FEED, 'utf8'));
let vorher = { items: [], fehler: {} };
try { vorher = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
const bekannt = new Map((vorher.items || []).filter(x => x.text).map(x => [x.feedUrl, x.text]));
// Fehlgeschlagene Seiten und solche hinter der Bezahlschranke einen Tag lang nicht nochmals holen
const frisch = o => Object.fromEntries(Object.entries(o || {}).filter(([, z]) => Date.now() - z < 24 * STUNDE));
const fehler = frisch(vorher.fehler), kurz = frisch(vorher.kurz);

const jetzt = Date.now();
const alle = (feed.items || []).filter(x => x.title && x.url && new Date(x.date) <= jetzt + STUNDE && !/^DIE NEUESTEN ENTWICKLUNGEN|^LIVE|Liveticker|Live-Ticker|EN DIRECT/i.test(x.title))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Dieselbe Geschichte steht oft mehrfach im Feed: gleiche lange Wörter = gleiche Meldung
const gesehen = [];
const woerter = t => new Set(t.toLowerCase().match(/[a-zäöüéèàçâêîôûœ]{5,}/g)?.filter(w => !['basel', 'schweiz', 'suisse'].includes(w)) || []);
const doppelt = t => { const w = woerter(t); return w.size > 0 && gesehen.some(g => [...w].filter(x => g.has(x)).length >= Math.min(3, w.size)); };

const items = [];
let geholt = 0, nichtVoll = 0;
for (const rub of RUBRIKEN) {
  const kandidaten = alle.filter(x => rub.quellen.includes(x.source) && jetzt - new Date(x.date) < rub.alter * STUNDE);
  const genommen = [], ersatz = [], proQuelle = {};
  let versuche = 0;
  for (const x of kandidaten) {
    if (genommen.length >= rub.n || versuche >= rub.n * 4) break;
    if ((proQuelle[x.source] || 0) >= 2 || doppelt(x.title) || fehler[x.url]) continue;
    let text = bekannt.get(x.url);
    if (!text && kurz[x.url]) { if (x.summary?.length > 100) ersatz.push({ rub, x, text: { url: x.url, autor: '', absaetze: [], zeichen: 0, voll: false } }); continue; }
    if (!text) {
      if (gesperrt.has(new URL(x.url).host)) continue;
      versuche++;
      try { text = await artikel(x); geholt++; await sleep(300); }
      catch (e) { fehler[x.url] = jetzt; console.log(`  ✗ ${x.source}: ${e.message} · ${x.title.slice(0, 60)}`); continue; }
    }
    const eintrag = { rub, x, text };
    if (!text.voll) { nichtVoll++; kurz[x.url] = jetzt; if (x.summary?.length > 100) ersatz.push(eintrag); continue; }
    genommen.push(eintrag); gesehen.push(woerter(x.title)); proQuelle[x.source] = (proQuelle[x.source] || 0) + 1;
  }
  // Fehlt noch etwas, kommen Artikel hinter der Bezahlschranke mit dem Anfang dazu
  for (const e of ersatz) {
    if (genommen.length >= rub.n) break;
    if ((proQuelle[e.x.source] || 0) >= 2 || doppelt(e.x.title)) continue;
    genommen.push(e); gesehen.push(woerter(e.x.title)); proQuelle[e.x.source] = (proQuelle[e.x.source] || 0) + 1;
  }
  genommen.sort((a, b) => new Date(b.x.date) - new Date(a.x.date));
  for (const { x, text } of genommen) {
    items.push({
      nr: items.length + 1, rubrik: rub.name, ...titelTeile(x.title), quelle: x.sourceLabel, lang: x.lang,
      datum: x.date, feedUrl: x.url, url: text.url, anriss: x.summary || '', text,
    });
  }
  console.log(`${rub.name}: ${genommen.length}/${rub.n} (${kandidaten.length} im Feed)`);
}

if (items.length < 10) { console.log('Zu wenig Artikel, lesen.json bleibt wie es war'); process.exit(1); }
// Nur schreiben, wenn sich das Menü geändert hat: sonst gäbe es jede Stunde einen leeren Commit
const gleich = JSON.stringify(items) === JSON.stringify(vorher.items || []);
if (!gleich) await writeFile(OUT, JSON.stringify({ stand: new Date().toISOString(), feed: feed.updated, items, fehler, kurz }) + '\n');
console.log(gleich ? 'Menü unverändert' : 'lesen.json geschrieben');
console.log(`${items.length} Artikel, ${geholt} neu geholt, ${nichtVoll} nur Anriss, ${Object.keys(fehler).length} Fehler gemerkt`);
