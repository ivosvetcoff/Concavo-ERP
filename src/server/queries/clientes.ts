"use server";

import { db } from "@/lib/db";

export async function listarClientesSelect() {
  return db.cliente.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
