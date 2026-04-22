import { z } from "zod";
import { TipoCompra, Moneda } from "@prisma/client";

export const crearCompraSchema = z
  .object({
    fecha: z.coerce.date(),
    proveedor: z.string().min(1, "El proveedor es requerido").max(100),
    descripcion: z.string().min(1, "La descripción es requerida").max(300),
    monto: z
      .string()
      .min(1, "El monto es requerido")
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
        message: "Monto inválido",
      }),
    moneda: z.nativeEnum(Moneda).default("MXN"),
    tipo: z.nativeEnum(TipoCompra),
    proyectoId: z.string().cuid().optional(),
    categoria: z.string().max(50).optional().or(z.literal("")),
    numeroCFDIRecibido: z.string().max(50).optional().or(z.literal("")),
    rfcProveedor: z
      .string()
      .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.tipo === "PROYECTO" && !data.proyectoId) {
        return false;
      }
      return true;
    },
    {
      message: "Las compras de tipo PROYECTO requieren un proyecto",
      path: ["proyectoId"],
    }
  );

export type CrearCompraInput = z.infer<typeof crearCompraSchema>;
