"use client";

// Modo privacidad — oculta montos de miradas casuales.
// NO es seguridad real: cualquier persona con DevTools puede ver los datos.
// Para acceso restringido por persona, usar el rol ENCARGADO.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "concavo-privacy";

type PrivacyCtx = {
  privacidad: boolean;
  togglePrivacidad: () => void;
};

const PrivacyContext = createContext<PrivacyCtx>({
  privacidad: false,
  togglePrivacidad: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacidad, setPrivacidad] = useState(false);

  // Leer estado guardado al montar
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setPrivacidad(true);
    } catch {}
  }, []);

  const togglePrivacidad = useCallback(() => {
    setPrivacidad((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  // Atajo de teclado Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        togglePrivacidad();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePrivacidad]);

  return (
    <PrivacyContext.Provider value={{ privacidad, togglePrivacidad }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacidadMontos(): PrivacyCtx {
  return useContext(PrivacyContext);
}
