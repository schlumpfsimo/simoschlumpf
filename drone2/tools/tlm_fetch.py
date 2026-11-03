# swissTLM3D roads and waters (swisstopo, via the geo.admin identify API) over drone2's Bärschwil core -> local polylines (JSON)
import json, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
E0, N0 = 2602250, 1248100
BOX = (2598250, 1245600, 2606250, 1252600); T = 500
def ident(layer, e, n):
    out, off = [], 0
    while True:
        u = (f"https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryEnvelope&geometry={e},{n},{e+T},{n+T}"
             f"&imageDisplay=500,500,96&mapExtent={e},{n},{e+T},{n+T}&tolerance=0&layers=all:{layer}&sr=2056&returnGeometry=true&geometryFormat=geojson&limit=200&offset={off}")
        for k in range(5):
            try: r = json.load(urllib.request.urlopen(u, timeout=60))['results']; break
            except Exception as ex: err = ex
        else: raise err
        out += r; off += len(r)
        if len(r) < 200: return out
def fetch(layer):
    jobs = [(e, n) for e in range(BOX[0], BOX[2], T) for n in range(BOX[1], BOX[3], T)]
    feats = {}
    with ThreadPoolExecutor(8) as ex:
        for r in ex.map(lambda en: ident(layer, *en), jobs):
            for f in r: feats[f['id']] = f
    return list(feats.values())
def lines(g):
    # every run of points in any geometry type (lines, multilines, polygon rings)
    out = []
    def walk(c):
        if c and isinstance(c[0], (int, float)): return True
        if c and isinstance(c[0], list) and c[0] and isinstance(c[0][0], (int, float)): out.append(c); return False
        for q in c: walk(q)
    walk(g['coordinates'])
    return out
res = {}
roads = fetch('ch.swisstopo.swisstlm3d-strassen')
res['roads'] = [{'k': f['properties']['objektart'], 'n': f['properties'].get('strassenname'), 'p': [[round(x - E0, 1), round(N0 - y, 1)] for x, y, *_ in line]}
                for f in roads for line in lines(f['geometry']) if f['properties']['objektart'] <= 11]
wat = fetch('ch.swisstopo.swisstlm3d-gewaessernetz')
res['water'] = [{'k': f['properties']['objektart'], 'n': f['properties'].get('name'), 'p': [[round(x - E0, 1), round(N0 - y, 1)] for x, y, *_ in line]}
                for f in wat for line in lines(f['geometry'])]
json.dump(res, open(sys.argv[1], 'w'), separators=(',', ':'))
from collections import Counter
print(len(res['roads']), Counter(r['k'] for r in res['roads']), len(res['water']), Counter(w['n'] for w in res['water']).most_common(6))
