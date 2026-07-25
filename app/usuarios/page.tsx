import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { listProfiles } from "@/lib/services/profiles.service";
import { movementCountByUser } from "@/lib/services/movements.service";
import { todayISO } from "@/lib/calendar";
import { UsersView } from "@/components/users/users-view";

export default async function UsersPage() {
  const { activeBudgetId, budgets } = await getActiveBudgetContext();
  const budget = budgets.find((b) => b.id === activeBudgetId);

  const [profiles, counts] = await Promise.all([
    listProfiles(),
    movementCountByUser(activeBudgetId),
  ]);

  return (
    <UsersView
      key={activeBudgetId}
      budgetId={activeBudgetId}
      initialMembers={budget?.miembros ?? []}
      profiles={profiles}
      counts={counts}
      today={todayISO()}
    />
  );
}
