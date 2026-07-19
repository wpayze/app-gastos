import Link from "next/link";
import { ErrorState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl pt-10">
      <ErrorState
        title="Esta página no existe"
        description="La dirección no corresponde a ninguna sección de Centavo."
        action={
          <Link href="/" className="btn-primary">
            Ir al panel
          </Link>
        }
      />
    </div>
  );
}
