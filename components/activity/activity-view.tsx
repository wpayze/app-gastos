"use client";

import Link from "next/link";
import { useActiveBudget } from "@/lib/store";
import { relativeDay } from "@/lib/format";
import type { ActivityItem, User } from "@/lib/types";
import { Avatar, Badge, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

const FALLBACK_USER: User = {
  id: "",
  nombre: "Alguien",
  email: "",
  iniciales: "?",
  color: "#8b988e",
};

function findProfile(profiles: User[], id: string): User {
  return profiles.find((u) => u.id === id) ?? { ...FALLBACK_USER, id };
}

const KIND_LABEL: Record<ActivityItem["tipo"], string> = {
  movimiento: "Movimientos",
  miembro: "Miembros",
  limite: "Límites",
  recurrente: "Recurrentes",
};

export function ActivityView({
  items,
  total,
  page,
  pageSize,
  profiles,
  today,
}: {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  profiles: User[];
  today: string;
}) {
  const { activeBudget } = useActiveBudget();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actividad</h1>
        <p className="text-sm text-ink-soft">
          Todo lo que ha pasado en {activeBudget.nombre} · {total}{" "}
          {total === 1 ? "evento" : "eventos"}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Todavía no hay actividad"
          description="En cuanto se registren movimientos o cambios en el presupuesto, aparecerán aquí."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line-soft">
            {items.map((a) => {
              const u = findProfile(profiles, a.userId);
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar iniciales={u.iniciales} color={u.color} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <strong>{u.nombre.split(" ")[0]}</strong> {a.texto}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {relativeDay(a.fecha, today)}
                    </p>
                  </div>
                  {a.tipo !== "movimiento" && (
                    <Badge variant="outline">{KIND_LABEL[a.tipo]}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={page > 1 ? `/actividad?pagina=${page - 1}` : "#"}
            aria-disabled={page <= 1}
            className={
              page <= 1
                ? "btn-secondary pointer-events-none opacity-50"
                : "btn-secondary"
            }
          >
            <Icon name="chevronLeft" size={16} />
            Anterior
          </Link>
          <p className="text-sm text-ink-soft">
            Página {page} de {totalPages}
          </p>
          <Link
            href={page < totalPages ? `/actividad?pagina=${page + 1}` : "#"}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages
                ? "btn-secondary pointer-events-none opacity-50"
                : "btn-secondary"
            }
          >
            Siguiente
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
