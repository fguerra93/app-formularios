import { NextRequest, NextResponse } from "next/server";
import { gangSheetsRepo } from "@/server/repositories";
import { generarPliegoSvg, type PlacedItem } from "@/server/domain/gang-sheet";

export const dynamic = "force-dynamic";

/**
 * "Archivo listo" del pliego como SVG (vector, sin dependencias). Es lo que ve
 * el taller en la OP. La rasterización a PDF/PNG 300dpi queda como extensión.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = await gangSheetsRepo.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Pliego no encontrado" }, { status: 404 });
  }

  let items = row.items as unknown;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  const svg = generarPliegoSvg({
    ancho_pliego_cm: Number(row.ancho_pliego_cm) || 58,
    alto_pliego_cm: Number(row.alto_pliego_cm) || 0,
    items: (Array.isArray(items) ? items : []) as PlacedItem[],
    material: String(row.material || ""),
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
