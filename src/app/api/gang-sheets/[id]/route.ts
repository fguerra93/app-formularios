import { NextRequest, NextResponse } from "next/server";
import { gangSheetsRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const row = await gangSheetsRepo.findById(id);
    if (!row) {
      return NextResponse.json({ error: "Pliego no encontrado" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e) {
    console.error("Error obteniendo gang sheet:", e);
    return NextResponse.json({ error: "Error al obtener el pliego" }, { status: 500 });
  }
}
