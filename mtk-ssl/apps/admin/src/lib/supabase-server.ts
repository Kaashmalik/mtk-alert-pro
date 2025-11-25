import { createSupabaseServerClient } from "@mtk/database";

/**
 * Get Supabase server client for admin operations
 * Uses service role key to bypass RLS
 */
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createSupabaseServerClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "kashif@maliktech.pk";
  return email === SUPER_ADMIN_EMAIL;
}

