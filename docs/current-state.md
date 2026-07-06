# PVF Delivery Map — current state

Updated: 2026-07-06 (evening)

## Status: SHIPPED — live on parkviewfamilyfarm.com

- Live page: https://parkviewfamilyfarm.com/where-we-deliver (GrazeCart page
  id 8, HTML widget with the two-line embed.js snippet)
- Main nav: position 3 (Shop Now, Order Planner, **Where We Deliver**, ...)
  — added via Menu Editor, landed after Order Planner without any reorder
- App source of truth: this repo → GitHub Pages
  (https://bel9777.github.io/pvf-delivery-map/); every update ships from
  here, never edit the GrazeCart widget unless the snippet itself changes
- Inspired by the Digitl Pastures cold-email drip ("customers should see
  where you deliver") — built in-house 2026-07-06, same day, zero cost.

## Ship-day verification (2026-07-06)

- **Live GrazeCart zones compared ZIP-for-ZIP in admin**: Rochester
  Delivery (zone id 7) = exactly the 43 ZIPs here; Buffalo Delivery (zone
  id 8) = exactly the 42 ZIPs here. Third zone "Home Delivery" (id 3) is
  the Bulk Meat Pre-Order zone (separate product line, no ZIP refinement)
  — intentionally NOT on this map.
- Embed verified on the live site: Leaflet initialized, tiles rendered,
  market cards correct (Rochester Sat Jul 11 / order by Thu Jul 9;
  Buffalo Sat Jul 18 / order by Thu Jul 16), ZIP checker returns correct
  route + dates (tested 14221 live; 14618/14052/14411 tested pre-ship).
- Nav link confirmed in the live homepage HTML.

## Remaining launch push

- Section in the July delivery email (order deadline Thu Jul 9) announcing
  the map + order planner together — needs Brian's approval to send.
- Optional: QR/mention at the Brighton booth alongside the planner card.

## Facts baked into the app (update here if they change)

- $100 minimum · $20 delivery fee · free delivery $200+
- Rochester: 1st Saturday (2nd in July) · Buffalo: 3rd Saturday ·
  order deadline Thursday 11:59 PM before delivery
- Farm pin: Leicester, NY (42.7720, -77.8967)
- Brighton Farmers Market pin: coords point at the CURRENT venue (Golisano
  Institute, 150 Sawgrass Dr — 43.1138, -77.6030 as of 2026-07) but all
  customer copy says only "Brighton Farmers Market, Sundays" because the
  venue moves (Brian's rule, 2026-07-06). On a move: update BRIGHTON coords
  in app.js only, never add the venue name to copy.
- Links: /store, /order-planner, /email-sign-up-landing-page

## Known limits

- ZIP polygons are 2010-vintage ZCTAs (OpenDataDE); fine at this zoom.
- The Buffalo demographic rationale stays in the shared brain, never here.
- Initial map bounds include a lot of Lake Ontario; acceptable, revisit if
  Brian wants tighter framing.
- No health-check workflow yet (unlike the order planner). The page is
  static with no scraper, so the failure surface is small; add one if the
  embed ever breaks silently.
