"use client";

import { useActionState } from "react";
import {
  createFirstBudget,
  type CreateFirstBudgetState,
} from "@/lib/session/actions";
import { Field, Input } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";

const initialState: CreateFirstBudgetState = {};

export function CreateFirstBudgetForm() {
  const [state, action, pending] = useActionState(
    createFirstBudget,
    initialState,
  );

  return (
    <form action={action} className="w-full space-y-3 text-left">
      <Field label="Nombre del presupuesto">
        <Input
          name="nombre"
          placeholder="P. ej. Personal"
          required
          autoFocus
        />
      </Field>
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-expense-tint px-3 py-2 text-sm font-medium text-expense"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full disabled:opacity-60"
      >
        <Icon name="plus" size={16} />
        {pending ? "Creando…" : "Crear presupuesto"}
      </button>
    </form>
  );
}
