import express from "express";
import cors from "cors";
import { mockProvider } from "./providers/mock.js";
import { homeAssistantProvider } from "./providers/homeassistant.js";

const PORT = process.env.PORT || 8787;
const PROVIDER = (process.env.PROVIDER || "mock").toLowerCase();

const provider = (() => {
  if (PROVIDER === "homeassistant") {
    const baseUrl = process.env.HA_BASE_URL || process.env.HOMEASSISTANT_BASE_URL;
    const token = process.env.HA_TOKEN || process.env.HOMEASSISTANT_TOKEN;
    if (!baseUrl || !token) {
      console.warn("HOMEASSISTANT provider selected but HA_BASE_URL or HA_TOKEN missing; falling back to mock.");
      return mockProvider();
    }
    return homeAssistantProvider({ baseUrl, token });
  }
  return mockProvider();
})();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

async function loadTasks() {
  const devices = await provider.getDevices();

  const lightTasks = (devices.lights || [])
    .filter(l => l.on === true)
    .map(l => ({ id: l.id, name: l.name, room: l.room }));

  const thermostatTasks = (devices.thermostats || [])
    .filter(t => typeof t.ambientC === "number" && t.ambientC > 26)
    .map(t => ({
      id: t.id,
      name: t.name,
      ambientC: t.ambientC,
      currentFan: t.fanSpeed || t.fanMode || "auto",
      suggestedSetpointC: Math.min(t.ambientC - 1, 25)
    }));

  return { lightTasks, thermostatTasks };
}

app.get("/api/tasks", async (_req, res) => {
  try { res.json(await loadTasks()); }
  catch (e) { res.status(500).json({ error: e.message || "Failed to load tasks" }); }
});

app.post("/api/lights/:id/off", async (req, res) => {
  try { await provider.turnLightOff(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message || "Failed to turn off light" }); }
});

app.post("/api/thermostats/:id/adjust", async (req, res) => {
  const { setpointC, fanSpeed } = req.body || {};
  try {
    await provider.adjustThermostat({ id: req.params.id, setpointC, fanSpeed });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to adjust thermostat" });
  }
});

app.listen(PORT, () => {
  console.log(`EcoBuddy backend on http://localhost:${PORT} provider=${PROVIDER}`);
});
