# PVF Delivery Map — agent guide

Read `docs/current-state.md` first for where things stand.

## What this is

Static "Where We Deliver" map + ZIP checker for Park View Farm home
delivery. Customers see both delivery zones (Rochester + Buffalo), type
their ZIP, and get a yes/no with the actual next delivery date and order
deadline. Serves the farm goal: turn "do you deliver to me?" browsers into
buyers, especially for the new Buffalo route (first delivery Jul 18, 2026).

## Rules

- `docs/` is the deployed site (GitHub Pages). No build step at runtime,
  no framework. Keep it that way unless Brian asks.
- `docs/zones.geojson` + `docs/zips.json` are machine-written by
  `builder/build_zones.py`. Never hand-edit them; edit the ZIP lists in
  the builder script and re-run it. The builder downloads NY ZCTA
  boundaries (cached locally, not committed) and filters + simplifies.
- ZIP lists must match the live GrazeCart delivery zones (Logistics →
  Delivery Zones): "Greater Rochester Zone" and "Buffalo Delivery". If a
  zone changes in GrazeCart, change `builder/build_zones.py`, re-run it,
  and commit. Canonical source files live in the shared brain
  (`projects/farm-growth-system/.../buffalo-expansion/Buffalo_Delivery_ZIPs.txt`
  and `recovered-context/Rochester_Delivery_ZIPs.txt`).
- Delivery date rules in `docs/app.js` mirror the GrazeCart schedule
  overrides: Rochester = 1st Saturday but 2nd Saturday in July; Buffalo =
  3rd Saturday; deadline = Thursday 11:59 PM before. The SAME rules are
  duplicated in the order planner's `app.js`. A route schedule change must
  be made in GrazeCart, the order planner, and here — all three together.
- Voice for customer-facing copy: PVF brand voice (farmer first person,
  "pasture-raised" always paired with "corn-and-soy-free", specifics over
  slogans, no AI tells). Brand tokens in `style.css` come from the live
  theme-variables.css + PVF Brand Identity guide.
- Map tiles: CARTO light basemap (free tier); boundaries: Census-derived
  ZCTAs via OpenDataDE. Attribution stays on the map.
- Publishing changes to the live site = pushing to main. That is
  customer-facing; confirm with Brian before pushing copy or logic changes.

## End of session

Update `docs/current-state.md` and Brian's memory/shared brain per his
handoff discipline.
