import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye de este proxy todo lo que no necesita sesión:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, iconos de la PWA y el manifest
     * - sw.js (service worker)
     * - api/webhooks/ (llamadas de servicios externos: se autentican con su propio secreto)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|api/webhooks/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
