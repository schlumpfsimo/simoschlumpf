// Ende-zu-Ende-Test der Spielerinnen-Seite mit Playwright (Chromium, Handy-Emulation).
// 1. Druckvorlage rendern, 2 Felder «ungerubbelt» lassen (grau abdecken), als JPEG «fotografieren».
// 2. Seite auf iPhone- und Android-Emulation öffnen, Foto hochladen, Codes erkennen, einreichen.
// 3. Ergebnis, Verlauf mit Foto, Katalog-Kauf (sichtbar und ganz verdeckt), Geschenke, Kürzel von Hand.
//   node advent/test/e2e-spielerin.js [ausgabeordner]
'use strict';
const { chromium, devices } = require('playwright');
const path = require('path');
const assert = require('assert/strict');
const { starten } = require('./server');

const AUS = process.argv[2] || '.';

/** Kein «null», «undefined» oder «NaN» auf der Seite. */
async function sauber(page, wo) {
  const text = await page.textContent('body');
  assert.doesNotMatch(text, /\bnull\b|undefined|NaN|\{\w+\}/, 'Platzhalter oder null in ' + wo);
}

/** Erzeugt ein «Foto» eines Loses: nur die Felder in «offen» sind freigerubbelt. */
async function losFoto(browser, port, u, tag, offen, datei, opt = {}) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: opt.scale || 2 });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/advent/druck.html`);
  await p.evaluate(port => { localStorage.setItem('advent.api', `http://localhost:${port}/api`); }, port);
  await p.goto(`http://localhost:${port}/advent/druck.html?t=${u.token('admin')}`);
  await p.waitForSelector('.blatt');
  await p.selectOption('#auswahl', 'test');
  await p.fill('#tag', String(tag));
  await p.dispatchEvent('#tag', 'input');
  // Nicht gerubbelte Felder mit «Rubbelkleber» abdecken, ganzes Los leicht drehen und unruhigen Hintergrund geben
  await p.evaluate(({ offen, drehen }) => {
    document.querySelectorAll('.blatt .los:first-child .feld').forEach((f, i) => {
      if (!offen.includes(i + 1)) {
        const fl = f.querySelector('.feld-flaeche');
        fl.style.background = 'linear-gradient(135deg,#9a9a9a,#c8c8c8 40%,#8d8d8d)';
        fl.querySelectorAll('svg,.kuerzel').forEach(x => { x.style.visibility = 'hidden'; });
      }
    });
    const los = document.querySelector('.blatt .los');
    los.style.transform = `rotate(${drehen}deg)`;
    los.style.background = '#fff';
    document.querySelector('.blatt').style.background = '#7b6a55';
  }, { offen, drehen: opt.drehen || 3 });
  const box = await p.locator('.blatt .los').first().boundingBox();
  await p.screenshot({ path: datei, type: 'jpeg', quality: 80,
    clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 } });
  await ctx.close();
}

async function spielen(browser, port, u, geraet, name) {
  const ctx = await browser.newContext(Object.assign({}, devices[geraet]));
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  await page.goto(`http://localhost:${port}/advent/`);
  await page.evaluate(port => localStorage.setItem('advent.api', `http://localhost:${port}/api`), port);
  await page.goto(`http://localhost:${port}/advent/?t=${u.token('spieler')}`);
  await page.waitForSelector('.zahl-gross');
  assert.ok(!page.url().includes('t='), 'Token aus Adresse entfernt');
  await page.screenshot({ path: path.join(AUS, name + '-1-start.png') });
  await sauber(page, 'start');
  return { ctx, page, fehler };
}

