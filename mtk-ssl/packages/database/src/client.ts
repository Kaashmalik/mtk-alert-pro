import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

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

/**
 * Drizzle ORM database client
 * For direct database access with type-safe queries
 */
const connectionString = process.env.DATABASE_URL || "postgresql://ssl:ssl_dev_password@localhost:5432/ssl_dev";

// For query purposes (connection pooling)
const queryClient = postgres(connectionString);

// Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

