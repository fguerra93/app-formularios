import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { insumosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await insumosRepo.listAll());
  } catch (e) {
    console.error("Error insumos:", e);
    return NextResponse.json({ error: "Error al obtener insumos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  try {
    const data = await insumosRepo.create({
      sku: body.sku || null,
      nombre: body.nombre,
      unidad: body.unidad || "unidad",
      costo_actual: Number(body.costo_actual) || 0,
      activo: body.activo !== false,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creando insumo:", e);
    return NextResponse.json({ error: "Error al crear insumo" }, { status: 500 });
  }
}
