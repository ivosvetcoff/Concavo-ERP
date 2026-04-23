"use server";

import { requireAuth } from "@/lib/auth";
import { uploadComprobante } from "@/lib/blob";

export async function uploadComprobanteAction(formData: FormData, prefix: "compras" | "insumos") {
  await requireAuth();
  
  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No se proporcionó un archivo");
  }

  return uploadComprobante(file, prefix);
}
