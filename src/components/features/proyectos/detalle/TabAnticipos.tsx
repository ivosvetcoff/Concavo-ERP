"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
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
import { registrarPago, actualizarEstatusPago, eliminarPago } from "@/server/actions/pagos";
import type { ProyectoDetalle, PagoDetalle } from "@/server/queries/proyecto-detalle";
import { EstatusPago } from "@prisma/client";
import Decimal from "decimal.js";

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

// ===== ANTICIPO SHEET =====

const anticipoFormSchema = z.object({
  monto: z.string().min(1, "El monto es requerido"),
  porcentaje: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  metodoPago: z.string().min(1, "El método de pago es requerido"),
  cfdiEmitido: z.boolean().default(false),
  numeroCFDI: z.string().optional(),
  notas: z.string().optional(),
});

type AnticipoFormValues = z.infer<typeof anticipoFormSchema>;

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

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<AnticipoFormValues>({
      resolver: zodResolver(anticipoFormSchema),
      defaultValues: { cfdiEmitido: false },
    });

  const monto = watch("monto");
  const cfdiEmitido = watch("cfdiEmitido");

  const porcentajeCalc =
    monto && parseFloat(monto) > 0 && parseFloat(montoProyecto) > 0
      ? ((parseFloat(monto) / parseFloat(montoProyecto)) * 100).toFixed(1)
      : null;

  useEffect(() => {
    if (open) reset({ fecha: new Date().toISOString().split("T")[0], cfdiEmitido: false });
  }, [open, reset]);

  async function onSubmit(values: AnticipoFormValues) {
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
      <SheetTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Anticipo
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar anticipo</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ant-monto">Monto (MXN) <span className="text-red-500">*</span></Label>
              <Input id="ant-monto" type="number" step="0.01" min="0" placeholder="0.00" {...register("monto")} />
              {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
              {porcentajeCalc && <p className="text-xs text-gray-400">{porcentajeCalc}% del proyecto</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ant-fecha">Fecha <span className="text-red-500">*</span></Label>
              <Input id="ant-fecha" type="date" {...register("fecha")} />
              {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ant-metodo">Método de pago <span className="text-red-500">*</span></Label>
            <select
              id="ant-metodo"
              {...register("metodoPago")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Seleccionar…</option>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.metodoPago && <p className="text-xs text-red-500">{errors.metodoPago.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input id="ant-cfdi" type="checkbox" {...register("cfdiEmitido")} className="rounded border-gray-300" />
            <Label htmlFor="ant-cfdi" className="cursor-pointer font-normal">CFDI emitido</Label>
          </div>

          {cfdiEmitido && (
            <div className="space-y-1.5">
              <Label htmlFor="ant-num-cfdi">Número CFDI</Label>
              <Input id="ant-num-cfdi" placeholder="UUID del CFDI" {...register("numeroCFDI")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ant-notas">Notas</Label>
            <Input id="ant-notas" placeholder="Comentarios opcionales" {...register("notas")} />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Guardando…" : "Registrar anticipo"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ===== PAGO / LIQUIDACIÓN SHEET =====

const pagoFormSchema = z.object({
  monto: z.string().min(1, "El monto es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  metodoPago: z.string().min(1, "El método de pago es requerido"),
  estatus: z.nativeEnum(EstatusPago).default("PENDIENTE"),
  cfdiEmitido: z.boolean().default(false),
  numeroCFDI: z.string().optional(),
  notas: z.string().optional(),
});

type PagoFormValues = z.infer<typeof pagoFormSchema>;

function PagoSheet({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<PagoFormValues>({
      resolver: zodResolver(pagoFormSchema),
      defaultValues: { cfdiEmitido: false, estatus: "PENDIENTE" },
    });

  const cfdiEmitido = watch("cfdiEmitido");

  useEffect(() => {
    if (open) reset({ fecha: new Date().toISOString().split("T")[0], cfdiEmitido: false, estatus: "PENDIENTE" });
  }, [open, reset]);

  async function onSubmit(values: PagoFormValues) {
    setLoading(true);
    try {
      await registrarPago({
        proyectoId,
        monto: values.monto,
        fecha: new Date(values.fecha + "T12:00:00"),
        metodoPago: values.metodoPago,
        estatus: values.estatus,
        cfdiEmitido: values.cfdiEmitido,
        numeroCFDI: values.numeroCFDI || undefined,
        notas: values.notas || undefined,
      });
      toast.success("Pago registrado");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al registrar pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Liquidación
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar pago / liquidación</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pago-monto">Monto (MXN) <span className="text-red-500">*</span></Label>
              <Input id="pago-monto" type="number" step="0.01" min="0" placeholder="0.00" {...register("monto")} />
              {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pago-fecha">Fecha <span className="text-red-500">*</span></Label>
              <Input id="pago-fecha" type="date" {...register("fecha")} />
              {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pago-metodo">Método de pago <span className="text-red-500">*</span></Label>
            <select
              id="pago-metodo"
              {...register("metodoPago")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Seleccionar…</option>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.metodoPago && <p className="text-xs text-red-500">{errors.metodoPago.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pago-estatus">Estatus</Label>
            <select
              id="pago-estatus"
              {...register("estatus")}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="LIQUIDADO">Liquidado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input id="pago-cfdi" type="checkbox" {...register("cfdiEmitido")} className="rounded border-gray-300" />
            <Label htmlFor="pago-cfdi" className="cursor-pointer font-normal">CFDI emitido</Label>
          </div>

          {cfdiEmitido && (
            <div className="space-y-1.5">
              <Label htmlFor="pago-num-cfdi">Número CFDI</Label>
              <Input id="pago-num-cfdi" placeholder="UUID del CFDI" {...register("numeroCFDI")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pago-notas">Notas</Label>
            <Input id="pago-notas" placeholder="Comentarios opcionales" {...register("notas")} />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Guardando…" : "Registrar pago"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ===== ESTATUS BADGE =====

const estatusBadge: Record<EstatusPago, { label: string; className: string; icon: React.ReactNode }> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  LIQUIDADO: {
    label: "Liquidado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

// ===== MAIN COMPONENT =====

export function TabAnticipos({
  anticipos,
  pagos,
  proyectoId,
  montoProyecto,
}: {
  anticipos: NonNullable<ProyectoDetalle["anticipos"]>;
  pagos: NonNullable<ProyectoDetalle["pagos"]>;
  proyectoId: string;
  montoProyecto: string;
}) {
  const router = useRouter();
  const [anticipoAEliminar, setAnticipoAEliminar] = useState<Anticipo | null>(null);
  const [pagoAEliminar, setPagoAEliminar] = useState<PagoDetalle | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const totalAnticipos = anticipos.reduce(
    (acc, a) => acc.plus(a.monto.toString()),
    new Decimal(0)
  );
  const totalPagos = pagos.reduce(
    (acc, p) => (p.estatus !== "CANCELADO" ? acc.plus(p.monto.toString()) : acc),
    new Decimal(0)
  );
  const montoNum = new Decimal(montoProyecto);
  const cobrado = totalAnticipos.plus(totalPagos);
  const saldo = montoNum.minus(cobrado);

  async function handleEliminarAnticipo() {
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

  async function handleEliminarPago() {
    if (!pagoAEliminar) return;
    setEliminando(true);
    try {
      await eliminarPago({ pagoId: pagoAEliminar.id, proyectoId });
      toast.success("Pago eliminado");
      setPagoAEliminar(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar pago");
    } finally {
      setEliminando(false);
    }
  }

  async function handleToggleLiquidado(pago: PagoDetalle) {
    const nuevoEstatus = pago.estatus === "LIQUIDADO" ? "PENDIENTE" : "LIQUIDADO";
    try {
      await actualizarEstatusPago({ pagoId: pago.id, proyectoId, estatus: nuevoEstatus });
      toast.success(nuevoEstatus === "LIQUIDADO" ? "Marcado como liquidado" : "Marcado como pendiente");
      router.refresh();
    } catch {
      toast.error("Error al actualizar estatus");
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Resumen financiero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Total proyecto</p>
            <p className="font-semibold tabular-nums text-gray-900">{formatMXN(montoProyecto)}</p>
          </div>
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Anticipos</p>
            <p className="font-semibold tabular-nums text-indigo-700">{formatMXN(totalAnticipos.toFixed(2))}</p>
          </div>
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Liquidaciones</p>
            <p className="font-semibold tabular-nums text-indigo-700">{formatMXN(totalPagos.toFixed(2))}</p>
          </div>
          <div className={`border rounded-lg p-3 ${saldo.lte(0) ? "bg-green-50" : "bg-white"}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Saldo</p>
            <p className={`font-semibold tabular-nums ${saldo.lte(0) ? "text-green-700" : "text-gray-900"}`}>
              {formatMXN(saldo.toFixed(2))}
            </p>
          </div>
        </div>

        {/* ===== ANTICIPOS ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Anticipos ({anticipos.length})
            </h3>
            <AnticipoSheet proyectoId={proyectoId} montoProyecto={montoProyecto} />
          </div>

          {anticipos.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white border rounded-md text-sm">
              No hay anticipos registrados.
            </div>
          ) : (
            <div className="rounded-md border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Método</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">CFDI</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Monto</th>
                    <th className="py-2 px-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {anticipos.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-xs tabular-nums text-gray-500">{formatDate(a.fecha)}</td>
                      <td className="py-2.5 px-3 text-gray-700">{a.metodoPago}</td>
                      <td className="py-2.5 px-3">
                        {a.cfdiEmitido ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" />CFDI
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                        {formatMXN(a.monto.toString())}
                        {a.porcentaje && (
                          <span className="ml-1.5 text-xs font-normal text-gray-400">({a.porcentaje.toString()}%)</span>
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

        {/* ===== PAGOS / LIQUIDACIONES ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Liquidaciones ({pagos.length})
            </h3>
            <PagoSheet proyectoId={proyectoId} />
          </div>

          {pagos.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white border rounded-md text-sm">
              No hay pagos/liquidaciones registradas.
            </div>
          ) : (
            <div className="rounded-md border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Método</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Estatus</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">CFDI</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Monto</th>
                    <th className="py-2 px-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const badge = estatusBadge[p.estatus];
                    return (
                      <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50 ${p.estatus === "CANCELADO" ? "opacity-50" : ""}`}>
                        <td className="py-2.5 px-3 text-xs tabular-nums text-gray-500">{formatDate(p.fecha)}</td>
                        <td className="py-2.5 px-3 text-gray-700">{p.metodoPago}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => p.estatus !== "CANCELADO" && handleToggleLiquidado(p)}
                            className="cursor-pointer"
                            title={p.estatus !== "CANCELADO" ? "Cambiar estatus" : undefined}
                          >
                            <Badge variant="outline" className={`text-xs gap-1 ${badge.className}`}>
                              {badge.icon}
                              {badge.label}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          {p.cfdiEmitido ? (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                              <CheckCircle2 className="h-3 w-3" />CFDI
                            </Badge>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                          {formatMXN(p.monto.toString())}
                        </td>
                        <td className="py-2.5 px-3">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => setPagoAEliminar(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog eliminar anticipo */}
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
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" disabled={eliminando} onClick={handleEliminarAnticipo}>
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar pago */}
      <Dialog
        open={pagoAEliminar !== null}
        onOpenChange={(o) => !o && setPagoAEliminar(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar pago</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-4">
            ¿Eliminar el pago de{" "}
            <span className="font-semibold">
              {pagoAEliminar ? formatMXN(pagoAEliminar.monto.toString()) : ""}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" disabled={eliminando} onClick={handleEliminarPago}>
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
