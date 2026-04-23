"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { crearCompraSchema, type CrearCompraInput } from "@/schemas/compra";
import { revalidatePath } from "next/cache";

export async function registrarCompra(input: CrearCompraInput) {
  await requireAuth();
  const data = crearCompraSchema.parse(input);

  const importe = parseFloat(data.importe);
  const iva = data.iva ? parseFloat(data.iva) : 0;
  const total = importe + iva;

  await db.compra.create({
    data: {
      fecha: data.fecha,
      categoria: data.categoria,
      tipo: data.tipo,
      proyectoId: data.proyectoId || null,
      muebleNombre: data.muebleNombre || null,
      descripcion: data.descripcion,
      proveedor: data.proveedor,
      idFactura: data.idFactura || null,
      qty: data.qty,
      unidad: data.unidad,
      importe: importe.toString(),
      iva: iva.toString(),
      total: total.toString(),
      metodoPago: data.metodoPago,
      numeroCFDIRecibido: data.numeroCFDIRecibido || null,
      rfcProveedor: data.rfcProveedor || null,
      comprobante: data.comprobante || null,
    },
  });

  if (data.proyectoId) {
    revalidatePath(`/proyectos/${data.proyectoId}`);
  }
  revalidatePath("/compras");
  return { ok: true };
}
