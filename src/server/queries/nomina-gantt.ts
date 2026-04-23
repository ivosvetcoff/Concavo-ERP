import { db } from "@/lib/db";
import Decimal from "decimal.js";
import type { EspecialidadEmpleado } from "@prisma/client";
import { getMondayOf } from "./produccion";
import { addDays, startOfDay } from "date-fns";

export type NominaFila = {
  empleadoId: string;
  nombre: string;
  apellido: string | null;
  especialidad: EspecialidadEmpleado;
  color: string | null;
  sueldoSemanal: string | null;
  tarifaHoraTE: string;
  // Horas registradas en la semana
  horasTO: string;
  horasTE: string;
  // Cálculo pre-nómina
  montoExtras: string;
  total: string;
  // Estado de pago (si ya existe un PagoNomina)
  pagoId: string | null;
  pagado: boolean;
  fechaPago: string | null;
  notas: string | null;
};

export async function obtenerNominaSemana(semana: Date): Promise<NominaFila[]> {
  const inicio = startOfDay(getMondayOf(semana));
  const fin = addDays(inicio, 7);

  const [empleados, pagosExistentes] = await Promise.all([
    db.empleado.findMany({
      where: { activo: true, especialidad: { not: "ADMINISTRATIVO" } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        color: true,
        sueldoSemanal: true,
        tarifaHoraTE: true,
        registros: {
          where: { semana: { gte: inicio, lt: fin } },
          select: { horasTO: true, horasTE: true },
        },
      },
      orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
    }),
    db.pagoNomina.findMany({
      where: { semana: { gte: inicio, lt: fin } },
      select: {
        id: true,
        empleadoId: true,
        pagado: true,
        fechaPago: true,
        notas: true,
        montoExtras: true,
        total: true,
      },
    }),
  ]);

  const pagoMap = new Map(pagosExistentes.map((p) => [p.empleadoId, p]));

  return empleados.map((e) => {
    const horasTO = e.registros.reduce(
      (s, r) => s.plus(r.horasTO.toString()),
      new Decimal(0)
    );
    const horasTE = e.registros.reduce(
      (s, r) => s.plus(r.horasTE.toString()),
      new Decimal(0)
    );

    const tarifaTE = new Decimal(e.tarifaHoraTE.toString());
    const montoExtras = horasTE.mul(tarifaTE);
    const sueldoBase = e.sueldoSemanal ? new Decimal(e.sueldoSemanal.toString()) : new Decimal(0);
    const total = sueldoBase.plus(montoExtras);

    const pago = pagoMap.get(e.id);

    return {
      empleadoId: e.id,
      nombre: e.nombre,
      apellido: e.apellido,
      especialidad: e.especialidad,
      color: e.color,
      sueldoSemanal: e.sueldoSemanal?.toString() ?? null,
      tarifaHoraTE: tarifaTE.toFixed(2),
      horasTO: horasTO.toFixed(1),
      horasTE: horasTE.toFixed(1),
      montoExtras: pago?.montoExtras.toString() ?? montoExtras.toFixed(2),
      total: pago?.total.toString() ?? total.toFixed(2),
      pagoId: pago?.id ?? null,
      pagado: pago?.pagado ?? false,
      fechaPago: pago?.fechaPago?.toISOString() ?? null,
      notas: pago?.notas ?? null,
    };
  });
}

// ── Reporte de ocupación semanal (M18) ────────────────────────────────────────

export type OcupacionEmpleado = {
  empleadoId: string;
  nombre: string;
  apellido: string | null;
  especialidad: EspecialidadEmpleado;
  color: string | null;
  // horas disponibles: 48h (lun–sáb, 8h/día)
  horasDisponibles: number;
  horasTO: number;
  horasTE: number;
  horasTotales: number;
  pctOcupacion: number; // 0–100
  proyectos: { proyectoCodigo: string; proyectoNombre: string; horas: number }[];
};

export type ResumenOcupacion = {
  semana: string; // ISO yyyy-MM-dd
  empleados: OcupacionEmpleado[];
  totalDisponible: number;
  totalOcupado: number;
  pctGlobal: number;
};

const HORAS_DISPONIBLES_SEMANA = 48; // lun–sáb, 8h/día

