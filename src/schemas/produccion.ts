import { z } from "zod";
import { ProcesoTecnico } from "@prisma/client";

export const upsertRegistroSchema = z.object({
  empleadoId: z.string().cuid(),
  muebleId: z.string().cuid(),
  proceso: z.nativeEnum(ProcesoTecnico),
  semana: z.coerce.date(),
  horasTO: z.coerce.number().min(0).max(80),
  horasTE: z.coerce.number().min(0).max(80),
  esCompensatorio: z.boolean().default(false),
  notas: z.string().max(300).optional().or(z.literal("")),
});

export const eliminarRegistroSchema = z.object({
  registroId: z.string().cuid(),
});

export type UpsertRegistroInput = z.infer<typeof upsertRegistroSchema>;
