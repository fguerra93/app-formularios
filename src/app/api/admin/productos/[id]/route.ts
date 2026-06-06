import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { productosRepo } from "@/server/repositories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await productosRepo.findByIdWithCategoria(id);

  if (!data) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const fields = [
    "nombre", "slug", "descripcion", "descripcion_corta", "precio",
    "precio_oferta", "categoria_id", "imagenes", "variantes", "stock",
    "stock_minimo", "destacado", "activo", "tags", "peso_gramos", "sku",
    "precios_cantidad", "ficha_tecnica_url",
    "precio_m2", "ancho_max_cm", "alto_max_cm", "area_min_cm2",
    "materiales_calculadora", "acabados_calculadora",
    "incluye", "usos", "caracteristicas", "especificaciones",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  try {
    const data = await productosRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating producto:", e);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await productosRepo.softDelete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting producto:", e);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
