import { db } from "../config/firebase.js";

export const addStockTarget = async ({
  userId,
  symbol,
  name,
  exchange,
  exchangeType,
  scripCode,
  targetPrice,
  initialPrice,
  module,
}) => {
  try {
    const normalizedSymbol = String(symbol).trim().toUpperCase();
    const normalizedModule = String(module).trim().toLowerCase();
    const docId = `${userId}_${normalizedModule}_${normalizedSymbol}`;
    const docRef = db.collection("stock_targets").doc(docId);

    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      await docRef.update({
        name,
        exchange,
        exchangeType,
        scripCode: String(scripCode),
        targetPrice: Number(targetPrice),
        initialPrice: Number(initialPrice),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: "Target updated successfully",
      };
    }

    await docRef.set({
      userId,
      symbol: normalizedSymbol,
      name,
      exchange,
      exchangeType,
      scripCode: String(scripCode),
      targetPrice: Number(targetPrice),
      initialPrice: Number(initialPrice),
      module: normalizedModule,
      addedAt: Date.now(),
    });

    return {
      success: true,
      message: "Target set successfully",
    };
  } catch (error) {
    console.error("Add Stock Target Service Error:", error);
    throw error;
  }
};
