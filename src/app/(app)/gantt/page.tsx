import { redirect } from "next/navigation";
import Link from "next/link";
import { isOwner } from "@/lib/auth";
import { obtenerPlanTaller } from "@/server/queries/gantt-plan";
import { GanttTaller } from "@/components/features/gantt/GanttTaller";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LayoutGrid } from "lucide-react";

export default async function GanttPage() {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const hoy = new Date();
  const planTaller = await obtenerPlanTaller();

  const semanaDesde = planTaller.semanas[0];
  const semanaHasta = planTaller.semanas[planTaller.semanas.length - 1];

  const proyActivos = planTaller.proyectos.length;
  const totalSobrecargadas = planTaller.celdas.filter((c) => c.sobrecargado).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gantt de producción</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            Plan automático ·{" "}
            {semanaDesde
              ? `${format(new Date(semanaDesde + "T00:00:00"), "d MMM", { locale: es })} — ${format(new Date(semanaHasta + "T00:00:00"), "d MMM yyyy", { locale: es })}`
              : format(hoy, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ocupacion"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Ver ocupación
          </Link>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Proyectos activos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{proyActivos}</p>
        </div>
        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Operadores</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{planTaller.empleados.length}</p>
        </div>
        <div className="bg-white border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Semanas planificadas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{planTaller.semanas.length}</p>
        </div>
        <div className={`border rounded-lg px-4 py-3 ${totalSobrecargadas > 0 ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <p className={`text-xs uppercase tracking-wide ${totalSobrecargadas > 0 ? "text-red-500" : "text-gray-500"}`}>
            Sobrecargas
          </p>
          <p className={`text-2xl font-bold mt-1 ${totalSobrecargadas > 0 ? "text-red-700" : "text-gray-900"}`}>
            {totalSobrecargadas}
          </p>
        </div>
      </div>

      {/* Sin proyectos activos */}
      {proyActivos === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          No hay proyectos activos con horas estimadas.
          Para ver el plan automático, agrega horas estimadas a los muebles de un proyecto activo.
        </div>
      )}

      {/* Grilla Gantt */}
      <GanttTaller data={planTaller} />
    </div>
  );
}
