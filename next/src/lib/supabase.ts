import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  _client = createBrowserClient<Database>(url, key);
  return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});
