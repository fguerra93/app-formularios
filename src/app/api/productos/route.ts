import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = request.nextUrl;

  const categoria = searchParams.get("categoria");
  const destacado = searchParams.get("destacado");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "created_at:desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("productos")
    .select("*, categoria:categorias(*)", { count: "exact" })
    .eq("activo", true);

  if (categoria) {
    const { data: cat } = await supabase
      .from("categorias")
      .select("id")
      .eq("slug", categoria)
      .single();
    if (cat) {
      query = query.eq("categoria_id", cat.id);
    }
  }

  if (destacado === "true") {
    query = query.eq("destacado", true);
  }

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%,descripcion_corta.ilike.%${search}%`);
  }

  const [sortField, sortDir] = sort.split(":");
  const ascending = sortDir === "asc";

  if (sortField === "precio") {
    query = query.order("precio", { ascending });
  } else if (sortField === "nombre") {
    query = query.order("nombre", { ascending });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    productos: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
