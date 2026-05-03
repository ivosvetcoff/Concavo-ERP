"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  PlanTallerView,
  CeldaGantt,
  EmpleadoGantt,
  ProyectoGanttInfo,
} from "@/server/queries/gantt-plan";
import type { EspecialidadEmpleado } from "@prisma/client";
import { AlertTriangle } from "lucide-react";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

const PROCESO_LABELS: Record<string, string> = {
  HABILITADO: "Hab",
  ARMADO: "Arm",
  PULIDO: "Pul",
  LACA: "Lac",
  COMPLEMENTOS: "Comp",
  EMPAQUE: "Emp",
};

type Props = {
  data: PlanTallerView;
};

export function GanttTaller({ data }: Props) {
  const [filtroEspecialidad, setFiltroEspecialidad] =
    useState<EspecialidadEmpleado | "todas">("todas");
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos");
  const [tooltip, setTooltip] = useState<{
    celda: CeldaGantt;
    empleadoNombre: string;
    x: number;
    y: number;
  } | null>(null);

  // Construir index de celdas: empleadoId+semana → celda
  const celdaIndex = new Map<string, CeldaGantt>();
  for (const c of data.celdas) {
    celdaIndex.set(`${c.empleadoId}|${c.semana}`, c);
  }

  // Filtrar celdas por proyecto si aplica
  function getCelda(empleadoId: string, semana: string): CeldaGantt | null {
    const c = celdaIndex.get(`${empleadoId}|${semana}`) ?? null;
    if (!c) return null;
    if (filtroProyecto === "todos") return c;
    const filtered = c.segmentos.filter((s) => s.proyectoId === filtroProyecto);
    if (filtered.length === 0) return null;
    const horas = filtered.reduce((s, x) => s + x.horasPlanificadas, 0);
    return { ...c, segmentos: filtered, horas, sobrecargado: false };
  }

  const empleadosFiltrados =
    filtroEspecialidad === "todas"
      ? data.empleados
      : data.empleados.filter((e) => e.especialidad === filtroEspecialidad);

  // Especialidades únicas presentes
  const especialidades = [
    ...new Set(data.empleados.map((e) => e.especialidad)),
  ] as EspecialidadEmpleado[];

  // Agrupar empleados por especialidad
  const grupos = new Map<EspecialidadEmpleado, EmpleadoGantt[]>();
  for (const e of empleadosFiltrados) {
    const arr = grupos.get(e.especialidad) ?? [];
    arr.push(e);
    grupos.set(e.especialidad, arr);
  }

  const totalSobrecargadas = data.celdas.filter((c) => c.sobrecargado).length;

  function semanaLabel(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return format(d, "d MMM", { locale: es });
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Filtro especialidad */}
        <select
          value={filtroEspecialidad}
          onChange={(e) =>
            setFiltroEspecialidad(e.target.value as EspecialidadEmpleado | "todas")
          }
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          <option value="todas">Todas las especialidades</option>
          {especialidades.map((esp) => (
            <option key={esp} value={esp}>
              {ESPECIALIDAD_LABELS[esp]}
            </option>
          ))}
        </select>

        {/* Filtro proyecto */}
        <select
          value={filtroProyecto}
          onChange={(e) => setFiltroProyecto(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          <option value="todos">Todos los proyectos</option>
          {data.proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.codigo} — {p.nombre}
            </option>
          ))}
        </select>

        {/* Alerta sobrecargas */}
        {totalSobrecargadas > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {totalSobrecargadas} semana{totalSobrecargadas !== 1 ? "s" : ""} con sobrecarga
            </span>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300" />
            Con trabajo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
            Sobrecarga (&gt;40h)
          </span>
        </div>
      </div>

      {/* Leyenda de proyectos */}
      {data.proyectos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.proyectos.map((p: ProyectoGanttInfo) => (
            <button
              key={p.id}
              onClick={() => setFiltroProyecto(filtroProyecto === p.id ? "todos" : p.id)}
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors ${
                filtroProyecto === p.id
                  ? "border-gray-400 bg-gray-100"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-mono text-gray-500">#{p.codigo}</span>
              <span className="text-gray-700">{p.nombre}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid principal */}
      {empleadosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm bg-white border rounded-lg">
          No hay empleados con esta especialidad.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="text-sm border-collapse" style={{ minWidth: `${data.semanas.length * 100 + 160}px` }}>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                  Operador
                </th>
                {data.semanas.map((s) => (
                  <th
                    key={s}
                    className="text-center px-2 py-2.5 text-xs font-medium text-gray-500 min-w-[88px]"
                  >
                    {semanaLabel(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...grupos.entries()].map(([especialidad, empleados]) => (
                <>
                  {/* Separador de especialidad */}
                  <tr key={`sep-${especialidad}`} className="bg-gray-50/70">
                    <td
                      colSpan={data.semanas.length + 1}
                      className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {ESPECIALIDAD_LABELS[especialidad]}
                    </td>
                  </tr>

                  {empleados.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-b-0 hover:bg-gray-50/30">
                      {/* Nombre del operador */}
                      <td className="px-4 py-2 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          {emp.color && (
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: emp.color }}
                            />
                          )}
                          <span className="text-gray-700 font-medium text-xs">{emp.nombre}</span>
                        </div>
                      </td>

                      {/* Celdas por semana */}
                      {data.semanas.map((semana) => {
                        const celda = getCelda(emp.id, semana);
                        return (
                          <td
                            key={semana}
                            className={`px-1 py-1 border-l border-gray-100 text-center ${
                              celda?.sobrecargado
                                ? "bg-red-50"
                                : celda
                                ? "bg-indigo-50/40"
                                : ""
                            }`}
                            onMouseEnter={(e) =>
                              celda &&
                              setTooltip({
                                celda,
                                empleadoNombre: emp.nombre,
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {celda ? (
                              <div className="space-y-0.5">
                                {/* Chips de proyectos en la celda */}
                                {celda.segmentos.map((s, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex items-center gap-1 w-full px-1 py-0.5 rounded text-[10px] leading-tight"
                                    style={{
                                      backgroundColor: s.proyectoColor + "22",
                                      borderLeft: `2px solid ${s.proyectoColor}`,
                                    }}
                                  >
                                    <span
                                      className="font-semibold truncate"
                                      style={{ color: s.proyectoColor }}
                                    >
                                      #{s.proyectoCodigo}
                                    </span>
                                    <span className="text-gray-500 ml-auto">
                                      {s.horasPlanificadas.toFixed(0)}h
                                    </span>
                                  </div>
                                ))}
                                {/* Total de horas */}
                                <div
                                  className={`text-[10px] text-right font-semibold ${
                                    celda.sobrecargado ? "text-red-600" : "text-gray-500"
                                  }`}
                                >
                                  {celda.horas.toFixed(0)}h{celda.sobrecargado ? " ⚠" : ""}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs pointer-events-none max-w-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-semibold text-gray-800 mb-1.5">
            {tooltip.empleadoNombre} · semana {tooltip.celda.semana}
          </p>
          {tooltip.celda.segmentos.map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.proyectoColor }}
              />
              <span className="text-gray-600">
                #{s.proyectoCodigo} · {PROCESO_LABELS[s.proceso] ?? s.proceso} · {s.muebleNombre}
              </span>
              <span className="ml-auto font-semibold text-gray-800">
                {s.horasPlanificadas.toFixed(0)}h
              </span>
            </div>
          ))}
          <div className={`mt-1.5 pt-1.5 border-t font-bold ${tooltip.celda.sobrecargado ? "text-red-600" : "text-gray-700"}`}>
            Total: {tooltip.celda.horas.toFixed(0)}h / 40h{tooltip.celda.sobrecargado ? " — SOBRECARGA" : ""}
          </div>
        </div>
      )}

      {/* Sin datos */}
      {data.celdas.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm bg-white border rounded-lg">
          No hay proyectos activos con horas estimadas para planificar.
          <br />
          <span className="text-indigo-500 mt-1 block">
            Agrega horas estimadas a los muebles desde el detalle del proyecto.
          </span>
        </div>
      )}
    </div>
  );
}
