import { MovementDetail } from "@/components/movements/movement-detail";

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovementDetail id={id} />;
}
