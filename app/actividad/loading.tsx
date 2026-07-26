import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function ActivityLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Card>
        <SkeletonRows rows={8} />
      </Card>
    </div>
  );
}
