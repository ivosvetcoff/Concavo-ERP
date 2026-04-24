import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, User, FileText } from "lucide-react";
import { obtenerClienteDetalle } from "@/server/queries/clientes";
import { isOwner } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate, formatMXN } from "@/lib/format";
import Decimal from "decimal.js";
import { ClienteSheet } from "@/components/features/clientes/ClienteSheet";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await isOwner();
  const cliente = await obtenerClienteDetalle(id, owner);

  if (!cliente) notFound();

  const proyectosActivos = cliente.proyectos.filter(
    (p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO"
  );
  const proyectosHistorico = cliente.proyectos.filter(
    (p) => p.estado === "ENTREGADO" || p.estado === "CANCELADO"
  );

  // Resumen financiero (owner only)
  const totalCotizado = owner
    ? cliente.proyectos.reduce(
        (s, p) => s.plus(new Decimal(p.montoVendido ?? "0")),
        new Decimal(0)
      )
    : null;
  const totalCobrado = owner
    ? cliente.proyectos.reduce(
        (s, p) =>
          s
            .plus(new Decimal(p.anticiposTotal ?? "0"))
            .plus(new Decimal(p.pagosTotal ?? "0")),
        new Decimal(0)
      )
    : null;
  const totalPendiente =
    totalCotizado && totalCobrado
      ? totalCotizado.minus(totalCobrado)
      : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Clientes
      </Link>

      {/* Header */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{cliente.nombre}</h1>
            {cliente.razonSocial && (
              <p className="text-sm text-gray-400 mt-0.5">{cliente.razonSocial}</p>
            )}
          </div>
          <ClienteSheet mode="editar" cliente={cliente} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {cliente.rfc && (
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-mono">{cliente.rfc}</span>
            </span>
          )}
          {cliente.contacto && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {cliente.contacto}
            </span>
          )}
          {cliente.telefono && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {cliente.telefono}
            </span>
          )}
          {cliente.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {cliente.email}
            </span>
          )}
        </div>
        {cliente.notas && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-md px-3 py-2">
            {cliente.notas}
          </p>
        )}
      </div>

      {/* Resumen financiero (OWNER) */}
      {owner && totalCotizado && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total cotizado</p>
            <p className="text-xl font-semibold text-gray-900">{formatMXN(totalCotizado.toFixed(2))}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total cobrado</p>
            <p className="text-xl font-semibold text-green-700">{formatMXN(totalCobrado!.toFixed(2))}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendiente por cobrar</p>
            <p className={`text-xl font-semibold ${totalPendiente!.gt(0) ? "text-amber-600" : "text-gray-400"}`}>
              {formatMXN(totalPendiente!.toFixed(2))}
            </p>
          </div>
        </div>
      )}

      {/* Proyectos activos */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Proyectos activos
          <span className="ml-2 text-gray-400 font-normal normal-case">
            {proyectosActivos.length} proyecto{proyectosActivos.length !== 1 ? "s" : ""}
          </span>
        </h2>
        {proyectosActivos.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-400">
            Sin proyectos activos
          </div>
        ) : (
          <ProyectosTable proyectos={proyectosActivos} owner={owner} />
        )}
      </section>

      {/* Histórico */}
      {proyectosHistorico.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Histórico
            <span className="ml-2 text-gray-400 font-normal normal-case">
              {proyectosHistorico.length} proyecto{proyectosHistorico.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <ProyectosTable proyectos={proyectosHistorico} owner={owner} dimmed />
        </section>
      )}
    </div>
  );
}

// ─── Sub-componente tabla ─────────────────────────────────────────────────────

import type { ClienteDetalleProyecto } from "@/server/queries/clientes";

function ProyectosTable({
  proyectos,
  owner,
  dimmed = false,
}: {
  proyectos: ClienteDetalleProyecto[];
  owner: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${dimmed ? "opacity-75" : ""}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Semáforo</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Compromiso</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Entrega</th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Piezas</th>
            {owner && (
              <>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Monto</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Cobrado</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Pendiente</th>
              </>
            )}
            <th className="px-4 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {proyectos.map((p) => {
            const cobrado = owner
              ? new Decimal(p.anticiposTotal ?? "0").plus(new Decimal(p.pagosTotal ?? "0"))
              : null;
            const pendiente =
              owner && p.montoVendido
                ? new Decimal(p.montoVendido).minus(cobrado!)
                : null;

            return (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/proyectos/${p.id}`}
                    className="font-mono font-semibold text-indigo-700 hover:underline"
                  >
                    {p.codigo}
                  </Link>
                </td>
                <td className="px-4 py-2.5 max-w-[200px]">
                  <span className="truncate block text-gray-700" title={p.nombre}>
                    {p.nombre}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={estadoProyectoConfig[p.estado].badge}>
                    {estadoProyectoConfig[p.estado].label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={semaforoConfig[p.semaforo].badge}>
                    {semaforoConfig[p.semaforo].label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-gray-600 text-xs">
                  {formatDate(p.fechaCompromiso)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-gray-600 text-xs">
                  {formatDate(p.fechaEntrega)}
                </td>
                <td className="px-4 py-2.5 text-center text-gray-700">
                  {p.qtyItems}
                </td>
                {owner && (
                  <>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                      {formatMXN(p.montoVendido)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-700">
                      {formatMXN(cobrado!.toFixed(2))}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className={pendiente && pendiente.gt(0) ? "text-amber-600" : "text-gray-400"}>
                        {formatMXN(pendiente?.toFixed(2) ?? "0")}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-4 py-2.5">
                  <Link
                    href={`/proyectos/${p.id}`}
                    className="text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
