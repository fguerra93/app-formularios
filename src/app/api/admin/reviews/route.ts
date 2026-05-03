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

  let query = supabase
    .from("reviews")
    .select("*, producto:productos(id, nombre, slug)")
    .order("created_at", { ascending: false });

  if (estado === "pendientes") {
    query = query.eq("aprobada", false);
  } else if (estado === "aprobadas") {
    query = query.eq("aprobada", true);
  } else if (estado === "rechazadas") {
    // Rechazadas se manejan como aprobada=false pero con un campo adicional
    // o como registros eliminados. Por consistencia, filtramos las no aprobadas.
    query = query.eq("aprobada", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Error al obtener reviews" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
