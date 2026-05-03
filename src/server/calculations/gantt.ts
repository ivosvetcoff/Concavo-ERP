import type { EstadoItem, ProcesoTecnico, EspecialidadEmpleado } from "@prisma/client";
import {
  lunesDeSemana,
  siguienteLunes,
  horasLaborablesSemana,
} from "@/lib/festivos-mx";

// ===== CONSTANTES =====

// Especialidad responsable de cada proceso de producción planificable
export const ESPECIALIDAD_POR_PROCESO: Partial<Record<ProcesoTecnico, EspecialidadEmpleado>> = {
  HABILITADO: "HABILITADOR",
  ARMADO: "ARMADOR",
  COMPLEMENTOS: "ARMADOR",
  PULIDO: "PULIDOR",
  LACA: "LAQUEADOR",
  EMPAQUE: "ARMADOR",
  // EXTERNO: tercero externo, no consume operadores internos
  // LISTO_PARA_ENTREGA, ENTREGADO: no son procesos de producción
};

// Orden secuencial de procesos planificables dentro de un mueble
export const ORDEN_PROCESOS: ProcesoTecnico[] = [
  "HABILITADO",
  "ARMADO",
  "PULIDO",
  "LACA",
  "COMPLEMENTOS",
  "EMPAQUE",
];

// ===== TIPOS =====

export type OperadorPlanificacion = {
  empleadoId: string;
  especialidad: EspecialidadEmpleado;
  horasSemanalesTO: number; // capacidad semanal ordinaria (típicamente 40)
};

export type MueblePlanificacion = {
  muebleId: string;
  cantidad: number;
  horasEstimadasHabilitado: number | null;
  horasEstimadasArmado: number | null;
  horasEstimadasPulido: number | null;
  horasEstimadasLaca: number | null;
  horasEstimadasComplementos: number | null;
  horasEstimadasEmpaque: number | null;
  estadoItem: EstadoItem;
};

export type TareaExistente = {
  empleadoId: string;
  semana: Date;  // cualquier fecha de la semana (se normaliza a lunes)
  horasTO: number;
  horasTE: number;
  esCompensatorio: boolean;
};

export type SegmentoPlan = {
  muebleId: string;
  proceso: ProcesoTecnico;
  empleadoId: string;
  semana: Date;  // lunes de la semana
  horasPlanificadas: number;
};

export type ConflictoGantt = {
  tipo: "SOBRECARGA" | "SIN_OPERADOR_DISPONIBLE";
  empleadoId?: string;
  semana?: Date;
  descripcion: string;
};

export type PlanCalculado = {
  segmentos: SegmentoPlan[];
  fechaFinEst: Date;       // último lunes en que hay trabajo planificado
  horasTotalesEst: number;
  conflictos: ConflictoGantt[];
};

// Para cálculo de avance (acepta strings de Prisma Decimal o numbers)
export type MuebleParaAvance = {
  horasEstimadasHabilitado: string | number | null;
  horasEstimadasArmado: string | number | null;
  horasEstimadasPulido: string | number | null;
  horasEstimadasLaca: string | number | null;
  horasEstimadasComplementos: string | number | null;
  horasEstimadasEmpaque: string | number | null;
  cantidad: number;
};

export type RegistroParaAvance = {
  horasTO: string | number;
  horasTE: string | number;
  esCompensatorio: boolean;
};

// ===== FUNCIONES PURAS DE CÁLCULO =====

/**
 * Suma de horas estimadas de todos los procesos × cantidad.
 * Retorna null si el mueble no tiene ninguna hora estimada cargada.
 */
export function calcularHorasEstimadasMueble(mueble: MuebleParaAvance): number | null {
  const valores = [
    mueble.horasEstimadasHabilitado,
    mueble.horasEstimadasArmado,
    mueble.horasEstimadasPulido,
    mueble.horasEstimadasLaca,
    mueble.horasEstimadasComplementos,
    mueble.horasEstimadasEmpaque,
  ];

  const tieneAlguna = valores.some((v) => v != null && Number(v) > 0);
  if (!tieneAlguna) return null;

  const suma = valores.reduce<number>((acc, v) => acc + (v != null ? Number(v) : 0), 0);
  return suma * mueble.cantidad;
}

/**
 * Total de horas reales trabajadas en un mueble (T.O. + T.E. de todos los registros).
 */
export function calcularHorasRealesMueble(registros: RegistroParaAvance[]): number {
  return registros.reduce(
    (acc, r) => acc + Number(r.horasTO) + Number(r.horasTE),
    0
  );
}

/**
 * Porcentaje de avance del mueble: horas reales / horas estimadas × 100.
 * Retorna null si no hay horas estimadas. Tope en 100%.
 */
