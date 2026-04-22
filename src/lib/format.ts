import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import Decimal from "decimal.js";

const TIMEZONE = "America/Mexico_City";

// ===== DINERO =====

export function formatMXN(
  monto: Decimal | string | number | null | undefined
): string {
  if (monto === null || monto === undefined) return "—";
  const num = new Decimal(monto).toNumber();
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseMXN(value: string): Decimal {
  const cleaned = value.replace(/[$,\s]/g, "");
  return new Decimal(cleaned || "0");
}

// ===== FECHAS =====

export function formatDate(
  fecha: Date | string | null | undefined,
  fmt = "dd/MM/yyyy"
): string {
  if (!fecha) return "—";
  const date = typeof fecha === "string" ? parseISO(fecha) : fecha;
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, fmt, { locale: es });
}

export function formatDateTime(fecha: Date | string | null | undefined): string {
  return formatDate(fecha, "dd/MM/yyyy HH:mm");
}

export function formatMonthYear(fecha: Date | string | null | undefined): string {
  return formatDate(fecha, "MMMM yyyy");
}

export function toMexicoDate(date: Date): Date {
  return toZonedTime(date, TIMEZONE);
}

// ===== NÚMEROS =====

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-MX").format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n}%`;
}
