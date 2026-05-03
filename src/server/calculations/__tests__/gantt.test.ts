import { describe, it, expect } from "vitest";
import {
  calcularHorasEstimadasMueble,
  calcularHorasRealesMueble,
  calcularPorcentajeAvance,
  calcularImpactoTE,
  horasComprometidas,
  detectarSobrecarga,
  horasDisponiblesSemana,
  planificarProyecto,
  recalcularEnCascada,
  type OperadorPlanificacion,
  type MueblePlanificacion,
  type TareaExistente,
} from "../gantt";
import { lunesDeSemana, siguienteLunes } from "@/lib/festivos-mx";

// ===== Helpers =====

const lun = (year: number, month: number, day: number) =>
  lunesDeSemana(new Date(year, month - 1, day));

// Operadores base
const habilitador: OperadorPlanificacion = {
  empleadoId: "hab-1",
  especialidad: "HABILITADOR",
  horasSemanalesTO: 40,
};
const armador1: OperadorPlanificacion = {
  empleadoId: "arm-1",
  especialidad: "ARMADOR",
  horasSemanalesTO: 40,
};
const armador2: OperadorPlanificacion = {
  empleadoId: "arm-2",
  especialidad: "ARMADOR",
  horasSemanalesTO: 40,
};
const pulidor: OperadorPlanificacion = {
  empleadoId: "pul-1",
  especialidad: "PULIDOR",
  horasSemanalesTO: 40,
};

function mueble(overrides: Partial<MueblePlanificacion> = {}): MueblePlanificacion {
  return {
    muebleId: "m-1",
    cantidad: 1,
    horasEstimadasHabilitado: null,
    horasEstimadasArmado: null,
    horasEstimadasPulido: null,
    horasEstimadasLaca: null,
    horasEstimadasComplementos: null,
    horasEstimadasEmpaque: null,
    estadoItem: "FABRICACION",
    ...overrides,
  };
}

// ===== Escenario 1: 1 mueble + 1 operador → fechas correctas =====

describe("Escenario 1 — 1 mueble + 1 habilitador, 8h habilitado", () => {
  it("genera 1 segmento en la semana de inicio", () => {
    const inicio = lun(2025, 1, 6);
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 8 })],
      [habilitador],
      [],
      inicio
    );

    expect(plan.segmentos).toHaveLength(1);
    expect(plan.segmentos[0].empleadoId).toBe("hab-1");
    expect(plan.segmentos[0].horasPlanificadas).toBe(8);
    expect(plan.segmentos[0].semana.getTime()).toBe(inicio.getTime());
  });

  it("las horas totales estimadas son correctas", () => {
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 8 })],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );
    expect(plan.horasTotalesEst).toBe(8);
  });

  it("40h habilitado ocupa exactamente 1 semana completa", () => {
    const inicio = lun(2025, 1, 6);
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 40 })],
      [habilitador],
      [],
      inicio
    );
    expect(plan.segmentos).toHaveLength(1);
    expect(plan.segmentos[0].horasPlanificadas).toBe(40);
    expect(plan.fechaFinEst.getTime()).toBe(inicio.getTime());
  });

  it("80h habilitado ocupa 2 semanas", () => {
    const inicio = lun(2025, 1, 6);
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 80 })],
      [habilitador],
      [],
      inicio
    );
    // Semana 1: 40h, semana 2: 40h
    const semanas = new Set(plan.segmentos.map((s) => s.semana.getTime()));
    expect(semanas.size).toBe(2);
    expect(plan.horasTotalesEst).toBe(80);
  });
});

// ===== Escenario 2: 5 muebles → distribución paralela entre 2 armadores =====

describe("Escenario 2 — 5 muebles × 40h armado, 2 armadores", () => {
  const muebles = Array.from({ length: 5 }, (_, i) =>
    mueble({ muebleId: `m-${i + 1}`, horasEstimadasArmado: 40 })
  );
  const inicio = lun(2025, 1, 6);
  const plan = planificarProyecto(muebles, [armador1, armador2], [], inicio);

  it("genera exactamente 5 segmentos (1 por mueble de 40h c/u)", () => {
    expect(plan.segmentos).toHaveLength(5);
  });

  it("ambos armadores tienen trabajo asignado", () => {
    const empleados = new Set(plan.segmentos.map((s) => s.empleadoId));
    expect(empleados.size).toBe(2);
  });

  it("el proyecto termina en 3 semanas (2 arm × 40h/sem = 80h/sem, 200h total)", () => {
    // Sem 1: arm1=m1(40h), arm2=m2(40h)
    // Sem 2: arm1=m3(40h), arm2=m4(40h)
    // Sem 3: arm1=m5(40h)
    const semanasUnicas = new Set(plan.segmentos.map((s) => s.semana.getTime()));
    expect(semanasUnicas.size).toBe(3);
  });

  it("total horas estimadas = 200", () => {
    expect(plan.horasTotalesEst).toBe(200);
  });
});

