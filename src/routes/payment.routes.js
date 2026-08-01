import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createOrder,
  getPackages,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/packages", verifyToken, getPackages);
router.post("/create-order", verifyToken, createOrder);
router.post("/verify-payment", verifyToken, verifyPayment);

export default router;
