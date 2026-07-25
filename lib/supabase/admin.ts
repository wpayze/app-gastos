import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente con la service_role key: se salta RLS por completo.
 * Solo para scripts de servidor (seed, tareas de administración) —
 * nunca importar desde código que pueda acabar en el bundle del cliente.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() no debe ejecutarse en el navegador: expondría la service_role key.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