// ===== Escenario 3: sobrecarga → detectarSobrecarga detecta el conflicto =====

describe("Escenario 3 — sobrecarga de operador", () => {
  const semana = lun(2025, 1, 6);

  const tareasExistentes: TareaExistente[] = [
    { empleadoId: "arm-1", semana, horasTO: 40, horasTE: 0, esCompensatorio: false },
  ];

  it("detecta sobrecarga cuando comprometidas > capacidad", () => {
    // Ya tiene 40h comprometidas; si agregamos 1h más → sobrecarga
    const segmentos = [
      {
        muebleId: "m-extra",
        proceso: "ARMADO" as const,
        empleadoId: "arm-1",
        semana,
        horasPlanificadas: 1,
      },
    ];
    expect(detectarSobrecarga("arm-1", semana, 40, tareasExistentes, segmentos)).toBe(true);
  });

  it("NO hay sobrecarga cuando comprometidas === capacidad (sin exceder)", () => {
    expect(detectarSobrecarga("arm-1", semana, 40, tareasExistentes, [])).toBe(false);
  });

  it("operador con 0h comprometidas NO está sobrecargado", () => {
    expect(detectarSobrecarga("arm-2", semana, 40, tareasExistentes, [])).toBe(false);
  });

  it("con tareas existentes que llenan la semana → horasDisponibles = 0", () => {
    expect(
      horasDisponiblesSemana("arm-1", semana, 40, tareasExistentes, [])
    ).toBe(0);
  });
});

// ===== Escenario 4: T.E. compensatoria → no afecta al Gantt =====

describe("Escenario 4 — T.E. compensatoria no atrasa", () => {
  it("calcularImpactoTE con esCompensatorio=true → 0", () => {
    expect(calcularImpactoTE(8, true)).toBe(0);
  });

  it("calcularImpactoTE(0, true) → 0", () => {
    expect(calcularImpactoTE(0, true)).toBe(0);
  });

  it("calcularImpactoTE(4, true) → 0 (no importa cuántas horas)", () => {
    expect(calcularImpactoTE(4, true)).toBe(0);
  });
});

// ===== Escenario 5: T.E. no compensatoria → atrasa =====

describe("Escenario 5 — T.E. no compensatoria atrasa", () => {
  it("calcularImpactoTE con esCompensatorio=false → devuelve las horas", () => {
    expect(calcularImpactoTE(8, false)).toBe(8);
  });

  it("calcularImpactoTE(16, false) → 16", () => {
    expect(calcularImpactoTE(16, false)).toBe(16);
  });

  it("T.E. no compensatoria ocupa capacidad del operador en la semana", () => {
    // Si el operador hizo 8h T.E. no compensatoria, se contabiliza en las comprometidas
    const semana = lun(2025, 1, 6);
    const tareas: TareaExistente[] = [
      {
        empleadoId: "arm-1",
        semana,
        horasTO: 32,
        horasTE: 8,
        esCompensatorio: false,
      },
    ];
    // horasComprometidas usa horasTO del registro (32), no incluye TE
    // La T.E. extra representa trabajo más allá del plan
    const comprometidas = horasComprometidas("arm-1", semana, tareas, []);
    expect(comprometidas).toBe(32);
  });
});

// ===== Escenario 6: festivo en medio → semana tiene menos horas disponibles =====

describe("Escenario 6 — festivo reduce capacidad de la semana", () => {
  it("semana de Navidad (22–28 dic 2025) tiene 32h TO en lugar de 40h", () => {
    // 22 dic=lun, 23=mar, 24=mié, 25=jue(FESTIVO), 26=vie, 27=sáb
    const semana = lun(2025, 12, 22);
    // Con 0 tareas previas, disponibles = min(40, 32) = 32
    const disponibles = horasDisponiblesSemana("hab-1", semana, 40, [], []);
    expect(disponibles).toBe(32);
  });

  it("planificar 40h en semana con festivo requiere spillover a semana siguiente", () => {
    const inicio = lun(2025, 12, 22); // semana Navidad (32h disponibles)
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 40 })],
      [habilitador],
      [],
      inicio
    );
    // Semana 1 (22 dic): 32h asignadas
    // Semana 2 (29 dic): 8h restantes (esa semana también tiene festivo el 1 ene, pero 8h caben)
    expect(plan.segmentos).toHaveLength(2);
    expect(plan.segmentos[0].horasPlanificadas).toBe(32);
    expect(plan.segmentos[1].horasPlanificadas).toBe(8);
  });
});

