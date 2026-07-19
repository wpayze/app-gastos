"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useCurrentUser, useToast } from "@/lib/store";
import { useOffline } from "@/lib/hooks";
import { Avatar, Card, SectionTitle, cx } from "@/components/ui/primitives";
import { Field, Input, Select, Toggle } from "@/components/ui/forms";
import { ConfirmDialog } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const noopSubscribe = () => () => {};

function useStandalone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
}

function PwaSection() {
  const { toast } = useToast();
  const offline = useOffline();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const standalone = useStandalone();
  const isIOS = useSyncExternalStore(
    noopSubscribe,
    () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <Card className="divide-y divide-line-soft px-5">
      <div className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-medium">Instalar la aplicación</p>
          <p className="text-xs text-ink-faint">
            {standalone
              ? "Ya estás usando Centavo como aplicación instalada."
              : isIOS
                ? "En iOS: toca Compartir y luego «Añadir a pantalla de inicio»."
                : "Añade Centavo a tu pantalla de inicio para abrirla como una app."}
          </p>
        </div>
        {!standalone && (
          <button
            className="btn-secondary shrink-0"
            onClick={async () => {
              if (installEvent) {
                await installEvent.prompt();
                setInstallEvent(null);
              } else {
                toast(
                  "Tu navegador mostrará la opción de instalar cuando esté disponible",
                  "info",
                );
              }
            }}
          >
            <Icon name="download" size={15} />
            Instalar
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-medium">Estado de conexión</p>
          <p className="text-xs text-ink-faint">
            Los datos consultados quedan disponibles sin conexión.
          </p>
        </div>
        <span
          className={cx(
            "flex items-center gap-1.5 text-xs font-semibold",
            offline ? "text-amber" : "text-income",
          )}
        >
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              offline ? "bg-amber" : "bg-income",
            )}
          />
          {offline ? "Sin conexión" : "Conectado"}
        </span>
      </div>
    </Card>
  );
}

function ExportSection() {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  const start = () => {
    setState("working");
    setTimeout(() => {
      setState("done");
      toast("Exportación lista: movimientos-2026.csv (simulado)");
    }, 1400);
  };

  return (
    <Card className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium">Exportar movimientos</p>
        <p className="text-xs text-ink-faint">
          Descarga un CSV con todos los movimientos de tus presupuestos.
        </p>
      </div>
      <button
        onClick={start}
        disabled={state === "working"}
        className="btn-secondary shrink-0 disabled:opacity-60"
      >
        {state === "working" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-faint border-t-transparent" />
            Preparando…
          </>
        ) : (
          <>
            <Icon name="download" size={15} />
            {state === "done" ? "Exportar de nuevo" : "Exportar CSV"}
          </>
        )}
      </button>
    </Card>
  );
}

export default function SettingsPage() {
  const user = useCurrentUser();
  const { toast } = useToast();

  const [nombre, setNombre] = useState(user.nombre);
  const [moneda, setMoneda] = useState("EUR");
  const [idioma, setIdioma] = useState("es");
  const [formatoFecha, setFormatoFecha] = useState("dd/mm/aaaa");
  const [inicioPeriodo, setInicioPeriodo] = useState("1");
  const [notifLimites, setNotifLimites] = useState(true);
  const [notifRecurrentes, setNotifRecurrentes] = useState(true);
  const [notifResumen, setNotifResumen] = useState(false);
  const [notifInvitaciones, setNotifInvitaciones] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>

      <section>
        <SectionTitle>Perfil</SectionTitle>
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar iniciales={user.iniciales} color={user.color} size={56} />
            <div>
              <p className="font-semibold">{user.nombre}</p>
              <p className="text-sm text-ink-faint">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Field>
            <Field label="Correo">
              <Input value={user.email} disabled className="opacity-60" />
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => toast("Perfil actualizado")}
              className="btn-primary"
            >
              Guardar cambios
            </button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Preferencias</SectionTitle>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Moneda">
            <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              <option value="EUR">€ Euro</option>
              <option value="USD">$ Dólar estadounidense</option>
              <option value="MXN">$ Peso mexicano</option>
              <option value="COP">$ Peso colombiano</option>
            </Select>
          </Field>
          <Field label="Idioma">
            <Select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </Select>
          </Field>
          <Field label="Formato de fecha">
            <Select
              value={formatoFecha}
              onChange={(e) => setFormatoFecha(e.target.value)}
            >
              <option value="dd/mm/aaaa">19/07/2026</option>
              <option value="mm/dd/aaaa">07/19/2026</option>
              <option value="aaaa-mm-dd">2026-07-19</option>
            </Select>
          </Field>
          <Field
            label="Inicio del periodo mensual"
            hint="Día en que empieza tu mes contable."
          >
            <Select
              value={inicioPeriodo}
              onChange={(e) => setInicioPeriodo(e.target.value)}
            >
              <option value="1">Día 1</option>
              <option value="15">Día 15</option>
              <option value="25">Día 25 (nómina)</option>
            </Select>
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle>Notificaciones</SectionTitle>
        <Card className="divide-y divide-line-soft px-5">
          <div className="py-3">
            <Toggle
              checked={notifLimites}
              onChange={setNotifLimites}
              label="Alertas de límites"
              description="Cuando una categoría supere el 85 % de su límite"
            />
          </div>
          <div className="py-3">
            <Toggle
              checked={notifRecurrentes}
              onChange={setNotifRecurrentes}
              label="Recordatorios de recurrentes"
              description="Un día antes de cada cargo o ingreso programado"
            />
          </div>
          <div className="py-3">
            <Toggle
              checked={notifResumen}
              onChange={setNotifResumen}
              label="Resumen mensual"
              description="Balance del mes al cerrarse el periodo"
            />
          </div>
          <div className="py-3">
            <Toggle
              checked={notifInvitaciones}
              onChange={setNotifInvitaciones}
              label="Invitaciones y miembros"
              description="Cambios de acceso en tus presupuestos"
            />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Aplicación</SectionTitle>
        <div className="space-y-3">
          <PwaSection />
          <ExportSection />
        </div>
      </section>

      <section>
        <SectionTitle>Zona de peligro</SectionTitle>
        <Card className="flex items-center justify-between gap-4 border-expense/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-expense">Eliminar cuenta</p>
            <p className="text-xs text-ink-faint">
              Borra tu usuario y tu acceso a todos los presupuestos.
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="btn-danger shrink-0"
          >
            <Icon name="trash" size={15} />
            Eliminar
          </button>
        </Card>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          toast("Cuenta eliminada (simulado). Hasta pronto 👋", "danger")
        }
        title="Eliminar cuenta"
        confirmLabel="Eliminar mi cuenta"
        description={
          <>
            Se eliminarán tu perfil y tu acceso a todos los presupuestos. Los
            presupuestos compartidos seguirán existiendo para el resto de
            miembros. Esta acción no se puede deshacer.
          </>
        }
      />

      <p className="pb-4 text-center text-xs text-ink-faint">
        Centavo · versión de demostración con datos simulados
      </p>
    </div>
  );
}
