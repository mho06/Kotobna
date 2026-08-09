import { createClient } from "@supabase/supabase-js";

// Server-only - never import this from a "use client" component.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
