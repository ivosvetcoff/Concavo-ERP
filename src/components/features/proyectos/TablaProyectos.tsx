"use client";

import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProyectoRow } from "@/server/queries/proyectos";
import { getColumnasProyectos } from "./ColumnasProyectos";
import { estadoProyectoConfig, semaforoConfig } from "@/lib/status-colors";
import type { EstadoProyecto, Semaforo } from "@prisma/client";

type Props = {
  data: ProyectoRow[];
  isOwner: boolean;
};

export function TablaProyectos({ data, isOwner }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const columns = getColumnasProyectos(isOwner);

  const filteredData = useMemo(() => {
    if (!dateRange?.from) return data;
    return data.filter((d) => {
      if (!d.fechaCompromiso) return false;
      const dDate = new Date(d.fechaCompromiso);
      
      const isAfterStart = dDate >= startOfDay(dateRange.from!);
      const isBeforeEnd = dateRange.to ? dDate <= endOfDay(dateRange.to) : true;
      
      return isAfterStart && isBeforeEnd;
    });
  }, [data, dateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Buscar por código, cliente, nombre, P.O.…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm h-9"
        />
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal h-9",
                    !dateRange && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                    {format(dateRange.to, "LLL dd, y", { locale: es })}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y", { locale: es })
                )
              ) : (
                <span>Filtrar por fecha compromiso</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          {dateRange?.from && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 text-gray-500 hover:text-gray-900" 
              onClick={() => setDateRange(undefined)}
              title="Limpiar fechas"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select
          onValueChange={(v) =>
            table
              .getColumn("estado")
              ?.setFilterValue(v === "TODOS" ? undefined : v)
          }
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {(Object.keys(estadoProyectoConfig) as EstadoProyecto[]).map(
              (estado) => (
                <SelectItem key={estado} value={estado}>
                  {estadoProyectoConfig[estado].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) =>
            table
              .getColumn("semaforo")
              ?.setFilterValue(v === "TODOS" ? undefined : v)
          }
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="En tiempo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {(Object.keys(semaforoConfig) as Semaforo[]).map((s) => (
              <SelectItem key={s} value={s}>
                {semaforoConfig[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} proyecto
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-400"
                >
                  Sin proyectos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
