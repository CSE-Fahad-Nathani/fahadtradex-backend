import { db } from "../config/firebase.js";
import pool from "../config/postgres.js";
import axios from "axios";
import { firestore } from "../config/firebaseAdmin.js";
import { sellStockService } from "./stocks.service.js";


// ========================================
// 🔹 COMMON: FETCH ALL USER RECORDS
// ========================================
const getUserPortfolioMaster = async (userId) => {
  const snapshot = await db
    .collection("portfolioMaster")
    .where("userId", "==", userId)
    .get();

  // return snapshot.docs.map((doc) => doc.data());
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    docId: doc.id, // ✅ ADD THIS
  }));
};

// ========================================
// 🔹 GET TODAY DATE (IST SAFE)
// ========================================
const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
};

// ========================================
// 🔹 FETCH STOCK META FROM SQLITE
// ========================================
// const getStocksMetaMapFromSqlite = (scripCodes) => {
//   return new Promise((resolve, reject) => {
//     if (!scripCodes.length) return resolve({});

//     const placeholders = scripCodes.map(() => "?").join(",");

//     const sql = `
//       SELECT 
//         scripCode,
//         lotSize,
//         isin,
//         series
//       FROM stocks
//       WHERE scripCode IN (${placeholders})
//     `;

//     dbSqlite.all(sql, scripCodes, (err, rows) => {
//       if (err) return reject(err);

//       const map = {};

//       rows.forEach((row) => {
//         map[String(row.scripCode)] = row;
//       });

//       resolve(map);
//     });
//   });
// };

const getStocksMetaMap = async (scripCodes) => {
  if (!scripCodes.length) return {};

  const placeholders = scripCodes
    .map((_, i) => `$${i + 1}`)
    .join(",");

  const result = await pool.query(
    `
    SELECT 
      scripcode,
      lotsize,
      isin,
      series,
      expiry,
      multiplier
    FROM stocks
    WHERE scripcode IN (${placeholders})
    `,
    scripCodes
  );

  const map = {};

  result.rows.forEach((row) => {
    map[String(row.scripcode)] = {
      scripCode: row.scripcode,
      lotSize: row.lotsize || null,
      multiplier: row.multiplier || 1,
      expiry: row.expiry || null,
      isin: row.isin || null,
      series: row.series || null,
    };
  });

  return map;
};

// ========================================
// 🔹 MERGE FIRESTORE + SQLITE DATA
// ========================================
export const mergePortfolioWithMeta = (positions, metaMap) => {
  const today = new Date();

  return positions.map((item) => {
    const meta = metaMap[String(item.ScripCode)] || {};

    const isMCX = item.Exch === "M";

    let isExpired = false;

    if (isMCX && meta.expiry) {
      const expiryDate = new Date(meta.expiry);
      isExpired = expiryDate < today;
    }

    return {
      ...item,

      // 🔥 enrich
      expiry: meta.expiry || null,
      lotSize: meta.lotSize || item.lotSize || null,
      multiplier: meta.multiplier || item.multiplier || 1,

      // 🔥 flag (future use)
      isExpired,
    };
  });
};

// ========================================
// 📊 POSITIONS
// ========================================


