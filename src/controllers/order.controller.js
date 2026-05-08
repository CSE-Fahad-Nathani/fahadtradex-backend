import {
  getTodayOrders,
  getOrderHistory,
} from "../services/order.service.js";

// ==============================
// 📊 TODAY ORDERS
// ==============================
export const getOrdersController = async (req, res) => {
  try {
    const userId = req.user.userId;

    const data = await getTodayOrders(userId);

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Orders Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// ==============================
// 📜 ORDER HISTORY
// ==============================
export const getOrderHistoryController = async (req, res) => {
  try {
    const userId = req.user.userId;

    const data = await getOrderHistory(userId);

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Order History Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
    });
  }
};