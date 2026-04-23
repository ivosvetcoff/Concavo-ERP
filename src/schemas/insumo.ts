import { z } from "zod";
import { UnidadCompra } from "@prisma/client";

export const crearInsumoSchema = z.object({
  fecha: z.coerce.date(),
  descripcion: z.string().min(1, "La descripción es requerida").max(300),
  proveedor: z.string().min(1, "El proveedor es requerido").max(100),
  idFactura: z.string().max(50).optional().or(z.literal("")),
  qty: z
    .string()
    .min(1, "La cantidad es requerida")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Cantidad inválida",
    }),
  unidad: z.nativeEnum(UnidadCompra),
  importe: z
    .string()
    .min(1, "El importe es requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Importe inválido",
    }),
  iva: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: "IVA inválido",
    }),
  metodoPago: z.string().min(1, "El método de pago es requerido").max(50),
  categoria: z.string().max(50).optional().or(z.literal("")),
  comprobante: z.string().optional().or(z.literal("")),
});

export const eliminarInsumoSchema = z.object({
  insumoId: z.string().cuid(),
});

export type CrearInsumoInput = z.infer<typeof crearInsumoSchema>;
export type EliminarInsumoInput = z.infer<typeof eliminarInsumoSchema>;
