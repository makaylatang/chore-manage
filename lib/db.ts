import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "chores.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rotation_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add color column to team_members (safe migration)
  const memberCols = db.prepare("PRAGMA table_info(team_members)").all() as { name: string }[];
  if (!memberCols.some((c) => c.name === "color")) {
    db.exec("ALTER TABLE team_members ADD COLUMN color TEXT NOT NULL DEFAULT '#6366f1'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      recurrence TEXT NOT NULL DEFAULT 'none',
      recurrence_day INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add category column to chores (safe migration)
  const choreCols = db.prepare("PRAGMA table_info(chores)").all() as { name: string }[];
  if (!choreCols.some((c) => c.name === "category")) {
    db.exec("ALTER TABLE chores ADD COLUMN category TEXT NOT NULL DEFAULT ''");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#a855f7'
    );

    CREATE TABLE IF NOT EXISTS chore_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      assigned_to INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
      due_date TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
