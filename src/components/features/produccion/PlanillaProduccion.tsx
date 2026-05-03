"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Clock } from "lucide-react";
import type { EmpleadoConRegistros, MuebleParaSelector } from "@/server/queries/produccion";
import type { EspecialidadEmpleado } from "@prisma/client";
import { eliminarRegistro } from "@/server/actions/produccion";
import { RegistroSheet } from "./RegistroSheet";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitado",
  ARMADOR: "Armado",
  PULIDOR: "Pulido",
  LAQUEADOR: "Laca",
  ADMINISTRATIVO: "Administrativo",
};

const PROCESO_LABELS: Record<string, string> = {
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
  empleados: EmpleadoConRegistros[];
  mueblesActivos: MuebleParaSelector[];
  semana: string;
};

function calcularTotalHoras(registros: EmpleadoConRegistros["registros"]) {
  return registros.reduce(
    (acc, r) => ({
      to: acc.to + parseFloat(r.horasTO || "0"),
      te: acc.te + parseFloat(r.horasTE || "0"),
    }),
    { to: 0, te: 0 }
  );
}

function formatHoras(h: number): string {
  return h % 1 === 0 ? `${h}` : h.toFixed(1);
}

function EmpleadoCard({
  empleado,
  mueblesActivos,
  semana,
}: {
  empleado: EmpleadoConRegistros;
  mueblesActivos: MuebleParaSelector[];
  semana: string;
}) {
  const router = useRouter();
  const totales = calcularTotalHoras(empleado.registros);
  const nombreCompleto = [empleado.nombre, empleado.apellido]
    .filter(Boolean)
    .join(" ");

  async function handleEliminar(registroId: string) {
    if (!confirm("¿Eliminar este registro de horas?")) return;
    try {
      await eliminarRegistro({ registroId });
      toast.success("Registro eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar el registro");
    }
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header del empleado */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={
          empleado.color
            ? { borderLeftColor: empleado.color, borderLeftWidth: "3px" }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">{nombreCompleto}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {ESPECIALIDAD_LABELS[empleado.especialidad]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(totales.to > 0 || totales.te > 0) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                T.O. <span className="font-semibold text-gray-700">{formatHoras(totales.to)}h</span>
              </span>
              {totales.te > 0 && (
                <span>
                  T.E. <span className="font-semibold text-amber-600">{formatHoras(totales.te)}h</span>
                </span>
              )}
            </div>
          )}
          <RegistroSheet
            mode="crear"
            empleado={empleado}
            mueblesActivos={mueblesActivos}
            semana={semana}
          />
        </div>
      </div>

      {/* Registros */}
      {empleado.registros.length === 0 ? (
        <div className="px-4 py-5 text-center text-xs text-gray-400">
          Sin registros esta semana
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-1.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Proyecto / Mueble
              </th>
              <th className="text-left py-1.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Proceso
              </th>
              <th className="text-center py-1.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                T.O.
              </th>
              <th className="text-center py-1.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                T.E.
              </th>
              <th className="w-16 py-1.5 px-3" />
            </tr>
          </thead>
          <tbody>
            {empleado.registros.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-400">#{r.proyectoCodigo}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[120px]">
                      {r.proyectoNombre}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                    {r.muebleNombre}
                  </div>
                  {r.notas && (
                    <div className="text-xs text-gray-400 italic mt-0.5 truncate max-w-[220px]">
                      {r.notas}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">
                  {PROCESO_LABELS[r.proceso] ?? r.proceso}
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-medium tabular-nums">
                  {formatHoras(parseFloat(r.horasTO))}h
                </td>
                <td className="py-2.5 px-3 text-center text-sm tabular-nums">
                  {parseFloat(r.horasTE) > 0 ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-medium text-amber-600">
                        {formatHoras(parseFloat(r.horasTE))}h
                      </span>
                      {r.esCompensatorio && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">
                          Comp.
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 justify-end">
                    <RegistroSheet
                      mode="editar"
                      empleado={empleado}
                      mueblesActivos={mueblesActivos}
                      semana={semana}
                      registro={r}
                      triggerVariant="icon"
                    />
                    <button
                      onClick={() => handleEliminar(r.id)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function PlanillaProduccion({ empleados, mueblesActivos, semana }: Props) {
  const totalTO = empleados
    .flatMap((e) => e.registros)
    .reduce((s, r) => s + parseFloat(r.horasTO || "0"), 0);
  const totalTE = empleados
    .flatMap((e) => e.registros)
    .reduce((s, r) => s + parseFloat(r.horasTE || "0"), 0);
  const totalRegistros = empleados.reduce((s, e) => s + e.registros.length, 0);

  return (
    <div className="space-y-3">
      {/* Resumen semanal */}
      {totalRegistros > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-600 bg-white border rounded-lg px-4 py-2.5">
          <span className="font-medium text-gray-700">Semana total:</span>
          <span>
            T.O. <span className="font-semibold text-gray-900">{formatHoras(totalTO)}h</span>
          </span>
          {totalTE > 0 && (
            <span>
              T.E. <span className="font-semibold text-amber-600">{formatHoras(totalTE)}h</span>
            </span>
          )}
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{totalRegistros} {totalRegistros === 1 ? "registro" : "registros"}</span>
        </div>
      )}

      {/* Cards por empleado */}
      {empleados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border rounded-lg text-sm">
          No hay empleados activos registrados.
        </div>
      ) : (
        empleados.map((empleado) => (
          <EmpleadoCard
            key={empleado.id}
            empleado={empleado}
            mueblesActivos={mueblesActivos}
            semana={semana}
          />
        ))
      )}
    </div>
  );
}
