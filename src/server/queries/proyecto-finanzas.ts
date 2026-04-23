import { db } from "@/lib/db";
import Decimal from "decimal.js";
import type { ProcesoTecnico } from "@prisma/client";

// ===== TAB PRODUCCIÓN =====

export type RegistroProduccionFila = {
  id: string;
  semana: Date;
  empleadoNombre: string;
  empleadoApellido: string | null;
  muebleNombre: string;
  proceso: ProcesoTecnico;
  horasTO: string;
  horasTE: string;
};

export async function obtenerRegistrosProyecto(
  proyectoId: string
): Promise<RegistroProduccionFila[]> {
  const registros = await db.registroProduccion.findMany({
    where: { mueble: { proyectoId } },
    orderBy: [{ semana: "desc" }, { empleado: { nombre: "asc" } }],
    select: {
      id: true,
      semana: true,
      proceso: true,
      horasTO: true,
      horasTE: true,
      empleado: { select: { nombre: true, apellido: true } },
      mueble: { select: { nombre: true } },
    },
  });

  return registros.map((r) => ({
    id: r.id,
    semana: r.semana,
    empleadoNombre: r.empleado.nombre,
    empleadoApellido: r.empleado.apellido,
    muebleNombre: r.mueble.nombre,
    proceso: r.proceso,
    horasTO: r.horasTO.toString(),
    horasTE: r.horasTE.toString(),
  }));
}

// ===== TAB FINANZAS =====

export type MODetalleEmpleado = {
  empleadoNombre: string;
  proceso: ProcesoTecnico;
  horasTO: string;
  horasTE: string;
  tarifaTO: string;
  tarifaTE: string;
  costoTO: string;
  costoTE: string;
  costoTotal: string;
};

export type FinanzasProyecto = {
  totalInsumosMes: string;
  totalMOIMes: string;
  totalItemsMes: number;
  moDetalle: MODetalleEmpleado[];
  registrosParaCalculo: { horasTO: string; horasTE: string; tarifaHoraTO: string; tarifaHoraTE: string }[];
};

export async function obtenerFinanzasProyecto(
  proyectoId: string,
  fechaEntrega: Date
): Promise<FinanzasProyecto> {
  const mes = fechaEntrega.getMonth() + 1;
  const anio = fechaEntrega.getFullYear();
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 1);

  const [registros, insumoAgg, moiAgg, itemsMesAgg] = await Promise.all([
    db.registroProduccion.findMany({
      where: { mueble: { proyectoId } },
      select: {
        proceso: true,
        horasTO: true,
        horasTE: true,
        empleado: {
          select: { nombre: true, tarifaHoraTO: true, tarifaHoraTE: true },
        },
      },
    }),
    db.insumo.aggregate({
      where: { fecha: { gte: inicio, lt: fin } },
      _sum: { total: true },
    }),
    db.pagoNomina.aggregate({
      where: {
        semana: { gte: inicio, lt: fin },
        empleado: { especialidad: "ADMINISTRATIVO" },
      },
      _sum: { total: true },
    }),
    db.proyecto.aggregate({
      where: { fechaEntrega: { gte: inicio, lt: fin }, estado: "ENTREGADO" },
      _sum: { qtyItems: true },
    }),
  ]);

  const moDetalle: MODetalleEmpleado[] = registros.map((r) => {
    const to = new Decimal(r.horasTO.toString());
    const te = new Decimal(r.horasTE.toString());
    const tarifaTO = new Decimal(r.empleado.tarifaHoraTO.toString());
    const tarifaTE = new Decimal(r.empleado.tarifaHoraTE.toString());
    const costoTO = to.mul(tarifaTO);
    const costoTE = te.mul(tarifaTE);
    return {
      empleadoNombre: r.empleado.nombre,
      proceso: r.proceso,
      horasTO: to.toString(),
      horasTE: te.toString(),
      tarifaTO: tarifaTO.toFixed(2),
      tarifaTE: tarifaTE.toFixed(2),
      costoTO: costoTO.toFixed(2),
      costoTE: costoTE.toFixed(2),
      costoTotal: costoTO.plus(costoTE).toFixed(2),
    };
  });

  const registrosParaCalculo = registros.map((r) => ({
    horasTO: r.horasTO.toString(),
    horasTE: r.horasTE.toString(),
    tarifaHoraTO: r.empleado.tarifaHoraTO.toString(),
    tarifaHoraTE: r.empleado.tarifaHoraTE.toString(),
  }));

  return {
    totalInsumosMes: insumoAgg._sum.total?.toString() ?? "0",
    totalMOIMes: moiAgg._sum.total?.toString() ?? "0",
    totalItemsMes: itemsMesAgg._sum.qtyItems ?? 0,
    moDetalle,
    registrosParaCalculo,
  };
}
