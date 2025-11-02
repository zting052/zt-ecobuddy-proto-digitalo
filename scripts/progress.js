// EcoBuddy Progress & Level System
// Stores state in localStorage and exposes a simple API + events.
// Events: eco:progress, eco:newPlant, eco:levelUp

(function () {
  const KEY = "eb.progress.v1";
  const MAX_LEVEL = 5;

  const defaultState = () => ({
    level: 1,
    completed: 0,    // tasks completed in current level
    plants: [],      // [{type, x, y}] percent positions within plot
    totalCompleted: 0
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    dispatch("eco:progress", { state });
  }

  function tasksRequired(level) {
    return 5 + (Math.max(1, level) - 1) * 2; // 5,7,9,11,13...
  }

  function paletteForLevel(level) {
    // cumulative palette by level
    const levels = {
      1: ["potato"],
      2: ["potato", "berry"],
      3: ["potato", "berry", "sunflower"],
      4: ["potato", "berry", "sunflower", "dandelion"],
      5: ["potato", "berry", "sunflower", "dandelion", "rose"],
    };
    return levels[Math.min(MAX_LEVEL, Math.max(1, level))];
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomPosition() {
    // Keep a gentle margin inside the plot
    const x = randomBetween(6, 88);  // %
    const y = randomBetween(15, 78); // %
    return { x, y };
  }

  function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  const API = {
    init() {
      const s = load();
      save(s);
      return s;
    },
    resetAll() {
      const s = defaultState();
      save(s);
      return s;
    },
    getState() {
      return load();
    },
    tasksRequired,
    paletteForLevel,
    taskCompleted() {
      const s = load();
      const palette = paletteForLevel(s.level);
      const type = choose(palette);
      const pos = randomPosition();
      s.completed += 1;
      s.totalCompleted += 1;
      s.plants.push({ type, ...pos });

      const required = tasksRequired(s.level);
      let leveledUp = false;

      if (s.completed >= required) {
        // Level up
        s.level = Math.min(MAX_LEVEL, s.level + 1);
        s.completed = 0;
        s.plants = [];
        leveledUp = true;
      }

      save(s);

      if (leveledUp) {
        dispatch("eco:levelUp", { state: s });
      } else {
        dispatch("eco:newPlant", { plant: s.plants[s.plants.length - 1], state: s });
      }
      return { leveledUp, state: s };
    }
  };

  window.EcoProgress = API;
  // Auto-init
  API.init();
})();
