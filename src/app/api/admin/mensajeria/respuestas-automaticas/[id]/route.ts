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
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.canales !== undefined) updateData.canales = body.canales;
  if (body.palabras_clave !== undefined)
    updateData.palabras_clave = body.palabras_clave;
  if (body.respuesta !== undefined) updateData.respuesta = body.respuesta;
  if (body.tipo_respuesta !== undefined)
    updateData.tipo_respuesta = body.tipo_respuesta;
  if (body.media_url !== undefined) updateData.media_url = body.media_url;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.prioridad !== undefined) updateData.prioridad = body.prioridad;
  if (body.horario_inicio !== undefined)
    updateData.horario_inicio = body.horario_inicio;
  if (body.horario_fin !== undefined)
    updateData.horario_fin = body.horario_fin;

  const { data, error } = await supabase
    .from("respuestas_automaticas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating respuesta automatica:", error);
    return NextResponse.json(
      { error: "Error al actualizar respuesta automatica" },
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
    .from("respuestas_automaticas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting respuesta automatica:", error);
    return NextResponse.json(
      { error: "Error al eliminar respuesta automatica" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
