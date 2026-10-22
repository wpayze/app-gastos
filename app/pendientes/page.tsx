import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { pendingMovementsByBudget } from "@/lib/services/pending-movements.service";
import { listCategories } from "@/lib/services/categories.service";
import { PendingView } from "@/components/pending/pending-view";

export default async function PendingPage() {
  const { activeBudgetId } = await getActiveBudgetContext();
  const [pending, categories] = await Promise.all([
    pendingMovementsByBudget(activeBudgetId),
    listCategories(),
  ]);

  return (
    <PendingView key={activeBudgetId} initialPending={pending} categories={categories} />
  );
}
