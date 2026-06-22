import pool from "../config/postgres.js";
import { db as firestore } from "../config/firebase.js";
import { isMarketOpen } from "./marketStatus.service.js";

const EXCHANGE_MAP = {
  NSE: "N",
  BSE: "B",
  MCX: "M",
  ALL: null,
};



export const getStockByScrip = async ({ scripCode, exch, exchType }) => {
  const query = `
    SELECT *
    FROM stocks
    WHERE scripcode = $1
    AND exchange = $2
    AND exchangetype = $3
    LIMIT 1
  `;

  const values = [scripCode, exch, exchType];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

export const searchStocks = async ({ name, exch }) => {
  if (!name || name.trim().length < 3) {
    return [];
  }

  const queryText = name.trim().toLowerCase();
  const words = queryText.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [];
  }

  let sql = `
  SELECT
      id,
      symbol,
      name,
      exchange,
      exchangetype AS "exchangeType",
      scripcode AS "scripCode",
      series,
      expiry,
      scriptype AS "scripType",
      strikerate AS "strikeRate",
      ticksize AS "tickSize",
      lotsize AS "lotSize",
      qtylimit AS "qtyLimit",
      multiplier,
      symbolroot AS "symbolRoot",
      bocoallowed AS "bocoAllowed",
      isin
  FROM stocks
  WHERE 1=1
  AND (scriptype IS NULL OR scriptype NOT IN ('CE', 'PE'))
`;

  const values = [];
  let index = 1;

  words.forEach((word) => {
    sql += `
      AND (
        symbol_lower LIKE $${index}
        OR name_lower LIKE $${index + 1}
      )
    `;

    values.push(`%${word}%`, `%${word}%`);
    index += 2;
  });

  const exchangeCode = EXCHANGE_MAP[exch] ?? null;

  if (exchangeCode) {
    sql += ` AND exchange = $${index}`; 
    values.push(exchangeCode);
    index++;
  }

  sql += ` LIMIT 50`;

  console.log(sql);
console.log("values", values);

  const result = await pool.query(sql, values);

  return result.rows;
};

// export const getStockByScrip = ({ scripCode, exch, exchType }) => {
//   return new Promise((resolve, reject) => {
//     const query = `
//       SELECT *
//       FROM stocks
//       WHERE scripCode = ?
//       AND exchange = ?
//       AND exchangeType = ?
//       LIMIT 1
//     `;

//     db.get(query, [scripCode, exch, exchType], (err, row) => {
//       if (err) return reject(err);
//       resolve(row || null);
//     });
//   });
// };

// 🔍 SEARCH STOCKS (existing - unchanged)
// export const searchStocks = ({ name, exch }) => {
//   return new Promise((resolve, reject) => {
//     if (!name || name.trim().length < 3) {
//       return resolve([]);
//     }

//     const query = name.trim().toLowerCase();
//     const words = query.split(/\s+/).filter(Boolean);

//     if (!words.length) {
//       return resolve([]);
//     }

//     let sql = `
//       SELECT 
//         id,
//         symbol,
//         name,
//         exchange,
//         exchangeType,
//         scripCode,
//         series,

//         -- ✅ Added (matching your DB exactly)
//         expiry,
//         scripType,
//         strikeRate,
//         tickSize,
//         lotSize,
//         qtyLimit,
//         multiplier,
//         symbolRoot,
//         bocoAllowed,
//         isin

//       FROM stocks
//       WHERE 1=1
//       AND (scripType IS NULL OR scripType NOT IN ('CE', 'PE'))
//     `;

//     const params = [];

//     // Ensure every typed word is present in symbol or name.
//     words.forEach((word) => {
//       sql += `
//         AND (
//           symbol_lower LIKE ?
//           OR name_lower LIKE ?
//         )
//       `;
//       params.push(`%${word}%`, `%${word}%`);
//     });

//     const exchangeCode = EXCHANGE_MAP[exch] ?? null;

//     if (exchangeCode) {
//       sql += ` AND exchange = ?`;
//       params.push(exchangeCode);
//     }

//     sql += ` LIMIT 50`;

//     db.all(sql, params, (err, rows) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(rows);
//     });
//   });
// };



