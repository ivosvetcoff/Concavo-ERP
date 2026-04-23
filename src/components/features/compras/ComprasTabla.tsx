"use client";

import { useRouter, usePathname } from "next/navigation";
import { formatDate, formatMXN } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { CompraSheet } from "./CompraSheet";
import type { CompraRow, FiltrosCompras } from "@/server/queries/compras";

const CATEGORIA_BADGE: Record<string, string> = {
  MDF: "bg-blue-50 text-blue-700 border-blue-200",
  SOLIDO: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLEMENTOS: "bg-violet-50 text-violet-700 border-violet-200",
  ENVIOS: "bg-gray-50 text-gray-600 border-gray-200",
};

const CATEGORIA_LABEL: Record<string, string> = {
  MDF: "MDF",
  SOLIDO: "Sólido",
  COMPLEMENTOS: "Complementos",
  ENVIOS: "Envíos",
};

type Props = {
  compras: CompraRow[];
  proyectos: { id: string; codigo: string; nombre: string }[];
  isOwner: boolean;
  filtrosActivos: FiltrosCompras;
};

export function ComprasTabla({ compras, proyectos, isOwner, filtrosActivos }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams();
    const current: Record<string, string> = {};
    if (filtrosActivos.categoriaCompra && filtrosActivos.categoriaCompra !== "TODAS")
      current.categoria = filtrosActivos.categoriaCompra;
    if (filtrosActivos.tipoCompra && filtrosActivos.tipoCompra !== "TODOS")
      current.tipo = filtrosActivos.tipoCompra;
    if (filtrosActivos.proyectoId && filtrosActivos.proyectoId !== "TODOS")
      current.proyecto = filtrosActivos.proyectoId;
    if (filtrosActivos.desde) current.desde = filtrosActivos.desde;
    if (filtrosActivos.hasta) current.hasta = filtrosActivos.hasta;

    if (value && value !== "TODAS" && value !== "TODOS" && value !== "TODOS") {
      current[key] = value;
    } else {
      delete current[key];
    }

    Object.entries(current).forEach(([k, v]) => params.set(k, v));
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalGeneral = isOwner
    ? compras.reduce((acc, c) => acc + parseFloat((c.total ?? 0).toString()), 0)
    : null;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Categoría</p>
          <select
            value={filtrosActivos.categoriaCompra ?? "TODAS"}
            onChange={(e) => applyFilter("categoria", e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="TODAS">Todas</option>
            <option value="MDF">MDF</option>
            <option value="SOLIDO">Sólido</option>
            <option value="COMPLEMENTOS">Complementos</option>
            <option value="ENVIOS">Envíos</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo</p>
          <select
            value={filtrosActivos.tipoCompra ?? "TODOS"}
            onChange={(e) => applyFilter("tipo", e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="TODOS">Todos</option>
            <option value="INICIAL">Inicial</option>
            <option value="ADICIONAL">Adicional</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Proyecto</p>
          <select
            value={filtrosActivos.proyectoId ?? "TODOS"}
            onChange={(e) => applyFilter("proyecto", e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 max-w-[200px]"
          >
            <option value="TODOS">Todos</option>
            <option value="sin-asignar">Sin asignar</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.codigo} {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Desde</p>
          <input
            type="date"
            value={filtrosActivos.desde ?? ""}
            onChange={(e) => applyFilter("desde", e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hasta</p>
          <input
            type="date"
            value={filtrosActivos.hasta ?? ""}
            onChange={(e) => applyFilter("hasta", e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>

        <div className="ml-auto">
          <CompraSheet proyectos={proyectos} />
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {compras.length} compra{compras.length !== 1 ? "s" : ""}
        </span>
        {isOwner && totalGeneral !== null && (
          <span className="font-semibold text-gray-800">
            Total: {formatMXN(totalGeneral.toString())}
          </span>
        )}
      </div>

      {/* Tabla */}
      {compras.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border rounded-lg">
          No hay compras registradas con los filtros actuales.
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
                  Categoría
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Descripción
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Proveedor
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Proyecto
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Método
                </th>
                {isOwner && (
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 px-3 tabular-nums text-gray-500 text-xs">
                    {formatDate(c.fecha)}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${CATEGORIA_BADGE[c.categoria] ?? ""}`}
                    >
                      {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-gray-800 max-w-[220px]">
                    <p className="truncate">{c.descripcion}</p>
                    {c.muebleNombre && (
                      <p className="text-xs text-gray-400 truncate">{c.muebleNombre}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-gray-700">
                    <p>{c.proveedor}</p>
                    {c.idFactura && (
                      <p className="text-xs text-gray-400">#{c.idFactura}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {c.proyecto ? (
                      <a
                        href={`/proyectos/${c.proyecto.id}`}
                        className="text-indigo-600 hover:underline font-mono text-xs"
                      >
                        #{c.proyecto.codigo}
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">
                    {c.tipo === "INICIAL" ? "Inicial" : "Adicional"}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">{c.metodoPago}</td>
                  {isOwner && (
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                      {c.total ? formatMXN(c.total) : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
