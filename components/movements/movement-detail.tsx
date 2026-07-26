"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteMovementAction } from "@/app/movimientos/actions";
import { formatDateLong, formatForeignMoney, formatMoney, formatRate } from "@/lib/format";
import { PAYMENT_LABEL, FREQUENCY_LABEL, CURRENCY_LABEL } from "@/lib/labels";
import { useToast } from "@/lib/store";
import type { Budget, Category, Movement, Recurrent, User } from "@/lib/types";
import {
  Amount,
  Avatar,
  Badge,
  Card,
  cx,
} from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { ErrorState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

export function MovementDetail({
  movement,
  category,
  budget,
  user,
  recurrent,
}: {
  movement: Movement | null;
  category?: Category | null;
  budget?: Budget | null;
  user?: User | null;
  recurrent?: Recurrent | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!movement) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Movimiento no encontrado"
          description="Puede que haya sido eliminado o que el enlace no sea correcto."
          action={
            <Link href="/movimientos" className="btn-secondary">
              <Icon name="chevronLeft" size={16} />
              Volver a movimientos
            </Link>
          }
        />
      </div>
    );
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMovementAction(movement.id);
        toast(`Movimiento «${movement.concepto}» eliminado`, "danger");
        router.push("/movimientos");
      } catch {
        toast("No se pudo eliminar. Intenta de nuevo.", "danger");
      }
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/movimientos"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <Icon name="chevronLeft" size={16} />
        Movimientos
      </Link>

      <Card className="overflow-hidden">
        <div
          className={cx(
            "px-6 pb-5 pt-6",
            movement.tipo === "ingreso" ? "bg-pine-tint" : "bg-expense-tint",
          )}
        >
          <div className="flex items-center gap-2">
            <Badge variant={movement.tipo === "ingreso" ? "green" : "red"}>
              {movement.tipo === "ingreso" ? "Ingreso" : "Gasto"}
            </Badge>
            {recurrent && (
              <Badge variant="outline">
                <Icon name="repeat" size={12} />
                Recurrente {FREQUENCY_LABEL[recurrent.frecuencia].toLowerCase()}
              </Badge>
            )}
          </div>
          <p className="mt-3">
            <Amount
              value={movement.cantidad}
              tipo={movement.tipo}
              signed
              className="text-4xl font-semibold"
            />
          </p>
          {movement.monedaOriginal && movement.cantidadOriginal !== undefined && (
            <p className="text-sm text-ink-soft">
              Introducido como{" "}
              {formatForeignMoney(movement.cantidadOriginal, movement.monedaOriginal)}
            </p>
          )}
          <h1 className="mt-1 text-lg font-semibold">{movement.concepto}</h1>
          <p className="text-sm capitalize text-ink-soft">
            {formatDateLong(movement.fecha)}
          </p>
        </div>

        <dl className="divide-y divide-line-soft px-6 py-2">
          {category && (
            <DetailRow label="Categoría">
              <span className="inline-flex items-center gap-1.5">
                {category.emoji} {category.nombre}
              </span>
            </DetailRow>
          )}
          {budget && (
            <DetailRow label="Presupuesto">
              <span className="inline-flex items-center gap-1.5">
                {budget.emoji} {budget.nombre}
              </span>
            </DetailRow>
          )}
          {user && (
            <DetailRow label="Creado por">
              <span className="inline-flex items-center gap-2">
                <Avatar iniciales={user.iniciales} color={user.color} size={22} />
                {user.nombre}
              </span>
            </DetailRow>
          )}
          {movement.metodoPago && (
            <DetailRow label="Método de pago">
              {PAYMENT_LABEL[movement.metodoPago]}
            </DetailRow>
          )}
          {movement.monedaOriginal && movement.tasaCambio !== undefined && (
            <DetailRow label="Tasa de cambio">
              1 {movement.monedaOriginal} = {formatRate(movement.tasaCambio)}
              <span className="ml-1 text-xs text-ink-faint">
                ({CURRENCY_LABEL[movement.monedaOriginal]})
              </span>
            </DetailRow>
          )}
          {recurrent && (
            <DetailRow label="Generado por">
              <Link href="/recurrentes" className="text-pine hover:underline">
                {recurrent.nombre}
              </Link>
            </DetailRow>
          )}
          {movement.nota && (
            <div className="py-2.5">
              <dt className="text-sm text-ink-soft">Nota</dt>
              <dd className="mt-1 rounded-lg bg-paper px-3 py-2 text-sm">
                {movement.nota}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => router.push(`/movimientos/nuevo?editar=${movement.id}`)}
          className="btn-secondary"
        >
          <Icon name="pencil" size={15} />
          Editar
        </button>
        <button
          onClick={() => router.push(`/movimientos/nuevo?duplicar=${movement.id}`)}
          className="btn-secondary"
        >
          <Icon name="copy" size={15} />
          Duplicar
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="btn-secondary !text-expense disabled:opacity-60"
        >
          <Icon name="trash" size={15} />
          Eliminar
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar movimiento"
        description={
          <>
            Se eliminará <strong>{movement.concepto}</strong> (
            {formatMoney(movement.cantidad)})
            {budget ? ` del presupuesto ${budget.nombre}` : ""}. Esta acción
            no se puede deshacer.
          </>
        }
      />
    </div>
  );
}
