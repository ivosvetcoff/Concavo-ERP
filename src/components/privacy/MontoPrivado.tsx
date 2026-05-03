"use client";

import { usePrivacidadMontos } from "@/lib/privacy";
import type { ReactNode } from "react";

/**
 * Envuelve cualquier monto monetario.
 * Cuando el modo privacidad está activo, reemplaza el contenido con $·····
 * para evitar que personas ajenas vean los números.
 *
 * No es seguridad real — para acceso restringido usar el rol ENCARGADO.
 */
export function MontoPrivado({ children }: { children: ReactNode }) {
  const { privacidad } = usePrivacidadMontos();

  if (privacidad) {
    return (
      <span
        className="select-none text-gray-400 font-mono tracking-widest"
        aria-hidden="true"
      >
        $·····
      </span>
    );
  }

  return <>{children}</>;
}
