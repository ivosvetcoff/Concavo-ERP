"use client";

import type { ResumenOcupacion } from "@/server/queries/nomina-gantt";
import type { EspecialidadEmpleado } from "@prisma/client";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

function barra(pct: number) {
  const color =
    pct >= 90 ? "bg-red-500" :
    pct >= 70 ? "bg-amber-400" :
    pct >= 40 ? "bg-emerald-500" :
    "bg-gray-300";
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

type Props = {
  semanas: ResumenOcupacion[];
  semanaActual: string; // "yyyy-MM-dd"
};

export function ReporteOcupacion({ semanas, semanaActual }: Props) {
  const semana = semanas.find((s) => s.semana === semanaActual) ?? semanas[0];
  if (!semana) return <p className="text-gray-400 text-sm text-center py-16">Sin datos de ocupación.</p>;

  return (
    <div className="space-y-5">
      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Empleados activos", value: String(semana.empleados.length) },
          { label: "Horas disponibles", value: `${semana.totalDisponible}h` },
          { label: "Horas registradas", value: `${semana.totalOcupado.toFixed(1)}h` },
          {
            label: "Ocupación global",
            value: `${semana.pctGlobal}%`,
            highlight: semana.pctGlobal,
          },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className={`bg-white border rounded-lg px-4 py-3 ${
              typeof highlight === "number" && highlight >= 90
                ? "border-red-200 bg-red-50/20"
                : typeof highlight === "number" && highlight >= 70
                ? "border-amber-200 bg-amber-50/20"
                : ""
            }`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ocupación por empleado
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">T.O.</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">T.E.</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Ocupación</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyectos</th>
            </tr>
          </thead>
          <tbody>
            {semana.empleados.map((e) => (
              <tr key={e.empleadoId} className="border-b last:border-b-0 hover:bg-gray-50/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {e.color && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {[e.nombre, e.apellido].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ESPECIALIDAD_LABELS[e.especialidad]}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center font-medium tabular-nums">
                  {e.horasTO > 0 ? `${e.horasTO.toFixed(1)}h` : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-3 px-3 text-center tabular-nums">
                  {e.horasTE > 0 ? (
                    <span className="font-medium text-amber-600">{e.horasTE.toFixed(1)}h</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="space-y-1">
                    {barra(e.pctOcupacion)}
                    <p className={`text-xs text-right font-medium ${
                      e.pctOcupacion >= 90 ? "text-red-600" :
                      e.pctOcupacion >= 70 ? "text-amber-600" :
                      e.pctOcupacion >= 40 ? "text-emerald-600" :
                      "text-gray-400"
                    }`}>
                      {e.pctOcupacion}%
                      <span className="text-gray-400 font-normal ml-1">
                        ({e.horasTotales.toFixed(1)} / {e.horasDisponibles}h)
                      </span>
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {e.proyectos.length === 0 ? (
                    <span className="text-gray-300 text-xs">Sin registros</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {e.proyectos.map((p) => (
                        <span
                          key={p.proyectoCodigo}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded"
                        >
                          <span className="font-mono">#{p.proyectoCodigo}</span>
                          <span className="text-indigo-400">{p.horas.toFixed(1)}h</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historial de semanas (mini-heatmap) */}
      {semanas.length > 1 && (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ocupación histórica (últimas {semanas.length} semanas)
          </p>
          <div className="flex items-end gap-2 h-16">
            {semanas.map((s) => {
              const isActive = s.semana === semanaActual;
              const barH = Math.max(8, (s.pctGlobal / 100) * 64);
              const barColor =
                s.pctGlobal >= 90 ? "bg-red-400" :
                s.pctGlobal >= 70 ? "bg-amber-400" :
                s.pctGlobal >= 40 ? "bg-emerald-400" :
                "bg-gray-200";
              return (
                <div key={s.semana} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-t transition-all ${barColor} ${isActive ? "ring-2 ring-indigo-400" : ""}`}
                    style={{ height: `${barH}px` }}
                    title={`${s.semana}: ${s.pctGlobal}%`}
                  />
                  <span className="text-[9px] text-gray-400 rotate-45 origin-left translate-y-1">
                    {s.semana.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
