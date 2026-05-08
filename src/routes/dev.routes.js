import express from "express";
import { uploadStocksFromCSV } from "../utils/uploadStocks.js";
import { db as firebaseDB } from "../config/firebase.js";
import sqliteDB from "../config/sqlite.js";

const router = express.Router();

router.get("/upload-nse", async (req, res) => {
  try {
    await uploadStocksFromCSV("./ScripMaster_nse_eq.csv");
    res.send("NSE Upload Done ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading");
  }
});

router.get("/upload-bse", async (req, res) => {
  try {
    await uploadStocksFromCSV("./ScripMaster_bse_eq.csv");
    res.send("BSE Upload Done ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading");
  }
});

router.get("/upload-mcx", async (req, res) => {
  try {
    await uploadStocksFromCSV("./ScripMaster_mcx_fo.csv");
    res.send("MCX Upload Done ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading");
  }
});

// ✅ FIXED: SQLite used here
router.get("/create-indexes", (req, res) => {
  sqliteDB.serialize(() => {
    sqliteDB.run(`CREATE INDEX IF NOT EXISTS idx_symbol_lower ON stocks(symbol_lower)`);
    sqliteDB.run(`CREATE INDEX IF NOT EXISTS idx_name_lower ON stocks(name_lower)`);
    sqliteDB.run(`CREATE INDEX IF NOT EXISTS idx_exchange ON stocks(exchange)`);
  });

  res.send("Indexes created ✅");
});

router.get("/test-write", async (req, res) => {
  try {
    console.log("Starting test write...");

    await firebaseDB.collection("test").doc("check").set({ ok: true });

    console.log("Write success");

    res.send("Write success");
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
});

export default router;