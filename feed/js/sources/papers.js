// Recherche récente via OpenAlex (sans clé, quota quotidien par connexion).
import { card, getJSON, rand, randInt, shorten } from './util.js?v=202610132125';
import { PAPERS } from '../topics.js?v=202610132125';

// OpenAlex stocke les résumés sous forme d'index inversé { mot: [positions] }.
function abstract(inv) {
  if (!inv) return '';
  const out = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) out[p] = w;
  return out.filter(Boolean).join(' ');
}

export async function loadPapers() {
  const [query, label] = rand(PAPERS);
  const since = new Date(Date.now() - 2 * 365 * 864e5).toISOString().slice(0, 10);
  const q = new URLSearchParams({
    search: query,
    filter: `from_publication_date:${since},has_abstract:true,type:article`,
    sort: 'publication_date:desc',
    'per-page': '4',
    page: String(1 + randInt(5)),
    select: 'id,doi,title,publication_date,authorships,primary_location,abstract_inverted_index,open_access',
  });
  const d = await getJSON('https://api.openalex.org/works?' + q);
  return (d.results || [])
    .filter((w) => w.title && w.publication_date <= new Date().toISOString().slice(0, 10))
    .map((w) => {
      const text = abstract(w.abstract_inverted_index);
      const authors = (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean);
      const journal = w.primary_location?.source?.display_name;
      return card({
        id: 'paper:' + w.id,
        kind: 'paper',
        source: 'openalex',
        sourceLabel: journal || 'OpenAlex',
        label: 'RECHERCHE · ' + label,
        lang: 'en',
        title: w.title.replace(/<[^>]+>/g, ''),
        text: shorten(text, 400),
        long: text,
        url: w.doi || w.primary_location?.landing_page_url || w.id,
        date: w.publication_date,
        facts: [
          ['Auteurs', authors.slice(0, 4).join(', ') + (authors.length > 4 ? ' et al.' : '')],
          ['Revue', journal],
          ['Publié le', new Date(w.publication_date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })],
          ['Accès', w.open_access?.is_oa ? 'Libre' : 'Payant'],
        ].filter(([, v]) => v),
        tags: [label.toLowerCase()],
      });
    });
}
