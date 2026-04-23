import { z } from "zod";
import { EstatusPago } from "@prisma/client";

export const registrarPagoSchema = z.object({
  proyectoId: z.string().cuid(),
  monto: z
    .string()
    .min(1, "El monto es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Monto inválido",
    }),
  fecha: z.coerce.date(),
  metodoPago: z.string().min(1, "El método de pago es requerido").max(50),
  estatus: z.nativeEnum(EstatusPago).default("PENDIENTE"),
  cfdiEmitido: z.boolean().default(false),
  numeroCFDI: z.string().max(50).optional().or(z.literal("")),
  notas: z.string().max(300).optional().or(z.literal("")),
});

export const actualizarEstatusPagoSchema = z.object({
  pagoId: z.string().cuid(),
  proyectoId: z.string().cuid(),
  estatus: z.nativeEnum(EstatusPago),
});

export const eliminarPagoSchema = z.object({
  pagoId: z.string().cuid(),
  proyectoId: z.string().cuid(),
});

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type ActualizarEstatusPagoInput = z.infer<typeof actualizarEstatusPagoSchema>;
export type EliminarPagoInput = z.infer<typeof eliminarPagoSchema>;
