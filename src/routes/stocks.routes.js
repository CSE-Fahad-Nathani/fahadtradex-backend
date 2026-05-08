import express from "express";
import {
  searchStocksController,
  buyStockController,
  getStockDetailsController,
  sellStockController
} from "../controllers/stocks.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔍 SEARCH
router.get("/search", searchStocksController);

router.get("/details", getStockDetailsController);

// 🔥 BUY STOCK
router.post("/buy", verifyToken, buyStockController);

// 🔥 SELL STOCK
router.post("/sell", verifyToken, sellStockController);

export default router;