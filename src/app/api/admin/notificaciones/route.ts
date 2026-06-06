import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { notificacionesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const [notificaciones, no_leidas] = await Promise.all([
      notificacionesRepo.listRecientes(50),
      notificacionesRepo.countNoLeidas(),
    ]);
    return NextResponse.json({ notificaciones, no_leidas });
  } catch (e) {
    console.error("Error fetching notificaciones:", e);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// Marcar todas como leídas.
export async function PATCH() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await notificacionesRepo.marcarTodasLeidas();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error marcando notificaciones:", e);
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
}
