"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export type ResultadoBusqueda = {
  proyectos: { id: string; codigo: string; nombre: string; cliente: string }[];
  clientes: { id: string; nombre: string; rfc: string | null }[];
};

export async function buscarGlobal(query: string): Promise<ResultadoBusqueda> {
  await requireAuth();

  const q = query.trim();
  if (q.length < 2) return { proyectos: [], clientes: [] };

  const [proyectos, clientes] = await Promise.all([
    db.proyecto.findMany({
      where: {
        OR: [
          { codigo: { contains: q, mode: "insensitive" } },
          { nombre: { contains: q, mode: "insensitive" } },
          { cliente: { nombre: { contains: q, mode: "insensitive" } } },
          { po: { contains: q, mode: "insensitive" } },
        ],
        estado: { notIn: ["CANCELADO"] },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { codigo: "desc" },
      take: 6,
    }),
    db.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { rfc: { contains: q, mode: "insensitive" } },
          { razonSocial: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nombre: true, rfc: true },
      orderBy: { nombre: "asc" },
      take: 4,
    }),
  ]);

  return {
    proyectos: proyectos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      cliente: p.cliente.nombre,
    })),
    clientes,
  };
}
