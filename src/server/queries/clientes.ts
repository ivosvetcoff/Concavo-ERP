import { db } from "@/lib/db";

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

export async function listarClientesSelect() {
  return db.cliente.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
