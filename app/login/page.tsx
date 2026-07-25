import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <LoginForm />
    </div>
  );
}
