"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PlanTallerView } from "@/server/queries/gantt-plan";
import type { EspecialidadEmpleado } from "@prisma/client";
import { Calculator } from "lucide-react";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

type Props = {
  planTaller: PlanTallerView;
};

export function ProyeccionOcupacion({ planTaller }: Props) {
  // Simulador de fecha de entrega
  const [horasHabilitado, setHorasHabilitado] = useState("");
  const [horasArmado, setHorasArmado] = useState("");
  const [horasPulido, setHorasPulido] = useState("");
  const [horasLaca, setHorasLaca] = useState("");
  const [cantidad, setCantidad] = useState("1");

  // Construir índice de celdas por empleado×semana
  const celdaMap = new Map<string, number>();
  for (const c of planTaller.celdas) {
    celdaMap.set(`${c.empleadoId}|${c.semana}`, c.horas);
  }

  // Calcular semana libre para un empleado dado
  function primeraSemanaLibre(empleadoId: string, horasNecesarias: number): string | null {
    if (horasNecesarias <= 0) return null;
    for (const semana of planTaller.semanas) {
      const ocupadas = celdaMap.get(`${empleadoId}|${semana}`) ?? 0;
      const libres = Math.max(0, 40 - ocupadas);
      if (libres >= horasNecesarias) return semana;
    }
    return "más de 12 semanas";
  }

  // Simular fecha estimada
  function simularFecha(): string | null {
    const hHab = parseFloat(horasHabilitado || "0") * parseFloat(cantidad || "1");
    const hArm = parseFloat(horasArmado || "0") * parseFloat(cantidad || "1");
    const hPul = parseFloat(horasPulido || "0") * parseFloat(cantidad || "1");
    const hLac = parseFloat(horasLaca || "0") * parseFloat(cantidad || "1");

    if (hHab + hArm + hPul + hLac === 0) return null;

    // Habilitadores
    const habilitadores = planTaller.empleados.filter((e) => e.especialidad === "HABILITADOR");
    const armadores = planTaller.empleados.filter((e) => e.especialidad === "ARMADOR");
    const pulidores = planTaller.empleados.filter((e) => e.especialidad === "PULIDOR");
    const laqueadores = planTaller.empleados.filter((e) => e.especialidad === "LAQUEADOR");

    let ultimaSemana = planTaller.semanas[0];

    if (hHab > 0 && habilitadores.length > 0) {
      // El habilitador con más disponibilidad
      let mejor = habilitadores[0].id;
      let mejorLib = 0;
      for (const emp of habilitadores) {
        for (const sem of planTaller.semanas) {
          const lib = 40 - (celdaMap.get(`${emp.id}|${sem}`) ?? 0);
          if (lib > mejorLib) { mejorLib = lib; mejor = emp.id; }
        }
      }
      const sem = primeraSemanaLibre(mejor, hHab);
      if (sem && sem > ultimaSemana) ultimaSemana = sem;
    }

    if (hArm > 0 && armadores.length > 0) {
      let mejor = armadores[0].id;
      let mejorLib = 0;
      for (const emp of armadores) {
        for (const sem of planTaller.semanas) {
          const lib = 40 - (celdaMap.get(`${emp.id}|${sem}`) ?? 0);
          if (lib > mejorLib) { mejorLib = lib; mejor = emp.id; }
        }
      }
      const sem = primeraSemanaLibre(mejor, hArm);
      if (sem && sem > ultimaSemana) ultimaSemana = sem;
    }

    if (hPul > 0 && pulidores.length > 0) {
      let mejor = pulidores[0].id;
      let mejorLib = 0;
      for (const emp of pulidores) {
        for (const sem of planTaller.semanas) {
          const lib = 40 - (celdaMap.get(`${emp.id}|${sem}`) ?? 0);
          if (lib > mejorLib) { mejorLib = lib; mejor = emp.id; }
        }
      }
      const sem = primeraSemanaLibre(mejor, hPul);
      if (sem && sem > ultimaSemana) ultimaSemana = sem;
    }

    if (hLac > 0 && laqueadores.length > 0) {
      let mejor = laqueadores[0].id;
      let mejorLib = 0;
      for (const emp of laqueadores) {
        for (const sem of planTaller.semanas) {
          const lib = 40 - (celdaMap.get(`${emp.id}|${sem}`) ?? 0);
          if (lib > mejorLib) { mejorLib = lib; mejor = emp.id; }
        }
      }
      const sem = primeraSemanaLibre(mejor, hLac);
      if (sem && sem > ultimaSemana) ultimaSemana = sem;
    }

    if (ultimaSemana === "más de 12 semanas") return ultimaSemana;
    return format(new Date(ultimaSemana + "T00:00:00"), "d 'de' MMMM yyyy", { locale: es });
  }

  const fechaSimulada = simularFecha();

  // Agrupar empleados por especialidad
  const grupos = new Map<EspecialidadEmpleado, typeof planTaller.empleados>();
  for (const e of planTaller.empleados) {
    const arr = grupos.get(e.especialidad) ?? [];
    arr.push(e);
    grupos.set(e.especialidad, arr);
  }

  return (
    <div className="space-y-5">
      {/* Simulador de fecha de entrega */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center gap-2">
          <Calculator className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Simulador — ¿Cuándo puedo entregar?
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Habilitado (h/pieza)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={horasHabilitado}
                onChange={(e) => setHorasHabilitado(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Armado (h/pieza)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={horasArmado}
                onChange={(e) => setHorasArmado(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Pulido (h/pieza)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={horasPulido}
                onChange={(e) => setHorasPulido(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Laca (h/pieza)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={horasLaca}
                onChange={(e) => setHorasLaca(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Piezas</label>
              <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="1"
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          {fechaSimulada && (
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2">
              <span className="text-sm text-indigo-600">Fecha estimada más temprana:</span>
              <span className="text-sm font-bold text-indigo-800 capitalize">{fechaSimulada}</span>
              <span className="text-xs text-indigo-400 ml-1">(basado en capacidad disponible)</span>
            </div>
          )}
        </div>
      </div>

      {/* Proyección 12 semanas */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Proyección próximas 12 semanas (plan automático)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse" style={{ minWidth: `${planTaller.semanas.length * 88 + 140}px` }}>
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-semibold text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[130px]">
                  Operador
                </th>
                {planTaller.semanas.map((s) => (
                  <th key={s} className="text-center px-2 py-2 font-medium text-gray-400 min-w-[80px]">
                    {format(new Date(s + "T00:00:00"), "d MMM", { locale: es })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...grupos.entries()].map(([especialidad, empleados]) => (
                <>
                  <tr key={`sep-${especialidad}`} className="bg-gray-50/70">
                    <td
                      colSpan={planTaller.semanas.length + 1}
                      className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {ESPECIALIDAD_LABELS[especialidad]}
                    </td>
                  </tr>
                  {empleados.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-b-0 hover:bg-gray-50/30">
                      <td className="px-4 py-2 sticky left-0 bg-white z-10">
                        <span className="text-gray-700 font-medium">{emp.nombre}</span>
                      </td>
                      {planTaller.semanas.map((semana) => {
                        const horas = celdaMap.get(`${emp.id}|${semana}`) ?? 0;
                        const pct = Math.min(100, (horas / 40) * 100);
                        const libre = Math.max(0, 40 - horas);
                        const sobrecargado = horas > 40;
                        return (
                          <td
                            key={semana}
                            className={`px-2 py-1.5 border-l border-gray-100 ${sobrecargado ? "bg-red-50" : ""}`}
                          >
                            {horas > 0 ? (
                              <div className="space-y-0.5">
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${sobrecargado ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className={`text-right text-[10px] ${sobrecargado ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                  {horas.toFixed(0)}h
                                  {!sobrecargado && (
                                    <span className="text-gray-300 ml-1">({libre.toFixed(0)} libre)</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-200">—</div>
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
      </div>
    </div>
  );
}
