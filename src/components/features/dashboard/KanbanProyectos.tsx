import Link from "next/link";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate } from "@/lib/format";
import type { KanbanColumna } from "@/server/queries/dashboard";
import type { EstadoProyecto } from "@prisma/client";

type Props = {
  kanban: KanbanColumna[];
};

export function KanbanProyectos({ kanban }: Props) {
  const conProyectos = kanban.filter((c) => c.cards.length > 0);
  const sinProyectos = kanban.filter((c) => c.cards.length === 0);
  const ordenado = [...conProyectos, ...sinProyectos];

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Proyectos por estado
      </h2>
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 min-w-max">
          {ordenado.map((columna) => (
            <Columna key={columna.estado} columna={columna} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Columna({ columna }: { columna: KanbanColumna }) {
  const config = estadoProyectoConfig[columna.estado as EstadoProyecto];
  const isEmpty = columna.cards.length === 0;

  return (
    <div className={`w-48 flex-shrink-0 transition-opacity ${isEmpty ? "opacity-35" : ""}`}>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs font-semibold text-gray-600 truncate">{config.label}</span>
        {columna.cards.length > 0 && (
          <span className="text-xs tabular-nums text-gray-400 ml-1 flex-shrink-0">
            {columna.cards.length}
          </span>
        )}
      </div>
      <div className="space-y-2 min-h-[2rem]">
        {columna.cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
        {isEmpty && (
          <div className="h-14 border-2 border-dashed border-gray-200 rounded-md" />
        )}
      </div>
    </div>
  );
}

function Card({ card }: { card: KanbanColumna["cards"][0] }) {
  const sem = semaforoConfig[card.semaforo];

  return (
    <Link
      href={`/proyectos/${card.id}`}
      className="block bg-white border rounded-md p-2.5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-mono text-xs text-gray-400">{card.codigo}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sem.bg} ${sem.color}`}>
          {sem.label}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-800 truncate leading-snug">{card.nombre}</p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{card.cliente}</p>
      {card.fechaCompromiso && (
        <p className="text-xs text-gray-400 mt-1 tabular-nums">
          {formatDate(card.fechaCompromiso)}
        </p>
      )}
    </Link>
  );
}
