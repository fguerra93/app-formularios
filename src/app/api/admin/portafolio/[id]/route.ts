import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { portafolioRepo } from "@/server/repositories";

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
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.cliente_nombre !== undefined) updateData.cliente_nombre = body.cliente_nombre;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
  if (body.destacado !== undefined) updateData.destacado = body.destacado;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.orden !== undefined) updateData.orden = body.orden;

  try {
    const data = await portafolioRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating trabajo:", e);
    return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
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
    await portafolioRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting trabajo:", e);
    return NextResponse.json({ error: "Error al eliminar trabajo" }, { status: 500 });
  }
}
