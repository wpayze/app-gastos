"use client";

import { useState, useTransition } from "react";
import { createCategoryAction } from "@/app/categorias/actions";
import type { Category, MovementType } from "@/lib/types";
import { Sheet } from "@/components/ui/overlays";
import { Field, Input } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/primitives";

const EMOJI_CHOICES = [
  "🏠", "🛒", "🚌", "🩺", "🎬", "📺", "📚", "✈️",
  "💶", "🧑‍💻", "📈", "🧾", "🪙", "🎁", "🐶", "👶",
];

/**
 * Botón + hoja para crear una categoría sin salir del formulario de
 * movimiento/recurrente. Reutiliza createCategoryAction (el mismo que usa
 * la página de Categorías) — el tipo viene fijo del formulario que lo usa,
 * no hace falta preguntarlo de nuevo.
 */
export function QuickCreateCategory({
  tipo,
  onCreated,
}: {
  tipo: MovementType;
  onCreated: (category: Category) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setNombre("");
    setEmoji("🏷️");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const created = await createCategoryAction({
          nombre: nombre.trim(),
          tipo,
          emoji,
        });
        onCreated(created);
        close();
      } catch {
        setError("No se pudo crear la categoría. Intenta de nuevo.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-pine hover:underline"
      >
        <Icon name="plus" size={13} />
        Crear categoría nueva
      </button>

      <Sheet open={open} onClose={close} title="Crear categoría">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-expense-tint px-3 py-2 text-sm font-medium text-expense">
              {error}
            </p>
          )}
          <Field label="Nombre">
            <Input
              placeholder="P. ej. Mascotas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Icono">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-pressed={emoji === e}
                  className={cx(
                    "flex h-10 w-10 items-center justify-center rounded-lg border text-lg",
                    emoji === e
                      ? "border-pine bg-pine-tint"
                      : "border-line hover:bg-line-soft",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary disabled:opacity-60"
            >
              <Icon name="check" size={16} />
              {pending ? "Creando…" : "Crear categoría"}
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
