import express from "express";
import {
  getPositionsController,
  getPortfolioController,
} from "../controllers/portfolio.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js"; // ✅ FIXED

const router = express.Router();

// ========================================
// 📊 POSITIONS API
// ========================================
router.get("/positions", verifyToken, getPositionsController);

// ========================================
// 💼 PORTFOLIO API
// ========================================
router.get("/portfolio", verifyToken, getPortfolioController);

export default router;