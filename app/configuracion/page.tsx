"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useToast } from "@/lib/store";
import { useOffline } from "@/lib/hooks";
import { updateProfileAction } from "@/app/configuracion/actions";
import { Avatar, Card, SectionTitle, cx } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/forms";
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

export default function SettingsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [nombre, setNombre] = useState(user.nombre);
  const [moneda, setMoneda] = useState("EUR");
  const [idioma, setIdioma] = useState("es");
  const [formatoFecha, setFormatoFecha] = useState("dd/mm/aaaa");
  const [inicioPeriodo, setInicioPeriodo] = useState("1");

  const handleSaveProfile = () => {
    if (!nombre.trim()) {
      toast("El nombre no puede quedar vacío.", "danger");
      return;
    }
    startTransition(async () => {
      try {
        await updateProfileAction(nombre.trim());
        toast("Perfil actualizado");
        router.refresh();
      } catch {
        toast("No se pudo guardar. Intenta de nuevo.", "danger");
      }
    });
  };

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
              onClick={handleSaveProfile}
              disabled={pending}
              className="btn-primary disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
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
              <option value="dd/mm/aaaa">26/07/2026</option>
              <option value="mm/dd/aaaa">07/26/2026</option>
              <option value="aaaa-mm-dd">2026-07-26</option>
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
        <SectionTitle>Aplicación</SectionTitle>
        <PwaSection />
      </section>

      <p className="pb-4 text-center text-xs text-ink-faint">Centavo</p>
    </div>
  );
}
