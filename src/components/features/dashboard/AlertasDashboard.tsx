import Link from "next/link";
import { AlertTriangle, ShoppingCart, Calendar } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { DashboardAlertas } from "@/server/queries/dashboard";

type Props = {
  alertas: DashboardAlertas;
};

export function AlertasDashboard({ alertas }: Props) {
  const total = alertas.criticos.length + alertas.atrasados.length + alertas.comprasSinAsignar;
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      {/* CRÍTICOS */}
      {alertas.criticos.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700">
              {alertas.criticos.length} proyecto{alertas.criticos.length !== 1 ? "s" : ""} crítico{alertas.criticos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertas.criticos.map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="inline-flex items-center gap-1.5 bg-white border border-red-200 rounded-md px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                <span className="font-mono text-red-400">#{p.codigo}</span>
                <span>{p.nombre}</span>
                <span className="text-red-400">· {p.clienteNombre}</span>
                {p.fechaCompromiso && (
                  <span className="flex items-center gap-0.5 text-red-400 ml-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(p.fechaCompromiso)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ATRASADOS */}
      {alertas.atrasados.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-700">
              {alertas.atrasados.length} proyecto{alertas.atrasados.length !== 1 ? "s" : ""} atrasado{alertas.atrasados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertas.atrasados.map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="inline-flex items-center gap-1.5 bg-white border border-amber-200 rounded-md px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <span className="font-mono text-amber-400">#{p.codigo}</span>
                <span>{p.nombre}</span>
                <span className="text-amber-400">· {p.clienteNombre}</span>
                {p.fechaCompromiso && (
                  <span className="flex items-center gap-0.5 text-amber-400 ml-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(p.fechaCompromiso)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* COMPRAS SIN ASIGNAR */}
      {alertas.comprasSinAsignar > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-orange-700">
                {alertas.comprasSinAsignar} compra{alertas.comprasSinAsignar !== 1 ? "s" : ""} sin asignar a proyecto
              </span>
            </div>
            <Link
              href="/compras?sinAsignar=1"
              className="text-xs font-medium text-orange-600 hover:text-orange-800 underline underline-offset-2"
            >
              Ver compras →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
