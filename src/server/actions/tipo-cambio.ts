"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { z } from "zod";

// ── Registrar tipo de cambio manual ──────────────────────────────────────────

const tipoCambioSchema = z.object({
  fecha: z.string(),         // "yyyy-MM-dd"
  mxnUsd: z.string(),        // e.g. "17.45"
  fuente: z.string().optional(),
});

export async function registrarTipoCambio(input: z.infer<typeof tipoCambioSchema>) {
  await requireOwner();
  const data = tipoCambioSchema.parse(input);

  await db.tipoCambio.upsert({
    where: { fecha: new Date(data.fecha) },
    update: { mxnUsd: new Decimal(data.mxnUsd), fuente: data.fuente ?? null },
    create: {
      fecha: new Date(data.fecha),
      mxnUsd: new Decimal(data.mxnUsd),
      fuente: data.fuente ?? null,
    },
  });

  revalidatePath("/tipocambio");
  revalidatePath("/proyectos");
}

// ── Actualizar tipo de cambio de un proyecto (USD) ───────────────────────────

export async function actualizarTipoCambioProyecto(
  proyectoId: string,
  tipoCambio: string
) {
  await requireOwner();
  await db.proyecto.update({
    where: { id: proyectoId },
    data: { tipoCambioVenta: new Decimal(tipoCambio) },
  });
  revalidatePath(`/proyectos/${proyectoId}`);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listarTiposCambio(limit = 30) {
  const rows = await db.tipoCambio.findMany({
    orderBy: { fecha: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha.toISOString().split("T")[0],
    mxnUsd: r.mxnUsd.toString(),
    fuente: r.fuente,
  }));
}

export async function obtenerUltimoTipoCambio(): Promise<string | null> {
  const row = await db.tipoCambio.findFirst({ orderBy: { fecha: "desc" } });
  return row?.mxnUsd.toString() ?? null;
}
