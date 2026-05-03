import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("mensajes_rapidos")
    .select("*")
    .order("categoria", { ascending: true })
    .order("titulo", { ascending: true });

  if (error) {
    console.error("Error fetching mensajes rapidos:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes rapidos" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("mensajes_rapidos")
    .insert({
      titulo: body.titulo,
      contenido: body.contenido,
      categoria: body.categoria || null,
      atajo: body.atajo || null,
      canales: body.canales || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating mensaje rapido:", error);
    return NextResponse.json(
      { error: "Error al crear mensaje rapido" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
