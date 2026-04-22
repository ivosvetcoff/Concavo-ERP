import type { EstadoProyecto, Semaforo, EstadoTarea, ProcesoTecnico } from "@prisma/client";

// ===== SEMÁFORO =====

export const semaforoConfig: Record<
  Semaforo,
  { label: string; color: string; bg: string; badge: string }
> = {
  EN_TIEMPO: {
    label: "En tiempo",
    color: "text-green-700",
    bg: "bg-green-100",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  PRECAUCION: {
    label: "Precaución",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  ATRASADO: {
    label: "Atrasado",
    color: "text-red-600",
    bg: "bg-red-100",
    badge: "bg-red-100 text-red-600 border-red-200",
  },
  CRITICO: {
    label: "Crítico",
    color: "text-red-900",
    bg: "bg-red-200",
    badge: "bg-red-200 text-red-900 border-red-300",
  },
  PAUSA: {
    label: "Pausa",
    color: "text-gray-600",
    bg: "bg-gray-100",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

// ===== ESTADO PROYECTO =====

export const estadoProyectoConfig: Record<
  EstadoProyecto,
  { label: string; badge: string }
> = {
  COTIZACION: {
    label: "Cotización",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  EN_ESPERA: {
    label: "En espera",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  EN_COMPRAS: {
    label: "En compras",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  LISTA_DE_COMPRAS: {
    label: "Lista de compras",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  MATERIAL_EN_PISO: {
    label: "Material en piso",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
  },
  DESPIECE: {
    label: "Despiece",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
  },
  FABRICACION: {
    label: "Fabricación",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  POR_EMPACAR: {
    label: "Por empacar",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  ENTREGADO: {
    label: "Entregado",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  PAUSA: {
    label: "Pausa",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
  CANCELADO: {
    label: "Cancelado",
    badge: "bg-red-100 text-red-600 border-red-200",
  },
};

// ===== PROCESO TÉCNICO =====

export const procesoTecnicoConfig: Record<
  ProcesoTecnico,
  { label: string; orden: number; badge: string }
> = {
  HABILITADO: {
    label: "Habilitado",
    orden: 1,
    badge: "bg-sky-100 text-sky-700 border-sky-200",
  },
  ARMADO: {
    label: "Armado",
    orden: 2,
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  PULIDO: {
    label: "Pulido",
    orden: 3,
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  LACA: {
    label: "Laca",
    orden: 4,
    badge: "bg-pink-100 text-pink-700 border-pink-200",
  },
};

export const PROCESOS_ORDENADOS: ProcesoTecnico[] = [
  "HABILITADO",
  "ARMADO",
  "PULIDO",
  "LACA",
];

// ===== ESTADO TAREA =====

export const estadoTareaConfig: Record<
  EstadoTarea,
  { label: string; badge: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
  EN_PROCESO: {
    label: "En proceso",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  PAUSA: {
    label: "Pausa",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  OK: {
    label: "OK",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  RETRABAJO: {
    label: "Retrabajo",
    badge: "bg-red-100 text-red-600 border-red-200",
  },
  RE_TRABAJO: {
    label: "Re-trabajo",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
};
