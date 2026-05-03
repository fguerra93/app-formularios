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
  if (body.familia !== undefined) updateData.familia = body.familia;
  if (body.url !== undefined) updateData.url = body.url;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.popular !== undefined) updateData.popular = body.popular;
  if (body.activo !== undefined) updateData.activo = body.activo;

  const { data, error } = await supabase
    .from("fuentes_diseno")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating fuente:", error);
    return NextResponse.json(
      { error: "Error al actualizar fuente" },
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
    .from("fuentes_diseno")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting fuente:", error);
    return NextResponse.json(
      { error: "Error al eliminar fuente" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
