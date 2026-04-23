"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrarTipoCambio } from "@/server/actions/tipo-cambio";

type TipoCambioRow = {
  id: string;
  fecha: string;
  mxnUsd: string;
  fuente: string | null;
};

type Props = {
  historial: TipoCambioRow[];
};

export function TipoCambioView({ historial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [mxnUsd, setMxnUsd] = useState("");
  const [fuente, setFuente] = useState("DOF");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha || !mxnUsd) return;

    startTransition(async () => {
      try {
        await registrarTipoCambio({ fecha, mxnUsd, fuente });
        toast.success("Tipo de cambio registrado");
        setMxnUsd("");
        router.refresh();
      } catch (err) {
        toast.error("Error al registrar el tipo de cambio");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Nuevo registro</p>

          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>MXN por 1 USD</Label>
            <Input type="number" step="0.0001" min="0" placeholder="Ej: 19.50" value={mxnUsd} onChange={(e) => setMxnUsd(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Fuente (Opcional)</Label>
            <Input value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Ej: DOF, Banxico" />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando…" : "Registrar"}
          </Button>
        </form>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Historial
            </p>
          </div>
          {historial.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay registros
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MXN/USD</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-medium text-gray-900">{h.fecha}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-indigo-600 font-semibold">{h.mxnUsd}</td>
                    <td className="py-2.5 px-3 text-gray-500">{h.fuente || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
