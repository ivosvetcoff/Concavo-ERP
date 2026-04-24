import { db } from "@/lib/db";
import { ConceptoGastoFijo } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export const conceptoGastoLabel: Record<ConceptoGastoFijo, string> = {
  RENTA: "Renta",
  LUZ: "Luz",
  AGUA: "Agua",
  MANTENIMIENTO: "Mantenimiento",
  INTERNET: "Internet",
  GASOLINA: "Gasolina",
  GASTOS_VARIOS: "Gastos varios",
  IMSS: "IMSS",
  CONTADOR: "Contador",
  IMPUESTOS: "Impuestos",
  MAQUINARIA_Y_EQUIPO: "Maquinaria y equipo",
  OTROS: "Otros",
};

export const CONCEPTOS_ORDENADOS: ConceptoGastoFijo[] = [
  "RENTA",
  "LUZ",
  "AGUA",
  "MANTENIMIENTO",
  "INTERNET",
  "GASOLINA",
  "GASTOS_VARIOS",
  "IMSS",
  "CONTADOR",
  "IMPUESTOS",
  "MAQUINARIA_Y_EQUIPO",
  "OTROS",
];

export type GastoFijoRow = {
  id: string | null;
  concepto: ConceptoGastoFijo;
  label: string;
  monto: Decimal | null;
  pagado: boolean;
  notas: string | null;
};

export async function listarGastosFijos(
  mes: number,
  anio: number
): Promise<GastoFijoRow[]> {
  const gastos = await db.gastoFijo.findMany({
    where: { mes, anio },
    select: { id: true, concepto: true, monto: true, pagado: true, notas: true },
  });

  const porConcepto = new Map(gastos.map((g) => [g.concepto, g]));

  // Devuelve todos los conceptos, con null si no tienen valor registrado
  return CONCEPTOS_ORDENADOS.map((concepto) => {
    const g = porConcepto.get(concepto);
    return {
      id: g?.id ?? null,
      concepto,
      label: conceptoGastoLabel[concepto],
      monto: g?.monto ?? null,
      pagado: g?.pagado ?? false,
      notas: g?.notas ?? null,
    };
  });
}

export async function totalGastosFijosMes(
  mes: number,
  anio: number
): Promise<Decimal | null> {
  const agg = await db.gastoFijo.aggregate({
    where: { mes, anio },
    _sum: { monto: true },
  });
  return agg._sum.monto;
}
