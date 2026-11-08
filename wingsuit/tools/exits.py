# Where the exits are. The Swiss Base Association publishes exit altitude, rockdrop and altitude to landing, but no positions.
# This finds, in swissALTI3D (2 m, data.geo.admin.ch STAC), the cliff-edge cell near a seed that has the SBA altitude, faces the
# expected way and drops the most within 120 m: the exit of wingsuit/index.html (PLACES). The seeds come from the wall each exit is
# known to be on (west wall under Winteregg for the Lauterbrunnen village exits, Mürren wall for Via Ferrata and Flower Box,
# east wall above Stechelberg for the Ultimates, Eiger west flank, Churfirsten south wall, Titlis north side, Gitschen, Scex Rouge).
# Usage: exits.py TILE_DIR   (TILE_DIR holds swissalti3d_*_2_2056_*.tif of the areas below)
import sys, glob, re, numpy as np, tifffile
TILES = sys.argv[1]
AREAS = {'lb': (2630000, 1152000, 2642000, 1162000), 'eiger': (2640000, 1156000, 2646000, 1162000), 'wal': (2735000, 1219000, 2744000, 1226000),
         'titlis': (2670000, 1180000, 2677000, 1187000), 'gitschen': (2684000, 1190000, 2690000, 1197000), 'scex': (2579000, 1129000, 2586000, 1136000)}
EX = [  # name, area, seed E, N, SBA exit altitude, rockdrop, altitude to landing, facing
 ('Yellow Ocean', 'lb', 2635643, 1159446, 1225, 350, 425, 80), ('La Mousse', 'lb', 2635760, 1158794, 1330, 230, 530, 80),
 ('Nose 1', 'lb', 2635723, 1159099, 1255, 390, 455, 80), ('Nose 2', 'lb', 2635747, 1159040, 1275, 330, 475, 80), ('Nose 3', 'lb', 2635766, 1158848, 1310, 280, 510, 80),
 ('High Nose', 'lb', 2635634, 1158237, 1385, 190, 585, 90), ('High High Nose', 'lb', 2635285, 1157033, 1560, 120, 805, 100), ('Dumpster', 'lb', 2635497, 1157261, 1330, 280, 530, 90),
 ('Flower Box', 'lb', 2635116, 1156543, 1535, 330, 625, 100), ('Via Ferrata', 'lb', 2635093, 1156467, 1520, 280, 610, 100),
 ('Low Ultimate', 'lb', 2636418, 1154601, 1610, 330, 700, 270), ('High Ultimate', 'lb', 2636409, 1154650, 1630, 330, 720, 270),
 ('Gimmelwald', 'lb', 2635146, 1154948, 1220, 190, 310, 80), ('Melchstuhl', 'lb', 2637296, 1153832, 2310, 190, 1354, 220),
 ('Mushroom', 'eiger', 2642838, 1158752, 3220, 440, 1620, 350), ('High Eiger', 'eiger', 2643110, 1158636, 3700, 190, 2660, 350), ('Eiger South', 'eiger', 2643255, 1158673, 3810, 190, 2870, 330),
 ('Sputnik', 'wal', 2740812, 1224240, 2170, 225, 1595, 180), ('High Trench', 'wal', 2739908, 1224203, 2110, 145, 1560, 180), ('Fatal Attraction', 'wal', 2739582, 1224085, 2130, 140, 1605, 180),
 ('Titlis', 'titlis', 2676339, 1181234, 2900, 195, 1730, 10), ('Gitschen', 'gitschen', 2686696, 1192311, 2460, 140, 2015, 40), ('Scex Rouge', 'scex', 2581750, 1130671, 2850, 190, 1600, 290),
]
def mosaic(E0, N0, E1, N1):
    nx, ny = (E1 - E0) // 2, (N1 - N0) // 2; A = np.full((ny, nx), np.nan, np.float32)
    for f in glob.glob(TILES + '/*.tif'):
        m = re.search(r'_(\d{4})-(\d{4})_2_', f); te, tn = int(m.group(1)) * 1000, int(m.group(2)) * 1000
        if te >= E1 or te + 1000 <= E0 or tn >= N1 or tn + 1000 <= N0: continue
        a = tifffile.imread(f).astype(np.float32); r0 = (N1 - (tn + 1000)) // 2; c0 = (te - E0) // 2
        rs, re_ = max(r0, 0), min(r0 + 500, ny); cs, ce = max(c0, 0), min(c0 + 500, nx)
        A[rs:re_, cs:ce] = a[rs - r0:re_ - r0, cs - c0:ce - c0]
    A[A < -1000] = np.nan; return A
def hdg_drop(A, r, c):
    h = A[r, c]; best = (0, -1)
    for ang in range(0, 360, 10):
        dx, dy = np.sin(np.radians(ang)), np.cos(np.radians(ang))
        d = h - np.nanmin([A[int(round(r - dy * k / 2)), int(round(c + dx * k / 2))] for k in (10, 20, 30, 40, 50, 60)])
        if d > best[1]: best = (ang, d)
    return best
mos = {}
for name, area, E, N, H, rock, atl, face in EX:
    if area not in mos: mos[area] = mosaic(*AREAS[area])
    A = mos[area]; E0, N0, E1, N1 = AREAS[area]; c0, r0 = (E - E0) // 2, (N1 - N) // 2; best = None
    for r in range(max(60, r0 - 125), min(A.shape[0] - 60, r0 + 126), 2):
        for c in range(max(60, c0 - 125), min(A.shape[1] - 60, c0 + 126), 2):
            h = A[r, c]
            if np.isnan(h) or abs(h - H) > 15: continue
            ang, d = hdg_drop(A, r, c)
            if abs((ang - face + 180) % 360 - 180) > 50: continue
            score = d - 0.3 * abs(h - H) - 0.1 * np.hypot(r - r0, c - c0)
            if best is None or score > best[0]: best = (score, r, c, h, ang, d)
    s, r, c, h, ang, d = best
    print(f"['{name}', E {E0 + c * 2} N {N1 - r * 2}, DEM {h:.0f} m, SBA {H} m, heading {ang}, drop within 120 m {d:.0f} m, rockdrop {rock} m, {atl} m above the landing]")
