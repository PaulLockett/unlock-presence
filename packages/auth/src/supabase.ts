import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseClient(
  url?: string,
  anonKey?: string,
): SupabaseClient {
  const supabaseUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const supabaseKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

export function createSupabaseServiceClient(
  url?: string,
  serviceRoleKey?: string,
): SupabaseClient {
  const supabaseUrl = url ?? process.env.SUPABASE_URL ?? "";
  const key = serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
