import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/calendar";

/**
 * Webhook al que llama el Google Apps Script de Gmail cuando llega un correo
 * del banco con una compra. No crea el movimiento: lo guarda como pendiente
 * en `pending_movements` para revisarlo en /pendientes.
 *
 * Auth: `Authorization: Bearer <BANK_WEBHOOK_SECRET>`.
 * Body JSON: { message_id, importe, comercio, fecha?, moneda?, asunto? }
 */

const CURRENCIES = ["EUR", "USD", "HNL"];

function validSecret(header: string | null): boolean {
  const secret = process.env.BANK_WEBHOOK_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const budgetId = process.env.BANK_WEBHOOK_BUDGET_ID;
  if (!budgetId) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const messageId = typeof body.message_id === "string" ? body.message_id.trim() : "";
  const comercio = typeof body.comercio === "string" ? body.comercio.trim() : "";
  const importe = Number(body.importe);
  const moneda = typeof body.moneda === "string" ? body.moneda.toUpperCase() : "EUR";
  const fecha =
    typeof body.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha)
      ? body.fecha
      : todayISO();

  if (!messageId || !comercio || !(importe > 0) || !CURRENCIES.includes(moneda)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pending_movements")
    .upsert(
      {
        budget_id: budgetId,
        external_id: messageId,
        comercio,
        cantidad: Math.round(importe * 100) / 100,
        moneda,
        fecha,
        asunto: typeof body.asunto === "string" ? body.asunto : null,
      },
      { onConflict: "budget_id,external_id", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    console.error("bank-email webhook", error);
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }

  // Con ignoreDuplicates, un mensaje ya recibido no devuelve fila.
  return NextResponse.json({ status: data.length ? "created" : "duplicate" });
}
