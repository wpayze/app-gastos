"use client";

// Estado global de la interfaz: presupuesto activo y avisos (toasts).
// Es deliberadamente simple: cuando exista backend, el presupuesto
// activo vivirá en la sesión del usuario.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Budget } from "./types";
import { getBudget } from "./mock/budgets";
import { CURRENT_USER_ID, getUser } from "./mock/users";

// ── Presupuesto activo ──────────────────────────────────────

interface BudgetContextValue {
  activeBudgetId: string;
  activeBudget: Budget;
  setActiveBudgetId: (id: string) => void;
  currentUserId: string;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function useActiveBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useActiveBudget requiere <AppProviders>");
  return ctx;
}

export function useCurrentUser() {
  const { currentUserId } = useActiveBudget();
  return getUser(currentUserId);
}

// ── Toasts ──────────────────────────────────────────────────

export type ToastVariant = "success" | "info" | "danger";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requiere <AppProviders>");
  return ctx;
}

let toastSeq = 0;

// ── Provider raíz ───────────────────────────────────────────

export function AppProviders({ children }: { children: ReactNode }) {
  const [activeBudgetId, setActiveBudgetId] = useState("b-personal");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = ++toastSeq;
      setToasts((t) => [...t.slice(-2), { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const budgetValue = useMemo<BudgetContextValue>(
    () => ({
      activeBudgetId,
      activeBudget: getBudget(activeBudgetId),
      setActiveBudgetId,
      currentUserId: CURRENT_USER_ID,
    }),
    [activeBudgetId],
  );

  const toastValue = useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return (
    <BudgetContext.Provider value={budgetValue}>
      <ToastContext.Provider value={toastValue}>
        {children}
      </ToastContext.Provider>
    </BudgetContext.Provider>
  );
}
