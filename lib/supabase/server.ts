import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route
 * Handlers. Lee/escribe cookies de sesión; RLS corre como el usuario
 * autenticado en esa sesión.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll puede llamarse desde un Server Component, donde no se
            // pueden escribir cookies. Se ignora porque el proxy ya se
            // encarga de refrescar la sesión en cada request.
          }
        },
      },
    },
  );
}
