import { db } from "../config/firebase.js";

// ========================================
// 🔹 GET TODAY RANGE (IST)
// ========================================
const getTodayRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  };
};

// ========================================
// 📊 GET TODAY ORDERS
// ========================================
export const getTodayOrders = async (userId) => {
  const { start, end } = getTodayRange();

  const snapshot = await db
    .collection("orderBook")
    .where("userId", "==", userId)
    .where("addedAt", ">=", start)
    .where("addedAt", "<=", end)
    .orderBy("addedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data());
};

// ========================================
// 📜 GET ORDER HISTORY
// ========================================
export const getOrderHistory = async (userId) => {
  const snapshot = await db
    .collection("orderBook")
    .where("userId", "==", userId)
    .orderBy("addedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data());
};