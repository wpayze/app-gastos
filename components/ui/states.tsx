import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { Card, cx } from "./primitives";

/** Estado vacío: siempre una invitación a actuar */
export function EmptyState({
  icon = "wallet",
  emoji,
  title,
  description,
  action,
}: {
  icon?: IconName;
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {emoji ? (
        <span className="text-4xl">{emoji}</span>
      ) : (
        <span className="rounded-full bg-pine-tint p-3 text-pine">
          <Icon name={icon} size={24} />
        </span>
      )}
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}

/** Estado de error con acción de recuperación */
export function ErrorState({
  title = "No se han podido cargar los datos",
  description = "Comprueba tu conexión y vuelve a intentarlo.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="rounded-full bg-expense-tint p-3 text-expense">
        <Icon name="alert" size={24} />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      </div>
      {action}
    </Card>
  );
}

/** Indicador de carga en línea; hereda el color del texto (`currentColor`). */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      style={{ width: size, height: size }}
      className={cx(
        "inline-block animate-spin rounded-full border-2 border-current/30 border-t-current",
        className,
      )}
    />
  );
}

/** Spinner centrado para ocupar el área de contenido mientras se decide qué mostrar. */
export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-pine">
      <Spinner size={32} />
    </div>
  );
}
