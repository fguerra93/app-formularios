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
    .from("producto_areas_diseno")
    .select("*")
    .eq("producto_id", id)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error fetching areas de diseno:", error);
    return NextResponse.json(
      { error: "Error al obtener areas de diseno" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST(
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

  const { data, error } = await supabase
    .from("producto_areas_diseno")
    .insert({
      producto_id: id,
      nombre: body.nombre,
      mockup_url: body.mockup_url || null,
      area_x: body.area_x || 0,
      area_y: body.area_y || 0,
      area_width: body.area_width || 0,
      area_height: body.area_height || 0,
      dpi_recomendado: body.dpi_recomendado || 300,
      max_colores: body.max_colores || null,
      orden: body.orden || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating area de diseno:", error);
    return NextResponse.json(
      { error: "Error al crear area de diseno" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
