import { createClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/models/mappers";
import type { User } from "@/lib/types";

/**
 * Todos los perfiles visibles (la política RLS de profiles permite ver a
 * cualquier autenticado, para poder mostrar nombre/avatar de otros
 * miembros). Útil para elegir a quién añadir a un presupuesto.
 */
export async function listProfiles(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data.map(mapProfile);
}

export async function getProfileById(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/** Para "añadir miembro por correo": solo encuentra cuentas que ya existen. */
export async function getProfileByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}
