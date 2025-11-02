// Extend existing API client with auth and progress endpoints.
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
    // try json, else text, else null
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  return {
    // Auth
    me: () => http("/api/me"),
    login: (username, password) => http("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    signup: (username, password) => http("/api/auth/signup", { method: "POST", body: JSON.stringify({ username, password }) }),
    logout: () => http("/api/auth/logout", { method: "POST" }),

    // Progress (server-backed)
    getProgress: () => http("/api/progress"),
    taskCompleted: () => http("/api/progress/task-completed", { method: "POST" }),

    // Google Home pairing (dev mock)
    googleStatus: () => http("/api/google/status"),
    googleMockLink: () => http("/api/google/mock-link", { method: "POST" }),
    googleUnlink: () => http("/api/google/unlink", { method: "POST" }),

    // Existing task endpoints (if/when backend is added)
    getTasks: () => http("/api/tasks"),
    turnLightOff: (id) => http(`/api/lights/${encodeURIComponent(id)}/off`, { method: "POST" }),
    adjustThermostat: ({ id, setpointC, fanSpeed }) =>
      http(`/api/thermostats/${encodeURIComponent(id)}/adjust`, {
        method: "POST",
        body: JSON.stringify({ setpointC, fanSpeed }),
      }),
  };
})();
