"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMXN } from "@/lib/format";
import { guardarGastosFijos } from "@/server/actions/gastos";
import type { GastoFijoRow } from "@/server/queries/gastos";
import { ConceptoGastoFijo } from "@prisma/client";
import Decimal from "decimal.js";

type FilaEstado = {
  concepto: ConceptoGastoFijo;
  label: string;
  monto: string;
  pagado: boolean;
  notas: string;
};

function initFilas(gastos: GastoFijoRow[]): FilaEstado[] {
  return gastos.map((g) => ({
    concepto: g.concepto,
    label: g.label,
    monto: g.monto ? g.monto.toString() : "",
    pagado: g.pagado,
    notas: g.notas ?? "",
  }));
}

export function GastosFijosForm({
  gastos,
  mes,
  anio,
}: {
  gastos: GastoFijoRow[];
  mes: number;
  anio: number;
}) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaEstado[]>(() => initFilas(gastos));
  const [loading, setLoading] = useState(false);

  function actualizarFila(
    concepto: ConceptoGastoFijo,
    campo: keyof Pick<FilaEstado, "monto" | "pagado" | "notas">,
    valor: string | boolean
  ) {
    setFilas((prev) =>
      prev.map((f) => (f.concepto === concepto ? { ...f, [campo]: valor } : f))
    );
  }

  const totalIngresado = filas.reduce((acc, f) => {
    const v = parseFloat(f.monto);
    return isNaN(v) ? acc : acc.plus(v);
  }, new Decimal(0));

  const hayPendientes = filas.some(
    (f) => f.monto !== "" && !f.pagado
  );

  async function handleGuardar() {
    setLoading(true);
    try {
      await guardarGastosFijos({ mes, anio, gastos: filas });
      toast.success("Gastos fijos guardados");
      router.refresh();
    } catch {
      toast.error("Error al guardar gastos fijos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-48">
                Concepto
              </th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-44">
                Monto (MXN)
              </th>
              <th className="text-center py-2 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-24">
                Pagado
              </th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Notas
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr
                key={fila.concepto}
                className={`border-b last:border-0 transition-colors ${
                  fila.pagado ? "bg-green-50/40" : "hover:bg-gray-50"
                }`}
              >
                <td className="py-2 px-4 font-medium text-gray-700">
                  {fila.label}
                </td>
                <td className="py-2 px-4">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={fila.monto}
                    onChange={(e) =>
                      actualizarFila(fila.concepto, "monto", e.target.value)
                    }
                    className="h-8 w-36 tabular-nums"
                  />
                </td>
                <td className="py-2 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={fila.pagado}
                    onChange={(e) =>
                      actualizarFila(fila.concepto, "pagado", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                </td>
                <td className="py-2 px-4">
                  <Input
                    placeholder="Comentario opcional"
                    value={fila.notas}
                    onChange={(e) =>
                      actualizarFila(fila.concepto, "notas", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </td>
              </tr>
            ))}

            {/* Fila de total */}
            <tr className="border-t-2 bg-gray-50">
              <td className="py-3 px-4 font-semibold text-gray-800 text-sm">
                Total gastos fijos
              </td>
              <td className="py-3 px-4 font-semibold tabular-nums text-gray-900">
                {formatMXN(totalIngresado.toFixed(2))}
              </td>
              <td className="py-3 px-4 text-center">
                {!hayPendientes && totalIngresado.gt(0) && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                )}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleGuardar}
          disabled={loading}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? "Guardando…" : "Guardar mes"}
        </Button>
      </div>
    </div>
  );
}
