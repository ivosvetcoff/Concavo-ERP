"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { obtenerDatosCierre } from "@/server/queries/cierre";
import {
  calcularUtilidadProyecto,
  calcularUtilidadMes,
} from "@/server/calculations/utilidad";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { emailCierreMensual } from "@/lib/email";
import { formatMXN } from "@/lib/format";


export async function cerrarMes(mes: number, anio: number) {
  const user = await requireOwner();

  const datos = await obtenerDatosCierre(mes, anio);

  if (datos.cerrado) throw new Error("El mes ya está cerrado");

  // Calculate each project
  const resultadosProyectos = datos.proyectos.map((p) => {
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
      cliente: p.clienteNombre,
      facturado: p.facturado,
      montoVendido: p.montoVendido,
      qtyItems: p.qtyItemsProyecto,
      utilidad: res.utilidad.toFixed(2),
      costoProyecto: res.costoProyecto.toFixed(2),
      utilidadSobreVenta: res.utilidadSobreVenta.mul(100).toFixed(2),
    };
  });

  const resultadoMes = calcularUtilidadMes({
    proyectos: resultadosProyectos.map((p) => ({
      utilidad: new Decimal(p.utilidad),
    })),
    gastosFijos: datos.totalGastosFijosMes ? [datos.totalGastosFijosMes] : [],
  });

  // Totals breakdown
  const proyectosFacturados = datos.proyectos.filter((p) => p.facturado);
  const proyectosEfectivo = datos.proyectos.filter((p) => !p.facturado);
  const totalIngresosFacturados = proyectosFacturados.reduce(
    (acc, p) => acc.plus(p.montoVendido),
    new Decimal(0)
  );
  const totalIngresosEfectivo = proyectosEfectivo.reduce(
    (acc, p) => acc.plus(p.montoVendido),
    new Decimal(0)
  );
  const totalIngresos = totalIngresosFacturados.plus(totalIngresosEfectivo);

  const snapshot = {
    proyectos: resultadosProyectos,
    totalInsumosMes: datos.totalInsumosMes,
    totalMOIMes: datos.totalMOIMes,
    totalGastosFijosMes: datos.totalGastosFijosMes,
    totalItemsMes: datos.totalItemsMes,
  };

  await db.cierreMensual.upsert({
    where: { mes_anio: { mes, anio } },
    create: {
      mes,
      anio,
      cerrado: true,
      fechaCierre: new Date(),
      cerradoPorId: user.id,
      totalProyectosEntregados: datos.proyectos.length,
      totalItemsEntregados: datos.totalItemsMes,
      totalIngresosFacturados: totalIngresosFacturados.toFixed(2),
      totalIngresosEfectivo: totalIngresosEfectivo.toFixed(2),
      totalIngresos: totalIngresos.toFixed(2),
      totalInsumos: datos.totalInsumosMes,
      totalMOI: datos.totalMOIMes,
      totalGastosFijos: datos.totalGastosFijosMes,
      totalUtilidadProyectos: resultadoMes.utilidadProyectosTotal.toFixed(2),
      utilidadNetaMes: resultadoMes.utilidadNetaMes.toFixed(2),
      snapshotProyectos: snapshot,
    },
    update: {
      cerrado: true,
      fechaCierre: new Date(),
      cerradoPorId: user.id,
      totalProyectosEntregados: datos.proyectos.length,
      totalItemsEntregados: datos.totalItemsMes,
      totalIngresosFacturados: totalIngresosFacturados.toFixed(2),
      totalIngresosEfectivo: totalIngresosEfectivo.toFixed(2),
      totalIngresos: totalIngresos.toFixed(2),
      totalInsumos: datos.totalInsumosMes,
      totalMOI: datos.totalMOIMes,
      totalGastosFijos: datos.totalGastosFijosMes,
      totalUtilidadProyectos: resultadoMes.utilidadProyectosTotal.toFixed(2),
      utilidadNetaMes: resultadoMes.utilidadNetaMes.toFixed(2),
      snapshotProyectos: snapshot,
    },
  });

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  emailCierreMensual({
    mes: meses[mes - 1] ?? mes.toString(),
    anio,
    utilidadNeta: formatMXN(resultadoMes.utilidadNetaMes.toString()),
    proyectosEntregados: datos.proyectos.length,
  }).catch(console.error);

  revalidatePath("/cierre");
  return { ok: true };
}
