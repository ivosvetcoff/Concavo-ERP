"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import {
  registrarPagoSchema,
  actualizarEstatusPagoSchema,
  eliminarPagoSchema,
  type RegistrarPagoInput,
  type ActualizarEstatusPagoInput,
  type EliminarPagoInput,
} from "@/schemas/pago";
import { revalidatePath } from "next/cache";

export async function registrarPago(input: RegistrarPagoInput) {
  const user = await requireOwner();
  const data = registrarPagoSchema.parse(input);

  await db.$transaction(async (tx) => {
    await tx.pagoProyecto.create({
      data: {
        proyectoId: data.proyectoId,
        monto: data.monto,
        fecha: data.fecha,
        metodoPago: data.metodoPago,
        estatus: data.estatus,
        cfdiEmitido: data.cfdiEmitido,
        numeroCFDI: data.numeroCFDI || null,
        notas: data.notas || null,
      },
    });

    const estatusLabel = data.estatus === "LIQUIDADO" ? "liquidado" : "pendiente";
    await tx.proyecto.update({
      where: { id: data.proyectoId },
      data: {
        eventos: {
          create: {
            tipo: "PAGO_RECIBIDO",
            descripcion: `Pago registrado: $${parseFloat(data.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })} — ${estatusLabel}`,
            usuarioId: user.id,
          },
        },
      },
    });
  });

  revalidatePath(`/proyectos/${data.proyectoId}`);
  return { ok: true };
}

export async function actualizarEstatusPago(input: ActualizarEstatusPagoInput) {
  await requireOwner();
  const { pagoId, proyectoId, estatus } = actualizarEstatusPagoSchema.parse(input);

  const pago = await db.pagoProyecto.findUnique({
    where: { id: pagoId },
    select: { proyectoId: true },
  });
  if (!pago || pago.proyectoId !== proyectoId) throw new Error("Pago no encontrado");

  await db.pagoProyecto.update({
    where: { id: pagoId },
    data: { estatus },
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function eliminarPago(input: EliminarPagoInput) {
  await requireOwner();
  const { pagoId, proyectoId } = eliminarPagoSchema.parse(input);

  const pago = await db.pagoProyecto.findUnique({
    where: { id: pagoId },
    select: { proyectoId: true },
  });
  if (!pago || pago.proyectoId !== proyectoId) throw new Error("Pago no encontrado");

  await db.pagoProyecto.delete({ where: { id: pagoId } });

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}
