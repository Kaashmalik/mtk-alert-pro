import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client factory
 * Creates a client instance with proper typing for multi-tenant support
 */
export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Server-side Supabase client (uses service role key)
 * Bypasses RLS - use with caution, only in trusted server contexts
 */
export function createSupabaseServerClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

