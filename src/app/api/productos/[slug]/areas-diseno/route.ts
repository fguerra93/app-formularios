import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Buscar producto por slug para obtener ID
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (prodError || !producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("producto_areas_diseno")
    .select("*")
    .eq("producto_id", producto.id)
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
