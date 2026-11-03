# trees for drone2's Bärschwil: positions from the vegetation height model, conifer share from the forest mix (BAFU / LFI, WMS rasters)
# rasters cover x -4000..4000, z -4500..2500 at 2 m. Output: int16 x*4, int16 z*4, uint8 height*4, uint8 conifer*255
import sys, struct, numpy as np
from PIL import Image
H = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.int16)
M = np.asarray(Image.open(sys.argv[2]).convert('RGBA')).astype(np.int16)
LEG = np.array([(255, 255, 255), (253, 253, 169), (255, 255, 87), (234, 250, 0), (169, 243, 0), (100, 232, 0), (0, 200, 29), (0, 157, 139), (0, 104, 91), (0, 60, 50)])
MID = np.array([0, 0.5, 1.5, 2.5, 4, 10, 17.5, 25, 35, 45])
d = ((H[:, :, None, :] - LEG[None, None]) ** 2).sum(-1); veg = MID[d.argmin(-1)]
laub = np.where(M[..., 3] > 0, np.clip(M[..., 0] / 85.0, 0, 1), 1.0)
forest = M[..., 3] > 0
rng = np.random.default_rng(1240)
X0, Z0, PX = -4000, -4500, 2.0
out = []
def place(cell, keep):
    n_x, n_z = int(8000 / cell), int(7000 / cell)
    for j in range(n_z):
        zs = Z0 + (j + rng.random(n_x)) * cell; xs = X0 + (np.arange(n_x) + rng.random(n_x)) * cell
        c = np.clip((xs - X0) / PX, 0, H.shape[1] - 1).astype(int); r = np.clip((zs - Z0) / PX, 0, H.shape[0] - 1).astype(int)
        h = veg[r, c]; ok = keep(h, forest[r, c], xs, zs)
        for x, z, hh, lb in zip(xs[ok], zs[ok], h[ok], laub[r[ok], c[ok]]):
            hh = hh * rng.uniform(0.75, 1.15)
            out.append((x, z, min(hh, 60), 1 - lb))
near = lambda xs, zs: np.hypot(xs, zs) < 1600
place(11.0, lambda h, f, xs, zs: (h >= 9) & f)                       # forest stands
place(6.0, lambda h, f, xs, zs: (h >= 4) & ~f & near(xs, zs))        # orchards, hedges and single trees round the village
place(13.0, lambda h, f, xs, zs: (h >= 4) & ~f & ~near(xs, zs))
A = np.array(out)
buf = bytearray(b'BWT1') + struct.pack('<I', len(A))
buf += np.stack([np.round(A[:, 0] * 4), np.round(A[:, 1] * 4)], 1).astype(np.int16).tobytes()
buf += np.stack([np.round(A[:, 2] * 4), np.round(A[:, 3] * 255)], 1).astype(np.uint8).tobytes()
open(sys.argv[3], 'wb').write(buf); print(len(A), 'trees', len(buf) / 1e6, 'MB', 'conifer share', (A[:, 3] > 0.5).mean())