export function calcularPorcentajeAvance(
  mueble: MuebleParaAvance,
  registros: RegistroParaAvance[]
): number | null {
  const estimadas = calcularHorasEstimadasMueble(mueble);
  if (estimadas === null || estimadas === 0) return null;

  const reales = calcularHorasRealesMueble(registros);
  const pct = (reales / estimadas) * 100;
  return Math.min(Math.round(pct * 10) / 10, 100);
}

/**
 * Horas de demora que introduce la T.E.
 * T.E. compensatoria = operador absorbió el retraso → 0 demora adicional al Gantt.
 * T.E. por sobrecarga → esas horas representan trabajo más allá de lo planeado.
 */
export function calcularImpactoTE(horasTE: number, esCompensatorio: boolean): number {
  return esCompensatorio ? 0 : horasTE;
}

/**
 * Horas ya comprometidas de un operador en una semana dada,
 * contando tareas existentes + segmentos ya planificados.
 */
export function horasComprometidas(
  empleadoId: string,
  semana: Date,
  tareasActivas: TareaExistente[],
  segmentos: SegmentoPlan[]
): number {
  const key = lunesDeSemana(semana).getTime();

  const deTareas = tareasActivas
    .filter(
      (t) =>
        t.empleadoId === empleadoId &&
        lunesDeSemana(t.semana).getTime() === key
    )
    .reduce((s, t) => s + t.horasTO, 0);

  const deSegmentos = segmentos
    .filter(
      (s) =>
        s.empleadoId === empleadoId &&
        lunesDeSemana(s.semana).getTime() === key
    )
    .reduce((s, seg) => s + seg.horasPlanificadas, 0);

  return deTareas + deSegmentos;
}

/**
 * ¿Está el operador sobrecargado en esa semana?
 * Compara horas comprometidas con la capacidad semanal ordinaria.
 */
export function detectarSobrecarga(
  empleadoId: string,
  semana: Date,
  capacidadSemanal: number,
  tareasActivas: TareaExistente[],
  segmentos: SegmentoPlan[]
): boolean {
  return horasComprometidas(empleadoId, semana, tareasActivas, segmentos) > capacidadSemanal;
}

/**
 * Horas T.O. disponibles para un operador en una semana.
 * Respeta feriados (reduce capacidad efectiva del semana) y tareas ya cargadas.
 */
export function horasDisponiblesSemana(
  empleadoId: string,
  semana: Date,
  capacidadSemanal: number,
  tareasActivas: TareaExistente[],
  segmentos: SegmentoPlan[]
): number {
  const { horasTO: maxDias } = horasLaborablesSemana(semana);
  const capacidadEfectiva = Math.min(capacidadSemanal, maxDias);
  const comprometidas = horasComprometidas(empleadoId, semana, tareasActivas, segmentos);
  return Math.max(0, capacidadEfectiva - comprometidas);
}

// ===== PLANIFICACIÓN =====

function getHorasEstimadasProceso(m: MueblePlanificacion, p: ProcesoTecnico): number | null {
  switch (p) {
    case "HABILITADO":   return m.horasEstimadasHabilitado;
    case "ARMADO":       return m.horasEstimadasArmado;
    case "PULIDO":       return m.horasEstimadasPulido;
    case "LACA":         return m.horasEstimadasLaca;
    case "COMPLEMENTOS": return m.horasEstimadasComplementos;
    case "EMPAQUE":      return m.horasEstimadasEmpaque;
    default:             return null;
  }
}

/**
 * Planifica un proceso para un mueble a partir de fechaInicio.
 * Asigna horas semanalmente al operador con más disponibilidad.
 * El siguiente proceso del mismo mueble NO puede arrancar hasta que este termine.
 */
