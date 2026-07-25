"use client";

import { useState } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import { movementCountByUser } from "@/lib/data";
import { getUser } from "@/lib/mock/users";
import { TODAY } from "@/lib/mock/calendar";
import { formatDate, relativeDay } from "@/lib/format";
import { MEMBER_STATUS_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { BudgetMember, BudgetRole } from "@/lib/types";
import {
  Avatar,
  Badge,
  Card,
  SkeletonRows,
  type BadgeVariant,
} from "@/components/ui/primitives";
import { ConfirmDialog, Menu, Sheet, type MenuItem } from "@/components/ui/overlays";
import { Field, Input, Select } from "@/components/ui/forms";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

const STATUS_BADGE: Record<BudgetMember["estado"], BadgeVariant> = {
  activo: "green",
  pendiente: "amber",
  suspendido: "red",
};

export default function UsersPage() {
  const { activeBudgetId } = useActiveBudget();
  // La key reinicia la lista local de miembros al cambiar de presupuesto
  return <Users key={activeBudgetId} />;
}

function Users() {
  const { activeBudget, activeBudgetId, currentUserId } = useActiveBudget();
  const { toast } = useToast();
  const loading = useMockLoading(activeBudgetId);

  const [members, setMembers] = useState<BudgetMember[]>(
    () => activeBudget.miembros,
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRol, setInviteRol] = useState<BudgetRole>("editor");
  const [inviteError, setInviteError] = useState("");
  const [roleFor, setRoleFor] = useState<BudgetMember | undefined>();
  const [removing, setRemoving] = useState<BudgetMember | undefined>();

  const counts = movementCountByUser(activeBudgetId);
  const soloMember = members.length === 1;

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(inviteEmail)) {
      setInviteError("Introduce un correo válido.");
      return;
    }
    setInviteOpen(false);
    setInviteEmail("");
    setInviteError("");
    toast(`Invitación enviada a ${inviteEmail}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-ink-soft">
            Miembros de {activeBudget.emoji} {activeBudget.nombre}
          </p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary">
          <Icon name="mail" size={16} />
          Invitar usuario
        </button>
      </div>

      {loading ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-line-soft">
              {members.map((member) => {
                const u = getUser(member.userId);
                const isMe = member.userId === currentUserId;
                const items: MenuItem[] = [];
                if (member.estado === "pendiente") {
                  items.push(
                    {
                      label: "Reenviar invitación",
                      icon: "mail",
                      onClick: () =>
                        toast(`Invitación reenviada a ${u.email}`),
                    },
                    {
                      label: "Cancelar invitación",
                      icon: "x",
                      danger: true,
                      onClick: () => {
                        setMembers((l) =>
                          l.filter((m) => m.userId !== member.userId),
                        );
                        toast(`Invitación a ${u.nombre} cancelada`, "info");
                      },
                    },
                  );
                } else {
                  items.push({
                    label: "Cambiar rol",
                    icon: "users",
                    onClick: () => setRoleFor(member),
                  });
                  if (member.estado === "suspendido") {
                    items.push({
                      label: "Restaurar acceso",
                      icon: "play",
                      onClick: () => {
                        setMembers((l) =>
                          l.map((m) =>
                            m.userId === member.userId
                              ? { ...m, estado: "activo" }
                              : m,
                          ),
                        );
                        toast(`Acceso de ${u.nombre} restaurado`);
                      },
                    });
                  }
                  if (!isMe) {
                    items.push({
                      label: "Eliminar acceso",
                      icon: "trash",
                      danger: true,
                      onClick: () => setRemoving(member),
                    });
                  }
                }

                return (
                  <li
                    key={member.userId}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <Avatar iniciales={u.iniciales} color={u.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-semibold">
                          {u.nombre}
                          {isMe && (
                            <span className="ml-1 text-xs font-normal text-ink-faint">
                              (tú)
                            </span>
                          )}
                        </span>
                        <Badge variant={STATUS_BADGE[member.estado]}>
                          {MEMBER_STATUS_LABEL[member.estado]}
                        </Badge>
                        <Badge variant="outline">
                          {ROLE_LABEL[member.rol]}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-ink-faint">
                        {u.email}
                      </p>
                      <p className="text-xs text-ink-faint">
                        Desde {formatDate(member.fechaIncorporacion)} · Última
                        actividad: {relativeDay(member.ultimaActividad, TODAY)} ·{" "}
                        {counts[member.userId] ?? 0} movimientos
                      </p>
                    </div>
                    {items.length > 0 && (
                      <Menu label={`Opciones de ${u.nombre}`} items={items} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {soloMember && (
            <EmptyState
              icon="users"
              title="Todavía nadie más en este presupuesto"
              description="Invita a las personas con las que compartes gastos: verán los mismos datos y podrán registrar movimientos según su rol."
              action={
                <button
                  onClick={() => setInviteOpen(true)}
                  className="btn-primary"
                >
                  <Icon name="mail" size={16} />
                  Invitar a alguien
                </button>
              }
            />
          )}
        </>
      )}

      {/* Invitar */}
      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={`Invitar a ${activeBudget.nombre}`}
      >
        <form onSubmit={sendInvite} className="space-y-4">
          <Field label="Correo electrónico" error={inviteError}>
            <Input
              type="email"
              placeholder="nombre@correo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              invalid={Boolean(inviteError)}
            />
          </Field>
          <Field label="Rol">
            <Select
              value={inviteRol}
              onChange={(e) => setInviteRol(e.target.value as BudgetRole)}
            >
              {(Object.keys(ROLE_LABEL) as BudgetRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <ul className="space-y-1 rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft">
            <li>
              <strong>Administrador</strong>: gestiona miembros, límites y todo
              lo demás.
            </li>
            <li>
              <strong>Editor</strong>: crea y edita movimientos.
            </li>
            <li>
              <strong>Solo lectura</strong>: consulta sin modificar.
            </li>
          </ul>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              <Icon name="mail" size={16} />
              Enviar invitación
            </button>
          </div>
        </form>
      </Sheet>

      {/* Cambiar rol */}
      <Sheet
        open={Boolean(roleFor)}
        onClose={() => setRoleFor(undefined)}
        title={
          roleFor ? `Rol de ${getUser(roleFor.userId).nombre}` : "Cambiar rol"
        }
      >
        <div className="space-y-2">
          {(Object.keys(ROLE_LABEL) as BudgetRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                if (!roleFor) return;
                setMembers((l) =>
                  l.map((m) =>
                    m.userId === roleFor.userId ? { ...m, rol: r } : m,
                  ),
                );
                toast(
                  `${getUser(roleFor.userId).nombre} ahora es ${ROLE_LABEL[r].toLowerCase()}`,
                );
                setRoleFor(undefined);
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                roleFor?.rol === r
                  ? "border-pine bg-pine-tint"
                  : "border-line hover:bg-line-soft"
              }`}
            >
              {ROLE_LABEL[r]}
              {roleFor?.rol === r && (
                <Icon name="check" size={16} className="text-pine" />
              )}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Eliminar acceso */}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(undefined)}
        onConfirm={() => {
          if (!removing) return;
          setMembers((l) => l.filter((m) => m.userId !== removing.userId));
          toast(
            `${getUser(removing.userId).nombre} ya no tiene acceso`,
            "danger",
          );
        }}
        title="Eliminar acceso"
        description={
          <>
            <strong>{removing ? getUser(removing.userId).nombre : ""}</strong>{" "}
            dejará de ver {activeBudget.nombre}. Sus movimientos ya creados se
            conservarán.
          </>
        }
      />
    </div>
  );
}
