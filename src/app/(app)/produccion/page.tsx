import { getMondayOf, obtenerPlanillaSemana } from "@/server/queries/produccion";
import { PlanillaProduccion } from "@/components/features/produccion/PlanillaProduccion";
import { addDays, subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const semanaRaw = sp.semana
    ? new Date(sp.semana + "T00:00:00")
    : new Date();
  const semana = getMondayOf(semanaRaw);

  const { empleados, mueblesActivos } = await obtenerPlanillaSemana(semana);

  const semanaAnterior = format(subDays(semana, 7), "yyyy-MM-dd");
  const semanaSiguiente = format(addDays(semana, 7), "yyyy-MM-dd");
  const semanaHoy = format(getMondayOf(new Date()), "yyyy-MM-dd");
  const sabado = addDays(semana, 5);

  // "Lun 21 – sáb 26 de abril de 2026"
  const semanaLabel = `${format(semana, "d", { locale: es })} – ${format(sabado, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
  const esHoy = format(semana, "yyyy-MM-dd") === semanaHoy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro de producción</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            Semana {semanaLabel}
            {esHoy && <span className="ml-2 text-indigo-500 font-medium">· Semana actual</span>}
          </p>
        </div>

        {/* Navegación de semanas */}
        <div className="flex items-center gap-1">
          <Link
            href={`/produccion?semana=${semanaAnterior}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {!esHoy && (
            <Link
              href={`/produccion?semana=${semanaHoy}`}
              className="inline-flex items-center h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 transition-colors"
            >
              Hoy
            </Link>
          )}
          <Link
            href={`/produccion?semana=${semanaSiguiente}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <PlanillaProduccion
        empleados={empleados}
        mueblesActivos={mueblesActivos}
        semana={format(semana, "yyyy-MM-dd")}
      />
    </div>
  );
}
