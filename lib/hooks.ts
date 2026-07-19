"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Simula la carga de datos remotos para mostrar skeletons realistas.
 * `key` reinicia la carga (p. ej. al cambiar de presupuesto o de mes).
 */
export function useMockLoading(key: string = "", ms = 550) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setLoadedKey(key), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return loadedKey !== key;
}

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true cuando el navegador está sin conexión */
export function useOffline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => !navigator.onLine,
    () => false,
  );
}
