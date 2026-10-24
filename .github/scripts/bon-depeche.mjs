// Baut die Dépêche (bon/depeche/?auto=1) in Chrome und lässt sie bei der Bon-Post einreichen.
// Die Seite wird aus diesem Checkout ausgeliefert, damit Zeitung und Schlagzeilen zum selben Stand gehören.
// Zum Ausprobieren ohne Druck: TROCKEN=1 node .github/scripts/bon-depeche.mjs  (legt bon-depeche-test.html ab)
import http from 'node:http';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPEN = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const datei = path.join(ROOT, path.normalize(p));
    if (!datei.startsWith(ROOT + path.sep)) throw new Error('ausserhalb');
    const inhalt = await readFile(datei);
    res.writeHead(200, { 'content-type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    res.end(inhalt);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));

const q = new URLSearchParams({ auto: '1' });
if (process.env.HALT !== undefined) q.set('halt', process.env.HALT);
if (process.env.TEILE) q.set('teile', process.env.TEILE);   // Abfuhrzone als Teil, z. B. …,abfuhr,zoned
if (process.env.ZONE) q.set('zone', process.env.ZONE);       // nur zum Ausprobieren, der Zeitplan schickt die Zone in TEILE
const url = `http://127.0.0.1:${server.address().port}/bon/depeche/?${q}`;

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : { channel: 'chrome' });
let ergebnis = 'Fehler: kein Ergebnis';
try {
  const ctx = await browser.newContext({ locale: 'de-CH', timezoneId: 'Europe/Zurich', viewport: { width: 800, height: 1000 } });
  if (process.env.TROCKEN) {
    await ctx.route('https://script.google.com/**', async route => {
      const d = JSON.parse(route.request().postData());
      await writeFile('bon-depeche-test.html', `<!doctype html><body style="margin:0;width:272px">${d.inhalt}</body>`);
      console.log('TROCKEN: Bon nicht eingereicht', d.titel, d.quelle, Math.round(d.inhalt.length / 1024) + ' kB');
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"id":"trocken"}' });
    });
  }
  const page = await ctx.newPage();
  page.on('console', m => console.log(`[Seite] ${m.type()}: ${m.text()}`));
  page.on('pageerror', e => console.log('[Seite] Fehler:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.fertig, null, { timeout: 180000 });
  ergebnis = await page.evaluate(() => document.body.dataset.fertig);
  console.log('Quellen:', (await page.textContent('#quellen')).replace(/\s+/g, ' '));
  console.log(await page.textContent('#mass'));
} finally {
  await browser.close();
  server.close();
}
console.log(ergebnis);
process.exit(ergebnis === 'ok' ? 0 : 1);
