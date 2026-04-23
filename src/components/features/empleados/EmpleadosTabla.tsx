"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmpleadoSheet } from "./EmpleadoSheet";
import {
  eliminarEmpleado,
  toggleActivoEmpleado,
} from "@/server/actions/empleados";
import type { EmpleadoRow } from "@/server/queries/empleados";
import type { EspecialidadEmpleado } from "@prisma/client";

const ESPECIALIDAD_LABEL: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

const ESPECIALIDAD_BADGE: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "bg-blue-100 text-blue-700",
  ARMADOR: "bg-purple-100 text-purple-700",
  PULIDOR: "bg-green-100 text-green-700",
  LAQUEADOR: "bg-yellow-100 text-yellow-700",
  ADMINISTRATIVO: "bg-gray-100 text-gray-700",
};

function formatMXN(val: string | null) {
  if (!val) return "—";
  return `$${parseFloat(val).toFixed(2)}`;
}

type Props = {
  empleados: EmpleadoRow[];
  isOwner: boolean;
};

export function EmpleadosTabla({ empleados, isOwner }: Props) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState<EmpleadoRow | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleToggleActivo(e: EmpleadoRow) {
    setLoadingId(e.id);
    try {
      await toggleActivoEmpleado(e.id, !e.activo);
      toast.success(e.activo ? "Empleado desactivado" : "Empleado activado");
      router.refresh();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    setLoadingId(eliminando.id);
    setDeleteError(null);
    try {
      await eliminarEmpleado(eliminando.id);
      toast.success("Empleado eliminado");
      setEliminando(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setLoadingId(null);
    }
  }

  // Agrupar por especialidad
  const agrupados = empleados.reduce<Record<string, EmpleadoRow[]>>(
    (acc, e) => {
      const key = e.especialidad;
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {}
  );

  const orden: EspecialidadEmpleado[] = [
    "HABILITADOR",
    "ARMADOR",
    "PULIDOR",
    "LAQUEADOR",
    "ADMINISTRATIVO",
  ];

  return (
    <>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Nombre
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Especialidad
              </th>
              {isOwner && (
                <>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    T.O. /hr
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    T.E. /hr
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Sueldo semanal
                  </th>
                </>
              )}
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                Estado
              </th>
              {isOwner && (
                <th className="px-4 py-3 font-medium text-gray-600 w-24" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orden.map((esp) => {
              const filas = agrupados[esp];
              if (!filas?.length) return null;
              return filas.map((e, i) => (
                <tr
                  key={e.id}
                  className={`${!e.activo ? "opacity-50" : ""} hover:bg-gray-50`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {e.color && (
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: e.color }}
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        {e.nombre}
                        {e.apellido ? ` ${e.apellido}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {i === 0 && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ESPECIALIDAD_BADGE[e.especialidad]}`}
                      >
                        {ESPECIALIDAD_LABEL[e.especialidad]}
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {formatMXN(e.tarifaHoraTO)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {formatMXN(e.tarifaHoraTE)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {formatMXN(e.sueldoSemanal)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <EmpleadoSheet mode="editar" empleado={e} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-gray-400 hover:text-gray-700"
                          disabled={loadingId === e.id}
                          onClick={() => handleToggleActivo(e)}
                          title={e.activo ? "Desactivar" : "Activar"}
                        >
                          {e.activo ? (
                            <ToggleRight className="h-3.5 w-3.5" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          disabled={loadingId === e.id}
                          onClick={() => {
                            setDeleteError(null);
                            setEliminando(e);
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ));
            })}
            {empleados.length === 0 && (
              <tr>
                <td
                  colSpan={isOwner ? 7 : 3}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  No hay empleados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog confirmación eliminación */}
      <Dialog
        open={!!eliminando}
        onOpenChange={(o) => {
          if (!o) { setEliminando(null); setDeleteError(null); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogTitle>Eliminar empleado</DialogTitle>
          <DialogDescription>
            ¿Eliminar a <strong>{eliminando?.nombre}</strong>? Esta acción no se
            puede deshacer. Si tiene registros asociados, se bloqueará
            automáticamente.
          </DialogDescription>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setEliminando(null); setDeleteError(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loadingId === eliminando?.id}
              onClick={handleEliminar}
            >
              {loadingId === eliminando?.id ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
