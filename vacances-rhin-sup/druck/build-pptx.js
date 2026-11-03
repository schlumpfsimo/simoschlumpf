// Erzeugt den Wandkalender als bearbeitbare PowerPoint-Datei (A1 quer, nur Vektorformen).
// Daten kommen direkt aus ../index.html.  Aufruf: node build-pptx.js
const fs = require("fs"), path = require("path");
const pptxgen = require("pptxgenjs");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const js = html.slice(html.indexOf("<script>") + 8, html.indexOf("const MDE"));
const R = new Function(js + "; return R;")();
const stand = (html.match(/Stand : ([0-9.]+)/) || [])[1] || "";

const COL = { bw:"1F3F99", rp:"1A9A4A", als:"E8B400", bas:"8A2A7A", so:"E46F1B", ju:"1AA6D9", ag:"D7192B", bl:"8C5A24" };
const FG="1B2333", MUTED="5D6678", LINE="D5DAE3", WE="E4E7EE", HEAD="24438F", FLAG="C8102E", PANEL="F3F5F9";
const MDE=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const MFR=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const WD=["di","lu","ma","me","je","ve","sa"];
const key=(m,d)=>String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
const short=s=>s.split(" (")[0];
const fmt=k=>{const[m,d]=k.split("-");return d+"."+m+".";};
const wdOf=k=>{const[m,d]=k.split("-").map(Number);return WD[new Date(2027,m-1,d).getDay()];};

const pres = new pptxgen();
const W = 84.1/2.54, H = 59.4/2.54;              // A1 quer in Zoll
pres.defineLayout({ name:"A1Q", width:W, height:H });
pres.layout = "A1Q";
pres.title = "Vacances scolaires & jours fériés Rhin supérieur 2027 / Schulferien & Feiertage Oberrhein 2027";
pres.theme = { headFontFace:"Cambria", bodyFontFace:"Calibri" };

const M = 0.7;
const txt = (s, t, o) => s.addText(t, Object.assign({ isTextBox:true, margin:0, fontFace:"Calibri", color:FG }, o));
const rect = (s, o) => s.addShape(pres.shapes.RECTANGLE, o);

function header(s, sub) {
  txt(s, "Vacances scolaires & jours fériés dans le Rhin supérieur", { x:M, y:0.55, w:W-2*M-4, h:0.95, fontFace:"Cambria", fontSize:54, bold:true, color:HEAD, objectName:"Titel" });
  txt(s, sub, { x:M, y:1.5, w:W-2*M-4, h:0.55, fontSize:28, bold:true, color:MUTED, objectName:"Untertitel" });
  txt(s, "2027", { x:W-M-4, y:0.45, w:4, h:1.6, fontFace:"Cambria", fontSize:110, bold:true, align:"right", valign:"bottom", objectName:"Jahr" });
}

// ---------- Folie 1: Wandkalender ----------
const s = pres.addSlide();
s.background = { color:"FFFFFF" };
header(s, "Schulferien & Feiertage am Oberrhein");

// Legende
let lx = M; const ly = 2.45;
txt(s, [{ text:"Collectivités ", options:{ bold:true } }, { text:"/ Gebiete", options:{ color:MUTED } }], { x:lx, y:ly, w:2.6, h:0.4, fontSize:18, objectName:"Legende Titel" });
lx += 2.7;
R.forEach(r => {
  const name = short(r.fr) === short(r.de) ? short(r.fr) : short(r.fr) + " / " + short(r.de);
  const label = r.k === "als" ? "Alsace / Elsass" : name;
  rect(s, { x:lx, y:ly+0.09, w:0.24, h:0.24, fill:{ color:COL[r.k] }, line:{ type:"none" }, objectName:"Legende Farbe "+r.k });
  // Textbreiten bei 18 pt Calibri (gemessen mit Carlito), sonst Schätzung
  const LW18 = { bw:4.184, rp:3.706, als:1.452, bas:2.304, bl:3.507, so:1.979, ag:1.692, ju:0.413 };
  const w = (LW18[r.k] || 0.11*label.length) + 0.15;
  txt(s, label, { x:lx+0.34, y:ly, w, h:0.4, fontSize:18, wrap:false, objectName:"Legende "+r.k });
  lx += w + 0.95;
});
const ly2 = ly + 0.55; lx = M + 2.7;
txt(s, [{ text:"Signes ", options:{ bold:true } }, { text:"/ Zeichen", options:{ color:MUTED } }], { x:M, y:ly2, w:2.6, h:0.4, fontSize:18 });
rect(s, { x:lx, y:ly2+0.02, w:0.08, h:0.38, fill:{ color:COL.bw }, line:{ type:"none" } });
rect(s, { x:lx+0.12, y:ly2+0.02, w:0.08, h:0.38, fill:{ color:COL.rp }, line:{ type:"none" } });
txt(s, "Barre : vacances scolaires / Balken: Schulferien", { x:lx+0.35, y:ly2, w:6.2, h:0.4, fontSize:18 });
lx += 6.8;
rect(s, { x:lx, y:ly2+0.1, w:0.2, h:0.2, fill:{ color:COL.bw }, line:{ type:"none" } });
txt(s, "Carré plein : jour férié / Volles Quadrat: Feiertag", { x:lx+0.35, y:ly2, w:6.6, h:0.4, fontSize:18 });
lx += 7.2;
rect(s, { x:lx, y:ly2+0.1, w:0.2, h:0.2, fill:{ type:"none" }, line:{ color:COL.bw, width:2 } });
txt(s, "Carré vide : férié dans une partie des communes ou demi-journée / Hohles Quadrat: Feiertag nur in einem Teil der Gemeinden oder halbtags", { x:lx+0.35, y:ly2, w:W-M-lx-0.35, h:0.4, fontSize:18 });
lx = 0;

