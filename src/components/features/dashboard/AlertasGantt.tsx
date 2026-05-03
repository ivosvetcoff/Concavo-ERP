import Link from "next/link";
import { obtenerAlertasGantt } from "@/server/queries/gantt-plan";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CalendarX } from "lucide-react";

export async function AlertasGantt() {
  const alertas = await obtenerAlertasGantt();

  const total = alertas.sinEstimaciones.length + alertas.sobrecargados.length;
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 text-sm">
      {/* Cabecera */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
        <span className="font-medium text-orange-700">
          Alertas Gantt ·{" "}
          {alertas.sobrecargados.length > 0 &&
            `${alertas.sobrecargados.length} sobrecarga${alertas.sobrecargados.length !== 1 ? "s" : ""}`}
          {alertas.sobrecargados.length > 0 && alertas.sinEstimaciones.length > 0 && " · "}
          {alertas.sinEstimaciones.length > 0 &&
            `${alertas.sinEstimaciones.length} proyecto${alertas.sinEstimaciones.length !== 1 ? "s" : ""} sin estimar`}
        </span>
        <Link
          href="/gantt"
          className="ml-auto text-xs text-orange-600 hover:text-orange-800 underline underline-offset-2"
        >
          Ver Gantt →
        </Link>
      </div>

      <div className="border-t border-orange-200 px-4 py-3 space-y-3">
        {/* Sobrecargas */}
        {alertas.sobrecargados.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">
              Operadores sobrecargados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {alertas.sobrecargados.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-white border border-red-200 rounded-md px-2 py-1 text-xs text-red-700"
                >
                  <span className="font-semibold">{s.empleadoNombre}</span>
                  <span className="text-red-400">·</span>
                  <span>semana {format(new Date(s.semana + "T00:00:00"), "d MMM", { locale: es })}</span>
                  <span className="text-red-400">·</span>
                  <span className="font-semibold">{s.horas}h</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sin estimaciones */}
        {alertas.sinEstimaciones.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">
              Proyectos sin horas estimadas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {alertas.sinEstimaciones.map((p) => (
                <Link
                  key={p.id}
                  href={`/proyectos/${p.id}?tab=muebles`}
                  className="inline-flex items-center gap-1 bg-white border border-orange-200 rounded-md px-2 py-1 text-xs text-orange-700 hover:bg-orange-50 transition-colors"
                >
                  <CalendarX className="h-3 w-3 text-orange-400" />
                  <span className="font-mono text-orange-400">#{p.codigo}</span>
                  <span>{p.nombre}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
