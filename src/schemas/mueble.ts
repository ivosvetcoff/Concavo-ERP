import { z } from "zod";
import { ProcesoTecnico, TipoTercero, EstadoItem, Estructura } from "@prisma/client";

const horasEstimadasFields = {
  horasEstimadasHabilitado: z.coerce.number().min(0).max(999).nullable().optional(),
  horasEstimadasArmado: z.coerce.number().min(0).max(999).nullable().optional(),
  horasEstimadasPulido: z.coerce.number().min(0).max(999).nullable().optional(),
  horasEstimadasLaca: z.coerce.number().min(0).max(999).nullable().optional(),
  horasEstimadasComplementos: z.coerce.number().min(0).max(999).nullable().optional(),
  horasEstimadasEmpaque: z.coerce.number().min(0).max(999).nullable().optional(),
};

export const crearMuebleSchema = z.object({
  proyectoId: z.string().cuid(),
  orden: z.string().max(20).optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es requerido").max(200),
  cantidad: z.coerce.number().int().min(1).default(1),
  madera: z.string().max(50).optional().or(z.literal("")),
  estructura: z.nativeEnum(Estructura).nullable().optional(),
  monto: z.string().optional().or(z.literal("")),
  descripcionLarga: z.string().max(500).optional().or(z.literal("")),
  terceros: z.array(z.nativeEnum(TipoTercero)).default([]),
  notasTerceros: z.string().max(300).optional().or(z.literal("")),
  estadoItem: z.nativeEnum(EstadoItem).optional(),
  procesoActual: z.nativeEnum(ProcesoTecnico).optional(),
  ...horasEstimadasFields,
});

export const actualizarMuebleSchema = z.object({
  muebleId: z.string().cuid(),
  proyectoId: z.string().cuid(),
  nombre: z.string().min(1, "El nombre es requerido").max(200),
  cantidad: z.coerce.number().int().min(1).default(1),
  madera: z.string().max(50).optional().or(z.literal("")),
  estructura: z.nativeEnum(Estructura).nullable().optional(),
  monto: z.string().optional().or(z.literal("")),
  descripcionLarga: z.string().max(500).optional().or(z.literal("")),
  terceros: z.array(z.nativeEnum(TipoTercero)).default([]),
  notasTerceros: z.string().max(300).optional().or(z.literal("")),
  estadoItem: z.nativeEnum(EstadoItem).optional(),
  procesoActual: z.nativeEnum(ProcesoTecnico).nullable().optional(),
  ...horasEstimadasFields,
});

export const eliminarMuebleSchema = z.object({
  muebleId: z.string().cuid(),
  proyectoId: z.string().cuid(),
});

export const cambiarProcesoSchema = z.object({
  muebleId: z.string().cuid(),
  procesoNuevo: z.nativeEnum(ProcesoTecnico).nullable(),
});

// Legacy — kept for backwards compatibility
export const actualizarProcesoSchema = z.object({
  muebleId: z.string().cuid(),
  procesoNuevo: z.nativeEnum(ProcesoTecnico),
});

export type CrearMuebleInput = z.infer<typeof crearMuebleSchema>;
export type ActualizarMuebleInput = z.infer<typeof actualizarMuebleSchema>;
export type EliminarMuebleInput = z.infer<typeof eliminarMuebleSchema>;
export type CambiarProcesoInput = z.infer<typeof cambiarProcesoSchema>;
export type ActualizarProcesoInput = z.infer<typeof actualizarProcesoSchema>;
