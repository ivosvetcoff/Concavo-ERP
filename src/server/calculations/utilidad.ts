import Decimal from "decimal.js";

// ===== TIPOS =====

export type RegistroProduccionCalc = {
  horasTO: string | number;
  horasTE: string | number;
  tarifaHoraTO: string | number;
  tarifaHoraTE: string | number;
};

export type EntradaUtilidadProyecto = {
  montoVendido: string | number;
  materialDirecto: string | number;
  registros: RegistroProduccionCalc[];
  qtyItemsProyecto: number;
  totalInsumosMes: string | number;
  totalMOIMes: string | number;
  totalItemsMes: number;
};

export type ResultadoUtilidadProyecto = {
  materialDirecto: Decimal;
  proporcionalInsumos: Decimal;
  proporcionalMOI: Decimal;
  costoMODirecta: Decimal;
  costoProyecto: Decimal;
  utilidad: Decimal;
  utilidadSobreVenta: Decimal; // 0–1 (no porcentaje)
  utilidadSobreCosto: Decimal; // 0–1
};

export type EntradaUtilidadMes = {
  proyectos: { utilidad: Decimal }[];
  gastosFijos: (string | number)[];
};

export type ResultadoUtilidadMes = {
  utilidadProyectosTotal: Decimal;
  costoFijoTotal: Decimal;
  utilidadNetaMes: Decimal;
};

// ===== FÓRMULAS INDIVIDUALES =====

/**
 * Prorrateo proporcional por qty de ítems.
 * Formula: (totalMes / totalItemsMes) * qtyItemsProyecto
 */
export function calcularProporcional(
  totalMes: string | number,
  totalItemsMes: number,
  qtyItemsProyecto: number
): Decimal {
  if (totalItemsMes === 0) return new Decimal(0);
  return new Decimal(totalMes).div(totalItemsMes).mul(qtyItemsProyecto);
}

/**
 * Costo de mano de obra directa para el proyecto.
 * Suma: (horasTO × tarifaTO) + (horasTE × tarifaTE) por cada registro.
 * Las tarifas son por empleado (no globales).
 */
export function calcularCostoMODirecta(
  registros: RegistroProduccionCalc[]
): Decimal {
  return registros.reduce((acc, r) => {
    const costoTO = new Decimal(r.horasTO).mul(r.tarifaHoraTO);
    const costoTE = new Decimal(r.horasTE).mul(r.tarifaHoraTE);
    return acc.plus(costoTO).plus(costoTE);
  }, new Decimal(0));
}

/**
 * Costo total del proyecto.
 * Formula: materialDirecto + proporcionalInsumos + proporcionalMOI + costoMODirecta
 */
export function calcularCostoProyecto(
  materialDirecto: string | number,
  proporcionalInsumos: Decimal,
  proporcionalMOI: Decimal,
  costoMODirecta: Decimal
): Decimal {
  return new Decimal(materialDirecto)
    .plus(proporcionalInsumos)
    .plus(proporcionalMOI)
    .plus(costoMODirecta);
}

// ===== FÓRMULA COMPLETA POR PROYECTO =====

/**
 * Calcula la utilidad completa de un proyecto entregado en un mes.
 * Es la fórmula oficial del Master Administrativo del cliente.
 */
export function calcularUtilidadProyecto(
  entrada: EntradaUtilidadProyecto
): ResultadoUtilidadProyecto {
  const monto = new Decimal(entrada.montoVendido);
  const materialDirecto = new Decimal(entrada.materialDirecto);

  const proporcionalInsumos = calcularProporcional(
    entrada.totalInsumosMes,
    entrada.totalItemsMes,
    entrada.qtyItemsProyecto
  );

  const proporcionalMOI = calcularProporcional(
    entrada.totalMOIMes,
    entrada.totalItemsMes,
    entrada.qtyItemsProyecto
  );

  const costoMODirecta = calcularCostoMODirecta(entrada.registros);

  const costoProyecto = calcularCostoProyecto(
    materialDirecto.toString(),
    proporcionalInsumos,
    proporcionalMOI,
    costoMODirecta
  );

  const utilidad = monto.minus(costoProyecto);
  const utilidadSobreVenta = monto.isZero()
    ? new Decimal(0)
    : utilidad.div(monto);
  const utilidadSobreCosto = costoProyecto.isZero()
    ? new Decimal(0)
    : utilidad.div(costoProyecto);

  return {
    materialDirecto,
    proporcionalInsumos,
    proporcionalMOI,
    costoMODirecta,
    costoProyecto,
    utilidad,
    utilidadSobreVenta,
    utilidadSobreCosto,
  };
}

// ===== UTILIDAD CONSOLIDADA DEL MES =====

/**
 * Utilidad neta del mes: suma de utilidades de proyectos entregados menos gastos fijos.
 * Los gastos fijos NO se prorratean por proyecto — se restan al consolidado del mes.
 */
export function calcularUtilidadMes(
  entrada: EntradaUtilidadMes
): ResultadoUtilidadMes {
  const utilidadProyectosTotal = entrada.proyectos.reduce(
    (acc, p) => acc.plus(p.utilidad),
    new Decimal(0)
  );

  const costoFijoTotal = entrada.gastosFijos.reduce(
    (acc, g) => acc.plus(new Decimal(g)),
    new Decimal(0)
  );

  const utilidadNetaMes = utilidadProyectosTotal.minus(costoFijoTotal);

  return {
    utilidadProyectosTotal,
    costoFijoTotal,
    utilidadNetaMes,
  };
}
