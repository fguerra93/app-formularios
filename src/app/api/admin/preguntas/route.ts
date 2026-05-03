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
  const estado = searchParams.get("estado");

  let query = supabase
    .from("preguntas_producto")
    .select("*, productos(nombre)")
    .order("created_at", { ascending: false });

  if (estado === "pendiente") {
    query = query.is("respuesta", null);
  } else if (estado === "respondida") {
    query = query.not("respuesta", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching preguntas:", error);
    return NextResponse.json({ error: "Error al obtener preguntas" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function PATCH(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (!body.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.respuesta !== undefined) {
    updateData.respuesta = body.respuesta;
    updateData.respuesta_at = new Date().toISOString();
  }
  if (body.publica !== undefined) updateData.publica = body.publica;

  const { data, error } = await supabase
    .from("preguntas_producto")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating pregunta:", error);
    return NextResponse.json({ error: "Error al actualizar pregunta" }, { status: 500 });
  }

  return NextResponse.json(data);
}
