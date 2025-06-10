
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Log individual environment variables to help diagnose .env issues.
// These will appear in your server console when Next.js starts, and potentially in the browser console.
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
// It's good practice to log all expected Firebase env vars when debugging.
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
// console.log("Attempting to read NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);


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


let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Explicitly check for the most critical missing configuration values.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const warningMessage =
    "WARNING: Firebase apiKey or projectId is missing in the assembled firebaseConfig. " +
    `Attempted apiKey: '${firebaseConfig.apiKey}', Attempted projectId: '${firebaseConfig.projectId}'. ` +
    "Firebase services will NOT be initialized. This usually means the corresponding NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are undefined or empty. " +
    "Please meticulously check your .env file in the project root, ensure the variable names are correct (prefixed with NEXT_PUBLIC_), that they have valid values, and that you have RESTARTED your Next.js development server after any changes to .env.";
  
  console.warn(warningMessage, {
      apiKey_read_direct: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId_read_direct: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      assembled_config_at_warning: firebaseConfig
  });
  // app and auth will remain null, effectively disabling Firebase features.
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
      console.error("Firebase initializeApp() threw an unexpected error:", e);
      let detailedErrorMessage = "Firebase initializeApp() failed unexpectedly.";
      if (e instanceof Error) {
        detailedErrorMessage += ` Firebase reported: ${e.message}.`;
      }
      // Throw a more informative error if initialization itself fails with valid-looking keys
      // For now, we just log and app remains null to allow site to load without Firebase.
      // throw new Error(detailedErrorMessage + " Please double-check all Firebase configuration values in your .env file and ensure the server was restarted.");
      app = null; // Ensure app is null if initializeApp fails
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    try {
      auth = getAuth(app);
    } catch (e: any) {
      console.error("Firebase getAuth(app) threw an error:", e);
      let detailedErrorMessage = "Firebase getAuth(app) failed. This may indicate an issue with the initialized Firebase app object or that Firebase services are not correctly configured for your project.";
      if (e instanceof Error) {
          detailedErrorMessage += ` Firebase reported: ${e.message}.`;
        }
      // For now, we just log and auth remains null.
      // throw new Error(detailedErrorMessage + " Please ensure Firebase is correctly configured and all services (like Authentication) are enabled in the Firebase console if used.");
      auth = null; // Ensure auth is null if getAuth fails
    }
  } else {
    // If app couldn't be initialized (e.g. due to prior error or missing config that wasn't caught by the first check)
    // ensure auth is also null.
    auth = null;
  }
}

export { app, auth };
