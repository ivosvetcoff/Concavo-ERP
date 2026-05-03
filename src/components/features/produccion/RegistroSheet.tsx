"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  upsertRegistroSchema,
  type UpsertRegistroInput,
} from "@/schemas/produccion";
import { upsertRegistro } from "@/server/actions/produccion";
import type { EmpleadoConRegistros, MuebleParaSelector, RegistroRow } from "@/server/queries/produccion";
import type { ProcesoTecnico } from "@prisma/client";

const PROCESO_LABELS: Record<ProcesoTecnico, string> = {
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

const PROCESOS = Object.entries(PROCESO_LABELS) as [ProcesoTecnico, string][];

type Props = {
  mode: "crear" | "editar";
  empleado: Pick<EmpleadoConRegistros, "id" | "nombre" | "apellido">;
  mueblesActivos: MuebleParaSelector[];
  semana: string;
  registro?: RegistroRow;
  triggerVariant?: "icon" | "button";
};

export function RegistroSheet({
  mode,
  empleado,
  mueblesActivos,
  semana,
  registro,
  triggerVariant = "button",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertRegistroInput>({
    resolver: zodResolver(upsertRegistroSchema),
    defaultValues: {
      empleadoId: empleado.id,
      muebleId: registro?.muebleId ?? "",
      proceso: registro?.proceso ?? "HABILITADO",
      semana: new Date(semana + "T00:00:00"),
      horasTO: registro ? parseFloat(registro.horasTO) : 0,
      horasTE: registro ? parseFloat(registro.horasTE) : 0,
      esCompensatorio: registro?.esCompensatorio ?? false,
      notas: registro?.notas ?? "",
    },
  });

  const horasTE = watch("horasTE");

  useEffect(() => {
    if (open) {
      reset({
        empleadoId: empleado.id,
        muebleId: registro?.muebleId ?? "",
        proceso: registro?.proceso ?? "HABILITADO",
        semana: new Date(semana + "T00:00:00"),
        horasTO: registro ? parseFloat(registro.horasTO) : 0,
        horasTE: registro ? parseFloat(registro.horasTE) : 0,
        esCompensatorio: registro?.esCompensatorio ?? false,
        notas: registro?.notas ?? "",
      });
    }
  }, [open, registro, empleado.id, semana, reset]);

  async function onSubmit(data: UpsertRegistroInput) {
    try {
      await upsertRegistro(data);
      toast.success(
        mode === "crear" ? "Registro guardado" : "Registro actualizado"
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  const nombreEmpleado = [empleado.nombre, empleado.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {triggerVariant === "icon" ? (
        <SheetTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
          <Pencil className="h-3.5 w-3.5" />
        </SheetTrigger>
      ) : (
        <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
          <Plus className="h-3.5 w-3.5" />
          Agregar registro
        </SheetTrigger>
      )}

      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "crear" ? "Nuevo registro" : "Editar registro"}
          </SheetTitle>
          <p className="text-sm text-gray-500">{nombreEmpleado}</p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 space-y-4 mt-4">
          {/* Mueble */}
          <div className="space-y-1.5">
            <Label htmlFor="muebleId">Mueble</Label>
            <select
              id="muebleId"
              {...register("muebleId")}
              className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Seleccionar mueble…</option>
              {mueblesActivos.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.proyectoCodigo} · {m.proyectoNombre} / {m.nombre}
                </option>
              ))}
            </select>
            {errors.muebleId && (
              <p className="text-xs text-red-600">{errors.muebleId.message}</p>
            )}
          </div>

          {/* Proceso */}
          <div className="space-y-1.5">
            <Label htmlFor="proceso">Proceso</Label>
            <select
              id="proceso"
              {...register("proceso")}
              className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              {PROCESOS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.proceso && (
              <p className="text-xs text-red-600">{errors.proceso.message}</p>
            )}
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horasTO">T.O. (horas ordinarias)</Label>
              <Input
                id="horasTO"
                type="number"
                step="0.5"
                min="0"
                max="80"
                {...register("horasTO")}
              />
              {errors.horasTO && (
                <p className="text-xs text-red-600">{errors.horasTO.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horasTE">T.E. (horas extra)</Label>
              <Input
                id="horasTE"
                type="number"
                step="0.5"
                min="0"
                max="80"
                {...register("horasTE")}
              />
              {errors.horasTE && (
                <p className="text-xs text-red-600">{errors.horasTE.message}</p>
              )}
            </div>
          </div>

          {/* Compensatorio — solo visible si hay T.E. */}
          {Number(horasTE) > 0 && (
            <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-amber-500"
                {...register("esCompensatorio")}
              />
              <div>
                <span className="text-sm font-medium text-amber-800">T.E. compensatoria</span>
                <p className="text-xs text-amber-600 mt-0.5">
                  Marcá si la T.E. fue para no atrasar el proyecto (el operador absorbió el exceso). Si fue por sobrecarga, dejalo desmarcado.
                </p>
              </div>
            </label>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input id="notas" {...register("notas")} placeholder="Observaciones…" />
          </div>

          <input type="hidden" {...register("empleadoId")} />
          <input type="hidden" value={semana} {...register("semana")} />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Guardando…" : mode === "crear" ? "Guardar registro" : "Actualizar registro"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
