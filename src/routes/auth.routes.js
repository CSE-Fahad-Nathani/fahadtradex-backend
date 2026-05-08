import express from "express";
import { signup } from "../controllers/auth.controller.js";
import { checkUserExists } from "../controllers/auth.controller.js";
import { login } from "../controllers/auth.controller.js";
import { generate5paisaToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/check-user", checkUserExists);
router.post("/signup", signup);
router.post("/5paisa/generate-token", generate5paisaToken);

export default router;