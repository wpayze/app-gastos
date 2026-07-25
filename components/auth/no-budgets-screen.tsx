import { signOut } from "@/lib/auth/actions";
import { Card } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { CreateFirstBudgetForm } from "./create-first-budget-form";
import type { User } from "@/lib/types";

/** Se muestra cuando el usuario está logueado pero no es miembro de ningún presupuesto. */
export function NoBudgetsScreen({ user }: { user: User }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 p-7 text-center">
        <span className="rounded-full bg-pine-tint p-3 text-pine">
          <Icon name="wallet" size={24} />
        </span>
        <div>
          <h1 className="text-lg font-bold">Crea tu primer presupuesto</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {user.nombre}, todavía no perteneces a ninguno. Puedes crear el
            tuyo ahora, o pedirle a quien administra Centavo que te añada a
            uno existente.
          </p>
        </div>

        <CreateFirstBudgetForm />

        <form action={signOut}>
          <button
            type="submit"
            className="text-xs font-medium text-ink-faint hover:text-expense"
          >
            Cerrar sesión
          </button>
        </form>
      </Card>
    </div>
  );
}
