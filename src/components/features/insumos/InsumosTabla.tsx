"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMXN } from "@/lib/format";
import { registrarInsumo, eliminarInsumo } from "@/server/actions/insumos";
import { crearInsumoSchema, type CrearInsumoInput } from "@/schemas/insumo";
import type { InsumoRow } from "@/server/queries/insumos";
import { UnidadCompra } from "@prisma/client";
import { uploadComprobanteAction } from "@/server/actions/comprobante";

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

const UNIDADES: UnidadCompra[] = [
  "HOJA", "PIE_TABLA", "PIEZA", "METRO", "PEDIDO", "ENVIO",
  "KILOGRAMO", "LITRO", "PAQUETE", "JUEGO", "GALON", "CAJA",
  "CM", "ROLLO", "RECOLECCION", "GRUPO",
];

const unidadLabel: Record<UnidadCompra, string> = {
  HOJA: "Hoja", PIE_TABLA: "Pie tabla", PIEZA: "Pieza", METRO: "Metro",
  PEDIDO: "Pedido", ENVIO: "Envío", KILOGRAMO: "Kilogramo", LITRO: "Litro",
  PAQUETE: "Paquete", JUEGO: "Juego", GALON: "Galón", CAJA: "Caja",
  CM: "Cm", ROLLO: "Rollo", RECOLECCION: "Recolección", GRUPO: "Grupo",
};

function NuevoInsumoSheet({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<CrearInsumoInput>({
      resolver: zodResolver(crearInsumoSchema),
      defaultValues: {
        fecha: new Date().toISOString().split("T")[0] as unknown as Date,
        qty: "1",
        unidad: "PIEZA",
      },
    });

  async function onSubmit(data: CrearInsumoInput) {
    setLoading(true);
    try {
      let comprobanteUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadComprobanteAction(formData, "insumos");
        if (!res.ok) throw new Error(res.error);
        comprobanteUrl = res.url;
      }

      await registrarInsumo({ ...data, comprobante: comprobanteUrl });
      toast.success("Insumo registrado");
      reset();
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar insumo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Nuevo insumo
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Registrar insumo</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
              <Input id="fecha" type="date" {...register("fecha")} />
              {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" placeholder="Ej. Embalaje, Herramientas…" {...register("categoria")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></Label>
            <Input id="descripcion" placeholder="Ej. Cinta de embalaje 48mm" {...register("descripcion")} />
            {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Proveedor <span className="text-red-500">*</span></Label>
            <Input id="proveedor" placeholder="Nombre del proveedor" {...register("proveedor")} />
            {errors.proveedor && <p className="text-xs text-red-500">{errors.proveedor.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="idFactura">ID Factura</Label>
              <Input id="idFactura" placeholder="Ej. C25605" {...register("idFactura")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metodoPago">Método <span className="text-red-500">*</span></Label>
              <select
                {...register("metodoPago")}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">Seleccionar…</option>
                {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.metodoPago && <p className="text-xs text-red-500">{errors.metodoPago.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad <span className="text-red-500">*</span></Label>
              <Input id="qty" type="number" step="0.001" min="0" placeholder="1" {...register("qty")} />
              {errors.qty && <p className="text-xs text-red-500">{errors.qty.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Unidad <span className="text-red-500">*</span></Label>
              <Select defaultValue="PIEZA" onValueChange={(v) => setValue("unidad", v as UnidadCompra)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{unidadLabel[u]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isOwner && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="importe">Importe (sin IVA) <span className="text-red-500">*</span></Label>
                <Input id="importe" type="number" step="0.01" min="0" placeholder="0.00" {...register("importe")} />
                {errors.importe && <p className="text-xs text-red-500">{errors.importe.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iva">IVA</Label>
                <Input id="iva" type="number" step="0.01" min="0" placeholder="0.00" {...register("iva")} />
              </div>
            </div>
          )}

          {!isOwner && (
            <input type="hidden" {...register("importe")} value="0" />
          )}

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
            {loading ? "Guardando…" : "Registrar insumo"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function InsumosTabla({
  insumos,
  isOwner,
}: {
  insumos: InsumoRow[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [insumoAEliminar, setInsumoAEliminar] = useState<InsumoRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const total = isOwner
    ? insumos.reduce((acc, i) => acc + parseFloat((i.total ?? 0).toString()), 0)
    : null;

  async function handleEliminar() {
    if (!insumoAEliminar) return;
    setEliminando(true);
    try {
      await eliminarInsumo({ insumoId: insumoAEliminar.id });
      toast.success("Insumo eliminado");
      setInsumoAEliminar(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar insumo");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {insumos.length} insumo{insumos.length !== 1 ? "s" : ""}
            </span>
            {isOwner && total !== null && insumos.length > 0 && (
              <span className="text-sm font-semibold tabular-nums">
                Total: {formatMXN(total.toString())}
              </span>
            )}
          </div>
          <NuevoInsumoSheet isOwner={isOwner} />
        </div>

        {insumos.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white border rounded-md">
            No hay insumos registrados para este período.
          </div>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Proveedor</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoría</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty / Unidad</th>
                  {isOwner && (
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                  )}
                  <th className="py-2 px-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-xs tabular-nums text-gray-500 whitespace-nowrap">
                      {formatDate(i.fecha)}
                    </td>
                    <td className="py-2.5 px-3 font-medium max-w-[200px] truncate" title={i.descripcion}>
                      {i.descripcion}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{i.proveedor}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">
                      {i.categoria ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs tabular-nums whitespace-nowrap">
                      {i.qty.toString()} {unidadLabel[i.unidad]}
                    </td>
                    {isOwner && (
                      <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                        {i.total ? formatMXN(i.total.toString()) : "—"}
                      </td>
                    )}
                    <td className="py-2.5 px-3">
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-gray-400 hover:text-red-500"
                          onClick={() => setInsumoAEliminar(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={insumoAEliminar !== null}
        onOpenChange={(o) => !o && setInsumoAEliminar(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar insumo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-4">
            ¿Eliminar <span className="font-semibold">"{insumoAEliminar?.descripcion}"</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" disabled={eliminando} onClick={handleEliminar}>
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
