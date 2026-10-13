// Actualités : news.json, mis à jour chaque heure par GitHub Actions (.github/scripts/fetch-news.mjs).
import { card, getJSON } from './util.js';

export async function loadNews() {
  const d = await getJSON('data/news.json?v=' + Math.floor(Date.now() / 9e5));
  return d.items.map((it) =>
    card({
      id: 'news:' + it.url,
      kind: 'news',
      source: it.source,
      sourceLabel: it.sourceLabel,
      label: (it.city || it.categories[0] || it.section || 'Actualité').toUpperCase(),
      lang: it.lang,
      title: it.title,
      text: it.summary,
      image: it.image,
      url: it.url,
      date: it.date,
      tags: [it.city, it.section, ...it.categories.slice(0, 1)].filter(Boolean).map((t) => t.toLowerCase()),
    })
  );
}
