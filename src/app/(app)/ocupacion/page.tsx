import { redirect } from "next/navigation";
import Link from "next/link";
import { isOwner } from "@/lib/auth";
import { getMondayOf } from "@/server/queries/produccion";
import { obtenerOcupacionSemanas } from "@/server/queries/nomina-gantt";
import { ReporteOcupacion } from "@/components/features/ocupacion/ReporteOcupacion";
import { addDays, subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SEMANAS_HISTORICO = 8;

export default async function OcupacionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const sp = await searchParams;
  const semanaRaw = sp.semana ? new Date(sp.semana + "T00:00:00") : new Date();
  const semanaActual = getMondayOf(semanaRaw);
  const semanaStr = format(semanaActual, "yyyy-MM-dd");

  // Obtener las últimas N semanas (incluida la actual)
  const semanasParaCargar = Array.from({ length: SEMANAS_HISTORICO }, (_, i) =>
    subDays(semanaActual, i * 7)
  ).reverse();

  const semanas = await obtenerOcupacionSemanas(semanasParaCargar);

  const semanaAnterior = format(subDays(semanaActual, 7), "yyyy-MM-dd");
  const semanaSiguiente = format(addDays(semanaActual, 7), "yyyy-MM-dd");
  const semanaHoy = format(getMondayOf(new Date()), "yyyy-MM-dd");
  const sabado = addDays(semanaActual, 5);
  const esHoy = semanaStr === semanaHoy;
  const semanaLabel = `${format(semanaActual, "d", { locale: es })} – ${format(sabado, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ocupación del taller</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            Semana {semanaLabel}
            {esHoy && <span className="ml-2 text-indigo-500 font-medium">· Semana actual</span>}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/ocupacion?semana=${semanaAnterior}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {!esHoy && (
            <Link
              href={`/ocupacion?semana=${semanaHoy}`}
              className="inline-flex items-center h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 transition-colors"
            >
              Hoy
            </Link>
          )}
          <Link
            href={`/ocupacion?semana=${semanaSiguiente}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ReporteOcupacion semanas={semanas} semanaActual={semanaStr} />
    </div>
  );
}
