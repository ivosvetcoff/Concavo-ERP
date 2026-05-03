"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { planificarProyecto } from "@/server/calculations/gantt";
import type { MueblePlanificacion, OperadorPlanificacion } from "@/server/calculations/gantt";
import { lunesDeSemana } from "@/lib/festivos-mx";

function toMueblePlan(m: {
  id: string;
  cantidad: number;
  estadoItem: string;
  horasEstimadasHabilitado: { toString(): string } | null;
  horasEstimadasArmado: { toString(): string } | null;
  horasEstimadasPulido: { toString(): string } | null;
  horasEstimadasLaca: { toString(): string } | null;
  horasEstimadasComplementos: { toString(): string } | null;
  horasEstimadasEmpaque: { toString(): string } | null;
}): MueblePlanificacion {
  const p = (v: { toString(): string } | null) =>
    v != null ? parseFloat(v.toString()) : null;
  return {
    muebleId: m.id,
    cantidad: m.cantidad,
    estadoItem: m.estadoItem as never,
    horasEstimadasHabilitado: p(m.horasEstimadasHabilitado),
    horasEstimadasArmado: p(m.horasEstimadasArmado),
    horasEstimadasPulido: p(m.horasEstimadasPulido),
    horasEstimadasLaca: p(m.horasEstimadasLaca),
    horasEstimadasComplementos: p(m.horasEstimadasComplementos),
    horasEstimadasEmpaque: p(m.horasEstimadasEmpaque),
  };
}

export async function replanificarProyecto(proyectoId: string) {
  await requireAuth();

  const [proyecto, empleados] = await Promise.all([
    db.proyecto.findUniqueOrThrow({
      where: { id: proyectoId },
      select: {
        muebles: {
          where: { estadoItem: { notIn: ["CANCELADO", "ENTREGADO"] } },
          select: {
            id: true,
            cantidad: true,
            estadoItem: true,
            horasEstimadasHabilitado: true,
            horasEstimadasArmado: true,
            horasEstimadasPulido: true,
            horasEstimadasLaca: true,
            horasEstimadasComplementos: true,
            horasEstimadasEmpaque: true,
          },
        },
      },
    }),
    db.empleado.findMany({
      where: { activo: true, especialidad: { not: "ADMINISTRATIVO" } },
      select: { id: true, especialidad: true },
    }),
  ]);

  const fechaBase = lunesDeSemana(new Date());
  const operadores: OperadorPlanificacion[] = empleados.map((e) => ({
    empleadoId: e.id,
    especialidad: e.especialidad,
    horasSemanalesTO: 40,
  }));
  const muebles = proyecto.muebles.map(toMueblePlan);
  const plan = planificarProyecto(muebles, operadores, [], fechaBase);

  await db.planProyecto.upsert({
    where: { proyectoId },
    create: {
      proyectoId,
      fechaInicio: fechaBase,
      fechaFinEst: plan.fechaFinEst,
      horasTotalesEst: plan.horasTotalesEst,
      bloqueado: false,
    },
    update: {
      fechaInicio: fechaBase,
      fechaFinEst: plan.fechaFinEst,
      horasTotalesEst: plan.horasTotalesEst,
      bloqueado: false,
    },
  });

  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function toggleBloquearPlan(proyectoId: string, bloqueado: boolean) {
  await requireAuth();

  await db.planProyecto.upsert({
    where: { proyectoId },
    create: {
      proyectoId,
      fechaInicio: lunesDeSemana(new Date()),
      fechaFinEst: new Date(),
      horasTotalesEst: 0,
      bloqueado,
    },
    update: { bloqueado },
  });

  revalidatePath(`/proyectos/${proyectoId}`);
}
