import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { Card } from "./primitives";

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
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            {description}
          </p>
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
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}
