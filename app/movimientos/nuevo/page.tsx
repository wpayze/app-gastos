import { getMovementById } from "@/lib/services/movements.service";
import { listCategories } from "@/lib/services/categories.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { todayISO } from "@/lib/calendar";
import { NewMovementForm } from "@/components/movements/new-movement-form";
import type { MovementType } from "@/lib/types";

export const metadata = { title: "Nuevo movimiento" };

export default async function NewMovementPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; editar?: string; duplicar?: string }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;

  const editId = sp.editar;
  const baseId = editId ?? sp.duplicar;

  const [categories, profiles, base] = await Promise.all([
    listCategories(),
    listProfiles(),
    baseId ? getMovementById(baseId) : Promise.resolve(null),
  ]);

  const editing = Boolean(editId && base);
  const initialTipo: MovementType =
    base?.tipo ?? (sp.tipo === "ingreso" ? "ingreso" : "gasto");

  return (
    <NewMovementForm
      budgetId={activeBudgetId}
      categories={categories}
      profiles={profiles}
      base={base}
      editing={editing}
      initialTipo={initialTipo}
      today={todayISO()}
    />
  );
}
