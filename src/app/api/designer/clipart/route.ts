import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");

  let query = supabase
    .from("clipart")
    .select("*")
    .eq("activo", true)
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching clipart:", error);
    return NextResponse.json(
      { error: "Error al obtener clipart" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
