import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
const dbPath = process.env.DB_PATH || join(dataDir, 'rockets.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS rockets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    designer TEXT,
    description TEXT,
    orkData TEXT,
    csvData TEXT,
    launchLat REAL,
    launchLng REAL,
    maxAltitude REAL,
    maxDistance REAL,
    flightTime REAL,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    rocketId TEXT NOT NULL,
    author TEXT,
    text TEXT NOT NULL,
    rating INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rocketId) REFERENCES rockets(id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    rocketId TEXT NOT NULL,
    category TEXT,
    value REAL,
    rank INTEGER,
    FOREIGN KEY (rocketId) REFERENCES rockets(id)
  );

  CREATE INDEX IF NOT EXISTS idx_rockets_uploadedAt ON rockets(uploadedAt DESC);
  CREATE INDEX IF NOT EXISTS idx_rockets_featured ON rockets(featured);
  CREATE INDEX IF NOT EXISTS idx_comments_rocketId ON comments(rocketId);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard(category);
`)

export { db }
