import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { clipartRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function PUT(
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

  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.url !== undefined) updateData.url = body.url;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.activo !== undefined) updateData.activo = body.activo;

  try {
    const data = await clipartRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating clipart:", e);
    return NextResponse.json(
      { error: "Error al actualizar clipart" },
      { status: 500 }
    );
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
    await clipartRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting clipart:", e);
    return NextResponse.json(
      { error: "Error al eliminar clipart" },
      { status: 500 }
    );
  }
}
