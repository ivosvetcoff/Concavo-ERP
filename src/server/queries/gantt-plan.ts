import { db } from "@/lib/db";
import {
  planificarProyecto,
  calcularPorcentajeAvance,
} from "@/server/calculations/gantt";
import type {
  MueblePlanificacion,
  OperadorPlanificacion,
  TareaExistente,
  SegmentoPlan,
} from "@/server/calculations/gantt";
import { lunesDeSemana } from "@/lib/festivos-mx";
import type { EspecialidadEmpleado } from "@prisma/client";

// ─── Paleta de colores por proyecto ─────────────────────────────────────────

const PALETTE = [
  "#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED",
  "#0891B2", "#BE185D", "#65A30D", "#EA580C", "#0369A1",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function cargarOperadores(): Promise<OperadorPlanificacion[]> {
  const empleados = await db.empleado.findMany({
    where: { activo: true, especialidad: { not: "ADMINISTRATIVO" } },
    select: { id: true, especialidad: true },
  });
  return empleados.map((e) => ({
    empleadoId: e.id,
    especialidad: e.especialidad,
    horasSemanalesTO: 40,
  }));
}

const MUEBLE_SELECT = {
  id: true,
  nombre: true,
  cantidad: true,
  estadoItem: true,
  horasEstimadasHabilitado: true,
  horasEstimadasArmado: true,
  horasEstimadasPulido: true,
  horasEstimadasLaca: true,
  horasEstimadasComplementos: true,
  horasEstimadasEmpaque: true,
} as const;

type MuebleRaw = {
  id: string;
  cantidad: number;
  estadoItem: string;
  horasEstimadasHabilitado: { toString(): string } | null;
  horasEstimadasArmado: { toString(): string } | null;
  horasEstimadasPulido: { toString(): string } | null;
  horasEstimadasLaca: { toString(): string } | null;
  horasEstimadasComplementos: { toString(): string } | null;
  horasEstimadasEmpaque: { toString(): string } | null;
};

function toMueblePlan(m: MuebleRaw): MueblePlanificacion {
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

function segmentosATareas(segmentos: SegmentoPlan[]): TareaExistente[] {
  return segmentos.map((s) => ({
    empleadoId: s.empleadoId,
    semana: s.semana,
    horasTO: s.horasPlanificadas,
    horasTE: 0,
    esCompensatorio: false,
  }));
}

// ─── Plan de un proyecto (para Tab Planificación) ────────────────────────────

export type SegmentoPlanView = {
  muebleId: string;
  muebleNombre: string;
  proceso: string;
  empleadoId: string;
  empleadoNombre: string;
  semana: string;         // "YYYY-MM-DD" (lunes)
  horasPlanificadas: number;
};

export type AvanceMueble = {
  muebleId: string;
  muebleNombre: string;
  pct: number | null;     // null = sin estimaciones
};

export type PlanProyectoView = {
  fechaFinEst: string | null;       // "YYYY-MM-DD" o null
  horasTotalesEst: number;
  bloqueado: boolean;
  planId: string | null;
  segmentos: SegmentoPlanView[];
  avancePorMueble: AvanceMueble[];
  conflictos: string[];
  tieneEstimaciones: boolean;
};

export async function obtenerPlanProyecto(
  proyectoId: string
): Promise<PlanProyectoView> {
  const fechaBase = lunesDeSemana(new Date());

  const [proyectoDB, operadores, planGuardado] = await Promise.all([
    db.proyecto.findUniqueOrThrow({
      where: { id: proyectoId },
      select: {
        muebles: {
          where: { estadoItem: { notIn: ["CANCELADO", "ENTREGADO"] } },
          select: {
            ...MUEBLE_SELECT,
            registros: {
              select: { horasTO: true, horasTE: true, esCompensatorio: true },
            },
          },
        },
      },
    }),
    cargarOperadores(),
    db.planProyecto.findUnique({
      where: { proyectoId },
      select: { id: true, fechaFinEst: true, horasTotalesEst: true, bloqueado: true },
    }),
  ]);

  const tieneEstimaciones = proyectoDB.muebles.some((m) =>
    [
      m.horasEstimadasHabilitado,
      m.horasEstimadasArmado,
      m.horasEstimadasPulido,
      m.horasEstimadasLaca,
      m.horasEstimadasComplementos,
      m.horasEstimadasEmpaque,
    ].some((v) => v != null && parseFloat(v.toString()) > 0)
  );

  const empleadosDB = await db.empleado.findMany({
    where: { id: { in: operadores.map((o) => o.empleadoId) } },
    select: { id: true, nombre: true, apellido: true },
  });
  const empMap = new Map(
    empleadosDB.map((e) => [e.id, [e.nombre, e.apellido].filter(Boolean).join(" ")])
  );

  const avancePorMueble: AvanceMueble[] = proyectoDB.muebles.map((m) => ({
    muebleId: m.id,
    muebleNombre: m.nombre,
    pct: calcularPorcentajeAvance(
      {
        horasEstimadasHabilitado: m.horasEstimadasHabilitado?.toString() ?? null,
        horasEstimadasArmado: m.horasEstimadasArmado?.toString() ?? null,
        horasEstimadasPulido: m.horasEstimadasPulido?.toString() ?? null,
        horasEstimadasLaca: m.horasEstimadasLaca?.toString() ?? null,
        horasEstimadasComplementos: m.horasEstimadasComplementos?.toString() ?? null,
        horasEstimadasEmpaque: m.horasEstimadasEmpaque?.toString() ?? null,
        cantidad: m.cantidad,
      },
      m.registros.map((r) => ({
        horasTO: r.horasTO.toString(),
        horasTE: r.horasTE.toString(),
        esCompensatorio: r.esCompensatorio,
      }))
    ),
  }));

  // Plan bloqueado: devolver resumen guardado sin recomputar
  if (planGuardado?.bloqueado) {
    return {
      fechaFinEst: planGuardado.fechaFinEst.toISOString().split("T")[0],
      horasTotalesEst: parseFloat(planGuardado.horasTotalesEst.toString()),
      bloqueado: true,
      planId: planGuardado.id,
      segmentos: [],
      avancePorMueble,
      conflictos: [],
      tieneEstimaciones,
    };
  }

  const mueblesPlan = proyectoDB.muebles.map(toMueblePlan);
  const plan = planificarProyecto(mueblesPlan, operadores, [], fechaBase);

  const muebleNombreMap = new Map(
    proyectoDB.muebles.map((m) => [m.id, m.nombre])
  );

  const segmentos: SegmentoPlanView[] = plan.segmentos.map((s) => ({
    muebleId: s.muebleId,
    muebleNombre: muebleNombreMap.get(s.muebleId) ?? "—",
    proceso: s.proceso,
    empleadoId: s.empleadoId,
    empleadoNombre: empMap.get(s.empleadoId) ?? "—",
    semana: s.semana.toISOString().split("T")[0],
    horasPlanificadas: s.horasPlanificadas,
  }));

  return {
    fechaFinEst: plan.segmentos.length > 0
      ? plan.fechaFinEst.toISOString().split("T")[0]
      : null,
    horasTotalesEst: plan.horasTotalesEst,
    bloqueado: false,
    planId: planGuardado?.id ?? null,
    segmentos,
    avancePorMueble,
    conflictos: plan.conflictos.map((c) => c.descripcion),
    tieneEstimaciones,
  };
}

// ─── Plan del taller completo (para /gantt) ──────────────────────────────────

export type EmpleadoGantt = {
  id: string;
  nombre: string;
  especialidad: EspecialidadEmpleado;
  color: string | null;
};

export type ProyectoGanttInfo = {
  id: string;
  codigo: string;
  nombre: string;
  color: string;
};

export type SegmentoCelda = {
  proyectoId: string;
  proyectoCodigo: string;
  proyectoColor: string;
  muebleNombre: string;
  proceso: string;
  horasPlanificadas: number;
};

export type CeldaGantt = {
  empleadoId: string;
  semana: string;          // "YYYY-MM-DD" (lunes)
  horas: number;
  sobrecargado: boolean;
  segmentos: SegmentoCelda[];
};

export type PlanTallerView = {
  empleados: EmpleadoGantt[];
  proyectos: ProyectoGanttInfo[];
  celdas: CeldaGantt[];
  semanas: string[];       // 12 "YYYY-MM-DD"
};

export async function obtenerPlanTaller(): Promise<PlanTallerView> {
  const fechaBase = lunesDeSemana(new Date());

  const semanas: string[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(fechaBase);
    d.setDate(fechaBase.getDate() + i * 7);
    return d.toISOString().split("T")[0];
  });

  const [proyectosDB, operadores, empleadosDB] = await Promise.all([
    db.proyecto.findMany({
      where: { estado: { notIn: ["CANCELADO", "ENTREGADO"] } },
      orderBy: [{ fechaCompromiso: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        muebles: {
          where: { estadoItem: { notIn: ["CANCELADO", "ENTREGADO"] } },
          select: MUEBLE_SELECT,
        },
      },
    }),
    cargarOperadores(),
    db.empleado.findMany({
      where: { activo: true, especialidad: { not: "ADMINISTRATIVO" } },
      select: { id: true, nombre: true, apellido: true, especialidad: true, color: true },
      orderBy: [{ especialidad: "asc" }, { nombre: "asc" }],
    }),
  ]);

  const proyColorMap = new Map(
    proyectosDB.map((p, i) => [p.id, PALETTE[i % PALETTE.length]])
  );

  const muebleInfoMap = new Map<string, { nombre: string; proyectoId: string }>();
  for (const p of proyectosDB) {
    for (const m of p.muebles) {
      muebleInfoMap.set(m.id, { nombre: m.nombre, proyectoId: p.id });
    }
  }

  // Planificación en cascada entre proyectos (por orden de fechaCompromiso)
  const allSegmentos: SegmentoPlan[] = [];
  for (const proyecto of proyectosDB) {
    if (proyecto.muebles.length === 0) continue;
    const muebles = proyecto.muebles.map(toMueblePlan);
    const tareasExistentes = segmentosATareas(allSegmentos);
    const { segmentos } = planificarProyecto(muebles, operadores, tareasExistentes, fechaBase);
    allSegmentos.push(...segmentos);
  }

  // Construir mapa de celdas empleado×semana
  const celdaMap = new Map<string, CeldaGantt>();

  for (const s of allSegmentos) {
    const semanaISO = s.semana.toISOString().split("T")[0];
    const key = `${s.empleadoId}|${semanaISO}`;

    const info = muebleInfoMap.get(s.muebleId);
    if (!info) continue;
    const proy = proyectosDB.find((p) => p.id === info.proyectoId);
    if (!proy) continue;

    const color = proyColorMap.get(info.proyectoId) ?? PALETTE[0];

    if (!celdaMap.has(key)) {
      celdaMap.set(key, {
        empleadoId: s.empleadoId,
        semana: semanaISO,
        horas: 0,
        sobrecargado: false,
        segmentos: [],
      });
    }

    const celda = celdaMap.get(key)!;
    celda.horas += s.horasPlanificadas;
    celda.segmentos.push({
      proyectoId: info.proyectoId,
      proyectoCodigo: proy.codigo,
      proyectoColor: color,
      muebleNombre: info.nombre,
      proceso: s.proceso,
      horasPlanificadas: s.horasPlanificadas,
    });
  }

  for (const celda of celdaMap.values()) {
    celda.sobrecargado = celda.horas > 40;
  }

  const empleados: EmpleadoGantt[] = empleadosDB.map((e) => ({
    id: e.id,
    nombre: [e.nombre, e.apellido].filter(Boolean).join(" "),
    especialidad: e.especialidad,
    color: e.color,
  }));

  const proyectos: ProyectoGanttInfo[] = proyectosDB.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    color: proyColorMap.get(p.id) ?? PALETTE[0],
  }));

  return { empleados, proyectos, celdas: Array.from(celdaMap.values()), semanas };
}

