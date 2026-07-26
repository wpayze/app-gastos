import { createClient } from "@/lib/supabase/server";
import type { ForeignCurrency } from "@/lib/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SUPPORTED: ForeignCurrency[] = ["USD", "HNL"];

/** EUR por unidad de cada moneda soportada, tal como las devuelve open.er-api.com (base EUR). */
async function fetchLatestRates(): Promise<Record<ForeignCurrency, number>> {
  const res = await fetch("https://open.er-api.com/v6/latest/EUR");
  if (!res.ok) {
    throw new Error(`No se pudieron obtener las tasas de cambio (${res.status})`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates = data.rates;
  if (!rates) throw new Error("Respuesta de tasas de cambio inválida");

  const out = {} as Record<ForeignCurrency, number>;
  for (const currency of SUPPORTED) {
    const unitsPerEur = rates[currency];
    if (!unitsPerEur) throw new Error(`Tasa de ${currency} no disponible`);
    out[currency] = 1 / unitsPerEur;
  }
  return out;
}

/**
 * Tasa de cambio (EUR por unidad de `moneda`), cacheada hasta 24h.
 * Si el caché está vencido y la API externa falla, se usa la última tasa
 * conocida en vez de bloquear la creación del movimiento — solo lanza si
 * nunca hubo una tasa cacheada.
 */
export async function getExchangeRate(moneda: ForeignCurrency): Promise<number> {
  const supabase = await createClient();

  const { data: cached, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("moneda", moneda)
    .maybeSingle();
  if (error) throw error;

  const isFresh =
    cached !== null &&
    Date.now() - new Date(cached.actualizado_at).getTime() < CACHE_TTL_MS;
  if (isFresh) return cached.tasa_eur;

  try {
    const fresh = await fetchLatestRates();
    const { error: upsertError } = await supabase
      .from("exchange_rates")
      .upsert(SUPPORTED.map((c) => ({ moneda: c, tasa_eur: fresh[c] })));
    if (upsertError) throw upsertError;
    return fresh[moneda];
  } catch (err) {
    if (cached) return cached.tasa_eur;
    throw err;
  }
}
