import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  aprobacionesRepo,
  formulariosRepo,
  productosRepo,
} from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Read model de alertas accionables para el dashboard (Patrón 8):
 * aprobaciones pendientes, formularios sin revisar >24h, stock bajo.
 */
export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [aprobacionesPendientes, formulariosViejos, stockBajo] = await Promise.all([
      aprobacionesRepo.countPendientes(),
      formulariosRepo.countNuevosAntiguos(24),
      productosRepo.listStockBajo(5),
    ]);

    return NextResponse.json({
      aprobaciones_pendientes: aprobacionesPendientes,
      formularios_sin_revisar_24h: formulariosViejos,
      stock_bajo: stockBajo,
    });
  } catch (e) {
    console.error("Error dashboard alertas:", e);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}
