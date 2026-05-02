import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const slug = body.slug || body.nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("categorias")
    .insert({
      nombre: body.nombre,
      slug,
      descripcion: body.descripcion || null,
      imagen_url: body.imagen_url || null,
      orden: body.orden || 0,
      activa: body.activa !== undefined ? body.activa : true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating categoria:", error);
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
