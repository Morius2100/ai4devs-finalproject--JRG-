"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

/**
 * Buscador (TKT-014, TKT-038): de temas por defecto y reutilizable para
 * personas con otro texto; debounce de 300 ms, sincronizado con `?q=`
 * en la URL (texto vacío → sin `q`, vuelve a tendencias).
 */
export function SearchBar({
  initialValue,
  placeholder = "Buscar temas…",
  ariaLabel = "Buscar temas",
}: {
  initialValue: string;
  /** Texto de ayuda del campo; por defecto el de temas (TKT-038 lo reutiliza en Personas). */
  placeholder?: string;
  /** Nombre accesible del campo. */
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);
  const isFirstRender = useRef(true);

  // El servidor puede traer un `initialValue` distinto tras navegar
  // (botón atrás, enlace externo): mantiene el campo sincronizado.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const trimmed = value.trim();
      const query = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
      router.replace(`${pathname}${query}`);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);

  return (
    <div className="sticky top-14 z-10 rounded-b-3xl bg-brand-yellow px-4 pb-4 pt-1 shadow-sm">
      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          role="searchbox"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-12 w-full rounded-full border-2 border-transparent bg-white pl-12 pr-4 text-[#161617] placeholder:text-[#5f6166] focus:border-[#017963] focus:outline-none"
        />
      </div>
    </div>
  );
}