// 🔥 BUY STOCK SERVICE (EQ + MCX)
export const buyStockService = async ({ userId, payload }) => {
  const {
    ScripCode,
    Exch,
    ExchType,
    Quantity, // for EQ
    lots,     // for MCX
    multiplier, // for MCX
    symbol,
    name,
    LTP
  } = payload;

  const addedAt = Math.floor(Date.now() / 1000);
  const tradeDate = new Date().toISOString().split("T")[0];

  const isMCX = Exch === "M";

  // 🔥 MARKET STATUS CHECK
  const marketOpen = await isMarketOpen(Exch);

  if (!marketOpen) {
    return {
      statusCode: 400,
      status: "FAILED",
      message: "Market is currently closed"
    };
  }

  // ✅ Calculation
  let totalCost = 0;

  if (isMCX) {
    totalCost = Number(
      (0.15 * LTP * multiplier * lots).toFixed(2)
    );
  } else {
    totalCost = Number((LTP * Quantity).toFixed(2));
  }

  const userRef = firestore.collection("users").doc(userId);

  try {
    return await firestore.runTransaction(async (transaction) => {

      // 🔥 READS
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const userData = userDoc.data();
      const balance = userData.balance || 0;

      const portfolioId = `${userId}_${ScripCode}_${Exch}_${ExchType}`;

      const portfolioRef = firestore
        .collection("portfolioMaster")
        .doc(portfolioId);

      const portfolioDoc = await transaction.get(portfolioRef);

      // 🔹 VALIDATION
      if (balance < totalCost) {

        const reason = `Insufficient balance. Required ₹${totalCost}, available ₹${balance}`;

        const orderRef = firestore.collection("orderBook").doc();

        transaction.set(orderRef, {
          userId,
          addedAt,
          type: "BUY",
          status: "FAILED",
          failureCode: "INSUFFICIENT_BALANCE",
          reason,
          ScripCode,
          Exch,
          ExchType,
          symbol,
          name,
          price: Number(LTP.toFixed(2)),
          quantity: isMCX ? null : Quantity,
          lots: isMCX ? lots : null,
          multiplier: isMCX ? multiplier : null,
          totalValue: totalCost,
          pnl: 0
        });

        return {
          statusCode: 400,
          status: "FAILED",
          message: reason
        };
      }

      // 🔥 WRITES

      const updatedBalance = Number((balance - totalCost).toFixed(2));

      transaction.update(userRef, {
        balance: updatedBalance
      });

      // 🔹 Portfolio Logic

      if (!portfolioDoc.exists) {
        transaction.set(portfolioRef, {
          userId,
          ScripCode,
          Exch,
          ExchType,
          symbol,
          name,
          totalQty: isMCX ? null : Quantity,
          lots: isMCX ? lots : null,
          multiplier: isMCX ? multiplier : null,
          avgPrice: Number(LTP.toFixed(2)),
          investedValue: totalCost,
          tradeDate,
          addedAt
        });
      } else {
        const existing = portfolioDoc.data();

        if (isMCX) {
          const newLots = (existing.lots || 0) + lots;
        
          const newInvested = Number(
            ((existing.investedValue || 0) + totalCost).toFixed(2)
          );
        
          const newAvg = Number(
            (
              newInvested /
              (0.15 * multiplier * newLots)
            ).toFixed(2)
          );
        
          transaction.update(portfolioRef, {
            lots: newLots,
            multiplier,
            avgPrice: newAvg,
            investedValue: newInvested,
            tradeDate,
            addedAt
          });
        
        } else {
          const newQty = existing.totalQty + Quantity;

          const newInvested = Number(
            (existing.investedValue + totalCost).toFixed(2)
          );

          const newAvg = Number((newInvested / newQty).toFixed(2));

          transaction.update(portfolioRef, {
            totalQty: newQty,
            avgPrice: newAvg,
            investedValue: newInvested,
            tradeDate,
            addedAt
          });
        }
      }

      // 🔹 OrderBook SUCCESS
      const orderRef = firestore.collection("orderBook").doc();

      transaction.set(orderRef, {
        userId,
        addedAt,
        type: "BUY",
        status: "SUCCESS",
        failureCode: null,
        reason: "Order placed successfully",
        ScripCode,
        Exch,
        ExchType,
        symbol,
        name,
        price: Number(LTP.toFixed(2)),
        quantity: isMCX ? null : Quantity,
        lots: isMCX ? lots : null,
        multiplier: isMCX ? multiplier : null,
        totalValue: totalCost,
        pnl: 0
      });

      return {
        statusCode: 200,
        status: "SUCCESS",
        message: "Order placed successfully"
      };

    });

  } catch (error) {
    console.error("BUY SERVICE ERROR:", error);

    return {
      statusCode: 500,
      status: "FAILED",
      message: error.message || "Transaction failed"
    };
  }
};






