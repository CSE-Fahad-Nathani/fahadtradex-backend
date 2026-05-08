import fs from "fs";
import csv from "csv-parser";
import db from "../config/sqlite.js";

// helper insert function
const insertStock = (stock) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO stocks (
        id, symbol, name, symbol_lower, name_lower,
        exchange, exchangeType, scripCode,
        expiry, scripType, strikeRate, tickSize,
        lotSize, qtyLimit, multiplier,
        symbolRoot, bocoAllowed, isin, series
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stock.id,
        stock.symbol,
        stock.name,
        stock.symbol_lower,
        stock.name_lower,
        stock.exchange,
        stock.exchangeType,
        stock.scripCode,
        stock.expiry,
        stock.scripType,
        stock.strikeRate,
        stock.tickSize,
        stock.lotSize,
        stock.qtyLimit,
        stock.multiplier,
        stock.symbolRoot,
        stock.bocoAllowed,
        stock.isin,
        stock.series,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

// 🚀 main upload function
export const uploadStocksFromCSV = async (filePath) => {
  const stocks = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
       if (
  !row.Name ||
  !row.FullName ||
  !row.ScripCode
) return;

        const symbol = row.Name.trim();
        const name = row.FullName.trim();

        // 🔥 FIX HERE
        const id = `${row.Exch}_${row.ScripCode}`;

        stocks.push({
          id,
          symbol,
          name,
          symbol_lower: symbol.toLowerCase(),
          name_lower: name.toLowerCase(),
          exchange: row.Exch,
          exchangeType: row.ExchType,
          scripCode: row.ScripCode,
          expiry: row.Expiry || null,
          scripType: row.ScripType,
          strikeRate: row.StrikeRate,
          tickSize: row.TickSize,
          lotSize: row.LotSize,
          qtyLimit: row.QtyLimit,
          multiplier: row.Multiplier,
          symbolRoot: row.SymbolRoot,
          bocoAllowed: row.BOCOAllowed,
          isin: row.ISIN,
          series: row.Series,
        });
      })
      .on("end", async () => {
        try {
          console.log(`Parsed ${stocks.length} stocks`);

          for (let i = 0; i < stocks.length; i++) {
            if (i % 100 === 0) {
              console.log(`Inserting ${i}/${stocks.length}`);
            }

            await insertStock(stocks[i]);
          }

          console.log("🎉 Upload complete");
          resolve();
        } catch (error) {
          console.error("❌ Error:", error);
          reject(error);
        }
      })
      .on("error", reject);
  });
};