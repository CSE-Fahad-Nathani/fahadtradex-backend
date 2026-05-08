import { createUser } from "../services/auth.service.js";
import { validateSignup } from "../utils/validators.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { checkUserExistsByEmail } from "../services/auth.service.js";
import { loginUser } from "../services/auth.service.js";
import { generateRequestToken, generate5paisaAccessToken } from "../services/fivepaisa.service.js";
import { db } from "../config/firebase.js";



export const signup = async (req, res) => {
  try {
    // const { name, email, password, firebaseUid } = req.body;
    const { name, email, firebaseUid } = req.body;

    // Validate
    // const error = validateSignup({ name, email, password, firebaseUid });
    const error = validateSignup({ name, email, firebaseUid });
    if (error) {
      return errorResponse(res, 400, error);
    }

    // Create user
    const user = await createUser({
      name,
      email,
      firebaseUid,
    });

    return successResponse(res, user, "User created successfully");
  } catch (err) {
    console.error(err);

    if (err.status) {
      return errorResponse(res, err.status, err.message);
    }

    return errorResponse(res, 500, "Internal server error");
  }
};



export const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const exists = await checkUserExistsByEmail(email);

    return res.json({
      success: true,
      userExists: exists,
      message: exists
        ? "User already exists"
        : "User does not exist",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const login = async (req, res) => {
  try {
    // const { email, password } = req.body;
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    const user = await loginUser({ firebaseToken });

    // 🔍 Check Firestore for 5paisa token (single doc)
    const tokenDoc = await db
      .collection("accesstokens5paisa")
      .doc("token")
      .get();

    let has5paisaToken = false;
    let fivePaisaData = null;

if (tokenDoc.exists) {
  const data = tokenDoc.data();

  const now = new Date();
  const expiry = new Date(data.expireAt);

  if (expiry > now) {
    has5paisaToken = true;
    fivePaisaData = {
      accessToken: data.accessToken,
      clientCode: data.clientCode,
    };
  }
}

// 🔥 If token not present or expired → generate new one
if (!has5paisaToken) {
  try {
    // Step 1: RequestToken
    const requestToken = await generateRequestToken();

    // Step 2: AccessToken (your existing function)
    const result = await generate5paisaAccessToken(requestToken);

    const { accessToken, clientCode } = result;

    // ⏰ Expiry = today 11:59 PM
    const now = new Date();
    const expiry = new Date();
    expiry.setHours(23, 59, 0, 0);

    // 💾 Store in Firestore
    await db.collection("accesstokens5paisa").doc("token").set({
      accessToken,
      clientCode,
      expireAt: expiry.toISOString(),
      updatedAt: now.toISOString(),
    });

    has5paisaToken = true;
    fivePaisaData = {
      accessToken,
      clientCode,
    };
  } catch (err) {
    console.error("Auto 5paisa login failed:", err.message);
  }
}

    return res.json({
      success: true,
      message: "Login successful",
      has5paisaToken,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        accessToken: user.accessToken, // JWT
        fivePaisa: fivePaisaData, // null if not available
      },
    });
  } catch (err) {
    console.error(err);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




export const generate5paisaToken = async (req, res) => {
  try {
    const { requestToken } = req.body;

    if (!requestToken) {
      return res.status(400).json({
        success: false,
        message: "RequestToken is required",
      });
    }

    const result = await generate5paisaAccessToken(requestToken);

    const { accessToken, clientCode } = result;

    // ⏰ Set expiry = today 11:59 PM
    const now = new Date();
    const expiry = new Date();
    expiry.setHours(23, 59, 0, 0);

    // 💾 Store (single document)
    await db.collection("accesstokens5paisa").doc("token").set({
      accessToken,
      clientCode,
      expireAt: expiry.toISOString(),
      updatedAt: now.toISOString(),
    });

    return res.json({
      success: true,
      message: "5paisa token generated successfully",
      data: {
        accessToken,
        clientCode,
        expireAt: expiry,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};