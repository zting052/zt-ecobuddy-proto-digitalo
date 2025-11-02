import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "./data.sqlite3";
export const db = new Database(DB_PATH);

// Schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 0,
    total_completed INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}
export function createUser({ username, password_hash }) {
  const info = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, password_hash);
  return info.lastInsertRowid;
}
export function getProgress(user_id) {
  const p = db.prepare("SELECT * FROM progress WHERE user_id = ?").get(user_id);
  if (!p) {
    db.prepare("INSERT INTO progress (user_id, level, completed, total_completed) VALUES (?, 1, 0, 0)").run(user_id);
    return { user_id, level: 1, completed: 0, total_completed: 0 };
  }
  return p;
}
export function setProgress(user_id, { level, completed, total_completed }) {
  db.prepare(`
    INSERT INTO progress (user_id, level, completed, total_completed)
    VALUES (@user_id, @level, @completed, @total_completed)
    ON CONFLICT(user_id) DO UPDATE SET level=@level, completed=@completed, total_completed=@total_completed
  `).run({ user_id, level, completed, total_completed });
}
export function listPlants(user_id) {
  return db.prepare("SELECT id, level, type, x, y FROM plants WHERE user_id = ? ORDER BY id ASC").all(user_id);
}
export function addPlant(user_id, level, { type, x, y }) {
  db.prepare("INSERT INTO plants (user_id, level, type, x, y) VALUES (?, ?, ?, ?, ?)").run(user_id, level, type, x, y);
}
export function clearPlants(user_id) {
  db.prepare("DELETE FROM plants WHERE user_id = ?").run(user_id);
}