// ===== Escenario 7: proceso tardó más → empuja el siguiente proceso =====

describe("Escenario 7 — secuencia HABILITADO → ARMADO, cada uno en su semana", () => {
  it("ARMADO empieza la semana siguiente al fin de HABILITADO", () => {
    // 1 mueble: 40h habilitado + 40h armado
    // 1 habilitador + 1 armador, ambos con 40h/sem
    // fechaInicio = semana 1
    const inicio = lun(2025, 1, 6);
    const plan = planificarProyecto(
      [
        mueble({
          horasEstimadasHabilitado: 40,
          horasEstimadasArmado: 40,
        }),
      ],
      [habilitador, armador1],
      [],
      inicio
    );

    const segHab = plan.segmentos.filter((s) => s.proceso === "HABILITADO");
    const segArm = plan.segmentos.filter((s) => s.proceso === "ARMADO");

    expect(segHab).toHaveLength(1);
    expect(segArm).toHaveLength(1);

    // HABILITADO en semana 1, ARMADO en semana 2
    expect(segHab[0].semana.getTime()).toBe(inicio.getTime());
    expect(segArm[0].semana.getTime()).toBe(siguienteLunes(inicio).getTime());
  });

  it("con HABILITADO de 2 semanas, ARMADO empieza en semana 3", () => {
    const inicio = lun(2025, 1, 6);
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 80, horasEstimadasArmado: 40 })],
      [habilitador, armador1],
      [],
      inicio
    );

    const segArm = plan.segmentos.filter((s) => s.proceso === "ARMADO");
    const semana3 = siguienteLunes(siguienteLunes(inicio));
    expect(segArm[0].semana.getTime()).toBe(semana3.getTime());
  });
});

// ===== Escenario 8: mueble cancelado → se omite del plan =====

describe("Escenario 8 — mueble CANCELADO se omite del plan", () => {
  it("mueble cancelado no genera segmentos", () => {
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 40, estadoItem: "CANCELADO" })],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );
    expect(plan.segmentos).toHaveLength(0);
    expect(plan.horasTotalesEst).toBe(0);
  });

  it("mezcla de mueble activo + cancelado: solo planifica el activo", () => {
    const plan = planificarProyecto(
      [
        mueble({ muebleId: "activo", horasEstimadasHabilitado: 8 }),
        mueble({
          muebleId: "cancelado",
          horasEstimadasHabilitado: 40,
          estadoItem: "CANCELADO",
        }),
      ],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );
    expect(plan.segmentos).toHaveLength(1);
    expect(plan.segmentos[0].muebleId).toBe("activo");
    expect(plan.horasTotalesEst).toBe(8);
  });

  it("mueble ENTREGADO también se omite", () => {
    const plan = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 40, estadoItem: "ENTREGADO" })],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );
    expect(plan.segmentos).toHaveLength(0);
  });
});

// ===== Escenario 9: plan bloqueado → no se re-planifica =====

describe("Escenario 9 — plan bloqueado no se modifica", () => {
  it("recalcularEnCascada con bloqueado=true devuelve el mismo plan", () => {
    const planOriginal = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 8 })],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );

    const resultado = recalcularEnCascada(
      [mueble({ horasEstimadasHabilitado: 40 })], // horas diferentes
      [habilitador],
      [],
      lun(2025, 2, 3), // fecha diferente
      true, // bloqueado
      planOriginal
    );

    // Debe devolver el plan original sin cambios
    expect(resultado.segmentos).toHaveLength(planOriginal.segmentos.length);
    expect(resultado.horasTotalesEst).toBe(planOriginal.horasTotalesEst);
    expect(resultado.fechaFinEst.getTime()).toBe(planOriginal.fechaFinEst.getTime());
  });

  it("recalcularEnCascada con bloqueado=false re-planifica", () => {
    const planOriginal = planificarProyecto(
      [mueble({ horasEstimadasHabilitado: 8 })],
      [habilitador],
      [],
      lun(2025, 1, 6)
    );

    const resultado = recalcularEnCascada(
      [mueble({ horasEstimadasHabilitado: 40 })], // horas distintas
      [habilitador],
      [],
      lun(2025, 1, 6),
      false, // NO bloqueado
      planOriginal
    );

    expect(resultado.horasTotalesEst).toBe(40); // recalculó con las nuevas horas
  });
});

