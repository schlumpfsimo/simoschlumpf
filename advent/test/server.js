// Lokaler Testserver: liefert advent/ aus und spielt unter /api das Apps-Script-Backend nach
// (gas-umgebung.js). Für Playwright-Tests und zum Ausprobieren am eigenen Rechner.
//
//   node advent/test/server.js            → zeigt Adresse und Links
//   Im Browser einmal:  localStorage.setItem('advent.api', 'http://localhost:<port>/api')
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { neueUmgebung } = require('./gas-umgebung');

const WURZEL = path.join(__dirname, '..');
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

/** Umgebung mit Beispiel-Losen, Geschenken und Katalog. */
function beispielUmgebung() {
  const u = neueUmgebung();
  u.zeilen('Geschenke', [
    { 'ID': 'G01', 'Titel': 'Kinogutschein', 'Art': 'code', 'Inhalt': 'KINO-2026-XY', 'Beschreibung': 'Einlösbar im Kult.kino' },
    { 'ID': 'G02', 'Titel': 'Ein Brief', 'Art': 'text', 'Inhalt': 'Liebe … dies ist ein Beispielbrief.' },
    { 'ID': 'G03', 'Titel': 'Playlist', 'Art': 'link', 'Inhalt': 'https://example.org/playlist' }
  ]);
  u.zeilen('Katalog', [
    { 'ID': 'K01', 'Titel': 'Frühstück im Bett', 'Beschreibung': 'Mit frischen Gipfeli.', 'Preis': '40', 'Sichtbarkeit': 'sichtbar' },
    { 'ID': 'K02', 'Titel': 'Ausflug nach Colmar', 'Beschreibung': 'Ein Tag auf dem Weihnachtsmarkt.', 'Preis': '150', 'Sichtbarkeit': 'sichtbar', 'Geschenk-ID': 'G03' },
    { 'ID': 'K03', 'Titel': 'Konzertkarten', 'Preis': '90', 'Sichtbarkeit': 'verdeckt mit Preis' },
    { 'ID': 'K04', 'Titel': 'Das grosse Geheimnis', 'Preis': '200', 'Sichtbarkeit': 'ganz verdeckt', 'Geschenk-ID': 'G02' },
    { 'ID': 'K05', 'Titel': 'Massage', 'Preis': '30', 'Sichtbarkeit': 'sichtbar', 'Bestand': '1', 'Verfügbar bis': '2026-12-15' },
    { 'ID': 'K06', 'Titel': 'Ab Mitte Dezember', 'Preis': '60', 'Sichtbarkeit': 'sichtbar', 'Sichtbar ab': '15.12.2026' }
  ]);
  const k = JSON.parse(fs.readFileSync(path.join(WURZEL, 'beispiel-konfiguration.json'), 'utf8'));
  const r = u.als('admin', 'admin_generieren', { konfiguration: k });
  if (!r.ok) throw new Error(r.text);
  return u;
}

function starten(u, port = 0) {
  u = u || beispielUmgebung();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (req.method !== 'POST') { res.end(JSON.stringify({ ok: true })); return; }
      if (req.headers['content-type'] && !/^text\/plain/.test(req.headers['content-type'])) {
        res.statusCode = 400; res.end('nur text/plain'); return;   // wie bei Apps Script: kein Preflight erlaubt
      }
      let body = '';
      req.on('data', d => { body += d; });
      req.on('end', () => {
        const antwort = u.kontext.doPost({ postData: { contents: body } }).getContent();
        u.letzteAnfragen = (u.letzteAnfragen || []).concat([JSON.parse(body)]).slice(-50);
        const verzoegerung = u.verzoegerung || 0;
        setTimeout(() => { res.setHeader('Content-Type', 'application/json'); res.end(antwort); }, verzoegerung);
      });
      return;
    }
    let datei = path.join(WURZEL, decodeURIComponent(url.pathname.replace(/^\/advent/, '')));
    if (!datei.startsWith(WURZEL)) { res.statusCode = 403; res.end(); return; }
    if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, 'index.html');
    fs.readFile(datei, (err, data) => {
      if (err) { res.statusCode = 404; res.end('nicht gefunden'); return; }
      res.setHeader('Content-Type', TYPEN[path.extname(datei)] || 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise(ok => server.listen(port, '127.0.0.1', () => ok({ server, u, port: server.address().port })));
}

module.exports = { starten, beispielUmgebung };

if (require.main === module) {
  starten(null, Number(process.env.PORT) || 0).then(({ u, port }) => {
    const basis = `http://localhost:${port}/advent/`;
    console.log('Testserver läuft:', basis);
    console.log('API für localStorage advent.api:', `http://localhost:${port}/api`);
    console.log('Spielerin:', basis + '?t=' + u.token('spieler'));
    console.log('Test:     ', basis + '?t=' + u.token('test'));
    console.log('Admin:    ', basis + 'admin.html?t=' + u.token('admin'));
  });
}
