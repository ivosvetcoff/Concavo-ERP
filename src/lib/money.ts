import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value);
}

export function sumar(...values: (Decimal | string | number | null | undefined)[]): Decimal {
  return values.reduce<Decimal>(
    (acc, v) => acc.plus(toDecimal(v)),
    new Decimal(0)
  );
}

export function restar(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function calcularAvanceMueble(
  procesoActual: string | null | undefined,
  estadoTareaActual: string | null | undefined
): number {
  if (!procesoActual) return 0;

  const esOK = estadoTareaActual === "OK";

  switch (procesoActual) {
    case "HABILITADO":
      return esOK ? 30 : 20;
    case "ARMADO":
      return esOK ? 55 : 45;
    case "PULIDO":
      return esOK ? 80 : 70;
    case "LACA":
      return esOK ? 100 : 90;
    default:
      return 0;
  }
}

export function calcularAvanceProyecto(avancesMuebles: number[]): number {
  if (avancesMuebles.length === 0) return 0;
  const suma = avancesMuebles.reduce((a, b) => a + b, 0);
  return Math.round(suma / avancesMuebles.length);
}
