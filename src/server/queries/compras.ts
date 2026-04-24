import { db } from "@/lib/db";
import type { CategoriaCompra, TipoCompra, Prisma } from "@prisma/client";

export type CompraRow = {
  id: string;
  fecha: Date;
  proveedor: string;
  descripcion: string;
  categoria: CategoriaCompra;
  tipo: TipoCompra;
  muebleNombre: string | null;
  idFactura: string | null;
  metodoPago: string;
  numeroCFDIRecibido: string | null;
  proyecto: { id: string; codigo: string; nombre: string } | null;
  // OWNER-only
  importe: string | null;
  iva: string | null;
  total: string | null;
};

export type FiltrosCompras = {
  categoriaCompra?: CategoriaCompra | "TODAS";
  tipoCompra?: TipoCompra | "TODOS";
  proyectoId?: string | "TODOS";
  desde?: string;
  hasta?: string;
};

export async function listarCompras(
  owner = false,
  filtros: FiltrosCompras = {}
): Promise<CompraRow[]> {
  const where: Prisma.CompraWhereInput = {};

  if (filtros.categoriaCompra && filtros.categoriaCompra !== "TODAS") {
    where.categoria = filtros.categoriaCompra;
  }
  if (filtros.tipoCompra && filtros.tipoCompra !== "TODOS") {
    where.tipo = filtros.tipoCompra;
  }
  if (filtros.proyectoId && filtros.proyectoId !== "TODOS") {
    where.proyectoId = filtros.proyectoId;
  }
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fecha.lte = new Date(filtros.hasta + "T23:59:59");
  }

  const compras = await db.compra.findMany({
    where,
    orderBy: { fecha: "desc" },
    select: {
      id: true,
      fecha: true,
      proveedor: true,
      descripcion: true,
      categoria: true,
      tipo: true,
      muebleNombre: true,
      idFactura: true,
      metodoPago: true,
      numeroCFDIRecibido: true,
      importe: true,
      iva: true,
      total: true,
      proyecto: {
        select: { id: true, codigo: true, nombre: true },
      },
    },
  });

  return compras.map((c) => ({
    id: c.id,
    fecha: c.fecha,
    proveedor: c.proveedor,
    descripcion: c.descripcion,
    categoria: c.categoria,
    tipo: c.tipo,
    muebleNombre: c.muebleNombre,
    idFactura: c.idFactura,
    metodoPago: c.metodoPago,
    numeroCFDIRecibido: owner ? c.numeroCFDIRecibido : null,
    proyecto: c.proyecto,
    importe: owner ? c.importe.toString() : null,
    iva: owner ? c.iva.toString() : null,
    total: owner ? c.total.toString() : null,
  }));
}

export async function listarProyectosParaSelector(): Promise<
  { id: string; codigo: string; nombre: string }[]
> {
  return db.proyecto.findMany({
    where: {
      estado: {
        notIn: ["CANCELADO", "ENTREGADO"],
      },
    },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true },
  });
}
