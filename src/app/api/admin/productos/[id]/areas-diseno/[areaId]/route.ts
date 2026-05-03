import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; areaId: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { areaId } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {};

  const fields = [
    "nombre", "mockup_url", "area_x", "area_y",
    "area_width", "area_height", "dpi_recomendado",
    "max_colores", "orden",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("producto_areas_diseno")
    .update(updateData)
    .eq("id", areaId)
    .select()
    .single();

  if (error) {
    console.error("Error updating area de diseno:", error);
    return NextResponse.json(
      { error: "Error al actualizar area de diseno" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; areaId: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { areaId } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("producto_areas_diseno")
    .delete()
    .eq("id", areaId);

  if (error) {
    console.error("Error deleting area de diseno:", error);
    return NextResponse.json(
      { error: "Error al eliminar area de diseno" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
