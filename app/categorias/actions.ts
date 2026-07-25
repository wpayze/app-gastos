"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryLimit,
  removeCategoryLimit,
  type CreateCategoryInput,
} from "@/lib/services/categories.service";

export async function createCategoryAction(input: CreateCategoryInput) {
  const category = await createCategory(input);
  revalidatePath("/categorias");
  return category;
}

export async function updateCategoryAction(
  id: string,
  input: Partial<CreateCategoryInput>,
) {
  const category = await updateCategory(id, input);
  revalidatePath("/categorias");
  return category;
}

export async function deleteCategoryAction(id: string) {
  await deleteCategory(id);
  revalidatePath("/categorias");
}

export async function setCategoryLimitAction(
  budgetId: string,
  categoryId: string,
  limiteMensual: number,
) {
  await setCategoryLimit(budgetId, categoryId, limiteMensual);
  revalidatePath("/categorias");
}

export async function removeCategoryLimitAction(
  budgetId: string,
  categoryId: string,
) {
  await removeCategoryLimit(budgetId, categoryId);
  revalidatePath("/categorias");
}
