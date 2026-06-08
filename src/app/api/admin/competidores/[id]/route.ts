import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { competidoresRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  try {
    await competidoresRepo.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error delete competidor:", e);
    return NextResponse.json({ error: "Error al eliminar competidor" }, { status: 500 });
  }
}
