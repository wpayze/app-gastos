import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/lib/store";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { NoBudgetsScreen } from "@/components/auth/no-budgets-screen";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Centavo",
    template: "%s · Centavo",
  },
  description:
    "Gestión de gastos e ingresos personales en presupuestos compartidos.",
  applicationName: "Centavo",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Centavo",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c5e41",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const htmlClassName = `${instrument.variable} ${splineMono.variable} h-full antialiased`;

  // /login no tiene sesión todavía: nada de presupuesto activo que cargar,
  // ni del shell de la app (barra lateral, navegación, selector).
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/login") {
    return (
      <html lang="es" className={htmlClassName}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    );
  }

  const [user, { budgets, activeBudgetId }] = await Promise.all([
    getCurrentUser(),
    getActiveBudgetContext(),
  ]);

  if (!user) {
    // El proxy ya redirige a /login sin sesión; esto es solo defensivo
    // (p. ej. una sesión que expiró justo entre el proxy y el render).
    return (
      <html lang="es" className={htmlClassName}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    );
  }

  if (budgets.length === 0) {
    return (
      <html lang="es" className={htmlClassName}>
        <body className="min-h-full flex flex-col">
          <NoBudgetsScreen user={user} />
        </body>
      </html>
    );
  }

  return (
    <html lang="es" className={htmlClassName}>
      <body className="min-h-full flex flex-col">
        <AppProviders
          user={user}
          budgets={budgets}
          activeBudgetId={activeBudgetId}
        >
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
