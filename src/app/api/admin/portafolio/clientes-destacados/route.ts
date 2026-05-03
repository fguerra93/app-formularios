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
    .from("clientes_destacados")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error fetching clientes destacados:", error);
    return NextResponse.json({ error: "Error al obtener clientes destacados" }, { status: 500 });
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
    .from("clientes_destacados")
    .insert({
      nombre: body.nombre,
      logo_url: body.logo_url || null,
      url_web: body.url_web || null,
      orden: body.orden || 0,
      activo: body.activo !== undefined ? body.activo : true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating cliente destacado:", error);
    return NextResponse.json({ error: "Error al crear cliente destacado" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
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
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.url_web !== undefined) updateData.url_web = body.url_web;
  if (body.orden !== undefined) updateData.orden = body.orden;

  const { data, error } = await supabase
    .from("clientes_destacados")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cliente destacado:", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("clientes_destacados")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cliente destacado:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
