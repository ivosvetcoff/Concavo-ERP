"use server";

import { db } from "@/lib/db";
import { requireAuth, requireOwner } from "@/lib/auth";
import {
  crearInsumoSchema,
  eliminarInsumoSchema,
  type CrearInsumoInput,
  type EliminarInsumoInput,
} from "@/schemas/insumo";
import { revalidatePath } from "next/cache";

export async function registrarInsumo(input: CrearInsumoInput) {
  await requireAuth();
  const data = crearInsumoSchema.parse(input);

  const importe = parseFloat(data.importe);
  const iva = data.iva ? parseFloat(data.iva) : 0;
  const total = importe + iva;

  await db.insumo.create({
    data: {
      fecha: data.fecha,
      descripcion: data.descripcion,
      proveedor: data.proveedor,
      idFactura: data.idFactura || null,
      qty: data.qty,
      unidad: data.unidad,
      importe: importe.toString(),
      total: total.toString(),
      metodoPago: data.metodoPago,
      categoria: data.categoria || null,
      comprobante: data.comprobante || null,
    },
  });

  revalidatePath("/insumos");
  return { ok: true };
}

export async function eliminarInsumo(input: EliminarInsumoInput) {
  await requireOwner();
  const { insumoId } = eliminarInsumoSchema.parse(input);

  await db.insumo.delete({ where: { id: insumoId } });

  revalidatePath("/insumos");
  return { ok: true };
}
