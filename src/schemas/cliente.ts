import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  contacto: z.string().max(100).optional().or(z.literal("")),
  telefono: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  rfc: z
    .string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido")
    .optional()
    .or(z.literal("")),
  razonSocial: z.string().max(200).optional().or(z.literal("")),
  usoCFDIDefault: z.string().max(10).optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
