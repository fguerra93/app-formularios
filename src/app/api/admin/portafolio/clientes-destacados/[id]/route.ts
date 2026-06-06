import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { clientesDestacadosRepo } from "@/server/repositories";

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
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.url_web !== undefined) updateData.url_web = body.url_web;
  if (body.orden !== undefined) updateData.orden = body.orden;
  if (body.activo !== undefined) updateData.activo = body.activo;

  try {
    const data = await clientesDestacadosRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating cliente destacado:", e);
    return NextResponse.json({ error: "Error al actualizar cliente destacado" }, { status: 500 });
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
    await clientesDestacadosRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting cliente destacado:", e);
    return NextResponse.json({ error: "Error al eliminar cliente destacado" }, { status: 500 });
  }
}
