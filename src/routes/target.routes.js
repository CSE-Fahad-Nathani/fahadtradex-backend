import express from "express";
import { addStockTargetController } from "../controllers/target.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, addStockTargetController);

export default router;
