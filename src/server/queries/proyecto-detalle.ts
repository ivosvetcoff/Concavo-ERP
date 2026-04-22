"use server";

import { db } from "@/lib/db";

export async function obtenerProyecto(id: string) {
  return db.proyecto.findUnique({
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
          procesoActual: true,
          terceros: true,
          notasTerceros: true,
          orden: true,
          tareas: {
            where: { estado: { in: ["EN_PROCESO", "OK"] } },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { estado: true, proceso: true },
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
          monto: true,
          moneda: true,
          tipo: true,
          categoria: true,
          numeroCFDIRecibido: true,
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
}

export type ProyectoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerProyecto>>>;
