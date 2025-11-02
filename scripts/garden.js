// Garden Renderer with server-backed EcoProgress
(function () {
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .level-banner{ margin:4px 0 10px 0; }
      .level-banner .level-title{ font-size:1.25rem; font-weight:700; line-height:1.1; }
      .level-banner .unlock-title{ margin-top:2px; font-weight:700; font-size:.95rem; opacity:.9; }
      .level-banner .level-progress{ margin-top:6px; height:10px; border-radius:999px; background:#E5E7EB; overflow:hidden; }
      .level-banner .level-progress>span{ display:block; height:100%; width:0%; background:#234e33; border-radius:999px; transition:width 220ms ease; }

      #garden{ position:relative; width:100%; height:180px; border-radius:12px; overflow:hidden;
        background:linear-gradient(#6b4f3a 0%, #4a3527 45%, #3a2a20 100%); box-shadow:inset 0 4px 8px rgba(0,0,0,.25); border:1px solid rgba(0,0,0,.2); }

      .plant{ position:absolute; transform:translate(-50%,-50%); filter:drop-shadow(0 1px 1px rgba(0,0,0,.4)); }
      .plant.potato .mound{ width:26px;height:16px;border-radius:20px;background:#a0774a;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15); }
      .plant.potato .sprout{ width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #2e7d32;margin:-6px auto 0;filter:drop-shadow(0 1px 0 rgba(0,0,0,.2)); }
      .plant.berry .bush{ width:28px;height:22px;border-radius:14px;background:#2e7d32;position:relative; }
      .plant.berry .bush:after,.plant.berry .bush:before{ content:\"\";position:absolute;width:6px;height:6px;border-radius:50%;background:#8e5bd4; }
      .plant.berry .bush:after{ top:4px;left:6px; } .plant.berry .bush:before{ top:8px;right:6px; }
      .plant.sunflower .stem{ width:3px;height:24px;background:#2e7d32;margin:0 auto; } .plant.sunflower .head{ width:18px;height:18px;border-radius:50%;background:radial-gradient(#5a3b16 0 35%, #f3c21b 36% 100%);margin:-2px auto 0;border:2px solid #e6a90a; }
      .plant.dandelion .stem{ width:2px;height:18px;background:#2e7d32;margin:0 auto; } .plant.dandelion .puff{ width:14px;height:14px;border-radius:50%;background:radial-gradient(#fff3 0 45%, #ffd54f 46% 100%);border:1px solid #ffd54f;margin:-2px auto 0; }
      .plant.rose .stem{ width:3px;height:20px;background:#2e7d32;margin:0 auto;position:relative; } .plant.rose .bloom{ width:16px;height:16px;border-radius:50%;background:radial-gradient(#b31217 0 40%, #ff4b5c 41% 100%);margin:-2px auto 0;border:2px solid #8a0d12; }
      .plant.rose .stem:after{ content:\"\";position:absolute;left:-4px;top:8px;width:8px;height:6px;background:#2e7d32;border-radius:6px 6px 0 6px; }

      .levelup-badge{ position:absolute; left:50%; top:8px; transform:translateX(-50%); background:rgba(255,255,255,.95); color:#111; padding:6px 10px; border-radius:999px; font-weight:700; font-size:.9rem; box-shadow:0 2px 8px rgba(0,0,0,.2); opacity:0; transition:opacity 200ms ease; }
      .levelup-badge.show{ opacity:1; }
    `;
    document.head.appendChild(style);
  }

  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function plantElement(p) {
    const root = el("div", `plant ${p.type}`);
    root.style.left = `${p.x}%`; root.style.top = `${p.y}%`;
    if (p.type === "potato") { root.appendChild(el("div","mound")); root.appendChild(el("div","sprout")); }
    else if (p.type === "berry") { root.appendChild(el("div","bush")); }
    else if (p.type === "sunflower") { root.appendChild(el("div","stem")); root.appendChild(el("div","head")); }
    else if (p.type === "dandelion") { root.appendChild(el("div","stem")); root.appendChild(el("div","puff")); }
    else if (p.type === "rose") { root.appendChild(el("div","stem")); root.appendChild(el("div","bloom")); }
    else { const dot = el("div"); dot.style.width = dot.style.height = "8px"; dot.style.background = "#2e7d32"; dot.style.borderRadius = "999px"; root.appendChild(dot); }
    return root;
  }

  function updateBanner() {
    const wrap = document.getElementById("home-level-banner");
    if (!wrap || !window.EcoProgress?.getState) return;
    const st = window.EcoProgress.getState();
    if (!st) {
      wrap.querySelector(".level-title").textContent = "Sign in to start";
      wrap.querySelector(".unlock-title").textContent = "No progress yet";
      wrap.querySelector(".level-progress > span").style.width = "0%";
      return;
    }
    wrap.querySelector(".level-title").textContent = `Level ${st.level}`;
    wrap.querySelector(".unlock-title").textContent = st.unlock || "";
    wrap.querySelector(".level-progress > span").style.width = `${Math.min(100, (st.completed / st.required) * 100)}%`;
  }

  function renderGarden(container) {
    const st = window.EcoProgress?.getState?.() || null;
    container.innerHTML = "";
    const badge = el("div", "levelup-badge", st ? `Level ${st.level}!` : "");
    container.appendChild(badge);
    (st?.plants || []).forEach(p => container.appendChild(plantElement(p)));
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
    updateBanner();
    renderGarden(plot);

    window.addEventListener("eco:progress", () => { updateBanner(); renderGarden(plot); });
    window.addEventListener("eco:newPlant", () => { updateBanner(); renderGarden(plot); });
    window.addEventListener("eco:levelUp", (e) => { updateBanner(); renderGarden(plot); showLevelUp(plot, e.detail?.state?.level ?? ""); });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", setup) : setup();
})();
