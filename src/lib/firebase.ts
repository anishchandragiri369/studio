
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Log individual environment variables to help diagnose
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
// Add logs for other Firebase config variables if needed for further debugging

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the assembled config object to help with debugging environment variable issues
// Check your browser's developer console for this output.
console.log("Firebase Config for Initialization (assembled):", firebaseConfig);

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  try {
    // Ensure all critical keys are present before initializing
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error(
        "Firebase apiKey or projectId is missing in the assembled firebaseConfig. " +
        "This means the corresponding NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are undefined. " +
        "Please meticulously check your .env file in the project root, ensure the variable names are correct (prefixed with NEXT_PUBLIC_), and that you have RESTARTED your Next.js development server after any changes to .env."
      , firebaseConfig);
      throw new Error("Firebase apiKey or projectId is missing in the configuration. Check .env and restart server.");
    }
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // A more robust solution might involve a global error state or a fallback
    // For now, re-throwing to make it clear initialization failed.
    throw new Error(`Firebase initialization failed. Please check your Firebase configuration in .env and ensure the server was restarted. Original error: ${error}`);
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
} catch (error) {
    console.error("Firebase getAuth error after app object retrieval:", error);
    throw new Error(`Firebase getAuth failed. This usually means the app object was not correctly initialized, potentially due to earlier config issues. Original error: ${error}`);
}

export { app, auth };
