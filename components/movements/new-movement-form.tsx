"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveBudget, useToast } from "@/lib/store";
import { CATEGORIES, getMovement, listBudgets, getBudget } from "@/lib/data";
import { getUser } from "@/lib/mock/users";
import { TODAY } from "@/lib/mock/calendar";
import { PAYMENT_LABEL, FREQUENCY_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import type { Frequency, MovementType, PaymentMethod } from "@/lib/types";
import { Card, cx } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";

type FormTab = MovementType | "transferencia";

interface Errors {
  cantidad?: string;
  concepto?: string;
  categoria?: string;
  destino?: string;
}

export function NewMovementForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { activeBudgetId } = useActiveBudget();
  const { toast } = useToast();

  const editId = params.get("editar");
  const dupId = params.get("duplicar");
  const base = editId
    ? getMovement(editId)
    : dupId
      ? getMovement(dupId)
      : undefined;
  const editing = Boolean(editId && base);

  const initialTab =
    base?.tipo ??
    ((params.get("tipo") as FormTab | null) ?? "gasto");

  const [tab, setTab] = useState<FormTab>(initialTab);
  const [cantidad, setCantidad] = useState(
    base ? String(base.cantidad) : "",
  );
  const [concepto, setConcepto] = useState(base?.concepto ?? "");
  const [categoria, setCategoria] = useState(base?.categoriaId ?? "");
  const [fecha, setFecha] = useState(base?.fecha ?? TODAY);
  const [budgetId, setBudgetId] = useState(base?.budgetId ?? activeBudgetId);
  const [responsable, setResponsable] = useState(base?.userId ?? "u-wil");
  const [metodo, setMetodo] = useState<PaymentMethod>(
    base?.metodoPago ?? "tarjeta",
  );
  const [nota, setNota] = useState(base?.nota ?? "");
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frequency>("mensual");
  const [comprobante, setComprobante] = useState(false);
  const [destino, setDestino] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  const budget = getBudget(budgetId);
  const categoriasDisponibles = useMemo(
    () =>
      tab === "transferencia"
        ? []
        : CATEGORIES.filter((c) => c.tipo === tab),
    [tab],
  );

  const validate = (): boolean => {
    const next: Errors = {};
    const n = Number(cantidad.replace(",", "."));
    if (!cantidad || Number.isNaN(n) || n <= 0) {
      next.cantidad = "Introduce una cantidad mayor que cero.";
    }
    if (tab === "transferencia") {
      if (!destino) next.destino = "Elige el presupuesto de destino.";
      else if (destino === budgetId)
        next.destino = "El destino debe ser distinto del origen.";
    } else {
      if (!concepto.trim()) next.concepto = "El concepto es obligatorio.";
      if (!categoria) next.categoria = "Elige una categoría.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setDone(true);
    if (tab === "transferencia") {
      toast(
        `Transferencia de ${formatMoney(Number(cantidad.replace(",", ".")))} creada`,
      );
    } else if (editing) {
      toast("Cambios guardados");
    } else {
      toast(tab === "gasto" ? "Gasto creado" : "Ingreso creado");
    }
  };

  const reset = () => {
    setCantidad("");
    setConcepto("");
    setCategoria("");
    setFecha(TODAY);
    setNota("");
    setEsRecurrente(false);
    setComprobante(false);
    setDestino("");
    setErrors({});
    setDone(false);
  };

  // Pantalla de confirmación
  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="rounded-full bg-pine-tint p-4 text-pine">
            <Icon name="check" size={32} />
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {tab === "transferencia"
                ? "Transferencia registrada"
                : editing
                  ? "Cambios guardados"
                  : tab === "gasto"
                    ? "Gasto registrado"
                    : "Ingreso registrado"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {tab === "transferencia" ? (
                <>
                  {formatMoney(Number(cantidad.replace(",", ".")) || 0)} de{" "}
                  {getBudget(budgetId).nombre} a{" "}
                  {destino ? getBudget(destino).nombre : ""}.
                </>
              ) : (
                <>
                  «{concepto}» por{" "}
                  {formatMoney(Number(cantidad.replace(",", ".")) || 0)} en{" "}
                  {budget.nombre}.
                </>
              )}{" "}
              Es una simulación: nada se guarda todavía.
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

  const inputCantidad = (
    <Field label="Cantidad" error={errors.cantidad}>
      <div className="relative">
        <Input
          inputMode="decimal"
          placeholder="0,00"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          invalid={Boolean(errors.cantidad)}
          className="amount pr-8 text-lg font-semibold"
          autoFocus
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
          €
        </span>
      </div>
    </Field>
  );

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
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
          {(
            [
              ["gasto", "Gasto"],
              ["ingreso", "Ingreso"],
              ["transferencia", "Transferencia"],
            ] as Array<[FormTab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setCategoria("");
                setErrors({});
              }}
              aria-pressed={tab === value}
              className={cx(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                tab === value
                  ? value === "gasto"
                    ? "bg-expense text-white"
                    : value === "ingreso"
                      ? "bg-pine text-white"
                      : "bg-ink text-white"
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
          {tab === "transferencia" ? (
            <>
              {inputCantidad}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Desde">
                  <Select
                    value={budgetId}
                    onChange={(e) => setBudgetId(e.target.value)}
                  >
                    {listBudgets().map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.emoji} {b.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Hacia" error={errors.destino}>
                  <Select
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    invalid={Boolean(errors.destino)}
                  >
                    <option value="">Elige un presupuesto…</option>
                    {listBudgets()
                      .filter((b) => b.id !== budgetId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.emoji} {b.nombre}
                        </option>
                      ))}
                  </Select>
                </Field>
              </div>
              <Field label="Fecha">
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </Field>
              <Field label="Nota (opcional)">
                <Textarea
                  rows={2}
                  placeholder="Motivo de la transferencia"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </Field>
              <p className="rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft">
                La transferencia creará un gasto en el presupuesto de origen y
                un ingreso en el de destino.
              </p>
            </>
          ) : (
            <>
              {inputCantidad}
              <Field label="Concepto" error={errors.concepto}>
                <Input
                  placeholder={
                    tab === "gasto" ? "P. ej. Supermercado" : "P. ej. Nómina"
                  }
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
                </Field>
                <Field label="Fecha">
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </Field>
                <Field label="Presupuesto">
                  <Select
                    value={budgetId}
                    onChange={(e) => setBudgetId(e.target.value)}
                  >
                    {listBudgets().map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.emoji} {b.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Responsable">
                  <Select
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                  >
                    {budget.miembros
                      .filter((m) => m.estado === "activo")
                      .map((m) => {
                        const u = getUser(m.userId);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.nombre}
                          </option>
                        );
                      })}
                  </Select>
                </Field>
              </div>
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
              <Field label="Nota (opcional)">
                <Textarea
                  rows={2}
                  placeholder="Añade contexto para el resto de miembros"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </Field>

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
                      onChange={(e) =>
                        setFrecuencia(e.target.value as Frequency)
                      }
                    >
                      {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map(
                        (k) => (
                          <option key={k} value={k}>
                            {FREQUENCY_LABEL[k]}
                          </option>
                        ),
                      )}
                    </Select>
                  </Field>
                )}
              </div>

              {/* Comprobante (solo interfaz) */}
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
            </>
          )}
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/movimientos" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn-primary">
            <Icon name="check" size={16} />
            {editing
              ? "Guardar cambios"
              : tab === "transferencia"
                ? "Crear transferencia"
                : tab === "gasto"
                  ? "Crear gasto"
                  : "Crear ingreso"}
          </button>
        </div>
      </form>
    </div>
  );
}
