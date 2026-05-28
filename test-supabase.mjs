import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket to prevent Supabase initialization error in Node.js 20
globalThis.WebSocket = class WebSocket {};

async function runTest() {
  console.log("--- Supabase Connection Report ---");
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const isEnvDetected = Boolean(supabaseUrl && supabaseAnonKey);
  console.log("1. .env values detected:", isEnvDetected ? "Yes" : "No");
  
  if (!isEnvDetected) {
    console.log("Cannot proceed without .env values.");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("2. Supabase client loads: Yes (successfully initialized)");
    
    // Attempt to read from profiles table
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.log("3. profiles table can be reached: No");
      console.error("   Error details:", error.message);
    } else {
      console.log("3. profiles table can be reached: Yes");
      console.log("   Data received:", data);
    }
  } catch (err) {
    console.log("Failed to initialize or connect.");
    console.error(err);
  }
}

runTest();
