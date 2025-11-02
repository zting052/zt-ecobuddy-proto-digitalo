import express from "express";
import cors from "cors";
import session from "express-session";
import { createGoogleAuth } from "./auth/google.js";
import { nestProvider } from "./providers/nest.js";
import { mockProvider } from "./providers/mock.js";
import { homeAssistantProvider } from "./providers/homeassistant.js";

const PORT = process.env.PORT || 8787;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const PROVIDER_LIGHTS = (process.env.PROVIDER_LIGHTS || "mock").toLowerCase();

const LIGHTS =
  PROVIDER_LIGHTS === "homeassistant"
    ? homeAssistantProvider({
        baseUrl: process.env.HA_BASE_URL || process.env.HOMEASSISTANT_BASE_URL,
        token: process.env.HA_TOKEN || process.env.HOMEASSISTANT_TOKEN
      })
    : mockProvider();

const nest = nestProvider();
const google = createGoogleAuth();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// --- Auth routes ---
app.get("/auth/google", (req, res) => {
  const returnTo = req.query.returnTo || "";
  const url = google.getAuthUrl(returnTo);
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query || {};
  if (!code) return res.status(400).send("Missing code");
  try {
    const { tokens, email } = await google.handleCallback(code);
    req.session.google = {
      email: email || "",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date
    };
    const dest = state && typeof state === "string" ? state : "/settings.html";
    res.redirect(dest);
  } catch (e) {
    res.status(500).send(`Auth failed: ${e.message}`);
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  const g = req.session.google;
  res.json({
    google: {
      connected: !!(g && g.refresh_token),
      email: g?.email || ""
    }
  });
});

// --- Data and actions ---
async function composeDevices(req) {
  const out = { lights: [], thermostats: [] };

  // Lights from chosen provider (mock or Home Assistant)
  try {
    const ldev = await LIGHTS.getDevices();
    out.lights = ldev.lights || [];
  } catch (e) {
    // best-effort
  }

  // Thermostats from Nest if connected
  const g = req.session.google;
  if (g?.refresh_token) {
    try {
      const accessToken = await google.getFreshAccessToken(g.refresh_token);
      const list = await nest.listThermostats(accessToken);
      out.thermostats = list.map(t => ({
        id: t.id, name: t.name, ambientC: t.ambientC, setpointC: t.setpointC, fanSpeed: t.fanSpeed
      }));
    } catch (e) {
      console.warn("[nest] fetch thermostats failed:", e.message);
    }
  }
  return out;
}

function deriveTasks(devices) {
  const lightTasks = (devices.lights || [])
    .filter(l => l.on === true)
    .map(l => ({ id: l.id, name: l.name, room: l.room }));

  const thermostatTasks = (devices.thermostats || [])
    .filter(t => typeof t.ambientC === "number" && t.ambientC > 26)
    .map(t => ({
      id: t.id,
      name: t.name,
      ambientC: t.ambientC,
      currentFan: t.fanSpeed || "auto",
      suggestedSetpointC: Math.min(t.ambientC - 1, 25)
    }));

  return { lightTasks, thermostatTasks };
}

app.get("/api/tasks", async (req, res) => {
  try {
    const devices = await composeDevices(req);
    res.json(deriveTasks(devices));
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load tasks" });
  }
});

app.post("/api/lights/:id/off", async (req, res) => {
  try {
    await LIGHTS.turnLightOff(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to turn off light" });
  }
});

app.post("/api/thermostats/:id/adjust", async (req, res) => {
  const { setpointC, fanSpeed } = req.body || {};
  const g = req.session.google;
  if (!g?.refresh_token) {
    return res.status(401).json({ error: "Connect Google in Settings first." });
  }
  try {
    const accessToken = await google.getFreshAccessToken(g.refresh_token);
    await nest.setCoolSetpoint({ deviceName: req.params.id, accessToken, coolCelsius: setpointC });
    await nest.maybeSetFan({ deviceName: req.params.id, accessToken, fanSpeed });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to adjust thermostat" });
  }
});

app.listen(PORT, () => {
  console.log(`EcoBuddy backend on http://localhost:${PORT} lights=${PROVIDER_LIGHTS}`);
});
