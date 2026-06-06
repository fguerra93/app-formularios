import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { areasDisenoRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; areaId: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { areaId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};

  const fields = [
    "nombre", "mockup_url", "area_x", "area_y",
    "area_width", "area_height", "dpi_recomendado",
    "max_colores", "orden",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  try {
    const data = await areasDisenoRepo.update(areaId, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating area de diseno:", e);
    return NextResponse.json(
      { error: "Error al actualizar area de diseno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; areaId: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { areaId } = await params;

  try {
    await areasDisenoRepo.remove(areaId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting area de diseno:", e);
    return NextResponse.json(
      { error: "Error al eliminar area de diseno" },
      { status: 500 }
    );
  }
}
