// erkennung.js – liest die QR-Codes aus einem Foto (zxing-wasm, läuft ganz im Browser).
//
//   const r = await Erkennung.lesen(datei);
//   r.codes   [{ qrId: 'K7QX-9F3HZP2W', kuerzel: 'K7QX', ecken: […] }]
//   r.vorschau  Data-URL (kleines JPEG) zum Anzeigen
//   r.jpeg      Data-URL (JPEG, max. 1280 px) zum Hochladen
//
// Ablauf: Foto auf ca. 1600 px verkleinern → lesen. Nichts gefunden → Graustufen mit mehr Kontrast →
// nochmals lesen. Immer noch nichts und das Foto ist grösser → in voller Auflösung (max. 3000 px) lesen.
(function () {
  'use strict';

  const ERKENNUNG_PX = 1600;   // lange Seite für die Erkennung
  const UPLOAD_PX = 1280;      // lange Seite fürs Hochladen
  const UPLOAD_QUALITAET = 0.72;
  const MUSTER = /^([2-9A-HJKMNP-Z]{4})-[2-9A-HJKMNP-Z]{8}$/;   // Aufbau der QR-IDs (siehe gas/Generator.gs)

  let bereit = null;

  /** Lädt zxing-wasm einmal (die .wasm-Datei liegt in lib/, kein CDN). */
  function laden() {
    if (!bereit) {
      bereit = new Promise((ok, nein) => {
        const s = document.createElement('script');
        s.src = 'lib/zxing-reader.js';
        s.onload = () => {
          ZXingWASM.prepareZXingModule({
            overrides: { locateFile: (p, prefix) => (p.endsWith('.wasm') ? new URL('lib/' + p, location.href).href : prefix + p) },
            fireImmediately: true
          }).then(ok, nein);
        };
        s.onerror = () => nein(new Error('zxing nicht geladen'));
        document.head.append(s);
      });
      bereit.catch(() => { bereit = null; });
    }
    return bereit;
  }

  /** Bild aus Datei laden. <img> beachtet die Drehung aus den Kameradaten (EXIF) von selbst. */
  function bildLaden(datei) {
    return new Promise((ok, nein) => {
      const url = URL.createObjectURL(datei);
      const img = new Image();
      img.onload = () => { ok(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = () => { URL.revokeObjectURL(url); nein(new Error('Bild unlesbar')); };
      img.src = url;
    });
  }

  function aufLeinwand(img, maxPx) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const f = Math.min(1, maxPx / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * f);
    c.height = Math.round(h * f);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /** Graustufen und Kontrast strecken (1 % dunkelste → schwarz, 1 % hellste → weiss). */
  function kontrast(daten) {
    const d = daten.data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
      d[i] = d[i + 1] = d[i + 2] = g;
      hist[g]++;
    }
    const n = d.length / 4;
    let lo = 0, hi = 255, s = 0;
    while (lo < 255 && (s += hist[lo]) < n * 0.01) lo++;
    s = 0;
    while (hi > 0 && (s += hist[hi]) < n * 0.01) hi--;
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.max(0, Math.min(255, (d[i] - lo) * 255 / span));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return daten;
  }

  async function lesenAus(imageData) {
    const treffer = await ZXingWASM.readBarcodes(imageData, {
      formats: ['QRCode'], tryHarder: true, tryRotate: true, tryInvert: false, maxNumberOfSymbols: 12
    });
    return treffer.filter(t => t.isValid);
  }

  function auswerten(treffer) {
    const gesehen = {};
    const codes = [];
    const fremd = [];
    treffer.forEach(t => {
      const text = String(t.text || '').trim().toUpperCase();
      const m = text.match(MUSTER);
      if (!m) { fremd.push(text); return; }
      if (gesehen[text]) return;
      gesehen[text] = true;
      codes.push({ qrId: text, kuerzel: m[1], ecken: t.position });
    });
    return { codes, fremd };
  }

  async function lesen(datei) {
    await laden();
    const img = await bildLaden(datei);
    const c = aufLeinwand(img, ERKENNUNG_PX);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const original = ctx.getImageData(0, 0, c.width, c.height);

    let versuch = 1;
    let treffer = await lesenAus(original);
    if (!treffer.length) {
      versuch = 2;
      treffer = await lesenAus(kontrast(ctx.getImageData(0, 0, c.width, c.height)));
    }
    const lang = Math.max(img.naturalWidth, img.naturalHeight);
    if (!treffer.length && lang > ERKENNUNG_PX * 1.2) {
      versuch = 3;
      const gross = aufLeinwand(img, 3000);
      treffer = await lesenAus(gross.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, gross.width, gross.height));
      gross.width = 0; gross.height = 0;
    }
    const erg = auswerten(treffer);
    const hoch = aufLeinwand(img, UPLOAD_PX);
    erg.jpeg = hoch.toDataURL('image/jpeg', UPLOAD_QUALITAET);
    // Leinwände sofort freigeben: iOS Safari erlaubt nur wenig Leinwand-Speicher
    [c, hoch].forEach(x => { x.width = 0; x.height = 0; });
    erg.vorschau = erg.jpeg;
    erg.versuch = versuch;
    erg.groesse = [c.width, c.height];
    return erg;
  }

  /** Prüft ein abgetipptes Kürzel. Gibt es in Grossbuchstaben zurück oder null. */
  function kuerzelPruefen(s) {
    const k = String(s || '').toUpperCase().replace(/[\s-]/g, '');
    return /^[2-9A-HJKMNP-Z]{4}$/.test(k) ? k : null;
  }

  window.Erkennung = { lesen, laden, kuerzelPruefen };
})();
