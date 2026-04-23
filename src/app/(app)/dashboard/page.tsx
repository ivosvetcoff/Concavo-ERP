import { obtenerDashboard } from "@/server/queries/dashboard";
import { isOwner } from "@/lib/auth";
import { KPICards } from "@/components/features/dashboard/KPICards";
import { KanbanProyectos } from "@/components/features/dashboard/KanbanProyectos";
import { GraficoEstados } from "@/components/features/dashboard/GraficoEstados";
import { GraficoProcesos } from "@/components/features/dashboard/GraficoProcesos";
import { FeedActividad } from "@/components/features/dashboard/FeedActividad";
import { formatMonthYear } from "@/lib/format";

export default async function DashboardPage() {
  const [dashboard, owner] = await Promise.all([
    obtenerDashboard(),
    isOwner(),
  ]);

  const mesActual = formatMonthYear(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{mesActual}</p>
        </div>
      </div>

      {/* KPIs */}
      <KPICards kpis={dashboard.kpis} isOwner={owner} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GraficoEstados kanban={dashboard.kanban} />
        <GraficoProcesos heatmap={dashboard.heatmap} />
      </div>

      {/* Kanban */}
      <KanbanProyectos kanban={dashboard.kanban} />

      {/* Actividad */}
      <FeedActividad actividad={dashboard.actividad} />
    </div>
  );
}
