// Gesamttest im Browser: 24 Tage mit dem Testzugang und simuliertem Datum (Testdatum).
// Jeden Tag: Foto des Loses mit den erlaubten Feldern freigerubbelt → einlesen → einreichen → Ergebnis prüfen.
// Sonntage (Quiz): richtige Antwort an zwei Tagen, falsche an einem. Tag 10 mit einem Feld zu viel (ungültig).
//   node advent/test/e2e-24tage.js [ausgabeordner]
'use strict';
const { chromium, devices } = require('playwright');
const path = require('path');
const assert = require('assert/strict');
const { starten } = require('./server');
const { losFoto } = require('./foto');

const AUS = process.argv[2] || '.';

(async () => {
  const { server, u, port } = await starten();
  u.jetzt('2026-11-28T12:00:00');          // echtes Datum: vor dem Start
  const browser = await chromium.launch();
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  await page.goto(`http://localhost:${port}/advent/`);
  await page.evaluate(p => localStorage.setItem('advent.api', `http://localhost:${p}/api`), port);
  await page.goto(`http://localhost:${port}/advent/?t=${u.token('test')}`);
  await page.waitForSelector('.zahl-gross');
  let saldo = 0;
  const protokoll = [];

  for (let tag = 1; tag <= 24; tag++) {
    u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': `2026-12-${String(tag).padStart(2, '0')}` } });
    const felder = u.felder(tag);
    const los = u.tabelle('Lose')[tag - 1];
    const noetig = Number(los['Felderzahl']);
    let offen;
    if (los['Typ'] === 'quiz') {
      const richtig = felder.find(f => f.richtig).feld;
      offen = tag === 13 ? [richtig === 1 ? 2 : 1] : [richtig];
    } else {
      offen = [1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, tag === 10 ? 3 : noetig);
    }
    const foto = path.join(AUS, `tag${tag}.jpg`);
    await losFoto(browser, port, u, tag, offen, foto, { scale: 1.5 + Math.random(), drehen: Math.round(Math.random() * 16 - 8) });

    await page.goto(`http://localhost:${port}/advent/#/start`);
    await page.waitForSelector('.zahl-gross');
    assert.match(await page.textContent('#testband'), new RegExp(`${tag}\\.12\\.2026`));
    assert.match(await page.textContent('main'), new RegExp(`Los ${tag} wartet`));
    await page.click('a.knopf[href="#/einlesen"]');
    await page.waitForSelector('#foto-kamera', { state: 'attached' });
    await page.setInputFiles('#foto-kamera', foto);
    await page.waitForFunction(n => document.querySelectorAll('.code').length >= n || document.querySelector('.meldung.fehler'), offen.length, { timeout: 30000 });
    const erkannt = await page.$$eval('.code', n => n.map(x => x.firstChild.textContent).sort());
    assert.deepEqual(erkannt, offen.map(n => felder[n - 1].kuerzel).sort(), `Tag ${tag}: erkannt ${erkannt}`);
    if (tag === 10) assert.match(await page.textContent('main'), /Los ungültig/);
    await page.click('button:has-text("Einreichen")');
    await page.waitForSelector('.felder-gitter', { timeout: 30000 });
    const e = u.als('test', 'verlauf').lose[tag - 1].ergebnis;
    assert.ok(e, `Tag ${tag}: Ergebnis gespeichert`);
    assert.equal(await page.textContent('.rv-summe'), String(e.total).replace(/\B(?=(\d{3})+(?!\d))/g, '’'));
    if (tag === 10) assert.equal(e.ungueltig, true);
    if (tag === 13) assert.equal(e.quizRichtig, false);
    if (tag === 6 || tag === 20) assert.equal(e.quizRichtig, true);
    saldo += e.total;
    protokoll.push(`${tag}:${e.total}${e.serienbonus ? '+B' : ''}${e.ungueltig ? '(ungültig)' : ''}`);
    if (tag === 24) await page.screenshot({ path: path.join(AUS, 'tag24-ergebnis.png'), fullPage: true });
  }

  // Nach Tag 24: Startseite zeigt Ende, Verlauf vollständig, Saldo stimmt
  u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': '2026-12-26' } });
  await page.goto(`http://localhost:${port}/advent/#/start`);
  await page.waitForSelector('.zahl-gross');
  assert.match(await page.textContent('main'), /Alle Lose sind gespielt/);
  assert.equal((await page.textContent('.zahl-gross')).replace(/\D/g, ''), String(saldo));
  await page.goto(`http://localhost:${port}/advent/#/verlauf`);
  await page.waitForSelector('.los-zeile');
  assert.equal(await page.locator('.los-zeile .marke.gut').count(), 23);
  assert.equal(await page.locator('.los-zeile .marke.schlecht').count(), 1);
  await page.screenshot({ path: path.join(AUS, 'tag24-verlauf.png'), fullPage: true });
  // Spielerin unberührt
  assert.equal(u.als('spieler', 'start').saldo, 0);
  assert.equal(u.tabelle('Einsendungen').filter(x => x['Modus'] === 'echt').length, 0);
  assert.deepEqual(fehler, []);
  console.log('24 Tage im Browser: in Ordnung. Saldo ' + saldo + '. ' + protokoll.join(' '));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
