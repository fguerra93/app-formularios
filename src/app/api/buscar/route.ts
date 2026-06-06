import { NextRequest, NextResponse } from "next/server";
import { productosRepo, categoriasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ productos: [], categorias: [] });
  }

  const term = q.trim();

  try {
    const productos = await productosRepo.searchProductos(term, 8);
    const categorias = await categoriasRepo.searchByNombre(term, 3);
    return NextResponse.json({ productos, categorias });
  } catch (e) {
    console.error("Error en la busqueda:", e);
    return NextResponse.json({ error: "Error en la busqueda" }, { status: 500 });
  }
}
