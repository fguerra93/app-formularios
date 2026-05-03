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

  // Get conversation
  const { data: conversacion, error: convError } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (convError || !conversacion) {
    return NextResponse.json(
      { error: "Conversacion no encontrada" },
      { status: 404 }
    );
  }

  // Get all messages ordered chronologically
  const { data: mensajes, error: msgError } = await supabase
    .from("mensajes")
    .select("*")
    .eq("conversacion_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("Error fetching mensajes:", msgError);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }

  // Reset unread count
  if (conversacion.no_leidos > 0) {
    const { error: updateError } = await supabase
      .from("conversaciones")
      .update({ no_leidos: 0, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Error resetting no_leidos:", updateError);
    }
  }

  return NextResponse.json({
    conversacion,
    mensajes: mensajes || [],
  });
}

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
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.estado !== undefined) updateData.estado = body.estado;
  if (body.etiquetas !== undefined) updateData.etiquetas = body.etiquetas;
  if (body.asignado_a !== undefined) updateData.asignado_a = body.asignado_a;

  const { data, error } = await supabase
    .from("conversaciones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating conversacion:", error);
    return NextResponse.json(
      { error: "Error al actualizar conversacion" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
