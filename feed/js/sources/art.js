// Collections d'art et d'archives, toutes en accès libre.
// Chaque appel tire un thème et une page au hasard : la réserve ne s'épuise pas.
import { card, getJSON, rand, randInt, strip, first } from './util.js?v=202610132110';
import { ART, ART_FI, ART_MODERN, ART_CONTEMPORARY } from '../topics.js?v=202610132110';

function art(c) {
  return card({ kind: 'image', lang: 'en', label: 'ŒUVRE', ...c, facts: (c.facts || []).filter(([, v]) => v) });
}

/* Art Institute of Chicago */
export async function loadAIC(theme = rand(ART), since) {
  const q = new URLSearchParams({
    q: theme, limit: '4', page: String(1 + randInt(since ? 8 : 20)),
    fields: 'id,title,image_id,artist_display,date_display,medium_display,place_of_origin,description',
    'query[bool][must][0][term][is_public_domain]': 'true',
  });
  if (since) q.set('query[bool][must][1][range][date_start][gte]', since);
  let d = await getJSON('https://api.artic.edu/api/v1/artworks/search?' + q);
  if (!d.data.length && q.get('page') !== '1') {
    q.set('page', '1');
    d = await getJSON('https://api.artic.edu/api/v1/artworks/search?' + q);
  }
  return d.data.filter((a) => a.image_id).map((a) =>
    art({
      id: 'aic:' + a.id,
      source: 'aic',
      sourceLabel: 'Art Institute of Chicago',
      title: a.title,
      image: `https://www.artic.edu/iiif/2/${a.image_id}/full/600,/0/default.jpg`,
      imageLarge: `https://www.artic.edu/iiif/2/${a.image_id}/full/1200,/0/default.jpg`,
      long: strip(a.description),
      credit: a.artist_display?.split('\n')[0],
      url: 'https://www.artic.edu/artworks/' + a.id,
      facts: [['Artiste', a.artist_display], ['Date', a.date_display], ['Technique', a.medium_display], ['Origine', a.place_of_origin]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Cleveland Museum of Art (CC0) */
export async function loadCleveland(theme = rand(ART), since) {
  const q = new URLSearchParams({ q: theme, has_image: '1', cc0: '1', limit: '4', skip: String(randInt(since ? 12 : 40)) });
  if (since) q.set('created_after', since);
  let d = await getJSON('https://openaccess-api.clevelandart.org/api/artworks/?' + q);
  if (!d.data.length && q.get('skip') !== '0') {
    q.set('skip', '0');
    d = await getJSON('https://openaccess-api.clevelandart.org/api/artworks/?' + q);
  }
  return d.data.filter((a) => a.images?.web?.url).map((a) =>
    art({
      id: 'cma:' + a.id,
      source: 'cleveland',
      sourceLabel: 'Cleveland Museum of Art',
      title: a.title,
      image: a.images.web.url,
      long: strip(a.wall_description || a.description || a.did_you_know),
      credit: a.creators?.[0]?.description,
      url: a.url,
      facts: [['Artiste', a.creators?.[0]?.description], ['Date', a.creation_date], ['Technique', a.technique], ['Département', a.department]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Statens Museum for Kunst, Copenhague (domaine public) */
export async function loadSMK(theme = rand(ART)) {
  const q = new URLSearchParams({ keys: theme, offset: String(randInt(60)), rows: '4', lang: 'en' });
  const d = await getJSON(`https://api.smk.dk/api/v1/art/search/?${q}&filters=%5Bhas_image:true%5D,%5Bpublic_domain:true%5D`);
  return (d.items || []).filter((a) => a.image_thumbnail).map((a) =>
    art({
      id: 'smk:' + a.object_number,
      source: 'smk',
      sourceLabel: 'SMK Copenhague',
      title: a.titles?.find((t) => t.language === 'engelsk')?.title || a.titles?.[0]?.title || 'Sans titre',
      image: a.image_thumbnail,
      credit: a.production?.[0]?.creator,
      url: a.frontend_url,
      facts: [['Artiste', a.production?.[0]?.creator], ['Date', a.production_date?.[0]?.period], ['Type', a.object_names?.[0]?.name],
        ['Techniques', (a.techniques || []).join(', ')]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Victoria and Albert Museum, Londres : design, affiches, objets */
export async function loadVAM(theme = rand(ART)) {
  const q = new URLSearchParams({ q: theme, images_exist: '1', page_size: '4', page: String(1 + randInt(25)) });
  const d = await getJSON('https://api.vam.ac.uk/v2/objects/search?' + q);
  return (d.records || []).filter((a) => a._images?._iiif_image_base_url).map((a) =>
    art({
      id: 'vam:' + a.systemNumber,
      source: 'vam',
      sourceLabel: 'V&A Londres',
      title: a._primaryTitle || a.objectType,
      image: a._images._iiif_image_base_url + 'full/!600,600/0/default.jpg',
      imageLarge: a._images._iiif_image_base_url + 'full/!1200,1200/0/default.jpg',
      credit: a._primaryMaker?.name,
      url: 'https://collections.vam.ac.uk/item/' + a.systemNumber,
      facts: [['Auteur', a._primaryMaker?.name], ['Date', a._primaryDate], ['Lieu', a._primaryPlace], ['Type', a.objectType]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Wellcome Collection : sciences, cartes, curiosités */
export async function loadWellcome(theme = rand(ART)) {
  const q = new URLSearchParams({ query: theme, pageSize: '4', page: String(1 + randInt(15)) });
  const d = await getJSON('https://api.wellcomecollection.org/catalogue/v2/images?' + q);
  return (d.results || []).filter((a) => a.thumbnail?.url).map((a) => {
    const base = a.thumbnail.url.replace(/\/info\.json$/, '');
    return art({
      id: 'wellcome:' + a.id,
      source: 'wellcome',
      sourceLabel: 'Wellcome Collection',
      title: a.source?.title || 'Sans titre',
      image: base + '/full/!600,600/0/default.jpg',
      imageLarge: base + '/full/!1200,1200/0/default.jpg',
      credit: a.thumbnail.license?.label,
      url: 'https://wellcomecollection.org/works/' + a.source?.id,
      tags: [theme.toLowerCase()],
    });
  });
}

/* The Met, New York (domaine public) */
export async function loadMet(theme = rand(ART), modern) {
  const q = new URLSearchParams({ q: theme, hasImages: 'true', isPublicDomain: 'true', offset: String(randInt(modern ? 20 : 60)), limit: '6' });
  if (modern) q.set('departmentId', '21'); // Modern and Contemporary Art
  let ids = (await getJSON('https://collectionapi.metmuseum.org/public/collection/v1.1/search?' + q)).objectIDs || [];
  if (!ids.length && q.get('offset') !== '0') {
    q.set('offset', '0');
    ids = (await getJSON('https://collectionapi.metmuseum.org/public/collection/v1.1/search?' + q)).objectIDs || [];
  }
  const objs = await Promise.allSettled(ids.slice(0, 4).map((id) => getJSON('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id)));
  return objs
    .filter((r) => r.status === 'fulfilled' && r.value.primaryImageSmall)
    .map(({ value: a }) =>
      art({
        id: 'met:' + a.objectID,
        source: 'met',
        sourceLabel: 'The Met',
        title: a.title,
        image: a.primaryImageSmall,
        credit: a.artistDisplayName,
        url: a.objectURL,
        facts: [['Artiste', a.artistDisplayName], ['Date', a.objectDate], ['Technique', a.medium], ['Département', a.department], ['Culture', a.culture]],
        tags: [theme.toLowerCase()],
      })
    );
}

/* Europeana : le patrimoine de toute l'Europe (clé de démonstration publique) */
export async function loadEuropeana(theme = rand(ART)) {
  const q = new URLSearchParams({
    wskey: 'api2demo', query: theme, rows: '4', start: String(1 + randInt(200)),
    media: 'true', reusability: 'open', qf: 'TYPE:IMAGE', profile: 'standard',
  });
  const d = await getJSON('https://api.europeana.eu/record/v2/search.json?' + q);
  return (d.items || []).filter((a) => a.edmPreview?.[0]).map((a) =>
    art({
      id: 'europeana:' + a.id,
      source: 'europeana',
      sourceLabel: 'Europeana',
      title: first(a.dcTitleLangAware?.fr) || first(a.title) || 'Sans titre',
      image: a.edmPreview[0] + '&size=w400',
      long: first(a.dcDescriptionLangAware?.fr) || first(a.dcDescriptionLangAware?.en) || '',
      credit: [first(a.dcCreator), first(a.dataProvider)].filter(Boolean).join(' · '),
      url: (a.guid || '').split('?')[0],
      facts: [['Auteur', first(a.dcCreator)], ['Année', first(a.year)], ['Pays', first(a.country)], ['Institution', first(a.dataProvider)]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Library of Congress : photographie documentaire */
export async function loadLOC(theme = rand(ART)) {
  const q = new URLSearchParams({ q: theme, fo: 'json', c: '4', sp: String(1 + randInt(30)), fa: 'online-format:image' });
  const d = await getJSON('https://www.loc.gov/photos/?' + q);
  return (d.results || [])
    .filter((a) => a.image_url?.length)
    .map((a) => {
      const pick = (pct) => a.image_url.find((u) => u.includes(pct))?.split('#')[0];
      return art({
        id: 'loc:' + a.id,
        source: 'loc',
        sourceLabel: 'Library of Congress',
        title: a.title,
        image: pick('pct:25') || pick('pct:12.5') || a.image_url.at(-1).split('#')[0],
        long: first(a.description),
        credit: first(a.contributor),
        url: a.url,
        facts: [['Auteur', first(a.contributor)], ['Date', a.date]],
        tags: [theme.toLowerCase()],
      });
    });
}

/* Openverse : photographies sous licence Creative Commons */
export async function loadOpenverse(theme = rand([...ART, ...ART_CONTEMPORARY])) {
  const q = new URLSearchParams({ q: theme, page_size: '4', page: String(1 + randInt(10)), mature: 'false' });
  const d = await getJSON('https://api.openverse.org/v1/images/?' + q);
  return (d.results || []).map((a) =>
    art({
      id: 'openverse:' + a.id,
      source: 'openverse',
      sourceLabel: 'Openverse',
      label: 'PHOTO',
      title: a.title || theme,
      image: a.thumbnail || a.url,
      credit: [a.creator, (a.license || '').toUpperCase()].filter(Boolean).join(' · '),
      url: a.foreign_landing_url,
      facts: [['Auteur', a.creator], ['Licence', `CC ${(a.license || '').toUpperCase()} ${a.license_version || ''}`], ['Source', a.source]],
      tags: [theme.toLowerCase()],
    })
  );
}

/* Finna : archives finlandaises (photos libres de droits) */
export async function loadFinna(theme = rand(ART_FI)) {
  const q = new URLSearchParams({ lookfor: theme, type: 'AllFields', limit: '4', page: String(1 + randInt(30)) });
  for (const f of ['format:0/Image/', 'online_boolean:1', 'usage_rights_str_mv:usage_A']) q.append('filter[]', f);
  for (const f of ['id', 'title', 'images', 'year', 'buildings', 'imageRights', 'summary', 'nonPresenterAuthors']) q.append('field[]', f);
  const d = await getJSON('https://api.finna.fi/api/v1/search?' + q);
  return (d.records || [])
    .filter((r) => r.images?.length)
    .map((r) =>
      art({
        id: 'finna:' + r.id,
        source: 'finna',
        sourceLabel: 'Finna',
        label: 'ARCHIVES · FINLANDE',
        lang: 'fi',
        title: r.title,
        image: 'https://finna.fi' + r.images[0],
        long: first(r.summary),
        credit: [r.buildings?.[0]?.translated, r.year].filter(Boolean).join(' · '),
        url: 'https://finna.fi/Record/' + encodeURIComponent(r.id),
        facts: [['Auteur', r.nonPresenterAuthors?.[0]?.name], ['Année', r.year], ['Institution', r.buildings?.[0]?.translated], ['Droits', r.imageRights?.copyright]],
        tags: [theme],
      })
    );
}

// Art moderne : mêmes musées, filtrés sur les œuvres après 1880.
const modern = (key, fn, extra) => (theme = rand(ART_MODERN)) =>
  fn(theme, extra).then((list) => list.map((c) => ({ ...c, source: key, label: 'ART MODERNE' })));

// Tous les catalogues, avec leur poids de départ.
export const ART_LOADERS = [
  ['aic-moderne', modern('aic-moderne', loadAIC, '1880'), 1.4], ['cleveland-moderne', modern('cleveland-moderne', loadCleveland, '1880'), 1.1],
  ['met-moderne', modern('met-moderne', loadMet), 0.5], ['europeana-moderne', modern('europeana-moderne', loadEuropeana), 0.9],
  ['aic', loadAIC, 1.2], ['cleveland', loadCleveland, 1], ['smk', loadSMK, 1], ['vam', loadVAM, 1.1],
  ['wellcome', loadWellcome, 0.8], ['met', loadMet, 1], ['europeana', loadEuropeana, 1.2], ['loc', loadLOC, 0.9],
  ['openverse', loadOpenverse, 0.8], ['finna', loadFinna, 0.8],
];

// « Plus comme ça » pour une image : même catalogue, mêmes mots.
export function artMoreLike(c) {
  const entry = ART_LOADERS.find(([key]) => key === c.source);
  if (!entry) return null;
  const theme = c.tags[0] || c.words.slice(0, 2).join(' ');
  return entry[1](theme);
}
