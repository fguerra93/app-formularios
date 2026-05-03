import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;
  const canal = searchParams.get("canal");
  const estado = searchParams.get("estado");
  const etiqueta = searchParams.get("etiqueta");
  const busqueda = searchParams.get("busqueda");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("conversaciones")
    .select("*", { count: "exact" })
    .order("ultimo_mensaje_at", { ascending: false });

  if (canal) {
    query = query.eq("canal", canal);
  }

  if (estado) {
    query = query.eq("estado", estado);
  }

  if (etiqueta) {
    query = query.contains("etiquetas", [etiqueta]);
  }

  if (busqueda) {
    query = query.or(
      `contacto_nombre.ilike.%${busqueda}%,contacto_telefono.ilike.%${busqueda}%,contacto_username.ilike.%${busqueda}%`
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data: conversaciones, count, error } = await query;

  if (error) {
    console.error("Error fetching conversaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversaciones: conversaciones || [],
    total: count || 0,
  });
}
