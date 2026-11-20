// Gesamttest im Browser: alle 24 Tage mit dem Testzugang und simuliertem Datum (Testdatum),
// abwechselnd auf iPhone- (ungerade Tage) und Android-Emulation (gerade Tage).
// Jeden Tag: Tankstelle prüfen → Foto der Druckvorlage mit den gerubbelten Feldern → Terminal → Ergebnis prüfen.
// Besondere Tage: 6. Sofortgewinn, 11. ein Feld zu viel (ungültig), 17. Quiz falsch, 24. Jackpot.
// Am Schluss: Regal zeigt die Sofortgewinne, Kontostand stimmt, die echte Spielerin ist unberührt.
//   node advent/test/e2e-24tage.js [ausgabeordner]
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert/strict');
const { starten } = require('./server');
const { losFoto } = require('./foto');
const { oeffnen, sauber, simoWeg } = require('./e2e-simoil');

const AUS = process.argv[2] || '.';
const zahl = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

(async () => {
  const { server, u, port } = await starten();
  u.jetzt('2026-11-28T12:00:00');          // echtes Datum: vor dem Start
  const browser = await chromium.launch();
  const geraete = { 'iPhone 13': await oeffnen(browser, port, u, 'iPhone 13', 'test', '#/'), 'Pixel 7': await oeffnen(browser, port, u, 'Pixel 7', 'test', '#/') };
  let saldo = 0;
  const protokoll = [];

  for (let tag = 1; tag <= 24; tag++) {
    const geraet = tag % 2 ? 'iPhone 13' : 'Pixel 7';
    const { page } = geraete[geraet];
    u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': `2026-12-${String(tag).padStart(2, '0')}` } });
    const felder = u.felder(tag);
    const los = u.tabelle('Lose')[tag - 1];
    const noetig = Number(los['Felderzahl']);
    const nr = typ => felder.find(typ).feld;
    let offen;
    if (los['Typ'] === 'quiz') offen = tag === 17 ? [felder.find(f => !f.richtig).feld] : [nr(f => f.richtig)];
    else if (tag === 6) offen = [nr(f => f.effekt === 'sofortgewinn'), nr(f => f.effekt === 'multiplikator')];
    else if (tag === 24) offen = [nr(f => f.wert === 100), nr(f => f.effekt === 'multiplikator')];
    else offen = [1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, tag === 11 ? 3 : noetig);
    const foto = path.join(AUS, `tag${tag}.jpg`);
    await losFoto(browser, port, u, tag, offen, foto, { scale: 1.5 + Math.random(), drehen: Math.round(Math.random() * 16 - 8) });

    // Tankstelle (Seite jeden Tag frisch laden, wie am nächsten Morgen)
    await page.goto(`http://localhost:${port}/advent/?tag=${tag}#/`);
    await page.waitForSelector('.tankstelle');
    await page.waitForFunction(() => document.querySelectorAll('.klapp')[1].getAttribute('aria-label'));
    assert.equal(await page.locator('.klapp').nth(1).getAttribute('aria-label'), String(tag), `Tag ${tag}: Losnummer`);
    assert.equal(await page.locator('.klapp').first().getAttribute('aria-label'), String(saldo), `Tag ${tag}: Punkte auf der Tafel`);
    const sonntag = [6, 13, 20].includes(tag);
    assert.equal(await page.locator('.wimpel').count(), sonntag ? 1 : 0, `Tag ${tag}: Wimpel nur am Sonntag`);
    if (sonntag && tag === 6) await page.screenshot({ path: path.join(AUS, 'tag06-tankstelle.png') });
    await sauber(page, `Tankstelle Tag ${tag}`);

    // Terminal
    await page.goto(`http://localhost:${port}/advent/#/terminal`);
    await page.waitForSelector('.display');
    await simoWeg(page);
    assert.match(await page.textContent('.display'), /BEREIT/);
    await page.setInputFiles('#foto-kamera', foto);
    await page.waitForFunction(n => document.querySelectorAll('.code').length >= n, offen.length, { timeout: 30000 });
    const erkannt = await page.$$eval('.code', n => n.map(x => x.firstChild.textContent).sort());
    assert.deepEqual(erkannt, offen.map(n => felder[n - 1].kuerzel).sort(), `Tag ${tag}: erkannt ${erkannt}`);
    if (tag === 11) assert.match(await page.textContent('.display'), /ZU VIELE/);
    await simoWeg(page);
    await page.click('button.pille.rot');
    await page.waitForSelector('.quittung', { timeout: 30000 });
    const e = u.als('test', 'verlauf').lose[tag - 1].ergebnis;
    const lcd = await page.textContent('.display');
    if (tag === 11) { assert.equal(e.ungueltig, true); assert.match(lcd, /LOS UNGÜLTIG/); }
    else if (tag === 24) { assert.equal(e.jackpot, true); assert.match(lcd, /JACKPOT/); }
    else if (e.total > 0 || e.gewinne.length) assert.match(lcd, /GEWINN/);
    else assert.match(lcd, /KEIN GEWINN/);
    if (tag === 17) assert.equal(e.quizRichtig, false);
    if (tag === 3 || tag === 10) assert.equal(e.quizRichtig, true);
    if (tag === 6) assert.equal(e.gewinne[0].id, 'W90');
    assert.match(await page.textContent('.quittung'), new RegExp('Total\\s*' + zahl(e.total) + ' Pkt'));
    saldo += e.total;
    protokoll.push(`${tag}:${e.total}${e.serienbonus ? '+B' : ''}${e.ungueltig ? '(ungültig)' : ''}${e.jackpot ? '(Jackpot)' : ''}${e.gewinne.length ? '(Sofortgewinn)' : ''}`);
    if (tag === 24) { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(AUS, 'tag24-jackpot.png'), fullPage: true }); }
  }

  // Nach Tag 24: Regal mit Sofortgewinnen, Tafel mit Endstand, Simo sagt «ende»
  u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': '2026-12-26' } });
  const { page, fehler } = geraete['iPhone 13'];
  await page.goto(`http://localhost:${port}/advent/?ende=1#/regal`);
  await page.waitForSelector('.regal .ware');
  const gewonnen = await page.$$eval('.ware', n => n.filter(x => x.querySelector('.band-gehoert')).map(x => x.querySelector('.ware-titel').textContent));
  assert.ok(gewonnen.includes('Duftbaum Vanille'), 'Sofortgewinn vom 6.12. im Regal');
  assert.ok(!gewonnen.includes('Wochenende weg'), 'am 24.12. nicht gerubbelt, also nicht gewonnen');
  await page.screenshot({ path: path.join(AUS, 'tag26-regal.png'), fullPage: true });
  await page.goto(`http://localhost:${port}/advent/?ende=2#/`);
  await page.waitForSelector('.tankstelle');
  await page.waitForFunction(() => document.querySelectorAll('.klapp')[0].getAttribute('aria-label'));
  assert.equal(await page.locator('.klapp').first().getAttribute('aria-label'), String(saldo));
  assert.equal(u.als('spieler', 'start').saldo, 0, 'Spielerin unberührt');
  assert.equal(u.tabelle('Einsendungen').filter(x => x['Modus'] === 'echt').length, 0);
  assert.deepEqual(fehler.concat(geraete['Pixel 7'].fehler), [], 'Browserfehler');
  console.log('24 Tage im Browser: in Ordnung. Saldo ' + saldo + '. ' + protokoll.join(' '));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