export async function obtenerOcupacionSemanas(
  semanas: Date[]
): Promise<ResumenOcupacion[]> {
  return Promise.all(
    semanas.map(async (semana) => {
      const inicio = startOfDay(getMondayOf(semana));
      const fin = addDays(inicio, 7);

      const empleados = await db.empleado.findMany({
        where: { activo: true, especialidad: { not: "ADMINISTRATIVO" } },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          especialidad: true,
          color: true,
          registros: {
            where: { semana: { gte: inicio, lt: fin } },
            select: {
              horasTO: true,
              horasTE: true,
              mueble: {
                select: {
                  proyecto: { select: { codigo: true, nombre: true } },
                },
              },
            },
          },
        },
        orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
      });

      const filas: OcupacionEmpleado[] = empleados.map((e) => {
        const horasTO = e.registros.reduce(
          (s, r) => s + parseFloat(r.horasTO.toString()),
          0
        );
        const horasTE = e.registros.reduce(
          (s, r) => s + parseFloat(r.horasTE.toString()),
          0
        );
        const horasTotales = horasTO + horasTE;
        const pctOcupacion = Math.min(
          100,
          Math.round((horasTotales / HORAS_DISPONIBLES_SEMANA) * 100)
        );

        // Agrupar por proyecto
        const proyMap = new Map<string, { proyectoCodigo: string; proyectoNombre: string; horas: number }>();
        for (const r of e.registros) {
          const { codigo, nombre } = r.mueble.proyecto;
          const key = codigo;
          const prev = proyMap.get(key) ?? { proyectoCodigo: codigo, proyectoNombre: nombre, horas: 0 };
          prev.horas += parseFloat(r.horasTO.toString()) + parseFloat(r.horasTE.toString());
          proyMap.set(key, prev);
        }

        return {
          empleadoId: e.id,
          nombre: e.nombre,
          apellido: e.apellido,
          especialidad: e.especialidad,
          color: e.color,
          horasDisponibles: HORAS_DISPONIBLES_SEMANA,
          horasTO,
          horasTE,
          horasTotales,
          pctOcupacion,
          proyectos: Array.from(proyMap.values()).sort((a, b) => b.horas - a.horas),
        };
      });

      const totalDisponible = filas.length * HORAS_DISPONIBLES_SEMANA;
      const totalOcupado = filas.reduce((s, e) => s + e.horasTotales, 0);
      const pctGlobal = totalDisponible > 0
        ? Math.round((totalOcupado / totalDisponible) * 100)
        : 0;

      return {
        semana: inicio.toISOString().split("T")[0],
        empleados: filas,
        totalDisponible,
        totalOcupado,
        pctGlobal,
      };
    })
  );
}

// ── Gantt: tareas por empleado ────────────────────────────────────────────────

export type TareaGantt = {
  id: string;
  nombre: string; // "CAMA PRINCIPAL (Armado)"
  proyectoCodigo: string;
  proyectoNombre: string;
  proyectoId: string;
  muebleId: string;
  empleadoId: string;
  proceso: string;
  fechaInicio: string; // ISO
  fechaFin: string;    // ISO
  completada: boolean;
  color: string;       // del proyecto via empleado.color o palette
};

// Palette de colores para proyectos sin color asignado
const PALETTE = [
  "#4F46E5","#059669","#D97706","#DC2626","#7C3AED",
  "#0891B2","#BE185D","#65A30D","#EA580C","#0369A1",
];

export async function obtenerTareasGantt(
  desde: Date,
  hasta: Date
): Promise<{ empleados: { id: string; nombre: string; apellido: string | null; color: string | null; especialidad: string }[]; tareas: TareaGantt[] }> {
  const [tareasDB, empleadosDB] = await Promise.all([
    db.tarea.findMany({
      where: {
        fechaInicio: { lte: hasta },
        fechaFinEst: { gte: desde },
      },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true, color: true, especialidad: true } },
        mueble: {
          select: {
            id: true,
            nombre: true,
            proyecto: { select: { id: true, codigo: true, nombre: true } },
          },
        },
      },
      orderBy: { fechaInicio: "asc" },
    }),
    db.empleado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true, color: true, especialidad: true },
      orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
    }),
  ]);

  // Assign consistent color per project
  const proyColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const t of tareasDB) {
    const pid = t.mueble.proyecto.id;
    if (!proyColorMap.has(pid)) {
      proyColorMap.set(pid, PALETTE[colorIdx % PALETTE.length]);
      colorIdx++;
    }
  }

  const tareas: TareaGantt[] = tareasDB.map((t) => ({
    id: t.id,
    nombre: `${t.mueble.nombre} — ${t.proceso.replace(/_/g, " ")}`,
    proyectoCodigo: t.mueble.proyecto.codigo,
    proyectoNombre: t.mueble.proyecto.nombre,
    proyectoId: t.mueble.proyecto.id,
    muebleId: t.mueble.id,
    empleadoId: t.empleadoId,
    proceso: t.proceso,
    fechaInicio: t.fechaInicio.toISOString(),
    fechaFin: (t.fechaFinReal ?? t.fechaFinEst).toISOString(),
    completada: t.completada,
    color: proyColorMap.get(t.mueble.proyecto.id) ?? PALETTE[0],
  }));

  return { empleados: empleadosDB, tareas };
}
