import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { insumosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["sku", "nombre", "unidad", "activo"]) if (body[k] !== undefined) patch[k] = body[k];
  if (body.costo_actual !== undefined) patch.costo_actual = Number(body.costo_actual) || 0;
  try {
    return NextResponse.json(await insumosRepo.update(id, patch));
  } catch (e) {
    console.error("Error update insumo:", e);
    return NextResponse.json({ error: "Error al actualizar insumo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  try {
    await insumosRepo.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error delete insumo:", e);
    return NextResponse.json({ error: "Error al eliminar insumo" }, { status: 500 });
  }
}
