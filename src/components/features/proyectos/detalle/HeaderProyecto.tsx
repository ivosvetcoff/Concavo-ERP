"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate, formatMXN } from "@/lib/format";
import { cambiarEstadoProyecto, ajustarMonto } from "@/server/actions/proyectos";
import { CheckCircle2, Pencil, Calendar, DollarSign } from "lucide-react";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";
import type { EstadoProyecto } from "@prisma/client";

type Props = {
  proyecto: ProyectoDetalle;
  isOwner: boolean;
};

export function HeaderProyecto({ proyecto, isOwner }: Props) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [ajustandoMonto, setAjustandoMonto] = useState(false);
  const [montoNuevo, setMontoNuevo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loadingMonto, setLoadingMonto] = useState(false);

  const estadoCfg = estadoProyectoConfig[proyecto.estado];
  const semaforoCfg = semaforoConfig[proyecto.semaforo];

  async function handleCambiarEstado(estado: EstadoProyecto) {
    setCambiandoEstado(true);
    try {
      await cambiarEstadoProyecto({ proyectoId: proyecto.id, estado });
      toast.success(`Estado actualizado: ${estadoProyectoConfig[estado].label}`);
      router.refresh();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function handleAjustarMonto() {
    if (!montoNuevo || !motivo || motivo.length < 5) return;
    setLoadingMonto(true);
    try {
      await ajustarMonto({ proyectoId: proyecto.id, montoNuevo, motivo });
      toast.success("Monto actualizado");
      setAjustandoMonto(false);
      setMontoNuevo("");
      setMotivo("");
      router.refresh();
    } catch {
      toast.error("Error al ajustar monto");
    } finally {
      setLoadingMonto(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      {/* Línea 1: código + nombre + badges */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-2xl font-bold text-indigo-700">
            #{proyecto.codigo}
          </span>
          <h1 className="text-xl font-semibold text-gray-900">
            {proyecto.nombre}
          </h1>
          <Badge variant="outline" className={estadoCfg.badge}>
            {estadoCfg.label}
          </Badge>
          <Badge variant="outline" className={semaforoCfg.badge}>
            {semaforoCfg.label}
          </Badge>
          {proyecto.tieneHC && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              HC
            </Badge>
          )}
          {isOwner && (
            <Badge
              variant="outline"
              className={
                proyecto.facturado
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-400 border-gray-200"
              }
            >
              {proyecto.facturado ? "Facturado" : "Sin facturar"}
            </Badge>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Cambiar estado */}
          <Select
            value={proyecto.estado}
            onValueChange={(v) => handleCambiarEstado(String(v) as EstadoProyecto)}
            disabled={cambiandoEstado}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(estadoProyectoConfig) as EstadoProyecto[]).map(
                (estado) => (
                  <SelectItem key={estado} value={estado} className="text-xs">
                    {estadoProyectoConfig[estado].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {/* Ajustar monto — solo OWNER */}
          {isOwner && (
            <Dialog open={ajustandoMonto} onOpenChange={setAjustandoMonto}>
              <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" />}>
                <Pencil className="h-3.5 w-3.5" />
                Ajustar monto
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Ajustar monto vendido</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Monto actual</Label>
                    <p className="text-sm font-mono text-gray-600">
                      {formatMXN(proyecto.montoVendido.toString())}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="montoNuevo">Monto nuevo (MXN)</Label>
                    <Input
                      id="montoNuevo"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={montoNuevo}
                      onChange={(e) => setMontoNuevo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motivo">
                      Motivo <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="motivo"
                      rows={3}
                      placeholder="Describe el motivo del ajuste (mín. 5 caracteres)"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setAjustandoMonto(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={!montoNuevo || motivo.length < 5 || loadingMonto}
                      onClick={handleAjustarMonto}
                    >
                      {loadingMonto ? "Guardando…" : "Guardar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Separator />

      {/* Línea 2: metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Cliente</p>
          <p className="font-medium">{proyecto.cliente.nombre}</p>
        </div>
        {proyecto.po && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">P.O.</p>
            <p className="font-medium">{proyecto.po}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Compromiso
          </p>
          <p className="font-medium tabular-nums">
            {formatDate(proyecto.fechaCompromiso) || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Entrega
          </p>
          <p className="font-medium tabular-nums">
            {formatDate(proyecto.fechaEntrega) || "—"}
          </p>
        </div>
        {isOwner && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Monto vendido
            </p>
            <p className="font-semibold text-base tabular-nums">
              {formatMXN(proyecto.montoVendido.toString())}
            </p>
          </div>
        )}
        {isOwner && proyecto.anticipo && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Anticipo</p>
            <p className="font-medium tabular-nums">
              {formatMXN(proyecto.anticipo.toString())}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ítems</p>
          <p className="font-medium">{proyecto.qtyItems}</p>
        </div>
        {proyecto.comentarios && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Comentarios</p>
            <p className="text-gray-600">{proyecto.comentarios}</p>
          </div>
        )}
      </div>
    </div>
  );
}
