// Prüft die Druckvorlage: lädt die Lose mit Admin-Token, erzeugt das PDF und zählt die Seiten.
//   node advent/test/e2e-druck.js [ausgabeordner]
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { starten } = require('./server');

(async () => {
  const aus = process.argv[2] || '.';
  const { server, u, port } = await starten();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  await page.goto(`http://localhost:${port}/advent/druck.html`);
  await page.evaluate(p => localStorage.setItem('advent.api', `http://localhost:${p}/api`), port);
  await page.goto(`http://localhost:${port}/advent/druck.html?t=${u.token('admin')}`);
  await page.waitForSelector('.blatt');
  const blaetter = await page.locator('.blatt').count();
  const lose = await page.locator('.los').count();
  const qr = await page.locator('.feld-flaeche svg').count();
  if (page.url().includes('?t=')) throw new Error('Token steht noch in der Adresse');
  // Mass eines QR-Codes in mm (96 px = 25,4 mm)
  const qrMm = await page.locator('.feld-flaeche svg').first().evaluate(s => s.getBoundingClientRect().width * 25.4 / 96);
  await page.screenshot({ path: path.join(aus, 'druck-vorschau.png') });
  await page.pdf({ path: path.join(aus, 'druck.pdf'), preferCSSPageSize: true, printBackground: true });
  // Testblatt
  await page.selectOption('#auswahl', 'test');
  await page.fill('#tag', '6');
  await page.dispatchEvent('#tag', 'input');
  const testLose = await page.locator('.los').count();
  await page.pdf({ path: path.join(aus, 'testblatt.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.locator('.blatt').first().screenshot({ path: path.join(aus, 'testblatt.png') });
  const pdfSeiten = (fs.readFileSync(path.join(aus, 'druck.pdf'), 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(JSON.stringify({ blaetter, lose, qr, qrMm: qrMm.toFixed(2), testLose, pdfSeiten, fehler }));
  await browser.close();
  server.close();
  if (blaetter !== 6 || lose !== 24 || qr !== 96 || pdfSeiten !== 6 || testLose !== 2 || fehler.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
