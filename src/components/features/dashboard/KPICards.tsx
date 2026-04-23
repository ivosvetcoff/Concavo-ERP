import { formatMXN, formatMonthYear } from "@/lib/format";
import { Package, TrendingUp, ShoppingCart, Banknote, Receipt } from "lucide-react";
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
        icon={<Package className="h-5 w-5" />}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        subtitle="en el taller ahora"
        trend={null}
      />
      <KPICard
        title="Entregados"
        value={String(kpis.entregadosMes)}
        icon={<TrendingUp className="h-5 w-5" />}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        subtitle={`en ${mesActual}`}
        trend={null}
      />
      <KPICard
        title="Compras del mes"
        value={String(kpis.comprasMes)}
        icon={<ShoppingCart className="h-5 w-5" />}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        subtitle={formatMXN(kpis.totalComprasMes)}
        trend={null}
      />
      {isOwner && (
        <KPICard
          title="Ingresos del mes"
          value={formatMXN(kpis.ingresosTotalesMes)}
          icon={<Banknote className="h-5 w-5" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          subtitle={`${formatMXN(kpis.ingresosFacturadosMes)} facturado · ${formatMXN(kpis.ingresosEfectivoMes)} efectivo`}
          valueSmall
          trend={null}
          extra={
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
              <Receipt className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-400 truncate">
                Facturado: {formatMXN(kpis.ingresosFacturadosMes)} · Efectivo: {formatMXN(kpis.ingresosEfectivoMes)}
              </span>
            </div>
          }
        />
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  subtitle,
  valueSmall,
  extra,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle: string;
  valueSmall?: boolean;
  trend: null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`${iconBg} ${iconColor} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className={`font-bold tabular-nums text-gray-900 ${valueSmall ? "text-xl" : "text-3xl"} leading-none`}>
        {value}
      </p>
      <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
      <p className="text-[11px] text-gray-400 truncate mt-0.5">{subtitle}</p>
      {extra}
    </div>
  );
}
