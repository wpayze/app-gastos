"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/auth/actions";
import { Card } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";

const initialState: SignInState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <Card className="w-full max-w-sm space-y-6 p-7">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-pine font-mono text-2xl font-bold text-white">
          ¢
        </span>
        <h1 className="mt-3 text-xl font-bold tracking-tight">Centavo</h1>
        <p className="text-sm text-ink-soft">Inicia sesión para continuar</p>
      </div>

      <form action={action} className="space-y-4">
        <Field label="Correo electrónico">
          <Input
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
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
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Icon name="check" size={16} />
          )}
          {pending ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>
    </Card>
  );
}
