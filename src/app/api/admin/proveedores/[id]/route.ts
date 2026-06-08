import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { proveedoresRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["nombre", "rut", "contacto", "telefono", "email", "notas", "activo"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  try {
    return NextResponse.json(await proveedoresRepo.update(id, patch));
  } catch (e) {
    console.error("Error update proveedor:", e);
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  try {
    await proveedoresRepo.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error delete proveedor:", e);
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 });
  }
}
