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
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.cliente_nombre !== undefined) updateData.cliente_nombre = body.cliente_nombre;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
  if (body.destacado !== undefined) updateData.destacado = body.destacado;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.orden !== undefined) updateData.orden = body.orden;

  const { data, error } = await supabase
    .from("portafolio_trabajos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating trabajo:", error);
    return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
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
    .from("portafolio_trabajos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting trabajo:", error);
    return NextResponse.json({ error: "Error al eliminar trabajo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
