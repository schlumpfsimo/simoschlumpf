// Tout reste sur l'appareil. Le stockage peut être indisponible (navigation privée) : on ne plante jamais.
const PREFIX = 'flaneur:v1:';

export function load(name, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + name);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
  } catch {}
}

export function exportAll() {
  const data = {};
  for (const name of ['profil', 'aime', 'plustard', 'lexique']) data[name] = load(name, null);
  return data;
}

export function importAll(data) {
  for (const [name, value] of Object.entries(data)) {
    if (['profil', 'aime', 'plustard', 'lexique'].includes(name) && value) save(name, value);
  }
}
