import { formatMXN } from "@/lib/format";
import type { DashboardKPIs } from "@/server/queries/dashboard";

type Props = {
  kpis: DashboardKPIs;
  isOwner: boolean;
  mesLabel: string;
};

export function KPICards({ kpis, isOwner, mesLabel }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col divide-y divide-gray-100">
      <StatBlock
        value={formatMXN(kpis.totalComprasMes)}
        label="Compras del mes"
        sub={`${kpis.comprasMes} ${kpis.comprasMes === 1 ? "orden" : "órdenes"} · ${mesLabel}`}
      />
      {isOwner ? (
        <StatBlock
          value={formatMXN(kpis.ingresosTotalesMes)}
          label="Ingresos del mes"
          sub={`${formatMXN(kpis.ingresosFacturadosMes)} fact. · ${formatMXN(kpis.ingresosEfectivoMes)} efect.`}
        />
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}

function StatBlock({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="px-5 py-6 flex-1 flex flex-col justify-center">
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-2">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
    </div>
  );
}
