"use server";

import { db } from "@/lib/db";
import { requireAuth, requireOwner } from "@/lib/auth";
import {
  crearProyectoSchema,
  ajustarMontoSchema,
  cambiarEstadoSchema,
  marcarFacturadoSchema,
  type CrearProyectoInput,
  type AjustarMontoInput,
  type CambiarEstadoInput,
  type MarcarFacturadoInput,
} from "@/schemas/proyecto";
import { generarCodigoProyecto } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function crearProyecto(input: CrearProyectoInput) {
  const user = await requireAuth();
  const data = crearProyectoSchema.parse(input);

  const ultimo = await db.proyecto.findFirst({
    select: { codigo: true },
    orderBy: { codigo: "desc" },
  });
  const codigo = generarCodigoProyecto(ultimo?.codigo ?? null);

  const proyecto = await db.proyecto.create({
    data: {
      codigo,
      nombre: data.nombre,
      clienteId: data.clienteId,
      po: data.po || null,
      estado: data.estado,
      fechaPO: data.fechaPO ?? null,
      fechaCompromiso: data.fechaCompromiso ?? null,
      montoVendido: data.montoVendido,
      anticipo: data.anticipo || null,
      moneda: data.moneda,
      tieneHC: data.tieneHC,
      comentarios: data.comentarios || null,
      eventos: {
        create: {
          tipo: "CAMBIO_ESTADO",
          descripcion: `Proyecto creado con estado ${data.estado}`,
          usuarioId: user.id,
        },
      },
    },
  });

  revalidatePath("/proyectos");
  return { ok: true, codigo: proyecto.codigo, id: proyecto.id };
}

export async function cambiarEstadoProyecto(input: CambiarEstadoInput) {
  const user = await requireAuth();
  const { proyectoId, estado } = cambiarEstadoSchema.parse(input);

  const anterior = await db.proyecto.findUnique({
    where: { id: proyectoId },
    select: { estado: true },
  });

  await db.proyecto.update({
    where: { id: proyectoId },
    data: {
      estado,
      ...(estado === "ENTREGADO" ? { fechaEntrega: new Date() } : {}),
      eventos: {
        create: {
          tipo: "CAMBIO_ESTADO",
          descripcion: `Estado cambiado de ${anterior?.estado ?? "—"} a ${estado}`,
          usuarioId: user.id,
        },
      },
    },
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/proyectos");
  return { ok: true };
}

export async function ajustarMonto(input: AjustarMontoInput) {
  const user = await requireOwner();
  const { proyectoId, montoNuevo, motivo } = ajustarMontoSchema.parse(input);

  const proyecto = await db.proyecto.findUnique({
    where: { id: proyectoId },
    select: { montoVendido: true },
  });
  if (!proyecto) throw new Error("Proyecto no encontrado");

  await db.proyecto.update({
    where: { id: proyectoId },
    data: {
      montoVendido: montoNuevo,
      revisiones: {
        create: {
          montoAnterior: proyecto.montoVendido,
          montoNuevo,
          motivo,
          cambiadoPorId: user.id,
        },
      },
      eventos: {
        create: {
          tipo: "CAMBIO_MONTO",
          descripcion: `Monto ajustado: ${proyecto.montoVendido} → ${montoNuevo}. Motivo: ${motivo}`,
          usuarioId: user.id,
        },
      },
    },
  });

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function marcarFacturado(input: MarcarFacturadoInput) {
  await requireOwner();
  const data = marcarFacturadoSchema.parse(input);

  await db.proyecto.update({
    where: { id: data.proyectoId },
    data: {
      facturado: data.facturado,
      numeroCFDI: data.numeroCFDI || null,
      rfcCliente: data.rfcCliente || null,
      usoCFDI: data.usoCFDI || null,
      metodoPago: data.metodoPago ?? null,
      formaPago: data.formaPago || null,
      fechaFacturacion: data.fechaFacturacion ?? null,
      ...(data.facturado
        ? {
            eventos: {
              create: {
                tipo: "FACTURADO",
                descripcion: `Proyecto marcado como facturado. CFDI: ${data.numeroCFDI ?? "—"}`,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath(`/proyectos/${data.proyectoId}`);
  return { ok: true };
}
