// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let isEffectivelyConfigured = false;

if (!supabaseUrl || !supabaseAnonKey) {
  const warningMessage =
    "CRITICAL SUPABASE CONFIGURATION WARNING:\n" +
    "Supabase URL or Anon Key is MISSING or EMPTY from the assembled Supabase config. \n" +
    `  Attempted URL: '${supabaseUrl}'\n` +
    `  Attempted Anon Key: '${supabaseAnonKey ? 'Present (not logged for security)' : supabaseAnonKey}'\n` +
    "This indicates that the corresponding NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are undefined or empty when read by Next.js.\n\n" +
    "TROUBLESHOOTING STEPS:\n" +
    "1. VERIFY .env FILE: Ensure a file named exactly '.env' exists in the ROOT directory of your project.\n" +
    "2. CHECK VARIABLE NAMES: In the .env file, ensure variable names are EXACTLY 'NEXT_PUBLIC_SUPABASE_URL' and 'NEXT_PUBLIC_SUPABASE_ANON_KEY' (must start with NEXT_PUBLIC_).\n" +
    "3. VALIDATE VALUES: Confirm the values assigned in .env are correct, non-empty, and copied accurately from your Supabase project settings (Project URL and Project API Key -> anon key).\n" +
    "4. RESTART SERVER: CRITICAL - After ANY changes to the .env file, you MUST STOP and RESTART your Next.js development server (e.g., 'npm run dev').\n\n" +
    "Supabase services will be DISABLED until this is resolved.\n" +
    `Direct read of NEXT_PUBLIC_SUPABASE_URL by this script: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n` +
    `Direct read of NEXT_PUBLIC_SUPABASE_ANON_KEY by this script: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  
  console.warn(warningMessage);
} else {
  // At this point, supabaseUrl and supabaseAnonKey are non-empty strings.
  // Now, specifically validate the format of supabaseUrl.
  let isValidUrlFormat = false;
  try {
    new URL(supabaseUrl); // This will throw an error if the URL format is invalid.
    isValidUrlFormat = true;
  } catch (e) {
    console.error(
      `SupabaseClientInit: VALIDATION ERROR: The NEXT_PUBLIC_SUPABASE_URL ('${supabaseUrl}') is not a valid URL format. \n` +
      "It should be a complete URL, typically starting with 'https://'. \n" +
      "Example: 'https://your-project-ref.supabase.co'\n" +
      "Please check your .env file and ensure the URL is copied correctly from your Supabase project settings and includes the protocol.\n" +
      "Original error trying to parse URL: ", e
    );
    // isEffectivelyConfigured remains false, supabaseInstance remains null
  }
  if (isValidUrlFormat) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
      isEffectivelyConfigured = true;
    } catch (error) { // This catch is for other errors from createClient itself
      console.error("SupabaseClientInit: Error initializing Supabase client (even with a seemingly valid URL format):", error);
      supabaseInstance = null;
      isEffectivelyConfigured = false;
    }
  }
  // If !isValidUrlFormat, isEffectivelyConfigured and supabaseInstance remain at their initial (false/null) values.
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = isEffectivelyConfigured;
