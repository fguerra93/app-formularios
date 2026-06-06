import { NextRequest, NextResponse } from "next/server";
import { stockRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Libera reservas de stock de pedidos sin pagar más antiguos que el TTL
 * (Patrón 9). Protegido con CRON_SECRET. TTL configurable por query ?min=.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const min = parseInt(request.nextUrl.searchParams.get("min") || "30", 10);

  try {
    const liberados = await stockRepo.liberarVencidas(min);
    return NextResponse.json({ ok: true, liberados });
  } catch (e) {
    console.error("Error liberando reservas:", e);
    return NextResponse.json(
      { error: "Error al liberar reservas" },
      { status: 500 }
    );
  }
}
