# swissALTIREGIO (swisstopo, 10 m, its 40 m overview) + national border (swissBOUNDARIES3D via api3.geo.admin.ch)
# -> flug/schweiz.bin.gz: one 100 m height grid of Switzerland and its surroundings, a lake mask and the border line.
# Usage: pack.py SWISSALTIREGIO_TIF LAND_GEOJSON OUT
# Heights in whole metres, predicted from the left, upper and upper-left neighbour (like PNG's "paeth-lite"),
# the zigzagged residual in one byte; 255 escapes to a raw uint16 in a second list. Lakes: flat areas of the DEM.
import sys, json, struct, gzip, numpy as np, tifffile
from scipy import ndimage as nd
TIF, LAND, OUT = sys.argv[1:4]
E0, N0, R = 2385000, 1404000, 40                 # the overview: west edge, north edge, metres per pixel
CE0, CE1, CN0, CN1, STEP = 2455000, 2865000, 1045000, 1325000, 100
a = tifffile.TiffFile(TIF).pages[1].asarray().astype(np.float32)
# lakes: 3x3 neighbourhoods without any relief, in connected areas of more than 60 pixels (10 ha)
flat = (nd.maximum_filter(a, 3) - nd.minimum_filter(a, 3)) < 0.05
lab, n = nd.label(flat); sz = nd.sum(np.ones_like(a), lab, np.arange(1, n + 1))
water = np.isin(lab, np.where(sz > 60)[0] + 1).astype(np.float32)
nx = (CE1 - CE0) // STEP + 1; nz = (CN1 - CN0) // STEP + 1
X, Z = np.meshgrid((CE0 + np.arange(nx) * STEP - E0) / R - 0.5, (N0 - (CN1 - np.arange(nz) * STEP)) / R - 0.5)
H = nd.map_coordinates(nd.uniform_filter(a, 3), [Z, X], order=1, mode='nearest')
W = nd.map_coordinates(nd.uniform_filter(water, 3), [Z, X], order=1, mode='nearest') > 0.5
# a lake is flat: its cells get the lowest height around them
H = np.where(W, nd.minimum_filter(H, 3), H)
q = np.round(H).astype(np.int32)
P = np.zeros_like(q); P[1:, 1:] = q[1:, :-1] + q[:-1, 1:] - q[:-1, :-1]; P[0, 1:] = q[0, :-1]; P[1:, 0] = q[:-1, 0]
r = q - P; zz = ((r << 1) ^ (r >> 31)).astype(np.int64)
small = zz < 255
b = np.where(small, zz, 255).astype(np.uint8); esc = q[~small].astype(np.uint16)
# border: the largest polygon of Switzerland, resampled every 100 m, in local metres (x east, z south of the north edge)
g = json.load(open(LAND))['results'][0]['geometry']
ring = max((p[0] for p in g['coordinates']), key=len)
pts = []
for (e1, n1), (e2, n2) in zip(ring, ring[1:]):
    k = max(1, int(np.hypot(e2 - e1, n2 - n1) // 100))
    for t in range(k): pts.append((e1 + (e2 - e1) * t / k - CE0, CN1 - (n1 + (n2 - n1) * t / k)))
pts = np.array(pts, np.float32)
# drop points closer than 80 m to the last kept one
keep = [0]
for i in range(1, len(pts)):
    if np.hypot(*(pts[i] - pts[keep[-1]])) >= 80: keep.append(i)
pts = pts[keep]
head = b'SFL1' + struct.pack('<IIffffII', nx, nz, CE0, CN1, STEP, 1.0, len(esc), len(pts))
data = head + b.tobytes() + esc.tobytes() + np.packbits(W.ravel()).tobytes() + pts.tobytes()
open(OUT, 'wb').write(gzip.compress(data, 9, mtime=0))
print(nx, nz, 'heights', H.min(), H.max(), 'escapes', len(esc), 'lake', W.mean(), 'border pts', len(pts), 'MB', len(gzip.compress(data, 9)) / 1e6)
