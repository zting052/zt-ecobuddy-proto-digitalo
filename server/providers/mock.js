export function mockProvider() {
  const state = {
    lights: [
      { id: "light.kitchen", name: "Kitchen light", room: "Kitchen", on: true },
      { id: "light.hallway", name: "Hallway light", room: "Hallway", on: false },
      { id: "light.bedroom", name: "Bedroom lamp", room: "Bedroom", on: true }
    ],
    thermostats: [
      { id: "climate.living_room", name: "Living Room", ambientC: 27.3, setpointC: 26, fanSpeed: "high" },
      { id: "climate.bedroom", name: "Bedroom", ambientC: 24.8, setpointC: 24, fanSpeed: "auto" }
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
      return true;
    }
  };
}
