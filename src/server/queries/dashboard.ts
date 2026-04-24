import { db } from "@/lib/db";
import Decimal from "decimal.js";
import { startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { EstadoProyecto, Semaforo, TipoEvento } from "@prisma/client";

const TIMEZONE = "America/Mexico_City";

export const ESTADOS_KANBAN: EstadoProyecto[] = [
  "COTIZACION",
  "EN_ESPERA",
  "EN_COMPRAS",
  "LISTA_DE_COMPRAS",
  "MATERIAL_EN_PISO",
  "DESPIECE",
  "FABRICACION",
  "POR_EMPACAR",
  "PAUSA",
];

export type KanbanCard = {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  semaforo: Semaforo;
  fechaCompromiso: Date | null;
  qtyItems: number;
};

export type KanbanColumna = {
  estado: EstadoProyecto;
  cards: KanbanCard[];
};

export type HeatmapMuebleCard = {
  id: string;
  nombre: string;
  proyectoId: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  clienteNombre: string;
  semaforo: Semaforo;
};

export type HeatmapBucket = {
  proceso: string | null;
  count: number;
  muebles: HeatmapMuebleCard[];
};

export type ActividadItem = {
  id: string;
  tipo: TipoEvento;
  descripcion: string;
  fecha: Date;
  proyectoId: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  usuarioNombre: string | null;
};

export type DashboardKPIs = {
  proyectosActivos: number;
  entregadosMes: number;
  comprasMes: number;
  totalComprasMes: string;
  ingresosFacturadosMes: string;
  ingresosEfectivoMes: string;
  ingresosTotalesMes: string;
};

export type AlertaItem = {
  id: string;
  codigo: string;
  nombre: string;
  clienteNombre: string;
  semaforo: Semaforo;
  fechaCompromiso: Date | null;
};

export type DashboardAlertas = {
  criticos: AlertaItem[];
  atrasados: AlertaItem[];
  comprasSinAsignar: number;
};

export async function obtenerDashboard(mes?: number, anio?: number): Promise<{
  kpis: DashboardKPIs;
  kanban: KanbanColumna[];
  entregadosCards: KanbanCard[];
  heatmap: HeatmapBucket[];
  actividad: ActividadItem[];
  alertas: DashboardAlertas;
}> {
  const ahora = toZonedTime(new Date(), TIMEZONE);
  const mesRef = mes ?? (ahora.getMonth() + 1);
  const anioRef = anio ?? ahora.getFullYear();
  const refDate = new Date(anioRef, mesRef - 1, 15);
  const inicioMes = startOfMonth(refDate);
  const finMes = endOfMonth(refDate);

  const [
    proyectosActivosCount,
    proyectosEntregadosMes,
    comprasMesCount,
    comprasMesSum,
    kanbanProyectos,
    mueblesPorProceso,
    actividadReciente,
    proyectosAlerta,
    comprasSinAsignarCount,
  ] = await Promise.all([
    db.proyecto.count({
      where: { estado: { in: ESTADOS_KANBAN } },
    }),
    db.proyecto.findMany({
      where: {
        estado: "ENTREGADO",
        fechaEntrega: { gte: inicioMes, lte: finMes },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        semaforo: true,
        fechaCompromiso: true,
        qtyItems: true,
        montoVendido: true,
        facturado: true,
        cliente: { select: { nombre: true } },
      },
    }),
    db.compra.count({
      where: { fecha: { gte: inicioMes, lte: finMes } },
    }),
    db.compra.aggregate({
      where: { fecha: { gte: inicioMes, lte: finMes } },
      _sum: { total: true },
    }),
    db.proyecto.findMany({
      where: { estado: { in: ESTADOS_KANBAN } },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        estado: true,
        semaforo: true,
        fechaCompromiso: true,
        qtyItems: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: [{ fechaCompromiso: "asc" }],
    }),
    db.mueble.findMany({
      where: { proyecto: { estado: { in: ESTADOS_KANBAN } } },
      select: {
        id: true,
        nombre: true,
        procesoActual: true,
        proyecto: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            semaforo: true,
            cliente: { select: { nombre: true } },
          },
        },
      },
      orderBy: { proyecto: { codigo: "asc" } },
    }),
    db.eventoProyecto.findMany({
      take: 20,
      orderBy: { fecha: "desc" },
      select: {
        id: true,
        tipo: true,
        descripcion: true,
        fecha: true,
        proyecto: { select: { id: true, codigo: true, nombre: true } },
        usuario: { select: { name: true } },
      },
    }),
    db.proyecto.findMany({
      where: {
        semaforo: { in: ["CRITICO", "ATRASADO"] },
        estado: { notIn: ["ENTREGADO", "CANCELADO", "PAUSA"] },
      },
      orderBy: [{ semaforo: "asc" }, { fechaCompromiso: "asc" }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        semaforo: true,
        fechaCompromiso: true,
        cliente: { select: { nombre: true } },
      },
    }),
    db.compra.count({ where: { proyectoId: null } }),
  ]);

  // KPIs — ingresos (Decimal para evitar pérdida de precisión)
  const ingresosFacturados = proyectosEntregadosMes
    .filter((p) => p.facturado)
    .reduce((acc, p) => acc.plus(new Decimal(p.montoVendido.toString())), new Decimal(0));
  const ingresosEfectivo = proyectosEntregadosMes
    .filter((p) => !p.facturado)
    .reduce((acc, p) => acc.plus(new Decimal(p.montoVendido.toString())), new Decimal(0));

  // Kanban — group by estado
  const mapaEstado = new Map<EstadoProyecto, KanbanCard[]>();
  for (const estado of ESTADOS_KANBAN) {
    mapaEstado.set(estado, []);
  }
  for (const p of kanbanProyectos) {
    const lista = mapaEstado.get(p.estado as EstadoProyecto);
    if (lista) {
      lista.push({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        cliente: p.cliente.nombre,
        semaforo: p.semaforo,
        fechaCompromiso: p.fechaCompromiso,
        qtyItems: p.qtyItems,
      });
    }
  }
  const kanban: KanbanColumna[] = ESTADOS_KANBAN.map((estado) => ({
    estado,
    cards: mapaEstado.get(estado) ?? [],
  }));

  // Heatmap
  const mueblesPorProcesoMap = new Map<string, HeatmapMuebleCard[]>();
  for (const m of mueblesPorProceso) {
    const key = m.procesoActual ?? "__null__";
    if (!mueblesPorProcesoMap.has(key)) mueblesPorProcesoMap.set(key, []);
    mueblesPorProcesoMap.get(key)!.push({
      id: m.id,
      nombre: m.nombre,
      proyectoId: m.proyecto.id,
      proyectoCodigo: m.proyecto.codigo,
      proyectoNombre: m.proyecto.nombre,
      clienteNombre: m.proyecto.cliente.nombre,
      semaforo: m.proyecto.semaforo,
    });
  }
  const heatmap: HeatmapBucket[] = [...mueblesPorProcesoMap.entries()].map(([key, muebles]) => ({
    proceso: key === "__null__" ? null : key,
    count: muebles.length,
    muebles,
  }));

  // Alertas
  const alertaItems = (p: typeof proyectosAlerta[0]): AlertaItem => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    clienteNombre: p.cliente.nombre,
    semaforo: p.semaforo,
    fechaCompromiso: p.fechaCompromiso,
  });
  const alertas: DashboardAlertas = {
    criticos: proyectosAlerta.filter((p) => p.semaforo === "CRITICO").map(alertaItems),
    atrasados: proyectosAlerta.filter((p) => p.semaforo === "ATRASADO").map(alertaItems),
    comprasSinAsignar: comprasSinAsignarCount,
  };

  // Actividad
  const actividad: ActividadItem[] = actividadReciente.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    descripcion: e.descripcion,
    fecha: e.fecha,
    proyectoId: e.proyecto.id,
    proyectoCodigo: e.proyecto.codigo,
    proyectoNombre: e.proyecto.nombre,
    usuarioNombre: e.usuario?.name ?? null,
  }));

  const entregadosCards: KanbanCard[] = proyectosEntregadosMes.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    cliente: p.cliente.nombre,
    semaforo: p.semaforo,
    fechaCompromiso: p.fechaCompromiso,
    qtyItems: p.qtyItems,
  }));

  return {
    kpis: {
      proyectosActivos: proyectosActivosCount,
      entregadosMes: proyectosEntregadosMes.length,
      comprasMes: comprasMesCount,
      totalComprasMes: comprasMesSum._sum.total?.toString() ?? "0",
      ingresosFacturadosMes: ingresosFacturados.toFixed(2),
      ingresosEfectivoMes: ingresosEfectivo.toFixed(2),
      ingresosTotalesMes: ingresosFacturados.plus(ingresosEfectivo).toFixed(2),
    },
    kanban,
    entregadosCards,
    heatmap,
    actividad,
    alertas,
  };
}
