"use client";

// Estado global de la interfaz: presupuesto activo y avisos (toasts).
// El usuario y los presupuestos llegan sembrados desde el servidor
// (app/layout.tsx); cambiar de presupuesto persiste en una cookie vía
// lib/session/actions.ts para que los Server Components de cada página
// sepan cuál usar en el siguiente render.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Budget, User } from "./types";
import { setActiveBudget } from "./session/actions";

// ── Presupuesto activo ──────────────────────────────────────

interface BudgetContextValue {
  activeBudgetId: string;
  activeBudget: Budget;
  budgets: Budget[];
  setActiveBudgetId: (id: string) => void;
  switching: boolean;
  currentUserId: string;
  currentUser: User;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function useActiveBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useActiveBudget requiere <AppProviders>");
  return ctx;
}

export function useCurrentUser() {
  return useActiveBudget().currentUser;
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

export function AppProviders({
  user,
  budgets,
  activeBudgetId: initialActiveBudgetId,
  children,
}: {
  user: User;
  budgets: Budget[];
  activeBudgetId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [activeBudgetId, setActiveBudgetIdState] = useState(
    initialActiveBudgetId,
  );
  const [switching, startTransition] = useTransition();
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

  const setActiveBudgetId = useCallback(
    (id: string) => {
      setActiveBudgetIdState(id); // feedback instantáneo en la UI
      startTransition(async () => {
        await setActiveBudget(id);
        router.refresh(); // re-renderiza los Server Components con la cookie nueva
      });
    },
    [router],
  );

  const budgetValue = useMemo<BudgetContextValue>(
    () => ({
      activeBudgetId,
      activeBudget:
        budgets.find((b) => b.id === activeBudgetId) ?? budgets[0],
      budgets,
      setActiveBudgetId,
      switching,
      currentUserId: user.id,
      currentUser: user,
    }),
    [activeBudgetId, budgets, setActiveBudgetId, switching, user],
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
