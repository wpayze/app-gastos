"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { formatDate, relativeDay } from "@/lib/format";
import { MEMBER_STATUS_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { BudgetMember, BudgetRole, User } from "@/lib/types";
import {
  addMemberByEmailAction,
  removeMemberAction,
  setMemberEstadoAction,
  updateMemberRoleAction,
  type AddMemberState,
} from "@/app/usuarios/actions";
import {
  Avatar,
  Badge,
  Card,
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

const FALLBACK_USER: User = {
  id: "",
  nombre: "Usuario desconocido",
  email: "",
  iniciales: "?",
  color: "#8b988e",
};

function findProfile(profiles: User[], id: string): User {
  return profiles.find((u) => u.id === id) ?? { ...FALLBACK_USER, id };
}

const addMemberInitialState: AddMemberState = {};

function AddMemberForm({
  budgetId,
  existingMemberIds,
  onSuccess,
}: {
  budgetId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}) {
  const boundAction = addMemberByEmailAction.bind(
    null,
    budgetId,
    existingMemberIds,
  );
  const [state, action, pending] = useActionState(
    boundAction,
    addMemberInitialState,
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      <Field label="Correo electrónico" error={state?.error}>
        <Input
          type="email"
          name="email"
          placeholder="nombre@correo.com"
          invalid={Boolean(state?.error)}
          required
          autoFocus
        />
      </Field>
      <Field label="Rol">
        <Select name="rol" defaultValue="editor">
          {(Object.keys(ROLE_LABEL) as BudgetRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </Field>
      <ul className="space-y-1 rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft">
        <li>
          <strong>Administrador</strong>: gestiona miembros, límites y todo lo
          demás.
        </li>
        <li>
          <strong>Editor</strong>: crea y edita movimientos.
        </li>
        <li>
          <strong>Solo lectura</strong>: consulta sin modificar.
        </li>
      </ul>
      <p className="text-xs text-ink-faint">
        Solo se puede añadir a alguien que ya tenga cuenta en Centavo.
      </p>
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <Icon name="check" size={16} />
          {pending ? "Buscando…" : "Añadir miembro"}
        </button>
      </div>
    </form>
  );
}

export function UsersView({
  budgetId,
  initialMembers,
  profiles,
  counts,
  today,
}: {
  budgetId: string;
  initialMembers: BudgetMember[];
  profiles: User[];
  counts: Record<string, number>;
  today: string;
}) {
  const { activeBudget, currentUserId } = useActiveBudget();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [members, setMembers] = useState<BudgetMember[]>(initialMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [roleFor, setRoleFor] = useState<BudgetMember | undefined>();
  const [removing, setRemoving] = useState<BudgetMember | undefined>();

  const soloMember = members.length === 1;

  const handleRoleChange = (member: BudgetMember, rol: BudgetRole) => {
    setMembers((l) =>
      l.map((m) => (m.userId === member.userId ? { ...m, rol } : m)),
    );
    const u = findProfile(profiles, member.userId);
    toast(`${u.nombre} ahora es ${ROLE_LABEL[rol].toLowerCase()}`);
    setRoleFor(undefined);
    startTransition(async () => {
      try {
        await updateMemberRoleAction(budgetId, member.userId, rol);
      } catch {
        toast("No se pudo cambiar el rol. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleRestore = (member: BudgetMember) => {
    setMembers((l) =>
      l.map((m) =>
        m.userId === member.userId ? { ...m, estado: "activo" } : m,
      ),
    );
    const u = findProfile(profiles, member.userId);
    toast(`Acceso de ${u.nombre} restaurado`);
    startTransition(async () => {
      try {
        await setMemberEstadoAction(budgetId, member.userId, "activo");
      } catch {
        toast("No se pudo restaurar el acceso.", "danger");
      }
    });
  };

  const handleRemove = (member: BudgetMember) => {
    setMembers((l) => l.filter((m) => m.userId !== member.userId));
    const u = findProfile(profiles, member.userId);
    toast(`${u.nombre} ya no tiene acceso`, "danger");
    startTransition(async () => {
      try {
        await removeMemberAction(budgetId, member.userId);
      } catch {
        toast("No se pudo eliminar el acceso.", "danger");
      }
    });
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
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Icon name="mail" size={16} />
          Añadir miembro
        </button>
      </div>

      <Card>
        <ul className="divide-y divide-line-soft">
          {members.map((member) => {
            const u = findProfile(profiles, member.userId);
            const isMe = member.userId === currentUserId;
            const items: MenuItem[] = [
              {
                label: "Cambiar rol",
                icon: "users",
                onClick: () => setRoleFor(member),
              },
            ];
            if (member.estado === "suspendido") {
              items.push({
                label: "Restaurar acceso",
                icon: "play",
                onClick: () => handleRestore(member),
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
                    <Badge variant="outline">{ROLE_LABEL[member.rol]}</Badge>
                  </div>
                  <p className="truncate text-xs text-ink-faint">{u.email}</p>
                  <p className="text-xs text-ink-faint">
                    Desde {formatDate(member.fechaIncorporacion)} · Última
                    actividad: {relativeDay(member.ultimaActividad, today)} ·{" "}
                    {counts[member.userId] ?? 0} movimientos
                  </p>
                </div>
                <Menu label={`Opciones de ${u.nombre}`} items={items} />
              </li>
            );
          })}
        </ul>
      </Card>

      {soloMember && (
        <EmptyState
          icon="users"
          title="Todavía nadie más en este presupuesto"
          description="Añade a las personas con las que compartes gastos: verán los mismos datos y podrán registrar movimientos según su rol."
          action={
            <button onClick={() => setAddOpen(true)} className="btn-primary">
              <Icon name="mail" size={16} />
              Añadir a alguien
            </button>
          }
        />
      )}

      {/* Añadir miembro */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Añadir miembro a ${activeBudget.nombre}`}
      >
        <AddMemberForm
          budgetId={budgetId}
          existingMemberIds={members.map((m) => m.userId)}
          onSuccess={() => setAddOpen(false)}
        />
      </Sheet>

      {/* Cambiar rol */}
      <Sheet
        open={Boolean(roleFor)}
        onClose={() => setRoleFor(undefined)}
        title={
          roleFor
            ? `Rol de ${findProfile(profiles, roleFor.userId).nombre}`
            : "Cambiar rol"
        }
      >
        <div className="space-y-2">
          {(Object.keys(ROLE_LABEL) as BudgetRole[]).map((r) => (
            <button
              key={r}
              onClick={() => roleFor && handleRoleChange(roleFor, r)}
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
        onConfirm={() => removing && handleRemove(removing)}
        title="Eliminar acceso"
        description={
          <>
            <strong>
              {removing ? findProfile(profiles, removing.userId).nombre : ""}
            </strong>{" "}
            dejará de ver {activeBudget.nombre}. Sus movimientos ya creados se
            conservarán.
          </>
        }
      />
    </div>
  );
}
