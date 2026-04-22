import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { ActividadItem } from "@/server/queries/dashboard";
import type { TipoEvento } from "@prisma/client";

const iconoEvento: Record<TipoEvento, string> = {
  CAMBIO_ESTADO: "🔄",
  CAMBIO_MONTO: "💰",
  MUEBLE_AGREGADO: "🪑",
  MUEBLE_ELIMINADO: "🗑",
  ENTREGA_AGREGADA: "📦",
  COMPRA_REGISTRADA: "🛒",
  FACTURADO: "🧾",
  COMENTARIO: "💬",
  OTRO: "•",
};

type Props = {
  actividad: ActividadItem[];
};

export function FeedActividad({ actividad }: Props) {
  return (
    <div className="bg-white border rounded-lg p-4 h-full">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Actividad reciente</h2>
      {actividad.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sin actividad registrada.</p>
      ) : (
        <div>
          {actividad.map((item) => (
            <div key={item.id} className="flex gap-2.5 py-2 border-b last:border-0">
              <span className="text-sm mt-0.5 flex-shrink-0 w-5 text-center">
                {iconoEvento[item.tipo]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <Link
                    href={`/proyectos/${item.proyectoId}`}
                    className="text-xs font-mono text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                  >
                    {item.proyectoCodigo}
                  </Link>
                  <p className="text-sm text-gray-700 truncate">{item.descripcion}</p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                  {formatDateTime(item.fecha)}
                  {item.usuarioNombre && ` · ${item.usuarioNombre}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