export function planificarProceso(
  muebleId: string,
  proceso: ProcesoTecnico,
  horasTotal: number,
  operadores: OperadorPlanificacion[],
  tareasActivas: TareaExistente[],
  segmentosAcumulados: SegmentoPlan[],
  fechaInicio: Date
): { segmentos: SegmentoPlan[]; semanaFin: Date; conflictos: ConflictoGantt[] } {
  const conflictos: ConflictoGantt[] = [];
  const especialidad = ESPECIALIDAD_POR_PROCESO[proceso];

  if (!especialidad) {
    // Proceso sin especialidad interna (EXTERNO, etc.) — no genera segmentos
    return { segmentos: [], semanaFin: lunesDeSemana(fechaInicio), conflictos: [] };
  }

  const elegibles = operadores.filter((o) => o.especialidad === especialidad);
  if (elegibles.length === 0) {
    conflictos.push({
      tipo: "SIN_OPERADOR_DISPONIBLE",
      descripcion: `Sin operadores ${especialidad} para ${proceso}`,
    });
    return { segmentos: [], semanaFin: lunesDeSemana(fechaInicio), conflictos };
  }

  const nuevos: SegmentoPlan[] = [];
  let restantes = horasTotal;
  let semana = lunesDeSemana(fechaInicio);
  const MAX_ITER = 104; // tope de 2 años como seguro

  for (let iter = 0; iter < MAX_ITER && restantes > 0; iter++) {
    const todos = [...segmentosAcumulados, ...nuevos];

    // Operador con más horas disponibles esta semana
    let mejorOp = elegibles[0];
    let mejorHoras = horasDisponiblesSemana(
      mejorOp.empleadoId,
      semana,
      mejorOp.horasSemanalesTO,
      tareasActivas,
      todos
    );

    for (const op of elegibles.slice(1)) {
      const h = horasDisponiblesSemana(
        op.empleadoId,
        semana,
        op.horasSemanalesTO,
        tareasActivas,
        todos
      );
      if (h > mejorHoras) {
        mejorOp = op;
        mejorHoras = h;
      }
    }

    if (mejorHoras === 0) {
      // Todos llenos esta semana → avanzar
      semana = siguienteLunes(semana);
      continue;
    }

    const asignadas = Math.min(mejorHoras, restantes);
    nuevos.push({
      muebleId,
      proceso,
      empleadoId: mejorOp.empleadoId,
      semana: new Date(semana),
      horasPlanificadas: asignadas,
    });
    restantes -= asignadas;

    if (restantes > 0) semana = siguienteLunes(semana);
  }

  const ultimo = nuevos[nuevos.length - 1];
  const semanaFin = ultimo ? new Date(ultimo.semana) : lunesDeSemana(fechaInicio);

  return { segmentos: nuevos, semanaFin, conflictos };
}

/**
 * Planifica todos los procesos de todos los muebles activos de un proyecto.
 *
 * Reglas:
 * - Dentro de cada mueble los procesos son secuenciales (ARMADO espera a que HABILITADO termine).
 * - Diferentes muebles corren en paralelo (el load-balancing entre operadores lo maneja planificarProceso).
 * - Muebles CANCELADOS y ENTREGADOS se omiten.
 */
export function planificarProyecto(
  muebles: MueblePlanificacion[],
  operadores: OperadorPlanificacion[],
  tareasActivas: TareaExistente[],
  fechaInicio: Date
): PlanCalculado {
  const todosSegmentos: SegmentoPlan[] = [];
  const todosConflictos: ConflictoGantt[] = [];
  let semanaFinGlobal = lunesDeSemana(fechaInicio);
  let horasTotalesEst = 0;

  const activos = muebles.filter(
    (m) => m.estadoItem !== "CANCELADO" && m.estadoItem !== "ENTREGADO"
  );

  for (const mueble of activos) {
    // semanaInicioProc: el próximo proceso del mueble no puede empezar hasta que termine el anterior
    let semanaInicioProc = lunesDeSemana(fechaInicio);

    for (const proceso of ORDEN_PROCESOS) {
      const horasEst = getHorasEstimadasProceso(mueble, proceso);
      if (horasEst == null || horasEst === 0) continue;

      const horasTotal = horasEst * mueble.cantidad;
      horasTotalesEst += horasTotal;

      const { segmentos, semanaFin, conflictos } = planificarProceso(
        mueble.muebleId,
        proceso,
        horasTotal,
        operadores,
        tareasActivas,
        todosSegmentos,
        semanaInicioProc
      );

      todosSegmentos.push(...segmentos);
      todosConflictos.push(...conflictos);

      // El siguiente proceso del mismo mueble empieza la semana después de que éste termina
      semanaInicioProc = siguienteLunes(semanaFin);
    }

    const semanaFinMueble = todosSegmentos
      .filter((s) => s.muebleId === mueble.muebleId)
      .reduce(
        (max, s) => (s.semana > max ? s.semana : max),
        lunesDeSemana(fechaInicio)
      );

    if (semanaFinMueble > semanaFinGlobal) semanaFinGlobal = semanaFinMueble;
  }

  return {
    segmentos: todosSegmentos,
    fechaFinEst: semanaFinGlobal,
    horasTotalesEst,
    conflictos: todosConflictos,
  };
}

/**
 * Re-planifica en cascada cuando hay cambios (registros reales que difieren del plan).
 * Si el plan está bloqueado manualmente, devuelve el mismo sin cambios.
 *
 * En esta versión calcula un plan limpio desde cero; en Sprint 3 se refinará
 * para preservar trabajo ya completado y solo desplazar lo pendiente.
 */
export function recalcularEnCascada(
  muebles: MueblePlanificacion[],
  operadores: OperadorPlanificacion[],
  tareasActivas: TareaExistente[],
  fechaBase: Date,
  bloqueado: boolean,
  planActual?: PlanCalculado
): PlanCalculado {
  if (bloqueado && planActual) return planActual;
  return planificarProyecto(muebles, operadores, tareasActivas, fechaBase);
}
