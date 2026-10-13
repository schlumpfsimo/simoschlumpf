// Ajoute ?v=<version> à tous les liens CSS/JS du flux, pour que les téléphones
// ne mélangent jamais un ancien style.css avec un nouveau JavaScript (GitHub Pages met en cache 10 min).
// À lancer avant chaque mise en ligne : node .github/scripts/bump-version.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';

const root = new URL('../../feed/', import.meta.url);
const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) out.push(...(await files(url)));
    else if (/\.(js|html)$/.test(e.name)) out.push(url);
  }
  return out;
}

for (const file of await files(root)) {
  const src = await readFile(file, 'utf8');
  const next = src
    // import … from './x.js' / '../x.js'
    .replace(/(from\s+'\.{1,2}\/[^'?]+\.js)(\?v=\w+)?'/g, `$1?v=${version}'`)
    // <link href="style.css"> et <script src="js/app.js">
    .replace(/((?:href|src)="(?:style\.css|js\/app\.js))(\?v=\w+)?"/g, `$1?v=${version}"`);
  if (next !== src) await writeFile(file, next);
}
console.log('version', version);
