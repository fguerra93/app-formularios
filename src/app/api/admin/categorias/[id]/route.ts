import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { categoriasRepo } from "@/server/repositories";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
  if (body.imagen_url !== undefined) updateData.imagen_url = body.imagen_url;
  if (body.orden !== undefined) updateData.orden = body.orden;
  if (body.activa !== undefined) updateData.activa = body.activa;

  try {
    const data = await categoriasRepo.update(id, updateData);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating categoria:", e);
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Check if category has products
  const count = await categoriasRepo.countProductosActivos(id);
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una categoria con productos activos" },
      { status: 400 }
    );
  }

  try {
    await categoriasRepo.softDelete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting categoria:", e);
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }
}