(async () => {
  const { server, u, port } = await starten();
  const browser = await chromium.launch();
  u.jetzt('2026-12-01T18:00:00');
  const f1 = u.felder(1);

  // ---------- Foto von Los 1, Felder 1 und 3 gerubbelt
  const foto1 = path.join(AUS, 'foto-los1.jpg');
  await losFoto(browser, port, u, 1, [1, 3], foto1);

  // ---------- iPhone
  const { page, fehler } = await spielen(browser, port, u, 'iPhone 13', 'iphone');
  assert.match(await page.textContent('main'), /Los 1 wartet/);
  await page.click('a[href="#/einlesen"].knopf');
  await page.waitForSelector('#foto-kamera', { state: 'attached' });
  assert.equal(await page.getAttribute('#foto-kamera', 'capture'), 'environment');
  await page.setInputFiles('#foto-kamera', foto1);
  await page.waitForSelector('.code', { timeout: 30000 });
  await page.waitForTimeout(300);
  const erkannt = await page.$$eval('.code', n => n.map(x => x.firstChild.textContent));
  assert.deepEqual(erkannt.sort(), [f1[0].kuerzel, f1[2].kuerzel].sort(), 'erkannte Kürzel ' + erkannt);
  assert.match(await page.textContent('main'), /2 von 2 Feldern/);
  await page.screenshot({ path: path.join(AUS, 'iphone-2-erkannt.png'), fullPage: true });
  await page.click('button:has-text("Einreichen")');
  await page.waitForSelector('.rv-summe', { timeout: 30000 });
  await page.waitForSelector('.felder-gitter', { timeout: 15000 });
  const erwartet = u.kontext.berechnen_({ typ: 'normal', felderzahl: 2 },
    [f1[0], f1[2]].map(f => ({ feld: f.feld, effekt: f.effekt, wert: f.wert, geschenkId: f.geschenk, richtig: f.richtig }))).losPunkte;
  assert.equal(await page.textContent('.rv-summe'), String(erwartet));
  assert.match(await page.textContent('main'), new RegExp('Neuer Kontostand: ' + erwartet + ' Punkte'));
  assert.equal(await page.locator('.feld-karte').count(), 4);
  assert.equal(await page.locator('.feld-karte.gerubbelt').count(), 2);
  await page.screenshot({ path: path.join(AUS, 'iphone-3-ergebnis.png'), fullPage: true });
  await sauber(page, 'ergebnis');
  const eins = u.tabelle('Einsendungen');
  assert.equal(eins.length, 1);
  assert.ok(eins[0]['Foto-ID'], 'Foto gespeichert');
  assert.equal(eins[0]['Manuell'], 'nein');
  const fotoBytes = u.dateien[eins[0]['Foto-ID']].blob.getBytes().length;
  assert.ok(fotoBytes > 10000 && fotoBytes < 800000, 'Fotogrösse ' + fotoBytes);

  // Start zeigt jetzt «eingelöst»
  await page.click('a[href="#/start"].knopf');
  await page.waitForSelector('.zahl-gross');
  assert.match(await page.textContent('main'), /Los 1 ist eingelöst/);

  // Verlauf mit Foto
  await page.click('.navi a[data-ziel="verlauf"]');
  await page.waitForSelector('.los-zeile');
  assert.equal(await page.locator('.los-zeile').count(), 24);
  await page.locator('.los-zeile').first().click();
  await page.click('button:has-text("Foto anzeigen")');
  await page.waitForSelector('.los-details img');
  await page.screenshot({ path: path.join(AUS, 'iphone-4-verlauf.png'), fullPage: true });
  await sauber(page, 'verlauf');

  // Katalog: Punkte gutschreiben, dann kaufen
  u.als('admin', 'admin_buchen', { betrag: 400, grund: 'Test' });
  await page.click('.navi a[data-ziel="katalog"]');
  await page.waitForSelector('.angebot');
  const titel = await page.$$eval('.angebot h2', n => n.map(x => x.textContent));
  assert.ok(titel.includes('Frühstück im Bett'));
  assert.ok(titel.includes('Überraschung'));
  assert.ok(titel.includes('Geheimnis'));
  assert.ok(!titel.includes('Ab Mitte Dezember'), 'Eintrag mit «Sichtbar ab» noch versteckt');
  assert.ok(!titel.includes('Konzertkarten'), 'verdeckter Titel bleibt verdeckt');
  await page.screenshot({ path: path.join(AUS, 'iphone-5-katalog.png'), fullPage: true });
  await sauber(page, 'katalog');
  // sichtbares Angebot
  await page.locator('.angebot', { hasText: 'Frühstück im Bett' }).locator('button').click();
  await page.waitForSelector('.dialog-box');
  assert.match(await page.textContent('.dialog-box'), /40 Punkte eintauschen/);
  await page.click('.dialog-box button:has-text("Ja, eintauschen")');
  await page.waitForSelector('.dialog-box h2');
  await page.click('.dialog-box button:has-text("OK")');
  // ganz verdeckt: Preis erst im Dialog
  await page.waitForSelector('.angebot');
  await page.locator('.angebot', { hasText: 'Geheimnis' }).locator('button').click();
  await page.waitForSelector('.dialog-box');
  assert.match(await page.textContent('.dialog-box'), /kostet 200 Punkte/);
  await page.click('.dialog-box button:has-text("Ja, eintauschen")');
  await page.waitForSelector('.dialog-box .geschenk-text');
  await page.screenshot({ path: path.join(AUS, 'iphone-6-gekauft.png') });
  await page.click('.dialog-box button:has-text("OK")');
  assert.equal(u.tabelle('Bestellungen').length, 2);
  assert.equal(u.mails.length, 2);
  assert.match(u.mails[0].betreff, /Frühstück im Bett/);
  // Geschenke
  await page.click('.navi a[data-ziel="geschenke"]');
  await page.waitForSelector('.geschenk');
  assert.equal(await page.locator('.geschenk').count(), 2);
  await page.screenshot({ path: path.join(AUS, 'iphone-7-geschenke.png'), fullPage: true });
  await sauber(page, 'geschenke');
  assert.deepEqual(fehler, [], 'Browserfehler iPhone');
  await page.context().close();

  // ---------- Android: Tag 2, Foto ohne erkennbare Codes, Kürzel von Hand
  u.jetzt('2026-12-02T08:00:00');
  const f2 = u.felder(2);
  const leer = path.join(AUS, 'foto-leer.jpg');
  await losFoto(browser, port, u, 2, [], leer);
  const a = await spielen(browser, port, u, 'Pixel 7', 'android');
  await a.page.goto(`http://localhost:${port}/advent/#/einlesen`);
  await a.page.waitForSelector('#foto-kamera', { state: 'attached' });
  await a.page.setInputFiles('#foto-kamera', leer);
  await a.page.waitForSelector('.meldung.fehler', { timeout: 30000 });
  assert.match(await a.page.textContent('main'), /keinen Code gefunden/);
  await a.page.fill('.eingabe-zeile input', f2[1].kuerzel.toLowerCase());
  await a.page.click('button:has-text("Hinzufügen")');
  await a.page.fill('.eingabe-zeile input', 'O0O0');
  await a.page.click('button:has-text("Hinzufügen")');
  assert.match(await a.page.textContent('main'), /genau 4 Zeichen/);
  await a.page.click('button:has-text("Einreichen")');
  await a.page.waitForSelector('.meldung.fehler >> text=braucht es genau 2', { timeout: 15000 });
  await a.page.screenshot({ path: path.join(AUS, 'android-2-zu-wenige.png'), fullPage: true });
  await a.page.fill('.eingabe-zeile input', f2[3].kuerzel);
  await a.page.press('.eingabe-zeile input', 'Enter');
  await a.page.click('button:has-text("Einreichen")');
  await a.page.waitForSelector('.felder-gitter', { timeout: 20000 });
  await a.page.screenshot({ path: path.join(AUS, 'android-3-ergebnis.png'), fullPage: true });
  await sauber(a.page, 'android');
  assert.equal(u.tabelle('Einsendungen')[1]['Manuell'], 'ja');
  assert.deepEqual(a.fehler, [], 'Browserfehler Android');

  // ---------- ohne Token
  const c3 = await browser.newContext(devices['iPhone 13']);
  const p3 = await c3.newPage();
  await p3.goto(`http://localhost:${port}/advent/`);
  await p3.waitForSelector('.meldung');
  assert.match(await p3.textContent('main'), /über den Link/);

  console.log('E2E Spielerin: alles in Ordnung');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
