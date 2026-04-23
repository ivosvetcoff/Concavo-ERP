"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CheckCircle, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { registrarAusencia, aprobarAusencia, eliminarAusencia } from "@/server/actions/rrhh";
import type { AusenciaFila } from "@/server/queries/rrhh";
import type { TipoAusencia } from "@prisma/client";

const TIPO_LABELS: Record<TipoAusencia, string> = {
  VACACIONES: "Vacaciones",
  INCAPACIDAD: "Incapacidad",
  PERMISO_CON_GOCE: "Permiso c/goce",
  PERMISO_SIN_GOCE: "Permiso s/goce",
  FALTA: "Falta",
  DIA_FESTIVO: "Día festivo",
};

const TIPO_COLORS: Record<TipoAusencia, string> = {
  VACACIONES: "bg-blue-50 text-blue-700 border-blue-200",
  INCAPACIDAD: "bg-amber-50 text-amber-700 border-amber-200",
  PERMISO_CON_GOCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PERMISO_SIN_GOCE: "bg-orange-50 text-orange-700 border-orange-200",
  FALTA: "bg-red-50 text-red-700 border-red-200",
  DIA_FESTIVO: "bg-purple-50 text-purple-700 border-purple-200",
};

type EmpleadoOption = { id: string; nombre: string; apellido: string | null };

type Props = {
  ausencias: AusenciaFila[];
  empleados: EmpleadoOption[];
};

function NuevaAusenciaForm({
  empleados,
  onClose,
}: {
  empleados: EmpleadoOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    empleadoId: "",
    tipo: "VACACIONES" as TipoAusencia,
    fechaInicio: "",
    fechaFin: "",
    diasHabiles: 1,
    aprobada: true,
    pagada: true,
    notas: "",
  });

  function field(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.type === "number"
        ? parseInt(e.target.value)
        : e.target.value;
      setForm((prev) => ({ ...prev, [k]: val }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.empleadoId || !form.fechaInicio || !form.fechaFin) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    startTransition(async () => {
      try {
        await registrarAusencia(form);
        toast.success("Ausencia registrada");
        onClose();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-4">
      <p className="text-sm font-semibold text-gray-700">Nueva ausencia</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Empleado *</label>
          <select value={form.empleadoId} onChange={field("empleadoId")}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="">Seleccionar…</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {[e.nombre, e.apellido].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Tipo *</label>
          <select value={form.tipo} onChange={field("tipo")}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
            {(Object.entries(TIPO_LABELS) as [TipoAusencia, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Fecha inicio *</label>
          <input type="date" value={form.fechaInicio} onChange={field("fechaInicio")}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Fecha fin *</label>
          <input type="date" value={form.fechaFin} onChange={field("fechaFin")}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Días hábiles</label>
          <input type="number" min={1} max={30} value={form.diasHabiles} onChange={field("diasHabiles")}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Notas</label>
          <input type="text" value={form.notas} onChange={field("notas")} placeholder="Opcional"
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.aprobada} onChange={field("aprobada")} className="rounded" />
          <span className="text-gray-600">Aprobada</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.pagada} onChange={field("pagada")} className="rounded" />
          <span className="text-gray-600">Con goce de sueldo</span>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : "Registrar ausencia"}
        </Button>
      </div>
    </form>
  );
}

export function AusenciasTabla({ ausencias, empleados }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  function handleAprobar(id: string) {
    startTransition(async () => {
      await aprobarAusencia(id);
      toast.success("Ausencia aprobada");
      router.refresh();
    });
  }

  function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta ausencia?")) return;
    startTransition(async () => {
      await eliminarAusencia(id);
      toast.success("Ausencia eliminada");
      router.refresh();
    });
  }

  // Resumen: total días por tipo en el período actual
  const totalPorTipo = ausencias.reduce<Partial<Record<TipoAusencia, number>>>((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] ?? 0) + a.diasHabiles;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Resumen chips */}
      {ausencias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(totalPorTipo) as [TipoAusencia, number][]).map(([tipo, dias]) => (
            <span key={tipo} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${TIPO_COLORS[tipo]}`}>
              <Calendar className="h-3 w-3" />
              {TIPO_LABELS[tipo]}: <strong>{dias}d</strong>
            </span>
          ))}
        </div>
      )}

      {/* Botón nueva ausencia */}
      {!showForm && (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Registrar ausencia
        </Button>
      )}

      {showForm && <NuevaAusenciaForm empleados={empleados} onClose={() => setShowForm(false)} />}

      {/* Tabla */}
      {ausencias.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white border rounded-lg text-sm">
          No hay ausencias registradas en este período.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inicio</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fin</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Días</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="py-2 px-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {ausencias.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-medium text-gray-900">
                    {[a.empleadoNombre, a.empleadoApellido].filter(Boolean).join(" ")}
                    {a.notas && <p className="text-xs text-gray-400 font-normal">{a.notas}</p>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${TIPO_COLORS[a.tipo]}`}>
                      {TIPO_LABELS[a.tipo]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums">
                    {formatDate(a.fechaInicio)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums">
                    {formatDate(a.fechaFin)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-gray-900">
                    {a.diasHabiles}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.aprobada ? (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Aprobada
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 justify-end">
                      {!a.aprobada && (
                        <button onClick={() => handleAprobar(a.id)}
                          className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition-colors"
                          title="Aprobar">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleEliminar(a.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
