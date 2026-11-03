# read swissBUILDINGS3D Building_solid CSV exports, transform to local metres, pickle the result
import csv, sys, re, pickle, math, numpy as np
from pyproj import Transformer
csv.field_size_limit(10**9)
T = Transformer.from_crs(2056, 4326, always_xy=True)
LAT0, LON0 = 47.5580, 7.5935
KX = 111320.0 * math.cos(math.radians(LAT0)); KZ = 111132.0
# optional: SB_ORIGIN="E,N" puts the origin at an LV95 point (x east, z south, plain metres) and SB_BOX="x0,z0,x1,z1" crops
import os
ORG = os.environ.get('SB_ORIGIN'); BOX = [float(v) for v in os.environ.get('SB_BOX', '-1850,-1550,1850,1550').split(',')]
out = []
num = re.compile(r'-?\d+\.?\d*')
for f in sys.argv[2:]:
    for r in csv.DictReader(open(f)):
        w = r['SHAPE']
        if not w.startswith('TIN'): continue
        tris = []
        for part in w[w.index('(') + 1:].split('))'):
            v = num.findall(part)
            if len(v) < 9: continue
            a = np.array(v[:9], dtype=float).reshape(3, 3)
            tris.append(a)
        if not tris: continue
        A = np.concatenate(tris)
        if ORG:
            e0, n0 = map(float, ORG.split(',')); x = A[:, 0] - e0; z = n0 - A[:, 1]
        else:
            lon, lat = T.transform(A[:, 0], A[:, 1])
            x = (np.array(lon) - LON0) * KX; z = -(np.array(lat) - LAT0) * KZ
        P = np.stack([x, A[:, 2], z], 1).reshape(-1, 3, 3)
        cx, cz = P[:, :, 0].mean(), P[:, :, 2].mean()
        if not (BOX[0] < cx < BOX[2] and BOX[1] < cz < BOX[3]): continue
        out.append(dict(tri=P.astype(np.float32), art=r['OBJEKTART'], name=r['NAME_KOMPLETT'], use=r['GEBAEUDE_NUTZUNG'], ground=float(r['GELAENDEPUNKT'] or 'nan'), dmax=float(r['DACH_MAX'] or 'nan'), egid=r['EGID'], uuid=r['UUID']))
pickle.dump(out, open(sys.argv[1], 'wb'))
nt = sum(len(b['tri']) for b in out)
print(len(out), 'buildings', nt, 'triangles')
