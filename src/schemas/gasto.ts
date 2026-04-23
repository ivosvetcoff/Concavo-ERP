import { z } from "zod";
import { ConceptoGastoFijo } from "@prisma/client";

export const guardarGastoFijoSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2024),
  concepto: z.nativeEnum(ConceptoGastoFijo),
  monto: z
    .string()
    .min(1, "El monto es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Monto inválido",
    }),
  pagado: z.boolean().default(false),
  notas: z.string().max(300).optional().or(z.literal("")),
});

export const guardarGastosFijosLoteSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2024),
  gastos: z.array(
    z.object({
      concepto: z.nativeEnum(ConceptoGastoFijo),
      monto: z.string(),
      pagado: z.boolean().default(false),
      notas: z.string().max(300).optional().or(z.literal("")),
    })
  ),
});

export type GuardarGastoFijoInput = z.infer<typeof guardarGastoFijoSchema>;
export type GuardarGastosFijosLoteInput = z.infer<typeof guardarGastosFijosLoteSchema>;
