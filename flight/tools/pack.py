# Small companion data for flight/: everything else (terrain, buildings) streams from 3d.geo.admin.ch while flying.
# From swissALTIREGIO (swisstopo, its 40 m overview) and the national border (swissBOUNDARIES3D via api3.geo.admin.ch):
#   - a 1 km height grid (overview map, ground before the first terrain tiles arrive)
#   - a 100 m lake mask (lakes are perfectly flat in the height model)
#   - the border line with heights
# Usage: pack.py SWISSALTIREGIO_TIF LAND_GEOJSON OUT   (OUT: flight/schweiz.bin.gz)
import sys, json, struct, gzip, numpy as np, tifffile
from scipy import ndimage as nd
TIF, LAND, OUT = sys.argv[1:4]
E0, N0, R = 2385000, 1404000, 40                 # the overview: west edge, north edge, metres per pixel
CE0, CE1, CN0, CN1 = 2455000, 2865000, 1045000, 1325000
a = tifffile.TiffFile(TIF).pages[1].asarray().astype(np.float32)
flat = (nd.maximum_filter(a, 3) - nd.minimum_filter(a, 3)) < 0.05
lab, n = nd.label(flat); sz = nd.sum(np.ones_like(a), lab, np.arange(1, n + 1))
water = np.isin(lab, np.where(sz > 60)[0] + 1).astype(np.float32)
def grid(step, src):
    nx = (CE1 - CE0) // step + 1; nz = (CN1 - CN0) // step + 1
    X, Z = np.meshgrid((CE0 + np.arange(nx) * step - E0) / R - 0.5, (N0 - (CN1 - np.arange(nz) * step)) / R - 0.5)
    return nx, nz, nd.map_coordinates(src, [Z, X], order=1, mode='nearest')
wx, wz, W = grid(100, nd.uniform_filter(water, 3)); W = W > 0.5
hx, hz, Hc = grid(1000, nd.uniform_filter(a, 25)); Hc = np.clip(np.round(Hc), 0, 65535).astype(np.uint16)
g = json.load(open(LAND))['results'][0]['geometry']
ring = max((p[0] for p in g['coordinates']), key=len)
pts = []
for (e1, n1), (e2, n2) in zip(ring, ring[1:]):
    k = max(1, int(np.hypot(e2 - e1, n2 - n1) // 100))
    for t in range(k): pts.append((e1 + (e2 - e1) * t / k, n1 + (n2 - n1) * t / k))
pts = np.array(pts, np.float64); keep = [0]
for i in range(1, len(pts)):
    if np.hypot(*(pts[i] - pts[keep[-1]])) >= 80: keep.append(i)
pts = pts[keep]
hb = nd.map_coordinates(a, [(N0 - pts[:, 1]) / R - 0.5, (pts[:, 0] - E0) / R - 0.5], order=1, mode='nearest')
border = np.stack([pts[:, 0] - CE0, CN1 - pts[:, 1], hb], 1).astype(np.float32)   # local metres: x east, z south, h
head = b'SFL2' + struct.pack('<ffIIfIIfI', CE0, CN1, wx, wz, 100, hx, hz, 1000, len(border))
data = head + Hc.tobytes() + np.packbits(W.ravel()).tobytes() + border.tobytes()
open(OUT, 'wb').write(gzip.compress(data, 9, mtime=0))
print('lake', wx, wz, 'heights', hx, hz, 'border', len(border), 'kB', len(gzip.compress(data, 9)) / 1e3)
