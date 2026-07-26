-- Vista que une `movements` (actividad derivada) y `activity` (guardada)
-- en un único orden cronológico, para poder paginar en SQL (order + range)
-- en vez de traer toda la tabla y paginar en memoria de la app.
--
-- `security_invoker = true` es imprescindible: sin esto, una vista se
-- ejecuta con los permisos de quien la creó (el dueño), saltándose las
-- RLS de `movements`/`activity` para quien la consulte. Con esto, las
-- policies de las tablas subyacentes se evalúan con el usuario real.

create view public.budget_activity
  with (security_invoker = true) as
select
  'a-' || m.id as id,
  m.budget_id,
  'movimiento'::text as tipo,
  m.created_at as fecha,
  m.user_id,
  null::text as texto,
  m.concepto,
  m.cantidad,
  m.tipo as movimiento_tipo
from public.movements m
union all
select
  a.id::text as id,
  a.budget_id,
  a.tipo,
  a.fecha,
  a.user_id,
  a.texto,
  null::text as concepto,
  null::numeric as cantidad,
  null::text as movimiento_tipo
from public.activity a;
