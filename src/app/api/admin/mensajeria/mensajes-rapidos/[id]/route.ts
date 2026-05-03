import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {};
  if (body.titulo !== undefined) updateData.titulo = body.titulo;
  if (body.contenido !== undefined) updateData.contenido = body.contenido;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.atajo !== undefined) updateData.atajo = body.atajo;
  if (body.canales !== undefined) updateData.canales = body.canales;

  const { data, error } = await supabase
    .from("mensajes_rapidos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating mensaje rapido:", error);
    return NextResponse.json(
      { error: "Error al actualizar mensaje rapido" },
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

  const { error } = await supabase
    .from("mensajes_rapidos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting mensaje rapido:", error);
    return NextResponse.json(
      { error: "Error al eliminar mensaje rapido" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
