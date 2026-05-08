import express from "express";
import {
  addToWatchlistController,
  getWatchlistController,
  removeFromWatchlistController,
} from "../controllers/watchlist.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", verifyToken, addToWatchlistController);
router.get("/get", verifyToken, getWatchlistController);
router.post("/remove", verifyToken, removeFromWatchlistController);

export default router;