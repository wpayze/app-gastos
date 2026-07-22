import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y mantiene sincronizadas
 * las cookies entre navegador y servidor.
 *
 * De momento NO redirige a /login cuando no hay usuario: esa pantalla
 * todavía no existe (llega con el auth mínimo). Cuando se añada, aquí es
 * donde se protegen las rutas privadas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Con Fluid compute no guardar este cliente en una variable global:
  // hay que crear uno nuevo en cada request.
  const supabase = createServerClient(
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
  await supabase.auth.getClaims();

  // IMPORTANTE: hay que devolver supabaseResponse tal cual. Si se crea una
  // respuesta nueva con NextResponse.next(), hay que copiar las cookies de
  // supabaseResponse a la respuesta nueva, o el navegador y el servidor
  // quedan desincronizados y la sesión del usuario se corta antes de tiempo.
  return supabaseResponse;
}
