import express from "express";
import cors from "cors";
import { mockProvider } from "./providers/mock.js";
// Placeholder: import { nestProvider } from "./providers/nest.js";

const PORT = process.env.PORT || 8787;
const PROVIDER = (process.env.PROVIDER || "mock").toLowerCase();

// Choose a provider. You can compose multiple later if you want.
const provider =
  PROVIDER === "mock"
    ? mockProvider()
    // : nestProvider({ /* credentials */ })
    : mockProvider();

const app = express();
app.use(cors());
app.use(express.json());

// Normalize devices into a simple energy model
async function loadTasks() {
  const devices = await provider.getDevices();

  // Lights: task if on === true
  const lightTasks = (devices.lights || [])
    .filter(l => l.on === true)
    .map(l => ({
      id: l.id, name: l.name, room: l.room
    }));

  // Thermostats: task if ambient > 26C
  const thermostatTasks = (devices.thermostats || [])
    .filter(t => t.ambientC > 26)
    .map(t => ({
      id: t.id,
      name: t.name,
      ambientC: t.ambientC,
      currentFan: t.fanSpeed || "auto",
      suggestedSetpointC: Math.min(t.ambientC - 1, 25) // nudge towards <= 25
    }));

  return { lightTasks, thermostatTasks };
}

app.get("/api/tasks", async (_req, res) => {
  try {
    res.json(await loadTasks());
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load tasks" });
  }
});

app.post("/api/lights/:id/off", async (req, res) => {
  try {
    await provider.turnLightOff(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to turn off light" });
  }
});

app.post("/api/thermostats/:id/adjust", async (req, res) => {
  const { setpointC, fanSpeed } = req.body || {};
  try {
    await provider.adjustThermostat({
      id: req.params.id,
      setpointC,
      fanSpeed
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to adjust thermostat" });
  }
});

app.listen(PORT, () => {
  console.log(`EcoBuddy backend on http://localhost:${PORT} (provider=${PROVIDER})`);
});
