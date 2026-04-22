import { z } from "zod";
import {
  EstadoProyecto,
  Semaforo,
  Moneda,
  MetodoPago,
} from "@prisma/client";

export const crearProyectoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(200),
  clienteId: z.string().cuid("Cliente inválido"),
  po: z.string().max(50).optional().or(z.literal("")),
  estado: z.nativeEnum(EstadoProyecto).default("COTIZACION"),
  fechaPO: z.coerce.date().optional(),
  fechaCompromiso: z.coerce.date().optional(),
  montoVendido: z
    .string()
    .min(1, "El monto es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Monto inválido",
    }),
  anticipo: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: "Anticipo inválido",
    }),
  moneda: z.nativeEnum(Moneda).default("MXN"),
  tieneHC: z.boolean().default(false),
  comentarios: z.string().max(500).optional().or(z.literal("")),
});

export const actualizarProyectoSchema = crearProyectoSchema.partial();

export const ajustarMontoSchema = z.object({
  proyectoId: z.string().cuid(),
  montoNuevo: z
    .string()
    .min(1, "El monto es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Monto inválido",
    }),
  motivo: z
    .string()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500),
});

export const cambiarEstadoSchema = z.object({
  proyectoId: z.string().cuid(),
  estado: z.nativeEnum(EstadoProyecto),
});

export const marcarFacturadoSchema = z.object({
  proyectoId: z.string().cuid(),
  facturado: z.boolean(),
  numeroCFDI: z.string().max(50).optional().or(z.literal("")),
  rfcCliente: z
    .string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido")
    .optional()
    .or(z.literal("")),
  usoCFDI: z.string().max(10).optional().or(z.literal("")),
  metodoPago: z.nativeEnum(MetodoPago).optional(),
  formaPago: z.string().max(5).optional().or(z.literal("")),
  fechaFacturacion: z.coerce.date().optional(),
});

export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>;
export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>;
export type AjustarMontoInput = z.infer<typeof ajustarMontoSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type MarcarFacturadoInput = z.infer<typeof marcarFacturadoSchema>;
