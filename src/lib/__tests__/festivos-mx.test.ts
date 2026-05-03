import { describe, it, expect } from "vitest";
import {
  esFeriadoMX,
  esDomingo,
  esSabado,
  esLaborableMX,
  lunesDeSemana,
  siguienteLunes,
  horasLaborablesSemana,
  getFestivosAnio,
} from "../festivos-mx";

// ===== getFestivosAnio =====

describe("getFestivosAnio", () => {
  it("devuelve 7 festivos para 2025", () => {
    expect(getFestivosAnio(2025)).toHaveLength(7);
  });

  it("Año Nuevo 2025 = 1 enero", () => {
    const f = getFestivosAnio(2025);
    expect(f.some((d) => d.getMonth() === 0 && d.getDate() === 1)).toBe(true);
  });

  it("Constitución 2025 = lunes 3 febrero", () => {
    // Feb 2025: día 1=sábado → primer lunes = día 3
    const f = getFestivosAnio(2025);
    const constitucion = f.find((d) => d.getMonth() === 1);
    expect(constitucion?.getDate()).toBe(3);
    expect(constitucion?.getDay()).toBe(1); // lunes
  });

  it("Benito Juárez 2025 = lunes 17 marzo", () => {
    // Mar 2025: día 1=sábado → primer lunes=3, tercer lunes=17
    const f = getFestivosAnio(2025);
    const juarez = f.find((d) => d.getMonth() === 2);
    expect(juarez?.getDate()).toBe(17);
    expect(juarez?.getDay()).toBe(1);
  });

  it("Revolución 2025 = lunes 17 noviembre", () => {
    // Nov 2025: día 1=sábado → primer lunes=3, tercer lunes=17
    const f = getFestivosAnio(2025);
    const revolucion = f.find((d) => d.getMonth() === 10);
    expect(revolucion?.getDate()).toBe(17);
    expect(revolucion?.getDay()).toBe(1);
  });
});

// ===== esFeriadoMX =====

describe("esFeriadoMX", () => {
  it("1 enero 2025 es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 0, 1))).toBe(true);
  });

  it("1 mayo 2025 es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 4, 1))).toBe(true);
  });

  it("16 septiembre 2025 es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 8, 16))).toBe(true);
  });

  it("25 diciembre 2025 es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 11, 25))).toBe(true);
  });

  it("1 enero 2026 es feriado (año siguiente)", () => {
    expect(esFeriadoMX(new Date(2026, 0, 1))).toBe(true);
  });

  it("lunes ordinario 6 enero 2025 NO es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 0, 6))).toBe(false);
  });

  it("sábado 11 enero 2025 NO es feriado", () => {
    expect(esFeriadoMX(new Date(2025, 0, 11))).toBe(false);
  });
});

// ===== esDomingo / esSabado =====

describe("esDomingo / esSabado", () => {
  it("domingo 5 enero 2025", () => {
    expect(esDomingo(new Date(2025, 0, 5))).toBe(true);
  });

  it("sábado 11 enero 2025", () => {
    expect(esSabado(new Date(2025, 0, 11))).toBe(true);
  });

  it("lunes no es domingo ni sábado", () => {
    expect(esDomingo(new Date(2025, 0, 6))).toBe(false);
    expect(esSabado(new Date(2025, 0, 6))).toBe(false);
  });
});

// ===== esLaborableMX =====

describe("esLaborableMX", () => {
  it("lunes ordinario es laborable", () => {
    expect(esLaborableMX(new Date(2025, 0, 6))).toBe(true);
  });

  it("sábado ordinario es laborable (T.E.)", () => {
    expect(esLaborableMX(new Date(2025, 0, 11))).toBe(true);
  });

  it("domingo NO es laborable", () => {
    expect(esLaborableMX(new Date(2025, 0, 5))).toBe(false);
  });

  it("1 mayo (festivo) NO es laborable aunque sea jueves", () => {
    // 1 mayo 2025 = jueves
    expect(esLaborableMX(new Date(2025, 4, 1))).toBe(false);
  });
});

// ===== lunesDeSemana =====

describe("lunesDeSemana", () => {
  it("lunes → mismo lunes", () => {
    const lun = new Date(2025, 0, 6); // lunes 6 ene
    expect(lunesDeSemana(lun).getDate()).toBe(6);
  });

  it("miércoles → lunes de esa semana", () => {
    const mie = new Date(2025, 0, 8); // miércoles 8 ene
    expect(lunesDeSemana(mie).getDate()).toBe(6);
  });

  it("domingo → lunes de esa semana (día anterior)", () => {
    const dom = new Date(2025, 0, 12); // domingo 12 ene
    expect(lunesDeSemana(dom).getDate()).toBe(6);
  });

  it("sábado → lunes de esa semana", () => {
    const sab = new Date(2025, 0, 11); // sábado 11 ene
    expect(lunesDeSemana(sab).getDate()).toBe(6);
  });
});

// ===== siguienteLunes =====

describe("siguienteLunes", () => {
  it("desde lunes 6 ene → lunes 13 ene", () => {
    const d = siguienteLunes(new Date(2025, 0, 6));
    expect(d.getDate()).toBe(13);
  });

  it("desde miércoles 8 ene → lunes 13 ene", () => {
    const d = siguienteLunes(new Date(2025, 0, 8));
    expect(d.getDate()).toBe(13);
  });
});

// ===== horasLaborablesSemana =====

describe("horasLaborablesSemana", () => {
  it("semana sin festivos: 40h TO + 8h TE", () => {
    // Semana 6–12 enero 2025 (sin festivos)
    const s = horasLaborablesSemana(new Date(2025, 0, 6));
    expect(s.horasTO).toBe(40);
    expect(s.horasTE).toBe(8);
  });

  it("semana con Navidad (22–28 dic 2025): pierde 8h TO el jueves 25", () => {
    // Lun 22, Mar 23, Mié 24, Jue 25 (FESTIVO), Vie 26, Sáb 27
    const s = horasLaborablesSemana(new Date(2025, 11, 22));
    expect(s.horasTO).toBe(32); // 4 días × 8h
    expect(s.horasTE).toBe(8);
  });

  it("semana con Año Nuevo 2026 (29 dic–4 ene): pierde 8h TO el jueves 1 ene", () => {
    // Lun 29, Mar 30, Mié 31, Jue 1 ene (FESTIVO), Vie 2, Sáb 3
    const s = horasLaborablesSemana(new Date(2025, 11, 29));
    expect(s.horasTO).toBe(32);
    expect(s.horasTE).toBe(8);
  });

  it("semana con festivo en sábado: pierde las 8h TE", () => {
    // Constitución 2025 = lunes 3 feb (primer lunes de febrero)
    // Semana del 3 feb: lun=FESTIVO, mar, mié, jue, vie, sáb
    const s = horasLaborablesSemana(new Date(2025, 1, 3));
    expect(s.horasTO).toBe(32); // lunes es festivo → 4 días TO
    expect(s.horasTE).toBe(8);
  });
});
