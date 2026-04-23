import { redirect } from "next/navigation";
import Link from "next/link";
import { isOwner } from "@/lib/auth";
import { obtenerTareasGantt } from "@/server/queries/nomina-gantt";
import { GanttChart } from "@/components/features/gantt/GanttChart";
import { addDays, subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const sp = await searchParams;

  // Por defecto: ventana de 3 meses (1 mes atrás, 2 meses adelante)
  const hoy = new Date();
  const desde = sp.desde ? new Date(sp.desde) : subDays(hoy, 30);
  const hasta = sp.hasta ? new Date(sp.hasta) : addDays(hoy, 60);

  const { empleados, tareas } = await obtenerTareasGantt(desde, hasta);

  const desdeStr = format(desde, "yyyy-MM-dd");
  const hastaStr = format(hasta, "yyyy-MM-dd");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gantt de producción</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {format(desde, "d 'de' MMMM", { locale: es })} –{" "}
            {format(hasta, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Ventana de tiempo */}
          <form method="GET" className="flex items-center gap-2">
            <input
              type="date"
              name="desde"
              defaultValue={desdeStr}
              className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              name="hasta"
              defaultValue={hastaStr}
              className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button
              type="submit"
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Filtrar
            </button>
          </form>

          <Link
            href="/proyectos"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Asignar desde proyecto
          </Link>
        </div>
      </div>

      {tareas.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Sin tareas asignadas</strong> en este período. Para agregar tareas al Gantt,
          ve al detalle de un proyecto → detalle de un mueble → botón{" "}
          <strong>&ldquo;Asignar tarea&rdquo;</strong>.
        </div>
      )}

      <GanttChart empleados={empleados} tareas={tareas} />
    </div>
  );
}
