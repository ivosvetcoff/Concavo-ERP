import { obtenerDashboard } from "@/server/queries/dashboard";
import { isOwner } from "@/lib/auth";
import { KPICards } from "@/components/features/dashboard/KPICards";
import { KanbanProyectos } from "@/components/features/dashboard/KanbanProyectos";
import { GraficoEstados } from "@/components/features/dashboard/GraficoEstados";
import { GraficoProcesos } from "@/components/features/dashboard/GraficoProcesos";
import { AlertasDashboard } from "@/components/features/dashboard/AlertasDashboard";
import { addMonths, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const mes = sp.mes ? Math.min(12, Math.max(1, parseInt(sp.mes))) : now.getMonth() + 1;
  const anio = sp.anio ? parseInt(sp.anio) : now.getFullYear();

  const [dashboard, owner] = await Promise.all([
    obtenerDashboard(mes, anio),
    isOwner(),
  ]);

  const refDate = new Date(anio, mes - 1, 1);
  const prev = subMonths(refDate, 1);
  const next = addMonths(refDate, 1);

  const esActual = mes === now.getMonth() + 1 && anio === now.getFullYear();
  const mesLabel = format(refDate, "MMMM yyyy", { locale: es });
  const mesLabelCap = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard?mes=${prev.getMonth() + 1}&anio=${prev.getFullYear()}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[9.5rem] text-center text-sm font-medium text-gray-700 px-1">
            {mesLabelCap}
          </span>
          {!esActual && (
            <Link
              href="/dashboard"
              className="inline-flex items-center h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 transition-colors"
            >
              Hoy
            </Link>
          )}
          <Link
            href={`/dashboard?mes=${next.getMonth() + 1}&anio=${next.getFullYear()}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Métricas del mes: KPIs + gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KPICards kpis={dashboard.kpis} isOwner={owner} mesLabel={mesLabelCap} />
        <GraficoEstados kanban={dashboard.kanban} entregadosMes={dashboard.kpis.entregadosMes} />
        <GraficoProcesos heatmap={dashboard.heatmap} />
      </div>

      {/* Alertas */}
      <AlertasDashboard alertas={dashboard.alertas} />

      {/* Kanban */}
      <KanbanProyectos kanban={dashboard.kanban} />
    </div>
  );
}
