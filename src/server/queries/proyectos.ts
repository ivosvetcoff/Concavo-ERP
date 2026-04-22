"use server";

import { db } from "@/lib/db";
import type { EstadoProyecto, Semaforo } from "@prisma/client";

export type ProyectoRow = {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  qtyItems: number;
  po: string | null;
  fechaPO: Date | null;
  fechaCompromiso: Date | null;
  fechaEntrega: Date | null;
  estado: EstadoProyecto;
  semaforo: Semaforo;
  tieneHC: boolean;
  facturado: boolean;
  comentarios: string | null;
  montoVendido: string;
};

export type FiltrosProyectos = {
  estado?: EstadoProyecto | "TODOS";
  semaforo?: Semaforo | "TODOS";
  busqueda?: string;
};

export async function listarProyectos(
  filtros: FiltrosProyectos = {}
): Promise<ProyectoRow[]> {
  const { estado, semaforo, busqueda } = filtros;

  const proyectos = await db.proyecto.findMany({
    where: {
      ...(estado && estado !== "TODOS" ? { estado } : {}),
      ...(semaforo && semaforo !== "TODOS" ? { semaforo } : {}),
      ...(busqueda
        ? {
            OR: [
              { codigo: { contains: busqueda, mode: "insensitive" } },
              { nombre: { contains: busqueda, mode: "insensitive" } },
              { cliente: { nombre: { contains: busqueda, mode: "insensitive" } } },
              { po: { contains: busqueda, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      qtyItems: true,
      po: true,
      fechaPO: true,
      fechaCompromiso: true,
      fechaEntrega: true,
      estado: true,
      semaforo: true,
      tieneHC: true,
      facturado: true,
      comentarios: true,
      montoVendido: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: [{ codigo: "desc" }],
  });

  return proyectos.map((p) => ({
    ...p,
    cliente: p.cliente.nombre,
    montoVendido: p.montoVendido.toString(),
  }));
}
