"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { X } from "lucide-react";
import Link from "next/link";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import type { KanbanCard, KanbanColumna } from "@/server/queries/dashboard";
import type { EstadoProyecto } from "@prisma/client";

const COLORES: Record<EstadoProyecto, string> = {
  COTIZACION: "#94a3b8",
  EN_ESPERA: "#fbbf24",
  EN_COMPRAS: "#f97316",
  LISTA_DE_COMPRAS: "#fb923c",
  MATERIAL_EN_PISO: "#a3e635",
  DESPIECE: "#34d399",
  FABRICACION: "#60a5fa",
  POR_EMPACAR: "#818cf8",
  ENTREGADO: "#4ade80",
  PAUSA: "#e2e8f0",
  CANCELADO: "#fca5a5",
};

type Props = {
  kanban: KanbanColumna[];
  entregadosMes: number;
  entregadosCards: KanbanCard[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-500">
          {payload[0].value} proyecto{payload[0].value !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-indigo-500 mt-0.5">Click para ver detalle</p>
      </div>
    );
  }
  return null;
};

export function GraficoEstados({ kanban, entregadosMes, entregadosCards }: Props) {
  const [selected, setSelected] = useState<EstadoProyecto | null>(null);

  const data = kanban
    .filter((c) => c.cards.length > 0)
    .map((c) => ({
      name: estadoProyectoConfig[c.estado as EstadoProyecto].label,
      value: c.cards.length,
      estado: c.estado as EstadoProyecto,
    }));

  if (entregadosMes > 0) {
    data.push({
      name: estadoProyectoConfig["ENTREGADO"].label,
      value: entregadosMes,
      estado: "ENTREGADO",
    });
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);

  function getCards(estado: EstadoProyecto): KanbanCard[] {
    if (estado === "ENTREGADO") return entregadosCards;
    return kanban.find((k) => k.estado === estado)?.cards ?? [];
  }

  if (total === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Sin proyectos activos</p>
      </div>
    );
  }

  const selectedCards = selected ? getCards(selected) : [];

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700">Proyectos por estado</h2>
        <span className="text-xs text-gray-400 tabular-nums">{total} total</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            style={{ cursor: "pointer" }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(entry: any) => {
              const estado = entry.estado as EstadoProyecto;
              setSelected((prev) => (prev === estado ? null : estado));
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.estado}
                fill={COLORES[entry.estado as EstadoProyecto]}
                stroke={selected === entry.estado ? "#1e293b" : "white"}
                strokeWidth={selected === entry.estado ? 2.5 : 2}
                opacity={selected && selected !== entry.estado ? 0.5 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Panel de detalle al hacer click */}
      {selected && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {estadoProyectoConfig[selected].label}
              <span className="ml-1.5 text-gray-400 font-normal normal-case">
                — {selectedCards.length} proyecto{selectedCards.length !== 1 ? "s" : ""}
              </span>
            </span>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {selectedCards.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">Sin proyectos en este estado</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {selectedCards.map((card) => (
                <li key={card.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-gray-50 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-indigo-700 flex-shrink-0">
                      #{card.codigo}
                    </span>
                    <span className="text-xs text-gray-600 truncate">{card.cliente}</span>
                    <span className="text-xs text-gray-400 truncate hidden sm:block">· {card.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border ${semaforoConfig[card.semaforo].badge}`}
                    >
                      {semaforoConfig[card.semaforo].label}
                    </span>
                    <Link
                      href={`/proyectos/${card.id}`}
                      className="text-[10px] text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Ver →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
