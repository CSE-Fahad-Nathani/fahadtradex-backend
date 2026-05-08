import "dotenv/config"; // 🔥 ADD THIS

import pool from "../config/postgres.js";

const createTable = async () => {
  try {
    await pool.query(`
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
      );
    `);

    console.log("✅ stocks table created");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating table:", err);
    process.exit(1);
  }
};

createTable();