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
    .from("portafolio_trabajos")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error fetching portafolio:", error);
    return NextResponse.json({ error: "Error al obtener trabajos" }, { status: 500 });
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
    .from("portafolio_trabajos")
    .insert({
      titulo: body.titulo,
      descripcion: body.descripcion || null,
      cliente_nombre: body.cliente_nombre || null,
      categoria: body.categoria || null,
      imagenes: body.imagenes || [],
      destacado: body.destacado || false,
      activo: body.activo !== undefined ? body.activo : true,
      orden: body.orden || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating trabajo:", error);
    return NextResponse.json({ error: "Error al crear trabajo" }, { status: 500 });
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
  if (body.titulo !== undefined) updateData.titulo = body.titulo;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.cliente_nombre !== undefined) updateData.cliente_nombre = body.cliente_nombre;
  if (body.categoria !== undefined) updateData.categoria = body.categoria;
  if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
  if (body.destacado !== undefined) updateData.destacado = body.destacado;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.orden !== undefined) updateData.orden = body.orden;

  const { data, error } = await supabase
    .from("portafolio_trabajos")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating trabajo:", error);
    return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
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
    .from("portafolio_trabajos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting trabajo:", error);
    return NextResponse.json({ error: "Error al eliminar trabajo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
