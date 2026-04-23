import { z } from "zod";

export const registrarAnticipoSchema = z.object({
  proyectoId: z.string().cuid(),
  monto: z
    .string()
    .min(1, "El monto es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Monto inválido",
    }),
  porcentaje: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100), {
      message: "Porcentaje debe ser entre 0 y 100",
    }),
  fecha: z.coerce.date(),
  metodoPago: z.string().min(1, "El método de pago es requerido").max(50),
  cfdiEmitido: z.boolean().default(false),
  numeroCFDI: z.string().max(50).optional().or(z.literal("")),
  notas: z.string().max(300).optional().or(z.literal("")),
});

export const eliminarAnticipoSchema = z.object({
  anticipoId: z.string().cuid(),
  proyectoId: z.string().cuid(),
});

export type RegistrarAnticipoInput = z.infer<typeof registrarAnticipoSchema>;
export type EliminarAnticipoInput = z.infer<typeof eliminarAnticipoSchema>;
