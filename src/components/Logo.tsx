// Geometría del símbolo; `src/app/icon.svg` la repite y debe mantenerse igual.
export const MARK_VIEWBOX = "0 0 60 64";
export const MARK_RING = { cx: 30, cy: 28, r: 22, strokeWidth: 11 };
export const MARK_TAIL = "M12 42L5 60L26 48z";

/** Símbolo de Opina: la "O" como anillo con cola de bocadillo. Usa `currentColor`. */
export function OpinaMark({ className = "h-[1.05em] w-[0.98em]" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox={MARK_VIEWBOX} className={className}>
      <circle
        cx={MARK_RING.cx}
        cy={MARK_RING.cy}
        r={MARK_RING.r}
        fill="none"
        stroke="currentColor"
        strokeWidth={MARK_RING.strokeWidth}
      />
      <path d={MARK_TAIL} fill="currentColor" />
    </svg>
  );
}

/**
 * Logotipo completo: símbolo + "pina", leído como "Opina". Escala con el
 * tamaño de fuente del contenedor; el nombre accesible lo pone quien lo usa.
 */
export function OpinaLogo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center font-extrabold leading-none tracking-tight ${className}`}
    >
      <OpinaMark />
      <span className="-ml-0.5">pina</span>
    </span>
  );
}
