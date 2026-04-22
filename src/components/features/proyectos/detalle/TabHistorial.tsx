import { formatDateTime } from "@/lib/format";
import type { ProyectoDetalle } from "@/server/queries/proyecto-detalle";
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

type Evento = ProyectoDetalle["eventos"][0];

export function TabHistorial({ eventos }: { eventos: ProyectoDetalle["eventos"] }) {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No hay eventos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-1 max-w-2xl">
      {eventos.map((evento) => (
        <FilaEvento key={evento.id} evento={evento} />
      ))}
    </div>
  );
}

function FilaEvento({ evento }: { evento: Evento }) {
  return (
    <div className="flex gap-3 py-2.5 border-b last:border-0">
      <span className="text-base mt-0.5 w-5 flex-shrink-0">
        {iconoEvento[evento.tipo]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{evento.descripcion}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDateTime(evento.fecha)}
          {evento.usuario && ` · ${evento.usuario.name}`}
        </p>
      </div>
    </div>
  );
}
