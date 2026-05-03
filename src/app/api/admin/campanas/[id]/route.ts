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
    .from("campanas")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching campana:", error);
    return NextResponse.json(
      { error: "Campana no encontrada" },
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
  if (body.asunto !== undefined) updateData.asunto = body.asunto;
  if (body.template_id !== undefined) updateData.template_id = body.template_id;
  if (body.contenido_html !== undefined) updateData.contenido_html = body.contenido_html;
  if (body.segmento !== undefined) updateData.segmento = body.segmento;
  if (body.estado !== undefined) updateData.estado = body.estado;
  if (body.programada_para !== undefined) updateData.programada_para = body.programada_para;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("campanas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating campana:", error);
    return NextResponse.json(
      { error: "Error al actualizar campana" },
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

  // Only allow deleting campaigns in draft state
  const { data: campana } = await supabase
    .from("campanas")
    .select("estado")
    .eq("id", id)
    .single();

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  if (campana.estado !== "borrador") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar campanas en estado borrador" },
      { status: 400 }
    );
  }

  // Delete associated envios first
  await supabase.from("campana_envios").delete().eq("campana_id", id);

  const { error } = await supabase.from("campanas").delete().eq("id", id);

  if (error) {
    console.error("Error deleting campana:", error);
    return NextResponse.json(
      { error: "Error al eliminar campana" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
