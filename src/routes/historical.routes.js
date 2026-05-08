import express from "express";
import { getHistoricalController } from "../controllers/historical.controller.js";

const router = express.Router();

router.post("/data", getHistoricalController);

export default router;