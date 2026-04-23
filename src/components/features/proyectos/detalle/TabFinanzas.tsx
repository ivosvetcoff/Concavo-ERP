"use client";

import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { formatMXN } from "@/lib/format";
import type { MODetalleEmpleado } from "@/server/queries/proyecto-finanzas";
import type { ProcesoTecnico } from "@prisma/client";

const PROCESO_LABELS: Record<ProcesoTecnico, string> = {
  HABILITADO: "Habilitado",
  ARMADO: "Armado",
  PULIDO: "Pulido",
  LACA: "Laca",
  EXTERNO: "Externo",
  COMPLEMENTOS: "Complementos",
  EMPAQUE: "Empaque",
  LISTO_PARA_ENTREGA: "Listo p/entrega",
  ENTREGADO: "Entregado",
};

type FinanzasCalculadas = {
  materialDirecto: string;
  proporcionalInsumos: string;
  proporcionalMOI: string;
  costoMODirecta: string;
  costoProyecto: string;
  utilidad: string;
  utilidadSobreVentaPct: string;
  utilidadSobreCostoPct: string;
};

type Props = {
  montoVendido: string;
  qtyItems: number;
  isEntregado: boolean;
  finanzas: FinanzasCalculadas | null;
  moDetalle: MODetalleEmpleado[];
  // Estimado parcial (siempre disponible)
  comprasTotal: string;
};

function LineItem({
  label,
  value,
  sub,
  highlight,
  negativo,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  negativo?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-start py-2 ${highlight ? "font-semibold" : ""}`}
    >
      <div>
        <span className={highlight ? "text-gray-900" : "text-gray-600"}>
          {label}
        </span>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span
        className={`tabular-nums ${
          negativo
            ? "text-red-600"
            : highlight
            ? "text-gray-900"
            : "text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function TabFinanzas({
  montoVendido,
  qtyItems,
  isEntregado,
  finanzas,
  moDetalle,
  comprasTotal,
}: Props) {
  const utilidadNum = finanzas ? parseFloat(finanzas.utilidad) : null;
  const utilidadPos = utilidadNum !== null ? utilidadNum >= 0 : null;

  return (
    <div className="space-y-5">
      {!isEntregado && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            El proyecto no está entregado. Solo se muestra el estimado parcial
            (monto − compras). Para la utilidad real, marcar como ENTREGADO.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Desglose de costos */}
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Desglose de costos
          </p>
          <div className="divide-y divide-gray-100">
            <LineItem
              label="Material directo"
              value={formatMXN(comprasTotal)}
              sub="Suma de compras del proyecto"
            />
            {finanzas ? (
              <>
                <LineItem
                  label="Proporcional insumos"
                  value={formatMXN(finanzas.proporcionalInsumos)}
                  sub={`${qtyItems} ítems / total del mes`}
                />
                <LineItem
                  label="Proporcional M.O.I."
                  value={formatMXN(finanzas.proporcionalMOI)}
                  sub="Mano de obra indirecta prorateada"
                />
                <LineItem
                  label="M.O. directa"
                  value={formatMXN(finanzas.costoMODirecta)}
                  sub="Horas T.O. + T.E. de operadores"
                />
                <LineItem
                  label="Costo total del proyecto"
                  value={formatMXN(finanzas.costoProyecto)}
                  highlight
                />
              </>
            ) : (
              <LineItem
                label="Costo estimado (solo compras)"
                value={formatMXN(comprasTotal)}
                highlight
                sub="Sin MO ni insumos (proyecto no entregado)"
              />
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-3">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resultado
            </p>
            <div className="divide-y divide-gray-100">
              <LineItem label="Monto vendido" value={formatMXN(montoVendido)} />
              <LineItem
                label={finanzas ? "Costo del proyecto" : "Costo (compras)"}
                value={formatMXN(finanzas?.costoProyecto ?? comprasTotal)}
              />
              {finanzas ? (
                <>
                  <LineItem
                    label="Utilidad"
                    value={formatMXN(finanzas.utilidad)}
                    highlight
                    negativo={!utilidadPos!}
                  />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">% sobre venta</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        parseFloat(finanzas.utilidadSobreVentaPct) >= 50
                          ? "text-emerald-700"
                          : parseFloat(finanzas.utilidadSobreVentaPct) >= 30
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {parseFloat(finanzas.utilidadSobreVentaPct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">% sobre costo</span>
                    <span className="text-sm font-medium text-gray-700 tabular-nums">
                      {parseFloat(finanzas.utilidadSobreCostoPct).toFixed(1)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Margen estimado</span>
                  <span className="text-sm font-medium text-gray-700 tabular-nums">
                    {formatMXN(
                      String(
                        parseFloat(montoVendido) - parseFloat(comprasTotal)
                      )
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {finanzas && utilidadPos !== null && (
            <div
              className={`rounded-lg p-3 flex items-center gap-3 ${
                utilidadPos
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {utilidadPos ? (
                <TrendingUp className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    utilidadPos ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {formatMXN(finanzas.utilidad)}
                </p>
                <p className="text-xs text-gray-500">
                  {parseFloat(finanzas.utilidadSobreVentaPct).toFixed(1)}% sobre venta
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desglose M.O. directa por empleado */}
      {moDetalle.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Desglose mano de obra directa
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-white">
                <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Empleado
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Proceso
                </th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  T.O.
                </th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  T.E.
                </th>
                <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Costo
                </th>
              </tr>
            </thead>
            <tbody>
              {moDetalle.map((m, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50/50">
                  <td className="py-2 px-4 font-medium text-gray-900">
                    {m.empleadoNombre}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">
                    {PROCESO_LABELS[m.proceso] ?? m.proceso}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums text-gray-700">
                    {parseFloat(m.horasTO) > 0
                      ? `${parseFloat(m.horasTO) % 1 === 0 ? parseFloat(m.horasTO) : parseFloat(m.horasTO).toFixed(1)}h × ${formatMXN(m.tarifaTO)}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums text-amber-600">
                    {parseFloat(m.horasTE) > 0
                      ? `${parseFloat(m.horasTE) % 1 === 0 ? parseFloat(m.horasTE) : parseFloat(m.horasTE).toFixed(1)}h × ${formatMXN(m.tarifaTE)}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2 px-4 text-right font-medium tabular-nums">
                    {formatMXN(m.costoTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t">
                <td colSpan={4} className="py-2 px-4 text-sm font-semibold text-gray-700">
                  Total M.O. directa
                </td>
                <td className="py-2 px-4 text-right font-semibold tabular-nums">
                  {formatMXN(
                    moDetalle
                      .reduce((s, m) => s + parseFloat(m.costoTotal), 0)
                      .toFixed(2)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
