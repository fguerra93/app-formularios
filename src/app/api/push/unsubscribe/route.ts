import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushSubscriptionsRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });

  try {
    await pushSubscriptionsRepo.removeByEndpoint(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error unsubscribe push:", e);
    return NextResponse.json({ error: "Error al eliminar suscripción" }, { status: 500 });
  }
}
