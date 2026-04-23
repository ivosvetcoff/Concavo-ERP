import { listarInsumos } from "@/server/queries/insumos";
import { isOwner } from "@/lib/auth";
import { InsumosTabla } from "@/components/features/insumos/InsumosTabla";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const owner = await isOwner();

  const ahora = new Date();
  const mes = sp.mes ? parseInt(sp.mes) : ahora.getMonth() + 1;
  const anio = sp.anio ? parseInt(sp.anio) : ahora.getFullYear();
  const busqueda = sp.q ?? "";

  const insumos = await listarInsumos(owner, { mes, anio, busqueda: busqueda || undefined });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insumos generales</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gastos de taller no asignados a proyecto
          </p>
        </div>

        {/* Filtro mes/año */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="mes"
            defaultValue={mes}
            className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            {MESES.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="anio"
            defaultValue={anio}
            className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="submit"
            className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      <InsumosTabla insumos={insumos} isOwner={owner} />
    </div>
  );
}
