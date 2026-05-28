// DEACTIVATED: Supabase is no longer used in this project. Firebase is the sole active backend.
/*
 * ============================================================================
 * BILLQYRO SUPABASE AUTHENTICATION & RLS STRATEGY PLAN
 * ============================================================================
 * Current Issue: 
 * Supabase relies on its own JWT tokens to enforce Row Level Security (RLS). 
 * Since BillQyro uses Firebase Auth, Supabase currently sees all client requests 
 * as "anonymous", triggering RLS "permission denied" blocks for real tables 
 * (profiles, businesses, invoices).
 *
 * DO NOT add "WITH CHECK (true)" to real tables! Doing so would allow anyone 
 * with the anon key to overwrite or steal business and customer data.
 *
 * Strategy Options:
 * 1. Keep Firebase Auth + Edge Functions (Recommended for seamless migration)
 *    -> Clients authenticate with Firebase.
 *    -> Client sends Firebase JWT to a Supabase Edge Function (or backend).
 *    -> Edge function validates Firebase token and securely writes to Supabase 
 *       bypassing RLS (via service role key) or issuing a custom Supabase token.
 *
 * 2. Full Migration to Supabase Auth (Recommended for long-term native use)
 *    -> Replace Firebase Auth entirely.
 *    -> RLS works natively out of the box using `auth.uid()`.
 *    -> Requires rewriting login/signup UI and active session handling.
 *
 * 3. Temporary local-only test mode (Not for Production)
 *    -> Disabling RLS / Opening tables publicly. High security risk.
 *
 * CURRENT RECOMMENDATION:
 * Keep Firebase as the active database. Keep Supabase connected for testing 
 * against the safe `supabase_connection_tests` table. Do not write real 
 * app data until a secure server strategy (Option 1) or Auth migration 
 * (Option 2) is implemented.
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from "../utils/supabase.js";

// Basic Helpers
export const checkSupabaseReady = () => {
  return isSupabaseConfigured && supabase !== null;
};

export const getSupabaseStatus = () => {
  return {
    isConfigured: isSupabaseConfigured,
    clientInitialized: supabase !== null,
    ready: checkSupabaseReady()
  };
};

export const testSupabaseWriteRead = async () => {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };

  try {
    // 1. Write to test table
    const { data: wData, error: wError } = await supabase
      .from('supabase_connection_tests')
      .insert([{ test_key: 'billqyro_safe_test', message: 'BillQyro Supabase connection working' }])
      .select();

    if (wError) throw wError;

    // 2. Read back from test table
    const { data: rData, error: rError } = await supabase
      .from('supabase_connection_tests')
      .select('*')
      .eq('test_key', 'billqyro_safe_test')
      .limit(1)
      .maybeSingle();

    if (rError) throw rError;

    // 3. Output logic
    const finalData = rData || (Array.isArray(wData) && wData.length > 0 ? wData[0] : wData);
    return { success: true, data: finalData };
  } catch (error) {
    console.error("Supabase test error:", error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
};

export const testSyncProfileToSupabase = async (profileData, businessData) => {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    let profileResult = null;
    let businessResult = null;

    if (profileData) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      if (error) throw new Error(`profiles RLS block: ${error.message}`);
      profileResult = data;
    }

    if (businessData) {
      const { data, error } = await supabase
        .from('businesses')
        .insert([businessData])
        .select();
      if (error) throw new Error(`businesses RLS block: ${error.message}`);
      businessResult = data;
    }

    return { success: true, profileResult, businessResult };
  } catch (error) {
    console.error("Supabase profile sync error:", error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
};

// ==========================================
// PLACEHOLDERS FOR SUPABASE TABLES
// ==========================================

// Profiles
export const getProfile = async (userId) => {
  console.log("Placeholder: getProfile called for", userId);
  return null;
};
export const saveProfile = async (profileData) => {
  console.log("Placeholder: saveProfile called", profileData);
  return null;
};

// Businesses
export const getBusiness = async (businessId) => {
  console.log("Placeholder: getBusiness called for", businessId);
  return null;
};
export const saveBusiness = async (businessData) => {
  console.log("Placeholder: saveBusiness called", businessData);
  return null;
};

// Customers
export const getCustomers = async (userId) => {
  console.log("Placeholder: getCustomers called for user", userId);
  return [];
};
export const saveCustomer = async (customerData) => {
  console.log("Placeholder: saveCustomer called", customerData);
  return null;
};

// Products
export const getProducts = async (userId) => {
  console.log("Placeholder: getProducts called for user", userId);
  return [];
};
export const saveProduct = async (productData) => {
  console.log("Placeholder: saveProduct called", productData);
  return null;
};

// Invoices
export const getInvoices = async (userId) => {
  console.log("Placeholder: getInvoices called for user", userId);
  return [];
};
export const saveInvoice = async (invoiceData) => {
  console.log("Placeholder: saveInvoice called", invoiceData);
  return null;
};

// Invoice Items
export const getInvoiceItems = async (invoiceId) => {
  console.log("Placeholder: getInvoiceItems called for invoice", invoiceId);
  return [];
};
export const saveInvoiceItem = async (itemData) => {
  console.log("Placeholder: saveInvoiceItem called", itemData);
  return null;
};

// Payments
export const getPayments = async (invoiceId) => {
  console.log("Placeholder: getPayments called for invoice", invoiceId);
  return [];
};
export const savePayment = async (paymentData) => {
  console.log("Placeholder: savePayment called", paymentData);
  return null;
};

// Settings
export const getSettings = async (userId) => {
  console.log("Placeholder: getSettings called for user", userId);
  return null;
};
export const saveSettings = async (settingsData) => {
  console.log("Placeholder: saveSettings called", settingsData);
  return null;
};

// Theme Settings
export const getThemeSettings = async (userId) => {
  console.log("Placeholder: getThemeSettings called for user", userId);
  return null;
};
export const saveThemeSettings = async (themeData) => {
  console.log("Placeholder: saveThemeSettings called", themeData);
  return null;
};

// Sync Queue
export const getSyncQueue = async (userId) => {
  console.log("Placeholder: getSyncQueue called for user", userId);
  return [];
};
export const addToSyncQueue = async (syncData) => {
  console.log("Placeholder: addToSyncQueue called", syncData);
  return null;
};

// Activity Logs
export const getActivityLogs = async (userId) => {
  console.log("Placeholder: getActivityLogs called for user", userId);
  return [];
};
export const saveActivityLog = async (logData) => {
  console.log("Placeholder: saveActivityLog called", logData);
  return null;
};
