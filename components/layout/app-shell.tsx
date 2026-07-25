"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveBudget, useCurrentUser } from "@/lib/store";
import { useOffline } from "@/lib/hooks";
import { signOut } from "@/lib/auth/actions";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar, cx } from "@/components/ui/primitives";
import { Sheet, ToastViewport } from "@/components/ui/overlays";
import { BudgetSwitcher } from "./budget-switcher";
import { NewMovementButton } from "./new-movement";
import { SWRegister } from "./sw-register";

const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Panel", icon: "home" },
  { href: "/movimientos", label: "Movimientos", icon: "swap" },
  { href: "/recurrentes", label: "Recurrentes", icon: "repeat" },
  { href: "/presupuestos", label: "Presupuestos", icon: "wallet" },
  { href: "/usuarios", label: "Usuarios", icon: "users" },
  { href: "/categorias", label: "Categorías", icon: "tag" },
  { href: "/configuracion", label: "Configuración", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine font-mono text-lg font-bold text-white">
        ¢
      </span>
      <span className="text-lg font-bold tracking-tight">Centavo</span>
    </Link>
  );
}

function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber px-4 py-2 text-sm font-medium text-white">
      <Icon name="wifiOff" size={16} />
      Sin conexión. Estás viendo los últimos datos disponibles.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { activeBudget } = useActiveBudget();
  const [moreOpen, setMoreOpen] = useState(false);

  // 2 ítems a la izquierda del botón +, 1 a la derecha: lo mantiene centrado
  const mobileLeft = NAV.slice(0, 2);
  const mobileRight = NAV.slice(2, 3);
  const mobileMore = NAV.slice(3);

  // /login no lleva navegación: todavía no hay sesión ni presupuesto activo
  if (pathname === "/login") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
        {children}
        <ToastViewport />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SWRegister />
      <OfflineBanner />

      {/* Barra superior (móvil y tablet) */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Link
            href="/"
            aria-label="Centavo, ir al panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine font-mono text-lg font-bold text-white"
          >
            ¢
          </Link>
          <BudgetSwitcher compact />
          <Link href="/configuracion" aria-label="Tu perfil y configuración">
            <Avatar iniciales={user.iniciales} color={user.color} size={32} />
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Barra lateral (escritorio) */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-line bg-surface px-4 py-5 lg:flex">
          <Logo />
          <BudgetSwitcher />
          <NewMovementButton variant="sidebar" />
          <nav className="flex-1" aria-label="Navegación principal">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-pine-tint text-pine-deep"
                          : "text-ink-soft hover:bg-line-soft hover:text-ink",
                      )}
                    >
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-3 border-t border-line-soft pt-4">
            <Avatar iniciales={user.iniciales} color={user.color} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.nombre}</p>
              <p className="truncate text-xs text-ink-faint">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-ink-soft hover:bg-line-soft hover:text-expense"
              >
                <Icon name="logout" size={17} />
              </button>
            </form>
          </div>
        </aside>

        {/* Contenido */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>

      {/* Navegación inferior (móvil) */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-5 items-center px-2">
          {mobileLeft.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-pine" : "text-ink-faint",
                )}
              >
                <Icon name={item.icon} size={21} />
                {item.label}
              </Link>
            );
          })}
          <div className="flex justify-center">
            <NewMovementButton variant="fab" />
          </div>
          {mobileRight.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-pine" : "text-ink-faint",
                )}
              >
                <Icon name={item.icon} size={21} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cx(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              mobileMore.some((i) => isActive(pathname, i.href))
                ? "text-pine"
                : "text-ink-faint",
            )}
          >
            <Icon name="grid" size={21} />
            Más
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más secciones">
        <ul className="space-y-1">
          {mobileMore.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 font-medium",
                  isActive(pathname, item.href)
                    ? "bg-pine-tint text-pine-deep"
                    : "hover:bg-line-soft",
                )}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line-soft pt-3 text-center text-xs text-ink-faint">
          Trabajando en {activeBudget.emoji} {activeBudget.nombre}
        </p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium text-expense hover:bg-expense-tint"
          >
            <Icon name="logout" size={17} />
            Cerrar sesión
          </button>
        </form>
      </Sheet>

      <ToastViewport />
    </div>
  );
}
