// Simple API client to your backend.
const API = (() => {
  const baseURL = (window.API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

  async function http(path, options = {}) {
    const res = await fetch(`${baseURL}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  return {
    // Get derived energy-saving tasks
    getTasks: () => http("/api/tasks"),

    // Device actions
    turnLightOff: (id) =>
      http(`/api/lights/${encodeURIComponent(id)}/off`, { method: "POST" }),

    adjustThermostat: ({ id, setpointC, fanSpeed }) =>
      http(`/api/thermostats/${encodeURIComponent(id)}/adjust`, {
        method: "POST",
        body: JSON.stringify({ setpointC, fanSpeed }),
      }),
  };
})();
