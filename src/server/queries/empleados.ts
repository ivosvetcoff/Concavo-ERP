import { db } from "@/lib/db";
import type { EspecialidadEmpleado } from "@prisma/client";

export type EmpleadoRow = {
  id: string;
  nombre: string;
  apellido: string | null;
  iniciales: string | null;
  especialidad: EspecialidadEmpleado;
  activo: boolean;
  color: string | null;
  fechaIngreso: Date | null;
  createdAt: Date;
  // OWNER-only
  tarifaHoraTO: string | null;
  tarifaHoraTE: string | null;
  sueldoSemanal: string | null;
  rfc: string | null;
  nss: string | null;
  _count: { tareas: number; registros: number };
};

export async function listarEmpleados(isOwner: boolean): Promise<EmpleadoRow[]> {
  const rows = await db.empleado.findMany({
    orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      iniciales: true,
      especialidad: true,
      activo: true,
      color: true,
      fechaIngreso: true,
      createdAt: true,
      tarifaHoraTO: true,
      tarifaHoraTE: true,
      sueldoSemanal: true,
      rfc: true,
      nss: true,
      _count: { select: { tareas: true, registros: true } },
    },
  });

  return rows.map((e) => ({
    ...e,
    tarifaHoraTO: isOwner ? e.tarifaHoraTO.toString() : null,
    tarifaHoraTE: isOwner ? e.tarifaHoraTE.toString() : null,
    sueldoSemanal: isOwner && e.sueldoSemanal ? e.sueldoSemanal.toString() : null,
  }));
}

export async function listarEmpleadosSelect() {
  return db.empleado.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, apellido: true, especialidad: true, color: true },
    orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
  });
}
