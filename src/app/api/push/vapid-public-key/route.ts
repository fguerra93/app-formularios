import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/server/services/push";

export const dynamic = "force-dynamic";

/** Clave pública VAPID para que el navegador cree la suscripción Web Push. */
export async function GET() {
  return NextResponse.json({ key: vapidPublicKey() });
}
