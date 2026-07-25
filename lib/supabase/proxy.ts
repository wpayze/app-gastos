import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refresca la sesión de Supabase en cada request, mantiene sincronizadas
 * las cookies entre navegador y servidor, y redirige a /login cuando no
 * hay usuario autenticado — esta es una app personal sin registro
 * público, así que no hace falta un modo "invitado".
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Con Fluid compute no guardar este cliente en una variable global:
  // hay que crear uno nuevo en cada request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No ejecutar código entre createServerClient() y getClaims(): un fallo
  // aquí puede dejar a los usuarios desconectados de forma intermitente.
  //
  // IMPORTANTE: quitar esta llamada puede provocar cierres de sesión
  // aleatorios si se usa server-side rendering con este cliente.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: hay que devolver supabaseResponse tal cual. Si se crea una
  // respuesta nueva con NextResponse.next(), hay que copiar las cookies de
  // supabaseResponse a la respuesta nueva, o el navegador y el servidor
  // quedan desincronizados y la sesión del usuario se corta antes de tiempo.
  return supabaseResponse;
}
