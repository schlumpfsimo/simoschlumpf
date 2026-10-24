// Ölpreise für die Dépêche (bon/depeche/). Es gibt keine freie Quelle, die der Browser direkt abrufen darf,
// darum holt GitHub die Schlusskurse regelmässig und legt sie neben die App: bon/depeche/maerkte.json
import { writeFile } from 'node:fs/promises';

const SORTEN = { brent: 'BZ=F', wti: 'CL=F' };

async function kurs(symbol){
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=10d&interval=1d`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Bon-Depeche; https://www.simoschlumpf.ch/bon/)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`${symbol}: HTTP ${r.status}`);
  const d = (await r.json()).chart.result[0];
  const tage = d.timestamp.map((t, i) => ({ t, c: d.indicators.quote[0].close[i] })).filter(x => x.c != null);
  if (tage.length < 2) throw new Error(`${symbol}: zu wenig Kurse`);
  const [vor, letzt] = tage.slice(-2);
  return {
    preis: +letzt.c.toFixed(2),
    vortag: +vor.c.toFixed(2),
    datum: new Date(letzt.t * 1000).toISOString().slice(0, 10),
    waehrung: d.meta.currency,
  };
}

const out = { aktualisiert: new Date().toISOString(), quelle: 'Yahoo Finance, Terminkontrakte' };
for (const [name, symbol] of Object.entries(SORTEN)) out[name] = await kurs(symbol);
await writeFile(new URL('../../bon/depeche/maerkte.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
