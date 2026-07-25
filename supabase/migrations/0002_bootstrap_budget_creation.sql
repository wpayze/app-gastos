-- Arregla un problema de "huevo y gallina" en RLS: crear un presupuesto
-- necesita insertar en budgets y luego en budget_members, pero la política
-- de budget_members exige ya ser administrador de ese presupuesto — algo
-- imposible para la primera fila de membresía, que es la que justamente
-- lo crea.
--
-- Solución: envolver ambos inserts en una función security definer, que
-- corre con privilegios que saltan RLS para esta operación controlada.
-- De paso, hace los dos inserts atómicos (antes eran dos llamadas
-- separadas desde el cliente).

create or replace function public.create_budget_with_owner(
  p_nombre text,
  p_descripcion text default '',
  p_emoji text default '💰',
  p_limite_mensual numeric default null
)
returns public.budgets
language plpgsql
security definer
set search_path = public
as $$
declare
  new_budget public.budgets;
begin
  insert into public.budgets (nombre, descripcion, emoji, limite_mensual)
  values (p_nombre, p_descripcion, p_emoji, p_limite_mensual)
  returning * into new_budget;

  insert into public.budget_members (budget_id, user_id, rol, estado)
  values (new_budget.id, auth.uid(), 'administrador', 'activo');

  return new_budget;
end;
$$;
