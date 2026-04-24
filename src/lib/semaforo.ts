import type { EstadoProyecto, Semaforo } from "@prisma/client";

export function calcularSemaforoAuto(
  fechaCompromiso: Date | null,
  estado: EstadoProyecto
): Semaforo {
  if (estado === "PAUSA") return "PAUSA";
  if (estado === "ENTREGADO" || estado === "CANCELADO") return "EN_TIEMPO";
  if (!fechaCompromiso) return "EN_TIEMPO";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const comp = new Date(fechaCompromiso);
  comp.setHours(0, 0, 0, 0);
  const dias = Math.ceil((comp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < -7) return "CRITICO";
  if (dias < 0) return "ATRASADO";
  if (dias <= 7) return "PRECAUCION";
  return "EN_TIEMPO";
}
