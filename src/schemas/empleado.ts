import { z } from "zod";

export const empleadoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  apellido: z.string().max(100).optional().or(z.literal("")),
  iniciales: z.string().max(5).optional().or(z.literal("")),
  especialidad: z.enum([
    "HABILITADOR",
    "ARMADOR",
    "PULIDOR",
    "LAQUEADOR",
    "ADMINISTRATIVO",
  ]),
  tarifaHoraTO: z.coerce
    .number({ invalid_type_error: "Ingresa un número válido" })
    .positive("La tarifa debe ser mayor a 0"),
  tarifaHoraTE: z.coerce
    .number({ invalid_type_error: "Ingresa un número válido" })
    .positive("La tarifa debe ser mayor a 0"),
  sueldoSemanal: z.coerce.number().nonnegative().optional().nullable(),
  fechaIngreso: z.string().optional().or(z.literal("")),
  activo: z.boolean().default(true),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido (ej: #3B82F6)")
    .optional()
    .or(z.literal("")),
  rfc: z.string().max(13).optional().or(z.literal("")),
  nss: z.string().max(11).optional().or(z.literal("")),
});

export type EmpleadoInput = z.infer<typeof empleadoSchema>;
