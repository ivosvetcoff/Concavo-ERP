import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  calcularProporcional,
  calcularCostoMODirecta,
  calcularCostoProyecto,
  calcularUtilidadProyecto,
  calcularUtilidadMes,
} from "../utilidad";

// Tarifas reales de septiembre 2025 (del Master Administrativo del cliente)
const TARIFAS = {
  PEPE:    { to: "66.67", te: "133.34" },
  CRISTIAN: { to: "73.33", te: "146.66" },
  BETO:    { to: "77.78", te: "155.56" },
  CHAVA:   { to: "73.33", te: "146.66" },
  RAMON:   { to: "88.89", te: "177.78" },
  SULI:    { to: "60.00", te: "120.00" },
  JONA:    { to: "60.00", te: "120.00" },
  CITLA:   { to: "73.33", te: "146.66" },
};

// ===== calcularProporcional =====

describe("calcularProporcional", () => {
  it("calcula prorrateo básico con división exacta", () => {
    // totalInsumos=15200, totalItems=114, qtyProyecto=30
    // 15200 / 114 * 30 = 4000.00
    const result = calcularProporcional("15200", 114, 30);
    expect(result.toFixed(2)).toBe("4000.00");
  });

  it("calcula prorrateo con totalItems=50 y qty pequeño", () => {
    // totalInsumos=4000, totalItems=50, qtyProyecto=5
    // 4000 / 50 * 5 = 400.00
    const result = calcularProporcional("4000", 50, 5);
    expect(result.toFixed(2)).toBe("400.00");
  });

  it("retorna 0 cuando totalItemsMes es 0 (evita división por cero)", () => {
    const result = calcularProporcional("5000", 0, 10);
    expect(result.toNumber()).toBe(0);
  });

  it("prorratea correctamente un proyecto con 1 ítem", () => {
    // totalInsumos=4000, totalItems=50, qty=2 → 4000/50*2=160.00
    const result = calcularProporcional("4000", 50, 2);
    expect(result.toFixed(2)).toBe("160.00");
  });
});

// ===== calcularCostoMODirecta =====

describe("calcularCostoMODirecta", () => {
  it("retorna 0 sin registros", () => {
    const result = calcularCostoMODirecta([]);
    expect(result.toNumber()).toBe(0);
  });

  it("calcula costo de un solo empleado sin horas extra", () => {
    // PEPE: 20 TO × 66.67 = 1333.40
    const result = calcularCostoMODirecta([
      { horasTO: 20, horasTE: 0, tarifaHoraTO: "66.67", tarifaHoraTE: "133.34" },
    ]);
    expect(result.toFixed(2)).toBe("1333.40");
  });

  it("calcula costo con horas ordinarias y extras al doble", () => {
    // PEPE: 50 TO × 66.67 = 3333.50, 5 TE × 133.34 = 666.70 → 4000.20
    const result = calcularCostoMODirecta([
      { horasTO: 50, horasTE: 5, tarifaHoraTO: "66.67", tarifaHoraTE: "133.34" },
    ]);
    expect(result.toFixed(2)).toBe("4000.20");
  });

  it("suma correctamente múltiples empleados y procesos", () => {
    // PEPE:    50 TO × 66.67 + 5 TE × 133.34 = 4000.20
    // CRISTIAN: 20 TO × 73.33                 = 1466.60
    // Total = 5466.80
    const result = calcularCostoMODirecta([
      { horasTO: 50, horasTE: 5,  tarifaHoraTO: TARIFAS.PEPE.to,     tarifaHoraTE: TARIFAS.PEPE.te },
      { horasTO: 20, horasTE: 0,  tarifaHoraTO: TARIFAS.CRISTIAN.to, tarifaHoraTE: TARIFAS.CRISTIAN.te },
    ]);
    expect(result.toFixed(2)).toBe("5466.80");
  });

  it("TE es exactamente el doble de TO (ley federal del trabajo)", () => {
    const horasTO = 10;
    const tarifaTO = new Decimal("73.33");
    const tarifaTE = tarifaTO.mul(2);
    const result = calcularCostoMODirecta([
      {
        horasTO,
        horasTE: horasTO,
        tarifaHoraTO: tarifaTO.toString(),
        tarifaHoraTE: tarifaTE.toString(),
      },
    ]);
    // 10 TO × 73.33 + 10 TE × 146.66 = 733.30 + 1466.60 = 2199.90
    expect(result.toFixed(2)).toBe("2199.90");
  });
});

