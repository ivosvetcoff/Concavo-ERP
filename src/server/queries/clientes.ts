import { db } from "@/lib/db";
import Decimal from "decimal.js";
import type { EstadoProyecto, Semaforo } from "@prisma/client";

export type ClienteRow = {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  rfc: string | null;
  razonSocial: string | null;
  usoCFDIDefault: string | null;
  notas: string | null;
  createdAt: Date;
  _count: { proyectos: number };
};

export async function listarClientes(): Promise<ClienteRow[]> {
  return db.cliente.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      contacto: true,
      telefono: true,
      email: true,
      rfc: true,
      razonSocial: true,
      usoCFDIDefault: true,
      notas: true,
      createdAt: true,
      _count: { select: { proyectos: true } },
    },
  });
}

export type ClienteDetalleProyecto = {
  id: string;
  codigo: string;
  nombre: string;
  estado: EstadoProyecto;
  semaforo: Semaforo;
  fechaCompromiso: Date | null;
  fechaEntrega: Date | null;
  qtyItems: number;
  montoVendido: string | null;
  facturado: boolean | null;
  anticiposTotal: string | null;
  pagosTotal: string | null;
};

export type ClienteDetalle = {
  id: string;
  nombre: string;
  razonSocial: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  rfc: string | null;
  notas: string | null;
  proyectos: ClienteDetalleProyecto[];
};

export async function obtenerClienteDetalle(id: string, owner: boolean): Promise<ClienteDetalle | null> {
  const c = await db.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      razonSocial: true,
      contacto: true,
      telefono: true,
      email: true,
      rfc: true,
      notas: true,
      proyectos: {
        orderBy: [{ estado: "asc" }, { fechaCompromiso: "asc" }],
        select: {
          id: true,
          codigo: true,
          nombre: true,
          estado: true,
          semaforo: true,
          fechaCompromiso: true,
          fechaEntrega: true,
          qtyItems: true,
          montoVendido: true,
          facturado: true,
          anticipos: { select: { monto: true } },
          pagos: { select: { monto: true } },
        },
      },
    },
  });

  if (!c) return null;

  return {
    id: c.id,
    nombre: c.nombre,
    razonSocial: c.razonSocial,
    contacto: c.contacto,
    telefono: c.telefono,
    email: c.email,
    rfc: c.rfc,
    notas: c.notas,
    proyectos: c.proyectos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      estado: p.estado,
      semaforo: p.semaforo,
      fechaCompromiso: p.fechaCompromiso,
      fechaEntrega: p.fechaEntrega,
      qtyItems: p.qtyItems,
      montoVendido: owner ? p.montoVendido.toString() : null,
      facturado: owner ? p.facturado : null,
      anticiposTotal: owner
        ? p.anticipos
            .reduce((s, a) => s.plus(new Decimal(a.monto.toString())), new Decimal(0))
            .toFixed(2)
        : null,
      pagosTotal: owner
        ? p.pagos
            .reduce((s, pg) => s.plus(new Decimal(pg.monto.toString())), new Decimal(0))
            .toFixed(2)
        : null,
    })),
  };
}

export async function listarClientesSelect() {
  return db.cliente.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
