import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ productos: [], categorias: [] });
  }

  const searchTerm = q.trim();

  // Buscar productos: nombre, descripcion, tags
  const { data: productos, error: prodError } = await supabase
    .from("productos")
    .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id, categorias(slug)")
    .eq("activo", true)
    .or(
      `nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
    )
    .order("destacado", { ascending: false })
    .limit(8);

  if (prodError) {
    console.error("Error searching productos:", prodError);
    return NextResponse.json({ error: "Error en la busqueda" }, { status: 500 });
  }

  // Mapear productos para incluir imagen y categoria_slug
  const productosResult = (productos || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    precio: p.precio,
    precio_oferta: p.precio_oferta,
    imagen: Array.isArray(p.imagenes) && p.imagenes.length > 0 ? p.imagenes[0] : null,
    categoria_slug: p.categorias
      ? (p.categorias as unknown as { slug: string }).slug
      : null,
  }));

  // Buscar categorias que matchean
  const { data: categorias, error: catError } = await supabase
    .from("categorias")
    .select("id, nombre, slug, imagen_url")
    .eq("activa", true)
    .ilike("nombre", `%${searchTerm}%`)
    .limit(3);

  if (catError) {
    console.error("Error searching categorias:", catError);
  }

  return NextResponse.json({
    productos: productosResult,
    categorias: categorias || [],
  });
}