// ===== calcularCostoProyecto =====

describe("calcularCostoProyecto", () => {
  it("suma todos los componentes correctamente", () => {
    const propInsumos = new Decimal("400.00");
    const propMOI = new Decimal("200.00");
    const costoMO = new Decimal("2066.70");
    const result = calcularCostoProyecto("8178.85", propInsumos, propMOI, costoMO);
    expect(result.toFixed(2)).toBe("10845.55");
  });
});

// ===== calcularUtilidadProyecto — Casos de prueba mandatorios =====
// Datos de septiembre 2025. Fuente: Master Administrativo del cliente.
// Los inputs están construidos para producir exactamente el costo documentado.

describe("calcularUtilidadProyecto — caso 722 (RTS)", () => {
  /*
   * Proyecto 722, cliente RTS.
   * Monto cotización: $159,384
   * Costo documentado: $65,468.41
   * Utilidad: $93,915.59  (Excel muestra 93,915.58 — diferencia de 1¢ por redondeo del Excel)
   * Utilidad sobre venta: ~58.92%
   *
   * Inputs construidos:
   *   materialDirecto  = 53,001.61
   *   propInsumos      = 15200/114*30 = 4,000.00
   *   propMOI          = 11400/114*30 = 3,000.00
   *   costoMO          = 5,466.80
   *   Total            = 65,468.41 ✓
   */
  const entrada = {
    montoVendido: "159384",
    materialDirecto: "53001.61",
    registros: [
      { horasTO: 50, horasTE: 5, tarifaHoraTO: TARIFAS.PEPE.to,     tarifaHoraTE: TARIFAS.PEPE.te },
      { horasTO: 20, horasTE: 0, tarifaHoraTO: TARIFAS.CRISTIAN.to, tarifaHoraTE: TARIFAS.CRISTIAN.te },
    ],
    qtyItemsProyecto: 30,
    totalInsumosMes: "15200",
    totalMOIMes: "11400",
    totalItemsMes: 114,
  };

  it("calcula el costo del proyecto exactamente", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.costoProyecto.toFixed(2)).toBe("65468.41");
  });

  it("calcula la utilidad del proyecto", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.utilidad.toFixed(2)).toBe("93915.59");
  });

  it("calcula utilidad sobre venta ≈ 58.92%", () => {
    const r = calcularUtilidadProyecto(entrada);
    const pct = r.utilidadSobreVenta.mul(100).toFixed(2);
    expect(pct).toBe("58.92");
  });

  it("desglosa proporcionales correctamente", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.proporcionalInsumos.toFixed(2)).toBe("4000.00");
    expect(r.proporcionalMOI.toFixed(2)).toBe("3000.00");
  });
});

describe("calcularUtilidadProyecto — caso EXPRESS (SYG)", () => {
  /*
   * Proyecto EXPRESS, cliente SYG.
   * Monto cotización: $25,800
   * Costo documentado: $10,845.55
   * Utilidad: $14,954.45  ✓ (coincide exactamente)
   * Utilidad sobre venta: ~57.96%
   *
   * Inputs construidos:
   *   materialDirecto  = 8,178.85
   *   propInsumos      = 4000/50*5 = 400.00
   *   propMOI          = 2000/50*5 = 200.00
   *   costoMO          = 2,066.70
   *   Total            = 10,845.55 ✓
   */
  const entrada = {
    montoVendido: "25800",
    materialDirecto: "8178.85",
    registros: [
      { horasTO: 20, horasTE: 0, tarifaHoraTO: TARIFAS.PEPE.to,  tarifaHoraTE: TARIFAS.PEPE.te },
      { horasTO: 10, horasTE: 0, tarifaHoraTO: TARIFAS.CITLA.to, tarifaHoraTE: TARIFAS.CITLA.te },
    ],
    qtyItemsProyecto: 5,
    totalInsumosMes: "4000",
    totalMOIMes: "2000",
    totalItemsMes: 50,
  };

  it("calcula el costo del proyecto exactamente", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.costoProyecto.toFixed(2)).toBe("10845.55");
  });

  it("calcula la utilidad del proyecto exactamente", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.utilidad.toFixed(2)).toBe("14954.45");
  });

  it("calcula utilidad sobre venta ≈ 57.96%", () => {
    const r = calcularUtilidadProyecto(entrada);
    const pct = r.utilidadSobreVenta.mul(100).toFixed(2);
    expect(pct).toBe("57.96");
  });
});

