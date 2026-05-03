import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("fuentes_diseno")
    .select("*")
    .eq("activo", true)
    .order("popular", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching fuentes:", error);
    return NextResponse.json(
      { error: "Error al obtener fuentes" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
