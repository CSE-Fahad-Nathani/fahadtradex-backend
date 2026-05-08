import express from "express";
import { db as firebaseDB } from "../config/firebase.js";

const router = express.Router();

router.get("/test-write", async (req, res) => {
  try {
    console.log("Starting test write...");

    await firebaseDB.collection("test").doc("check").set({ ok: true });

    console.log("Write success");

    res.send("Write success");
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
});

export default router;