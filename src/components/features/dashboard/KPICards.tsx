import { formatMXN } from "@/lib/format";
import type { DashboardKPIs } from "@/server/queries/dashboard";
import { MontoPrivado } from "@/components/privacy/MontoPrivado";
import type { ReactNode } from "react";

type Props = {
  kpis: DashboardKPIs;
  isOwner: boolean;
  mesLabel: string;
};

export function KPICards({ kpis, isOwner, mesLabel }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col divide-y divide-gray-100">
      <StatBlock
        value={<MontoPrivado>{formatMXN(kpis.totalComprasMes)}</MontoPrivado>}
        label="Compras del mes"
        sub={`${kpis.comprasMes} ${kpis.comprasMes === 1 ? "orden" : "órdenes"} · ${mesLabel}`}
      />
      {isOwner ? (
        <StatBlock
          value={<MontoPrivado>{formatMXN(kpis.ingresosTotalesMes)}</MontoPrivado>}
          label="Ingresos del mes"
          sub={
            <>
              <MontoPrivado>{formatMXN(kpis.ingresosFacturadosMes)}</MontoPrivado>
              {" fact. · "}
              <MontoPrivado>{formatMXN(kpis.ingresosEfectivoMes)}</MontoPrivado>
              {" efect."}
            </>
          }
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
  value: ReactNode;
  label: string;
  sub: ReactNode;
}) {
  return (
    <div className="px-5 py-6 flex-1 flex flex-col justify-center">
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-2">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
    </div>
  );
}
