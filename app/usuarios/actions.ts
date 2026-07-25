"use server";

import { revalidatePath } from "next/cache";
import {
  addMember,
  removeMember,
  setMemberEstado,
  updateMemberRole,
} from "@/lib/services/budgets.service";
import { getProfileByEmail } from "@/lib/services/profiles.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logActivity } from "@/lib/services/activity.service";
import { ROLE_LABEL } from "@/lib/labels";
import type { BudgetRole } from "@/lib/types";

export interface AddMemberState {
  error?: string;
  success?: boolean;
}

/**
 * Busca la cuenta por correo y la añade si existe. No hay invitación por
 * email a alguien sin cuenta: esta app no tiene alta propia, las cuentas
 * las crea quien la administra desde Supabase.
 */
export async function addMemberByEmailAction(
  budgetId: string,
  existingMemberIds: string[],
  _prevState: AddMemberState,
  formData: FormData,
): Promise<AddMemberState> {
  const email = String(formData.get("email") ?? "").trim();
  const rol = String(formData.get("rol") ?? "editor") as BudgetRole;

  if (!email) {
    return { error: "Escribe un correo." };
  }

  const profile = await getProfileByEmail(email);
  if (!profile) {
    return { error: `No existe ninguna cuenta con el correo «${email}».` };
  }
  if (existingMemberIds.includes(profile.id)) {
    return { error: `${profile.nombre} ya pertenece a este presupuesto.` };
  }

  await addMember(budgetId, profile.id, rol);

  const currentUser = await getCurrentUser();
  if (currentUser) {
    await logActivity(
      budgetId,
      currentUser.id,
      "miembro",
      `añadió a ${profile.nombre} como ${ROLE_LABEL[rol].toLowerCase()}`,
    );
  }

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateMemberRoleAction(
  budgetId: string,
  userId: string,
  rol: BudgetRole,
) {
  await updateMemberRole(budgetId, userId, rol);
  revalidatePath("/usuarios");
}

export async function setMemberEstadoAction(
  budgetId: string,
  userId: string,
  estado: "activo" | "suspendido",
) {
  await setMemberEstado(budgetId, userId, estado);
  revalidatePath("/usuarios");
}

export async function removeMemberAction(budgetId: string, userId: string) {
  await removeMember(budgetId, userId);
  revalidatePath("/usuarios");
}
