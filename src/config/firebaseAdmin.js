import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read service account
const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../serviceAccountKey.json"),
    "utf-8"
  )
);

// ✅ FIX: prevent multiple init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export firestore
export const firestore = admin.firestore(); 