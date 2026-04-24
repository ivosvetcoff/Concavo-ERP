
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
  comentarios: string | null;
  // OWNER-only (null para ENCARGADO)
  montoVendido: string | null;
  facturado: boolean | null;
};

export type FiltrosProyectos = {
  estado?: EstadoProyecto | "TODOS";
  semaforo?: Semaforo | "TODOS";
  busqueda?: string;
};

export async function listarProyectos(
  filtros: FiltrosProyectos = {},
  owner = false
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
      comentarios: true,
      montoVendido: true,
      facturado: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: [{ codigo: "desc" }],
  });

  return proyectos.map((p) => ({
    ...p,
    cliente: p.cliente.nombre,
    montoVendido: owner ? p.montoVendido.toString() : null,
    facturado: owner ? p.facturado : null,
  }));
}
