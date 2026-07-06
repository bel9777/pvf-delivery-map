/* Park View Farm — Where We Deliver
   Delivery date rules MIRROR the GrazeCart schedule overrides (see
   pvf-delivery-schedule memory / shared brain): Rochester = 1st Saturday
   but 2nd Saturday in July; Buffalo = 3rd Saturday; order deadline =
   Thursday 11:59 PM before delivery. If Brian changes a route schedule,
   GrazeCart, the order planner, and this file must change together. */

(function () {
  "use strict";

  var BASE = document.currentScript && document.currentScript.src
    ? document.currentScript.src.replace(/app\.js.*$/, "")
    : "";

  var FARM = { lat: 42.7720, lng: -77.8967 };        // Leicester, NY
  // Market venue moves; keep customer copy venue-free (Brian 2026-07-06).
  // Coords = current site (Golisano Institute, 150 Sawgrass Dr) — update on moves.
  var BRIGHTON = { lat: 43.1138, lng: -77.6030 };

  var MARKETS = {
    rochester: { label: "Rochester", color: "#2C5170" },
    buffalo: { label: "Buffalo", color: "#E56F31" }
  };

  var STORE_URL = "https://parkviewfamilyfarm.com/store";
  var PLANNER_URL = "https://parkviewfamilyfarm.com/order-planner";
  var SIGNUP_URL = "https://parkviewfamilyfarm.com/email-sign-up-landing-page";

  /* ---------- delivery dates ---------- */

  function nthSaturday(year, month, n) {
    var first = new Date(year, month, 1);
    var offset = (6 - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + 7 * (n - 1));
  }

  // Next delivery whose Thursday-11:59-PM deadline hasn't passed.
  function nextDelivery(market, now) {
    now = now || new Date();
    for (var i = 0; i < 14; i++) {
      var probe = new Date(now.getFullYear(), now.getMonth() + i, 1);
      var y = probe.getFullYear(), m = probe.getMonth();
      var n = market === "buffalo" ? 3 : (m === 6 ? 2 : 1); // July shift, Rochester only
      var delivery = nthSaturday(y, m, n);
      var deadline = new Date(y, m, delivery.getDate() - 2, 23, 59, 59);
      if (deadline > now) return { delivery: delivery, deadline: deadline };
    }
    return null;
  }

  function fmt(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  /* ---------- data + Leaflet bootstrap ---------- */

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      var js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = resolve;
      js.onerror = reject;
      document.head.appendChild(js);
    });
  }

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " -> " + r.status);
      return r.json();
    });
  }

  /* ---------- app state ---------- */

  var map, zoneLayers = {}, zipLookup = {}, zipFeature = {}, highlighted = null;

  function marketOfZip(zip) { return zipLookup[zip] || null; }

  function init() {
    Promise.all([
      loadLeaflet(),
      getJSON(BASE + "zones.geojson"),
      getJSON(BASE + "zips.json")
    ]).then(function (res) {
      var zones = res[1], zips = res[2];
      Object.keys(zips).forEach(function (market) {
        zips[market].forEach(function (z) { zipLookup[z] = market; });
      });
      buildMap(zones);
      fillMarketCards();
      wireChecker();
    }).catch(function (err) {
      var el = document.getElementById("map");
      if (el) el.innerHTML =
        '<p style="padding:24px;text-align:center;">The map couldn\'t load. ' +
        'Rochester delivers the first Saturday of each month (second in July), ' +
        'Buffalo the third Saturday. Questions? brian@parkviewfamilyfarm.com</p>';
      if (window.console) console.error(err);
    });
  }

  function buildMap(zones) {
    map = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18
    }).addTo(map);

    var all = L.featureGroup();
    Object.keys(MARKETS).forEach(function (market) {
      zoneLayers[market] = L.geoJSON(zones, {
        filter: function (f) { return f.properties.market === market; },
        style: function () {
          return { color: MARKETS[market].color, weight: 1, fillColor: MARKETS[market].color, fillOpacity: 0.28 };
        },
        onEachFeature: function (f, layer) {
          zipFeature[f.properties.zip] = layer;
          var next = nextDelivery(market);
          layer.bindPopup(
            "<strong>" + f.properties.zip + " &middot; " + MARKETS[market].label + " route</strong><br>" +
            (next ? "Next delivery " + fmt(next.delivery) + ".<br>Order by " + fmt(next.deadline) + ", 11:59 PM." : "") +
            '<br><a href="' + STORE_URL + '">Shop the store</a>'
          );
        }
      }).addTo(map);
      all.addLayer(zoneLayers[market]);
    });

    var farmIcon = L.divIcon({ className: "", html: pinSvg("#3D3D3D"), iconSize: [30, 40], iconAnchor: [15, 38], popupAnchor: [0, -34] });
    var mktIcon = L.divIcon({ className: "", html: pinSvg("#97C1D3"), iconSize: [30, 40], iconAnchor: [15, 38], popupAnchor: [0, -34] });

    L.marker(FARM, { icon: farmIcon }).addTo(map)
      .bindPopup("<strong>Park View Farm</strong><br>Leicester, NY, at the north entrance of Letchworth State Park. Every delivery starts here.");
    L.marker(BRIGHTON, { icon: mktIcon }).addTo(map)
      .bindPopup("<strong>Brighton Farmers Market</strong><br>Sundays. Come say hi to Brian, Sarah, and George.");

    all.addLayer(L.marker(FARM));
    map.fitBounds(all.getBounds().pad(0.06));
  }

  function pinSvg(color) {
    return '<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M15 1C7.8 1 2 6.8 2 14c0 9.6 13 25 13 25s13-15.4 13-25C28 6.8 22.2 1 15 1z" ' +
      'fill="' + color + '" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14" r="4.5" fill="#fff"/></svg>';
  }

  function fillMarketCards() {
    Object.keys(MARKETS).forEach(function (market) {
      var el = document.getElementById("next-" + market);
      if (!el) return;
      var next = nextDelivery(market);
      if (next) {
        el.innerHTML = "Next delivery <strong>" + fmt(next.delivery) + "</strong><br>Order by " + fmt(next.deadline) + " at 11:59 PM";
      }
    });
  }

  /* ---------- ZIP checker ---------- */

  function wireChecker() {
    var form = document.getElementById("zip-form");
    var input = document.getElementById("zip-input");
    var result = document.getElementById("zip-result");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var zip = (input.value || "").trim();
      if (!/^\d{5}$/.test(zip)) return;
      var market = marketOfZip(zip);
      result.hidden = false;

      if (highlighted) { highlighted.setStyle({ weight: 1, fillOpacity: 0.28 }); highlighted = null; }

      if (market) {
        var next = nextDelivery(market);
        result.className = "checker__result checker__result--yes";
        result.innerHTML =
          "<strong>Yes. We deliver to " + zip + ".</strong><br>" +
          "You're on the " + MARKETS[market].label + " route. Next delivery is <strong>" +
          fmt(next.delivery) + "</strong>. Order by " + fmt(next.deadline) + " at 11:59 PM." +
          '<br><a class="btn btn--primary" href="' + STORE_URL + '">Shop the store</a>' +
          '<a class="btn btn--ghost" href="' + PLANNER_URL + '">Plan your monthly order</a>';
        var layer = zipFeature[zip];
        if (layer && map) {
          layer.setStyle({ weight: 3, fillOpacity: 0.45 });
          highlighted = layer;
          map.fitBounds(layer.getBounds().pad(0.8));
          layer.openPopup();
        }
      } else {
        result.className = "checker__result checker__result--no";
        result.innerHTML =
          "<strong>Not yet. No route runs to " + zip + " so far.</strong><br>" +
          "Routes grow where the orders are, and Buffalo started exactly this way. " +
          '<a href="' + SIGNUP_URL + '">Join the email list</a> and you\'ll hear first ' +
          "when we head your way. Sundays you can find us at the Brighton Farmers Market.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
