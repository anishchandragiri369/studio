
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Log the assembled config object to help with debugging environment variable issues
// This will appear in your browser's developer console and possibly the server terminal.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// This log is crucial for you to see what your app is actually reading.
console.log("Firebase Config for Initialization (assembled from process.env):", firebaseConfig);

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  try {
    // Ensure all critical keys are present before initializing
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      const errorMessage = 
        `Firebase apiKey or projectId is missing in the assembled firebaseConfig. ` +
        `Attempted apiKey: '${firebaseConfig.apiKey}', Attempted projectId: '${firebaseConfig.projectId}'. ` +
        "This means the corresponding NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are undefined or empty. " +
        "Please meticulously check your .env file in the project root, ensure the variable names are correct (prefixed with NEXT_PUBLIC_), that they have valid values, and that you have RESTARTED your Next.js development server after any changes to .env.";
      
      console.error(errorMessage, {
          apiKey_read_direct: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId_read_direct: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          assembled_config_at_error: firebaseConfig
      });
      throw new Error(`Firebase initialization failed. ${errorMessage}`);
    }
    app = initializeApp(firebaseConfig);
  } catch (error) {
    // Catching errors during initializeApp, which could also be due to bad config (though the check above should catch missing keys)
    console.error("Firebase initializeApp error (inner catch):", error);
    throw new Error(`Firebase initialization failed. Please check your Firebase configuration in .env and ensure the server was restarted. Original error: ${error}`);
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
} catch (error) {
    // This error would typically mean 'app' is not a valid FirebaseApp instance.
    console.error("Firebase getAuth error (after app object retrieval/initialization attempt):", error);
    throw new Error(`Firebase getAuth failed. This usually means the app object was not correctly initialized, likely due to earlier config issues. Original error: ${error}`);
}

export { app, auth };
