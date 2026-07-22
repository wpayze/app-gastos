"use client";

import { useEffect } from "react";

/**
 * Registra el service worker de la PWA.
 *
 * Solo en producción: en desarrollo, cachear el documento no protege nada
 * real (no hay build estable que servir offline) y sí puede dejar
 * hidratando un HTML viejo cacheado contra un bundle nuevo, ya que las
 * navegaciones por <Link> no vuelven a pasar por el fetch handler del SW.
 */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // El registro puede fallar en navegadores antiguos;
          // la aplicación funciona igualmente sin service worker.
        });
    }
  }, []);
  return null;
}
