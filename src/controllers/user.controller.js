import { db } from "../config/firebase.js";

export const getMe = async (req, res) => {
  try {
    const { userId } = req.user;

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = userDoc.data();

    return res.json({
      success: true,
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        balance: userData.balance,
        status: userData.status,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};