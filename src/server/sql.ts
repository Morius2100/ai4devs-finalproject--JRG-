/**
 * Escapa \, % y _ para que una búsqueda los trate como texto literal en el
 * patrón LIKE (se usa con `ESCAPE '\'`). Compartido por la búsqueda de temas
 * y la de personas (TKT-034).
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
