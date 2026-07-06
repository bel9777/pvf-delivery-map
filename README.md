# Park View Farm — Where We Deliver

Static delivery-zone map + ZIP checker for [Park View Farm](https://parkviewfamilyfarm.com)
home delivery (Rochester + Buffalo, NY).

Customers see both zones on a map, type their ZIP, and get a yes/no with
the next delivery date and order deadline for their route.

## Layout

- `docs/` — the deployed site (GitHub Pages)
  - `index.html`, `style.css`, `app.js` — the app (no build step, no framework)
  - `zones.geojson`, `zips.json` — generated zone data (do not hand-edit)
  - `embed.js` — two-line embed loader for the GrazeCart custom page
  - `current-state.md` — live project status
- `builder/build_zones.py` — regenerates zone data from NY ZCTA boundaries

## Updating a delivery zone

1. Edit the ZIP lists in `builder/build_zones.py`
2. `python builder/build_zones.py`
3. Commit and push (publishes to the live site — approval required)

## Credits

Basemap © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors,
© [CARTO](https://carto.com/attributions). ZIP boundaries: US Census ZCTAs via
[OpenDataDE](https://github.com/OpenDataDE/State-zip-code-GeoJSON).
