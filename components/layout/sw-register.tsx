"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA */
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // El registro puede fallar en desarrollo o navegadores antiguos;
          // la aplicación funciona igualmente sin service worker.
        });
    }
  }, []);
  return null;
}
