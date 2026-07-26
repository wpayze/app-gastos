-- Movimientos en dólares/lempiras, siempre convertidos y guardados en
-- euros. `cantidad` sigue siendo el monto en euros de siempre — nada de
-- lo que suma/ordena por `cantidad` (resúmenes, top gastos, alertas de
-- límite) necesita cambiar. Estas columnas son solo el dato histórico de
-- cómo se introdujo originalmente; quedan en null si se introdujo en euros.

alter table public.movements
  add column moneda_original text
    check (moneda_original in ('USD', 'HNL')),
  add column cantidad_original numeric(12, 2)
    check (cantidad_original is null or cantidad_original > 0),
  add column tasa_cambio numeric(14, 6)
    check (tasa_cambio is null or tasa_cambio > 0);

alter table public.movements
  add constraint movements_original_currency_consistency check (
    (moneda_original is null and cantidad_original is null and tasa_cambio is null)
    or (moneda_original is not null and cantidad_original is not null and tasa_cambio is not null)
  );

-- Caché de tasas de cambio (EUR por unidad de moneda), refrescada de paso
-- cuando alguien crea un movimiento en dólares/lempiras y el dato tiene
-- más de 24h — sin cron, igual que "Agregar a este mes" en recurrentes.
create table public.exchange_rates (
  moneda text primary key check (moneda in ('USD', 'HNL')),
  tasa_eur numeric(14, 6) not null check (tasa_eur > 0),
  actualizado_at timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;

-- No está ligada a un presupuesto (es un caché global de tasas públicas),
-- así que cualquier usuario autenticado puede leerla y refrescarla.
create policy "exchange_rates_select_authenticated" on public.exchange_rates
  for select to authenticated using (true);

create policy "exchange_rates_upsert_authenticated" on public.exchange_rates
  for insert to authenticated with check (true);

create policy "exchange_rates_update_authenticated" on public.exchange_rates
  for update to authenticated using (true) with check (true);
