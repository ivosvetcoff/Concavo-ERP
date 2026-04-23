"use server";

import { db } from "@/lib/db";
import type { Prisma, UnidadCompra } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export type InsumoRow = {
  id: string;
  fecha: Date;
  descripcion: string;
  proveedor: string;
  idFactura: string | null;
  qty: Decimal;
  unidad: UnidadCompra;
  metodoPago: string;
  categoria: string | null;
  // OWNER-only
  importe: Decimal | null;
  iva: Decimal | null;
  total: Decimal | null;
};

export type FiltrosInsumos = {
  mes?: number;
  anio?: number;
  busqueda?: string;
};

export async function listarInsumos(
  owner = false,
  filtros: FiltrosInsumos = {}
): Promise<InsumoRow[]> {
  const where: Prisma.InsumoWhereInput = {};

  if (filtros.mes && filtros.anio) {
    const inicio = new Date(filtros.anio, filtros.mes - 1, 1);
    const fin = new Date(filtros.anio, filtros.mes, 1);
    where.fecha = { gte: inicio, lt: fin };
  } else if (filtros.anio) {
    const inicio = new Date(filtros.anio, 0, 1);
    const fin = new Date(filtros.anio + 1, 0, 1);
    where.fecha = { gte: inicio, lt: fin };
  }

  if (filtros.busqueda) {
    where.OR = [
      { descripcion: { contains: filtros.busqueda, mode: "insensitive" } },
      { proveedor: { contains: filtros.busqueda, mode: "insensitive" } },
      { idFactura: { contains: filtros.busqueda, mode: "insensitive" } },
    ];
  }

  const insumos = await db.insumo.findMany({
    where,
    orderBy: { fecha: "desc" },
    select: {
      id: true,
      fecha: true,
      descripcion: true,
      proveedor: true,
      idFactura: true,
      qty: true,
      unidad: true,
      importe: true,
      iva: true,
      total: true,
      metodoPago: true,
      categoria: true,
    },
  });

  return insumos.map((i) => ({
    ...i,
    importe: owner ? i.importe : null,
    iva: owner ? i.iva : null,
    total: owner ? i.total : null,
  }));
}

export async function totalInsumosMes(mes: number, anio: number): Promise<Decimal | null> {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 1);
  const agg = await db.insumo.aggregate({
    where: { fecha: { gte: inicio, lt: fin } },
    _sum: { total: true },
  });
  return agg._sum.total;
}
