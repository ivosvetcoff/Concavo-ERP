"use client";

import type { MuebleDetalle } from "@/server/queries/proyecto-detalle";

const PROCESOS_ESTIMADOS: { key: keyof MuebleDetalle; label: string }[] = [
  { key: "horasEstimadasHabilitado", label: "Habilitado" },
  { key: "horasEstimadasArmado", label: "Armado" },
  { key: "horasEstimadasPulido", label: "Pulido" },
  { key: "horasEstimadasLaca", label: "Laca" },
  { key: "horasEstimadasComplementos", label: "Complementos" },
  { key: "horasEstimadasEmpaque", label: "Empaque" },
];

type Props = {
  muebles: MuebleDetalle[];
  proyectoId: string;
};

export function TabPlanificacion({ muebles }: Props) {
  const totales: Record<string, number> = {};
  let tieneAlgunaEstimada = false;

  for (const m of muebles) {
    for (const { key, label } of PROCESOS_ESTIMADOS) {
      const val = m[key];
      if (val != null && val !== "") {
        const horas = parseFloat(val as string) * m.cantidad;
        totales[label] = (totales[label] ?? 0) + horas;
        tieneAlgunaEstimada = true;
      }
    }
  }

  const totalHoras = Object.values(totales).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        El Gantt automático con re-planificación en cascada se implementa en Sprint 2-3.
        Por ahora esta pestaña muestra el resumen de horas estimadas cargadas en los muebles.
      </div>

      {!tieneAlgunaEstimada ? (
        <div className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-gray-400">
          Ningún mueble tiene horas estimadas cargadas.
          Editá los muebles desde la pestaña <strong>Muebles</strong> para agregar horas por proceso.
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Horas estimadas totales del proyecto
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Suma de (horas estimadas × cantidad) por proceso, de todos los muebles
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Proceso
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Horas estimadas
                </th>
              </tr>
            </thead>
            <tbody>
              {PROCESOS_ESTIMADOS.filter(({ label }) => totales[label] != null).map(
                ({ label }) => (
                  <tr key={label} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-700">{label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                      {totales[label].toFixed(1)}h
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t">
                <td className="px-4 py-2.5 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-indigo-700">
                  {totalHoras.toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {muebles.some((m) =>
        PROCESOS_ESTIMADOS.some(({ key }) => m[key] == null || m[key] === "")
      ) && (
        <p className="text-xs text-gray-400 text-center">
          Algunos muebles no tienen todas las horas estimadas — los procesos sin datos se omiten del total.
        </p>
      )}
    </div>
  );
}
