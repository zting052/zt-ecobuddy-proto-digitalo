// Server-backed Progress & Level System
// Emits: eco:progress, eco:newPlant, eco:levelUp

(function () {
  const listenersReady = new Set();

  function dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function ensureListeners() {
    if (listenersReady.has("ready")) return;
    listenersReady.add("ready");
    // Also react to auth changes: after login, fetch fresh progress.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") EcoProgress.refresh().catch(()=>{});
    });
  }

  const EcoProgress = {
    _state: null,

    async init() {
      ensureListeners();
      return this.refresh();
    },

    async refresh() {
      try {
        const data = await API.getProgress();
        this._state = {
          level: data.level,
          completed: data.completed,
          required: data.required,
          totalCompleted: data.totalCompleted,
          unlock: data.unlock,
          plants: data.plants || []
        };
        dispatch("eco:progress", { state: this._state });
        return this._state;
      } catch (e) {
        // Not signed in or server error
        this._state = null;
        dispatch("eco:progress", { state: null, error: e.message });
        return null;
      }
    },

    getState() { return this._state; },

    async taskCompleted() {
      const res = await API.taskCompleted();
      this._state = {
        level: res.state.level,
        completed: res.state.completed,
        required: res.state.required,
        totalCompleted: res.state.totalCompleted,
        unlock: res.state.unlock,
        plants: res.state.plants || []
      };
      if (res.leveledUp) {
        dispatch("eco:levelUp", { state: this._state });
      } else {
        // last added plant is implied on server; for UI, just re-render
        dispatch("eco:newPlant", { state: this._state });
      }
      dispatch("eco:progress", { state: this._state });
      return res;
    }
  };

  window.EcoProgress = EcoProgress;
  // Auto-init but ignore errors if not logged in
  EcoProgress.init().catch(()=>{});
})();
