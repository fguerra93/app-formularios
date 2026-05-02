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
    .from("productos")
    .insert({
      nombre: body.nombre,
      slug,
      descripcion: body.descripcion || null,
      descripcion_corta: body.descripcion_corta || null,
      precio: body.precio,
      precio_oferta: body.precio_oferta || null,
      categoria_id: body.categoria_id || null,
      imagenes: body.imagenes || [],
      variantes: body.variantes || [],
      stock: body.stock || 0,
      stock_minimo: body.stock_minimo || 0,
      destacado: body.destacado || false,
      activo: body.activo !== undefined ? body.activo : true,
      tags: body.tags || [],
      peso_gramos: body.peso_gramos || null,
      sku: body.sku || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating producto:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
