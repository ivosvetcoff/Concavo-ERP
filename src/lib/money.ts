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
  tareaCompletada: boolean | null | undefined
): number {
  if (!procesoActual) return 0;

  const completo = tareaCompletada === true;

  switch (procesoActual) {
    case "HABILITADO":
      return completo ? 15 : 10;
    case "ARMADO":
      return completo ? 30 : 25;
    case "PULIDO":
      return completo ? 45 : 40;
    case "LACA":
      return completo ? 60 : 55;
    case "EXTERNO":
      return completo ? 70 : 65;
    case "COMPLEMENTOS":
      return completo ? 80 : 75;
    case "EMPAQUE":
      return completo ? 90 : 85;
    case "LISTO_PARA_ENTREGA":
      return 95;
    case "ENTREGADO":
      return 100;
    default:
      return 0;
  }
}

export function calcularAvanceProyecto(avancesMuebles: number[]): number {
  if (avancesMuebles.length === 0) return 0;
  const suma = avancesMuebles.reduce((a, b) => a + b, 0);
  return Math.round(suma / avancesMuebles.length);
}
