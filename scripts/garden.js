// EcoBuddy Garden Renderer for the Home page
// Renders a dirt plot and plants based on EcoProgress state, and updates the level banner.

(function () {
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Garden container */
      #garden {
        position: relative;
        width: 100%;
        height: 180px;
        border-radius: 12px;
        overflow: hidden;
        background: linear-gradient(#6b4f3a 0%, #4a3527 45%, #3a2a20 100%);
        box-shadow: inset 0 4px 8px rgba(0,0,0,0.25);
        border: 1px solid rgba(0,0,0,0.2);
      }

      /* Level banner (shared look with tasks page) */
      .level-banner{
        margin: 4px 0 10px 0;
      }
      .level-banner .level-title{
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.1;
      }
      .level-banner .unlock-title{
        margin-top: 2px;
        font-weight: 700;
        font-size: 0.95rem;
        opacity: 0.9;
      }
      .level-banner .level-progress{
        margin-top: 6px;
        height: 10px;
        border-radius: 999px;
        background: #E5E7EB; /* light grey track */
        overflow: hidden;
      }
      .level-banner .level-progress > span{
        display:block;
        height: 100%;
        width: 0%;
        background: #234e33; /* deep green fill */
        border-radius: 999px;
        transition: width 220ms ease;
      }

      /* Plant visuals */
      .plant {
        position: absolute;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));
      }
      .plant.potato .mound {
        width: 26px; height: 16px; border-radius: 20px;
        background: #a0774a;
        box-shadow: inset 0 -3px 0 rgba(0,0,0,0.15);
      }
      .plant.potato .sprout {
        width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-bottom: 10px solid #2e7d32; margin: -6px auto 0;
        filter: drop-shadow(0 1px 0 rgba(0,0,0,0.2));
      }
      .plant.berry .bush {
        width: 28px; height: 22px; border-radius: 14px;
        background: #2e7d32; position: relative;
      }
      .plant.berry .bush:after, .plant.berry .bush:before {
        content: ""; position: absolute; width: 6px; height: 6px; border-radius: 50%;
        background: #8e5bd4;
      }
      .plant.berry .bush:after { top: 4px; left: 6px; }
      .plant.berry .bush:before { top: 8px; right: 6px; }
      .plant.sunflower .stem {
        width: 3px; height: 24px; background: #2e7d32; margin: 0 auto;
      }
      .plant.sunflower .head {
        width: 18px; height: 18px; border-radius: 50%;
        background: radial-gradient(#5a3b16 0 35%, #f3c21b 36% 100%);
        margin: -2px auto 0; border: 2px solid #e6a90a;
      }
      .plant.dandelion .stem {
        width: 2px; height: 18px; background: #2e7d32; margin: 0 auto;
      }
      .plant.dandelion .puff {
        width: 14px; height: 14px; border-radius: 50%;
        background: radial-gradient(#fff3 0 45%, #ffd54f 46% 100%);
        border: 1px solid #ffd54f; margin: -2px auto 0;
      }
      .plant.rose .stem {
        width: 3px; height: 20px; background: #2e7d32; margin: 0 auto; position: relative;
      }
      .plant.rose .bloom {
        width: 16px; height: 16px; border-radius: 50%;
        background: radial-gradient(#b31217 0 40%, #ff4b5c 41% 100%);
        margin: -2px auto 0; border: 2px solid #8a0d12;
      }
      .plant.rose .stem:after {
        content:""; position:absolute; left:-4px; top:8px; width:8px; height:6px; background:#2e7d32; border-radius:6px 6px 0 6px;
      }

      /* Level-up badge */
      .levelup-badge {
        position: absolute; left: 50%; top: 8px; transform: translateX(-50%);
        background: rgba(255,255,255,0.95); color: #111; padding: 6px 10px;
        border-radius: 999px; font-weight: 700; font-size: 0.9rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        opacity: 0; transition: opacity 200ms ease;
      }
      .levelup-badge.show { opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function plantElement(plant) {
    const root = el("div", `plant ${plant.type}`);
    root.style.left = `${plant.x}%`;
    root.style.top = `${plant.y}%`;

    if (plant.type === "potato") {
      root.appendChild(el("div", "mound"));
      root.appendChild(el("div", "sprout"));
    } else if (plant.type === "berry") {
      root.appendChild(el("div", "bush"));
    } else if (plant.type === "sunflower") {
      root.appendChild(el("div", "stem"));
      root.appendChild(el("div", "head"));
    } else if (plant.type === "dandelion") {
      root.appendChild(el("div", "stem"));
      root.appendChild(el("div", "puff"));
    } else if (plant.type === "rose") {
      root.appendChild(el("div", "stem"));
      root.appendChild(el("div", "bloom"));
    } else {
      const dot = el("div");
      dot.style.width = dot.style.height = "8px";
      dot.style.background = "#2e7d32";
      dot.style.borderRadius = "999px";
      root.appendChild(dot);
    }
    return root;
  }

  function newPlantLabel(level) {
    // What becomes available at this level
    switch (Math.max(1, Math.min(5, level))) {
      case 1: return "Potatoes";
      case 2: return "Bushes";
      case 3: return "Sunflowers";
      case 4: return "Dandelions";
      case 5: return "Roses";
      default: return "New plants";
    }
  }

  function tasksRequired(level) {
    return 5 + (Math.max(1, level) - 1) * 2; // 5,7,9,11,13...
  }

  function renderLevelBanner(container) {
    const state = window.EcoProgress?.getState ? window.EcoProgress.getState() : { level: 1, completed: 0 };
    const req = tasksRequired(state.level);
    const pct = Math.min(100, (state.completed / req) * 100);

    const wrap = document.getElementById("home-level-banner") || container.querySelector(".level-banner");
    if (!wrap) return;

    const title = wrap.querySelector(".level-title");
    const unlock = wrap.querySelector(".unlock-title");
    const bar = wrap.querySelector(".level-progress > span");

    if (title) title.textContent = `Level ${state.level}`;
    if (unlock) unlock.textContent = newPlantLabel(state.level);
    if (bar) bar.style.width = `${pct}%`;
  }

  function renderGarden(container) {
    const state = window.EcoProgress?.getState ? window.EcoProgress.getState() : { level: 1, completed: 0, plants: [] };
    container.innerHTML = "";

    // Level-up badge placeholder
    const badge = el("div", "levelup-badge", `Level ${state.level}!`);
    container.appendChild(badge);

    for (const p of state.plants || []) {
      container.appendChild(plantElement(p));
    }
  }

  function showLevelUp(container, level) {
    const badge = container.querySelector(".levelup-badge");
    if (!badge) return;
    badge.textContent = `Level ${level}!`;
    badge.classList.add("show");
    setTimeout(() => badge.classList.remove("show"), 1400);
  }

  function setup() {
    injectStyles();
    const plot = document.getElementById("garden");
    if (!plot) return;

    // Initial render
    renderLevelBanner(plot.parentElement);
    renderGarden(plot);

    // Progress updates
    window.addEventListener("eco:newPlant", () => {
      renderLevelBanner(plot.parentElement);
      renderGarden(plot);
    });
    window.addEventListener("eco:progress", () => {
      renderLevelBanner(plot.parentElement);
      renderGarden(plot);
    });
    window.addEventListener("eco:levelUp", (e) => {
      renderLevelBanner(plot.parentElement);
      renderGarden(plot);
      const level = e.detail?.state?.level ?? "";
      showLevelUp(plot, level);
    });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", setup) : setup();
})();
