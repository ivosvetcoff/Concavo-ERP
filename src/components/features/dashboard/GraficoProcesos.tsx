"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { HeatmapBucket } from "@/server/queries/dashboard";

const CONFIG = [
  { key: null,          label: "Sin iniciar",  color: "#cbd5e1" },
  { key: "HABILITADO",  label: "Habilitado",   color: "#38bdf8" },
  { key: "ARMADO",      label: "Armado",       color: "#818cf8" },
  { key: "PULIDO",      label: "Pulido",       color: "#c084fc" },
  { key: "LACA",        label: "Laca",         color: "#f472b6" },
  { key: "EXTERNO",     label: "Externo",      color: "#fb923c" },
  { key: "COMPLEMENTOS",label: "Complement.",  color: "#34d399" },
  { key: "EMPAQUE",     label: "Empaque",      color: "#facc15" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-gray-500">
          {payload[0].value} mueble{payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

type Props = { heatmap: HeatmapBucket[] };

export function GraficoProcesos({ heatmap }: Props) {
  const mapaCount = new Map<string, number>();
  for (const b of heatmap) {
    mapaCount.set(b.proceso ?? "__null__", b.count);
  }

  const data = CONFIG.map((c) => ({
    label: c.label,
    value: mapaCount.get(c.key === null ? "__null__" : c.key) ?? 0,
    color: c.color,
  })).filter((d) => d.value > 0);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Sin muebles en producción</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700">Muebles por proceso</h2>
        <span className="text-xs text-gray-400 tabular-nums">{total} en producción</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
