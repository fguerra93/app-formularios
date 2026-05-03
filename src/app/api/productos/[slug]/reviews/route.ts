import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Buscar producto por slug para obtener ID
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (prodError || !producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  // Lista reviews aprobadas del producto
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("producto_id", producto.id)
    .eq("aprobada", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Error al obtener reviews" }, { status: 500 });
  }

  return NextResponse.json(reviews || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Buscar producto por slug
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id")
    .eq("slug", slug)
    .eq("activo", true)
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
    rating?: number;
    titulo?: string;
    comentario?: string;
    fotos?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { autor_nombre, autor_email, rating, titulo, comentario, fotos } = body;

  if (!autor_nombre || !autor_email || !rating) {
    return NextResponse.json(
      { error: "Nombre, email y rating son requeridos" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating debe ser entre 1 y 5" },
      { status: 400 }
    );
  }

  // Verificar si el email tiene pedidos con este producto
  let verificada = false;
  try {
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, items")
      .ilike("cliente_email", autor_email)
      .in("estado", ["confirmado", "enviado", "entregado"]);

    if (pedidos && pedidos.length > 0) {
      // Buscar si alguno de los pedidos contiene este producto
      verificada = pedidos.some((pedido) => {
        if (!pedido.items || !Array.isArray(pedido.items)) return false;
        return pedido.items.some(
          (item: { producto_id?: string }) => item.producto_id === producto.id
        );
      });
    }
  } catch {
    // Si falla la verificacion, continuar con verificada = false
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      producto_id: producto.id,
      autor_nombre,
      autor_email,
      rating,
      titulo: titulo || null,
      comentario: comentario || null,
      fotos: fotos || [],
      verificada,
      aprobada: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Error al crear review" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
