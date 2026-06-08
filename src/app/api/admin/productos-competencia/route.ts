import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { productosCompetenciaRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await productosCompetenciaRepo.listAll());
  } catch (e) {
    console.error("Error mapeos:", e);
    return NextResponse.json({ error: "Error al obtener mapeos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.competidor_id || !body?.producto_id) {
    return NextResponse.json({ error: "competidor_id y producto_id requeridos" }, { status: 400 });
  }
  try {
    const data = await productosCompetenciaRepo.create({
      competidor_id: body.competidor_id,
      producto_id: body.producto_id,
      nombre_externo: body.nombre_externo || null,
      url: body.url || null,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creando mapeo:", e);
    return NextResponse.json({ error: "Error al crear mapeo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  try {
    await productosCompetenciaRepo.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error delete mapeo:", e);
    return NextResponse.json({ error: "Error al eliminar mapeo" }, { status: 500 });
  }
}
