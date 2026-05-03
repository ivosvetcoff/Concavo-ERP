"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  upsertRegistroSchema,
  eliminarRegistroSchema,
} from "@/schemas/produccion";
import { getMondayOf } from "@/server/queries/produccion";

export async function upsertRegistro(data: unknown) {
  await requireAuth();
  const parsed = upsertRegistroSchema.parse(data);
  const semana = getMondayOf(parsed.semana);

  await db.registroProduccion.upsert({
    where: {
      empleadoId_muebleId_proceso_semana: {
        empleadoId: parsed.empleadoId,
        muebleId: parsed.muebleId,
        proceso: parsed.proceso,
        semana,
      },
    },
    create: {
      empleadoId: parsed.empleadoId,
      muebleId: parsed.muebleId,
      proceso: parsed.proceso,
      semana,
      horasTO: parsed.horasTO,
      horasTE: parsed.horasTE,
      esCompensatorio: parsed.esCompensatorio,
      notas: parsed.notas || null,
    },
    update: {
      horasTO: parsed.horasTO,
      horasTE: parsed.horasTE,
      esCompensatorio: parsed.esCompensatorio,
      notas: parsed.notas || null,
    },
  });

  revalidatePath("/produccion");
}

export async function eliminarRegistro(data: unknown) {
  await requireAuth();
  const { registroId } = eliminarRegistroSchema.parse(data);
  await db.registroProduccion.delete({ where: { id: registroId } });
  revalidatePath("/produccion");
}
