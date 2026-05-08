import express from "express";
import { getMe } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected route
router.get("/me", verifyToken, getMe);

export default router;