// ─── Alertas Gantt (para dashboard) ─────────────────────────────────────────

export type AlertasGanttView = {
  sinEstimaciones: { id: string; codigo: string; nombre: string }[];
  sobrecargados: { empleadoNombre: string; semana: string; horas: number }[];
};

export async function obtenerAlertasGantt(): Promise<AlertasGanttView> {
  const [proyectosActivos, planTaller] = await Promise.all([
    db.proyecto.findMany({
      where: { estado: { notIn: ["CANCELADO", "ENTREGADO", "COTIZACION"] } },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        muebles: {
          select: {
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
    obtenerPlanTaller(),
  ]);

  const sinEstimaciones = proyectosActivos
    .filter((p) => {
      const tieneAlguna = p.muebles.some((m) =>
        [
          m.horasEstimadasHabilitado,
          m.horasEstimadasArmado,
          m.horasEstimadasPulido,
          m.horasEstimadasLaca,
          m.horasEstimadasComplementos,
          m.horasEstimadasEmpaque,
        ].some((v) => v != null && parseFloat(v.toString()) > 0)
      );
      return !tieneAlguna;
    })
    .slice(0, 5)
    .map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }));

  const empMap = new Map(planTaller.empleados.map((e) => [e.id, e.nombre]));

  const sobrecargados = planTaller.celdas
    .filter((c) => c.sobrecargado)
    .map((c) => ({
      empleadoNombre: empMap.get(c.empleadoId) ?? "—",
      semana: c.semana,
      horas: Math.round(c.horas),
    }))
    .slice(0, 5);

  return { sinEstimaciones, sobrecargados };
}
