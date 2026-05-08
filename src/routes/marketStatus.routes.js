import express from "express";
import { getMarketStatus } from "../controllers/marketStatus.controller.js";

const router = express.Router();

// GET /api/market/status
router.get("/status", getMarketStatus);

export default router;