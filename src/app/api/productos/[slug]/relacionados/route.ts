import { NextRequest, NextResponse } from "next/server";
import { productosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const relacionados = await productosRepo.findRelacionados(slug);

  if (relacionados === null) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(relacionados);
}
