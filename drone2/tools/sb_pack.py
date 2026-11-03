# pack swissBUILDINGS3D roofs (real roof surfaces), roof outlines and footprints into a compact binary for drone2
import pickle, struct, sys, numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union
B = pickle.load(open(sys.argv[1], 'rb'))
import os
ZS = float(os.environ.get('SB_ZS', '0.99635'))          # the north-south scale of the /nostalgia map (1 for plain LV95)
KIND = {'Hochhaus': 1, 'Sakrales Gebaeude': 2, 'Sakraler Turm': 3, 'Turm': 3, 'Kapelle': 2, 'Im Bau': 5}
out = bytearray(b'BSB1') + struct.pack('<I', 0)
n = 0; tot_t = tot_e = tot_v = 0
for b in B:
    T = b['tri'].astype(np.float64).copy(); T[:, :, 2] *= ZS
    nrm = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); ar = np.linalg.norm(nrm, axis=1)
    ok = ar > 1e-6; T = T[ok]; nrm = nrm[ok]; ar = ar[ok]
    ny = nrm[:, 1] / ar
    zmin = T[:, :, 1].min(); zmax = T[:, :, 1].max()
    # the solids are wound inwards: take every face that is not a wall (|ny| > 0.15) and not the floor
    R = T[(ny < -0.15) & (T[:, :, 1].mean(1) > zmin + 0.8)]
    if len(R) == 0: R = T[(abs(ny) > 0.15) & (T[:, :, 1].mean(1) > zmin + 0.8)]
    if len(R) == 0: continue
    polys = [Polygon(t[:, [0, 2]]) for t in R]
    fp = unary_union([p.buffer(0.05) for p in polys if p.area > 1e-4])
    if fp.is_empty: continue
    if fp.geom_type == 'MultiPolygon': fp = max(fp.geoms, key=lambda g: g.area)
    fp = fp.simplify(0.35)
    tolr = 0.35
    while len(fp.exterior.coords) > 60: tolr *= 1.6; fp = fp.simplify(tolr)
    ring = list(fp.exterior.coords)[:-1]
    if len(ring) < 3: continue
    ax, az = fp.centroid.x, fp.centroid.y
    # vertices: dedupe at 1 cm; dm integers relative to the anchor and the lowest point
    key = {}; V = []; I = []
    for t in R:
        for p in t:
            k = (round(p[0], 2), round(p[1], 2), round(p[2], 2))
            if k not in key:
                key[k] = len(V); V.append((round((p[0] - ax) * 10), round((p[1] - zmin) * 10), round((p[2] - az) * 10)))
            I.append(key[k])
    I = np.array(I).reshape(-1, 3)
    I = I[(I[:, 0] != I[:, 1]) & (I[:, 1] != I[:, 2]) & (I[:, 0] != I[:, 2])]
    if len(I) == 0 or len(V) > 65535: continue
    cnt = {}
    for a, b2, c in I:
        for e in ((a, b2), (b2, c), (c, a)):
            k = (min(e), max(e)); cnt[k] = cnt.get(k, 0) + 1
    E = [k for k, v in cnt.items() if v == 1]
    # drop seams: an edge with roof on both sides at its own height is inside a roof, not an eave or a step
    if E:
        Vf = np.array(V, dtype=float) / 10.0
        tri = Vf[I]                                            # (t, 3, 3): x, y, z
        a, b_, c = tri[:, 0], tri[:, 1], tri[:, 2]
        def roof_h(px, pz):
            v0x, v0z = b_[:, 0] - a[:, 0], b_[:, 2] - a[:, 2]; v1x, v1z = c[:, 0] - a[:, 0], c[:, 2] - a[:, 2]
            v2x, v2z = px[:, None] - a[None, :, 0], pz[:, None] - a[None, :, 2]
            den = v0x * v1z - v1x * v0z; den = np.where(abs(den) < 1e-9, 1e-9, den)
            u = (v2x * v1z - v1x * v2z) / den; w = (v0x * v2z - v2x * v0z) / den
            inside = (u >= -1e-3) & (w >= -1e-3) & (u + w <= 1 + 1e-3)
            h = a[None, :, 1] + u * (b_[None, :, 1] - a[None, :, 1]) + w * (c[None, :, 1] - a[None, :, 1])
            h = np.where(inside, h, -1e9)
            return h.max(1)
        Ea = np.array(E); p0 = Vf[Ea[:, 0]]; p1 = Vf[Ea[:, 1]]
        m = (p0 + p1) / 2; d = p1 - p0; L = np.hypot(d[:, 0], d[:, 2]) + 1e-9
        nx, nz = -d[:, 2] / L * 0.2, d[:, 0] / L * 0.2
        h1 = roof_h(m[:, 0] + nx, m[:, 2] + nz); h2 = roof_h(m[:, 0] - nx, m[:, 2] - nz)
        seam = (abs(h1 - m[:, 1]) < 0.4) & (abs(h2 - m[:, 1]) < 0.4)
        E = [e for e, sm in zip(E, seam) if not sm]
    # merge runs of nearly straight outline edges into one wall each
    if E:
        Vf = np.array(V, dtype=float) / 10.0
        adj = {}
        for e in E:
            for v in e: adj.setdefault(v, []).append(e)
        alive = set(E)
        for v, es in adj.items():
            es = [e for e in es if e in alive]
            if len(es) != 2: continue
            a = es[0][0] if es[0][1] == v else es[0][1]; c = es[1][0] if es[1][1] == v else es[1][1]
            if a == c: continue
            d1 = Vf[v] - Vf[a]; d2 = Vf[c] - Vf[v]
            n1 = np.linalg.norm(d1); n2 = np.linalg.norm(d2)
            if n1 < 1e-6 or n2 < 1e-6 or np.dot(d1, d2) / (n1 * n2) < 0.9985: continue
            alive.discard(es[0]); alive.discard(es[1]); ne_ = (min(a, c), max(a, c)); alive.add(ne_)
            adj.setdefault(a, []).append(ne_); adj.setdefault(c, []).append(ne_)
        E = list(alive)
    kind = KIND.get(b['art'], 0)
    out += struct.pack('<HHHBBfff', len(V), len(I), len(E), len(ring), kind, ax, az, zmax - zmin)
    out += np.array(V, dtype=np.int16).tobytes()
    out += I.astype(np.uint16).tobytes()
    out += np.array(E, dtype=np.uint16).tobytes()
    out += np.array([(round((x - ax) * 10), round((z - az) * 10)) for x, z in ring], dtype=np.int16).tobytes()
    n += 1; tot_t += len(I); tot_e += len(E); tot_v += len(V)
out[4:8] = struct.pack('<I', n)
open(sys.argv[2], 'wb').write(out)
print(n, 'buildings', tot_v, 'verts', tot_t, 'roof tris', tot_e, 'outline edges', len(out) / 1e6, 'MB')
