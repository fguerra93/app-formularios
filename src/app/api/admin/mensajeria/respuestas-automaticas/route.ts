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
    .from("respuestas_automaticas")
    .select("*")
    .order("prioridad", { ascending: false });

  if (error) {
    console.error("Error fetching respuestas automaticas:", error);
    return NextResponse.json(
      { error: "Error al obtener respuestas automaticas" },
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
    .from("respuestas_automaticas")
    .insert({
      nombre: body.nombre,
      canales: body.canales || [],
      palabras_clave: body.palabras_clave || [],
      respuesta: body.respuesta,
      tipo_respuesta: body.tipo_respuesta || "texto",
      media_url: body.media_url || null,
      activo: body.activo !== undefined ? body.activo : true,
      prioridad: body.prioridad || 0,
      horario_inicio: body.horario_inicio || null,
      horario_fin: body.horario_fin || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating respuesta automatica:", error);
    return NextResponse.json(
      { error: "Error al crear respuesta automatica" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
