"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ShoppingCart } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { DashboardAlertas } from "@/server/queries/dashboard";

type Props = {
  alertas: DashboardAlertas;
};

export function AlertasDashboard({ alertas }: Props) {
  const [expanded, setExpanded] = useState(false);

  const totalCriticos = alertas.criticos.length;
  const totalAtrasados = alertas.atrasados.length;
  const totalSinAsignar = alertas.comprasSinAsignar;

  if (totalCriticos === 0 && totalAtrasados === 0 && totalSinAsignar === 0) return null;

  const partes: string[] = [];
  if (totalCriticos > 0) partes.push(`${totalCriticos} crítico${totalCriticos !== 1 ? "s" : ""}`);
  if (totalAtrasados > 0) partes.push(`${totalAtrasados} atrasado${totalAtrasados !== 1 ? "s" : ""}`);
  if (totalSinAsignar > 0) partes.push(`${totalSinAsignar} compra${totalSinAsignar !== 1 ? "s" : ""} sin asignar`);

  const hasCritical = totalCriticos > 0;
  const border = hasCritical ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50";
  const divider = hasCritical ? "border-red-200" : "border-amber-200";
  const icon = hasCritical ? "text-red-500" : "text-amber-500";
  const text = hasCritical ? "text-red-700" : "text-amber-700";

  return (
    <div className={`rounded-lg border text-sm ${border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${icon}`} />
        <span className={`font-medium ${text}`}>{partes.join(" · ")}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 ml-auto flex-shrink-0 transition-transform ${icon} ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className={`px-4 pb-3 border-t ${divider} space-y-3 pt-3`}>
          {totalCriticos > 0 && (
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">
                Críticos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {alertas.criticos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.id}`}
                    className="inline-flex items-center gap-1 bg-white border border-red-200 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <span className="font-mono text-red-400">#{p.codigo}</span>
                    <span>{p.nombre}</span>
                    {p.fechaCompromiso && (
                      <span className="text-red-400">· {formatDate(p.fechaCompromiso)}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalAtrasados > 0 && (
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                Atrasados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {alertas.atrasados.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.id}`}
                    className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <span className="font-mono text-amber-400">#{p.codigo}</span>
                    <span>{p.nombre}</span>
                    {p.fechaCompromiso && (
                      <span className="text-amber-400">· {formatDate(p.fechaCompromiso)}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalSinAsignar > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-orange-700 font-medium">
                  {totalSinAsignar} compra{totalSinAsignar !== 1 ? "s" : ""} sin asignar
                </span>
              </div>
              <Link
                href="/compras?sinAsignar=1"
                className="text-xs font-medium text-orange-600 hover:text-orange-800 underline underline-offset-2"
              >
                Ver →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
