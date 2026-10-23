/** Estados de carga y error de las pantallas que cargan sus datos desde el cliente (TKT-045). */
export function ScreenLoading() {
  return (
    <p className="flex flex-1 items-center justify-center px-4 py-8 text-sm font-semibold text-ink-muted">
      Cargando…
    </p>
  );
}

export function ScreenError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="alert" className="text-sm text-red-600">
        {message}
      </p>
      <button type="button" onClick={onRetry} className="btn-primary">
        Reintentar
      </button>
    </div>
  );
}
