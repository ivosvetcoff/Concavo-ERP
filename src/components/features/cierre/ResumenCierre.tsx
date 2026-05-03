"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Receipt,
  FileDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMXN, formatDate } from "@/lib/format";
import { cerrarMes } from "@/server/actions/cierre";
import { MontoPrivado } from "@/components/privacy/MontoPrivado";

export type ProyectoCalculado = {
  id: string;
  codigo: string;
  nombre: string;
  clienteNombre: string;
  facturado: boolean;
  fechaEntrega: string;
  qtyItems: number;
  montoVendido: string;
  materialDirecto: string;
  proporcionalInsumos: string;
  proporcionalMOI: string;
  costoMODirecta: string;
  costoProyecto: string;
  utilidad: string;
  utilidadSobreVentaPct: string;
  utilidadSobreCostoPct: string;
};

export type ResumenCierreProps = {
  mes: number;
  anio: number;
  proyectos: ProyectoCalculado[];
  totalIngresosFacturado: string;
  totalIngresosEfectivo: string;
  totalIngresos: string;
  totalInsumos: string;
  totalMOI: string;
  totalGastosFijos: string;
  utilidadProyectosTotal: string;
  utilidadNetaMes: string;
  cerrado: boolean;
  fechaCierre: string | null;
};

function UtilBadge({ pct }: { pct: string }) {
  const n = parseFloat(pct);
  const color =
    n >= 50
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : n >= 30
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <Badge variant="outline" className={`text-xs tabular-nums ${color}`}>
      {n.toFixed(1)}%
    </Badge>
  );
}

