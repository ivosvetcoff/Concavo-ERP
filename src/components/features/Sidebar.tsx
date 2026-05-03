"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  CalendarDays,
  UserCheck,
  FileText,
  ClipboardList,
  Activity,
  HeartPulse,
} from "lucide-react";


const navItems = [
  // Operación
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: FolderOpen },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produccion", label: "Producción", icon: ClipboardList },
  { href: "/gantt", label: "Gantt", icon: CalendarDays },
  { href: "/ocupacion", label: "Ocupación", icon: Activity },
  // Compras y egresos
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/insumos", label: "Insumos", icon: Package },
  { href: "/gastos", label: "Gastos fijos", icon: Receipt },
  // Financiero
  { href: "/cierre", label: "Cierre mensual", icon: BarChart3 },
  // Personas
  { href: "/empleados", label: "Empleados", icon: UserCheck },
  { href: "/nomina", label: "Nómina", icon: FileText },
  { href: "/rrhh", label: "Recursos Humanos", icon: HeartPulse },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">Concavo</span>
        <span className="ml-1 text-xs text-gray-400 font-normal">ERP</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            )
          }
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="px-4 py-4 border-t border-gray-200">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: { avatarBox: "h-8 w-8" },
          }}
        />
      </div>
    </aside>
  );
}
