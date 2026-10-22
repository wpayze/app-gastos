import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { movementsByBudget } from "@/lib/services/movements.service";
import { listCategories } from "@/lib/services/categories.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { MovementsView } from "@/components/movements/movements-view";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    mes?: string;
    tipo?: string;
  }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;
  const mes = sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : undefined;
  let initialDesde: string | undefined;
  let initialHasta: string | undefined;
  if (mes) {
    const [y, m] = mes.split("-").map(Number);
    initialDesde = `${mes}-01`;
    initialHasta = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  }
  const [movements, categories, profiles] = await Promise.all([
    movementsByBudget(activeBudgetId),
    listCategories(),
    listProfiles(),
  ]);

  return (
    <MovementsView
      key={`${activeBudgetId}-${sp.categoria ?? ""}-${sp.orden ?? ""}-${mes ?? ""}-${sp.tipo ?? ""}`}
      movements={movements}
      categories={categories}
      profiles={profiles}
      initialCategoria={sp.categoria}
      initialSort={sp.orden}
      initialType={sp.tipo}
      initialDesde={initialDesde}
      initialHasta={initialHasta}
    />
  );
}
