import { NextRequest, NextResponse } from "next/server";
import { productosRepo, reviewsRepo, pedidosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Buscar producto por slug para obtener ID
  const producto = await productosRepo.findActivoBySlug(slug);

  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  try {
    const reviews = await reviewsRepo.listAprobadasByProducto(producto.id);
    return NextResponse.json(reviews);
  } catch (e) {
    console.error("Error fetching reviews:", e);
    return NextResponse.json({ error: "Error al obtener reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Buscar producto por slug
  const producto = await productosRepo.findActivoBySlug(slug);

  if (!producto) {
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
    const pedidos = await pedidosRepo.listParaVerificarReview(autor_email);

    if (pedidos.length > 0) {
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

  try {
    const data = await reviewsRepo.createPublica({
      producto_id: producto.id,
      autor_nombre,
      autor_email,
      rating,
      titulo: titulo || null,
      comentario: comentario || null,
      fotos: fotos || [],
      verificada,
      aprobada: false,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating review:", e);
    return NextResponse.json({ error: "Error al crear review" }, { status: 500 });
  }
}
