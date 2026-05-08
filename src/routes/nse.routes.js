import express from "express";
import { getTopGainersController, getNifty50Controller } from "../controllers/nse.controller.js";

const router = express.Router();

router.get("/top-gainers", getTopGainersController);
router.get("/nifty50", getNifty50Controller);


export default router;