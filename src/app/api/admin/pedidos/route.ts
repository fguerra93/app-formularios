import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;

  const estado = searchParams.get("estado");
  const search = searchParams.get("search");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("pedidos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (estado && estado !== "todos") {
    query = query.eq("estado", estado);
  }
  if (search) {
    query = query.or(`cliente_nombre.ilike.%${search}%,cliente_email.ilike.%${search}%`);
  }
  if (desde) {
    query = query.gte("created_at", desde);
  }
  if (hasta) {
    query = query.lte("created_at", hasta);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching pedidos:", error);
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
