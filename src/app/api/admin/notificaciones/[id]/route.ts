import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { notificacionesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

// Marcar una notificación como leída.
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await notificacionesRepo.marcarLeida(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error marcando notificacion:", e);
    return NextResponse.json(
      { error: "Error al actualizar notificacion" },
      { status: 500 }
    );
  }
}
