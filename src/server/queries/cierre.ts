"use server";

import { db } from "@/lib/db";

export type RegistroParaCierre = {
  horasTO: string;
  horasTE: string;
  tarifaHoraTO: string;
  tarifaHoraTE: string;
};

export type ProyectoParaCierre = {
  id: string;
  codigo: string;
  nombre: string;
  clienteNombre: string;
  facturado: boolean;
  montoVendido: string;
  qtyItemsProyecto: number;
  fechaEntrega: Date;
  comprasTotal: string;
  registros: RegistroParaCierre[];
};

export type DatosCierre = {
  mes: number;
  anio: number;
  proyectos: ProyectoParaCierre[];
  totalItemsMes: number;
  totalInsumosMes: string;
  totalMOIMes: string;
  totalGastosFijosMes: string;
  cerrado: boolean;
  fechaCierre: Date | null;
};

export async function obtenerDatosCierre(mes: number, anio: number): Promise<DatosCierre> {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 1);

  const [proyectosDB, insumoAgg, gastosAgg, moiAgg, cierreMes] = await Promise.all([
    db.proyecto.findMany({
      where: {
        fechaEntrega: { gte: inicio, lt: fin },
        estado: "ENTREGADO",
      },
      orderBy: { fechaEntrega: "asc" },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        cliente: { select: { nombre: true } },
        facturado: true,
        montoVendido: true,
        qtyItems: true,
        fechaEntrega: true,
        compras: { select: { total: true } },
        muebles: {
          select: {
            registros: {
              select: {
                horasTO: true,
                horasTE: true,
                empleado: { select: { tarifaHoraTO: true, tarifaHoraTE: true } },
              },
            },
          },
        },
      },
    }),
    db.insumo.aggregate({
      where: { fecha: { gte: inicio, lt: fin } },
      _sum: { total: true },
    }),
    db.gastoFijo.aggregate({
      where: { mes, anio },
      _sum: { monto: true },
    }),
    db.pagoNomina.aggregate({
      where: {
        semana: { gte: inicio, lt: fin },
        empleado: { especialidad: "ADMINISTRATIVO" },
      },
      _sum: { total: true },
    }),
    db.cierreMensual.findFirst({
      where: { mes, anio },
      select: { cerrado: true, fechaCierre: true },
    }),
  ]);

  const proyectos: ProyectoParaCierre[] = proyectosDB.map((p) => {
    const comprasTotal = p.compras.reduce(
      (acc, c) => acc + parseFloat(c.total?.toString() ?? "0"),
      0
    );

    const registros: RegistroParaCierre[] = p.muebles.flatMap((m) =>
      m.registros.map((r) => ({
        horasTO: r.horasTO.toString(),
        horasTE: r.horasTE.toString(),
        tarifaHoraTO: r.empleado.tarifaHoraTO.toString(),
        tarifaHoraTE: r.empleado.tarifaHoraTE.toString(),
      }))
    );

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      clienteNombre: p.cliente.nombre,
      facturado: p.facturado,
      montoVendido: p.montoVendido.toString(),
      qtyItemsProyecto: p.qtyItems,
      fechaEntrega: p.fechaEntrega!,
      comprasTotal: comprasTotal.toFixed(2),
      registros,
    };
  });

  return {
    mes,
    anio,
    proyectos,
    totalItemsMes: proyectosDB.reduce((acc, p) => acc + p.qtyItems, 0),
    totalInsumosMes: insumoAgg._sum.total?.toString() ?? "0",
    totalMOIMes: moiAgg._sum.total?.toString() ?? "0",
    totalGastosFijosMes: gastosAgg._sum.monto?.toString() ?? "0",
    cerrado: cierreMes?.cerrado ?? false,
    fechaCierre: cierreMes?.fechaCierre ?? null,
  };
}
