import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;

  const categoria = searchParams.get("categoria");
  const destacado = searchParams.get("destacado");
  const limit = searchParams.get("limit");

  let query = supabase
    .from("trabajos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  if (destacado === "true") {
    query = query.eq("destacado", true);
  }

  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
