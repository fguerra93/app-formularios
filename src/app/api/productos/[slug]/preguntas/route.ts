import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  // Find product by slug
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id")
    .eq("slug", slug)
    .single();

  if (prodError || !producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  // List public preguntas for this product
  const { data: preguntas, error } = await supabase
    .from("preguntas_producto")
    .select("*")
    .eq("producto_id", producto.id)
    .eq("publica", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching preguntas:", error);
    return NextResponse.json({ error: "Error al obtener preguntas" }, { status: 500 });
  }

  return NextResponse.json(preguntas || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  // Find product by slug
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id")
    .eq("slug", slug)
    .single();

  if (prodError || !producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  let body: {
    autor_nombre?: string;
    autor_email?: string;
    pregunta?: string;
    cliente_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { autor_nombre, autor_email, pregunta, cliente_id } = body;

  if (!autor_nombre || !autor_email || !pregunta) {
    return NextResponse.json(
      { error: "Nombre, email y pregunta son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("preguntas_producto")
    .insert({
      producto_id: producto.id,
      autor_nombre,
      autor_email,
      pregunta,
      cliente_id: cliente_id || null,
      publica: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating pregunta:", error);
    return NextResponse.json({ error: "Error al crear pregunta" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
