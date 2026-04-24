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
import { clienteSchema, type ClienteInput } from "@/schemas/cliente";
import { crearCliente, actualizarCliente } from "@/server/actions/clientes";

type ClienteEditData = {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  rfc: string | null;
  razonSocial: string | null;
  usoCFDIDefault: string | null;
  notas: string | null;
};

type Props =
  | { mode: "crear" }
  | { mode: "editar"; cliente: ClienteEditData };

export function ClienteSheet(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const cliente = props.mode === "editar" ? props.cliente : null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
  });

  useEffect(() => {
    if (open) {
      if (cliente) {
        reset({
          nombre: cliente.nombre,
          contacto: cliente.contacto ?? "",
          telefono: cliente.telefono ?? "",
          email: cliente.email ?? "",
          rfc: cliente.rfc ?? "",
          razonSocial: cliente.razonSocial ?? "",
          usoCFDIDefault: cliente.usoCFDIDefault ?? "",
          notas: cliente.notas ?? "",
        });
      } else {
        reset({});
      }
    }
  }, [open, cliente, reset]);

  async function onSubmit(values: ClienteInput) {
    setLoading(true);
    try {
      if (props.mode === "editar" && cliente) {
        await actualizarCliente(cliente.id, values);
        toast.success("Cliente actualizado");
      } else {
        await crearCliente(values);
        toast.success("Cliente creado");
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  }

  const trigger =
    props.mode === "crear" ? (
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Nuevo cliente
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
            {props.mode === "crear" ? "Nuevo cliente" : "Editar cliente"}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="TRRA, SYG, AAGNES…"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Razón social */}
          <div className="space-y-1.5">
            <Label htmlFor="razonSocial">Razón social</Label>
            <Input
              id="razonSocial"
              placeholder="Nombre legal completo (opcional)"
              {...register("razonSocial")}
            />
          </div>

          {/* RFC + Uso CFDI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                className="uppercase"
                placeholder="XAXX010101000"
                {...register("rfc")}
                onChange={(e) => setValue("rfc", e.target.value.toUpperCase())}
              />
              {errors.rfc && (
                <p className="text-xs text-red-500">{errors.rfc.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usoCFDIDefault">Uso CFDI default</Label>
              <Input
                id="usoCFDIDefault"
                className="uppercase"
                placeholder="G03"
                {...register("usoCFDIDefault")}
                onChange={(e) =>
                  setValue("usoCFDIDefault", e.target.value.toUpperCase())
                }
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1.5">
            <Label htmlFor="contacto">Contacto</Label>
            <Input
              id="contacto"
              placeholder="Nombre de la persona de contacto"
              {...register("contacto")}
            />
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="333 000 0000"
                {...register("telefono")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              rows={3}
              placeholder="Notas internas sobre el cliente"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("notas")}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading
              ? "Guardando…"
              : props.mode === "crear"
              ? "Crear cliente"
              : "Guardar cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
