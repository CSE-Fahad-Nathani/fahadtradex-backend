import express from "express";
import { getAIAnalysisController } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/analyze", getAIAnalysisController);

export default router;