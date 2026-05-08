import { db } from "../config/firebase.js";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { admin } from "../config/firebase.js";

const USERS_COLLECTION = "users";

// export const createUser = async ({ name, email, password, firebaseUid }) => {
  export const createUser = async ({ name, email, firebaseUid }) => {
  const userRef = db.collection(USERS_COLLECTION).doc(firebaseUid);

  // Check if user exists
  const existingUser = await userRef.get();
  if (existingUser.exists) {
    throw { status: 409, message: "User already exists" };
  }

  // Hash password
  // const saltRounds = 10;
  // const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const userData = {
    id: firebaseUid,
    name,
    email,
    // passwordHash,
    balance: 1000000,
    status: "active",
    isEmailVerified: false,
    createdAt: new Date(),
  };

  await userRef.set(userData);

  // Generate JWT
  const token = jwt.sign(
    {
      userId: firebaseUid,
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    userId: firebaseUid,
    name,
    email,
    accessToken: token,
  };
};


export const checkUserExistsByEmail = async (email) => {
  const snapshot = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  return !snapshot.empty;
};

// export const loginUser = async ({ email, password }) => {
//   // Find user by email
//   const snapshot = await db
//     .collection("users")
//     .where("email", "==", email)
//     .limit(1)
//     .get();

//   if (snapshot.empty) {
//     throw { status: 404, message: "User not found" };
//   }

//   const userDoc = snapshot.docs[0];
//   const userData = userDoc.data();

//   // Compare password
//   const isMatch = await bcrypt.compare(password, userData.passwordHash);

//   if (!isMatch) {
//     throw { status: 401, message: "Invalid credentials" };
//   }

//   // Generate JWT
//   const token = jwt.sign(
//     {
//       userId: userData.id,
//       email: userData.email,
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );

//   return {
//     userId: userData.id,
//     name: userData.name,
//     email: userData.email,
//     accessToken: token,
//   };
// };


export const loginUser = async ({ firebaseToken }) => {

  // ✅ Verify Firebase token
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

  const firebaseUid = decodedToken.uid;

  // ✅ Get Firestore user
  const userDoc = await db
    .collection("users")
    .doc(firebaseUid)
    .get();

  if (!userDoc.exists) {
    throw {
      status: 404,
      message: "User not found"
    };
  }

  const userData = userDoc.data();

  // ✅ Check email verification
  if (!decodedToken.email_verified) {
    throw {
      status: 401,
      message: "Please verify your email"
    };
  }

  // ✅ Update Firestore verification status
  if (!userData.isEmailVerified) {

    await db
      .collection("users")
      .doc(firebaseUid)
      .update({
        isEmailVerified: true
      });

  }

  // ✅ Generate JWT
  const token = jwt.sign(
    {
      userId: userData.id,
      email: userData.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    userId: userData.id,
    name: userData.name,
    email: userData.email,
    accessToken: token,
  };

};