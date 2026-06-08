import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushSubscriptionsRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Guarda la suscripción Web Push del dispositivo del dueño/admin. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const sub = body?.subscription;
  const endpoint: string | undefined = sub?.endpoint;
  const p256dh: string | undefined = sub?.keys?.p256dh;
  const auth: string | undefined = sub?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  try {
    const data = await pushSubscriptionsRepo.upsert({
      endpoint,
      p256dh,
      auth,
      usuario: session.sub,
      preferencias: body?.preferencias,
    });
    return NextResponse.json({ ok: !!data });
  } catch (e) {
    console.error("Error subscribe push:", e);
    return NextResponse.json({ error: "Error al guardar suscripción" }, { status: 500 });
  }
}
