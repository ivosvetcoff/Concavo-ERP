"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { clienteSchema, type ClienteInput } from "@/schemas/cliente";
import { revalidatePath } from "next/cache";

export async function crearCliente(input: ClienteInput) {
  await requireAuth();
  const data = clienteSchema.parse(input);

  const cliente = await db.cliente.create({
    data: {
      nombre: data.nombre,
      contacto: data.contacto || null,
      telefono: data.telefono || null,
      email: data.email || null,
      rfc: data.rfc || null,
      razonSocial: data.razonSocial || null,
      usoCFDIDefault: data.usoCFDIDefault || null,
      notas: data.notas || null,
    },
  });

  revalidatePath("/clientes");
  return cliente;
}

export async function actualizarCliente(id: string, input: ClienteInput) {
  await requireAuth();
  const data = clienteSchema.parse(input);

  await db.cliente.update({
    where: { id },
    data: {
      nombre: data.nombre,
      contacto: data.contacto || null,
      telefono: data.telefono || null,
      email: data.email || null,
      rfc: data.rfc || null,
      razonSocial: data.razonSocial || null,
      usoCFDIDefault: data.usoCFDIDefault || null,
      notas: data.notas || null,
    },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

export async function eliminarCliente(id: string) {
  await requireAuth();

  const proyectos = await db.proyecto.count({ where: { clienteId: id } });
  if (proyectos > 0) {
    throw new Error(
      `No se puede eliminar: el cliente tiene ${proyectos} proyecto(s) asociado(s).`
    );
  }

  await db.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  return { ok: true };
}
