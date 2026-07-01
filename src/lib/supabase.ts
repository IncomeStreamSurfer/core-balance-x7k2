import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL ?? "";
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = import.meta.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE ?? "";

/** Stateless public client — use in .astro frontmatter + /api/* reads
 *  that RLS already gates. Returns null if env missing so callers can
 *  degrade gracefully. */
export function anonClient(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

/** Service-role client — server-only. ONLY import from /api/* +
 *  webhooks. Bypasses RLS. Returns null if env missing. */
export function serviceClient(): SupabaseClient | null {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}
