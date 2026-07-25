-- Centavo — esquema inicial
-- Refleja 1:1 los tipos de lib/types.ts y los datos de lib/mock/*.
-- Pensado para pegarse directo en el SQL Editor de Supabase, o correrse
-- con `supabase db push` si el CLI está enlazado al proyecto.

-- ── profiles ──────────────────────────────────────────────────
-- Espejo de auth.users con los datos de perfil que la UI necesita.
-- Se crea sola vía trigger cuando alguien se registra (más abajo).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  iniciales text not null,
  color text not null,
  created_at timestamptz not null default now()
);

-- ── budgets ───────────────────────────────────────────────────

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text not null default '',
  emoji text not null default '💰',
  moneda text not null default 'EUR',
  estado text not null default 'activo'
    check (estado in ('activo', 'archivado')),
  limite_mensual numeric(12, 2),
  created_at timestamptz not null default now()
);

-- ── budget_members ────────────────────────────────────────────
-- Une usuarios a presupuestos con rol y estado (activo/pendiente/suspendido).

create table public.budget_members (
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rol text not null
    check (rol in ('administrador', 'editor', 'lectura')),
  estado text not null default 'activo'
    check (estado in ('activo', 'pendiente', 'suspendido')),
  fecha_incorporacion date not null default current_date,
  ultima_actividad timestamptz not null default now(),
  primary key (budget_id, user_id)
);

create index budget_members_user_id_idx on public.budget_members (user_id);

-- ── categories ────────────────────────────────────────────────
-- Taxonomía global y compartida (igual que en el mock: no pertenece a un
-- presupuesto concreto). id como slug legible, no UUID.

create table public.categories (
  id text primary key,
  nombre text not null,
  tipo text not null
    check (tipo in ('ingreso', 'gasto')),
  emoji text not null
);

-- ── category_limits ───────────────────────────────────────────
-- Límite mensual de una categoría, definido por presupuesto.

create table public.category_limits (
  budget_id uuid not null references public.budgets (id) on delete cascade,
  category_id text not null references public.categories (id) on delete cascade,
  limite_mensual numeric(12, 2) not null,
  primary key (budget_id, category_id)
);

-- ── recurrents ────────────────────────────────────────────────

create table public.recurrents (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  tipo text not null
    check (tipo in ('ingreso', 'gasto')),
  nombre text not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  category_id text not null references public.categories (id),
  frecuencia text not null
    check (frecuencia in ('semanal', 'quincenal', 'mensual', 'anual')),
  proxima_fecha date not null,
  estado text not null default 'activo'
    check (estado in ('activo', 'pausado', 'finalizado')),
  fecha_inicio date not null,
  fecha_fin date,
  user_id uuid not null references public.profiles (id),
  metodo_pago text
    check (metodo_pago in ('tarjeta', 'efectivo', 'transferencia', 'domiciliacion')),
  created_at timestamptz not null default now()
);

create index recurrents_budget_id_idx on public.recurrents (budget_id, estado);

-- ── movements ─────────────────────────────────────────────────

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  tipo text not null
    check (tipo in ('ingreso', 'gasto')),
  concepto text not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  category_id text not null references public.categories (id),
  fecha date not null,
  user_id uuid not null references public.profiles (id),
  metodo_pago text
    check (metodo_pago in ('tarjeta', 'efectivo', 'transferencia', 'domiciliacion')),
  nota text,
  recurrent_id uuid references public.recurrents (id) on delete set null,
  created_at timestamptz not null default now()
);

create index movements_budget_id_fecha_idx on public.movements (budget_id, fecha desc);

-- ── activity ──────────────────────────────────────────────────
-- Solo eventos que NO son movimientos (esos se derivan de `movements`
-- en el servicio, igual que hace hoy recentActivity() en lib/data.ts).

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  tipo text not null
    check (tipo in ('miembro', 'limite', 'recurrente')),
  texto text not null,
  fecha timestamptz not null default now()
);

create index activity_budget_id_fecha_idx on public.activity (budget_id, fecha desc);

-- ── Trigger: crear el perfil al registrarse ──────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1));
  palette text[] := array['#1c5e41', '#7c4a9c', '#1f5f8b', '#a6720d', '#5a6b5f', '#a23b45'];
begin
  insert into public.profiles (id, nombre, email, iniciales, color)
  values (
    new.id,
    full_name,
    new.email,
    upper(left(full_name, 1) || coalesce(left(split_part(full_name, ' ', 2), 1), '')),
    palette[1 + (abs(hashtext(new.id::text)) % array_length(palette, 1))]
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS: funciones auxiliares ─────────────────────────────────
-- security definer: evita que la política de budget_members entre en
-- recursión infinita al consultarse a sí misma.

create or replace function public.is_budget_member(target_budget_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.budget_members
    where budget_id = target_budget_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_budget(target_budget_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.budget_members
    where budget_id = target_budget_id
      and user_id = auth.uid()
      and rol in ('administrador', 'editor')
      and estado = 'activo'
  );
$$;

create or replace function public.is_budget_admin(target_budget_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.budget_members
    where budget_id = target_budget_id
      and user_id = auth.uid()
      and rol = 'administrador'
      and estado = 'activo'
  );
$$;

-- ── RLS: activar en todas las tablas ──────────────────────────

alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_members enable row level security;
alter table public.categories enable row level security;
alter table public.category_limits enable row level security;
alter table public.recurrents enable row level security;
alter table public.movements enable row level security;
alter table public.activity enable row level security;

-- profiles: cualquiera autenticado puede ver perfiles (para mostrar
-- nombre/avatar de otros miembros); solo el propio usuario edita el suyo.
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- budgets: ver y editar solo si eres miembro; crear, cualquier usuario
-- autenticado (el servicio añade la membresía de administrador a la vez).
create policy "budgets_select_member" on public.budgets
  for select to authenticated using (public.is_budget_member(id));

create policy "budgets_insert_authenticated" on public.budgets
  for insert to authenticated with check (true);

create policy "budgets_update_admin" on public.budgets
  for update to authenticated using (public.is_budget_admin(id));

-- budget_members: ver si eres miembro del presupuesto; gestionar (invitar,
-- cambiar rol, eliminar acceso) solo administradores; salir del
-- presupuesto por cuenta propia sí está permitido.
create policy "budget_members_select_member" on public.budget_members
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "budget_members_insert_admin" on public.budget_members
  for insert to authenticated with check (public.is_budget_admin(budget_id));

create policy "budget_members_update_admin" on public.budget_members
  for update to authenticated using (public.is_budget_admin(budget_id));

create policy "budget_members_delete_admin_or_self" on public.budget_members
  for delete to authenticated
  using (public.is_budget_admin(budget_id) or user_id = auth.uid());

-- categories: taxonomía global, lectura y escritura para cualquier
-- autenticado (igual que en el mock, sin distinción por presupuesto).
create policy "categories_select_authenticated" on public.categories
  for select to authenticated using (true);

create policy "categories_write_authenticated" on public.categories
  for all to authenticated using (true) with check (true);

-- category_limits: ver si eres miembro; escribir si puedes editar el
-- presupuesto (administrador o editor).
create policy "category_limits_select_member" on public.category_limits
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "category_limits_write_editor" on public.category_limits
  for all to authenticated
  using (public.can_edit_budget(budget_id))
  with check (public.can_edit_budget(budget_id));

-- recurrents: ver si eres miembro; escribir si puedes editar el presupuesto.
create policy "recurrents_select_member" on public.recurrents
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "recurrents_write_editor" on public.recurrents
  for all to authenticated
  using (public.can_edit_budget(budget_id))
  with check (public.can_edit_budget(budget_id));

-- movements: ver si eres miembro; escribir si puedes editar el presupuesto.
create policy "movements_select_member" on public.movements
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "movements_write_editor" on public.movements
  for all to authenticated
  using (public.can_edit_budget(budget_id))
  with check (public.can_edit_budget(budget_id));

-- activity: ver si eres miembro; el servicio inserta en nombre de
-- cualquier miembro que dispare el evento.
create policy "activity_select_member" on public.activity
  for select to authenticated using (public.is_budget_member(budget_id));

create policy "activity_insert_member" on public.activity
  for insert to authenticated with check (public.is_budget_member(budget_id));
