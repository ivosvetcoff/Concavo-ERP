import { obtenerDashboard } from "@/server/queries/dashboard";
import { isOwner } from "@/lib/auth";
import { KPICards } from "@/components/features/dashboard/KPICards";
import { KanbanProyectos } from "@/components/features/dashboard/KanbanProyectos";
import { HeatmapProcesos } from "@/components/features/dashboard/HeatmapProcesos";
import { FeedActividad } from "@/components/features/dashboard/FeedActividad";

export default async function DashboardPage() {
  const [dashboard, owner] = await Promise.all([
    obtenerDashboard(),
    isOwner(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      <KPICards kpis={dashboard.kpis} isOwner={owner} />

      <KanbanProyectos kanban={dashboard.kanban} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <HeatmapProcesos heatmap={dashboard.heatmap} />
        </div>
        <div className="lg:col-span-3">
          <FeedActividad actividad={dashboard.actividad} />
        </div>
      </div>
    </div>
  );
}
