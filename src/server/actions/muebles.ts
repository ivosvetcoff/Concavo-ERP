"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  crearMuebleSchema,
  actualizarMuebleSchema,
  eliminarMuebleSchema,
  cambiarProcesoSchema,
  type CrearMuebleInput,
  type ActualizarMuebleInput,
  type EliminarMuebleInput,
  type CambiarProcesoInput,
} from "@/schemas/mueble";
import { revalidatePath } from "next/cache";

export async function agregarMueble(input: CrearMuebleInput) {
  const user = await requireAuth();
  const data = crearMuebleSchema.parse(input);

  await db.$transaction(async (tx) => {
    await tx.mueble.create({
      data: {
        proyectoId: data.proyectoId,
        nombre: data.nombre,
        cantidad: data.cantidad,
        madera: data.madera || null,
        descripcionLarga: data.descripcionLarga || null,
        terceros: data.terceros,
        notasTerceros: data.notasTerceros || null,
        procesoActual: data.procesoActual ?? null,
        orden: data.orden || null,
      },
    });

    await tx.proyecto.update({
      where: { id: data.proyectoId },
      data: {
        qtyItems: { increment: data.cantidad },
        eventos: {
          create: {
            tipo: "MUEBLE_AGREGADO",
            descripcion: `Mueble "${data.nombre}" agregado${data.cantidad > 1 ? ` (x${data.cantidad})` : ""}`,
            usuarioId: user.id,
          },
        },
      },
    });
  });

  revalidatePath(`/proyectos/${data.proyectoId}`);
  return { ok: true };
}

export async function actualizarMueble(input: ActualizarMuebleInput) {
  const user = await requireAuth();
  const data = actualizarMuebleSchema.parse(input);

  const muebleAnterior = await db.mueble.findUnique({
    where: { id: data.muebleId },
    select: { procesoActual: true },
  });
  if (!muebleAnterior) throw new Error("Mueble no encontrado");

  const cambioProceso =
    muebleAnterior.procesoActual !== (data.procesoActual ?? null);

  await db.$transaction(async (tx) => {
    await tx.mueble.update({
      where: { id: data.muebleId },
      data: {
        nombre: data.nombre,
        cantidad: data.cantidad,
        madera: data.madera || null,
        descripcionLarga: data.descripcionLarga || null,
        terceros: data.terceros,
        notasTerceros: data.notasTerceros || null,
        procesoActual: data.procesoActual ?? null,
      },
    });

    if (cambioProceso) {
      await tx.muebleProcesoLog.create({
        data: {
          muebleId: data.muebleId,
          procesoAnterior: muebleAnterior.procesoActual,
          procesoNuevo: data.procesoActual ?? null,
          cambiadoPorId: user.id,
        },
      });
    }
  });

  revalidatePath(`/proyectos/${data.proyectoId}`);
  return { ok: true };
}

export async function eliminarMueble(input: EliminarMuebleInput) {
  const user = await requireAuth();
  const { muebleId, proyectoId } = eliminarMuebleSchema.parse(input);

  const mueble = await db.mueble.findUnique({
    where: { id: muebleId },
    select: { nombre: true, cantidad: true },
  });
  if (!mueble) throw new Error("Mueble no encontrado");

  await db.$transaction(async (tx) => {
    await tx.mueble.delete({ where: { id: muebleId } });

    await tx.proyecto.update({
      where: { id: proyectoId },
      data: {
        qtyItems: { decrement: mueble.cantidad },
        eventos: {
          create: {
            tipo: "MUEBLE_ELIMINADO",
            descripcion: `Mueble "${mueble.nombre}" eliminado`,
            usuarioId: user.id,
          },
        },
      },
    });
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function cambiarProcesoMueble(input: CambiarProcesoInput) {
  const user = await requireAuth();
  const { muebleId, procesoNuevo } = cambiarProcesoSchema.parse(input);

  const mueble = await db.mueble.findUnique({
    where: { id: muebleId },
    select: { proyectoId: true, procesoActual: true, nombre: true },
  });
  if (!mueble) throw new Error("Mueble no encontrado");

  await db.$transaction(async (tx) => {
    await tx.mueble.update({
      where: { id: muebleId },
      data: { procesoActual: procesoNuevo },
    });

    await tx.muebleProcesoLog.create({
      data: {
        muebleId,
        procesoAnterior: mueble.procesoActual,
        procesoNuevo,
        cambiadoPorId: user.id,
      },
    });

    await tx.proyecto.update({
      where: { id: mueble.proyectoId },
      data: {
        eventos: {
          create: {
            tipo: "OTRO",
            descripcion: `Proceso de "${mueble.nombre}": ${mueble.procesoActual ?? "sin proceso"} → ${procesoNuevo ?? "sin proceso"}`,
            usuarioId: user.id,
          },
        },
      },
    });
  });

  revalidatePath(`/proyectos/${mueble.proyectoId}`);
  return { ok: true };
}
