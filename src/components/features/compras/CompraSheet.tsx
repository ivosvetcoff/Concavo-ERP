"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearCompraSchema, type CrearCompraInput } from "@/schemas/compra";
import { registrarCompra } from "@/server/actions/compras";
import { uploadComprobanteAction } from "@/server/actions/comprobante";

const CATEGORIAS = [
  { value: "MDF", label: "MDF" },
  { value: "SOLIDO", label: "Sólido" },
  { value: "COMPLEMENTOS", label: "Complementos" },
  { value: "ENVIOS", label: "Envíos" },
] as const;

const TIPOS = [
  { value: "INICIAL", label: "Inicial" },
  { value: "ADICIONAL", label: "Adicional" },
] as const;

const UNIDADES = [
  "HOJA",
  "PIE_TABLA",
  "PIEZA",
  "METRO",
  "PEDIDO",
  "ENVIO",
  "KILOGRAMO",
  "LITRO",
  "PAQUETE",
  "JUEGO",
  "GALON",
  "CAJA",
  "CM",
  "ROLLO",
  "RECOLECCION",
  "GRUPO",
] as const;

const UNIDAD_LABELS: Record<string, string> = {
  HOJA: "Hoja",
  PIE_TABLA: "Pie tabla",
  PIEZA: "Pieza",
  METRO: "Metro",
  PEDIDO: "Pedido",
  ENVIO: "Envío",
  KILOGRAMO: "Kilogramo",
  LITRO: "Litro",
  PAQUETE: "Paquete",
  JUEGO: "Juego",
  GALON: "Galón",
  CAJA: "Caja",
  CM: "cm",
  ROLLO: "Rollo",
  RECOLECCION: "Recolección",
  GRUPO: "Grupo",
};

const METODOS_PAGO = [
  "TC BANORTE",
  "TD BANORTE",
  "TRANS. BANORTE",
  "TC RODRIGO",
  "TD RODRIGO",
  "TRANS. RODRIGO",
  "TC MERCADO PAGO",
  "TRANS. MERCADO PAGO",
  "EFECTIVO",
];

type Proyecto = { id: string; codigo: string; nombre: string };

type Props = {
  proyectos: Proyecto[];
  proyectoIdDefault?: string;
  onSuccess?: () => void;
};

export function CompraSheet({ proyectos, proyectoIdDefault, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CrearCompraInput>({
    resolver: zodResolver(crearCompraSchema),
    defaultValues: {
      tipo: "INICIAL",
      unidad: "PIEZA",
      proyectoId: proyectoIdDefault ?? "",
    },
  });

  const importe = watch("importe");
  const iva = watch("iva");
  const totalCalc =
    importe && !isNaN(parseFloat(importe))
      ? (parseFloat(importe) + (iva && !isNaN(parseFloat(iva)) ? parseFloat(iva) : 0)).toFixed(2)
      : null;

  useEffect(() => {
    if (open) {
      setFile(null);
      reset({
        fecha: new Date().toISOString().split("T")[0] as unknown as Date,
        tipo: "INICIAL",
        unidad: "PIEZA",
        proyectoId: proyectoIdDefault ?? "",
      });
    }
  }, [open, reset, proyectoIdDefault]);

  async function onSubmit(values: CrearCompraInput) {
    setLoading(true);
    try {
      let comprobanteUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadComprobanteAction(formData, "compras");
        if (!res.ok) throw new Error(res.error);
        comprobanteUrl = res.url;
      }

      await registrarCompra({ ...values, comprobante: comprobanteUrl });
      toast.success("Compra registrada");
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar la compra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Registrar compra
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Registrar compra</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha">
              Fecha <span className="text-red-500">*</span>
            </Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && (
              <p className="text-xs text-red-500">{errors.fecha.message}</p>
            )}
          </div>

          {/* Categoría + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Categoría <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("categoria")}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">Seleccionar…</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <p className="text-xs text-red-500">{errors.categoria.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select
                {...register("tipo")}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proyecto */}
          <div className="space-y-1.5">
            <Label>Proyecto</Label>
            <select
              {...register("proyectoId")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Sin asignar / Por asignar</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.codigo} — {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descripcion"
              placeholder="MDF 12 ROBLE RUS. DES. 1C"
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500">{errors.descripcion.message}</p>
            )}
          </div>

          {/* Item / Mueble */}
          <div className="space-y-1.5">
            <Label htmlFor="muebleNombre">Ítem / Mueble</Label>
            <Input
              id="muebleNombre"
              placeholder="Nombre del mueble (opcional)"
              {...register("muebleNombre")}
            />
          </div>

          {/* Proveedor + Factura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">
                Proveedor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="proveedor"
                placeholder="Nombre del proveedor"
                {...register("proveedor")}
              />
              {errors.proveedor && (
                <p className="text-xs text-red-500">{errors.proveedor.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idFactura">No. Factura</Label>
              <Input
                id="idFactura"
                placeholder="C25605"
                {...register("idFactura")}
              />
            </div>
          </div>

          {/* Qty + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                Cantidad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qty"
                type="number"
                step="0.001"
                min="0"
                placeholder="1"
                {...register("qty")}
              />
              {errors.qty && (
                <p className="text-xs text-red-500">{errors.qty.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <select
                {...register("unidad")}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {UNIDAD_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Importe + IVA + Total calculado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="importe">
                Importe s/IVA <span className="text-red-500">*</span>
              </Label>
              <Input
                id="importe"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("importe")}
              />
              {errors.importe && (
                <p className="text-xs text-red-500">{errors.importe.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iva">IVA</Label>
              <Input
                id="iva"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("iva")}
              />
            </div>
          </div>
          {totalCalc && (
            <p className="text-sm text-gray-600 -mt-2">
              Total:{" "}
              <span className="font-semibold">
                $
                {parseFloat(totalCalc).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </p>
          )}

          {/* Método de pago */}
          <div className="space-y-1.5">
            <Label>
              Método de pago <span className="text-red-500">*</span>
            </Label>
            <select
              {...register("metodoPago")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Seleccionar…</option>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.metodoPago && (
              <p className="text-xs text-red-500">{errors.metodoPago.message}</p>
            )}
          </div>

          {/* CFDI recibido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="numeroCFDIRecibido">UUID CFDI recibido</Label>
              <Input
                id="numeroCFDIRecibido"
                placeholder="UUID del comprobante"
                {...register("numeroCFDIRecibido")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rfcProveedor">RFC proveedor</Label>
              <Input
                id="rfcProveedor"
                className="uppercase"
                placeholder="XAXX010101000"
                {...register("rfcProveedor")}
                onChange={(e) => setValue("rfcProveedor", e.target.value.toUpperCase())}
              />
              {errors.rfcProveedor && (
                <p className="text-xs text-red-500">{errors.rfcProveedor.message}</p>
              )}
            </div>
          </div>

          {/* Comprobante / Ticket (M16) */}
          <div className="space-y-1.5 mt-2">
            <Label htmlFor="comprobanteFile">Comprobante (opcional)</Label>
            <Input
              id="comprobanteFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs file:bg-gray-100 file:border-0 file:mr-2 file:px-2 file:py-1 file:rounded"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Guardando…" : "Registrar compra"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
