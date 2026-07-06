import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createPublicServerClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing public Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabasePublic: ReturnType<typeof createPublicServerClient> | undefined;

export const supabasePublic = new Proxy({} as ReturnType<typeof createPublicServerClient>, {
  get(_, prop, receiver) {
    if (!_supabasePublic) _supabasePublic = createPublicServerClient();
    return Reflect.get(_supabasePublic, prop, receiver);
  },
});
