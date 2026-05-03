// Festivos federales obligatorios en México (Ley Federal del Trabajo, Art. 74)
// TZ: America/Mexico_City — Guadalajara/Jalisco no observa horario de verano desde 2022

const FESTIVOS_FIJOS: Array<{ mes: number; dia: number }> = [
  { mes: 1, dia: 1 },   // Año Nuevo
  { mes: 5, dia: 1 },   // Día del Trabajo
  { mes: 9, dia: 16 },  // Día de la Independencia
  { mes: 12, dia: 25 }, // Navidad
];

function primerLunesDe(anio: number, mes: number): Date {
  const d = new Date(anio, mes - 1, 1);
  const day = d.getDay(); // 0=Dom 1=Lun …
  const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  return new Date(anio, mes - 1, 1 + offset);
}

function tercerLunesDe(anio: number, mes: number): Date {
  const first = primerLunesDe(anio, mes);
  return new Date(first.getFullYear(), first.getMonth(), first.getDate() + 14);
}

export function getFestivosAnio(anio: number): Date[] {
  return [
    ...FESTIVOS_FIJOS.map(({ mes, dia }) => new Date(anio, mes - 1, dia)),
    primerLunesDe(anio, 2),   // Constitución (primer lunes de febrero)
    tercerLunesDe(anio, 3),   // Benito Juárez (tercer lunes de marzo)
    tercerLunesDe(anio, 11),  // Revolución (tercer lunes de noviembre)
  ];
}

function mismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function esFeriadoMX(fecha: Date): boolean {
  return getFestivosAnio(fecha.getFullYear()).some((f) => mismaFecha(f, fecha));
}

export function esDomingo(fecha: Date): boolean {
  return fecha.getDay() === 0;
}

export function esSabado(fecha: Date): boolean {
  return fecha.getDay() === 6;
}

// Laborable = no domingo ni festivo (sábados cuentan como T.E. en Concavo)
export function esLaborableMX(fecha: Date): boolean {
  return !esDomingo(fecha) && !esFeriadoMX(fecha);
}

// Lunes de la semana que contiene la fecha (semana Lun–Dom)
export function lunesDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// Lunes de la semana siguiente
export function siguienteLunes(fecha: Date): Date {
  const d = lunesDeSemana(fecha);
  d.setDate(d.getDate() + 7);
  return d;
}

// Horas laborables de una semana (lunes de la semana → suma Lun–Sáb excluyendo festivos)
// Lun–Vie = T.O. (8h c/u), Sáb = T.E. (8h), festivos = 0
export function horasLaborablesSemana(semana: Date): { horasTO: number; horasTE: number } {
  let horasTO = 0;
  let horasTE = 0;
  for (let i = 0; i < 6; i++) {
    const dia = new Date(semana);
    dia.setDate(semana.getDate() + i);
    if (esFeriadoMX(dia)) continue;
    if (i < 5) horasTO += 8; // Lun–Vie
    else horasTE += 8;        // Sáb
  }
  return { horasTO, horasTE };
}
