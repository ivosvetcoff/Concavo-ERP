"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agregarMueble, actualizarMueble } from "@/server/actions/muebles";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";
import type { TipoTercero, ProcesoTecnico, Estructura, EstadoItem } from "@prisma/client";

type Mueble = ProyectoDetalle["muebles"][0];

const TERCEROS: { value: TipoTercero; label: string }[] = [
  { value: "TAPICERIA", label: "Tapicería" },
  { value: "PIEL", label: "Piel" },
  { value: "ACCESORIOS", label: "Accesorios" },
  { value: "HERRERIA", label: "Herrería" },
  { value: "MARMOL", label: "Mármol" },
  { value: "ESPEJO", label: "Espejo" },
  { value: "TEJIDO", label: "Tejido" },
  { value: "OTROS", label: "Otros" },
];

const PROCESOS: { value: string; label: string }[] = [
  { value: "HABILITADO", label: "Habilitado" },
  { value: "ARMADO", label: "Armado" },
  { value: "PULIDO", label: "Pulido" },
  { value: "LACA", label: "Laca" },
  { value: "EXTERNO", label: "Externo" },
  { value: "COMPLEMENTOS", label: "Complementos" },
  { value: "EMPAQUE", label: "Empaque" },
  { value: "LISTO_PARA_ENTREGA", label: "Listo p/ entrega" },
  { value: "ENTREGADO", label: "Entregado" },
];

const ESTADOS_ITEM: { value: EstadoItem; label: string }[] = [
  { value: "ESPERA", label: "Espera" },
  { value: "FABRICACION", label: "Fabricación" },
  { value: "REPROCESO", label: "Reproceso" },
  { value: "PAUSA", label: "Pausa" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ENTREGADO", label: "Entregado" },
];

const ESTRUCTURAS: { value: Estructura; label: string }[] = [
  { value: "MDF", label: "MDF" },
  { value: "PTR", label: "PTR" },
  { value: "NA", label: "N/A" },
];

const PROCESO_NONE = "__none__";
const ESTRUCTURA_NONE = "__none__";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cantidad: z.coerce.number().int().min(1, "Mínimo 1"),
  madera: z.string().optional(),
  notasTerceros: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  proyectoId: string;
  mueble?: Mueble;
};

export function MuebleSheet({ proyectoId, mueble }: Props) {
  const isEdit = !!mueble;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terceros, setTerceros] = useState<TipoTercero[]>([]);
  const [proceso, setProceso] = useState<string>(PROCESO_NONE);
  const [estructura, setEstructura] = useState<string>(ESTRUCTURA_NONE);
  const [estadoItem, setEstadoItem] = useState<EstadoItem>("ESPERA");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: mueble?.nombre ?? "",
        cantidad: mueble?.cantidad ?? 1,
        madera: mueble?.madera ?? "",
        notasTerceros: mueble?.notasTerceros ?? "",
      });
      setTerceros((mueble?.terceros as TipoTercero[]) ?? []);
      setProceso(mueble?.procesoActual ?? PROCESO_NONE);
      setEstructura(mueble?.estructura ?? ESTRUCTURA_NONE);
      setEstadoItem(mueble?.estadoItem ?? "ESPERA");
    }
  }, [open, mueble, reset]);

  function toggleTercero(t: TipoTercero) {
    setTerceros((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const procesoActual =
      proceso === PROCESO_NONE ? undefined : (proceso as ProcesoTecnico);
    const estructuraVal =
      estructura === ESTRUCTURA_NONE ? null : (estructura as Estructura);
    try {
      if (isEdit && mueble) {
        await actualizarMueble({
          muebleId: mueble.id,
          proyectoId,
          nombre: values.nombre,
          cantidad: values.cantidad,
          madera: values.madera || undefined,
          notasTerceros: values.notasTerceros || undefined,
          terceros,
          estructura: estructuraVal,
          estadoItem,
          procesoActual: procesoActual ?? null,
        });
        toast.success("Mueble actualizado");
      } else {
        await agregarMueble({
          proyectoId,
          nombre: values.nombre,
          cantidad: values.cantidad,
          madera: values.madera || undefined,
          notasTerceros: values.notasTerceros || undefined,
          terceros,
          estructura: estructuraVal,
          estadoItem,
          procesoActual,
        });
        toast.success("Mueble agregado");
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar mueble");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-gray-400 hover:text-gray-700"
            />
          }
        >
          <Pencil className="h-3.5 w-3.5" />
        </SheetTrigger>
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          Agregar mueble
        </SheetTrigger>
      )}

      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar mueble" : "Agregar mueble"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej. Cama VILNA Queen Size"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                {...register("cantidad")}
              />
              {errors.cantidad && (
                <p className="text-xs text-red-500">{errors.cantidad.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="madera">Madera</Label>
              <Input
                id="madera"
                placeholder="Ej. PAROTA"
                className="uppercase"
                {...register("madera")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estructura</Label>
              <Select
                value={estructura}
                onValueChange={(v) => setEstructura(String(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin definir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ESTRUCTURA_NONE}>Sin definir</SelectItem>
                  {ESTRUCTURAS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado ítem</Label>
              <Select
                value={estadoItem}
                onValueChange={(v) => setEstadoItem(v as EstadoItem)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_ITEM.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Proceso actual</Label>
            <Select
              value={proceso}
              onValueChange={(v) => setProceso(String(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proceso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROCESO_NONE}>Sin proceso</SelectItem>
                {PROCESOS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Terceros</Label>
            <div className="flex flex-wrap gap-2">
              {TERCEROS.map((t) => {
                const activo = terceros.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTercero(t.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      activo
                        ? "bg-orange-100 text-orange-700 border-orange-300"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {terceros.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="notasTerceros">Notas de terceros</Label>
              <Input
                id="notasTerceros"
                placeholder="Ej. Tapicería: tela beige, entrega semana 3"
                {...register("notasTerceros")}
              />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Agregar mueble"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