export const sellStockService = async ({ userId, payload }) => {
  const {
    ScripCode,
    Exch,
    ExchType,
    Quantity,
    lots,
    multiplier,
    symbol,
    name,
    LTP
  } = payload;

  const addedAt = Math.floor(Date.now() / 1000);
  const tradeDate = new Date().toISOString().split("T")[0];

  const isMCX = Exch === "M";

    // 🔥 MARKET STATUS CHECK
  const marketOpen = await isMarketOpen(Exch);

  if (!marketOpen) {
    return {
      statusCode: 400,
      status: "FAILED",
      message: "Market is currently closed"
    };
  }

  const userRef = firestore.collection("users").doc(userId);
  const portfolioId = `${userId}_${ScripCode}_${Exch}_${ExchType}`;
  const portfolioRef = firestore.collection("portfolioMaster").doc(portfolioId);

  try {
    return await firestore.runTransaction(async (transaction) => {

      // 🔥 READS
      const userDoc = await transaction.get(userRef);
      const portfolioDoc = await transaction.get(portfolioRef);

      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const balance = userDoc.data().balance || 0;

      // ❌ No stock
      if (!portfolioDoc.exists) {
        const reason = "You do not own this stock";

        const orderRef = firestore.collection("orderBook").doc();

        transaction.set(orderRef, {
          userId,
          addedAt,
          type: "SELL",
          status: "FAILED",
          failureCode: "NO_HOLDINGS",
          reason,
          ScripCode,
          Exch,
          ExchType,
          symbol,
          name,
          price: LTP,
          quantity: isMCX ? null : Quantity,
          lots: isMCX ? lots : null,
          multiplier: isMCX ? multiplier : null,
          totalValue: 0,
          pnl: 0
        });

        return {
          statusCode: 400,
          status: "FAILED",
          message: reason
        };
      }

      const portfolio = portfolioDoc.data();

      // 🔹 Extract values
      const existingLots = portfolio.lots || portfolio.totalQty || 0;
      const avgPrice = portfolio.avgPrice || 0;
      const mult = portfolio.multiplier || multiplier || 1;

      // ❌ Selling more than owned
      if ((isMCX ? lots : Quantity) > existingLots) {
        const reason = `Cannot sell. You only have ${existingLots}`;

        const orderRef = firestore.collection("orderBook").doc();

        transaction.set(orderRef, {
          userId,
          addedAt,
          type: "SELL",
          status: "FAILED",
          failureCode: "INSUFFICIENT_QUANTITY",
          reason,
          ScripCode,
          Exch,
          ExchType,
          symbol,
          name,
          price: LTP,
          quantity: isMCX ? null : Quantity,
          lots: isMCX ? lots : null,
          multiplier: mult,
          totalValue: 0,
          pnl: 0
        });

        return {
          statusCode: 400,
          status: "FAILED",
          message: reason
        };
      }

      // 🔥 CALCULATIONS

      const qty = isMCX ? lots : Quantity;

      const pnl = isMCX
        ? (LTP - avgPrice) * mult * qty
        : (LTP - avgPrice) * qty;

      const marginRelease = isMCX
        ? 0.15 * avgPrice * mult * qty
        : 0;

      const sellValue = isMCX
        ? marginRelease + pnl
        : LTP * qty;

      const updatedBalance = Number((balance + sellValue).toFixed(2));

      transaction.update(userRef, {
        balance: updatedBalance
      });

      // 🔹 Update Portfolio
      const newQty = existingLots - qty;

      if (newQty === 0) {
        transaction.delete(portfolioRef);
      } else {
        const updatedData = isMCX
          ? {
              lots: newQty,
              investedValue: Number(
                (portfolio.avgPrice * mult * newQty * 0.15).toFixed(2)
              ),
              tradeDate,
              addedAt
            }
          : {
              totalQty: newQty,
              investedValue: Number(
                (portfolio.avgPrice * newQty).toFixed(2)
              ),
              tradeDate,
              addedAt
            };

        transaction.update(portfolioRef, updatedData);
      }

      // 🔹 OrderBook SUCCESS
      const orderRef = firestore.collection("orderBook").doc();

      transaction.set(orderRef, {
        userId,
        addedAt,
        type: "SELL",
        status: "SUCCESS",
        failureCode: null,
        reason: "Order placed successfully",
        ScripCode,
        Exch,
        ExchType,
        symbol,
        name,
        price: LTP,
        quantity: isMCX ? null : Quantity,
        lots: isMCX ? lots : null,
        multiplier: mult,
        totalValue: sellValue,
        pnl: Number(pnl.toFixed(2))
      });

      return {
        statusCode: 200,
        status: "SUCCESS",
        message: "Order placed successfully"
      };

    });

  } catch (error) {
    console.error("SELL SERVICE ERROR:", error);

    return {
      statusCode: 500,
      status: "FAILED",
      message: error.message || "Transaction failed"
    };
  }
};