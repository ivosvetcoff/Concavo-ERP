import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generarCodigoProyecto(ultimoCodigo: string | null): string {
  if (!ultimoCodigo) return "001";
  const n = parseInt(ultimoCodigo, 10);
  if (isNaN(n)) return "001";
  return String(n + 1).padStart(3, "0");
}
