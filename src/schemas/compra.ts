import { z } from "zod";
import { TipoCompra, CategoriaCompra, UnidadCompra } from "@prisma/client";

export const crearCompraSchema = z.object({
  fecha: z.coerce.date(),
  categoria: z.nativeEnum(CategoriaCompra),
  tipo: z.nativeEnum(TipoCompra),
  proyectoId: z.string().cuid().optional(),
  muebleNombre: z.string().max(200).optional().or(z.literal("")),
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
  numeroCFDIRecibido: z.string().max(50).optional().or(z.literal("")),
  rfcProveedor: z
    .string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido")
    .optional()
    .or(z.literal("")),
});

export type CrearCompraInput = z.infer<typeof crearCompraSchema>;
