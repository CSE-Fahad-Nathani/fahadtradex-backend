import { db } from "../config/firebase.js";

export const addToWatchlist = async ({ userId, watchlistName, stock }) => {
  try {
    const docId = `${userId}_${stock.id}_${watchlistName}`;
    const docRef = db.collection("watchlists").doc(docId);

    // ✅ CHECK IF EXISTS
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      return {
        success: false,
        message: "Already in watchlist",
      };
    }

    const data = {
      userId,
      watchlistName,

      stockId: stock.id,

      symbol: stock.symbol,
      name: stock.name,

      exchange: stock.exchange,
      exchangeType: stock.exchangeType,
      scripCode: stock.scripCode,
      series: stock.series,

      // ✅ Added fields (from payload)
      expiry: stock.expiry,
      scripType: stock.scripType,
      strikeRate: stock.strikeRate,
      tickSize: stock.tickSize,
      lotSize: stock.lotSize,
      qtyLimit: stock.qtyLimit,
      multiplier: stock.multiplier,
      symbolRoot: stock.symbolRoot,
      bocoAllowed: stock.bocoAllowed,
      isin: stock.isin,

      addedAt: Date.now(),
    };

    await docRef.set(data);

    return {
      success: true,
      message: "Added to watchlist",
    };
  } catch (error) {
    console.error("Watchlist Service Error:", error);
    throw error;
  }
};

export const getUserWatchlists = async (userId) => {
  try {
    const snapshot = await db
      .collection("watchlists")
      .where("userId", "==", userId)
      .get();

      

    const targetsSnapshot = await db
      .collection("stock_targets")
      .where("userId", "==", userId)
      .where("module", "==", "watchlist")
      .get();

    const normalizeValue = (value) => String(value || "").trim().toUpperCase();
    const makeTargetKey = (exchange, exchangeType, scripCode) =>
      `${normalizeValue(exchange)}_${normalizeValue(exchangeType)}_${normalizeValue(
        scripCode
      )}`;

    const targetMap = new Map();

    targetsSnapshot.forEach((doc) => {
      const target = doc.data();
      const key = makeTargetKey(
        target.exchange,
        target.exchangeType,
        target.scripCode
      );

      targetMap.set(key, {
        initialPrice: target.initialPrice,
        targetPrice: target.targetPrice,
      });
    });

    const result = {};

    snapshot.forEach((doc) => {
      const data = doc.data();

      const watchlistName = data.watchlistName;

      if (!result[watchlistName]) {
        result[watchlistName] = [];
      }
      
      const stockResponse = {
        stockId: data.stockId,
        symbol: data.symbol,
        name: data.name,
        exchange: data.exchange,
        exchangeType: data.exchangeType,
        scripCode: data.scripCode,
        series: data.series,

        // ✅ Keep your previous (even if undefined)
        Exch: data.Exch,
        ExchType: data.ExchType,
        ScripCode: data.ScripCode,
        Name: data.Name,
        Expiry: data.Expiry,
        ScripType: data.ScripType,
        StrikeRate: data.StrikeRate,
        FullName: data.FullName,
        TickSize: data.TickSize,
        LotSize: data.LotSize,
        QtyLimit: data.QtyLimit,
        Multiplier: data.Multiplier,
        SymbolRoot: data.SymbolRoot,
        BOCOAllowed: data.BOCOAllowed,
        ISIN: data.ISIN,
        ScripData: data.ScripData,
        Series: data.Series,

        // ✅ Added CORRECT mappings (from your DB/payload)
        expiry: data.expiry,
        scripType: data.scripType,
        strikeRate: data.strikeRate,
        tickSize: data.tickSize,
        lotSize: data.lotSize,
        qtyLimit: data.qtyLimit,
        multiplier: data.multiplier,
        symbolRoot: data.symbolRoot,
        bocoAllowed: data.bocoAllowed,
        isin: data.isin,
        addedAt: data.addedAt,
      };

      const targetKey = makeTargetKey(
        stockResponse.exchange || stockResponse.Exch,
        stockResponse.exchangeType || stockResponse.ExchType,
        stockResponse.scripCode || stockResponse.ScripCode
      );

      const matchedTarget = targetMap.get(targetKey);

      if (matchedTarget) {
        stockResponse.initialPrice = matchedTarget.initialPrice;
        stockResponse.targetPrice = matchedTarget.targetPrice;
      }

      result[watchlistName].push(stockResponse);
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get Watchlist Error:", error);
    throw error;
  }
};

export const removeFromWatchlist = async ({ userId, stockId, watchlistName }) => {
  try {
    const docId = `${userId}_${stockId}_${watchlistName}`;

    const docRef = db.collection("watchlists").doc(docId);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return {
        success: false,
        message: "Stock not found in watchlist",
      };
    }

    await docRef.delete();

    return {
      success: true,
      message: "Removed from watchlist",
    };
  } catch (error) {
    console.error("Remove Watchlist Error:", error);
    throw error;
  }
};