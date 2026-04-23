"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ClienteSheet } from "./ClienteSheet";
import { eliminarCliente } from "@/server/actions/clientes";
import type { ClienteRow } from "@/server/queries/clientes";

type Props = {
  clientes: ClienteRow[];
};

export function ClientesTabla({ clientes }: Props) {
  const router = useRouter();
  const [clienteAEliminar, setClienteAEliminar] = useState<ClienteRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  async function handleEliminar() {
    if (!clienteAEliminar) return;
    setEliminando(true);
    try {
      await eliminarCliente(clienteAEliminar.id);
      toast.success("Cliente eliminado");
      setClienteAEliminar(null);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al eliminar";
      toast.error(msg);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
          </span>
          <ClienteSheet mode="crear" />
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white border rounded-lg">
            No hay clientes registrados.
          </div>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Nombre
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    RFC
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Contacto
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Teléfono
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Proyectos
                  </th>
                  <th className="py-2 px-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-gray-900">{c.nombre}</p>
                      {c.razonSocial && (
                        <p className="text-xs text-gray-400">{c.razonSocial}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.rfc ? (
                        <span className="font-mono text-xs text-gray-600">
                          {c.rfc}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      <p>{c.contacto || "—"}</p>
                      {c.email && (
                        <p className="text-xs text-gray-400">{c.email}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 tabular-nums text-xs">
                      {c.telefono || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      {c._count.proyectos > 0 ? (
                        <a
                          href={`/proyectos?cliente=${c.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                        >
                          <FolderOpen className="h-3 w-3" />
                          {c._count.proyectos}
                        </a>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-gray-400 border-gray-200"
                        >
                          Sin proyectos
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 justify-end">
                        <ClienteSheet mode="editar" cliente={c} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => setClienteAEliminar(c)}
                          disabled={c._count.proyectos > 0}
                          title={
                            c._count.proyectos > 0
                              ? "No se puede eliminar: tiene proyectos"
                              : "Eliminar"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={clienteAEliminar !== null}
        onOpenChange={(o) => !o && setClienteAEliminar(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-4">
            ¿Eliminar a{" "}
            <span className="font-semibold">{clienteAEliminar?.nombre}</span>?
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
