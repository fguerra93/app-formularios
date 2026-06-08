import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { enviarPushATodos, vapidPublicKey } from "@/server/services/push";

export const dynamic = "force-dynamic";

/** Envía un push de prueba a todas las suscripciones del dueño. */
export async function POST() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!vapidPublicKey()) {
    return NextResponse.json(
      { error: "VAPID no configurado (define VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)" },
      { status: 400 }
    );
  }
  const r = await enviarPushATodos({
    title: "PrintUp — Prueba",
    body: "Las notificaciones del dueño están activas ✅",
    url: "/m",
    tag: "test",
  });
  return NextResponse.json({ ok: true, ...r });
}
