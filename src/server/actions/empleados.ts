"use server";

import { db } from "@/lib/db";
import { requireAuth, requireOwner } from "@/lib/auth";
import { empleadoSchema, type EmpleadoInput } from "@/schemas/empleado";
import { revalidatePath } from "next/cache";

export async function crearEmpleado(input: EmpleadoInput) {
  await requireOwner();
  const data = empleadoSchema.parse(input);

  const empleado = await db.empleado.create({
    data: {
      nombre: data.nombre,
      apellido: data.apellido || null,
      especialidad: data.especialidad,
      tarifaHoraTO: data.tarifaHoraTO,
      tarifaHoraTE: data.tarifaHoraTE,
      sueldoSemanal: data.sueldoSemanal ?? null,
      fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : null,
      activo: data.activo,
      color: data.color || null,
      rfc: data.rfc || null,
      nss: data.nss || null,
    },
  });

  revalidatePath("/empleados");
  return empleado;
}

export async function actualizarEmpleado(id: string, input: EmpleadoInput) {
  await requireOwner();
  const data = empleadoSchema.parse(input);

  const previo = await db.empleado.findUniqueOrThrow({ where: { id } });

  await db.empleado.update({
    where: { id },
    data: {
      nombre: data.nombre,
      apellido: data.apellido || null,
      especialidad: data.especialidad,
      tarifaHoraTO: data.tarifaHoraTO,
      tarifaHoraTE: data.tarifaHoraTE,
      sueldoSemanal: data.sueldoSemanal ?? null,
      fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : null,
      activo: data.activo,
      color: data.color || null,
      rfc: data.rfc || null,
      nss: data.nss || null,
    },
  });

  // Si cambia tarifa, registrar en historial
  const toChanged =
    previo.tarifaHoraTO.toString() !== String(data.tarifaHoraTO) ||
    previo.tarifaHoraTE.toString() !== String(data.tarifaHoraTE);

  if (toChanged) {
    await db.historialTarifa.create({
      data: {
        empleadoId: id,
        tarifaHoraTO: data.tarifaHoraTO,
        tarifaHoraTE: data.tarifaHoraTE,
        vigenteDesde: new Date(),
      },
    });
  }

  revalidatePath("/empleados");
  return { ok: true };
}

export async function toggleActivoEmpleado(id: string, activo: boolean) {
  await requireOwner();
  await db.empleado.update({ where: { id }, data: { activo } });
  revalidatePath("/empleados");
  return { ok: true };
}

export async function eliminarEmpleado(id: string) {
  await requireOwner();

  const empleado = await db.empleado.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { tareas: true, registros: true } } },
  });

  const total = empleado._count.tareas + empleado._count.registros;
  if (total > 0) {
    throw new Error(
      `No se puede eliminar: ${empleado.nombre} tiene ${total} registro(s) asociado(s). Desactívalo en su lugar.`
    );
  }

  await db.empleado.delete({ where: { id } });
  revalidatePath("/empleados");
  return { ok: true };
}
