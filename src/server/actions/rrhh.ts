"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TipoAusencia } from "@prisma/client";

const ausenciaSchema = z.object({
  empleadoId: z.string().cuid(),
  tipo: z.enum([
    "VACACIONES", "INCAPACIDAD", "PERMISO_CON_GOCE",
    "PERMISO_SIN_GOCE", "FALTA", "DIA_FESTIVO",
  ]),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  diasHabiles: z.number().int().min(1),
  aprobada: z.boolean().default(false),
  pagada: z.boolean().default(true),
  notas: z.string().optional(),
});

export async function registrarAusencia(input: z.infer<typeof ausenciaSchema>) {
  await requireOwner();
  const data = ausenciaSchema.parse(input);

  await db.ausencia.create({
    data: {
      empleadoId: data.empleadoId,
      tipo: data.tipo as TipoAusencia,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      diasHabiles: data.diasHabiles,
      aprobada: data.aprobada,
      pagada: data.pagada,
      notas: data.notas ?? null,
    },
  });

  revalidatePath("/rrhh");
}

export async function aprobarAusencia(id: string) {
  await requireOwner();
  await db.ausencia.update({ where: { id }, data: { aprobada: true } });
  revalidatePath("/rrhh");
}

export async function eliminarAusencia(id: string) {
  await requireOwner();
  await db.ausencia.delete({ where: { id } });
  revalidatePath("/rrhh");
}
