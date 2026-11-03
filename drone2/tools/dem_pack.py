# swissALTI3D 2 m tiles (swisstopo) -> three nested height grids for drone2's Bärschwil valley
# local metres: x = E - E0, z = N0 - N (x east, z south). Usage: dem_pack.py TILE_DIR OUT
import sys, glob, re, struct, numpy as np, tifffile
from scipy.ndimage import map_coordinates, distance_transform_edt
E0, N0 = 2602250, 1248100
D, OUT = sys.argv[1], sys.argv[2]
KE0, KN0, NK = 2592, 1238, 20                     # the km squares downloaded
A = np.full((NK * 500, NK * 500), np.nan, np.float32)   # 2 m, row 0 = north
for f in glob.glob(D + '/*.tif'):
    e, n = map(int, re.search(r'_(\d{4})-(\d{4})_2_', f).groups())
    t = tifffile.imread(f).astype(np.float32); t[t < -1000] = np.nan
    i, j = e - KE0, (KN0 + NK - 1) - n
    A[j * 500:(j + 1) * 500, i * 500:(i + 1) * 500] = t
bad = np.isnan(A)
if bad.any():                                      # France: nearest Swiss height, then smoothed by the coarse grid anyway
    idx = distance_transform_edt(bad, return_distances=False, return_indices=True)
    A = A[tuple(idx)]
print('mosaic', A.shape, np.nanmin(A), np.nanmax(A), 'filled', bad.mean())
def grid(x0, z0, step, nx, nz):
    xs = x0 + np.arange(nx) * step; zs = z0 + np.arange(nz) * step
    X, Z = np.meshgrid(xs, zs)
    E = X + E0; N = N0 - Z
    col = (E - KE0 * 1000) / 2 - 0.5; row = ((KN0 + NK) * 1000 - N) / 2 - 0.5
    src = A
    if step >= 8:                                   # pre-filter so coarse grids are averages, not samples
        from scipy.ndimage import uniform_filter
        src = uniform_filter(A, size=int(step / 2))
    return map_coordinates(src, [row, col], order=1, mode='nearest').astype(np.float32)
out = bytearray(b'BWD1') + struct.pack('<I', 3)
for (x0, z0, step, nx, nz) in [(-9750, -9750, 50, 391, 391), (-4000, -4500, 8, 1001, 876), (-1000, -1000, 4, 501, 501)]:
    H = grid(x0, z0, step, nx, nz); hmin = float(np.floor(H.min()))
    q = np.clip(np.round((H - hmin) * 20), 0, 65535).astype(np.uint16)
    out += struct.pack('<ffffII', x0, z0, step, hmin, nx, nz) + q.tobytes()
    print('grid', step, nx, nz, H.min(), H.max())
open(OUT, 'wb').write(out); print(OUT, len(out) / 1e6, 'MB')
