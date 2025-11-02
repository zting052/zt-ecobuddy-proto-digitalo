import express from "express";
import cors from "cors";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import bcrypt from "bcryptjs";
import { db, getUserByUsername, createUser, getProgress, setProgress, listPlants, addPlant, clearPlants } from "./db.js";

const SQLiteStore = SQLiteStoreFactory(session);

const PORT = process.env.PORT || 8787;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const GOOGLE_HOME_DEV_NAME = "Google Home (dev)";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite3", dir: ".", concurrentDB: true }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// Helpers
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  next();
}
function tasksRequired(level) {
  return 5 + (Math.max(1, level) - 1) * 2; // 5,7,9,11,13
}
function paletteForLevel(level) {
  const levels = {
    1: ["potato"],
    2: ["potato", "berry"],
    3: ["potato", "berry", "sunflower"],
    4: ["potato", "berry", "sunflower", "dandelion"],
    5: ["potato", "berry", "sunflower", "dandelion", "rose"]
  };
  return levels[Math.min(5, Math.max(1, level))];
}
function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randomPosition() { return { x: rand(6, 88), y: rand(15, 78) }; }
function unlockLabel(level) {
  switch (Math.max(1, Math.min(5, level))) {
    case 1: return "Potatoes";
    case 2: return "Bushes";
    case 3: return "Sunflowers";
    case 4: return "Dandelions";
    case 5: return "Roses";
    default: return "New plants";
  }
}

// Auth
app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  if (getUserByUsername(username)) return res.status(409).json({ error: "Username already taken" });
  const hash = await bcrypt.hash(password, 12);
  const userId = createUser({ username, password_hash: hash });
  req.session.user = { id: userId, username };
  res.json({ ok: true, user: { username } });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  const user = getUserByUsername(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  req.session.user = { id: user.id, username: user.username };
  res.json({ ok: true, user: { username: user.username } });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  const u = req.session.user;
  res.json({ authenticated: !!u, username: u?.username || "" });
});

// Progress
app.get("/api/progress", requireAuth, (req, res) => {
  const u = req.session.user;
  const p = getProgress(u.id);
  const plants = listPlants(u.id);
  const required = tasksRequired(p.level);
  res.json({
    level: p.level,
    completed: p.completed,
    totalCompleted: p.total_completed,
    required,
    unlock: unlockLabel(p.level),
    plants
  });
});

app.post("/api/progress/task-completed", requireAuth, (req, res) => {
  const u = req.session.user;
  const p = getProgress(u.id);

  // Add a plant for current level
  const plantType = choose(paletteForLevel(p.level));
  const pos = randomPosition();
  addPlant(u.id, p.level, { type: plantType, ...pos });

  let leveledUp = false;
  let level = p.level;
  let completed = p.completed + 1;
  let total_completed = p.total_completed + 1;

  const required = tasksRequired(level);
  if (completed >= required) {
    level = Math.min(5, level + 1);
    completed = 0;
    clearPlants(u.id); // garden resets
    leveledUp = true;
  }

  setProgress(u.id, { level, completed, total_completed });

  const state = {
    level,
    completed,
    totalCompleted: total_completed,
    required: tasksRequired(level),
    unlock: unlockLabel(level),
    plants: listPlants(u.id)
  };

  res.json({ ok: true, leveledUp, state });
});

// Google Home mock endpoints (dev only)
app.get("/api/google/status", requireAuth, (req, res) => {
  const linked = req.session.googleLinked || false;
  const accountName = linked ? GOOGLE_HOME_DEV_NAME : "";
  res.json({ linked, accountName });
});

app.post("/api/google/mock-link", requireAuth, (req, res) => {
  req.session.googleLinked = true;
  res.json({ ok: true, linked: true, accountName: GOOGLE_HOME_DEV_NAME });
});

app.post("/api/google/unlink", requireAuth, (req, res) => {
  req.session.googleLinked = false;
  res.json({ ok: true, linked: false });
});

app.listen(PORT, () => {
  console.log(`EcoBuddy backend running at http://localhost:${PORT}`);
});
