"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { estadoProyectoConfig } from "@/lib/status-colors";
import type { KanbanColumna } from "@/server/queries/dashboard";
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
      </div>
    );
  }
  return null;
};

export function GraficoEstados({ kanban, entregadosMes }: Props) {
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

  if (total === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Sin proyectos activos</p>
      </div>
    );
  }

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
          >
            {data.map((entry) => (
              <Cell
                key={entry.estado}
                fill={COLORES[entry.estado as EstadoProyecto]}
                stroke="white"
                strokeWidth={2}
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
    </div>
  );
}
