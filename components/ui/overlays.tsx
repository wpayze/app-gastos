"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icon";
import { cx } from "./primitives";
import { useToast } from "@/lib/store";

// ── Sheet: hoja inferior en móvil, modal centrado en escritorio ──
//
// Se monta con un portal a document.body a propósito: si se renderizara
// en el lugar donde se invoca, cualquier ancestro con backdrop-blur,
// transform o filter (p. ej. la cabecera móvil) pasa a ser el
// "containing block" de sus elementos position:fixed, y el modal queda
// encerrado dentro de ese ancestro (normalmente mucho más pequeño que la
// pantalla) en lugar de cubrirla. El portal hace que este mismo
// componente se comporte igual sin importar desde dónde se abra.

export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  // Un portal solo puede montarse tras la hidratación en el cliente
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Cerrar"
        className="fade-enter absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        className={cx(
          "sheet-enter relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-0",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line-soft bg-surface px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-ink-soft hover:bg-line-soft"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="px-5 py-4 sm:pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ── Diálogo de confirmación (acciones destructivas) ─────────

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Eliminar",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span
            className={cx(
              "mt-0.5 rounded-full p-2",
              danger ? "bg-expense-tint text-expense" : "bg-amber-tint text-amber",
            )}
          >
            <Icon name="alert" size={18} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ── Menú contextual ─────────────────────────────────────────

export interface MenuItem {
  label: string;
  icon?: Parameters<typeof Icon>[0]["name"];
  onClick: () => void;
  danger?: boolean;
}

export function Menu({
  items,
  label = "Opciones",
}: {
  items: MenuItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-ink-soft hover:bg-line-soft"
      >
        <Icon name="dots" size={18} />
      </button>
      {open && (
        <div className="fade-enter absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cx(
                "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-line-soft",
                item.danger ? "text-expense" : "text-ink",
              )}
            >
              {item.icon && <Icon name={item.icon} size={16} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toasts ──────────────────────────────────────────────────

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cx(
            "sheet-enter pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg",
            t.variant === "danger"
              ? "bg-expense"
              : t.variant === "info"
                ? "bg-ink"
                : "bg-pine-deep",
          )}
        >
          <Icon
            name={
              t.variant === "danger"
                ? "trash"
                : t.variant === "info"
                  ? "info"
                  : "check"
            }
            size={16}
          />
          {t.message}
        </button>
      ))}
    </div>
  );
}
