import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { templatesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await templatesRepo.findById(id);

  if (!data) {
    return NextResponse.json(
      { error: "Template no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

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
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.contenido_json !== undefined)
    updateData.contenido_json = body.contenido_json;
  if (body.contenido_html !== undefined)
    updateData.contenido_html = body.contenido_html;
  if (body.thumbnail_url !== undefined)
    updateData.thumbnail_url = body.thumbnail_url;
  if (body.activo !== undefined) updateData.activo = body.activo;

  updateData.updated_at = new Date().toISOString();

  try {
    const data = await templatesRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating template:", e);
    return NextResponse.json(
      { error: "Error al actualizar template" },
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

  // Only allow deleting non-preset templates
  const template = await templatesRepo.findEsPreset(id);

  if (!template) {
    return NextResponse.json(
      { error: "Template no encontrado" },
      { status: 404 }
    );
  }

  if (template.es_preset) {
    return NextResponse.json(
      { error: "No se pueden eliminar templates predeterminados" },
      { status: 400 }
    );
  }

  try {
    // Soft delete by setting activo to false
    await templatesRepo.softDelete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting template:", e);
    return NextResponse.json(
      { error: "Error al eliminar template" },
      { status: 500 }
    );
  }
}
