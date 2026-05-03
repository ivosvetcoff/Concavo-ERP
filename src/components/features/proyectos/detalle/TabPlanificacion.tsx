"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { replanificarProyecto, toggleBloquearPlan } from "@/server/actions/gantt-plan";
import type { PlanProyectoView } from "@/server/queries/gantt-plan";
import { Lock, LockOpen, RefreshCw, CalendarCheck, AlertCircle } from "lucide-react";

const PROCESO_LABELS: Record<string, string> = {
  HABILITADO: "Habilitado",
  ARMADO: "Armado",
  PULIDO: "Pulido",
  LACA: "Laca",
  COMPLEMENTOS: "Complementos",
  EMPAQUE: "Empaque",
};

type Props = {
  proyectoId: string;
  planData: PlanProyectoView;
};

export function TabPlanificacion({ proyectoId, planData }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"replanificar" | "bloquear" | null>(null);

  function handleReplanificar() {
    setActiveAction("replanificar");
    startTransition(async () => {
      try {
        await replanificarProyecto(proyectoId);
        toast.success("Plan recalculado");
        router.refresh();
      } catch {
        toast.error("Error al replanificar");
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleToggleBloqueado() {
    setActiveAction("bloquear");
    startTransition(async () => {
      try {
        await toggleBloquearPlan(proyectoId, !planData.bloqueado);
        toast.success(planData.bloqueado ? "Plan desbloqueado" : "Plan bloqueado");
        router.refresh();
      } catch {
        toast.error("Error al cambiar bloqueo");
      } finally {
        setActiveAction(null);
      }
    });
  }

  // Avance global = promedio de muebles con estimaciones
  const mueblesCon = planData.avancePorMueble.filter((m) => m.pct !== null);
  const avanceGlobal =
    mueblesCon.length > 0
      ? Math.round(mueblesCon.reduce((s, m) => s + (m.pct ?? 0), 0) / mueblesCon.length)
      : null;

  // Agrupar segmentos por semana
  const segmentosPorSemana = new Map<string, typeof planData.segmentos>();
  for (const s of planData.segmentos) {
    const arr = segmentosPorSemana.get(s.semana) ?? [];
    arr.push(s);
    segmentosPorSemana.set(s.semana, arr);
  }
  const semanasOrdenadas = [...segmentosPorSemana.keys()].sort();

  return (
    <div className="space-y-4">
      {/* Resumen del plan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fin estimado</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {planData.fechaFinEst ? (
              format(new Date(planData.fechaFinEst + "T00:00:00"), "d MMM yyyy", { locale: es })
            ) : (
              <span className="text-gray-400 text-sm font-normal">Sin estimar</span>
            )}
          </p>
        </div>

        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Horas estimadas</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {planData.horasTotalesEst > 0 ? `${planData.horasTotalesEst.toFixed(0)}h` : "—"}
          </p>
        </div>

        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avance</p>
          {avanceGlobal !== null ? (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${avanceGlobal >= 80 ? "bg-emerald-500" : avanceGlobal >= 40 ? "bg-indigo-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(avanceGlobal, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 tabular-nums">{avanceGlobal}%</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-1">Sin estimar</p>
          )}
        </div>

        <div className={`border rounded-lg px-4 py-3 ${planData.bloqueado ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Plan</p>
          <p className={`text-sm font-semibold mt-1 ${planData.bloqueado ? "text-amber-700" : planData.tieneEstimaciones ? "text-emerald-600" : "text-gray-400"}`}>
            {planData.bloqueado ? "Bloqueado" : planData.tieneEstimaciones ? "Activo" : "Sin datos"}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleReplanificar}
          disabled={pending || !planData.tieneEstimaciones}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${activeAction === "replanificar" && pending ? "animate-spin" : ""}`} />
          {activeAction === "replanificar" && pending ? "Replanificando…" : "Replanificar"}
        </button>

        <button
          onClick={handleToggleBloqueado}
          disabled={pending || planData.planId === null}
          className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            planData.bloqueado
              ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {planData.bloqueado ? (
            <><LockOpen className="h-3.5 w-3.5" /> Desbloquear</>
          ) : (
            <><Lock className="h-3.5 w-3.5" /> Bloquear plan</>
          )}
        </button>

        {!planData.tieneEstimaciones && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Agrega horas estimadas en la pestaña Muebles para activar la planificación.
          </p>
        )}
      </div>

      {/* Aviso de plan bloqueado */}
      {planData.bloqueado && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <Lock className="h-4 w-4 flex-shrink-0" />
          Plan bloqueado manualmente. El motor no recalcula fechas hasta que se desbloquee.
        </div>
      )}

      {/* Conflictos del motor */}
      {planData.conflictos.length > 0 && (
        <div className="space-y-1">
          {planData.conflictos.map((c, i) => (
            <div
              key={i}
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {c}
            </div>
          ))}
        </div>
      )}

      {/* Avance por mueble */}
      {planData.avancePorMueble.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avance por mueble</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {planData.avancePorMueble.map((m) => (
                <tr key={m.muebleId} className="border-b last:border-0">
                  <td className="px-4 py-2.5 text-gray-700 font-medium">{m.muebleNombre}</td>
                  <td className="px-4 py-2.5 w-48">
                    {m.pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${m.pct >= 80 ? "bg-emerald-500" : m.pct >= 40 ? "bg-indigo-400" : "bg-amber-400"}`}
                            style={{ width: `${Math.min(m.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-600 w-9 text-right">{m.pct}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin estimar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Segmentos por semana */}
      {semanasOrdenadas.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan semana a semana</p>
          </div>
          <div className="divide-y">
            {semanasOrdenadas.map((semana) => {
              const segs = segmentosPorSemana.get(semana) ?? [];
              const fechaLabel = format(new Date(semana + "T00:00:00"), "d 'de' MMMM", { locale: es });
              return (
                <div key={semana} className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2 capitalize">
                    Semana del {fechaLabel}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {segs.map((s, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md"
                      >
                        <span className="font-medium">{PROCESO_LABELS[s.proceso] ?? s.proceso}</span>
                        <span className="text-indigo-300">·</span>
                        <span className="text-indigo-600">{s.muebleNombre}</span>
                        <span className="text-indigo-300">·</span>
                        <span className="text-indigo-500">{s.empleadoNombre}</span>
                        <span className="text-indigo-300">·</span>
                        <span className="font-semibold">{s.horasPlanificadas.toFixed(0)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!planData.tieneEstimaciones && planData.segmentos.length === 0 && !planData.bloqueado && (
        <div className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-gray-400">
          <CalendarCheck className="h-8 w-8 mx-auto text-gray-200 mb-2" />
          Ningún mueble tiene horas estimadas cargadas.
          <br />
          Editá los muebles desde la pestaña <strong>Muebles</strong> para activar la planificación automática.
        </div>
      )}
    </div>
  );
}
