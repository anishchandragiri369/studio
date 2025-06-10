// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Log process.env to see all available environment variables during build/runtime
// console.log("SupabaseClientInit: All process.env variables:", process.env);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log the specific variables being used
// console.log("SupabaseClientInit: Attempting to read NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
// console.log("SupabaseClientInit: Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;
let isEffectivelyConfigured = false;

if (!supabaseUrl || !supabaseAnonKey) {
  const warningMessage =
    "CRITICAL SUPABASE CONFIGURATION WARNING:\n" +
    "Supabase URL or Anon Key is MISSING from the assembled Supabase config. \n" +
    `  Attempted URL: '${supabaseUrl}'\n` +
    `  Attempted Anon Key: '${supabaseAnonKey}'\n` +
    "This indicates that the corresponding NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are undefined or empty when read by Next.js.\n\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY .env FILE: Ensure a file named exactly '.env' exists in the ROOT directory of your project.\n" +
    "2. CHECK VARIABLE NAMES: In the .env file, ensure variable names are EXACTLY 'NEXT_PUBLIC_SUPABASE_URL' and 'NEXT_PUBLIC_SUPABASE_ANON_KEY' (must start with NEXT_PUBLIC_).\n" +
    "3. VALIDATE VALUES: Confirm the values assigned in .env are correct and copied accurately from your Supabase project settings (Project URL and Project API Key -> anon key).\n" +
    "4. RESTART SERVER: CRITICAL - After ANY changes to the .env file, you MUST STOP and RESTART your Next.js development server (e.g., 'npm run dev').\n\n" +
    "Supabase services will be DISABLED until this is resolved.\n" +
    `Direct read of NEXT_PUBLIC_SUPABASE_URL by this script: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n` +
    `Direct read of NEXT_PUBLIC_SUPABASE_ANON_KEY by this script: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  
  console.warn(warningMessage);
  // supabaseInstance remains null, isEffectivelyConfigured remains false
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("SupabaseClientInit: Supabase client initialized successfully.");
    isEffectivelyConfigured = true;
  } catch (error) {
    console.error("SupabaseClientInit: Error initializing Supabase client:", error);
    console.error("SupabaseClientInit: The configuration that failed was URL:", supabaseUrl, "Anon Key:", supabaseAnonKey ? 'Present (not logged for security)' : 'Missing');
    supabaseInstance = null;
    isEffectivelyConfigured = false;
  }
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = isEffectivelyConfigured;
