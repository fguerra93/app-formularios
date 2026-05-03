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
    .from("campanas")
    .select("*")
    .order("created_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching campanas:", error);
    return NextResponse.json(
      { error: "Error al obtener campanas" },
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
  const { nombre, asunto, template_id, segmento } = body;

  if (!nombre || !asunto) {
    return NextResponse.json(
      { error: "Nombre y asunto son requeridos" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // If template_id is provided, fetch the template HTML
  let contenido_html: string | null = null;
  if (template_id) {
    const { data: template } = await supabase
      .from("email_templates")
      .select("contenido_html")
      .eq("id", template_id)
      .single();

    if (template) {
      contenido_html = template.contenido_html;
    }
  }

  const { data, error } = await supabase
    .from("campanas")
    .insert({
      nombre,
      asunto,
      template_id: template_id || null,
      contenido_html,
      segmento: segmento || { tipo: "todos" },
      estado: "borrador",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating campana:", error);
    return NextResponse.json(
      { error: "Error al crear campana" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
