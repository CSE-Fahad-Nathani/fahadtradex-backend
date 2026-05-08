import express from "express";
import {
  getOrdersController,
  getOrderHistoryController,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// ==============================
// 📊 TODAY ORDERS
// ==============================
router.get("/orders", verifyToken, getOrdersController);

// ==============================
// 📜 ORDER HISTORY
// ==============================
router.get("/orders/history", verifyToken, getOrderHistoryController);

export default router;