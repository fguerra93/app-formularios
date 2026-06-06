import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { mensajesRapidosRepo } from "@/server/repositories";

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
  if (body.titulo !== undefined) updateData.titulo = body.titulo;
  if (body.contenido !== undefined) updateData.contenido = body.contenido;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.atajo !== undefined) updateData.atajo = body.atajo;
  if (body.canales !== undefined) updateData.canales = body.canales;

  try {
    const data = await mensajesRapidosRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating mensaje rapido:", e);
    return NextResponse.json(
      { error: "Error al actualizar mensaje rapido" },
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
    await mensajesRapidosRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting mensaje rapido:", e);
    return NextResponse.json(
      { error: "Error al eliminar mensaje rapido" },
      { status: 500 }
    );
  }
}
