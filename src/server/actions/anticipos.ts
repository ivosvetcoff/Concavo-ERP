"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import {
  registrarAnticipoSchema,
  eliminarAnticipoSchema,
  type RegistrarAnticipoInput,
  type EliminarAnticipoInput,
} from "@/schemas/anticipo";
import { revalidatePath } from "next/cache";

export async function registrarAnticipo(input: RegistrarAnticipoInput) {
  const user = await requireOwner();
  const data = registrarAnticipoSchema.parse(input);

  await db.$transaction(async (tx) => {
    await tx.anticipo.create({
      data: {
        proyectoId: data.proyectoId,
        monto: data.monto,
        porcentaje: data.porcentaje || null,
        fecha: data.fecha,
        metodoPago: data.metodoPago,
        cfdiEmitido: data.cfdiEmitido,
        numeroCFDI: data.numeroCFDI || null,
        notas: data.notas || null,
      },
    });

    await tx.proyecto.update({
      where: { id: data.proyectoId },
      data: {
        eventos: {
          create: {
            tipo: "ANTICIPO_RECIBIDO",
            descripcion: `Anticipo registrado: $${parseFloat(data.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}${data.porcentaje ? ` (${data.porcentaje}%)` : ""}`,
            usuarioId: user.id,
          },
        },
      },
    });
  });

  revalidatePath(`/proyectos/${data.proyectoId}`);
  return { ok: true };
}

export async function eliminarAnticipo(input: EliminarAnticipoInput) {
  await requireOwner();
  const { anticipoId, proyectoId } = eliminarAnticipoSchema.parse(input);

  const anticipo = await db.anticipo.findUnique({
    where: { id: anticipoId },
    select: { monto: true },
  });
  if (!anticipo) throw new Error("Anticipo no encontrado");

  await db.anticipo.delete({ where: { id: anticipoId } });

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}
