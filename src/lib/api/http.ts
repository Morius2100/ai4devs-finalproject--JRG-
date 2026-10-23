import type { ErrorBody } from "@/server/http";

/** Error de una respuesta no-2xx de la API, con el `status` y `code` HTTP (TKT-021). */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    code?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error.message ?? "Ha ocurrido un error inesperado",
      body?.error.code,
      body?.error.fieldErrors,
    );
  }
  return (await response.json()) as T;
}
