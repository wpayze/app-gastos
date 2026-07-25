import { Card, Skeleton } from "@/components/ui/primitives";

export default function MovementDetailLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton className="h-5 w-32" />
      <Card className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    </div>
  );
}
