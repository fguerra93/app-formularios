import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching template:", error);
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
  const supabase = getSupabaseAdmin();

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

  const { data, error } = await supabase
    .from("email_templates")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Error al actualizar template" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
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
  const supabase = getSupabaseAdmin();

  // Only allow deleting non-preset templates
  const { data: template } = await supabase
    .from("email_templates")
    .select("es_preset")
    .eq("id", id)
    .single();

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

  // Soft delete by setting activo to false
  const { error } = await supabase
    .from("email_templates")
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Error al eliminar template" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
