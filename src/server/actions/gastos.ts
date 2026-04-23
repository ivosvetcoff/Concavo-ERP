"use server";

import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import {
  guardarGastosFijosLoteSchema,
  type GuardarGastosFijosLoteInput,
} from "@/schemas/gasto";
import { revalidatePath } from "next/cache";

export async function guardarGastosFijos(input: GuardarGastosFijosLoteInput) {
  await requireOwner();
  const { mes, anio, gastos } = guardarGastosFijosLoteSchema.parse(input);

  await db.$transaction(
    gastos
      .filter((g) => g.monto.trim() !== "" && parseFloat(g.monto) >= 0)
      .map((g) =>
        db.gastoFijo.upsert({
          where: { mes_anio_concepto: { mes, anio, concepto: g.concepto } },
          create: {
            mes,
            anio,
            concepto: g.concepto,
            monto: parseFloat(g.monto).toString(),
            pagado: g.pagado,
            notas: g.notas || null,
          },
          update: {
            monto: parseFloat(g.monto).toString(),
            pagado: g.pagado,
            notas: g.notas || null,
          },
        })
      )
  );

  revalidatePath("/gastos");
  return { ok: true };
}
