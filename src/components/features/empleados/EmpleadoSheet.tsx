"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
import { empleadoSchema, type EmpleadoInput } from "@/schemas/empleado";
import { crearEmpleado, actualizarEmpleado } from "@/server/actions/empleados";
import type { EmpleadoRow } from "@/server/queries/empleados";

const ESPECIALIDADES = [
  { value: "HABILITADOR", label: "Habilitador" },
  { value: "ARMADOR", label: "Armador" },
  { value: "PULIDOR", label: "Pulidor" },
  { value: "LAQUEADOR", label: "Laqueador" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
] as const;

const COLORES_SUGERIDOS = [
  "#6366F1", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

type Props =
  | { mode: "crear" }
  | { mode: "editar"; empleado: EmpleadoRow };

export function EmpleadoSheet(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const empleado = props.mode === "editar" ? props.empleado : null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EmpleadoInput>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: { activo: true },
  });

  const tarifaTO = useWatch({ control, name: "tarifaHoraTO" });
  const nombreVal = useWatch({ control, name: "nombre" });
  const apellidoVal = useWatch({ control, name: "apellido" });

  useEffect(() => {
    if (open) {
      if (empleado) {
        reset({
          nombre: empleado.nombre,
          apellido: empleado.apellido ?? "",
          iniciales: empleado.iniciales ?? "",
          especialidad: empleado.especialidad,
          tarifaHoraTO: empleado.tarifaHoraTO ? Number(empleado.tarifaHoraTO) : undefined,
          tarifaHoraTE: empleado.tarifaHoraTE ? Number(empleado.tarifaHoraTE) : undefined,
          sueldoSemanal: empleado.sueldoSemanal ? Number(empleado.sueldoSemanal) : undefined,
          fechaIngreso: empleado.fechaIngreso
            ? new Date(empleado.fechaIngreso).toISOString().slice(0, 10)
            : "",
          activo: empleado.activo,
          color: empleado.color ?? "",
          rfc: empleado.rfc ?? "",
          nss: empleado.nss ?? "",
        });
      } else {
        reset({ activo: true });
      }
    }
  }, [open, empleado, reset]);

  async function onSubmit(values: EmpleadoInput) {
    setLoading(true);
    try {
      if (props.mode === "editar" && empleado) {
        await actualizarEmpleado(empleado.id, values);
        toast.success("Empleado actualizado");
      } else {
        await crearEmpleado(values);
        toast.success("Empleado creado");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar empleado");
    } finally {
      setLoading(false);
    }
  }

  const trigger =
    props.mode === "crear" ? (
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Nuevo empleado
      </SheetTrigger>
    ) : (
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-gray-400 hover:text-gray-700"
          />
        }
      >
        <Pencil className="h-3.5 w-3.5" />
      </SheetTrigger>
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger}
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {props.mode === "crear" ? "Nuevo empleado" : "Editar empleado"}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                className="uppercase"
                placeholder="PEPE"
                {...register("nombre")}
                onChange={(e) => setValue("nombre", e.target.value.toUpperCase())}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                placeholder="García"
                {...register("apellido")}
              />
            </div>
          </div>

          {/* Iniciales */}
          <div className="space-y-1.5">
            <Label htmlFor="iniciales">
              Perfil / Iniciales
              <span className="ml-1 text-xs text-gray-400 font-normal">(máx 5 caracteres)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="iniciales"
                className="uppercase w-28 font-mono tracking-wider"
                placeholder="PG"
                maxLength={5}
                {...register("iniciales")}
                onChange={(e) => setValue("iniciales", e.target.value.toUpperCase())}
              />
              {(nombreVal || apellidoVal) && (
                <button
                  type="button"
                  onClick={() => {
                    const n = (nombreVal ?? "").charAt(0);
                    const a = (apellidoVal ?? "").charAt(0);
                    setValue("iniciales", (n + a).toUpperCase());
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  Auto-sugerir
                </button>
              )}
            </div>
            {errors.iniciales && (
              <p className="text-xs text-red-500">{errors.iniciales.message}</p>
            )}
          </div>

          {/* Especialidad */}
          <div className="space-y-1.5">
            <Label htmlFor="especialidad">
              Especialidad <span className="text-red-500">*</span>
            </Label>
            <select
              id="especialidad"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("especialidad")}
            >
              <option value="">Seleccionar…</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            {errors.especialidad && (
              <p className="text-xs text-red-500">{errors.especialidad.message}</p>
            )}
          </div>

          {/* Tarifas */}
          <div className="rounded-md border border-gray-200 p-3 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tarifas (MXN/hora)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tarifaHoraTO">T.O. (ordinario)</Label>
                <Input
                  id="tarifaHoraTO"
                  type="number"
                  step="0.01"
                  placeholder="73.33"
                  {...register("tarifaHoraTO")}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setValue("tarifaHoraTO", val);
                    if (!isNaN(val)) setValue("tarifaHoraTE", Math.round(val * 2 * 100) / 100);
                  }}
                />
                {errors.tarifaHoraTO && (
                  <p className="text-xs text-red-500">{errors.tarifaHoraTO.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tarifaHoraTE">T.E. (extra) = T.O. × 2</Label>
                <Input
                  id="tarifaHoraTE"
                  type="number"
                  step="0.01"
                  placeholder="146.66"
                  {...register("tarifaHoraTE")}
                />
                {errors.tarifaHoraTE && (
                  <p className="text-xs text-red-500">{errors.tarifaHoraTE.message}</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              T.E. se pre-calcula como T.O. × 2. Podés ajustarlo manualmente.
            </p>
          </div>

          {/* Sueldo semanal */}
          <div className="space-y-1.5">
            <Label htmlFor="sueldoSemanal">Sueldo semanal (MXN)</Label>
            <Input
              id="sueldoSemanal"
              type="number"
              step="0.01"
              placeholder="2500.00"
              {...register("sueldoSemanal")}
            />
          </div>

          {/* Fecha ingreso + RFC + NSS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fechaIngreso">Fecha ingreso</Label>
              <Input
                id="fechaIngreso"
                type="date"
                {...register("fechaIngreso")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                className="uppercase"
                placeholder="XAXX010101000"
                {...register("rfc")}
                onChange={(e) => setValue("rfc", e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nss">NSS (Núm. Seguro Social)</Label>
            <Input id="nss" placeholder="12345678901" {...register("nss")} />
          </div>

          {/* Color para Gantt */}
          <div className="space-y-1.5">
            <Label>Color en Gantt</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORES_SUGERIDOS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-300 hover:ring-gray-500 transition-all"
                  style={{ backgroundColor: c }}
                  onClick={() => setValue("color", c)}
                />
              ))}
              <Input
                className="w-28 font-mono text-sm"
                placeholder="#3B82F6"
                {...register("color")}
              />
            </div>
            {errors.color && (
              <p className="text-xs text-red-500">{errors.color.message}</p>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <input
              id="activo"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register("activo")}
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Empleado activo
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading
              ? "Guardando…"
              : props.mode === "crear"
              ? "Crear empleado"
              : "Guardar cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
