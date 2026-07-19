import { Suspense } from "react";
import { NewMovementForm } from "@/components/movements/new-movement-form";
import { Card, Skeleton } from "@/components/ui/primitives";

export const metadata = { title: "Nuevo movimiento" };

export default function NewMovementPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto max-w-xl space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </Card>
      }
    >
      <NewMovementForm />
    </Suspense>
  );
}
