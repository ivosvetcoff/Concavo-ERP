"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMXN, formatDate } from "@/lib/format";
import { guardarNomina, marcarPagado, desmarcarPagado } from "@/server/actions/nomina-gantt";
import type { NominaFila } from "@/server/queries/nomina-gantt";
import type { EspecialidadEmpleado } from "@prisma/client";

const ESPECIALIDAD_LABELS: Record<EspecialidadEmpleado, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

type Props = {
  filas: NominaFila[];
  semana: string; // "yyyy-MM-dd"
};

function FilaEmpleado({ fila, semana }: { fila: NominaFila; semana: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [bonos, setBonos] = useState("0");
  const [deducciones, setDeducciones] = useState("0");
  const [notas, setNotas] = useState(fila.notas ?? "");
  const [isPending, startTransition] = useTransition();

  const nombreCompleto = [fila.nombre, fila.apellido].filter(Boolean).join(" ");
  const sueldoBase = fila.sueldoSemanal ?? "0";
  const montoExtras = fila.montoExtras;
  const totalCalculado = (
    parseFloat(sueldoBase) +
    parseFloat(montoExtras) +
    parseFloat(bonos || "0") -
    parseFloat(deducciones || "0")
  ).toFixed(2);

  function handleGuardar() {
    startTransition(async () => {
      try {
        await guardarNomina({
          empleadoId: fila.empleadoId,
          semana,
          sueldoBase,
          montoExtras,
          bonos,
          deducciones,
          notas: notas || undefined,
        });
        toast.success(`Nómina de ${fila.nombre} guardada`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  function handlePago() {
    startTransition(async () => {
      try {
        if (fila.pagado && fila.pagoId) {
          await desmarcarPagado(fila.pagoId);
          toast.success("Pago desmarcado");
        } else if (fila.pagoId) {
          await marcarPagado(fila.pagoId, new Date().toISOString());
          toast.success(`${fila.nombre} marcado como pagado`);
        } else {
          // Guardar primero, luego marcar pagado
          await guardarNomina({ empleadoId: fila.empleadoId, semana, sueldoBase, montoExtras, bonos, deducciones, notas: notas || undefined });
          toast.success("Nómina guardada y marcada como pagada");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-all ${fila.pagado ? "opacity-70" : ""}`}>
      {/* Fila principal */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
        style={fila.color ? { borderLeft: `3px solid ${fila.color}` } : undefined}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>

        {/* Nombre + especialidad */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">{nombreCompleto}</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {ESPECIALIDAD_LABELS[fila.especialidad]}
            </span>
            {fila.pagado && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Pagado {fila.fechaPago ? formatDate(new Date(fila.fechaPago)) : ""}
              </span>
            )}
          </div>
        </div>

        {/* Horas */}
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            T.O. <strong className="text-gray-700">{fila.horasTO}h</strong>
          </span>
          {parseFloat(fila.horasTE) > 0 && (
            <span>
              T.E. <strong className="text-amber-600">{fila.horasTE}h</strong>
            </span>
          )}
        </div>

        {/* Sueldo + extras */}
        <div className="text-right shrink-0 min-w-[120px]">
          <div className="text-sm font-semibold text-gray-900">
            {formatMXN(fila.pagoId ? fila.total : totalCalculado)}
          </div>
          {parseFloat(fila.montoExtras) > 0 && (
            <div className="text-xs text-amber-600">
              +{formatMXN(fila.montoExtras)} extras
            </div>
          )}
        </div>

        {/* Botón pagar */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePago(); }}
          disabled={isPending}
          className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
            fila.pagado
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
          }`}
        >
          {fila.pagado
            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Pagado</>
            : <><Circle className="h-3.5 w-3.5" /> Pagar</>}
        </button>
      </div>

      {/* Detalle expandible */}
      {expanded && (
        <div className="border-t bg-gray-50/40 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Sueldo base</p>
              <p className="font-medium">{formatMXN(sueldoBase)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Extras ({fila.horasTE}h × ${fila.tarifaHoraTE})</p>
              <p className="font-medium text-amber-600">{formatMXN(montoExtras)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Bonos</p>
              <input
                type="number"
                min="0"
                step="50"
                value={bonos}
                onChange={(e) => setBonos(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Deducciones</p>
              <input
                type="number"
                min="0"
                step="50"
                value={deducciones}
                onChange={(e) => setDeducciones(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Notas</p>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: anticipo de $500 descontado"
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm">
              <span className="text-gray-500">Total calculado: </span>
              <span className="font-bold text-gray-900 text-base">{formatMXN(totalCalculado)}</span>
            </div>
            <Button size="sm" onClick={handleGuardar} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar nómina"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlanillaNomina({ filas, semana }: Props) {
  const totalSueldos = filas.reduce((s, f) => s + parseFloat(f.sueldoSemanal ?? "0"), 0);
  const totalExtras = filas.reduce((s, f) => s + parseFloat(f.montoExtras), 0);
  const totalGeneral = filas.reduce((s, f) => s + parseFloat(f.total), 0);
  const pagados = filas.filter((f) => f.pagado).length;

  return (
    <div className="space-y-3">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Empleados", value: `${filas.length}`, sub: `${pagados} pagados` },
          { label: "Sueldos base", value: formatMXN(totalSueldos.toFixed(2)), sub: "esta semana" },
          { label: "Horas extras", value: formatMXN(totalExtras.toFixed(2)), sub: "total T.E." },
          { label: "Total nómina", value: formatMXN(totalGeneral.toFixed(2)), sub: "sueldos + extras", highlight: true },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className={`bg-white border rounded-lg px-4 py-3 ${highlight ? "border-indigo-200 bg-indigo-50/30" : ""}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-1 ${highlight ? "text-indigo-700" : "text-gray-900"}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filas */}
      {filas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border rounded-lg text-sm">
          No hay empleados activos para generar nómina.
        </div>
      ) : (
        filas.map((fila) => (
          <FilaEmpleado key={fila.empleadoId} fila={fila} semana={semana} />
        ))
      )}
    </div>
  );
}
