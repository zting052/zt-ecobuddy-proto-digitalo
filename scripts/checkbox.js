(function () {
  const tasksEl = document.getElementById("tasks");
  const emptyEl = document.getElementById("tasks-empty");
  const bannerEl = document.getElementById("tasks-level-banner");

  function injectBannerStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Shared Level banner look (same as on Home) */
      .level-banner{
        margin: 0 0 10px 0;
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
        background: #E5E7EB;
        overflow: hidden;
      }
      .level-banner .level-progress > span{
        display:block;
        height: 100%;
        width: 0%;
        background: #234e33;
        border-radius: 999px;
        transition: width 220ms ease;
      }

      /* Task list visuals */
      #tasks { display: grid; gap: 10px; }
      .task-row {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 10px;
        background: #fff;
      }
      .task-title { font-weight: 600; }
      .task-details { opacity: 0.8; font-size: 0.9rem; }
      .btn {
        appearance: none;
        border: 0;
        border-radius: 10px;
        padding: 8px 12px;
        background: #322018;
        color: #fff;
        font-family: inherit;
        cursor: pointer;
      }
      .btn:disabled { opacity: 0.6; cursor: default; }
      .thermo-controls {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        margin-top: 8px;
        align-items: center;
      }
      .thermo-controls label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
      }
      .thermo-controls input[type=\"range\"] { width: 100%; }
      .thermo-controls output { min-width: 3ch; display: inline-block; text-align: right; }
    `;
    document.head.appendChild(style);
  }

  function tasksRequired(level) {
    return 5 + (Math.max(1, level) - 1) * 2; // 5,7,9,11,13...
  }

  function newPlantLabel(level) {
    switch (Math.max(1, Math.min(5, level))) {
      case 1: return "Potatoes";
      case 2: return "Bushes";
      case 3: return "Sunflowers";
      case 4: return "Dandelions";
      case 5: return "Roses";
      default: return "New plants";
    }
  }

  function updateBanner() {
    if (!bannerEl || !window.EcoProgress?.getState) return;
    const state = window.EcoProgress.getState();
    const req = tasksRequired(state.level);
    const pct = Math.min(100, (state.completed / req) * 100);

    bannerEl.querySelector(".level-title").textContent = `Level ${state.level}`;
    bannerEl.querySelector(".unlock-title").textContent = newPlantLabel(state.level);
    bannerEl.querySelector(".level-progress > span").style.width = `${pct}%`;
  }

  function renderEmpty(show) { if (emptyEl) emptyEl.hidden = !show; }

  function afterSuccess() {
    // Count toward levelling system
    if (window.EcoProgress && typeof window.EcoProgress.taskCompleted === "function") {
      try { window.EcoProgress.taskCompleted(); } catch {}
    }
  }

  function taskRow({ id, title, details, cta, action }) {
    const row = document.createElement("div");
    row.className = "task-row";
    row.setAttribute("data-id", id);
    row.innerHTML = `
      <div class="task-main">
        <div class="task-title">${title}</div>
        ${details ? `<div class="task-details">${details}</div>` : ""}
      </div>
      <div class="task-cta">
        <button class="btn">${cta}</button>
      </div>
    `;

    const btn = row.querySelector("button");
    let busy = false;
    btn.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.textContent = "Working…";
      try {
        await action();
        afterSuccess();
        row.remove();
        if (!tasksEl.children.length) renderEmpty(true);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = cta;
        alert(e.message || "Action failed");
      }
    });

    tasksEl.appendChild(row);
  }

  function thermostatRow({ id, name, ambientC, suggestedSetpointC, currentFan }) {
    const row = document.createElement("div");
    row.className = "task-row thermostat";
    row.setAttribute("data-id", id);

    let setpointC = Math.max(18, Math.min(ambientC - 1, suggestedSetpointC || 25));
    let fan = currentFan || "medium";

    row.innerHTML = `
      <div class="task-main">
        <div class="task-title">Optimize ${name}</div>
        <div class="task-details">Room ${ambientC.toFixed(1)}°C • Suggest ${setpointC.toFixed(1)}°C • Fan ${fan}</div>
        <div class="thermo-controls">
          <label>Setpoint (°C)
            <input type="range" min="18" max="28" step="0.5" value="${setpointC}">
            <output>${setpointC.toFixed(1)}</output>
          </label>
          <label>Fan
            <select>
              <option ${fan==="low"?"selected":""} value="low">Low</option>
              <option ${fan==="medium"?"selected":""} value="medium">Medium</option>
              <option ${fan==="high"?"selected":""} value="high">High</option>
              <option ${fan==="auto"?"selected":""} value="auto">Auto</option>
            </select>
          </label>
        </div>
      </div>
      <div class="task-cta">
        <button class="btn">Apply</button>
      </div>
    `;

    const range = row.querySelector('input[type="range"]');
    const out = row.querySelector("output");
    const select = row.querySelector("select");
    const btn = row.querySelector("button");

    range.addEventListener("input", () => {
      setpointC = parseFloat(range.value);
      out.textContent = setpointC.toFixed(1);
    });
    select.addEventListener("change", () => { fan = select.value; });

    let busy = false;
    btn.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.textContent = "Working…";
      try {
        await API.adjustThermostat({ id, setpointC, fanSpeed: fan });
        afterSuccess();
        row.remove();
        if (!tasksEl.children.length) renderEmpty(true);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = "Apply";
        alert(e.message || "Action failed");
      }
    });

    tasksEl.appendChild(row);
  }

  async function loadTasks() {
    if (!tasksEl) return;
    tasksEl.textContent = "Loading…";
    try {
      const data = await API.getTasks();
      tasksEl.innerHTML = "";
      const { lightTasks = [], thermostatTasks = [] } = data;

      lightTasks.forEach(t =>
        taskRow({
          id: t.id,
          title: `Turn off ${t.name}`,
          details: `Currently on in ${t.room || "unknown room"}`,
          cta: "Turn off",
          action: () => API.turnLightOff(t.id),
        })
      );

      thermostatTasks.forEach(tt =>
        thermostatRow({
          id: tt.id,
          name: tt.name,
          ambientC: tt.ambientC,
          suggestedSetpointC: tt.suggestedSetpointC,
          currentFan: tt.currentFan,
        })
      );

      renderEmpty(!tasksEl.children.length);
    } catch (e) {
      tasksEl.textContent = `Failed to load tasks: ${e.message}`;
    }
  }

  function setup() {
    injectBannerStyles();
    updateBanner();
    loadTasks();

    // Update banner when progress changes
    window.addEventListener("eco:progress", updateBanner);
    window.addEventListener("eco:newPlant", updateBanner);
    window.addEventListener("eco:levelUp", updateBanner);
  }

  document.readyState === "loading" ? 
    document.addEventListener("DOMContentLoaded", setup) : setup();
})();
