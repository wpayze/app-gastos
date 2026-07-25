"use server";

import { revalidatePath } from "next/cache";
import { updateProfile } from "@/lib/services/profiles.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function updateProfileAction(nombre: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  const updated = await updateProfile(user.id, { nombre });
  // El nombre también se muestra en la barra lateral/cabecera (AppShell),
  // que vive por encima de esta página.
  revalidatePath("/", "layout");
  return updated;
}
