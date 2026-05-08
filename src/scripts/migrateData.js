import "dotenv/config";

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import pool from "../config/postgres.js";

const migrate = async () => {
  try {
    // Open SQLite DB
    const sqliteDb = await open({
      filename: "./stocks.db",
      driver: sqlite3.Database,
    });

    console.log("✅ Connected to SQLite");

    // Fetch all data
    const rows = await sqliteDb.all("SELECT * FROM stocks");
    console.log(`📦 Found ${rows.length} rows`);

    // Insert in batches
    const batchSize = 1000;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const values = [];
      const placeholders = [];

      batch.forEach((row, index) => {
        const offset = index * 19;

        placeholders.push(
          `(${Array.from({ length: 19 }, (_, i) => `$${offset + i + 1}`).join(",")})`
        );

        values.push(
          row.id,
          row.symbol,
          row.name,
          row.symbol_lower,
          row.name_lower,
          row.exchange,
          row.exchangeType,
          row.scripCode,
          row.expiry,
          row.scripType,
          row.strikeRate,
          row.tickSize,
          row.lotSize,
          row.qtyLimit,
          row.multiplier,
          row.symbolRoot,
          row.bocoAllowed,
          row.isin,
          row.series
        );
      });

      await pool.query(
        `
        INSERT INTO stocks (
          id, symbol, name, symbol_lower, name_lower,
          exchange, exchangeType, scripCode, expiry,
          scripType, strikeRate, tickSize, lotSize,
          qtyLimit, multiplier, symbolRoot, bocoAllowed,
          isin, series
        )
        VALUES ${placeholders.join(",")}
        ON CONFLICT (id) DO NOTHING
        `,
        values
      );

      console.log(`✅ Inserted batch ${i / batchSize + 1}`);
    }

    console.log("🎉 Migration completed!");
    process.exit();
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
};

migrate();