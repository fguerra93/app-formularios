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
  const search = searchParams.get("search");

  let query = supabase
    .from("suscriptores")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching suscriptores:", error);
    return NextResponse.json({ error: "Error al obtener suscriptores" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
