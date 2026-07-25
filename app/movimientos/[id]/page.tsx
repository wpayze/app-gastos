import { getMovementById } from "@/lib/services/movements.service";
import { getCategoryById } from "@/lib/services/categories.service";
import { getBudgetById } from "@/lib/services/budgets.service";
import { getProfileById } from "@/lib/services/profiles.service";
import { getRecurrentById } from "@/lib/services/recurrents.service";
import { MovementDetail } from "@/components/movements/movement-detail";

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movement = await getMovementById(id);

  if (!movement) {
    return <MovementDetail movement={null} />;
  }

  const [category, budget, user, recurrent] = await Promise.all([
    getCategoryById(movement.categoriaId),
    getBudgetById(movement.budgetId),
    getProfileById(movement.userId),
    movement.recurrentId
      ? getRecurrentById(movement.recurrentId)
      : Promise.resolve(null),
  ]);

  return (
    <MovementDetail
      movement={movement}
      category={category}
      budget={budget}
      user={user}
      recurrent={recurrent}
    />
  );
}
