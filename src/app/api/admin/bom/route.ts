import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { bomRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const productoId = request.nextUrl.searchParams.get("producto_id");
  try {
    const data = productoId ? await bomRepo.listByProducto(productoId) : await bomRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error bom:", e);
    return NextResponse.json({ error: "Error al obtener BOM" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.producto_id || !body?.insumo_id) {
    return NextResponse.json({ error: "producto_id e insumo_id requeridos" }, { status: 400 });
  }
  try {
    const data = await bomRepo.upsert({
      producto_id: body.producto_id,
      insumo_id: body.insumo_id,
      cantidad: Number(body.cantidad) || 1,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error upsert bom:", e);
    return NextResponse.json({ error: "Error al guardar BOM" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  try {
    await bomRepo.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error delete bom:", e);
    return NextResponse.json({ error: "Error al eliminar BOM" }, { status: 500 });
  }
}