// Raster
const GX = M, GY = 3.7, GW = W - 2*M, CW = GW/12, MH = 0.85, RH = 0.54;
const NL = R.length, LW = 0.085, LG = 0.025, LANES = NL*(LW+LG)+0.04;
for (let m = 1; m <= 12; m++) {
  const x = GX + (m-1)*CW, days = new Date(2027, m, 0).getDate();
  txt(s, [{ text:MFR[m-1], options:{ bold:true, color:HEAD, breakLine:true } }, { text:MDE[m-1], options:{ color:MUTED, fontSize:17 } }],
      { x:x+0.1, y:GY, w:CW-0.15, h:MH, fontSize:21, valign:"middle", objectName:`Monat ${m}` });
  s.addShape(pres.shapes.LINE, { x, y:GY+MH, w:CW, h:0, line:{ color:FLAG, width:3 } });
  for (let d = 1; d <= days; d++) {
    const k = key(m,d), dow = new Date(2027,m-1,d).getDay(), y = GY + MH + (d-1)*RH;
    const we = dow===0 || dow===6;
    const hols = R.map(r => ({ r, h:r.hol.find(x => x[0]===k) })).filter(o => o.h);
    rect(s, { x, y, w:CW, h:RH, fill:{ color: we ? WE : "FFFFFF" }, line:{ type:"none" }, objectName:`Tag ${k}` });
    s.addShape(pres.shapes.LINE, { x, y:y+RH, w:CW, h:0, line:{ color:LINE, width:0.75 } });
    txt(s, [{ text:String(d), options:{ bold:true, color: hols.length ? FLAG : HEAD } }, { text:"  "+WD[dow], options:{ color:MUTED, fontSize:13 } }],
        { x:x+0.06, y, w:0.85, h:RH, fontSize:17, valign:"middle", objectName:`Datum ${k}` });
    // Feiertagsquadrate (4 pro Zeile)
    const SQ = 0.15, SG = 0.035, rows = Math.ceil(hols.length/4);
    const sy0 = y + (RH - (rows*SQ + (rows-1)*SG))/2;
    hols.forEach((o, i) => {
      const sx = x + 0.95 + (i%4)*(SQ+SG), sy = sy0 + Math.floor(i/4)*(SQ+SG);
      const part = !!o.h[3];
      rect(s, { x:sx, y:sy, w:SQ, h:SQ, fill: part ? { type:"none" } : { color:COL[o.r.k] }, line: part ? { color:COL[o.r.k], width:1.5 } : { type:"none" },
        objectName:`Feiertag ${o.r.k} ${k} ${short(o.h[1])}` });
    });
  }
  // Ferienbalken: ein Rechteck pro Abschnitt und Monat
  R.forEach((r, i) => {
    const lxp = x + CW - LANES + 0.02 + i*(LW+LG);
    r.fer.forEach(f => {
      const [fm1, fd1] = f[0].split("-").map(Number), [fm2, fd2] = f[1].split("-").map(Number);
      if (m < fm1 || m > fm2) return;
      const a = m===fm1 ? fd1 : 1, b = m===fm2 ? fd2 : days;
      rect(s, { x:lxp, y:GY+MH+(a-1)*RH, w:LW, h:(b-a+1)*RH, fill:{ color:COL[r.k] }, line:{ type:"none" },
        objectName:`Ferien ${r.k} ${short(f[2])} ${m}` });
    });
  });
  if (m > 1) s.addShape(pres.shapes.LINE, { x, y:GY, w:0, h:MH+31*RH, line:{ color:LINE, width:1 } });
}
const FY = GY + MH + 31*RH + 0.3;
txt(s, [
  { text:`Etat au / Stand : ${stand}`, options:{ bold:true, breakLine:true } },
  { text:"Données sans garantie – font foi les autorités compétentes. Pour les cantons suisses et l’Alsace, les week-ends attenants sont inclus.", options:{ breakLine:true } },
  { text:"Angaben ohne Gewähr – massgebend sind die zuständigen Behörden. Bei den Schweizer Kantonen und im Elsass sind die angrenzenden Wochenenden eingeschlossen.", options:{ color:MUTED } },
], { x:M, y:FY, w:GW, h:1.1, fontSize:16, valign:"top", objectName:"Fusszeile" });

