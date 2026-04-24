"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { X } from "lucide-react";
import Link from "next/link";
import type { HeatmapBucket } from "@/server/queries/dashboard";
import { semaforoConfig } from "@/lib/status-colors";

const CONFIG = [
  { key: null,           label: "Sin iniciar",  color: "#cbd5e1" },
  { key: "HABILITADO",   label: "Habilitado",   color: "#38bdf8" },
  { key: "ARMADO",       label: "Armado",       color: "#818cf8" },
  { key: "PULIDO",       label: "Pulido",       color: "#c084fc" },
  { key: "LACA",         label: "Laca",         color: "#f472b6" },
  { key: "EXTERNO",      label: "Externo",      color: "#fb923c" },
  { key: "COMPLEMENTOS", label: "Complement.",  color: "#34d399" },
  { key: "EMPAQUE",      label: "Empaque",      color: "#facc15" },
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
        <p className="text-xs text-indigo-500 mt-0.5">Click para ver detalle</p>
      </div>
    );
  }
  return null;
};

type Props = { heatmap: HeatmapBucket[] };

export function GraficoProcesos({ heatmap }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const mapaMuebles = new Map<string, HeatmapBucket["muebles"]>();
  for (const b of heatmap) {
    mapaMuebles.set(b.proceso ?? "__null__", b.muebles);
  }

  const data = CONFIG.map((c) => {
    const procesoKey = c.key === null ? "__null__" : c.key;
    const muebles = mapaMuebles.get(procesoKey) ?? [];
    return {
      label: c.label,
      procesoKey,
      value: muebles.length,
      color: c.color,
      muebles,
    };
  }).filter((d) => d.value > 0);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  const selectedData = selected ? data.find((d) => d.procesoKey === selected) : null;

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
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
          style={{ cursor: "pointer" }}
        >
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
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(entry: any) => {
              setSelected((prev) => (prev === entry.procesoKey ? null : entry.procesoKey));
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                opacity={selected && selected !== entry.procesoKey ? 0.4 : 1}
                stroke={selected === entry.procesoKey ? "#1e293b" : "transparent"}
                strokeWidth={selected === entry.procesoKey ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {selectedData && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {selectedData.label}
              <span className="ml-1.5 text-gray-400 font-normal normal-case">
                — {selectedData.muebles.length} mueble{selectedData.muebles.length !== 1 ? "s" : ""}
              </span>
            </span>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {selectedData.muebles.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-indigo-700 flex-shrink-0">
                    #{m.proyectoCodigo}
                  </span>
                  <span className="text-xs text-gray-600 truncate">{m.clienteNombre}</span>
                  <span className="text-xs text-gray-400 truncate hidden sm:block">· {m.nombre}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${semaforoConfig[m.semaforo].badge}`}
                  >
                    {semaforoConfig[m.semaforo].label}
                  </span>
                  <Link
                    href={`/proyectos/${m.proyectoId}`}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Ver →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
