# SWISSIMAGE (swisstopo) tiles in LV95 -> one orthophoto in drone2's local metres (x east, z south, origin 47.5580 N 7.5935 E)
import sys, math, numpy as np
from PIL import Image
from pyproj import Transformer
from scipy.ndimage import map_coordinates
D = sys.argv[1]; OUT = sys.argv[2]; NPX = int(sys.argv[3]) if len(sys.argv) > 3 else 4096
E0, N1, PPM = 2609700, 1269100, 2.0          # the mosaic: west edge, north edge, pixels per metre
M = np.zeros((6400, 8000, 3), np.uint8)
for i in range(4):
    for j in range(4):
        t = np.asarray(Image.open(f'{D}/t_{i}_{j}.jpg').convert('RGB'))
        M[(3 - j) * 1600:(4 - j) * 1600, i * 2000:(i + 1) * 2000] = t
LAT0, LON0 = 47.5580, 7.5935
KX = 111320.0 * math.cos(math.radians(LAT0)); KZ = 111132.0 * 0.99635
X0, Z0, SX, SZ = -1800, -1500, 3600, 3000
W = NPX; H = round(NPX * SZ / SX)
xs = X0 + (np.arange(W) + 0.5) / W * SX; zs = Z0 + (np.arange(H) + 0.5) / H * SZ
X, Z = np.meshgrid(xs, zs)
lon = X / KX + LON0; lat = LAT0 - Z / KZ
E, N = Transformer.from_crs(4326, 2056, always_xy=True).transform(lon, lat)
col = (E - E0) * PPM; row = (N1 - N) * PPM
out = np.stack([map_coordinates(M[:, :, c], [row, col], order=1, mode='nearest') for c in range(3)], -1)
Image.fromarray(out).save(OUT, quality=80, optimize=True, progressive=True)
print(W, H, OUT)
