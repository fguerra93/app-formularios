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
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.imagen_url !== undefined) updateData.imagen_url = body.imagen_url;
  if (body.orden !== undefined) updateData.orden = body.orden;
  if (body.activa !== undefined) updateData.activa = body.activa;

  const { data, error } = await supabase
    .from("categorias")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating categoria:", error);
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
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

  // Check if category has products
  const { count } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("categoria_id", id)
    .eq("activo", true);

  if (count && count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una categoria con productos activos" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("categorias")
    .update({ activa: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting categoria:", error);
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
