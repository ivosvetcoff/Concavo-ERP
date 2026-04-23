"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import Decimal from "decimal.js";
import { getMondayOf } from "@/server/queries/produccion";
import { addDays, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Guardar / actualizar PagoNomina ──────────────────────────────────────────

const guardarNominaSchema = z.object({
  empleadoId: z.string().cuid(),
  semana: z.string(), // "yyyy-MM-dd"
  sueldoBase: z.string(),
  montoExtras: z.string(),
  bonos: z.string().default("0"),
  deducciones: z.string().default("0"),
  notas: z.string().optional(),
});

export async function guardarNomina(input: z.infer<typeof guardarNominaSchema>) {
  await requireOwner();
  const data = guardarNominaSchema.parse(input);

  const semanaDate = getMondayOf(new Date(data.semana + "T00:00:00"));
  const inicio = startOfDay(semanaDate);

  const sueldoBase = new Decimal(data.sueldoBase);
  const montoExtras = new Decimal(data.montoExtras);
  const bonos = new Decimal(data.bonos);
  const deducciones = new Decimal(data.deducciones);
  const total = sueldoBase.plus(montoExtras).plus(bonos).minus(deducciones);

  const horasExtrasAgg = await db.registroProduccion.aggregate({
    where: {
      empleadoId: data.empleadoId,
      semana: { gte: inicio, lt: addDays(inicio, 7) },
    },
    _sum: { horasTE: true },
  });
  const horasExtras = new Decimal(horasExtrasAgg._sum.horasTE?.toString() ?? "0");

  await db.pagoNomina.upsert({
    where: { empleadoId_semana: { empleadoId: data.empleadoId, semana: inicio } },
    update: {
      sueldoBase,
      horasExtras,
      montoExtras,
      bonos,
      deducciones,
      total,
      notas: data.notas ?? null,
    },
    create: {
      empleadoId: data.empleadoId,
      semana: inicio,
      sueldoBase,
      horasExtras,
      montoExtras,
      bonos,
      deducciones,
      total,
      notas: data.notas ?? null,
    },
  });

  revalidatePath("/nomina");
}

export async function marcarPagado(pagoId: string, fechaPago: string) {
  await requireOwner();
  await db.pagoNomina.update({
    where: { id: pagoId },
    data: { pagado: true, fechaPago: new Date(fechaPago) },
  });
  revalidatePath("/nomina");
}

export async function desmarcarPagado(pagoId: string) {
  await requireOwner();
  await db.pagoNomina.update({
    where: { id: pagoId },
    data: { pagado: false, fechaPago: null },
  });
  revalidatePath("/nomina");
}

// ── Guardar Tarea (Gantt) ─────────────────────────────────────────────────────

const crearTareaSchema = z.object({
  muebleId: z.string().cuid(),
  empleadoId: z.string().cuid(),
  proceso: z.enum([
    "HABILITADO","ARMADO","PULIDO","LACA","EXTERNO",
    "COMPLEMENTOS","EMPAQUE","LISTO_PARA_ENTREGA","ENTREGADO",
  ]),
  fechaInicio: z.string(), // ISO
  fechaFinEst: z.string(), // ISO
  horasEstimadas: z.string().optional(),
  notas: z.string().optional(),
});

export async function crearTarea(input: z.infer<typeof crearTareaSchema>) {
  await requireOwner();
  const data = crearTareaSchema.parse(input);

  await db.tarea.create({
    data: {
      muebleId: data.muebleId,
      empleadoId: data.empleadoId,
      proceso: data.proceso,
      fechaInicio: new Date(data.fechaInicio),
      fechaFinEst: new Date(data.fechaFinEst),
      horasEstimadas: data.horasEstimadas ? new Decimal(data.horasEstimadas) : null,
      notas: data.notas ?? null,
    },
  });

  revalidatePath("/gantt");
}

export async function completarTarea(tareaId: string) {
  await requireOwner();
  await db.tarea.update({
    where: { id: tareaId },
    data: { completada: true, fechaFinReal: new Date() },
  });
  revalidatePath("/gantt");
}

export async function eliminarTarea(tareaId: string) {
  await requireOwner();
  await db.tarea.delete({ where: { id: tareaId } });
  revalidatePath("/gantt");
}
