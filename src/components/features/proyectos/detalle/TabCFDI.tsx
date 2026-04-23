"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { marcarFacturado } from "@/server/actions/proyectos";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";

type Props = {
  proyecto: ProyectoDetalle;
};

export function TabCFDI({ proyecto }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [facturado, setFacturado] = useState(proyecto.facturado ?? false);
  const [numeroCFDI, setNumeroCFDI] = useState(proyecto.numeroCFDI ?? "");
  const [rfcCliente, setRfcCliente] = useState(proyecto.rfcCliente ?? "");
  const [usoCFDI, setUsoCFDI] = useState(proyecto.usoCFDI ?? "");
  const [metodoPago, setMetodoPago] = useState<"PUE" | "PPD" | "">(
    (proyecto.metodoPago as "PUE" | "PPD") ?? ""
  );
  const [formaPago, setFormaPago] = useState(proyecto.formaPago ?? "");
  const [fechaFacturacion, setFechaFacturacion] = useState(
    proyecto.fechaFacturacion
      ? new Date(proyecto.fechaFacturacion).toISOString().split("T")[0]
      : ""
  );

  async function handleGuardar() {
    setLoading(true);
    try {
      await marcarFacturado({
        proyectoId: proyecto.id,
        facturado,
        numeroCFDI: numeroCFDI || undefined,
        rfcCliente: rfcCliente || undefined,
        usoCFDI: usoCFDI || undefined,
        metodoPago: metodoPago || undefined,
        formaPago: formaPago || undefined,
        fechaFacturacion: fechaFacturacion ? new Date(fechaFacturacion) : undefined,
      });
      toast.success("Datos de facturación guardados");
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
        En esta fase el sistema solo registra datos de CFDIs emitidos externamente.
        La emisión automática vía PAC estará disponible en una fase futura.
      </div>

      {/* Toggle principal */}
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div>
          <p className="font-medium">Este proyecto fue facturado</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {facturado
              ? proyecto.fechaFacturacion
                ? `Facturado el ${formatDate(proyecto.fechaFacturacion)}`
                : "Marcado como facturado"
              : "Sin CFDI emitido"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {facturado && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Facturado
            </Badge>
          )}
          <Switch
            checked={facturado}
            onCheckedChange={setFacturado}
          />
        </div>
      </div>

      {facturado && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Datos del CFDI
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="numeroCFDI">UUID / Folio del CFDI</Label>
              <Input
                id="numeroCFDI"
                placeholder="Ej. 550e8400-e29b-41d4-a716-446655440000"
                value={numeroCFDI}
                onChange={(e) => setNumeroCFDI(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rfcCliente">RFC del receptor</Label>
                <Input
                  id="rfcCliente"
                  placeholder="XAXX010101000"
                  className="uppercase"
                  value={rfcCliente}
                  onChange={(e) => setRfcCliente(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usoCFDI">Uso CFDI</Label>
                <Input
                  id="usoCFDI"
                  placeholder="G03, P01, I08…"
                  className="uppercase"
                  value={usoCFDI}
                  onChange={(e) => setUsoCFDI(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Método de pago</Label>
                <Select
                  value={metodoPago}
                  onValueChange={(v) => setMetodoPago(String(v) as "PUE" | "PPD")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUE">PUE — Una sola exhibición</SelectItem>
                    <SelectItem value="PPD">PPD — Parcialidades/Diferido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="formaPago">Forma de pago (clave SAT)</Label>
                <Input
                  id="formaPago"
                  placeholder="01, 03, 04…"
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fechaFacturacion">Fecha de facturación</Label>
              <Input
                id="fechaFacturacion"
                type="date"
                value={fechaFacturacion}
                onChange={(e) => setFechaFacturacion(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <Button onClick={handleGuardar} disabled={loading} className="w-full">
        {loading ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
