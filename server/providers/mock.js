// A mock provider so the UI works now.
// Swap with real providers (Nest, Hue, etc.) later.
export function mockProvider() {
  // In-memory demo state
  const state = {
    lights: [
      { id: "light-1", name: "Kitchen light", room: "Kitchen", on: true },
      { id: "light-2", name: "Hallway light", room: "Hallway", on: false },
      { id: "light-3", name: "Bedroom lamp", room: "Bedroom", on: true }
    ],
    thermostats: [
      { id: "thermo-1", name: "Living Room", ambientC: 27.3, setpointC: 26, fanSpeed: "high" },
      { id: "thermo-2", name: "Bedroom", ambientC: 24.8, setpointC: 24, fanSpeed: "auto" }
    ]
  };

  return {
    async getDevices() {
      return JSON.parse(JSON.stringify(state));
    },

    async turnLightOff(id) {
      const l = state.lights.find(x => x.id === id);
      if (!l) throw new Error("Light not found");
      l.on = false;
      return true;
    },

    async adjustThermostat({ id, setpointC, fanSpeed }) {
      const t = state.thermostats.find(x => x.id === id);
      if (!t) throw new Error("Thermostat not found");
      if (typeof setpointC === "number") t.setpointC = setpointC;
      if (fanSpeed) t.fanSpeed = fanSpeed;
      // Simulate that after applying, the "hot room" task can be cleared by UI
      return true;
    }
  };
}
