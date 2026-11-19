// Baut die Google-Dienste (Sheet, Drive, Mail, Eigenschaften …) im Speicher nach und lädt
// alle .gs-Dateien aus advent/gas. So lässt sich das Backend ohne Google-Konto testen.
//
//   const u = neueUmgebung();          // leeres Sheet, einrichten() ist schon gelaufen
//   u.jetzt('2026-12-01T08:00:00');    // Uhrzeit in Zürich setzen
//   u.api({aktion:'start', token:u.token('spieler')})
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const GAS = path.join(__dirname, '..', 'gas');

function blattMock(name) {
  const rows = [];
  const breite = () => rows.reduce((m, r) => Math.max(m, r.length), 0);
  const sh = {
    rows,
    getName: () => name,
    getLastRow: () => {
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i] && rows[i].some(v => v !== '')) return i + 1;
      return 0;
    },
    getMaxRows: () => Math.max(1000, rows.length),
    getDataRange() {
      const n = sh.getLastRow(), b = breite();
      return {
        getDisplayValues: () => {
          const out = [];
          for (let i = 0; i < n; i++) {
            const r = rows[i] || [];
            out.push(Array.from({ length: b }, (_, j) => (r[j] == null ? '' : String(r[j]))));
          }
          return out.length ? out : [[]];
        }
      };
    },
    getRange(r, c, nr = 1, nc = 1) {
      const range = {
        setValues(vals) {
          if (vals.length !== nr || vals.some(v => v.length !== nc)) throw new Error('Mock: falsche Grösse in setValues');
          for (let i = 0; i < nr; i++) {
            rows[r - 1 + i] = rows[r - 1 + i] || [];
            for (let j = 0; j < nc; j++) rows[r - 1 + i][c - 1 + j] = String(vals[i][j]);
          }
          return range;
        },
        getDisplayValues: () => Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => String(((rows[r - 1 + i] || [])[c - 1 + j]) ?? ''))),
        setNumberFormat: () => range,
        setFontWeight: () => range
      };
      return range;
    },
    deleteRows(start, n) { rows.splice(start - 1, n); },
    setFrozenRows() {}
  };
  return sh;
}

function neueUmgebung({ einrichten = true } = {}) {
  const sheets = {};
  const reihenfolge = [];
  const props = {};
  const dateien = {};
  const mails = [];
  let jetztMs = Date.parse('2026-11-25T10:00:00Z');

  const ss = {
    getId: () => 'SHEET',
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => { sheets[n] = blattMock(n); reihenfolge.push(n); return sheets[n]; },
    getSheets: () => reihenfolge.map(n => sheets[n]),
    deleteSheet: sh => { delete sheets[sh.getName()]; reihenfolge.splice(reihenfolge.indexOf(sh.getName()), 1); }
  };

  function blob(bytes, typ, name) {
    return { getBytes: () => bytes, getContentType: () => typ, getName: () => name };
  }

  const kontext = {
    console: { log() {}, error() {}, warn() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = String(v); },
        deleteProperty: k => { delete props[k]; }
      })
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) },
    Utilities: {
      formatDate(d, tz, fmt) {
        const t = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d);
        const g = Object.fromEntries(t.map(p => [p.type, p.value]));
        return fmt.replace('yyyy', g.year).replace('MM', g.month).replace('dd', g.day)
          .replace('HH', g.hour).replace('mm', g.minute).replace('ss', g.second);
      },
      getUuid: () => crypto.randomUUID(),
      base64Decode: s => Array.from(Buffer.from(s, 'base64')),
      base64Encode: b => Buffer.from(b).toString('base64'),
      newBlob: blob
    },
    DriveApp: {
      createFolder: () => ({ getId: () => 'ORDNER' }),
      getFolderById: () => ({
        createFile(b) {
          const id = 'DATEI' + crypto.randomBytes(12).toString('hex');
          dateien[id] = { blob: b, papierkorb: false };
          return { getId: () => id };
        }
      }),
      getFileById(id) {
        if (!dateien[id]) throw new Error('Datei fehlt');
        return { getBlob: () => dateien[id].blob, setTrashed: v => { dateien[id].papierkorb = v; } };
      }
    },
    MailApp: { sendEmail: (an, betreff, text) => mails.push({ an, betreff, text }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'ich@example.org' }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: s => ({ inhalt: s, setMimeType() { return this; }, getContent() { return s; } })
    }
  };
  vm.createContext(kontext);
  const quelltext = fs.readdirSync(GAS).filter(f => f.endsWith('.gs')).sort()
    .map(f => `// ---- ${f}\n` + fs.readFileSync(path.join(GAS, f), 'utf8')).join('\n');
  vm.runInContext(quelltext, kontext, { filename: 'gas.js' });
  // Zeit steuerbar machen
  kontext.jetzt_ = () => new Date(jetztMs);

  const u = {
    kontext, sheets, props, dateien, mails,
    /** Zürcher Ortszeit setzen, z. B. '2026-12-01T08:00:00' (Winterzeit = UTC+1). */
    jetzt(lokal) { jetztMs = Date.parse(lokal + '+01:00'); },
    token: wer => props[{ spieler: 'SPIELER_TOKEN', test: 'TEST_TOKEN', admin: 'ADMIN_TOKEN' }[wer]],
    /** Anfrage wie vom Browser (JSON hin und zurück, damit nichts Unserialisierbares durchrutscht). */
    api(obj) {
      const antwort = kontext.doPost({ postData: { contents: JSON.stringify(obj) } });
      return JSON.parse(antwort.getContent());
    },
    /** Kurzform: Anfrage als Spielerin/Test/Admin. */
    als(wer, aktion, rest = {}) { return u.api(Object.assign({ aktion, token: u.token(wer) }, rest)); },
    /** Blatt als Objekte (Kopfzeile = Schlüssel). */
    tabelle(name) {
      const sh = sheets[name];
      const [kopf, ...rest] = sh.rows;
      return rest.filter(r => r && r.some(v => v !== '')).map(r => Object.fromEntries(kopf.map((k, i) => [k, r[i] ?? ''])));
    },
    /** Zeilen ans Blatt anhängen (Objekte mit Spaltenköpfen). */
    zeilen(name, objs) {
      const sh = sheets[name];
      const kopf = sh.rows[0];
      objs.forEach(o => sh.rows.push(kopf.map(k => (o[k] == null ? '' : String(o[k])))));
    },
    /** Felder eines Tages: [{feld, qrId, kuerzel, effekt, wert, …}] */
    felder(tag) {
      return u.tabelle('Felder').filter(f => Number(f['Tag']) === tag).map(f => ({
        feld: Number(f['Feld']), qrId: f['QR-ID'], kuerzel: f['Kürzel'], effekt: f['Effekt'],
        wert: Number(f['Wert'] || 0), geschenk: f['Ware-ID'], richtig: f['Richtig'] === 'ja'
      }));
    }
  };
  if (einrichten) kontext.einrichten();
  return u;
}

module.exports = { neueUmgebung };
