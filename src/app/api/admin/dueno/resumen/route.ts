import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { aprobacionesRepo, statsRepo, ordenesProduccionRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Resumen de un vistazo para la app del dueño (Fase F6). Resiliente a tablas
 *  ausentes: cada bloque es best-effort. */
export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let pendientes = 0;
  try {
    pendientes = await aprobacionesRepo.countPendientes();
  } catch {
    /* tabla ausente */
  }

  let ventas_hoy = 0;
  let pedidos_hoy = 0;
  try {
    const r = await statsRepo.resumenDueno();
    ventas_hoy = r.ventas_hoy;
    pedidos_hoy = r.pedidos_hoy;
  } catch {
    /* tabla ausente */
  }

  const op: Record<string, number> = {};
  try {
    const ops = await ordenesProduccionRepo.list();
    for (const o of ops) {
      const e = String((o as Record<string, unknown>).estado || "");
      if (e && e !== "entregado") op[e] = (op[e] || 0) + 1;
    }
  } catch {
    /* tabla ausente */
  }

  return NextResponse.json({ pendientes, ventas_hoy, pedidos_hoy, op });
}
