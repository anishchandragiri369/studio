
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Log individual environment variables to help diagnose .env issues.
// These will appear in your server console when Next.js starts, and potentially in the browser console.
// console.log("Reading NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// console.log("Reading NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// This log is useful to see what config object is actually being assembled.
// console.log("Firebase Config for Initialization (assembled from process.env):", firebaseConfig);

let app: FirebaseApp;
let auth: Auth;

// Explicitly check for the most critical missing configuration values.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMessage =
    `CRITICAL FIREBASE CONFIGURATION ERROR: Firebase apiKey or projectId is missing from the assembled firebaseConfig. ` +
    `Attempted apiKey: '${firebaseConfig.apiKey}', Attempted projectId: '${firebaseConfig.projectId}'. ` +
    "This indicates that the corresponding NEXT_PUBLIC_FIREBASE_API_KEY and/or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables " +
    "are undefined or empty when read by Next.js. \n\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY .env FILE: Ensure a file named exactly '.env' exists in the ROOT directory of your project.\n" +
    "2. CHECK VARIABLE NAMES: In the .env file, ensure the variable names are EXACTLY 'NEXT_PUBLIC_FIREBASE_API_KEY' and 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' (and other NEXT_PUBLIC_FIREBASE_... variables).\n" +
    "3. VALIDATE VALUES: Confirm the values assigned to these variables in .env are correct and copied accurately from your Firebase project console.\n" +
    "4. RESTART SERVER: CRITICAL - After ANY changes to the .env file, you MUST STOP and RESTART your Next.js development server (e.g., 'npm run dev').\n\n" +
    "Current environment variable values seen by this script (may be undefined if not set or not picked up): \n" +
    `  NEXT_PUBLIC_FIREBASE_API_KEY (direct read): ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}\n` +
    `  NEXT_PUBLIC_FIREBASE_PROJECT_ID (direct read): ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;

  console.error("Firebase Config Error Details:\n", errorMessage, "\nAssembled firebaseConfig object:", firebaseConfig);
  throw new Error("Firebase initialization failed due to missing apiKey or projectId. Check console for details and .env troubleshooting steps.");
}

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initializeApp() threw an unexpected error:", e);
    let detailedErrorMessage = "Firebase initializeApp() failed unexpectedly.";
    if (e instanceof Error) {
      detailedErrorMessage += ` Firebase reported: ${e.message}.`;
    }
    throw new Error(detailedErrorMessage + " Please double-check all Firebase configuration values in your .env file and ensure the server was restarted.");
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase getAuth(app) threw an error:", e);
  let detailedErrorMessage = "Firebase getAuth(app) failed. This may indicate an issue with the initialized Firebase app object or that Firebase services are not correctly configured for your project.";
   if (e instanceof Error) {
      detailedErrorMessage += ` Firebase reported: ${e.message}.`;
    }
  throw new Error(detailedErrorMessage + " Please ensure Firebase is correctly configured and all services (like Authentication) are enabled in the Firebase console if used.");
}

export { app, auth };
