import { db } from "@/lib/db";
import { ESTADOS_KANBAN } from "@/server/queries/dashboard";
import { addDays, startOfDay } from "date-fns";
import type { EspecialidadEmpleado, ProcesoTecnico } from "@prisma/client";

export type RegistroRow = {
  id: string;
  muebleId: string;
  muebleNombre: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  proyectoId: string;
  proceso: ProcesoTecnico;
  horasTO: string;
  horasTE: string;
  esCompensatorio: boolean;
  notas: string | null;
};

export type EmpleadoConRegistros = {
  id: string;
  nombre: string;
  apellido: string | null;
  especialidad: EspecialidadEmpleado;
  color: string | null;
  registros: RegistroRow[];
};

export type MuebleParaSelector = {
  id: string;
  nombre: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  proyectoId: string;
  procesoActual: ProcesoTecnico | null;
};

const ESPECIALIDAD_ORDER: Record<string, number> = {
  HABILITADOR: 0,
  ARMADOR: 1,
  PULIDOR: 2,
  LAQUEADOR: 3,
  ADMINISTRATIVO: 4,
};

export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday, 1=Monday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function obtenerPlanillaSemana(semana: Date): Promise<{
  empleados: EmpleadoConRegistros[];
  mueblesActivos: MuebleParaSelector[];
}> {
  const inicio = startOfDay(semana);
  const fin = addDays(inicio, 7); // lunes a domingo inclusive

  const [empleadosDB, mueblesDB] = await Promise.all([
    db.empleado.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        color: true,
        registros: {
          where: { semana: { gte: inicio, lt: fin } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            muebleId: true,
            proceso: true,
            horasTO: true,
            horasTE: true,
            esCompensatorio: true,
            notas: true,
            mueble: {
              select: {
                nombre: true,
                proyecto: { select: { id: true, codigo: true, nombre: true } },
              },
            },
          },
        },
      },
    }),
    db.mueble.findMany({
      where: {
        proyecto: { estado: { in: ESTADOS_KANBAN } },
        estadoItem: { notIn: ["CANCELADO", "ENTREGADO"] },
      },
      orderBy: [{ proyecto: { codigo: "asc" } }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        procesoActual: true,
        proyecto: { select: { id: true, codigo: true, nombre: true } },
      },
    }),
  ]);

  const empleados: EmpleadoConRegistros[] = empleadosDB
    .sort(
      (a, b) =>
        (ESPECIALIDAD_ORDER[a.especialidad] ?? 99) -
        (ESPECIALIDAD_ORDER[b.especialidad] ?? 99)
    )
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      apellido: e.apellido,
      especialidad: e.especialidad,
      color: e.color,
      registros: e.registros.map((r) => ({
        id: r.id,
        muebleId: r.muebleId,
        muebleNombre: r.mueble.nombre,
        proyectoCodigo: r.mueble.proyecto.codigo,
        proyectoNombre: r.mueble.proyecto.nombre,
        proyectoId: r.mueble.proyecto.id,
        proceso: r.proceso,
        horasTO: r.horasTO.toString(),
        horasTE: r.horasTE.toString(),
        esCompensatorio: r.esCompensatorio,
        notas: r.notas,
      })),
    }));

  const mueblesActivos: MuebleParaSelector[] = mueblesDB.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    proyectoCodigo: m.proyecto.codigo,
    proyectoNombre: m.proyecto.nombre,
    proyectoId: m.proyecto.id,
    procesoActual: m.procesoActual,
  }));

  return { empleados, mueblesActivos };
}
