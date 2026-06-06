import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { reviewsRepo } from "@/server/repositories";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.aprobada !== undefined) updateData.aprobada = body.aprobada;

  try {
    const data = await reviewsRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating review:", e);
    return NextResponse.json({ error: "Error al actualizar review" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await reviewsRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting review:", e);
    return NextResponse.json({ error: "Error al eliminar review" }, { status: 500 });
  }
}
