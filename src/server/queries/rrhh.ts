import { db } from "@/lib/db";
import type { TipoAusencia } from "@prisma/client";

export type AusenciaFila = {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoApellido: string | null;
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
  aprobada: boolean;
  pagada: boolean;
  notas: string | null;
  createdAt: string;
};

export async function listarAusencias(
  filtros: { empleadoId?: string; anio?: number; mes?: number } = {}
): Promise<AusenciaFila[]> {
  const { empleadoId, anio, mes } = filtros;
  const now = new Date();
  const year = anio ?? now.getFullYear();

  const inicio = mes
    ? new Date(year, mes - 1, 1)
    : new Date(year, 0, 1);
  const fin = mes
    ? new Date(year, mes, 1)
    : new Date(year + 1, 0, 1);

  const ausencias = await db.ausencia.findMany({
    where: {
      ...(empleadoId ? { empleadoId } : {}),
      fechaInicio: { gte: inicio, lt: fin },
    },
    include: {
      empleado: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ fechaInicio: "desc" }],
  });

  return ausencias.map((a) => ({
    id: a.id,
    empleadoId: a.empleadoId,
    empleadoNombre: a.empleado.nombre,
    empleadoApellido: a.empleado.apellido,
    tipo: a.tipo,
    fechaInicio: a.fechaInicio.toISOString(),
    fechaFin: a.fechaFin.toISOString(),
    diasHabiles: a.diasHabiles,
    aprobada: a.aprobada,
    pagada: a.pagada,
    notas: a.notas,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function resumenVacacionesEmpleado(empleadoId: string, anio: number) {
  const diasUsados = await db.ausencia.aggregate({
    where: {
      empleadoId,
      tipo: "VACACIONES",
      fechaInicio: { gte: new Date(anio, 0, 1), lt: new Date(anio + 1, 0, 1) },
      aprobada: true,
    },
    _sum: { diasHabiles: true },
  });
  return { diasUsados: diasUsados._sum.diasHabiles ?? 0 };
}
