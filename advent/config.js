// Adresse der Apps-Script-Web-App (Bereitstellen → Web-App → URL, endet auf /exec).
// Nach dem ersten Bereitstellen hier eintragen. Die URL ist nicht geheim: Ohne Token liefert sie nichts.
window.ADVENT_API = 'HIER_DIE_WEB_APP_URL_EINTRAGEN';

// Nur für lokale Tests (localhost): andere API über localStorage 'advent.api' erlauben.
(function () {
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && localStorage.getItem('advent.api')) {
      window.ADVENT_API = localStorage.getItem('advent.api');
    }
  } catch (e) { /* ohne localStorage geht es auch */ }
})();
