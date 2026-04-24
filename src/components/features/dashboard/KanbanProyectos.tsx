"use client";

import Link from "next/link";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate } from "@/lib/format";
import type { KanbanColumna } from "@/server/queries/dashboard";
import type { EstadoProyecto } from "@prisma/client";

const BORDER_COLOR: Partial<Record<EstadoProyecto, string>> = {
  FABRICACION:    "border-l-blue-400",
  POR_EMPACAR:   "border-l-indigo-400",
  EN_COMPRAS:    "border-l-orange-400",
  LISTA_DE_COMPRAS: "border-l-amber-400",
  MATERIAL_EN_PISO: "border-l-lime-400",
  DESPIECE:      "border-l-emerald-400",
  EN_ESPERA:     "border-l-yellow-400",
  COTIZACION:    "border-l-slate-300",
  PAUSA:         "border-l-slate-300",
};

type Props = { kanban: KanbanColumna[] };

export function KanbanProyectos({ kanban }: Props) {
  const conProyectos = kanban.filter((c) => c.cards.length > 0);

  if (conProyectos.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Estado de proyectos</h2>
        <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-sm text-gray-400">Sin proyectos activos</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Estado de proyectos</h2>
        <span className="text-xs text-gray-400 tabular-nums">
          {conProyectos.reduce((acc, c) => acc + c.cards.length, 0)} proyectos ·{" "}
          {conProyectos.length} estado{conProyectos.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 min-w-max">
          {conProyectos.map((columna) => (
            <Columna key={columna.estado} columna={columna} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Columna({ columna }: { columna: KanbanColumna }) {
  const config = estadoProyectoConfig[columna.estado as EstadoProyecto];

  return (
    <div className="w-52 flex-shrink-0">
      <div className={`flex items-center justify-between mb-2 px-1 py-1.5 rounded-lg ${config.badge} bg-opacity-60`}>
        <span className="text-xs font-bold truncate">{config.label}</span>
        <span className="text-xs tabular-nums font-semibold ml-1 flex-shrink-0">
          {columna.cards.length}
        </span>
      </div>
      <div className="space-y-2">
        {columna.cards.map((card) => (
          <Card key={card.id} card={card} estado={columna.estado as EstadoProyecto} />
        ))}
      </div>
    </div>
  );
}

function Card({
  card,
  estado,
}: {
  card: KanbanColumna["cards"][0];
  estado: EstadoProyecto;
}) {
  const sem = semaforoConfig[card.semaforo];
  const borderColor = BORDER_COLOR[estado] ?? "border-l-gray-300";

  return (
    <Link
      href={`/proyectos/${card.id}`}
      className={`block bg-white border border-l-4 ${borderColor} rounded-lg p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="font-mono text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
          #{card.codigo}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sem.bg} ${sem.color}`}
        >
          {sem.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
        {card.nombre}
      </p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{card.cliente}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400">
          {card.qtyItems} ítem{card.qtyItems !== 1 ? "s" : ""}
        </span>
        {card.fechaCompromiso && (
          <span className="text-[10px] text-gray-400 tabular-nums">
            {formatDate(card.fechaCompromiso)}
          </span>
        )}
      </div>
    </Link>
  );
}
