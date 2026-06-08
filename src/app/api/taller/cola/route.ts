import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ordenesProduccionRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

const ROLES_TALLER = ["admin", "bodega"];

/**
 * Cola del taller (KDS). Devuelve las OP para la pantalla de comandas. El front
 * la consulta por polling corto. Misma cola para web/bot/manual (todo entra por
 * el pipeline pedido.pagado -> OP). Auth: rol bodega/taller o admin.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ROLES_TALLER.includes(session.rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const ordenes = await ordenesProduccionRepo.list();
    return NextResponse.json({ ordenes, now: new Date().toISOString() });
  } catch (e) {
    console.error("Error cola taller:", e);
    return NextResponse.json({ error: "Error al obtener la cola" }, { status: 500 });
  }
}
