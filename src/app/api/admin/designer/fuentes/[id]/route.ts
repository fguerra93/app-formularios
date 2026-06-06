import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { fuentesRepo } from "@/server/repositories";

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
  if (body.familia !== undefined) updateData.familia = body.familia;
  if (body.url !== undefined) updateData.url = body.url;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.popular !== undefined) updateData.popular = body.popular;
  if (body.activo !== undefined) updateData.activo = body.activo;

  try {
    const data = await fuentesRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating fuente:", e);
    return NextResponse.json(
      { error: "Error al actualizar fuente" },
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
    await fuentesRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting fuente:", e);
    return NextResponse.json(
      { error: "Error al eliminar fuente" },
      { status: 500 }
    );
  }
}
