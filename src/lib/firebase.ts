
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let isFirebaseEffectivelyConfigured = false;

// Ensure all critical keys are present before initializing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const warningMessage =
    "CRITICAL FIREBASE CONFIGURATION WARNING:\n" +
    "Firebase apiKey or projectId is MISSING from the assembled firebaseConfig. \n" +
    `  Attempted apiKey: '${firebaseConfig.apiKey}'\n` +
    `  Attempted projectId: '${firebaseConfig.projectId}'\n` +
    "This indicates that the corresponding NEXT_PUBLIC_FIREBASE_API_KEY and/or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are undefined or empty when read by Next.js.\n\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY .env FILE: Ensure a file named exactly '.env' exists in the ROOT directory of your project.\n" +
    "2. CHECK VARIABLE NAMES: In the .env file, ensure variable names are EXACTLY 'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', etc. (must start with NEXT_PUBLIC_).\n" +
    "3. VALIDATE VALUES: Confirm the values assigned in .env are correct and copied accurately from your Firebase project console.\n" +
    "4. RESTART SERVER: CRITICAL - After ANY changes to the .env file, you MUST STOP and RESTART your Next.js development server (e.g., 'npm run dev').\n\n" +
    "Firebase services (like Authentication) will be DISABLED until this is resolved.\n" +
    `Direct read of NEXT_PUBLIC_FIREBASE_API_KEY by this script: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}\n` +
    `Direct read of NEXT_PUBLIC_FIREBASE_PROJECT_ID by this script: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
  
  console.warn(warningMessage);
  // app and auth will remain null, and isFirebaseEffectivelyConfigured will remain false.
  // No error will be thrown here to allow the app to run without Firebase.
} else {
  // All critical keys seem present, attempt initialization
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("FirebaseInit: Firebase App initialized successfully.");      isFirebaseEffectivelyConfigured = true; 
    } catch (e: any) {
      console.error("FirebaseInit: initializeApp() threw an unexpected error even with present config keys. This might be due to a malformed value in one of the .env variables, an incorrect (but present) API key, or a network issue preventing Firebase connection.", e);
      app = null; // Ensure app is null if initializeApp itself fails
      isFirebaseEffectivelyConfigured = false;
    }
  } else {
    app = getApps()[0];
    isFirebaseEffectivelyConfigured = true; // Already initialized
  }

  if (app) { // Only attempt getAuth if app was successfully initialized
    try {
      auth = getAuth(app);
    } catch (e: any) {
      console.error("FirebaseInit: getAuth(app) threw an error. This can happen if Authentication is not enabled in your Firebase project console, or due to other Firebase service-level issues.", e);
      auth = null; // Ensure auth is null if getAuth fails
      // isFirebaseEffectivelyConfigured remains true if app was initialized, but AuthContext will see auth as null.
    }
  } else {
    // If app is null here (e.g., because initializeApp failed due to malformed but present keys),
    // ensure auth is also null and the configured flag is false.
    auth = null;
    isFirebaseEffectivelyConfigured = false;
  }
}

export { app, auth, isFirebaseEffectivelyConfigured };
