import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Safe test function to verify connection and read from profiles table
export const testSupabaseConnection = async () => {
  try {
    if (!supabase) {
      return { success: false, message: "Supabase client is not initialized. Missing .env values." };
    }
    const { data, error } = await supabase.from("profiles").select("*").limit(1);
    if (error) {
      return { success: false, message: `Error connecting to profiles table: ${error.message}`, error };
    }
    return { success: true, message: "Successfully connected to Supabase and read from profiles table.", data };
  } catch (err) {
    return { success: false, message: `Unexpected error: ${err.message}`, error: err };
  }
};
