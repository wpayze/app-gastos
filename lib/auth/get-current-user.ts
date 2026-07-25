import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/models/mappers";
import type { User } from "@/lib/types";

/** Usuario de la sesión actual, o null si no hay ninguna. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile ? mapProfile(profile) : null;
}

/**
 * Para Server Components/Actions que exigen sesión: si no hay usuario,
 * redirige a /login en vez de devolver null. El proxy ya cubre esto de
 * forma optimista en cada request; esta es la comprobación "de verdad",
 * cerca de la fuente de datos, como recomienda la guía de auth de Next.js.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
