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
  BookOpen,
  BarChart3,
  CalendarDays,
  UserCheck,
  FileText,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: FolderOpen },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/catalogo", label: "Catálogo", icon: BookOpen },
  { href: "/cierre", label: "Cierre mensual", icon: BarChart3 },
  // Fase 2
  { href: "/gantt", label: "Gantt", icon: CalendarDays, fase2: true },
  { href: "/empleados", label: "Empleados", icon: UserCheck, fase2: true },
  { href: "/nomina", label: "Nómina", icon: FileText, fase2: true },
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
        {navItems.map(({ href, label, icon: Icon, fase2 }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                fase2 && "opacity-50"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
              {fase2 && (
                <span className="ml-auto text-[10px] text-gray-400">F2</span>
              )}
            </Link>
          );
        })}
      </nav>

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
