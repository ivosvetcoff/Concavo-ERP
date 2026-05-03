"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProyectoRow } from "@/server/queries/proyectos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import { formatDate, formatMXN } from "@/lib/format";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { MontoPrivado } from "@/components/privacy/MontoPrivado";

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
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          CLIENTE <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.cliente}</span>
      ),
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          NOMBRE (P.O.) <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const { nombre, po } = row.original;
        const label = po ? `${nombre} (${po})` : nombre;
        return (
          <span className="text-gray-700 max-w-[240px] truncate block" title={label}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "qtyItems",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          QTY
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-center block">{row.original.qtyItems}</span>
      ),
    },
    {
      accessorKey: "fechaPO",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          FECHA P.O. <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
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
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ENTREGA <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatDate(row.original.fechaEntrega)}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ESTATUS <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
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
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          EN TIEMPO <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const cfg = semaforoConfig[row.original.semaforo];
        return (
          <Badge variant="outline" className={cfg.badge}>
            {cfg.label}
          </Badge>
        );
      },
    },
    ...(isOwner
      ? [
          {
            accessorKey: "montoVendido" as keyof ProyectoRow,
            header: ({ column }: { column: import("@tanstack/react-table").Column<ProyectoRow> }) => (
              <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                MONTO <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            ),
            cell: ({ row }: { row: { original: ProyectoRow } }) => (
              <MontoPrivado>
                <span className="tabular-nums font-medium">
                  {formatMXN(row.original.montoVendido)}
                </span>
              </MontoPrivado>
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
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          COMENTARIOS <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
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
