import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { areasDisenoRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await areasDisenoRepo.listByProducto(id);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching areas de diseno:", e);
    return NextResponse.json(
      { error: "Error al obtener areas de diseno" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const data = await areasDisenoRepo.create({
      producto_id: id,
      nombre: body.nombre,
      mockup_url: body.mockup_url || null,
      area_x: body.area_x || 0,
      area_y: body.area_y || 0,
      area_width: body.area_width || 0,
      area_height: body.area_height || 0,
      dpi_recomendado: body.dpi_recomendado || 300,
      max_colores: body.max_colores || null,
      orden: body.orden || 0,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating area de diseno:", e);
    return NextResponse.json(
      { error: "Error al crear area de diseno" },
      { status: 500 }
    );
  }
}
