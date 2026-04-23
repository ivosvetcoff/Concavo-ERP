"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Users,
  UserCheck,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Package,
  Receipt,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { buscarGlobal, type ResultadoBusqueda } from "@/server/actions/busqueda";

const ESPECIALIDAD_LABELS: Record<string, string> = {
  HABILITADOR: "Habilitador",
  ARMADOR: "Armador",
  PULIDOR: "Pulidor",
  LAQUEADOR: "Laqueador",
  ADMINISTRATIVO: "Administrativo",
};

const ACCIONES_RAPIDAS = [
  { label: "Proyectos", href: "/proyectos", icon: FolderOpen },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Compras", href: "/compras", icon: ShoppingCart },
  { label: "Producción", href: "/produccion", icon: ClipboardList },
  { label: "Insumos", href: "/insumos", icon: Package },
  { label: "Gastos fijos", href: "/gastos", icon: Receipt },
  { label: "Cierre mensual", href: "/cierre", icon: BarChart3 },
  { label: "Empleados", href: "/empleados", icon: UserCheck },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda>({
    proyectos: [],
    clientes: [],
    empleados: [],
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const buscar = useCallback((q: string) => {
    setQuery(q);
    startTransition(async () => {
      const r = await buscarGlobal(q);
      setResultados(r);
    });
  }, []);

  function navegar(href: string) {
    setOpen(false);
    setQuery("");
    setResultados({ proyectos: [], clientes: [], empleados: [] });
    router.push(href);
  }

  const hayResultados =
    resultados.proyectos.length > 0 ||
    resultados.clientes.length > 0 ||
    resultados.empleados.length > 0;

  const sinResultados = query.length >= 2 && !isPending && !hayResultados;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Búsqueda global">
      <CommandInput
        placeholder="Buscar proyectos, clientes, empleados…"
        value={query}
        onValueChange={buscar}
      />
      <CommandList>
        {isPending && (
          <div className="flex items-center justify-center py-6 text-sm text-gray-400 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando…
          </div>
        )}

        {!isPending && sinResultados && (
          <CommandEmpty>Sin resultados para &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Proyectos */}
        {!isPending && resultados.proyectos.length > 0 && (
          <CommandGroup heading="Proyectos">
            {resultados.proyectos.map((p) => (
              <CommandItem
                key={p.id}
                value={`proyecto-${p.id}`}
                onSelect={() => navegar(`/proyectos/${p.id}`)}
                className="cursor-pointer"
              >
                <FolderOpen className="mr-2 h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span className="font-mono text-indigo-600 text-xs mr-2">
                  #{p.codigo}
                </span>
                <span className="truncate">{p.nombre}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {p.cliente}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isPending && resultados.proyectos.length > 0 && resultados.clientes.length > 0 && (
          <CommandSeparator />
        )}

        {/* Clientes */}
        {!isPending && resultados.clientes.length > 0 && (
          <CommandGroup heading="Clientes">
            {resultados.clientes.map((c) => (
              <CommandItem
                key={c.id}
                value={`cliente-${c.id}`}
                onSelect={() => navegar(`/clientes`)}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{c.nombre}</span>
                {c.rfc && (
                  <span className="ml-2 font-mono text-xs text-gray-400">
                    {c.rfc}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isPending &&
          (resultados.proyectos.length > 0 || resultados.clientes.length > 0) &&
          resultados.empleados.length > 0 && <CommandSeparator />}

        {/* Empleados */}
        {!isPending && resultados.empleados.length > 0 && (
          <CommandGroup heading="Empleados">
            {resultados.empleados.map((e) => (
              <CommandItem
                key={e.id}
                value={`empleado-${e.id}`}
                onSelect={() => navegar(`/empleados`)}
                className="cursor-pointer"
              >
                <UserCheck className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{[e.nombre, e.apellido].filter(Boolean).join(" ")}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {ESPECIALIDAD_LABELS[e.especialidad] ?? e.especialidad}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Acciones rápidas (cuando no hay búsqueda) */}
        {query.length < 2 && (
          <CommandGroup heading="Acciones rápidas">
            {ACCIONES_RAPIDAS.map(({ label, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={label}
                onSelect={() => navegar(href)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4 text-gray-400" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      <div className="border-t px-3 py-2 text-[11px] text-gray-400 flex items-center gap-3">
        <span>
          <kbd className="bg-gray-100 rounded px-1 py-0.5 font-mono">↑↓</kbd>{" "}
          navegar
        </span>
        <span>
          <kbd className="bg-gray-100 rounded px-1 py-0.5 font-mono">↵</kbd>{" "}
          abrir
        </span>
        <span>
          <kbd className="bg-gray-100 rounded px-1 py-0.5 font-mono">Esc</kbd>{" "}
          cerrar
        </span>
      </div>
    </CommandDialog>
  );
}
