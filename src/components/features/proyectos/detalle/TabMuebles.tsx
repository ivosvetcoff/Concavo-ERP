"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { procesoTecnicoConfig } from "@/lib/status-colors";
import { calcularAvanceMueble } from "@/lib/money";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";
import type { ProcesoTecnico, TipoTercero } from "@prisma/client";
import { cambiarProcesoMueble, eliminarMueble } from "@/server/actions/muebles";
import { MuebleSheet } from "./MuebleSheet";

const tercerosLabel: Record<TipoTercero, string> = {
  TAPICERIA: "Tapicería",
  PIEL: "Piel",
  ACCESORIOS: "Accs.",
  HERRERIA: "Herrería",
};

type Mueble = ProyectoDetalle["muebles"][0];

function BarraAvance({ pct }: { pct: number }) {
  const color =
    pct === 100
      ? "bg-green-500"
      : pct >= 70
        ? "bg-indigo-500"
        : pct >= 40
          ? "bg-amber-400"
          : "bg-gray-300";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div
          className={`${color} h-1.5 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-500 w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function FilaMueble({
  mueble,
  proyectoId,
  onEliminar,
}: {
  mueble: Mueble;
  proyectoId: string;
  onEliminar: (m: Mueble) => void;
}) {
  const router = useRouter();
  const [proceso, setProceso] = useState<string>(mueble.procesoActual ?? "");
  const [cambiando, setCambiando] = useState(false);

  const avance = calcularAvanceMueble(proceso || null, mueble.tareas[0]?.estado);

  async function handleCambiarProceso(nuevo: string) {
    if (nuevo === proceso) return;
    const anterior = proceso;
    setProceso(nuevo);
    setCambiando(true);
    try {
      await cambiarProcesoMueble({
        muebleId: mueble.id,
        procesoNuevo: (nuevo as ProcesoTecnico) || null,
      });
      router.refresh();
    } catch {
      toast.error("Error al cambiar proceso");
      setProceso(anterior);
    } finally {
      setCambiando(false);
    }
  }

  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-2.5 px-3 text-sm font-medium">
        {mueble.orden && (
          <span className="text-gray-400 font-normal mr-1.5 text-xs">
            {mueble.orden}.
          </span>
        )}
        {mueble.nombre}
        {mueble.cantidad > 1 && (
          <span className="ml-1.5 text-xs text-gray-400">x{mueble.cantidad}</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm text-gray-500">
        {mueble.madera ?? "—"}
      </td>
      <td className="py-2.5 px-3">
        <select
          value={proceso}
          onChange={(e) => handleCambiarProceso(e.target.value)}
          disabled={cambiando}
          className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-wait"
        >
          <option value="">Sin iniciar</option>
          <option value="HABILITADO">Habilitado</option>
          <option value="ARMADO">Armado</option>
          <option value="PULIDO">Pulido</option>
          <option value="LACA">Laca</option>
        </select>
      </td>
      <td className="py-2.5 px-3 min-w-[120px]">
        <BarraAvance pct={avance} />
      </td>
      <td className="py-2.5 px-3">
        <div className="flex gap-1 flex-wrap">
          {mueble.terceros.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="text-xs bg-orange-50 text-orange-700 border-orange-200"
            >
              {tercerosLabel[t as TipoTercero]}
            </Badge>
          ))}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-0.5">
          <MuebleSheet proyectoId={proyectoId} mueble={mueble} />
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-gray-400 hover:text-red-500"
            onClick={() => onEliminar(mueble)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function TabMuebles({
  muebles,
  proyectoId,
}: {
  muebles: ProyectoDetalle["muebles"];
  proyectoId: string;
}) {
  const router = useRouter();
  const [muebleAEliminar, setMuebleAEliminar] = useState<Mueble | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const avances = muebles.map((m) =>
    calcularAvanceMueble(m.procesoActual, m.tareas[0]?.estado)
  );
  const avanceTotal =
    avances.length > 0
      ? Math.round(avances.reduce((a, b) => a + b, 0) / avances.length)
      : 0;

  async function handleEliminar() {
    if (!muebleAEliminar) return;
    setEliminando(true);
    try {
      await eliminarMueble({
        muebleId: muebleAEliminar.id,
        proyectoId,
      });
      toast.success(`"${muebleAEliminar.nombre}" eliminado`);
      setMuebleAEliminar(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar mueble");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {muebles.length} mueble{muebles.length !== 1 ? "s" : ""}
            </span>
            {muebles.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Avance general</span>
                <BarraAvance pct={avanceTotal} />
              </div>
            )}
          </div>
          <MuebleSheet proyectoId={proyectoId} />
        </div>

        {muebles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Este proyecto no tiene muebles registrados.
          </div>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Mueble
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Madera
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Proceso
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Avance
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    3ros
                  </th>
                  <th className="py-2 px-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {muebles.map((m) => (
                  <FilaMueble
                    key={m.id}
                    mueble={m}
                    proyectoId={proyectoId}
                    onEliminar={setMuebleAEliminar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <Dialog
        open={muebleAEliminar !== null}
        onOpenChange={(o) => !o && setMuebleAEliminar(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar mueble</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-4">
            ¿Eliminar{" "}
            <span className="font-semibold">"{muebleAEliminar?.nombre}"</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              disabled={eliminando}
              onClick={handleEliminar}
            >
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
