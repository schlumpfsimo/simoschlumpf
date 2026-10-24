// Zeitplan für die Dépêche (bon/depeche/). Ergänzung für die Bon-Post, enthält keine Schlüssel.
//
// Die App speichert hier Uhrzeit und Wochentage. Ein Auslöser prüft jede Minute, ob es Zeit ist,
// und stösst dann auf GitHub den Auftrag .github/workflows/bon-depeche.yml an. Der baut die Zeitung
// mit frischen Daten in Chrome und reicht sie ganz normal bei der Bon-Post ein.
//
// Einbau (Anleitung in bon/NEUE-APP.md, Abschnitt «Zeitplan»):
// 1. Diese Datei als plan.gs ins Bon-Post-Projekt legen.
// 2. In doPost (Code.gs) gleich nach der Zeile mit schluesselOk_:
//      const plan = planAnfrage(d); if (plan) return plan;
// 3. Skripteigenschaft GITHUB_TOKEN setzen: Fine-grained Token, nur Repo schlumpfsimo/simoschlumpf,
//    Berechtigung «Actions: Read and write».
// 4. Einmal im Editor planEinrichten ausführen und den Zugriff erlauben.

const PLAN_REPO = 'schlumpfsimo/simoschlumpf';
const PLAN_WORKFLOW = 'bon-depeche.yml';
const PLAN_VORLAUF = 2;          // Minuten: so lange braucht GitHub etwa, bis der Bon eingereicht ist
const PLAN_NACHHOLEN = 60;       // Minuten: so lange wird ein verpasster Druck noch nachgeholt
const PLAN_TZ = 'Europe/Zurich';
const PLAN_EIGENSCHAFT = 'DEPECHE_PLAN';

// Antwort auf {aktion:'plan'} und {aktion:'plan-lesen'}; null für alle anderen Anfragen
function planAnfrage(daten) {
  if (!daten || (daten.aktion !== 'plan' && daten.aktion !== 'plan-lesen')) return null;
  if (daten.aktion === 'plan-lesen') return planAntwort({ ok: true, plan: planOeffentlich(planLesen()) });
  const p = daten.plan || {};
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.zeit || '')) return planAntwort({ ok: false, fehler: 'Uhrzeit fehlt' });
  const alt = planLesen();
  const plan = {
    aktiv: !!p.aktiv,
    zeit: p.zeit,
    tage: (Array.isArray(p.tage) ? p.tage : []).map(Number).filter(t => t >= 1 && t <= 7),
    halt: String(p.halt || '').slice(0, 80),
    teile: String(p.teile || '').replace(/[^a-z,]/g, '').slice(0, 200),
    // Heute schon gedruckt bleibt gedruckt, sonst gäbe es nach dem Speichern einen zweiten Bon
    zuletzt: alt.zuletzt || '',
  };
  planSchreiben(plan);
  return planAntwort({ ok: true, plan: planOeffentlich(plan) });
}

// Läuft jede Minute
function planPruefen() {
  const sperre = LockService.getScriptLock();
  if (!sperre.tryLock(5000)) return;
  try {
    const plan = planLesen();
    if (!plan.aktiv || !plan.zeit) return;
    const jetzt = new Date();
    const heute = Utilities.formatDate(jetzt, PLAN_TZ, 'yyyy-MM-dd');
    const tag = Number(Utilities.formatDate(jetzt, PLAN_TZ, 'u'));   // 1 = Montag … 7 = Sonntag
    if (plan.zuletzt === heute || plan.tage.indexOf(tag) < 0) return;
    const minute = Number(Utilities.formatDate(jetzt, PLAN_TZ, 'H')) * 60 + Number(Utilities.formatDate(jetzt, PLAN_TZ, 'm'));
    const [h, m] = plan.zeit.split(':').map(Number);
    const start = Math.max(0, h * 60 + m - PLAN_VORLAUF);
    if (minute < start || minute > start + PLAN_NACHHOLEN) return;

    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    if (!token) { plan.fehler = 'GITHUB_TOKEN fehlt'; planSchreiben(plan); return; }
    const r = UrlFetchApp.fetch(`https://api.github.com/repos/${PLAN_REPO}/actions/workflows/${PLAN_WORKFLOW}/dispatches`, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      payload: JSON.stringify({ ref: 'main', inputs: { halt: plan.halt, teile: plan.teile } }),
      muteHttpExceptions: true,
    });
    if (r.getResponseCode() === 204) { plan.zuletzt = heute; plan.fehler = ''; }
    else plan.fehler = `GitHub ${r.getResponseCode()}: ${r.getContentText().slice(0, 200)}`;   // nächste Minute nochmals
    planSchreiben(plan);
  } finally {
    sperre.releaseLock();
  }
}

// Einmal im Editor ausführen: legt den Minuten-Auslöser an (und fragt nach den nötigen Rechten)
function planEinrichten() {
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'planPruefen')) {
    ScriptApp.newTrigger('planPruefen').timeBased().everyMinutes(1).create();
  }
  UrlFetchApp.fetch('https://api.github.com/zen');   // damit auch das Recht für Abrufe ins Internet erteilt wird
  Logger.log('Zeitplan eingerichtet: ' + JSON.stringify(planLesen()));
}

function planLesen() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(PLAN_EIGENSCHAFT) || '{}'); }
  catch (e) { return {}; }
}
function planSchreiben(plan) {
  PropertiesService.getScriptProperties().setProperty(PLAN_EIGENSCHAFT, JSON.stringify(plan));
}
function planOeffentlich(p) {
  return { aktiv: !!p.aktiv, zeit: p.zeit || '', tage: p.tage || [], halt: p.halt || '', teile: p.teile || '', zuletzt: p.zuletzt || '', fehler: p.fehler || '' };
}
function planAntwort(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
