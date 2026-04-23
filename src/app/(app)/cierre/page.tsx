import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { obtenerDatosCierre } from "@/server/queries/cierre";
import { calcularUtilidadProyecto, calcularUtilidadMes } from "@/server/calculations/utilidad";
import {
  ResumenCierre,
  type ProyectoCalculado,
} from "@/components/features/cierre/ResumenCierre";
import Decimal from "decimal.js";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function CierrePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const sp = await searchParams;
  const ahora = new Date();
  const mes = sp.mes ? parseInt(sp.mes) : ahora.getMonth() + 1;
  const anio = sp.anio ? parseInt(sp.anio) : ahora.getFullYear();

  const datos = await obtenerDatosCierre(mes, anio);

  // Apply the official utility formula for each project
  const proyectosCalculados: ProyectoCalculado[] = datos.proyectos.map((p) => {
    const res = calcularUtilidadProyecto({
      montoVendido: p.montoVendido,
      materialDirecto: p.comprasTotal,
      registros: p.registros,
      qtyItemsProyecto: p.qtyItemsProyecto,
      totalInsumosMes: datos.totalInsumosMes,
      totalMOIMes: datos.totalMOIMes,
      totalItemsMes: datos.totalItemsMes,
    });

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      clienteNombre: p.clienteNombre,
      facturado: p.facturado,
      fechaEntrega: p.fechaEntrega.toISOString(),
      qtyItems: p.qtyItemsProyecto,
      montoVendido: p.montoVendido,
      materialDirecto: res.materialDirecto.toFixed(2),
      proporcionalInsumos: res.proporcionalInsumos.toFixed(2),
      proporcionalMOI: res.proporcionalMOI.toFixed(2),
      costoMODirecta: res.costoMODirecta.toFixed(2),
      costoProyecto: res.costoProyecto.toFixed(2),
      utilidad: res.utilidad.toFixed(2),
      utilidadSobreVentaPct: res.utilidadSobreVenta.mul(100).toFixed(2),
      utilidadSobreCostoPct: res.utilidadSobreCosto.mul(100).toFixed(2),
    };
  });

  // Consolidated month calculation
  const resultadoMes = calcularUtilidadMes({
    proyectos: proyectosCalculados.map((p) => ({ utilidad: new Decimal(p.utilidad) })),
    gastosFijos: datos.totalGastosFijosMes !== "0" ? [datos.totalGastosFijosMes] : [],
  });

  // Income split: facturado vs efectivo
  const proyectosFacturados = datos.proyectos.filter((p) => p.facturado);
  const proyectosEfectivo = datos.proyectos.filter((p) => !p.facturado);
  const totalIngresosFacturado = proyectosFacturados
    .reduce((acc, p) => acc.plus(p.montoVendido), new Decimal(0))
    .toFixed(2);
  const totalIngresosEfectivo = proyectosEfectivo
    .reduce((acc, p) => acc.plus(p.montoVendido), new Decimal(0))
    .toFixed(2);
  const totalIngresos = new Decimal(totalIngresosFacturado)
    .plus(totalIngresosEfectivo)
    .toFixed(2);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cierre mensual</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {MESES[mes - 1]} {anio}
            {datos.cerrado && (
              <span className="ml-2 text-xs text-emerald-600 font-medium">· Cerrado</span>
            )}
          </p>
        </div>

        {/* Selector mes/año */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="mes"
            defaultValue={mes}
            className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            {MESES.map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
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
            Ir
          </button>
        </form>
      </div>

      <ResumenCierre
        mes={mes}
        anio={anio}
        proyectos={proyectosCalculados}
        totalIngresosFacturado={totalIngresosFacturado}
        totalIngresosEfectivo={totalIngresosEfectivo}
        totalIngresos={totalIngresos}
        totalInsumos={datos.totalInsumosMes}
        totalMOI={datos.totalMOIMes}
        totalGastosFijos={datos.totalGastosFijosMes}
        utilidadProyectosTotal={resultadoMes.utilidadProyectosTotal.toFixed(2)}
        utilidadNetaMes={resultadoMes.utilidadNetaMes.toFixed(2)}
        cerrado={datos.cerrado}
        fechaCierre={datos.fechaCierre ? datos.fechaCierre.toISOString() : null}
      />
    </div>
  );
}
