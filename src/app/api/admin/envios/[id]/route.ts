import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  if (body.comunas !== undefined) updateData.comunas = body.comunas;
  if (body.precio !== undefined) updateData.precio = body.precio;
  if (body.envio_gratis_desde !== undefined) updateData.envio_gratis_desde = body.envio_gratis_desde;
  if (body.activa !== undefined) updateData.activa = body.activa;
  if (body.dias_despacho !== undefined) updateData.dias_despacho = body.dias_despacho;
  if (body.horario !== undefined) updateData.horario = body.horario;

  const { data, error } = await supabase
    .from("zonas_envio")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating zona:", error);
    return NextResponse.json({ error: "Error al actualizar zona" }, { status: 500 });
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
    .from("zonas_envio")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting zona:", error);
    return NextResponse.json({ error: "Error al eliminar zona" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