export const getUserPositions = async (userId) => {
  console.log("🚀 getUserPositions START for user:", userId);

  const data = await getUserPortfolioMaster(userId);
  console.log("📦 Raw portfolio data:", data.length);

  const today = getTodayDate();
  console.log("📅 Today:", today);

  const filtered = data.filter((item) => {
    const include = item.tradeDate === today || item.Exch === "M";
    if (include) console.log("✅ Included:", item.symbol);
    return include;
  });

  console.log("📊 Filtered count:", filtered.length);

  const scripCodes = filtered.map((i) => String(i.ScripCode));
  console.log("🔢 ScripCodes:", scripCodes);

  const metaMap = await getStocksMetaMap(scripCodes);
  console.log("🧠 MetaMap keys:", Object.keys(metaMap));

  let positions = mergePortfolioWithMeta(filtered, metaMap);
  console.log("🔗 Positions after merge:", positions.length);

  // 🔑 FETCH 5PAISA TOKEN FROM FIRESTORE
  const tokenDoc = await firestore
    .collection("accesstokens5paisa")
    .doc("token")
    .get();

  if (!tokenDoc.exists) {
    console.warn("❌ No 5paisa token found");
    return positions;
  }

  const { accessToken, expireAt } = tokenDoc.data();

  if (!accessToken) {
    console.warn("❌ 5paisa token missing");
    return positions;
  }

  if (new Date(expireAt) < new Date()) {
    console.warn("❌ 5paisa token expired");
    return positions;
  }

  console.log("🔑 5paisa token loaded successfully");

  // 🔥 AUTO SELL EXPIRED MCX
  for (const item of positions) {
    console.log("🔍 Checking:", item.symbol, {
      exch: item.Exch,
      expired: item.isExpired,
      autoSold: item.isAutoSold,
    });

    if (item.Exch === "M" && item.isExpired && !item.isAutoSold) {
      try {
        console.log("⚠️ Auto-selling expired:", item.symbol);

        const expiryDate = item.expiry;
        console.log("📅 Expiry Date:", expiryDate);

        // 🔥 FETCH CANDLES
        console.log("📡 Fetching candles...");
        const candleRes = await axios.get(
          `https://openapi.5paisa.com/V2/historical/M/D/${item.ScripCode}/1m`,
          {
            params: {
              from: expiryDate,
              end: expiryDate,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`, // ✅ FIXED
            },
          }
        );

        console.log("📡 Candle API response received");

        const candles = candleRes?.data?.data?.candles || [];
        console.log("🕯️ Candle count:", candles.length);

        if (!candles.length) {
          console.warn("❌ No candles for", item.symbol);
          continue;
        }

        // ✅ LAST PRICE
        const lastCandle = candles[candles.length - 1];
        const ltp = lastCandle[4];
        console.log("💰 LTP extracted:", ltp);

        // 🔥 CALL SERVICE
        console.log("📤 Calling sellStockService...");
        const result = await sellStockService({
          userId,
          payload: {
            ScripCode: item.ScripCode,
            Exch: item.Exch,
            ExchType: item.ExchType,
            symbol: item.symbol,
            name: item.name,
            LTP: ltp,
            lots: item.lots,
            multiplier: item.multiplier,
          },
        });

        console.log("📥 sellStockService result:", result);

        // ❗ ONLY mark as sold if SUCCESS
        if (result?.status === "SUCCESS") {
          console.log("📝 Updating Firestore isAutoSold...");

          await firestore
            .collection("portfolioMaster")
            .doc(item.docId)
            .update({
              isAutoSold: true,
            });

          console.log("✅ Auto-sold:", item.symbol, "at", ltp);
        } else {
          console.warn("❌ Sell failed (service):", result?.message);
        }

      } catch (err) {
        console.error("❌ Auto-sell failed:", item.symbol);
        console.error("❌ ERROR MESSAGE:", err.message);
        console.error("❌ ERROR RESPONSE:", err?.response?.data);
      }
    }
  }

  console.log("🏁 getUserPositions END");

  return positions;
};
// ========================================
// 💼 PORTFOLIO (HOLDINGS)
// ========================================
export const getUserPortfolio = async (userId) => {
  const data = await getUserPortfolioMaster(userId);
  const today = getTodayDate();

  const filtered = data.filter((item) => {
    return (
      item.Exch !== "M" &&
      item.tradeDate !== today
    );
  });
  
// 🔥 FETCH POSTGRES DATA
const scripCodes = filtered.map((i) => String(i.ScripCode));
const metaMap = await getStocksMetaMap(scripCodes);

  // 🔥 MERGE
  return mergePortfolioWithMeta(filtered, metaMap);
};