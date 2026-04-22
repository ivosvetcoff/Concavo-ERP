"use server";

import { db } from "@/lib/db";
import type {
  EstadoProyecto,
  Semaforo,
  Moneda,
  MetodoPago,
  EstadoItem,
  ProcesoTecnico,
  TipoTercero,
  Estructura,
  CategoriaCompra,
  TipoCompra,
  TipoEvento,
} from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

// ===== TIPOS DE DETALLE =====

export type MuebleDetalle = {
  id: string;
  nombre: string;
  cantidad: number;
  madera: string | null;
  estructura: Estructura | null;
  estadoItem: EstadoItem;
  procesoActual: ProcesoTecnico | null;
  terceros: TipoTercero[];
  notasTerceros: string | null;
  orden: string | null;
  tareas: { completada: boolean; proceso: ProcesoTecnico }[];
};

// Campos financieros de compra — null para ENCARGADO
export type CompraDetalle = {
  id: string;
  fecha: Date;
  proveedor: string;
  descripcion: string;
  categoria: CategoriaCompra;
  tipo: TipoCompra;
  importe: Decimal | null;
  iva: Decimal | null;
  total: Decimal | null;
  numeroCFDIRecibido: string | null;
};

export type AnticipoDetalle = {
  id: string;
  monto: Decimal;
  porcentaje: Decimal | null;
  fecha: Date;
  metodoPago: string;
  cfdiEmitido: boolean;
  numeroCFDI: string | null;
};

export type RevisionDetalle = {
  id: string;
  montoAnterior: Decimal;
  montoNuevo: Decimal;
  motivo: string;
  fecha: Date;
  cambiadoPor: { name: string } | null;
};

export type EventoDetalle = {
  id: string;
  tipo: TipoEvento;
  descripcion: string;
  fecha: Date;
  usuario: { name: string } | null;
};

export type ProyectoDetalle = {
  id: string;
  codigo: string;
  nombre: string;
  po: string | null;
  estado: EstadoProyecto;
  semaforo: Semaforo;
  semaforoManual: boolean;
  moneda: Moneda;
  fechaPO: Date | null;
  fechaCompromiso: Date | null;
  fechaEntrega: Date | null;
  tieneHC: boolean;
  comentarios: string | null;
  createdAt: Date;
  updatedAt: Date;
  cliente: { id: string; nombre: string; rfc: string | null };
  muebles: MuebleDetalle[];
  compras: CompraDetalle[];
  eventos: EventoDetalle[];
  // OWNER-only (null para ENCARGADO)
  montoVendido: Decimal | null;
  ivaIncluido: boolean | null;
  facturado: boolean | null;
  numeroCFDI: string | null;
  rfcCliente: string | null;
  usoCFDI: string | null;
  metodoPago: MetodoPago | null;
  formaPago: string | null;
  fechaFacturacion: Date | null;
  anticipos: AnticipoDetalle[] | null;
  revisiones: RevisionDetalle[] | null;
};

// ===== QUERY =====

export async function obtenerProyecto(
  id: string,
  owner = false
): Promise<ProyectoDetalle | null> {
  const p = await db.proyecto.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nombre: true, rfc: true } },
      muebles: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          nombre: true,
          cantidad: true,
          madera: true,
          estructura: true,
          estadoItem: true,
          procesoActual: true,
          terceros: true,
          notasTerceros: true,
          orden: true,
          tareas: {
            where: { completada: false },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { completada: true, proceso: true },
          },
        },
      },
      compras: {
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          fecha: true,
          proveedor: true,
          descripcion: true,
          categoria: true,
          tipo: true,
          importe: true,
          iva: true,
          total: true,
          numeroCFDIRecibido: true,
        },
      },
      anticipos: {
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          monto: true,
          porcentaje: true,
          fecha: true,
          metodoPago: true,
          cfdiEmitido: true,
          numeroCFDI: true,
        },
      },
      eventos: {
        orderBy: { fecha: "desc" },
        take: 50,
        select: {
          id: true,
          tipo: true,
          descripcion: true,
          fecha: true,
          usuario: { select: { name: true } },
        },
      },
      revisiones: {
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          montoAnterior: true,
          montoNuevo: true,
          motivo: true,
          fecha: true,
          cambiadoPor: { select: { name: true } },
        },
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    po: p.po,
    estado: p.estado,
    semaforo: p.semaforo,
    semaforoManual: p.semaforoManual,
    moneda: p.moneda,
    fechaPO: p.fechaPO,
    fechaCompromiso: p.fechaCompromiso,
    fechaEntrega: p.fechaEntrega,
    tieneHC: p.tieneHC,
    comentarios: p.comentarios,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    cliente: p.cliente,
    muebles: p.muebles,
    compras: p.compras.map((c) => ({
      id: c.id,
      fecha: c.fecha,
      proveedor: c.proveedor,
      descripcion: c.descripcion,
      categoria: c.categoria,
      tipo: c.tipo,
      importe: owner ? c.importe : null,
      iva: owner ? c.iva : null,
      total: owner ? c.total : null,
      numeroCFDIRecibido: owner ? c.numeroCFDIRecibido : null,
    })),
    eventos: p.eventos,
    // OWNER-only
    montoVendido: owner ? p.montoVendido : null,
    ivaIncluido: owner ? p.ivaIncluido : null,
    facturado: owner ? p.facturado : null,
    numeroCFDI: owner ? p.numeroCFDI : null,
    rfcCliente: owner ? p.rfcCliente : null,
    usoCFDI: owner ? p.usoCFDI : null,
    metodoPago: owner ? p.metodoPago : null,
    formaPago: owner ? p.formaPago : null,
    fechaFacturacion: owner ? p.fechaFacturacion : null,
    anticipos: owner ? p.anticipos : null,
    revisiones: owner ? p.revisiones : null,
  };
}
