// Erzeugt aus der Druckvorlage ein «Foto» eines Loses für die Tests.
'use strict';

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

module.exports = { losFoto };
