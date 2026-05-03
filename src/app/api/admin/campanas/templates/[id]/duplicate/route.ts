import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Get original template
  const { data: original, error: fetchError } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) {
    return NextResponse.json(
      { error: "Template no encontrado" },
      { status: 404 }
    );
  }

  // Create copy
  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      nombre: `Copia de ${original.nombre}`,
      descripcion: original.descripcion,
      categoria: original.categoria,
      contenido_json: original.contenido_json,
      contenido_html: original.contenido_html,
      thumbnail_url: original.thumbnail_url,
      es_preset: false,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Error al duplicar template" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
