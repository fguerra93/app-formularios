import { NextRequest, NextResponse } from "next/server";
import { productosRepo, areasDisenoRepo } from "@/server/repositories";

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
    const data = await areasDisenoRepo.listByProducto(producto.id);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching areas de diseno:", e);
    return NextResponse.json(
      { error: "Error al obtener areas de diseno" },
      { status: 500 }
    );
  }
}
