import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

try {
  if (serviceAccountStr) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountStr, "base64").toString("utf-8"),
    );

    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
  } else {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT not found. Database features will be disabled.",
    );
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { db };
