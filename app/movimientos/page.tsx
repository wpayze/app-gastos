import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { movementsByBudget } from "@/lib/services/movements.service";
import { listCategories } from "@/lib/services/categories.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { MovementsView } from "@/components/movements/movements-view";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; orden?: string }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;
  const [movements, categories, profiles] = await Promise.all([
    movementsByBudget(activeBudgetId),
    listCategories(),
    listProfiles(),
  ]);

  return (
    <MovementsView
      key={`${activeBudgetId}-${sp.categoria ?? ""}-${sp.orden ?? ""}`}
      movements={movements}
      categories={categories}
      profiles={profiles}
      initialCategoria={sp.categoria}
      initialSort={sp.orden}
    />
  );
}
