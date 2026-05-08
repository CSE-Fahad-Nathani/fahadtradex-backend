import express from "express";
import { getMarketSnapshotController } from "../controllers/market.controller.js";

const router = express.Router();

router.post("/snapshot", getMarketSnapshotController);

export default router;