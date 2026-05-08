import sqlite3 from "sqlite3";

const db = new sqlite3.Database("stocks.db");

// create table if not exists
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