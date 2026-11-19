// Ende-zu-Ende-Test der SimOil-Seite (Chromium mit iPhone- und Android-Emulation).
// Tankstelle → Terminal (Foto der Druckvorlage, Erkennung, Einreichen, Ergebnis, Quittung) → Regal (Kauf, Öffnen).
//   node advent/test/e2e-simoil.js [ausgabeordner]
'use strict';
const { chromium, devices } = require('playwright');
const path = require('path');
const assert = require('assert/strict');
const { starten } = require('./server');
const { losFoto } = require('./foto');

const AUS = process.argv[2] || '.';

async function oeffnen(browser, port, u, geraet, wer, hash) {
  const ctx = await browser.newContext(devices[geraet]);
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  await page.goto(`http://localhost:${port}/advent/`);
  await page.evaluate(p => { localStorage.setItem('advent.api', `http://localhost:${p}/api`); }, port);
  await page.goto(`http://localhost:${port}/advent/?t=${u.token(wer || 'spieler')}${hash || ''}`);
  return { ctx, page, fehler };
}

/** Kein «null», «undefined», «NaN» oder offener Platzhalter auf der Seite. */
async function sauber(page, wo) {
  const text = await page.evaluate(() => document.body.innerText);
  assert.doesNotMatch(text, /\bnull\b|undefined|NaN|\{\w+\}/, 'Unsauberer Text in ' + wo + ': ' + text.slice(0, 300));
}

/** Simos Blase wegtippen, bis sie zu ist. */
async function simoWeg(page) {
  for (let i = 0; i < 10 && await page.locator('.blase:not(.weg)').count(); i++) {
    try { await page.click('.blase:not(.weg)', { timeout: 1000, force: true }); } catch (e) { /* schon weg */ }
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(300);
}

module.exports = { oeffnen, sauber, simoWeg };

if (require.main === module) (async () => {
  const { server, u, port } = await starten();
  const browser = await chromium.launch();
  u.jetzt('2026-12-01T18:00:00');
  const f1 = u.felder(1);

  // ---------- Tankstelle
  const { page, fehler } = await oeffnen(browser, port, u, 'iPhone 13');
  await page.waitForSelector('.tankstelle');
  await page.waitForSelector('.blase');
  assert.match(await page.textContent('.blase-name'), /Simo/);
  assert.ok(!page.url().includes('t='), 'Token aus der Adresse entfernt');
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('.klapp').nth(1).getAttribute('aria-label'), '1');
  assert.equal(await page.locator('.wimpel').count(), 0, 'kein Sonntag');
  await page.screenshot({ path: path.join(AUS, 'simoil-1-tankstelle.png') });
  await sauber(page, 'Tankstelle');

  // ---------- Terminal: Foto mit Feld 1 und 3
  const foto = path.join(AUS, 'simoil-los1.jpg');
  await losFoto(browser, port, u, 1, [1, 3], foto);
  await simoWeg(page);
  await page.click('a.pille[href="#/terminal"]');
  await page.waitForSelector('.display');
  assert.match(await page.textContent('.display'), /BEREIT/);
  await page.setInputFiles('#foto-kamera', foto);
  await page.waitForSelector('.code', { timeout: 30000 });
  const erkannt = await page.$$eval('.code', n => n.map(x => x.firstChild.textContent).sort());
  assert.deepEqual(erkannt, [f1[0].kuerzel, f1[2].kuerzel].sort());
  assert.match(await page.textContent('.display'), /ERKANNT 2\/2/);
  await page.screenshot({ path: path.join(AUS, 'simoil-2-erkannt.png'), fullPage: true });
  await simoWeg(page);
  await page.click('button.pille.rot');
  await page.waitForSelector('.quittung', { timeout: 30000 });
  const e = u.als('spieler', 'verlauf').lose[0].ergebnis;
  const lcd = await page.textContent('.display');
  assert.match(lcd, e.total > 0 ? /GEWINN/ : /KEIN GEWINN/);
  assert.equal(await page.locator('.quittung .q-zeile').count() >= 5, true);
  assert.match(await page.textContent('.quittung'), new RegExp('Total\\s*' + e.total));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(AUS, 'simoil-3-ergebnis.png'), fullPage: true });
  await sauber(page, 'Ergebnis');
  assert.ok(u.tabelle('Einsendungen')[0]['Foto-ID'], 'Foto gespeichert');
  // Terminal nochmals öffnen: heutiges Ergebnis wird gezeigt
  await page.goto(`http://localhost:${port}/advent/#/`);
  await page.waitForSelector('.tankstelle');
  await page.goto(`http://localhost:${port}/advent/#/terminal`);
  await page.waitForSelector('.quittung');
  assert.deepEqual(fehler, [], 'Browserfehler iPhone');
  await page.context().close();

  // ---------- Android: Tag 2, Kürzel von Hand, zuerst zu wenige
  u.jetzt('2026-12-02T08:00:00');
  const f2 = u.felder(2);
  const a = await oeffnen(browser, port, u, 'Pixel 7', 'spieler', '#/terminal');
  await a.page.waitForSelector('.display');
  await simoWeg(a.page);
  await a.page.fill('.eingabe input', f2[1].kuerzel.toLowerCase());
  await a.page.click('.eingabe .pille');
  await a.page.fill('.eingabe input', 'O0O0');
  await a.page.press('.eingabe input', 'Enter');
  assert.match(await a.page.textContent('.display'), /FEHLER/);
  await a.page.click('button.pille.rot');
  await a.page.waitForFunction(() => /FEHLER/.test(document.querySelector('.display').textContent), null, { timeout: 15000 });
  assert.match(await a.page.textContent('.display'), /braucht es 2/i);
  await a.page.fill('.eingabe input', f2[3].kuerzel);
  await a.page.press('.eingabe input', 'Enter');
  await a.page.click('button.pille.rot');
  await a.page.waitForSelector('.quittung', { timeout: 20000 });
  await a.page.screenshot({ path: path.join(AUS, 'simoil-4-android.png'), fullPage: true });
  assert.equal(u.tabelle('Einsendungen')[1]['Manuell'], 'ja');
  assert.deepEqual(a.fehler, [], 'Browserfehler Android');

  console.log('E2E SimOil Terminal: in Ordnung');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