// ---------- Folie 2: Liste nach Gebiet ----------
const s2 = pres.addSlide();
s2.background = { color:"FFFFFF" };
header(s2, "Liste par collectivité / Liste nach Gebietskörperschaft");
const CX = 4, CYN = 2, GAP = 0.4, TOP = 2.6;
const cw = (W - 2*M - (CX-1)*GAP)/CX, ch = (H - TOP - M - 0.5 - (CYN-1)*GAP)/CYN;
R.forEach((r, i) => {
  const x = M + (i%CX)*(cw+GAP), y = TOP + Math.floor(i/CX)*(ch+GAP);
  s2.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w:cw, h:ch, rectRadius:0.12, fill:{ color:PANEL }, line:{ color:LINE, width:1 }, objectName:"Karte "+r.k });
  rect(s2, { x:x+0.35, y:y+0.42, w:0.3, h:0.3, fill:{ color:COL[r.k] }, line:{ type:"none" } });
  const extra = r.fr.includes(" (") ? " · " + r.fr.split(" (")[1].replace(")", "") : "";
  txt(s2, [{ text:short(r.fr), options:{ bold:true, color:FG, breakLine:true } }, { text:short(r.de) + extra, options:{ color:MUTED, fontSize:17 } }],
      { x:x+0.8, y:y+0.3, w:cw-1.1, h:1.0, fontFace:"Cambria", fontSize:22, valign:"top", objectName:"Gebiet "+r.k });
  const rows = r.fer.map(f => [
    { text:[{ text:short(f[3]), options:{ breakLine:true } }, { text:short(f[2]), options:{ color:MUTED, fontSize:13 } }], options:{} },
    { text:`${wdOf(f[0])} ${fmt(f[0])} – ${wdOf(f[1])} ${fmt(f[1])}2027`, options:{ bold:true, color:HEAD, align:"right" } },
  ]);
  s2.addTable(rows, { x:x+0.3, y:y+1.4, w:cw-0.6, colW:[(cw-0.6)*0.55,(cw-0.6)*0.45], rowH:0.62, fontFace:"Calibri", fontSize:16, color:FG,
    border:{ type:"solid", pt:0.75, color:LINE }, fill:{ color:"FFFFFF" }, margin:0.05, valign:"middle", objectName:"Ferien "+r.k });
  const part = r.hol.some(x => x[3]);
  const ty = y + 1.4 + r.fer.length*0.62 + 0.3;
  txt(s2, [
    { text:"Jours fériés : ", options:{ bold:true } }, { text:r.hol.map(x=>`${fmt(x[0])} ${x[2]}${x[3]?"*":""}`).join(" · ") + (part?" (* partiel)":""), options:{ breakLine:true } },
    { text:"Feiertage: ", options:{ bold:true, color:MUTED } }, { text:r.hol.map(x=>`${fmt(x[0])} ${x[1]}${x[3]?"*":""}`).join(" · ") + (part?" (* teilweise)":""), options:{ color:MUTED, breakLine:true } },
    { text:" ", options:{ breakLine:true, fontSize:6 } },
    { text:r.nfr, options:{ breakLine:true } }, { text:r.nde, options:{ color:MUTED } },
  ], { x:x+0.35, y:ty, w:cw-0.7, h:y+ch-ty-0.25, fontSize:13.5, valign:"top", paraSpaceAfter:2, objectName:"Feiertage und Hinweise "+r.k });
});
txt(s2, `Etat au / Stand : ${stand} · Données sans garantie / Angaben ohne Gewähr · Sources / Quellen : simoschlumpf.ch/vacances-rhin-sup`,
    { x:M, y:H-M-0.35, w:W-2*M, h:0.35, fontSize:14, color:MUTED });

const out = path.join(__dirname, "kalender-oberrhein-2027.pptx");
pres.writeFile({ fileName: out }).then(() => console.log("geschrieben:", out));
