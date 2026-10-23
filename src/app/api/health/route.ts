import { NextResponse } from "next/server";

/**
 * GET /api/health — ruta pública: la API está en marcha. No consulta la base
 * de datos. La app la sondea para salir sola de «Sin conexión» (TKT-047).
 */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
