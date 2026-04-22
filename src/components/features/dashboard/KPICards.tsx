import { formatMXN, formatMonthYear } from "@/lib/format";
import { Package, TrendingUp, ShoppingCart, Banknote } from "lucide-react";
import type { DashboardKPIs } from "@/server/queries/dashboard";

type Props = {
  kpis: DashboardKPIs;
  isOwner: boolean;
};

export function KPICards({ kpis, isOwner }: Props) {
  const mesActual = formatMonthYear(new Date());

  return (
    <div className={`grid grid-cols-2 ${isOwner ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
      <KPICard
        title="Proyectos activos"
        value={String(kpis.proyectosActivos)}
        icon={<Package className="h-4 w-4 text-indigo-500" />}
        subtitle="en producción"
      />
      <KPICard
        title="Entregados"
        value={String(kpis.entregadosMes)}
        icon={<TrendingUp className="h-4 w-4 text-green-500" />}
        subtitle={mesActual}
      />
      <KPICard
        title="Compras del mes"
        value={String(kpis.comprasMes)}
        icon={<ShoppingCart className="h-4 w-4 text-amber-500" />}
        subtitle={formatMXN(kpis.totalComprasMes)}
      />
      {isOwner && (
        <KPICard
          title="Ingresos del mes"
          value={formatMXN(kpis.ingresosTotalesMes)}
          icon={<Banknote className="h-4 w-4 text-emerald-500" />}
          subtitle={`${formatMXN(kpis.ingresosFacturadosMes)} facturado · ${formatMXN(kpis.ingresosEfectivoMes)} efectivo`}
          valueSmall
        />
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  subtitle,
  valueSmall,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
  valueSmall?: boolean;
}) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {icon}
      </div>
      <p className={`font-bold tabular-nums text-gray-900 ${valueSmall ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 truncate">{subtitle}</p>
    </div>
  );
}
