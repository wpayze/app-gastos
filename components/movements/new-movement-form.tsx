"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActiveBudget, useCurrentUser, useToast } from "@/lib/store";
import {
  createMovementAction,
  previewConversionAction,
  updateMovementAction,
} from "@/app/movimientos/actions";
import { PAYMENT_LABEL, CURRENCY_SYMBOL } from "@/lib/labels";
import { formatForeignMoney, formatMoney, formatRate } from "@/lib/format";
import type {
  Category,
  ForeignCurrency,
  Movement,
  MovementType,
  PaymentMethod,
  User,
} from "@/lib/types";
import { Card, cx } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";
import { QuickCreateCategory } from "@/components/categories/quick-create-category";

interface Errors {
  cantidad?: string;
  concepto?: string;
  categoria?: string;
}

/** Deja solo dígitos y un separador decimal (coma o punto) — descarta el resto según se escribe. */
function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  const sepIndex = cleaned.search(/[.,]/);
  if (sepIndex === -1) return cleaned;
  return (
    cleaned.slice(0, sepIndex + 1) + cleaned.slice(sepIndex + 1).replace(/[.,]/g, "")
  );
}

export function NewMovementForm({
  budgetId,
  categories,
  profiles,
  base,
  editing,
  initialTipo,
  today,
}: {
  budgetId: string;
  categories: Category[];
  profiles: User[];
  base: Movement | null;
  editing: boolean;
  initialTipo: MovementType;
  today: string;
}) {
  const router = useRouter();
  const { activeBudget } = useActiveBudget();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [tipo, setTipo] = useState<MovementType>(initialTipo);
  const [cantidad, setCantidad] = useState(base ? String(base.cantidad) : "");
  const [moneda, setMoneda] = useState<"EUR" | ForeignCurrency>("EUR");
  const [preview, setPreview] = useState<{ tasa: number; convertido: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [concepto, setConcepto] = useState(base?.concepto ?? "");
  const [categoria, setCategoria] = useState(base?.categoriaId ?? "");
  const [fecha, setFecha] = useState(base?.fecha ?? today);
  const [responsable, setResponsable] = useState(base?.userId ?? currentUser.id);
  const [metodo, setMetodo] = useState<PaymentMethod>(base?.metodoPago ?? "tarjeta");
  const [nota, setNota] = useState(base?.nota ?? "");
  // "Marcar como recurrente" deshabilitado a pedido — no interesa esta
  // integración cruzada por ahora. El código queda comentado, no borrado,
  // porque sí funciona (crea el Recurrent vinculado correctamente).
  // const [esRecurrente, setEsRecurrente] = useState(false);
  // const [frecuencia, setFrecuencia] = useState<Frequency>("mensual");
  const [comprobante, setComprobante] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  const categoriasDisponibles = useMemo(
    () => categoryList.filter((c) => c.tipo === tipo),
    [categoryList, tipo],
  );

  const miembrosActivos = activeBudget.miembros.filter(
    (m) => m.estado === "activo",
  );

  // Conversión a euros: se recalcula sola (con caché de 24h detrás) cada
  // vez que cambia la moneda o el monto, para mostrar el preview antes de
  // guardar. La misma conversión se vuelve a hacer en el servidor al
  // enviar el formulario — este preview es solo para que el usuario vea
  // el valor aproximado antes de confirmar.
  useEffect(() => {
    let cancelled = false;
    const n = Number(cantidad.replace(",", "."));
    const valid = !editing && moneda !== "EUR" && cantidad && !Number.isNaN(n) && n > 0;

    const timer = setTimeout(() => {
      if (cancelled) return;
      if (!valid) {
        setPreview(null);
        setPreviewLoading(false);
        return;
      }
      setPreviewLoading(true);
      previewConversionAction(moneda as ForeignCurrency, n)
        .then((result) => {
          if (!cancelled) setPreview(result);
        })
        .catch((err) => {
          console.error("previewConversionAction falló:", err);
          if (!cancelled) setPreview(null);
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editing, moneda, cantidad]);

  const validate = (): boolean => {
    const next: Errors = {};
    const n = Number(cantidad.replace(",", "."));
    if (!cantidad || Number.isNaN(n) || n <= 0) {
      next.cantidad = "Introduce una cantidad mayor que cero.";
    }
    if (!concepto.trim()) next.concepto = "El concepto es obligatorio.";
    if (!categoria) next.categoria = "Elige una categoría.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!editing && moneda !== "EUR" && !preview) {
      toast("Espera a que se calcule la conversión a euros.", "danger");
      return;
    }

    const values = {
      tipo,
      cantidad: Number(cantidad.replace(",", ".")),
      concepto: concepto.trim(),
      categoriaId: categoria,
      fecha,
      userId: responsable,
      metodoPago: metodo,
      nota: nota.trim() || undefined,
      monedaOriginal:
        !editing && moneda !== "EUR" ? moneda : undefined,
      cantidadOriginal:
        !editing && moneda !== "EUR" ? Number(cantidad.replace(",", ".")) : undefined,
    };

    startTransition(async () => {
      try {
        if (editing && base) {
          await updateMovementAction(base.id, values);
          toast("Cambios guardados");
        } else {
          await createMovementAction(
            budgetId,
            values,
            // "Marcar como recurrente" deshabilitado — ver nota más arriba.
            undefined,
          );
          toast(tipo === "gasto" ? "Gasto creado" : "Ingreso creado");
        }
        setDone(true);
      } catch {
        toast("No se pudo guardar. Intenta de nuevo.", "danger");
      }
    });
  };

  const reset = () => {
    setTipo("gasto");
    setCantidad("");
    setMoneda("EUR");
    setPreview(null);
    setConcepto("");
    setCategoria("");
    setFecha(today);
    setResponsable(currentUser.id);
    setNota("");
    // setEsRecurrente(false);
    setComprobante(false);
    setErrors({});
    setDone(false);
  };

  // Pantalla de confirmación
  if (done) {
    const n = Number(cantidad.replace(",", ".")) || 0;
    const montoTexto =
      moneda === "EUR"
        ? formatMoney(n)
        : `${formatForeignMoney(n, moneda)} (≈ ${formatMoney(preview?.convertido ?? 0)})`;
    return (
      <div className="mx-auto max-w-xl">
        <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="rounded-full bg-pine-tint p-4 text-pine">
            <Icon name="check" size={32} />
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {editing
                ? "Cambios guardados"
                : tipo === "gasto"
                  ? "Gasto registrado"
                  : "Ingreso registrado"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              «{concepto}» por {montoTexto} en {activeBudget.nombre}.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={reset} className="btn-secondary">
              <Icon name="plus" size={15} />
              Crear otro
            </button>
            <button
              onClick={() => router.push("/movimientos")}
              className="btn-primary"
            >
              Ver movimientos
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Editar movimiento" : "Nuevo movimiento"}
        </h1>
        <Link
          href="/movimientos"
          aria-label="Cancelar y volver"
          className="rounded-lg p-2 text-ink-soft hover:bg-line-soft"
        >
          <Icon name="x" size={20} />
        </Link>
      </div>

      {/* Selector de tipo */}
      {!editing && (
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
          {(
            [
              ["gasto", "Gasto"],
              ["ingreso", "Ingreso"],
            ] as Array<[MovementType, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTipo(value);
                setCategoria("");
                setErrors({});
              }}
              aria-pressed={tipo === value}
              className={cx(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                tipo === value
                  ? value === "gasto"
                    ? "bg-expense text-white"
                    : "bg-pine text-white"
                  : "text-ink-soft hover:bg-line-soft",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <Card className="space-y-4 p-5">
          <Field label="Cantidad" error={errors.cantidad}>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={cantidad}
                  onChange={(e) => setCantidad(sanitizeAmountInput(e.target.value))}
                  invalid={Boolean(errors.cantidad)}
                  className="amount pr-12 text-lg font-semibold"
                  autoFocus
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
                  {CURRENCY_SYMBOL[moneda]}
                </span>
              </div>
              {!editing && (
                <div className="w-24 shrink-0">
                  <Select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as "EUR" | ForeignCurrency)}
                    aria-label="Moneda"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="HNL">HNL</option>
                  </Select>
                </div>
              )}
            </div>
            {!editing && moneda !== "EUR" && (
              <p className="mt-1.5 text-xs text-ink-faint">
                {previewLoading
                  ? "Calculando conversión…"
                  : preview
                    ? `≈ ${formatMoney(preview.convertido)} (1 ${moneda} = ${formatRate(preview.tasa)})`
                    : "No se pudo calcular la conversión."}
              </p>
            )}
            {editing && base?.monedaOriginal && (
              <p className="mt-1.5 text-xs text-ink-faint">
                Introducido originalmente como{" "}
                {formatForeignMoney(base.cantidadOriginal ?? 0, base.monedaOriginal)}
              </p>
            )}
          </Field>

          <Field label="Concepto" error={errors.concepto}>
            <Input
              placeholder={tipo === "gasto" ? "P. ej. Supermercado" : "P. ej. Nómina"}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              invalid={Boolean(errors.concepto)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" error={errors.categoria}>
              <Select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                invalid={Boolean(errors.categoria)}
              >
                <option value="">Elige una categoría…</option>
                {categoriasDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.nombre}
                  </option>
                ))}
              </Select>
              <QuickCreateCategory
                tipo={tipo}
                onCreated={(cat) => {
                  setCategoryList((l) => [...l, cat]);
                  setCategoria(cat.id);
                }}
              />
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
            <Field label="Responsable">
              <Select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
              >
                {miembrosActivos.map((m) => {
                  const u = profiles.find((p) => p.id === m.userId);
                  return (
                    <option key={m.userId} value={m.userId}>
                      {u?.nombre ?? m.userId}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field label="Método de pago">
              <Select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as PaymentMethod)}
              >
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((k) => (
                  <option key={k} value={k}>
                    {PAYMENT_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Nota (opcional)">
            <Textarea
              rows={2}
              placeholder="Añade contexto para el resto de miembros"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </Field>

          {/* "Marcar como recurrente" deshabilitado — ver nota junto al estado más arriba.
          {!editing && (
            <div className="rounded-xl border border-line-soft bg-paper/60 px-4 py-2">
              <Toggle
                checked={esRecurrente}
                onChange={setEsRecurrente}
                label="Marcar como recurrente"
                description="Se repetirá automáticamente en cada periodo"
              />
              {esRecurrente && (
                <Field label="Frecuencia" className="mt-2 pb-2">
                  <Select
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value as Frequency)}
                  >
                    {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((k) => (
                      <option key={k} value={k}>
                        {FREQUENCY_LABEL[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          )}
          */}

          {/* Comprobante (solo interfaz, sin almacenamiento real todavía) */}
          <button
            type="button"
            onClick={() => setComprobante((c) => !c)}
            className={cx(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition-colors",
              comprobante
                ? "border-pine bg-pine-tint text-pine-deep"
                : "border-line text-ink-soft hover:bg-line-soft",
            )}
          >
            <Icon name={comprobante ? "check" : "paperclip"} size={16} />
            {comprobante
              ? "ticket-compra.jpg adjuntado (simulado)"
              : "Adjuntar comprobante"}
          </button>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/movimientos" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
            <Icon name="check" size={16} />
            {pending
              ? "Guardando…"
              : editing
                ? "Guardar cambios"
                : tipo === "gasto"
                  ? "Crear gasto"
                  : "Crear ingreso"}
          </button>
        </div>
      </form>
    </div>
  );
}
