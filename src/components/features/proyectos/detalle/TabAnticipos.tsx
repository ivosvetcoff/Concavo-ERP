"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMXN } from "@/lib/format";
import { registrarAnticipo, eliminarAnticipo } from "@/server/actions/anticipos";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";

type Anticipo = NonNullable<ProyectoDetalle["anticipos"]>[0];

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

const formSchema = z.object({
  monto: z.string().min(1, "El monto es requerido"),
  porcentaje: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  metodoPago: z.string().min(1, "El método de pago es requerido"),
  cfdiEmitido: z.boolean().default(false),
  numeroCFDI: z.string().optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function AnticipoSheet({
  proyectoId,
  montoProyecto,
}: {
  proyectoId: string;
  montoProyecto: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { cfdiEmitido: false },
  });

  const monto = watch("monto");
  const cfdiEmitido = watch("cfdiEmitido");

  const porcentajeCalc =
    monto && parseFloat(monto) > 0 && parseFloat(montoProyecto) > 0
      ? ((parseFloat(monto) / parseFloat(montoProyecto)) * 100).toFixed(1)
      : null;

  useEffect(() => {
    if (open) {
      reset({
        fecha: new Date().toISOString().split("T")[0],
        cfdiEmitido: false,
      });
    }
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await registrarAnticipo({
        proyectoId,
        monto: values.monto,
        porcentaje: values.porcentaje || undefined,
        fecha: new Date(values.fecha + "T12:00:00"),
        metodoPago: values.metodoPago,
        cfdiEmitido: values.cfdiEmitido,
        numeroCFDI: values.numeroCFDI || undefined,
        notas: values.notas || undefined,
      });
      toast.success("Anticipo registrado");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al registrar anticipo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Registrar anticipo
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar anticipo</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">
                Monto (MXN) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("monto")}
              />
              {errors.monto && (
                <p className="text-xs text-red-500">{errors.monto.message}</p>
              )}
              {porcentajeCalc && (
                <p className="text-xs text-gray-400">{porcentajeCalc}% del proyecto</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input id="fecha" type="date" {...register("fecha")} />
              {errors.fecha && (
                <p className="text-xs text-red-500">{errors.fecha.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="metodoPago">
              Método de pago <span className="text-red-500">*</span>
            </Label>
            <select
              id="metodoPago"
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

          <div className="flex items-center gap-2">
            <input
              id="cfdiEmitido"
              type="checkbox"
              {...register("cfdiEmitido")}
              className="rounded border-gray-300"
            />
            <Label htmlFor="cfdiEmitido" className="cursor-pointer font-normal">
              CFDI emitido
            </Label>
          </div>

          {cfdiEmitido && (
            <div className="space-y-1.5">
              <Label htmlFor="numeroCFDI">Número CFDI</Label>
              <Input
                id="numeroCFDI"
                placeholder="Ej. UUID del CFDI"
                {...register("numeroCFDI")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              placeholder="Comentarios opcionales"
              {...register("notas")}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Guardando…" : "Registrar anticipo"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function TabAnticipos({
  anticipos,
  proyectoId,
  montoProyecto,
}: {
  anticipos: NonNullable<ProyectoDetalle["anticipos"]>;
  proyectoId: string;
  montoProyecto: string;
}) {
  const router = useRouter();
  const [anticipoAEliminar, setAnticipoAEliminar] = useState<Anticipo | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const totalAnticipos = anticipos.reduce(
    (acc, a) => acc + parseFloat(a.monto.toString()),
    0
  );
  const montoNum = parseFloat(montoProyecto);
  const saldo = montoNum - totalAnticipos;

  async function handleEliminar() {
    if (!anticipoAEliminar) return;
    setEliminando(true);
    try {
      await eliminarAnticipo({ anticipoId: anticipoAEliminar.id, proyectoId });
      toast.success("Anticipo eliminado");
      setAnticipoAEliminar(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar anticipo");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Total proyecto</p>
            <p className="font-semibold tabular-nums text-gray-900">{formatMXN(montoProyecto)}</p>
          </div>
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Anticipos</p>
            <p className="font-semibold tabular-nums text-indigo-700">{formatMXN(totalAnticipos.toString())}</p>
          </div>
          <div className={`border rounded-lg p-3 ${saldo <= 0 ? "bg-green-50" : "bg-white"}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Saldo</p>
            <p className={`font-semibold tabular-nums ${saldo <= 0 ? "text-green-700" : "text-gray-900"}`}>
              {formatMXN(saldo.toString())}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {anticipos.length} anticipo{anticipos.length !== 1 ? "s" : ""}
          </span>
          <AnticipoSheet proyectoId={proyectoId} montoProyecto={montoProyecto} />
        </div>

        {anticipos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No hay anticipos registrados para este proyecto.
          </div>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Método
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    CFDI
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Monto
                  </th>
                  <th className="py-2 px-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {anticipos.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-xs tabular-nums text-gray-500">
                      {formatDate(a.fecha)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{a.metodoPago}</td>
                    <td className="py-2.5 px-3">
                      {a.cfdiEmitido ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          CFDI
                        </Badge>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                      {formatMXN(a.monto.toString())}
                      {a.porcentaje && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400">
                          ({a.porcentaje.toString()}%)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => setAnticipoAEliminar(a)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={anticipoAEliminar !== null}
        onOpenChange={(o) => !o && setAnticipoAEliminar(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar anticipo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-4">
            ¿Eliminar el anticipo de{" "}
            <span className="font-semibold">
              {anticipoAEliminar ? formatMXN(anticipoAEliminar.monto.toString()) : ""}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              disabled={eliminando}
              onClick={handleEliminar}
            >
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
