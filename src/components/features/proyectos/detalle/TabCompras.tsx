import { Badge } from "@/components/ui/badge";
import { formatDate, formatMXN } from "@/lib/format";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";

type Compra = ProyectoDetalle["compras"][0];

export function TabCompras({ compras }: { compras: ProyectoDetalle["compras"] }) {
  if (compras.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No hay compras registradas para este proyecto.
      </div>
    );
  }

  const total = compras.reduce(
    (acc: number, c) => acc + parseFloat(c.total.toString()),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {compras.length} compra{compras.length !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          Total: {formatMXN(total.toString())}
        </span>
      </div>
      <div className="rounded-md border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Fecha
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Proveedor
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Descripción
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Categoría
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                CFDI
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Monto
              </th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <FilaCompra key={c.id} compra={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaCompra({ compra }: { compra: Compra }) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="py-2.5 px-3 text-xs tabular-nums text-gray-500">
        {formatDate(compra.fecha)}
      </td>
      <td className="py-2.5 px-3 font-medium">{compra.proveedor}</td>
      <td className="py-2.5 px-3 text-gray-600 max-w-[200px] truncate">
        {compra.descripcion}
      </td>
      <td className="py-2.5 px-3">
        {compra.categoria ? (
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            {compra.categoria}
          </Badge>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {compra.numeroCFDIRecibido ? (
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            CFDI
          </Badge>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-right font-medium tabular-nums">
        {formatMXN(compra.total.toString())}
      </td>
    </tr>
  );
}
