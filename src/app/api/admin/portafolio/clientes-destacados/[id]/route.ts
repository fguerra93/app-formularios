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
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.url_web !== undefined) updateData.url_web = body.url_web;
  if (body.orden !== undefined) updateData.orden = body.orden;
  if (body.activo !== undefined) updateData.activo = body.activo;

  const { data, error } = await supabase
    .from("clientes_destacados")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cliente destacado:", error);
    return NextResponse.json({ error: "Error al actualizar cliente destacado" }, { status: 500 });
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
    .from("clientes_destacados")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cliente destacado:", error);
    return NextResponse.json({ error: "Error al eliminar cliente destacado" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
