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
  const categoria = searchParams.get("categoria");

  let query = supabase
    .from("email_templates")
    .select("*")
    .eq("activo", true)
    .order("updated_at", { ascending: false });

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Error al obtener templates" },
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
  const { nombre, descripcion, categoria, contenido_json, contenido_html } =
    body;

  if (!nombre) {
    return NextResponse.json(
      { error: "Nombre es requerido" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      nombre,
      descripcion: descripcion || null,
      categoria: categoria || null,
      contenido_json: contenido_json || null,
      contenido_html: contenido_html || null,
      es_preset: false,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Error al crear template" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
