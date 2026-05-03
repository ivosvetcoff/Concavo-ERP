"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { crearProyectoSchema, type CrearProyectoInput } from "@/schemas/proyecto";
import { crearProyecto } from "@/server/actions/proyectos";
import { estadoProyectoConfig } from "@/lib/status-colors";
import type { EstadoProyecto } from "@prisma/client";

type ClienteOpcion = { id: string; nombre: string };

type Props = {
  clientes: ClienteOpcion[];
  isOwner: boolean;
};

export function NuevoProyectoSheet({ clientes, isOwner }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CrearProyectoInput>({
    resolver: zodResolver(crearProyectoSchema),
    defaultValues: {
      estado: "COTIZACION",
    },
  });

  async function onSubmit(data: CrearProyectoInput) {
    setLoading(true);
    try {
      const res = await crearProyecto(data);
      if (res.ok) {
        toast.success(`Proyecto ${res.codigo} creado`);
        reset();
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error("Error al crear el proyecto");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Datos Básicos */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Recámara principal SYG"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(v) => setValue("clienteId", String(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && (
                  <p className="text-xs text-red-500">{errors.clienteId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Estado inicial</Label>
                  <Select
                    defaultValue="COTIZACION"
                    onValueChange={(v) => setValue("estado", String(v) as EstadoProyecto)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(estadoProyectoConfig) as EstadoProyecto[]).map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estadoProyectoConfig[estado].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechaCompromiso">Fecha compromiso</Label>
                  <Input
                    id="fechaCompromiso"
                    type="date"
                    {...register("fechaCompromiso")}
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Finanzas y PO */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="po">P.O.</Label>
                  <Input id="po" placeholder="Número de P.O." {...register("po")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechaPO">Fecha P.O.</Label>
                  <Input id="fechaPO" type="date" {...register("fechaPO")} />
                </div>
              </div>

              {isOwner && (
                <div className="space-y-1.5">
                  <Label htmlFor="montoVendido">
                    Monto vendido (MXN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="montoVendido"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("montoVendido")}
                  />
                  {errors.montoVendido && (
                    <p className="text-xs text-red-500">{errors.montoVendido.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="comentarios">Comentarios</Label>
            <textarea
              id="comentarios"
              placeholder="Notas internas sobre el proyecto…"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              {...register("comentarios")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Crear proyecto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
