import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function PendingLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-9 w-full rounded-full" />
      <Card>
        <SkeletonRows rows={5} />
      </Card>
    </div>
  );
}
