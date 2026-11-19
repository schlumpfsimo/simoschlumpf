// Ende-zu-Ende-Test der Admin-Seite (Chromium, Desktop-Breite).
//   node advent/test/e2e-admin.js [ausgabeordner]
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert/strict');
const { starten } = require('./server');

const AUS = process.argv[2] || '.';

(async () => {
  const { server, u, port } = await starten();
  u.jetzt('2026-12-03T09:00:00');
  // Spielerin hat Los 1 nachgeholt und Los 3 eingereicht, etwas gekauft
  const f1 = u.felder(1), f3 = u.felder(3);
  assert.equal(u.als('spieler', 'einreichen', { codes: [f1[0].qrId, f1[1].qrId], foto: Buffer.from('jpeg').toString('base64') }).ok, true);
  assert.equal(u.als('spieler', 'einreichen', { codes: [f3[0].qrId, f3[1].qrId] }).ok, true);
  u.als('admin', 'admin_buchen', { betrag: 100 });
  assert.equal(u.als('spieler', 'kaufen', { id: 'W01', preis: 30 }).ok, true);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  const antworten = [];
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? (antworten.shift() ?? '') : undefined));

  await page.goto(`http://localhost:${port}/advent/admin.html`);
  await page.evaluate(p => localStorage.setItem('advent.api', `http://localhost:${p}/api`), port);
  await page.goto(`http://localhost:${port}/advent/admin.html?t=${u.token('admin')}`);
  await page.waitForSelector('.zahl-gross');
  const saldo = u.als('spieler', 'start').saldo;
  assert.equal((await page.textContent('.zahl-gross')).replace(/\D/g, ''), String(saldo));
  assert.match(await page.textContent('main'), new RegExp(u.token('spieler')));
  await page.screenshot({ path: path.join(AUS, 'admin-1-uebersicht.png'), fullPage: true });

  // Einsendungen: Foto, Ergebnis ändern
  await page.click('#reiter button[data-reiter="einsendungen"]');
  await page.waitForSelector('table.liste');
  assert.equal(await page.locator('table.liste tbody tr').count(), 2);
  await page.click('button:has-text("Foto")');
  await page.waitForSelector('.fotobox img', { state: 'attached' });
  antworten.push('77', 'Kulanz');
  await page.locator('tr', { hasText: /^3/ }).first();
  await page.locator('table.liste tbody tr').first().locator('button:has-text("Ergebnis ändern")').click();
  await page.waitForSelector('.meldung.gut');
  const e3 = u.tabelle('Einsendungen').find(e => e['Tag'] === '3');
  assert.equal(e3['Status'], 'vom Admin geändert');
  assert.equal(e3['Punkte'], '77');
  // Los 1 zurücksetzen
  await page.locator('table.liste tbody tr').nth(1).locator('button:has-text("Zurücksetzen")').click();
  await page.waitForSelector('.meldung.gut >> text=zurückgesetzt');
  assert.equal(u.tabelle('Einsendungen').find(e => e['Tag'] === '1')['Status'], 'zurückgesetzt');
  await page.screenshot({ path: path.join(AUS, 'admin-2-einsendungen.png'), fullPage: true });

  // Bestellungen
  await page.click('#reiter button[data-reiter="bestellungen"]');
  await page.click('button:has-text("Erledigt")');
  await page.waitForSelector('.meldung.gut');
  assert.equal(u.tabelle('Bestellungen')[0]['Status'], 'erledigt');

  // Punkte buchen
  await page.click('#reiter button[data-reiter="punkte"]');
  await page.fill('input[type=number]', '-5');
  await page.fill('input[type=text]', 'Abzug Test');
  await page.click('button:has-text("Buchen")');
  await page.waitForSelector('.meldung.gut');
  assert.equal(u.tabelle('Buchungen').at(-1)['Betrag'], '-5');

  // Ware anlegen
  await page.click('#reiter button[data-reiter="ware"]');
  await page.waitForSelector('.ware-zeile');
  const vorher = await page.locator('.ware-zeile').count();
  await page.click('button:text-is("Neue Ware")');
  await page.fill('.formular label:has-text("Titel") input', 'Testware');
  await page.fill('.formular label:has-text("Preis") input', '55');
  await page.selectOption('.formular label:has-text("Illustration") select', 'kerze');
  await page.click('.formular button:text-is("Speichern")');
  await page.waitForSelector('.meldung.gut');
  await page.waitForSelector('.ware-zeile');
  assert.equal(await page.locator('.ware-zeile').count(), vorher + 1);
  assert.ok(u.tabelle('Ware').some(w => w['Titel'] === 'Testware' && w['Preis'] === '55' && w['Illustration'] === 'kerze'));
  await page.screenshot({ path: path.join(AUS, 'admin-5-ware.png'), fullPage: true });

  // Einstellungen: Testdatum
  await page.click('#reiter button[data-reiter="einstellungen"]');
  await page.fill('input[type=date]', '2026-12-20');
  await page.click('button:has-text("Speichern")');
  await page.waitForSelector('.meldung.gut');
  assert.equal(u.als('test', 'start').heute, '2026-12-20');
  assert.equal(u.als('spieler', 'start').heute, '2026-12-03');

  // Testmodus umschalten
  await page.click('#modus button[data-modus="test"]');
  await page.waitForSelector('#testband:not([hidden])');
  assert.match(await page.textContent('#testband'), /So 20\.12\.2026/);

  // Lose
  await page.click('#reiter button[data-reiter="lose"]');
  await page.waitForSelector('table.liste');
  assert.equal(await page.locator('table.liste tbody tr').count(), 24);
  await page.screenshot({ path: path.join(AUS, 'admin-3-lose.png'), fullPage: true });

  // Lose erzeugen: prüfen (Konfiguration ist vorausgefüllt), dann Fehler zeigen
  await page.click('#reiter button[data-reiter="erzeugen"]');
  await page.waitForFunction(() => document.querySelector('textarea').value.length > 100);
  await page.click('button:has-text("Prüfen")');
  await page.waitForSelector('.meldung.gut >> text=in Ordnung');
  assert.equal(await page.locator('table.liste tbody tr').count(), 24);
  await page.screenshot({ path: path.join(AUS, 'admin-4-erzeugen.png'), fullPage: true });
  await page.fill('textarea', '{"lose":[{"tag":1,"felder":["P1"]}]}');
  await page.click('button:has-text("Prüfen")');
  await page.waitForSelector('pre.fehlerliste');
  assert.match(await page.textContent('pre.fehlerliste'), /genau 4 Felder/);
  // Erzeugen ohne «überschreiben» wird abgelehnt (Spielerin hat gespielt)
  await page.click('button:has-text("Beispiel laden")');
  await page.waitForFunction(() => document.querySelector('textarea').value.includes('_hinweis'));
  await page.click('#ansicht button:text-is("Erzeugen")');
  await page.waitForSelector('pre.fehlerliste >> text=schon');

  assert.deepEqual(fehler, []);
  console.log('E2E Admin: alles in Ordnung');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
