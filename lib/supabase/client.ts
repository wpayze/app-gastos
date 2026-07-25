import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Cliente de Supabase para Client Components. Va con la anon key: RLS protege los datos. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