function FilaProyecto({ p }: { p: ProyectoCalculado }) {
  const [expanded, setExpanded] = useState(false);
  const utilPos = parseFloat(p.utilidad) >= 0;

  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2.5 px-3 w-6">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          )}
        </td>
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500">#{p.codigo}</span>
            {p.facturado ? (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1 py-0">
                <Receipt className="h-2.5 w-2.5" />Facturado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200 py-0">
                Efectivo
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-gray-900 mt-0.5">{p.nombre}</div>
          <div className="text-xs text-gray-500">{p.clienteNombre}</div>
        </td>
        <td className="py-2.5 px-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {formatDate(new Date(p.fechaEntrega))}
        </td>
        <td className="py-2.5 px-3 text-center text-xs text-gray-500">{p.qtyItems}</td>
        <td className="py-2.5 px-3 text-right font-medium tabular-nums">
          <MontoPrivado>{formatMXN(p.montoVendido)}</MontoPrivado>
        </td>
        <td className="py-2.5 px-3 text-right tabular-nums text-gray-600">
          <MontoPrivado>{formatMXN(p.costoProyecto)}</MontoPrivado>
        </td>
        <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
          <MontoPrivado>
            <span className={utilPos ? "text-emerald-700" : "text-red-600"}>
              {formatMXN(p.utilidad)}
            </span>
          </MontoPrivado>
        </td>
        <td className="py-2.5 px-3 text-center">
          <UtilBadge pct={p.utilidadSobreVentaPct} />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/70 border-b">
          <td />
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Material directo</p>
                <p className="font-medium tabular-nums"><MontoPrivado>{formatMXN(p.materialDirecto)}</MontoPrivado></p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Prop. insumos</p>
                <p className="font-medium tabular-nums"><MontoPrivado>{formatMXN(p.proporcionalInsumos)}</MontoPrivado></p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Prop. M.O.I.</p>
                <p className="font-medium tabular-nums"><MontoPrivado>{formatMXN(p.proporcionalMOI)}</MontoPrivado></p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">M.O. directa</p>
                <p className="font-medium tabular-nums"><MontoPrivado>{formatMXN(p.costoMODirecta)}</MontoPrivado></p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 flex gap-6 text-xs text-gray-500">
              <span>
                Costo total: <MontoPrivado><span className="font-semibold text-gray-700">{formatMXN(p.costoProyecto)}</span></MontoPrivado>
              </span>
              <span>
                Utilidad sobre costo: <span className="font-semibold text-gray-700">{parseFloat(p.utilidadSobreCostoPct).toFixed(1)}%</span>
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ResumenCierre({
  mes,
  anio,
  proyectos,
  totalIngresosFacturado,
  totalIngresosEfectivo,
  totalIngresos,
  totalInsumos,
  totalMOI,
  totalGastosFijos,
  utilidadProyectosTotal,
  utilidadNetaMes,
  cerrado,
  fechaCierre,
}: ResumenCierreProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const utilidadNetaNum = parseFloat(utilidadNetaMes);
  const utilidadPos = utilidadNetaNum >= 0;

  async function handleCerrarMes() {
    setCerrando(true);
    try {
      await cerrarMes(mes, anio);
      toast.success("Mes cerrado correctamente");
      setDialogOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cerrar el mes");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* ===== PROYECTOS ENTREGADOS ===== */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Proyectos entregados ({proyectos.length})
          </h2>

          {proyectos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white border rounded-md text-sm">
              No hay proyectos entregados en este período.
            </div>
          ) : (
            <div className="rounded-md border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-2 px-3 w-6" />
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Proyecto</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Entrega</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Ítems</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Monto</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Costo</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Utilidad</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">% Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p) => (
                    <FilaProyecto key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ===== TOTALES DEL MES ===== */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Consolidado del mes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ingresos */}
            <div className="bg-white border rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingresos</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-blue-500" />Facturado
                  </span>
                  <MontoPrivado><span className="font-medium tabular-nums">{formatMXN(totalIngresosFacturado)}</span></MontoPrivado>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Efectivo</span>
                  <MontoPrivado><span className="font-medium tabular-nums">{formatMXN(totalIngresosEfectivo)}</span></MontoPrivado>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-1.5">
                  <span>Total ingresos</span>
                  <MontoPrivado><span className="tabular-nums">{formatMXN(totalIngresos)}</span></MontoPrivado>
                </div>
              </div>
            </div>

            {/* Egresos */}
            <div className="bg-white border rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Egresos del mes</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insumos generales</span>
                  <MontoPrivado><span className="font-medium tabular-nums">{formatMXN(totalInsumos)}</span></MontoPrivado>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">M.O. indirecta</span>
                  <MontoPrivado><span className="font-medium tabular-nums">{formatMXN(totalMOI)}</span></MontoPrivado>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos fijos</span>
                  <MontoPrivado><span className="font-medium tabular-nums">{formatMXN(totalGastosFijos)}</span></MontoPrivado>
                </div>
              </div>
            </div>
          </div>

          {/* Utilidad consolidada */}
          <div className={`rounded-lg border-2 p-4 ${utilidadPos ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Utilidad neta del mes</p>
                <div className="flex items-center gap-3">
                  <MontoPrivado>
                    <p className={`text-3xl font-bold tabular-nums ${utilidadPos ? "text-emerald-700" : "text-red-700"}`}>
                      {formatMXN(utilidadNetaMes)}
                    </p>
                  </MontoPrivado>
                  {utilidadPos ? (
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Utilidad de proyectos <MontoPrivado>{formatMXN(utilidadProyectosTotal)}</MontoPrivado> − gastos fijos <MontoPrivado>{formatMXN(totalGastosFijos)}</MontoPrivado>
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Export buttons */}
                <a
                  href={`/api/cierre/export?mes=${mes}&anio=${anio}`}
                  download
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  Excel
                </a>
                <a
                  href={`/api/cierre/export?mes=${mes}&anio=${anio}&contador=1`}
                  download
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <FileDown className="h-4 w-4 text-blue-500" />
                  Solo contador
                </a>

                {cerrado ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-gray-700">Mes cerrado</p>
                      {fechaCierre && (
                        <p className="text-xs">{formatDate(new Date(fechaCierre))}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    variant="outline"
                    className="gap-2 border-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Cerrar mes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Dialog confirmar cierre */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cerrar mes</DialogTitle>
          </DialogHeader>
          <div className="px-4 space-y-2">
            <p className="text-sm text-gray-600">
              Al cerrar el mes se guardará un snapshot permanente de todos los cálculos. Esta acción no se puede deshacer.
            </p>
            <p className="text-sm font-semibold text-gray-700">
              ¿Confirmar cierre?
            </p>
          </div>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={cerrando} onClick={handleCerrarMes}>
              {cerrando ? "Cerrando…" : "Confirmar cierre"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
