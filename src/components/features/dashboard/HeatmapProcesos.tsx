import type { HeatmapBucket } from "@/server/queries/dashboard";

const BUCKETS = [
  {
    key: null,
    label: "Sin iniciar",
    barClass: "bg-gray-300",
    textClass: "text-gray-500",
  },
  {
    key: "HABILITADO",
    label: "Habilitado",
    barClass: "bg-sky-300",
    textClass: "text-sky-700",
  },
  {
    key: "ARMADO",
    label: "Armado",
    barClass: "bg-indigo-300",
    textClass: "text-indigo-700",
  },
  {
    key: "PULIDO",
    label: "Pulido",
    barClass: "bg-purple-300",
    textClass: "text-purple-700",
  },
  {
    key: "LACA",
    label: "Laca",
    barClass: "bg-pink-300",
    textClass: "text-pink-700",
  },
] as const;

type Props = {
  heatmap: HeatmapBucket[];
};

export function HeatmapProcesos({ heatmap }: Props) {
  const mapaCount = new Map<string, number>();
  for (const b of heatmap) {
    mapaCount.set(b.proceso ?? "__null__", b.count);
  }

  const total = BUCKETS.reduce((acc, b) => {
    const key = b.key === null ? "__null__" : b.key;
    return acc + (mapaCount.get(key) ?? 0);
  }, 0);

  return (
    <div className="bg-white border rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Muebles por proceso</h2>
        <span className="text-xs text-gray-400 tabular-nums">{total} en producción</span>
      </div>
      <div className="space-y-3">
        {BUCKETS.map((b) => {
          const key = b.key === null ? "__null__" : b.key;
          const count = mapaCount.get(key) ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 text-xs text-gray-600 flex-shrink-0 text-right leading-none">
                {b.label}
              </span>
              <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                {pct > 0 && (
                  <div
                    className={`h-4 rounded ${b.barClass} transition-all`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium tabular-nums w-5 text-right ${
                  count > 0 ? b.textClass : "text-gray-300"
                }`}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