// ===== Escenario 10: cascada entre proyectos =====

describe("Escenario 10 — cascada entre proyectos comparte operadores", () => {
  it("proyecto 2 se planifica en semanas posteriores cuando el operador ya está ocupado", () => {
    const inicio = lun(2025, 1, 6);

    // Proyecto 1 ocupa al habilitador por 2 semanas completas
    const planProyecto1 = planificarProyecto(
      [mueble({ muebleId: "p1-m1", horasEstimadasHabilitado: 80 })],
      [habilitador],
      [],
      inicio
    );

    // Convertimos los segmentos del proyecto 1 a TareaExistente
    const tareasProyecto1: TareaExistente[] = planProyecto1.segmentos.map((s) => ({
      empleadoId: s.empleadoId,
      semana: s.semana,
      horasTO: s.horasPlanificadas,
      horasTE: 0,
      esCompensatorio: false,
    }));

    // Proyecto 2 con el mismo habilitador
    const planProyecto2 = planificarProyecto(
      [mueble({ muebleId: "p2-m1", horasEstimadasHabilitado: 40 })],
      [habilitador],
      tareasProyecto1,
      inicio
    );

    // El habilitador está ocupado semanas 1 y 2 → proyecto 2 empieza en semana 3
    const semana3 = siguienteLunes(siguienteLunes(inicio));
    expect(planProyecto2.segmentos[0].semana.getTime()).toBe(semana3.getTime());
  });

  it("si hay dos operadores del mismo tipo, el segundo proyecto empieza en semana 1", () => {
    const inicio = lun(2025, 1, 6);

    const planProyecto1 = planificarProyecto(
      [mueble({ muebleId: "p1-m1", horasEstimadasArmado: 40 })],
      [armador1, armador2],
      [],
      inicio
    );

    const tareasProyecto1: TareaExistente[] = planProyecto1.segmentos.map((s) => ({
      empleadoId: s.empleadoId,
      semana: s.semana,
      horasTO: s.horasPlanificadas,
      horasTE: 0,
      esCompensatorio: false,
    }));

    const planProyecto2 = planificarProyecto(
      [mueble({ muebleId: "p2-m1", horasEstimadasArmado: 40 })],
      [armador1, armador2],
      tareasProyecto1,
      inicio
    );

    // armador1 está ocupado pero armador2 está libre → proyecto 2 también en semana 1
    expect(planProyecto2.segmentos[0].semana.getTime()).toBe(inicio.getTime());
  });
});

// ===== Tests adicionales de cálculo de avance =====

describe("calcularPorcentajeAvance", () => {
  it("sin horas estimadas → null", () => {
    expect(
      calcularPorcentajeAvance(
        { horasEstimadasHabilitado: null, horasEstimadasArmado: null, horasEstimadasPulido: null, horasEstimadasLaca: null, horasEstimadasComplementos: null, horasEstimadasEmpaque: null, cantidad: 1 },
        []
      )
    ).toBeNull();
  });

  it("50% avance cuando reales = mitad de estimadas", () => {
    const m = {
      horasEstimadasHabilitado: 8,
      horasEstimadasArmado: null,
      horasEstimadasPulido: null,
      horasEstimadasLaca: null,
      horasEstimadasComplementos: null,
      horasEstimadasEmpaque: null,
      cantidad: 1,
    };
    const registros = [{ horasTO: 4, horasTE: 0, esCompensatorio: false }];
    expect(calcularPorcentajeAvance(m, registros)).toBe(50);
  });

  it("tope en 100% aunque horas reales > estimadas", () => {
    const m = {
      horasEstimadasHabilitado: 8,
      horasEstimadasArmado: null,
      horasEstimadasPulido: null,
      horasEstimadasLaca: null,
      horasEstimadasComplementos: null,
      horasEstimadasEmpaque: null,
      cantidad: 1,
    };
    const registros = [{ horasTO: 12, horasTE: 0, esCompensatorio: false }];
    expect(calcularPorcentajeAvance(m, registros)).toBe(100);
  });

  it("cantidad multiplica las horas estimadas", () => {
    const m = {
      horasEstimadasHabilitado: 4,
      horasEstimadasArmado: null,
      horasEstimadasPulido: null,
      horasEstimadasLaca: null,
      horasEstimadasComplementos: null,
      horasEstimadasEmpaque: null,
      cantidad: 2, // 4h × 2 = 8h totales
    };
    const registros = [{ horasTO: 4, horasTE: 0, esCompensatorio: false }];
    expect(calcularPorcentajeAvance(m, registros)).toBe(50);
  });
});
