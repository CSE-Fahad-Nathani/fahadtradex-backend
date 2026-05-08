import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Decide DB path
const dbPath =
  process.env.NODE_ENV === "production"
    ? "/tmp/stocks.db" // Render-safe
    : path.join(__dirname, "../../stocks.db"); // local

console.log("📦 Using DB at:", dbPath);


if (process.env.NODE_ENV === "production") {
  const source = path.join(__dirname, "../../stocks.db");
  const target = "/tmp/stocks.db";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
    console.log("📂 DB copied to /tmp");
  }
}

// Connect DB
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ DB connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite DB");
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS stocks (
      id TEXT PRIMARY KEY,
      symbol TEXT,
      name TEXT,
      symbol_lower TEXT,
      name_lower TEXT,
      exchange TEXT,
      exchangeType TEXT,
      scripCode TEXT,
      expiry TEXT,
      scripType TEXT,
      strikeRate TEXT,
      tickSize TEXT,
      lotSize TEXT,
      qtyLimit TEXT,
      multiplier TEXT,
      symbolRoot TEXT,
      bocoAllowed TEXT,
      isin TEXT,
      series TEXT
    )
  `);
});

export default db;