describe("calcularUtilidadProyecto — caso 1541 (TRRA)", () => {
  /*
   * Proyecto 1541, cliente TRRA.
   * Monto cotización: $18,908
   * Costo documentado: $2,528.94
   * Utilidad: $16,379.06  (Excel muestra 16,379.05 — diferencia de 1¢ por redondeo del Excel)
   * Utilidad sobre venta: ~86.62%
   *
   * Inputs construidos:
   *   materialDirecto  = 988.89
   *   propInsumos      = 4000/50*2 = 160.00
   *   propMOI          = 2000/50*2 = 80.00
   *   costoMO          = 1,300.05
   *   Total            = 2,528.94 ✓
   */
  const entrada = {
    montoVendido: "18908",
    materialDirecto: "988.89",
    registros: [
      { horasTO: 15, horasTE: 0, tarifaHoraTO: TARIFAS.PEPE.to, tarifaHoraTE: TARIFAS.PEPE.te },
      { horasTO: 5,  horasTE: 0, tarifaHoraTO: TARIFAS.SULI.to, tarifaHoraTE: TARIFAS.SULI.te },
    ],
    qtyItemsProyecto: 2,
    totalInsumosMes: "4000",
    totalMOIMes: "2000",
    totalItemsMes: 50,
  };

  it("calcula el costo del proyecto exactamente", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.costoProyecto.toFixed(2)).toBe("2528.94");
  });

  it("calcula la utilidad del proyecto", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.utilidad.toFixed(2)).toBe("16379.06");
  });

  it("calcula utilidad sobre venta ≈ 86.63%", () => {
    const r = calcularUtilidadProyecto(entrada);
    const pct = r.utilidadSobreVenta.mul(100).toFixed(2);
    expect(pct).toBe("86.63");
  });

  it("calcula utilidad sobre costo", () => {
    const r = calcularUtilidadProyecto(entrada);
    expect(r.utilidadSobreCosto.toNumber()).toBeGreaterThan(0);
  });
});

// ===== calcularUtilidadMes =====

describe("calcularUtilidadMes", () => {
  it("suma utilidades de proyectos y resta gastos fijos", () => {
    const result = calcularUtilidadMes({
      proyectos: [
        { utilidad: new Decimal("93915.59") },
        { utilidad: new Decimal("14954.45") },
        { utilidad: new Decimal("16379.06") },
      ],
      gastosFijos: ["25000", "8000", "3500"],
    });

    // utilidadTotal = 125249.10
    expect(result.utilidadProyectosTotal.toFixed(2)).toBe("125249.10");
    // costoFijo = 36500
    expect(result.costoFijoTotal.toFixed(2)).toBe("36500.00");
    // utilidadNeta = 125249.10 - 36500 = 88749.10
    expect(result.utilidadNetaMes.toFixed(2)).toBe("88749.10");
  });

  it("retorna 0 si no hay proyectos ni gastos", () => {
    const result = calcularUtilidadMes({ proyectos: [], gastosFijos: [] });
    expect(result.utilidadNetaMes.toNumber()).toBe(0);
  });

  it("utilidad neta puede ser negativa si gastos superan utilidades", () => {
    const result = calcularUtilidadMes({
      proyectos: [{ utilidad: new Decimal("5000") }],
      gastosFijos: ["60000"],
    });
    expect(result.utilidadNetaMes.toNumber()).toBeLessThan(0);
    expect(result.utilidadNetaMes.toFixed(2)).toBe("-55000.00");
  });

  it("los gastos fijos NO se incluyen en las utilidades por proyecto", () => {
    // Los gastos fijos solo afectan el consolidado del mes, nunca el cálculo individual
    const result = calcularUtilidadMes({
      proyectos: [{ utilidad: new Decimal("100000") }],
      gastosFijos: ["10000", "5000"],
    });
    expect(result.utilidadProyectosTotal.toFixed(2)).toBe("100000.00");
    expect(result.costoFijoTotal.toFixed(2)).toBe("15000.00");
    expect(result.utilidadNetaMes.toFixed(2)).toBe("85000.00");
  });
});
