import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("disenos_cliente")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Diseno no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  let body: {
    diseno_json?: unknown;
    preview_url?: string;
    nombre?: string;
    variante?: unknown;
    estado?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.diseno_json !== undefined) updateData.diseno_json = body.diseno_json;
  if (body.preview_url !== undefined) updateData.preview_url = body.preview_url;
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.variante !== undefined) updateData.variante = body.variante;
  if (body.estado !== undefined) updateData.estado = body.estado;

  const { data, error } = await supabase
    .from("disenos_cliente")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating diseno:", error);
    return NextResponse.json(
      { error: "Error al actualizar diseno" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
