/* Park View Farm — Where We Deliver — embed loader.
   Paste this on a GrazeCart custom page:

     <div id="pvf-delivery-map"></div>
     <script src="https://bel9777.github.io/pvf-delivery-map/embed.js" defer></script>

   It pulls the map's markup, styles, and logic from GitHub Pages, so every
   update ships from the repo without touching GrazeCart again. Same pattern
   as the order planner embed. */

(async function () {
  const BASE = "https://bel9777.github.io/pvf-delivery-map/";
  const mount = document.getElementById("pvf-delivery-map");
  if (!mount || mount.dataset.loaded) return;
  mount.dataset.loaded = "1";
  document.body.classList.add("pvf-embedded"); // scope standalone-only styles off

  if (!document.querySelector(`link[href="${BASE}style.css"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BASE + "style.css";
    document.head.appendChild(link);
  }

  try {
    const resp = await fetch(BASE + "index.html", { cache: "no-cache" });
    const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
    // The site provides its own header; embed intro + main + footer buttons.
    const intro = doc.querySelector(".masthead__sub");
    const main = doc.querySelector("main#delivery-map");
    const foot = doc.querySelector(".mapfoot");
    mount.innerHTML = "";
    if (intro) {
      const p = document.createElement("p");
      p.className = "masthead__sub";
      p.style.cssText = "max-width:640px;margin:8px auto 0;padding:0 16px;text-align:center;";
      p.textContent = intro.textContent;
      mount.appendChild(p);
    }
    if (!main) throw new Error("map markup not found");
    mount.appendChild(main);
    if (foot) mount.appendChild(foot);

    const script = document.createElement("script");
    script.src = BASE + "app.js";
    document.body.appendChild(script);
  } catch (e) {
    mount.innerHTML = `<p style="text-align:center;padding:24px;">
      The map couldn't load. <a href="${BASE}">Open it here instead</a>.</p>`;
  }
})();
