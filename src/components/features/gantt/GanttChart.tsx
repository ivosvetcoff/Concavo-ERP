"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Gantt from "frappe-gantt";
import "@/styles/frappe-gantt.css";
import { completarTarea, eliminarTarea } from "@/server/actions/nomina-gantt";
import type { TareaGantt } from "@/server/queries/nomina-gantt";
import type { EspecialidadEmpleado } from "@prisma/client";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

type ViewMode = "Day" | "Week" | "Month";

type Empleado = {
  id: string;
  nombre: string;
  apellido: string | null;
  color: string | null;
  especialidad: string;
};

type Props = {
  empleados: Empleado[];
  tareas: TareaGantt[];
};

export function GanttChart({ empleados, tareas }: Props) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<InstanceType<typeof Gantt> | null>(null);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [empleadoFiltro, setEmpleadoFiltro] = useState<string>("todos");

  const tareasFiltradas = empleadoFiltro === "todos"
    ? tareas
    : tareas.filter((t) => t.empleadoId === empleadoFiltro);

  const ganttTasks = tareasFiltradas.map((t) => ({
    id: t.id,
    name: t.nombre,
    start: t.fechaInicio.split("T")[0],
    end: t.fechaFin.split("T")[0],
    progress: t.completada ? 100 : 0,
    custom_class: t.completada ? "gantt-task-done" : undefined,
  }));

  useEffect(() => {
    if (!ganttRef.current || ganttTasks.length === 0) return;

    // Limpiar instancia anterior
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = "";
    }

    try {
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        language: "es",
        on_click: () => {}, // manejamos por botones separados
        on_date_change: () => {},
        on_progress_change: () => {},
        on_view_change: () => {},
      });
    } catch {
      // frappe-gantt puede lanzar si el contenedor no tiene dimensiones aún
    }

    // Colorear por proyecto
    const svgEl = ganttRef.current.querySelector("svg");
    if (svgEl) {
      const bars = svgEl.querySelectorAll(".bar");
      bars.forEach((bar, i) => {
        const tarea = tareasFiltradas[i];
        if (tarea) {
          (bar as SVGElement).style.fill = tarea.completada ? "#d1fae5" : tarea.color;
          (bar as SVGElement).style.stroke = tarea.color;
        }
      });
    }
  }, [ganttTasks, viewMode, tareasFiltradas]);

  async function handleCompletar(tareaId: string, nombre: string) {
    try {
      await completarTarea(tareaId);
      toast.success(`"${nombre}" marcada como completada`);
      router.refresh();
    } catch {
      toast.error("Error al completar tarea");
    }
  }

  async function handleEliminar(tareaId: string) {
    if (!confirm("¿Eliminar esta tarea del Gantt?")) return;
    try {
      await eliminarTarea(tareaId);
      toast.success("Tarea eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Filtro empleado */}
        <select
          value={empleadoFiltro}
          onChange={(e) => setEmpleadoFiltro(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          <option value="todos">Todos los empleados</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {[e.nombre, e.apellido].filter(Boolean).join(" ")} — {ESPECIALIDAD_LABELS[e.especialidad as EspecialidadEmpleado] ?? e.especialidad}
            </option>
          ))}
        </select>

        {/* Vista */}
        <div className="flex items-center rounded-md border border-gray-200 overflow-hidden bg-white text-sm">
          {(["Day", "Week", "Month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 transition-colors ${viewMode === v ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {v === "Day" ? "Día" : v === "Week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-400">{tareasFiltradas.length} tareas</span>
      </div>

      {/* Gantt */}
      {ganttTasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border rounded-lg text-sm">
          No hay tareas asignadas.{" "}
          <span className="text-indigo-500">Asigna tareas desde el detalle de cada mueble.</span>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto p-2">
          <div ref={ganttRef} />
        </div>
      )}

      {/* Lista de tareas (para gestión: completar / eliminar) */}
      {tareasFiltradas.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Lista de tareas
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarea</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inicio</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fin est.</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="py-2 px-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {tareasFiltradas.map((t) => {
                const empleado = empleados.find((e) => e.id === t.empleadoId);
                return (
                  <tr key={t.id} className={`border-b last:border-b-0 hover:bg-gray-50/50 ${t.completada ? "opacity-60" : ""}`}>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[220px]">{t.nombre}</p>
                          <p className="text-xs text-gray-400">
                            <span className="font-mono">#{t.proyectoCodigo}</span> · {t.proyectoNombre}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {empleado
                        ? [empleado.nombre, empleado.apellido].filter(Boolean).join(" ")
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums text-xs">
                      {t.fechaInicio.split("T")[0]}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums text-xs">
                      {t.fechaFin.split("T")[0]}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.completada ? (
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Completada
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          En curso
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!t.completada && (
                          <button
                            onClick={() => handleCompletar(t.id, t.nombre)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                          >
                            ✓ Completar
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(t.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
