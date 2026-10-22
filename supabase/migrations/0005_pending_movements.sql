-- Movimientos detectados en correos del banco (vía Google Apps Script →
-- webhook). No son movimientos todavía: quedan aquí como "pendientes" hasta
-- que alguien los agrega o los omite. Nunca se borran: omitir solo cambia
-- el estado, así un correo no vuelve a aparecer como pendiente.

create table public.pending_movements (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  -- Id del mensaje de Gmail: evita duplicados si el script reintenta.
  external_id text not null,
  comercio text not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  moneda text not null default 'EUR'
    check (moneda in ('EUR', 'USD', 'HNL')),
  fecha date not null,
  asunto text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'agregado', 'omitido')),
  movement_id uuid references public.movements (id) on delete set null,
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (budget_id, external_id)
);

create index pending_movements_budget_estado_idx
  on public.pending_movements (budget_id, estado, fecha desc);

alter table public.pending_movements enable row level security;

-- Las filas las inserta el webhook con la service_role (se salta RLS), así
-- que no hay política de insert. Tampoco de delete: nunca se borran.
create policy "pending_movements_select_member" on public.pending_movements
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "pending_movements_update_editor" on public.pending_movements
  for update to authenticated
  using (public.can_edit_budget(budget_id))
  with check (public.can_edit_budget(budget_id));
