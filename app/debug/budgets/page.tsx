// Página temporal para verificar lib/services/budgets.service.ts contra
// Supabase real, ya como usuario autenticado. Se elimina en el paso 8,
// cuando app/presupuestos/page.tsx se conecte de verdad a este servicio.

import { listBudgets } from "@/lib/services/budgets.service";
import { requireUser } from "@/lib/auth/get-current-user";

export default async function DebugBudgetsPage() {
  const user = await requireUser();
  const budgets = await listBudgets();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Prueba: servicio de presupuestos</h1>
        <p className="text-sm text-ink-soft">
          Sesión: {user.nombre} ({user.email})
        </p>
      </div>

      {budgets.length === 0 ? (
        <p className="rounded-lg border border-line p-4 text-sm text-ink-soft">
          Tu usuario no es miembro de ningún presupuesto todavía. Crea uno a
          mano en Table Editor (budgets + budget_members con tu user_id y rol
          &quot;administrador&quot;) para ver algo aquí.
        </p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => (
            <li key={b.id} className="rounded-lg border border-line p-4">
              <p className="font-semibold">
                {b.emoji} {b.nombre}
              </p>
              <p className="text-sm text-ink-soft">{b.descripcion}</p>
              <p className="mt-1 text-xs text-ink-faint">
                estado: {b.estado} · miembros: {b.miembros.length}
                {b.limiteMensual !== undefined &&
                  ` · límite: ${b.limiteMensual}`}
              </p>
              <ul className="mt-2 space-y-0.5 text-xs text-ink-faint">
                {b.miembros.map((m) => (
                  <li key={m.userId}>
                    {m.userId} — {m.rol} ({m.estado})
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
