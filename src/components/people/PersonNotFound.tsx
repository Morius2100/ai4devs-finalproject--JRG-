import Link from "next/link";

/**
 * Persona no encontrada (TKT-039, HU-14 CA-14.5): identificador mal formado
 * o sin ningún usuario asociado.
 */
export function PersonNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-extrabold">Persona no encontrada</h1>
      <p className="text-sm text-ink-muted">Puede que esta persona no exista.</p>
      <Link href="/personas" className="btn-primary">
        Volver a Personas
      </Link>
    </div>
  );
}
