"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProyectoRow } from "@/server/queries/proyectos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate, formatMXN } from "@/lib/format";
import { ArrowUpDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function getColumnasProyectos(isOwner: boolean): ColumnDef<ProyectoRow>[] {
  return [
    {
      accessorKey: "codigo",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          # PROYECTO
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/proyectos/${row.original.id}`}
          className="font-mono font-semibold text-indigo-700 hover:underline"
        >
          {row.original.codigo}
        </Link>
      ),
    },
    {
      accessorKey: "cliente",
      header: "CLIENTE",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.cliente}</span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "NOMBRE",
      cell: ({ row }) => (
        <span className="text-gray-700 max-w-[200px] truncate block" title={row.original.nombre}>
          {row.original.nombre}
        </span>
      ),
    },
    {
      accessorKey: "qtyItems",
      header: "QTY",
      cell: ({ row }) => (
        <span className="text-center block">{row.original.qtyItems}</span>
      ),
    },
    {
      accessorKey: "po",
      header: "P.O.",
      cell: ({ row }) => (
        <span className="text-gray-500 text-sm">{row.original.po ?? "—"}</span>
      ),
    },
    {
      accessorKey: "fechaPO",
      header: "FECHA P.O.",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatDate(row.original.fechaPO)}
        </span>
      ),
    },
    {
      accessorKey: "fechaCompromiso",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          COMPROMISO
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatDate(row.original.fechaCompromiso)}
        </span>
      ),
    },
    {
      accessorKey: "fechaEntrega",
      header: "ENTREGA",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatDate(row.original.fechaEntrega)}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "ESTATUS",
      cell: ({ row }) => {
        const cfg = estadoProyectoConfig[row.original.estado];
        return (
          <Badge variant="outline" className={cfg.badge}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "semaforo",
      header: "EN TIEMPO",
      cell: ({ row }) => {
        const cfg = semaforoConfig[row.original.semaforo];
        return (
          <Badge variant="outline" className={cfg.badge}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tieneHC",
      header: "HC",
      cell: ({ row }) =>
        row.original.tieneHC ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <span className="text-gray-300 text-center block">—</span>
        ),
    },
    ...(isOwner
      ? [
          {
            accessorKey: "montoVendido" as keyof ProyectoRow,
            header: "MONTO",
            cell: ({ row }: { row: { original: ProyectoRow } }) => (
              <span className="tabular-nums font-medium">
                {formatMXN(row.original.montoVendido)}
              </span>
            ),
          },
          {
            accessorKey: "facturado" as keyof ProyectoRow,
            header: "CFDI",
            cell: ({ row }: { row: { original: ProyectoRow } }) =>
              row.original.facturado ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  Facturado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 text-xs">
                  Efectivo
                </Badge>
              ),
          },
        ]
      : []),
    {
      accessorKey: "comentarios",
      header: "COMENTARIOS",
      cell: ({ row }) => (
        <span
          className="text-gray-500 text-sm max-w-[200px] truncate block"
          title={row.original.comentarios ?? ""}
        >
          {row.original.comentarios ?? ""}
        </span>
      ),
    },
  ];
}
