"""Build docs/zones.geojson from NY ZCTA boundaries.

Downloads the New York ZCTA GeoJSON (Census-derived, OpenDataDE mirror),
filters to Park View Farm's delivery ZIPs, simplifies geometry, and writes
a compact GeoJSON the map app loads at runtime.

Run: python builder/build_zones.py
Source ZIP lists:
  Rochester: Brian-Shared-Brain/.../recovered-context/Rochester_Delivery_ZIPs.txt (2026-03-31)
  Buffalo:   Brian-Shared-Brain/.../buffalo-expansion/Buffalo_Delivery_ZIPs.txt (2026-07-02)
Any ZIP listed here that is missing from the ZCTA file is reported loudly —
a missing ZCTA (e.g. a PO-box-only ZIP) still validates in the ZIP checker
via zips.json; it just won't have a shaded polygon.
"""

import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DOCS = os.path.join(ROOT, "docs")
CACHE = os.path.join(HERE, "ny_zcta_cache.json")

SOURCE_URL = (
    "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/"
    "master/ny_new_york_zip_codes_geo.min.json"
)

ROCHESTER_ZIPS = [
    # Rochester City
    "14604", "14605", "14606", "14607", "14608", "14609", "14610", "14611",
    "14612", "14613", "14614", "14615", "14616", "14617", "14618", "14619",
    "14620", "14621", "14622", "14623", "14624", "14625", "14626", "14627",
    # Monroe County suburbs
    "14420", "14428", "14445", "14450", "14464", "14467", "14468", "14472",
    "14506", "14514", "14526", "14534", "14543", "14546", "14559", "14580",
    "14586",
    # Adjacent
    "14502", "14564",
]

BUFFALO_ZIPS = [
    # Buffalo City
    "14201", "14202", "14203", "14204", "14206", "14207", "14208", "14209",
    "14210", "14211", "14212", "14213", "14214", "14215", "14216", "14220",
    "14222",
    # First-ring suburbs
    "14043", "14051", "14068", "14072", "14075", "14086", "14127", "14150",
    "14217", "14218", "14219", "14221", "14223", "14224", "14225", "14226",
    "14227", "14228",
    # Targeted outer ring (2026-07-02)
    "14031", "14032", "14052", "14059", "14085", "14169", "14170",
]

assert len(ROCHESTER_ZIPS) == 43, len(ROCHESTER_ZIPS)
assert len(BUFFALO_ZIPS) == 42, len(BUFFALO_ZIPS)


def perpendicular_dist(pt, a, b):
    (px, py), (ax, ay), (bx, by) = pt, a, b
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def douglas_peucker(points, tol):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    idx, dmax = 0, 0.0
    for i in range(1, len(points) - 1):
        d = perpendicular_dist(points[i], a, b)
        if d > dmax:
            idx, dmax = i, d
    if dmax > tol:
        left = douglas_peucker(points[: idx + 1], tol)
        right = douglas_peucker(points[idx:], tol)
        return left[:-1] + right
    return [a, b]


def simplify_ring(ring, tol=0.0004, precision=4):
    # ~0.0004 deg tolerance ≈ 40 m; plenty for a ZIP-level overview map
    pts = [(p[0], p[1]) for p in ring]
    closed = pts[0] == pts[-1]
    if closed:
        pts = pts[:-1]
    simplified = douglas_peucker(pts, tol)
    if len(simplified) < 4:
        simplified = pts  # keep tiny rings intact
    out = [[round(x, precision), round(y, precision)] for x, y in simplified]
    if out[0] != out[-1]:
        out.append(out[0])
    return out


def simplify_geometry(geom):
    if geom["type"] == "Polygon":
        return {
            "type": "Polygon",
            "coordinates": [simplify_ring(r) for r in geom["coordinates"]],
        }
    if geom["type"] == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [
                [simplify_ring(r) for r in poly] for poly in geom["coordinates"]
            ],
        }
    raise ValueError(f"unexpected geometry type {geom['type']}")


def main():
    if not os.path.exists(CACHE):
        print(f"downloading {SOURCE_URL} ...")
        urllib.request.urlretrieve(SOURCE_URL, CACHE)
    with open(CACHE, encoding="utf-8") as f:
        ny = json.load(f)

    wanted = {z: "rochester" for z in ROCHESTER_ZIPS}
    wanted.update({z: "buffalo" for z in BUFFALO_ZIPS})

    features, found = [], set()
    for feat in ny["features"]:
        zcta = feat["properties"].get("ZCTA5CE10") or feat["properties"].get("GEOID10")
        if zcta in wanted:
            found.add(zcta)
            features.append(
                {
                    "type": "Feature",
                    "properties": {"zip": zcta, "market": wanted[zcta]},
                    "geometry": simplify_geometry(feat["geometry"]),
                }
            )

    missing = sorted(set(wanted) - found)
    out = {"type": "FeatureCollection", "features": features}
    os.makedirs(DOCS, exist_ok=True)
    dest = os.path.join(DOCS, "zones.geojson")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))

    zips_dest = os.path.join(DOCS, "zips.json")
    with open(zips_dest, "w", encoding="utf-8") as f:
        json.dump(
            {"rochester": ROCHESTER_ZIPS, "buffalo": BUFFALO_ZIPS},
            f,
            separators=(",", ":"),
        )

    print(f"wrote {dest}: {len(features)} polygons, {os.path.getsize(dest):,} bytes")
    print(f"wrote {zips_dest}")
    if missing:
        print(f"WARNING - no ZCTA polygon for: {', '.join(missing)}")
        print("(these ZIPs still validate in the ZIP checker via zips.json)")
    return 0 if not missing else 0


if __name__ == "__main__":
    sys.exit(main())
