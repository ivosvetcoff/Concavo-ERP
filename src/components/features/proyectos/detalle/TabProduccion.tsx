"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ExternalLink } from "lucide-react";
import type { RegistroProduccionFila } from "@/server/queries/proyecto-finanzas";
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

type Props = {
  registros: RegistroProduccionFila[];
};

function formatHoras(h: string): string {
  const n = parseFloat(h);
  return n % 1 === 0 ? `${n}h` : `${n.toFixed(1)}h`;
}

export function TabProduccion({ registros }: Props) {
  if (registros.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 bg-white border rounded-md text-sm">
        No hay registros de producción para este proyecto.{" "}
        <Link href="/produccion" className="text-indigo-500 hover:underline">
          Ir a producción →
        </Link>
      </div>
    );
  }

  // Group by semana (ISO week string)
  const porSemana = new Map<string, RegistroProduccionFila[]>();
  for (const r of registros) {
    const key = format(new Date(r.semana), "yyyy-MM-dd");
    if (!porSemana.has(key)) porSemana.set(key, []);
    porSemana.get(key)!.push(r);
  }

  const totalTO = registros.reduce((s, r) => s + parseFloat(r.horasTO), 0);
  const totalTE = registros.reduce((s, r) => s + parseFloat(r.horasTE), 0);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="flex items-center gap-4 text-sm bg-white border rounded-lg px-4 py-2.5">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">
          Total T.O.:{" "}
          <span className="font-semibold text-gray-900">
            {totalTO % 1 === 0 ? totalTO : totalTO.toFixed(1)}h
          </span>
        </span>
        {totalTE > 0 && (
          <span className="text-gray-600">
            T.E.:{" "}
            <span className="font-semibold text-amber-600">
              {totalTE % 1 === 0 ? totalTE : totalTE.toFixed(1)}h
            </span>
          </span>
        )}
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">{registros.length} registros</span>
      </div>

      {/* Por semana */}
      {Array.from(porSemana.entries()).map(([semanaKey, filas]) => {
        const semanaDate = new Date(semanaKey + "T00:00:00");
        const sabado = new Date(semanaDate);
        sabado.setDate(sabado.getDate() + 5);
        const label = `${format(semanaDate, "d", { locale: es })}–${format(sabado, "d 'de' MMMM", { locale: es })}`;
        const semTO = filas.reduce((s, r) => s + parseFloat(r.horasTO), 0);
        const semTE = filas.reduce((s, r) => s + parseFloat(r.horasTE), 0);

        return (
          <div key={semanaKey} className="bg-white border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
              <span className="text-sm font-medium text-gray-700 capitalize">
                Semana {label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  T.O. <span className="font-semibold text-gray-700">{semTO % 1 === 0 ? semTO : semTO.toFixed(1)}h</span>
                  {semTE > 0 && (
                    <> · T.E. <span className="font-semibold text-amber-600">{semTE % 1 === 0 ? semTE : semTE.toFixed(1)}h</span></>
                  )}
                </span>
                <Link
                  href={`/produccion?semana=${semanaKey}`}
                  className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver planilla
                </Link>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Empleado
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Mueble
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
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                    <td className="py-2 px-4 font-medium text-gray-900">
                      {[r.empleadoNombre, r.empleadoApellido].filter(Boolean).join(" ")}
                    </td>
                    <td className="py-2 px-3 text-gray-700">{r.muebleNombre}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {PROCESO_LABELS[r.proceso] ?? r.proceso}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-medium tabular-nums">
                      {formatHoras(r.horasTO)}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {parseFloat(r.horasTE) > 0 ? (
                        <span className="font-medium text-amber-600">
                          {formatHoras(r.horasTE)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
